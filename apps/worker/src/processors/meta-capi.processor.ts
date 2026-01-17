import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

import { MetaCapiService } from '../services/meta-capi.service';
import { ClickHouseService } from '../services/clickhouse.service';
import { REDIS_CONNECTION } from '../services/redis.module';

interface MetaCapiJobData {
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

@Injectable()
export class MetaCapiProcessor implements OnModuleInit {
  private readonly logger = new Logger(MetaCapiProcessor.name);
  private worker!: Worker<MetaCapiJobData>;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: IORedis,
    private readonly metaCapiService: MetaCapiService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<MetaCapiJobData>(
      'meta-capi',
      async (job: Job<MetaCapiJobData>) => {
        return this.process(job);
      },
      {
        connection: this.redis as unknown as ConnectionOptions,
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 1000, // 100 requests per second
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Meta CAPI processor started');
  }

  private async process(job: Job<MetaCapiJobData>): Promise<void> {
    const { data } = job;
    const attemptNumber = job.attemptsMade + 1;

    this.logger.log({
      message: 'Processing Meta CAPI job',
      jobId: job.id,
      eventId: data.eventId,
      attempt: attemptNumber,
    });

    try {
      await this.metaCapiService.sendEvent(data.projectId, {
        eventId: data.eventId,
        eventName: data.eventName,
        eventTime: data.eventTime,
        userData: data.userData,
        customData: data.customData,
        eventSourceUrl: data.eventSourceUrl,
      });

      // Log success to ClickHouse
      await this.clickhouse.insertMetaDeliveryLog({
        event_id: data.eventId,
        project_id: data.projectId,
        status: 'delivered',
        attempts: attemptNumber,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure to ClickHouse
      await this.clickhouse.insertMetaDeliveryLog({
        event_id: data.eventId,
        project_id: data.projectId,
        status: attemptNumber >= 3 ? 'failed' : 'retrying',
        attempts: attemptNumber,
        last_error: errorMessage,
      });

      // Re-throw to trigger retry
      throw error;
    }
  }
}
