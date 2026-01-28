"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let AdminService = AdminService_1 = class AdminService {
    prisma;
    redis;
    logger = new common_1.Logger(AdminService_1.name);
    queues = new Map();
    QUEUE_NAMES = [
        'meta-capi',
        'exports',
        'retention',
        'aggregates',
    ];
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        for (const name of this.QUEUE_NAMES) {
            this.queues.set(name, new bullmq_1.Queue(name, { connection: this.redis.getClient() }));
        }
    }
    async checkAdminAccess(userId) {
        const membership = await this.prisma.membership.findFirst({
            where: {
                userId,
                role: { in: [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN] },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async getQueuesOverview() {
        const stats = [];
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
            }
            catch (error) {
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
    async getQueueJobs(queueName, status, limit = 20) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            return [];
        }
        let jobs;
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
            data: job.data,
            attempts: job.attemptsMade,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            failedReason: job.failedReason,
        }));
    }
    async retryFailedJob(queueName, jobId) {
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
    async removeJob(queueName, jobId) {
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
    async pauseQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        await queue.pause();
        this.logger.log(`Paused queue ${queueName}`);
    }
    async resumeQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        await queue.resume();
        this.logger.log(`Resumed queue ${queueName}`);
    }
    async cleanQueue(queueName, status, olderThanMs = 24 * 60 * 60 * 1000) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        const cleaned = await queue.clean(olderThanMs, 1000, status);
        this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from queue ${queueName}`);
        return cleaned.length;
    }
    async getAuditLogs(options = {}) {
        const { limit = 50, offset = 0, userId, entity, action } = options;
        const where = {
            ...(userId && { userId }),
            ...(entity && { entity }),
            ...(action && { action }),
        };
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    user: {
                        select: { email: true, name: true },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            logs: logs.map((log) => ({
                id: log.id,
                timestamp: log.createdAt.toISOString(),
                userId: log.userId,
                action: log.action,
                entity: log.entity,
                entityId: log.entityId,
                changes: log.changes,
            })),
            total,
        };
    }
    async getErrorLogs(options = {}) {
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
                context: log.changes,
            })),
            total: logs.length,
        };
    }
    async getSystemStats() {
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
            totalEvents: 0,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AdminService);
//# sourceMappingURL=admin.service.js.map