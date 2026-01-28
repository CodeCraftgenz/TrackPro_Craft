import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Queue, ConnectionOptions } from 'bullmq';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  attempts: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, unknown> | null;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  context: Record<string, unknown> | null;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private queues: Map<string, Queue> = new Map();

  private readonly QUEUE_NAMES = [
    'meta-capi',
    'exports',
    'retention',
    'aggregates',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    // Initialize queues
    for (const name of this.QUEUE_NAMES) {
      this.queues.set(name, new Queue(name, { connection: this.redis.getClient() as unknown as ConnectionOptions }));
    }
  }

  async checkAdminAccess(userId: string): Promise<void> {
    // Check if user has admin role in any tenant
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Admin access required');
    }
  }

  async getQueuesOverview(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];

    for (const [name, queue] of this.queues) {
      try {
        const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
          queue.isPaused(),
        ]);

        stats.push({
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused: isPaused,
        });
      } catch (error) {
        this.logger.error(`Failed to get stats for queue ${name}`, error);
        stats.push({
          name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
        });
      }
    }

    return stats;
  }

  async getQueueJobs(
    queueName: string,
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    limit: number = 20,
  ): Promise<QueueJob[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return [];
    }

    let jobs: Awaited<ReturnType<Queue['getWaiting']>> = [];
    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(0, limit - 1);
        break;
      case 'active':
        jobs = await queue.getActive(0, limit - 1);
        break;
      case 'completed':
        jobs = await queue.getCompleted(0, limit - 1);
        break;
      case 'failed':
        jobs = await queue.getFailed(0, limit - 1);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(0, limit - 1);
        break;
      default:
        jobs = [];
    }

    return jobs.map((job) => ({
      id: job.id || 'unknown',
      name: job.name,
      data: job.data as Record<string, unknown>,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }));
  }

  async retryFailedJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    this.logger.log(`Retried job ${jobId} in queue ${queueName}`);
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    this.logger.log(`Paused queue ${queueName}`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Resumed queue ${queueName}`);
  }

  async cleanQueue(
    queueName: string,
    status: 'completed' | 'failed',
    olderThanMs: number = 24 * 60 * 60 * 1000, // 24 hours
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const cleaned = await queue.clean(olderThanMs, 1000, status);
    this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from queue ${queueName}`);
    return cleaned.length;
  }

  async getAuditLogs(
    options: {
      limit?: number;
      offset?: number;
      userId?: string;
      entity?: string;
      action?: string;
    } = {},
  ): Promise<{ logs: AuditEntry[]; total: number }> {
    const { limit = 50, offset = 0, userId, entity, action } = options;

    const where = {
      ...(userId && { actorUserId: userId }),
      ...(entity && { resource: entity }),
      ...(action && { action }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userId: log.actorUserId || '',
        action: log.action,
        entity: log.resource,
        entityId: log.resourceId || '',
        changes: log.payload as Record<string, unknown> | null,
      })),
      total,
    };
  }

  async getErrorLogs(
    options: {
      limit?: number;
      offset?: number;
      level?: string;
    } = {},
  ): Promise<{ logs: ErrorLogEntry[]; total: number }> {
    // For now, return recent audit logs with error actions
    // In production, you'd have a dedicated error_logs table
    const { limit = 50, offset = 0 } = options;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: { contains: 'error' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        level: 'error',
        message: log.action,
        context: log.payload as Record<string, unknown> | null,
      })),
      total: logs.length,
    };
  }

  async getSystemStats(): Promise<{
    users: number;
    tenants: number;
    projects: number;
    activeProjects: number;
    totalEvents: number;
  }> {
    const [users, tenants, projects, activeProjects] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tenant.count(),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      users,
      tenants,
      projects,
      activeProjects,
      totalEvents: 0, // Would come from ClickHouse
    };
  }
}
