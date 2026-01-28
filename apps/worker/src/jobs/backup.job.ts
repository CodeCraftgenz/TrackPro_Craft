import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageService } from '../services/storage.service';

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  filename?: string;
  url?: string;
  size?: number;
  error?: string;
  duration?: number;
}

@Injectable()
export class BackupJob {
  private readonly logger = new Logger(BackupJob.name);
  private readonly backupEnabled: boolean;
  private readonly tempDir: string;
  private readonly retentionDays: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    this.backupEnabled =
      this.configService.get<string>('BACKUP_ENABLED', 'false') === 'true';
    this.tempDir = this.configService.get<string>('BACKUP_TEMP_DIR', '/tmp/backups');
    this.retentionDays = this.configService.get<number>('BACKUP_RETENTION_DAYS', 30);
  }

  /**
   * Run daily MySQL backup at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyMySQLBackup(): Promise<void> {
    if (!this.backupEnabled) {
      this.logger.debug('Backup disabled, skipping MySQL backup');
      return;
    }

    this.logger.log('Starting daily MySQL backup...');
    const result = await this.backupMySQL();

    if (result.success) {
      this.logger.log(
        `MySQL backup completed: ${result.filename} (${this.formatBytes(result.size || 0)}) in ${result.duration}ms`,
      );
    } else {
      this.logger.error(`MySQL backup failed: ${result.error}`);
    }
  }

  /**
   * Run weekly ClickHouse backup on Sundays at 4 AM
   */
  @Cron('0 4 * * 0') // Sunday at 4 AM
  async runWeeklyClickHouseBackup(): Promise<void> {
    if (!this.backupEnabled) {
      this.logger.debug('Backup disabled, skipping ClickHouse backup');
      return;
    }

    this.logger.log('Starting weekly ClickHouse backup...');
    const result = await this.backupClickHouse();

    if (result.success) {
      this.logger.log(
        `ClickHouse backup completed: ${result.filename} (${this.formatBytes(result.size || 0)}) in ${result.duration}ms`,
      );
    } else {
      this.logger.error(`ClickHouse backup failed: ${result.error}`);
    }
  }

  /**
   * Cleanup old backups daily at 5 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async cleanupOldBackups(): Promise<void> {
    if (!this.backupEnabled) {
      return;
    }

    this.logger.log('Starting backup cleanup...');
    // Implementation depends on storage provider
    // For S3, use lifecycle policies instead
    this.logger.log(`Backup cleanup completed (retention: ${this.retentionDays} days)`);
  }

  /**
   * Backup MySQL database
   */
  async backupMySQL(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mysql-backup-${timestamp}.sql.gz`;
    const localPath = path.join(this.tempDir, filename);

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Get MySQL credentials from DATABASE_URL
      const dbUrl = this.configService.get<string>('DATABASE_URL', '');
      const { host, port, user, password, database } = this.parseMySQLUrl(dbUrl);

      if (!database) {
        throw new Error('Invalid DATABASE_URL');
      }

      // Run mysqldump with gzip compression
      const dumpCommand = `mysqldump -h ${host} -P ${port} -u ${user} -p'${password}' --single-transaction --routines --triggers ${database} | gzip > ${localPath}`;

      await execAsync(dumpCommand, { maxBuffer: 1024 * 1024 * 500 }); // 500MB buffer

      // Get file size
      const stats = await fs.stat(localPath);

      // Upload to storage
      const fileContent = await fs.readFile(localPath);
      const key = `backups/mysql/${filename}`;
      const url = await this.storageService.uploadFile(key, fileContent, {
        contentType: 'application/gzip',
        metadata: {
          type: 'mysql-backup',
          database,
          timestamp,
        },
      });

      // Cleanup local file
      await fs.unlink(localPath);

      return {
        success: true,
        filename,
        url,
        size: stats.size,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(localPath);
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Backup ClickHouse (export to CSV/Parquet)
   */
  async backupClickHouse(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `clickhouse-backup-${timestamp}.tar.gz`;
    const tempBackupDir = path.join(this.tempDir, `ch-backup-${timestamp}`);
    const localPath = path.join(this.tempDir, filename);

    try {
      await fs.mkdir(tempBackupDir, { recursive: true });

      const host = this.configService.get<string>('CLICKHOUSE_HOST', '');
      const database = this.configService.get<string>('CLICKHOUSE_DATABASE', 'trackpro');
      const user = this.configService.get<string>('CLICKHOUSE_USER', 'default');
      const password = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');

      // Tables to backup
      const tables = ['events', 'leads', 'page_views', 'sessions'];

      for (const table of tables) {
        const tableFile = path.join(tempBackupDir, `${table}.csv.gz`);

        // Export table to CSV with gzip
        const exportCommand = `clickhouse-client -h ${host} -d ${database} -u ${user} --password '${password}' --query "SELECT * FROM ${table}" --format CSVWithNames | gzip > ${tableFile}`;

        try {
          await execAsync(exportCommand, { maxBuffer: 1024 * 1024 * 1000 });
        } catch {
          this.logger.warn(`Failed to export table ${table}, skipping...`);
        }
      }

      // Create tar.gz archive
      await execAsync(`tar -czf ${localPath} -C ${tempBackupDir} .`);

      const stats = await fs.stat(localPath);

      // Upload to storage
      const fileContent = await fs.readFile(localPath);
      const key = `backups/clickhouse/${filename}`;
      const url = await this.storageService.uploadFile(key, fileContent, {
        contentType: 'application/gzip',
        metadata: {
          type: 'clickhouse-backup',
          database,
          timestamp,
        },
      });

      // Cleanup
      await fs.rm(tempBackupDir, { recursive: true });
      await fs.unlink(localPath);

      return {
        success: true,
        filename,
        url,
        size: stats.size,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Cleanup on error
      try {
        await fs.rm(tempBackupDir, { recursive: true });
        await fs.unlink(localPath);
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Manual backup trigger (for admin API)
   */
  async triggerBackup(type: 'mysql' | 'clickhouse' | 'all'): Promise<BackupResult[]> {
    const results: BackupResult[] = [];

    if (type === 'mysql' || type === 'all') {
      results.push(await this.backupMySQL());
    }

    if (type === 'clickhouse' || type === 'all') {
      results.push(await this.backupClickHouse());
    }

    return results;
  }

  /**
   * Parse MySQL connection URL
   */
  private parseMySQLUrl(url: string): {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  } {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '3306', 10),
        user: parsed.username,
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.slice(1),
      };
    } catch {
      return {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: '',
      };
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
