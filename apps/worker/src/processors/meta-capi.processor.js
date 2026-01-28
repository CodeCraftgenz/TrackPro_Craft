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
var MetaCapiProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaCapiProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const meta_capi_service_1 = require("../services/meta-capi.service");
const clickhouse_service_1 = require("../services/clickhouse.service");
const redis_module_1 = require("../services/redis.module");
let MetaCapiProcessor = MetaCapiProcessor_1 = class MetaCapiProcessor {
    redis;
    metaCapiService;
    clickhouse;
    logger = new common_1.Logger(MetaCapiProcessor_1.name);
    worker;
    constructor(redis, metaCapiService, clickhouse) {
        this.redis = redis;
        this.metaCapiService = metaCapiService;
        this.clickhouse = clickhouse;
    }
    onModuleInit() {
        this.worker = new bullmq_1.Worker('meta-capi', async (job) => {
            return this.process(job);
        }, {
            connection: this.redis,
            concurrency: 10,
            limiter: {
                max: 100,
                duration: 1000,
            },
        });
        this.worker.on('completed', (job) => {
            this.logger.debug(`Job ${job.id} completed`);
        });
        this.worker.on('failed', (job, error) => {
            this.logger.error(`Job ${job?.id} failed: ${error.message}`);
        });
        this.logger.log('Meta CAPI processor started');
    }
    async process(job) {
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
            await this.clickhouse.insertMetaDeliveryLog({
                event_id: data.eventId,
                project_id: data.projectId,
                status: 'delivered',
                attempts: attemptNumber,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.clickhouse.insertMetaDeliveryLog({
                event_id: data.eventId,
                project_id: data.projectId,
                status: attemptNumber >= 3 ? 'failed' : 'retrying',
                attempts: attemptNumber,
                last_error: errorMessage,
            });
            throw error;
        }
    }
};
exports.MetaCapiProcessor = MetaCapiProcessor;
exports.MetaCapiProcessor = MetaCapiProcessor = MetaCapiProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CONNECTION)),
    __metadata("design:paramtypes", [ioredis_1.default,
        meta_capi_service_1.MetaCapiService,
        clickhouse_service_1.ClickHouseService])
], MetaCapiProcessor);
//# sourceMappingURL=meta-capi.processor.js.map