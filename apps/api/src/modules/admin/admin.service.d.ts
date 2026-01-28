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
export declare class AdminService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private queues;
    private readonly QUEUE_NAMES;
    constructor(prisma: PrismaService, redis: RedisService);
    checkAdminAccess(userId: string): Promise<void>;
    getQueuesOverview(): Promise<QueueStats[]>;
    getQueueJobs(queueName: string, status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed', limit?: number): Promise<QueueJob[]>;
    retryFailedJob(queueName: string, jobId: string): Promise<void>;
    removeJob(queueName: string, jobId: string): Promise<void>;
    pauseQueue(queueName: string): Promise<void>;
    resumeQueue(queueName: string): Promise<void>;
    cleanQueue(queueName: string, status: 'completed' | 'failed', olderThanMs?: number): Promise<number>;
    getAuditLogs(options?: {
        limit?: number;
        offset?: number;
        userId?: string;
        entity?: string;
        action?: string;
    }): Promise<{
        logs: AuditEntry[];
        total: number;
    }>;
    getErrorLogs(options?: {
        limit?: number;
        offset?: number;
        level?: string;
    }): Promise<{
        logs: ErrorLogEntry[];
        total: number;
    }>;
    getSystemStats(): Promise<{
        users: number;
        tenants: number;
        projects: number;
        activeProjects: number;
        totalEvents: number;
    }>;
}
//# sourceMappingURL=admin.service.d.ts.map