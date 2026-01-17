import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export interface MetaCapiJobData {
  projectId: string;
  eventId: string;
  eventName: string;
  eventTime: number;
  userData: {
    email?: string;
    phone?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    contentType?: string;
    orderId?: string;
  };
  eventSourceUrl?: string;
}

export interface AggregateJobData {
  projectId: string;
  date: string;
}

export interface ExportJobData {
  exportJobId: string;
  projectId: string;
  type: string;
  params: Record<string, unknown>;
}

export interface RetentionJobData {
  projectId: string;
  retentionDays: number;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection: IORedis;
  private readonly metaCapiQueue: Queue<MetaCapiJobData>;
  private readonly aggregatesQueue: Queue<AggregateJobData>;
  private readonly exportsQueue: Queue<ExportJobData>;
  private readonly retentionQueue: Queue<RetentionJobData>;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.metaCapiQueue = new Queue('meta-capi', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    this.aggregatesQueue = new Queue('aggregates', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });

    this.exportsQueue = new Queue('exports', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });

    this.retentionQueue = new Queue('retention', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: 10,
        removeOnFail: 50,
      },
    });

    this.logger.log('BullMQ queues initialized');
  }

  async onModuleDestroy() {
    await this.metaCapiQueue.close();
    await this.aggregatesQueue.close();
    await this.exportsQueue.close();
    await this.retentionQueue.close();
    this.connection.disconnect();
  }

  async addMetaCapiJob(data: MetaCapiJobData): Promise<string> {
    const job = await this.metaCapiQueue.add('send', data, {
      jobId: `meta-capi-${data.eventId}`,
    });
    return job.id || '';
  }

  async addAggregateJob(data: AggregateJobData): Promise<string> {
    const job = await this.aggregatesQueue.add('build', data);
    return job.id || '';
  }

  async addExportJob(data: ExportJobData): Promise<string> {
    const job = await this.exportsQueue.add('export', data, {
      jobId: `export-${data.exportJobId}`,
    });
    return job.id || '';
  }

  async addRetentionJob(data: RetentionJobData): Promise<string> {
    const job = await this.retentionQueue.add('cleanup', data);
    return job.id || '';
  }

  getMetaCapiQueue(): Queue<MetaCapiJobData> {
    return this.metaCapiQueue;
  }

  getAggregatesQueue(): Queue<AggregateJobData> {
    return this.aggregatesQueue;
  }

  getExportsQueue(): Queue<ExportJobData> {
    return this.exportsQueue;
  }

  getRetentionQueue(): Queue<RetentionJobData> {
    return this.retentionQueue;
  }
}
