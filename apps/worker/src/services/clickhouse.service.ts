import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ClickHouseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  protocol: 'http' | 'https';
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private readonly config: ClickHouseConfig;
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      host: this.configService.get<string>('CLICKHOUSE_HOST', 'localhost'),
      port: this.configService.get<number>('CLICKHOUSE_PORT', 8123),
      database: this.configService.get<string>('CLICKHOUSE_DATABASE', 'trackpro'),
      username: this.configService.get<string>('CLICKHOUSE_USER', 'default'),
      password: this.configService.get<string>('CLICKHOUSE_PASSWORD', ''),
      protocol: this.configService.get<'http' | 'https'>('CLICKHOUSE_PROTOCOL', 'http'),
    };

    this.baseUrl = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
  }

  async onModuleInit() {
    try {
      await this.query('SELECT 1');
      this.logger.log('ClickHouse connected');
    } catch (error) {
      this.logger.error('Failed to connect to ClickHouse', error);
    }
  }

  async query<T = unknown>(sql: string): Promise<T> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('database', this.config.database);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-ClickHouse-User': this.config.username,
        'X-ClickHouse-Key': this.config.password,
      },
      body: sql,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ClickHouse error: ${text}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  async insertMetaDeliveryLog(data: {
    event_id: string;
    project_id: string;
    status: string;
    attempts: number;
    last_error?: string;
  }): Promise<void> {
    const sql = `INSERT INTO meta_delivery_log (event_id, project_id, status, attempts, last_error, updated_at)
      VALUES (
        '${data.event_id}',
        '${data.project_id}',
        '${data.status}',
        ${data.attempts},
        '${data.last_error || ''}',
        ${Math.floor(Date.now() / 1000)}
      )`;

    await this.query(sql);
  }

  async deleteOldEvents(projectId: string, retentionDays: number): Promise<number> {
    const cutoffTime = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;

    const sql = `ALTER TABLE events_raw DELETE WHERE project_id = '${this.escape(projectId)}' AND event_time < ${cutoffTime}`;
    await this.query(sql);

    // Return approximate count (ClickHouse async delete doesn't return count)
    return 0;
  }

  async deleteOldMetaDeliveryLogs(projectId: string, retentionDays: number): Promise<void> {
    const cutoffTime = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;

    const sql = `ALTER TABLE meta_delivery_log DELETE WHERE project_id = '${this.escape(projectId)}' AND updated_at < ${cutoffTime}`;
    await this.query(sql);
  }

  async deleteUserData(projectId: string, anonymousId: string): Promise<void> {
    // Delete all events for this user
    const deleteEventsSql = `ALTER TABLE events_raw DELETE WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'`;
    await this.query(deleteEventsSql);

    this.logger.log({
      message: 'User data deleted from ClickHouse',
      projectId,
      anonymousId,
    });
  }

  async anonymizeUserData(projectId: string, anonymousId: string): Promise<void> {
    // Anonymize by replacing PII with hashed values
    const anonId = `anon_${Date.now()}`;

    const updateSql = `
      ALTER TABLE events_raw UPDATE
        anonymous_id = '${anonId}',
        user_id = '',
        ip = '',
        user_agent = 'anonymized'
      WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'
    `;
    await this.query(updateSql);

    this.logger.log({
      message: 'User data anonymized in ClickHouse',
      projectId,
      originalAnonymousId: anonymousId,
      newAnonymousId: anonId,
    });
  }

  private escape(value: string): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }

  async getEventsForExport(
    projectId: string,
    startDate: string,
    endDate: string,
    limit: number,
    offset: number,
  ): Promise<unknown[]> {
    const sql = `
      SELECT *
      FROM events_raw
      WHERE project_id = '${projectId}'
        AND toDate(toDateTime(event_time)) BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY event_time DESC
      LIMIT ${limit} OFFSET ${offset}
      FORMAT JSON
    `;

    const result = await this.query<{ data: unknown[] }>(sql);
    return result.data || [];
  }

  async getAggregatedEventsForExport(
    projectId: string,
    startDate: string,
    endDate: string,
  ): Promise<unknown[]> {
    const sql = `
      SELECT
        date,
        event_name,
        event_count,
        unique_users,
        unique_sessions
      FROM events_agg_daily
      WHERE project_id = '${this.escape(projectId)}'
        AND date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY date DESC, event_name
      FORMAT JSON
    `;

    try {
      const result = await this.query<{ data: unknown[] }>(sql);
      return result.data || [];
    } catch {
      // Table might not exist yet
      return [];
    }
  }

  async buildDailyAggregates(projectId: string, date: string): Promise<void> {
    // Aggregate events by day
    const sql = `
      INSERT INTO events_agg_daily
      SELECT
        '${projectId}' as project_id,
        toDate('${date}') as date,
        event_name,
        count() as event_count,
        uniqExact(anonymous_id) as unique_users,
        uniqExact(session_id) as unique_sessions
      FROM events_raw
      WHERE project_id = '${projectId}'
        AND toDate(toDateTime(event_time)) = '${date}'
      GROUP BY event_name
    `;

    await this.query(sql);
  }
}
