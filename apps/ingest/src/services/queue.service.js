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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
let QueueService = QueueService_1 = class QueueService {
    configService;
    logger = new common_1.Logger(QueueService_1.name);
    connection;
    metaCapiQueue;
    aggregatesQueue;
    exportsQueue;
    retentionQueue;
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.connection = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: null,
        });
        this.metaCapiQueue = new bullmq_1.Queue('meta-capi', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
        });
        this.aggregatesQueue = new bullmq_1.Queue('aggregates', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 2,
                removeOnComplete: 100,
                removeOnFail: 1000,
            },
        });
        this.exportsQueue = new bullmq_1.Queue('exports', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 2,
                removeOnComplete: 50,
                removeOnFail: 100,
            },
        });
        this.retentionQueue = new bullmq_1.Queue('retention', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 2,
                removeOnComplete: 10,
                removeOnFail: 50,
            },
        });
        this.logger.log('BullMQ queues initialized');
    }
    async onModuleDestroy() {
        await this.metaCapiQueue.close();
        await this.aggregatesQueue.close();
        await this.exportsQueue.close();
        await this.retentionQueue.close();
        this.connection.disconnect();
    }
    async addMetaCapiJob(data) {
        const job = await this.metaCapiQueue.add('send', data, {
            jobId: `meta-capi-${data.eventId}`,
        });
        return job.id || '';
    }
    async addAggregateJob(data) {
        const job = await this.aggregatesQueue.add('build', data);
        return job.id || '';
    }
    async addExportJob(data) {
        const job = await this.exportsQueue.add('export', data, {
            jobId: `export-${data.exportJobId}`,
        });
        return job.id || '';
    }
    async addRetentionJob(data) {
        const job = await this.retentionQueue.add('cleanup', data);
        return job.id || '';
    }
    getMetaCapiQueue() {
        return this.metaCapiQueue;
    }
    getAggregatesQueue() {
        return this.aggregatesQueue;
    }
    getExportsQueue() {
        return this.exportsQueue;
    }
    getRetentionQueue() {
        return this.retentionQueue;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QueueService);
//# sourceMappingURL=queue.service.js.map