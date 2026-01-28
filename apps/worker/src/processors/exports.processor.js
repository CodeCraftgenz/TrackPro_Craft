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
var ExportsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportsProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const clickhouse_service_1 = require("../services/clickhouse.service");
const prisma_service_1 = require("../services/prisma.service");
const storage_service_1 = require("../services/storage.service");
const redis_module_1 = require("../services/redis.module");
let ExportsProcessor = ExportsProcessor_1 = class ExportsProcessor {
    redis;
    clickhouse;
    prisma;
    storage;
    logger = new common_1.Logger(ExportsProcessor_1.name);
    worker;
    constructor(redis, clickhouse, prisma, storage) {
        this.redis = redis;
        this.clickhouse = clickhouse;
        this.prisma = prisma;
        this.storage = storage;
    }
    onModuleInit() {
        this.worker = new bullmq_1.Worker('exports', async (job) => {
            return this.process(job);
        }, {
            connection: this.redis,
            concurrency: 2,
        });
        this.worker.on('completed', (job) => {
            this.logger.debug(`Export job ${job.id} completed`);
        });
        this.worker.on('failed', (job, error) => {
            this.logger.error(`Export job ${job?.id} failed: ${error.message}`);
        });
        this.logger.log('Exports processor started');
    }
    async process(job) {
        const { exportJobId, projectId, type, params } = job.data;
        this.logger.log({
            message: 'Processing export job',
            jobId: job.id,
            exportJobId,
            projectId,
            type,
        });
        try {
            await this.prisma.exportJob.update({
                where: { id: exportJobId },
                data: { status: 'PROCESSING' },
            });
            let fileUrl;
            switch (type) {
                case 'EVENTS_RAW':
                    fileUrl = await this.exportEventsRaw(projectId, params);
                    break;
                case 'EVENTS_AGG':
                    fileUrl = await this.exportEventsAgg(projectId, params);
                    break;
                default:
                    throw new Error(`Unknown export type: ${type}`);
            }
            await this.prisma.exportJob.update({
                where: { id: exportJobId },
                data: {
                    status: 'COMPLETED',
                    fileUrl,
                    finishedAt: new Date(),
                },
            });
            this.logger.log({
                message: 'Export completed',
                exportJobId,
                fileUrl,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.prisma.exportJob.update({
                where: { id: exportJobId },
                data: {
                    status: 'FAILED',
                    error: errorMessage,
                    finishedAt: new Date(),
                },
            });
            throw error;
        }
    }
    async exportEventsRaw(projectId, params) {
        const startDate = params.startDate || this.getDefaultStartDate();
        const endDate = params.endDate || this.getDefaultEndDate();
        const format = params.format || 'json';
        const batchSize = 10000;
        let offset = 0;
        const allEvents = [];
        while (true) {
            const events = await this.clickhouse.getEventsForExport(projectId, startDate, endDate, batchSize, offset);
            if (events.length === 0)
                break;
            allEvents.push(...events);
            offset += batchSize;
            if (allEvents.length >= 1000000) {
                this.logger.warn(`Export limit reached for project ${projectId}`);
                break;
            }
            if (events.length < batchSize)
                break;
        }
        let content;
        let contentType;
        const timestamp = Date.now();
        if (format === 'csv') {
            content = this.convertToCSV(allEvents);
            contentType = 'text/csv';
        }
        else {
            content = JSON.stringify(allEvents, null, 2);
            contentType = 'application/json';
        }
        const fileName = `${projectId}/events_${startDate}_${endDate}_${timestamp}.${format}`;
        const fileUrl = await this.storage.uploadFile(fileName, content, { contentType });
        this.logger.log({
            message: 'Events exported',
            projectId,
            eventCount: allEvents.length,
            format,
            fileUrl,
        });
        return fileUrl;
    }
    async exportEventsAgg(projectId, params) {
        const startDate = params.startDate || this.getDefaultStartDate();
        const endDate = params.endDate || this.getDefaultEndDate();
        const format = params.format || 'json';
        const aggData = await this.clickhouse.getAggregatedEventsForExport(projectId, startDate, endDate);
        let content;
        let contentType;
        const timestamp = Date.now();
        if (format === 'csv') {
            content = this.convertToCSV(aggData);
            contentType = 'text/csv';
        }
        else {
            content = JSON.stringify(aggData, null, 2);
            contentType = 'application/json';
        }
        const fileName = `${projectId}/events_agg_${startDate}_${endDate}_${timestamp}.${format}`;
        const fileUrl = await this.storage.uploadFile(fileName, content, { contentType });
        this.logger.log({
            message: 'Aggregated events exported',
            projectId,
            recordCount: aggData.length,
            format,
            fileUrl,
        });
        return fileUrl;
    }
    convertToCSV(data) {
        if (data.length === 0)
            return '';
        const firstRow = data[0];
        const headers = Object.keys(firstRow);
        const rows = data.map((row) => {
            const record = row;
            return headers
                .map((header) => {
                const value = record[header];
                if (value === null || value === undefined)
                    return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            })
                .join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    }
    getDefaultStartDate() {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }
    getDefaultEndDate() {
        return new Date().toISOString().split('T')[0];
    }
};
exports.ExportsProcessor = ExportsProcessor;
exports.ExportsProcessor = ExportsProcessor = ExportsProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CONNECTION)),
    __metadata("design:paramtypes", [ioredis_1.default,
        clickhouse_service_1.ClickHouseService,
        prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], ExportsProcessor);
//# sourceMappingURL=exports.processor.js.map