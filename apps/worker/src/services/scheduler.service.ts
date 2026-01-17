import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { PrismaService } from './prisma.service';
import { REDIS_CONNECTION } from './redis.module';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private retentionQueue: Queue;
  private aggregatesQueue: Queue;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: IORedis,
    private readonly prisma: PrismaService,
  ) {
    this.retentionQueue = new Queue('retention', { connection: this.redis });
    this.aggregatesQueue = new Queue('aggregates', { connection: this.redis });
  }

  async onModuleInit() {
    // Schedule daily retention cleanup at 3 AM
    await this.scheduleRetentionCleanup();

    // Schedule daily aggregates rebuild at 4 AM
    await this.scheduleAggregatesRebuild();

    this.logger.log('Scheduler initialized');
  }

  private async scheduleRetentionCleanup() {
    // Remove existing repeatable jobs
    const repeatableJobs = await this.retentionQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.retentionQueue.removeRepeatableByKey(job.key);
    }

    // Add new repeatable job - runs daily at 3 AM
    await this.retentionQueue.add(
      'cleanup-all-projects',
      {},
      {
        repeat: {
          pattern: '0 3 * * *', // 3 AM daily
        },
        jobId: 'retention-cleanup-daily',
      },
    );

    this.logger.log('Retention cleanup scheduled for 3 AM daily');
  }

  private async scheduleAggregatesRebuild() {
    // Remove existing repeatable jobs
    const repeatableJobs = await this.aggregatesQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.aggregatesQueue.removeRepeatableByKey(job.key);
    }

    // Add new repeatable job - runs daily at 4 AM
    await this.aggregatesQueue.add(
      'rebuild-daily-aggregates',
      {},
      {
        repeat: {
          pattern: '0 4 * * *', // 4 AM daily
        },
        jobId: 'aggregates-rebuild-daily',
      },
    );

    this.logger.log('Aggregates rebuild scheduled for 4 AM daily');
  }

  async triggerRetentionCleanup() {
    // Get all active projects with retention settings
    const projects = await this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, retentionDays: true },
    });

    for (const project of projects) {
      await this.retentionQueue.add(
        'cleanup-project',
        {
          projectId: project.id,
          retentionDays: project.retentionDays,
        },
        {
          jobId: `retention-${project.id}-${Date.now()}`,
        },
      );
    }

    this.logger.log(`Queued retention cleanup for ${projects.length} projects`);
  }

  async triggerAggregatesRebuild(date?: string) {
    const targetDate = date || this.getYesterdayDate();

    const projects = await this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const project of projects) {
      await this.aggregatesQueue.add(
        'rebuild-project',
        {
          projectId: project.id,
          date: targetDate,
        },
        {
          jobId: `aggregates-${project.id}-${targetDate}`,
        },
      );
    }

    this.logger.log(
      `Queued aggregates rebuild for ${projects.length} projects (date: ${targetDate})`,
    );
  }

  private getYesterdayDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }
}
