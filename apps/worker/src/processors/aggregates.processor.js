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
var AggregatesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatesProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const clickhouse_service_1 = require("../services/clickhouse.service");
const redis_module_1 = require("../services/redis.module");
let AggregatesProcessor = AggregatesProcessor_1 = class AggregatesProcessor {
    redis;
    clickhouse;
    logger = new common_1.Logger(AggregatesProcessor_1.name);
    worker;
    constructor(redis, clickhouse) {
        this.redis = redis;
        this.clickhouse = clickhouse;
    }
    onModuleInit() {
        this.worker = new bullmq_1.Worker('aggregates', async (job) => {
            return this.process(job);
        }, {
            connection: this.redis,
            concurrency: 5,
        });
        this.worker.on('completed', (job) => {
            this.logger.debug(`Aggregates job ${job.id} completed`);
        });
        this.worker.on('failed', (job, error) => {
            this.logger.error(`Aggregates job ${job?.id} failed: ${error.message}`);
        });
        this.logger.log('Aggregates processor started');
    }
    async process(job) {
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
};
exports.AggregatesProcessor = AggregatesProcessor;
exports.AggregatesProcessor = AggregatesProcessor = AggregatesProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CONNECTION)),
    __metadata("design:paramtypes", [ioredis_1.default,
        clickhouse_service_1.ClickHouseService])
], AggregatesProcessor);
//# sourceMappingURL=aggregates.processor.js.map