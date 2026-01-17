import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import IORedis from 'ioredis';

import { ClickHouseService } from '../services/clickhouse.service';
import { PrismaService } from '../services/prisma.service';
import { REDIS_CONNECTION } from '../services/redis.module';

interface RetentionJobData {
  projectId?: string;
  retentionDays?: number;
}

@Injectable()
export class RetentionProcessor implements OnModuleInit {
  private readonly logger = new Logger(RetentionProcessor.name);
  private worker: Worker<RetentionJobData>;
  private queue: Queue;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: IORedis,
    private readonly clickhouse: ClickHouseService,
    private readonly prisma: PrismaService,
  ) {
    this.queue = new Queue('retention', { connection: this.redis });
  }

  onModuleInit() {
    this.worker = new Worker<RetentionJobData>(
      'retention',
      async (job: Job<RetentionJobData>) => {
        return this.process(job);
      },
      {
        connection: this.redis,
        concurrency: 1, // Only process one at a time to avoid conflicts
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Retention job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Retention job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Retention processor started');
  }

  private async process(job: Job<RetentionJobData>): Promise<void> {
    const { projectId, retentionDays } = job.data;

    // If no projectId, this is the daily scheduled job - process all projects
    if (!projectId) {
      await this.processAllProjects();
      return;
    }

    // Process single project
    this.logger.log({
      message: 'Processing retention cleanup',
      jobId: job.id,
      projectId,
      retentionDays,
    });

    await this.clickhouse.deleteOldEvents(projectId, retentionDays!);

    // Also cleanup consent logs older than retention period
    await this.cleanupConsentLogs(projectId, retentionDays!);

    // Cleanup meta delivery logs
    await this.clickhouse.deleteOldMetaDeliveryLogs(projectId, retentionDays!);

    this.logger.log({
      message: 'Retention cleanup completed',
      projectId,
      retentionDays,
    });
  }

  private async processAllProjects(): Promise<void> {
    this.logger.log('Starting daily retention cleanup for all projects');

    const projects = await this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, retentionDays: true },
    });

    for (const project of projects) {
      await this.queue.add(
        'cleanup-project',
        {
          projectId: project.id,
          retentionDays: project.retentionDays,
        },
        {
          jobId: `retention-${project.id}-${Date.now()}`,
          delay: 1000, // Small delay between jobs
        },
      );
    }

    this.logger.log(`Queued retention cleanup for ${projects.length} projects`);
  }

  private async cleanupConsentLogs(
    projectId: string,
    retentionDays: number,
  ): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.consentLog.deleteMany({
      where: {
        projectId,
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      this.logger.log({
        message: 'Consent logs cleaned up',
        projectId,
        deletedCount: result.count,
      });
    }
  }
}
