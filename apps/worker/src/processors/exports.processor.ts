import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

import { ClickHouseService } from '../services/clickhouse.service';
import { PrismaService } from '../services/prisma.service';
import { StorageService } from '../services/storage.service';
import { REDIS_CONNECTION } from '../services/redis.module';

interface ExportJobData {
  exportJobId: string;
  projectId: string;
  type: string;
  params: {
    startDate?: string;
    endDate?: string;
    eventNames?: string[];
    format?: 'json' | 'csv';
  };
}

@Injectable()
export class ExportsProcessor implements OnModuleInit {
  private readonly logger = new Logger(ExportsProcessor.name);
  private worker!: Worker<ExportJobData>;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: IORedis,
    private readonly clickhouse: ClickHouseService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<ExportJobData>(
      'exports',
      async (job: Job<ExportJobData>) => {
        return this.process(job);
      },
      {
        connection: this.redis as unknown as ConnectionOptions,
        concurrency: 2,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Export job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Export job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Exports processor started');
  }

  private async process(job: Job<ExportJobData>): Promise<void> {
    const { exportJobId, projectId, type, params } = job.data;

    this.logger.log({
      message: 'Processing export job',
      jobId: job.id,
      exportJobId,
      projectId,
      type,
    });

    try {
      // Update status to processing
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: { status: 'PROCESSING' },
      });

      // Generate export based on type
      let fileUrl: string;

      switch (type) {
        case 'EVENTS_RAW':
          fileUrl = await this.exportEventsRaw(projectId, params);
          break;
        case 'EVENTS_AGG':
          fileUrl = await this.exportEventsAgg(projectId, params);
          break;
        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      // Update status to completed
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          finishedAt: new Date(),
        },
      });

      this.logger.log({
        message: 'Export completed',
        exportJobId,
        fileUrl,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update status to failed
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'FAILED',
          error: errorMessage,
          finishedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private async exportEventsRaw(
    projectId: string,
    params: { startDate?: string; endDate?: string; eventNames?: string[]; format?: 'json' | 'csv' },
  ): Promise<string> {
    const startDate = params.startDate || this.getDefaultStartDate();
    const endDate = params.endDate || this.getDefaultEndDate();
    const format = params.format || 'json';

    // Fetch events in batches
    const batchSize = 10000;
    let offset = 0;
    const allEvents: unknown[] = [];

    while (true) {
      const events = await this.clickhouse.getEventsForExport(
        projectId,
        startDate,
        endDate,
        batchSize,
        offset,
      );

      if (events.length === 0) break;

      allEvents.push(...events);
      offset += batchSize;

      // Safety limit - max 1 million events
      if (allEvents.length >= 1000000) {
        this.logger.warn(`Export limit reached for project ${projectId}`);
        break;
      }

      if (events.length < batchSize) break;
    }

    // Generate file content
    let content: string;
    let contentType: string;
    const timestamp = Date.now();

    if (format === 'csv') {
      content = this.convertToCSV(allEvents);
      contentType = 'text/csv';
    } else {
      content = JSON.stringify(allEvents, null, 2);
      contentType = 'application/json';
    }

    // Upload to storage
    const fileName = `${projectId}/events_${startDate}_${endDate}_${timestamp}.${format}`;
    const fileUrl = await this.storage.uploadFile(fileName, content, { contentType });

    this.logger.log({
      message: 'Events exported',
      projectId,
      eventCount: allEvents.length,
      format,
      fileUrl,
    });

    return fileUrl;
  }

  private async exportEventsAgg(
    projectId: string,
    params: { startDate?: string; endDate?: string; format?: 'json' | 'csv' },
  ): Promise<string> {
    const startDate = params.startDate || this.getDefaultStartDate();
    const endDate = params.endDate || this.getDefaultEndDate();
    const format = params.format || 'json';

    // Fetch aggregated data
    const aggData = await this.clickhouse.getAggregatedEventsForExport(
      projectId,
      startDate,
      endDate,
    );

    // Generate file content
    let content: string;
    let contentType: string;
    const timestamp = Date.now();

    if (format === 'csv') {
      content = this.convertToCSV(aggData);
      contentType = 'text/csv';
    } else {
      content = JSON.stringify(aggData, null, 2);
      contentType = 'application/json';
    }

    // Upload to storage
    const fileName = `${projectId}/events_agg_${startDate}_${endDate}_${timestamp}.${format}`;
    const fileUrl = await this.storage.uploadFile(fileName, content, { contentType });

    this.logger.log({
      message: 'Aggregated events exported',
      projectId,
      recordCount: aggData.length,
      format,
      fileUrl,
    });

    return fileUrl;
  }

  private convertToCSV(data: unknown[]): string {
    if (data.length === 0) return '';

    const firstRow = data[0] as Record<string, unknown>;
    const headers = Object.keys(firstRow);

    const rows = data.map((row) => {
      const record = row as Record<string, unknown>;
      return headers
        .map((header) => {
          const value = record[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma or newline
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
