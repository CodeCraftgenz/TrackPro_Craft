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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("./prisma.service");
const redis_module_1 = require("./redis.module");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    redis;
    prisma;
    logger = new common_1.Logger(SchedulerService_1.name);
    retentionQueue;
    aggregatesQueue;
    constructor(redis, prisma) {
        this.redis = redis;
        this.prisma = prisma;
        this.retentionQueue = new bullmq_1.Queue('retention', { connection: this.redis });
        this.aggregatesQueue = new bullmq_1.Queue('aggregates', { connection: this.redis });
    }
    async onModuleInit() {
        await this.scheduleRetentionCleanup();
        await this.scheduleAggregatesRebuild();
        this.logger.log('Scheduler initialized');
    }
    async scheduleRetentionCleanup() {
        const repeatableJobs = await this.retentionQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            await this.retentionQueue.removeRepeatableByKey(job.key);
        }
        await this.retentionQueue.add('cleanup-all-projects', {}, {
            repeat: {
                pattern: '0 3 * * *',
            },
            jobId: 'retention-cleanup-daily',
        });
        this.logger.log('Retention cleanup scheduled for 3 AM daily');
    }
    async scheduleAggregatesRebuild() {
        const repeatableJobs = await this.aggregatesQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            await this.aggregatesQueue.removeRepeatableByKey(job.key);
        }
        await this.aggregatesQueue.add('rebuild-daily-aggregates', {}, {
            repeat: {
                pattern: '0 4 * * *',
            },
            jobId: 'aggregates-rebuild-daily',
        });
        this.logger.log('Aggregates rebuild scheduled for 4 AM daily');
    }
    async triggerRetentionCleanup() {
        const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, retentionDays: true },
        });
        for (const project of projects) {
            await this.retentionQueue.add('cleanup-project', {
                projectId: project.id,
                retentionDays: project.retentionDays,
            }, {
                jobId: `retention-${project.id}-${Date.now()}`,
            });
        }
        this.logger.log(`Queued retention cleanup for ${projects.length} projects`);
    }
    async triggerAggregatesRebuild(date) {
        const targetDate = date || this.getYesterdayDate();
        const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
        });
        for (const project of projects) {
            await this.aggregatesQueue.add('rebuild-project', {
                projectId: project.id,
                date: targetDate,
            }, {
                jobId: `aggregates-${project.id}-${targetDate}`,
            });
        }
        this.logger.log(`Queued aggregates rebuild for ${projects.length} projects (date: ${targetDate})`);
    }
    getYesterdayDate() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }
};
exports.SchedulerService = SchedulerService;
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CONNECTION)),
    __metadata("design:paramtypes", [ioredis_1.default,
        prisma_service_1.PrismaService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map