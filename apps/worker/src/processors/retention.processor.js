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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RetentionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetentionProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const clickhouse_service_1 = require("../services/clickhouse.service");
const prisma_service_1 = require("../services/prisma.service");
const redis_module_1 = require("../services/redis.module");
let RetentionProcessor = RetentionProcessor_1 = class RetentionProcessor {
    redis;
    clickhouse;
    prisma;
    logger = new common_1.Logger(RetentionProcessor_1.name);
    worker;
    queue;
    constructor(redis, clickhouse, prisma) {
        this.redis = redis;
        this.clickhouse = clickhouse;
        this.prisma = prisma;
        this.queue = new bullmq_1.Queue('retention', { connection: this.redis });
    }
    onModuleInit() {
        this.worker = new bullmq_1.Worker('retention', async (job) => {
            return this.process(job);
        }, {
            connection: this.redis,
            concurrency: 1,
        });
        this.worker.on('completed', (job) => {
            this.logger.debug(`Retention job ${job.id} completed`);
        });
        this.worker.on('failed', (job, error) => {
            this.logger.error(`Retention job ${job?.id} failed: ${error.message}`);
        });
        this.logger.log('Retention processor started');
    }
    async process(job) {
        const { projectId, retentionDays } = job.data;
        if (!projectId) {
            await this.processAllProjects();
            return;
        }
        this.logger.log({
            message: 'Processing retention cleanup',
            jobId: job.id,
            projectId,
            retentionDays,
        });
        await this.clickhouse.deleteOldEvents(projectId, retentionDays);
        await this.cleanupConsentLogs(projectId, retentionDays);
        await this.clickhouse.deleteOldMetaDeliveryLogs(projectId, retentionDays);
        this.logger.log({
            message: 'Retention cleanup completed',
            projectId,
            retentionDays,
        });
    }
    async processAllProjects() {
        this.logger.log('Starting daily retention cleanup for all projects');
        const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, retentionDays: true },
        });
        for (const project of projects) {
            await this.queue.add('cleanup-project', {
                projectId: project.id,
                retentionDays: project.retentionDays,
            }, {
                jobId: `retention-${project.id}-${Date.now()}`,
                delay: 1000,
            });
        }
        this.logger.log(`Queued retention cleanup for ${projects.length} projects`);
    }
    async cleanupConsentLogs(projectId, retentionDays) {
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
};
exports.RetentionProcessor = RetentionProcessor;
exports.RetentionProcessor = RetentionProcessor = RetentionProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CONNECTION)),
    __metadata("design:paramtypes", [ioredis_1.default,
        clickhouse_service_1.ClickHouseService,
        prisma_service_1.PrismaService])
], RetentionProcessor);
//# sourceMappingURL=retention.processor.js.map