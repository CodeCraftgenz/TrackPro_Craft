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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const clickhouse_service_1 = require("../analytics/clickhouse.service");
let HealthController = class HealthController {
    prisma;
    redis;
    clickhouse;
    startTime = Date.now();
    requestCount = 0;
    constructor(prisma, redis, clickhouse) {
        this.prisma = prisma;
        this.redis = redis;
        this.clickhouse = clickhouse;
    }
    async check(res) {
        this.requestCount++;
        const [dbCheck, redisCheck, clickhouseCheck] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkClickHouse(),
        ]);
        const allUp = dbCheck.status === 'up' && redisCheck.status === 'up';
        const anyDown = dbCheck.status === 'down' || redisCheck.status === 'down';
        let status;
        let httpStatus;
        if (allUp && clickhouseCheck.status === 'up') {
            status = 'healthy';
            httpStatus = common_1.HttpStatus.OK;
        }
        else if (anyDown) {
            status = 'unhealthy';
            httpStatus = common_1.HttpStatus.SERVICE_UNAVAILABLE;
        }
        else {
            status = 'degraded';
            httpStatus = common_1.HttpStatus.OK;
        }
        const memUsage = process.memoryUsage();
        const response = {
            status,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: dbCheck,
                redis: redisCheck,
                clickhouse: clickhouseCheck,
            },
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
            },
        };
        res.status(httpStatus).json(response);
    }
    async ready(res) {
        const [dbCheck, redisCheck] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
        ]);
        const ready = dbCheck.status === 'up' && redisCheck.status === 'up';
        res.status(ready ? common_1.HttpStatus.OK : common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
            ready,
            timestamp: new Date().toISOString(),
        });
    }
    live() {
        return {
            live: true,
            timestamp: new Date().toISOString(),
        };
    }
    metrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            requests: {
                total: this.requestCount,
            },
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024),
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000),
                system: Math.round(cpuUsage.system / 1000),
            },
        };
    }
    async checkDatabase() {
        const start = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                status: 'up',
                latency: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: 'down',
                latency: Date.now() - start,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async checkRedis() {
        const start = Date.now();
        try {
            await this.redis.getClient().ping();
            return {
                status: 'up',
                latency: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: 'down',
                latency: Date.now() - start,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async checkClickHouse() {
        const start = Date.now();
        try {
            const isUp = await this.clickhouse.ping();
            return {
                status: isUp ? 'up' : 'down',
                latency: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: 'down',
                latency: Date.now() - start,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness check for k8s' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness check for k8s' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Basic metrics endpoint' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "metrics", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        clickhouse_service_1.ClickHouseService])
], HealthController);
//# sourceMappingURL=health.controller.js.map