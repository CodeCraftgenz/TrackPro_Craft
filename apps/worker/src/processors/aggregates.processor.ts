import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

import { ClickHouseService } from '../services/clickhouse.service';
import { REDIS_CONNECTION } from '../services/redis.module';

interface AggregateJobData {
  projectId: string;
  date: string;
}

@Injectable()
export class AggregatesProcessor implements OnModuleInit {
  private readonly logger = new Logger(AggregatesProcessor.name);
  private worker!: Worker<AggregateJobData>;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: IORedis,
    private readonly clickhouse: ClickHouseService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<AggregateJobData>(
      'aggregates',
      async (job: Job<AggregateJobData>) => {
        return this.process(job);
      },
      {
        connection: this.redis as unknown as ConnectionOptions,
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Aggregates job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Aggregates job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Aggregates processor started');
  }

  private async process(job: Job<AggregateJobData>): Promise<void> {
    const { projectId, date } = job.data;

    this.logger.log({
      message: 'Building aggregates',
      jobId: job.id,
      projectId,
      date,
    });

    await this.clickhouse.buildDailyAggregates(projectId, date);

    this.logger.log({
      message: 'Aggregates built successfully',
      projectId,
      date,
    });
  }
}
