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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../services/redis.service");
const clickhouse_service_1 = require("../../services/clickhouse.service");
let HealthController = class HealthController {
    redis;
    clickhouse;
    startTime = Date.now();
    constructor(redis, clickhouse) {
        this.redis = redis;
        this.clickhouse = clickhouse;
    }
    async check() {
        const [redisStatus, clickhouseStatus] = await Promise.all([
            this.checkRedis(),
            this.checkClickHouse(),
        ]);
        const isHealthy = redisStatus === 'up' && clickhouseStatus === 'up';
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                redis: redisStatus,
                clickhouse: clickhouseStatus,
            },
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
        };
    }
    async ready() {
        const [redisStatus, clickhouseStatus] = await Promise.all([
            this.checkRedis(),
            this.checkClickHouse(),
        ]);
        return {
            ready: redisStatus === 'up' && clickhouseStatus === 'up',
        };
    }
    live() {
        return { live: true };
    }
    async checkRedis() {
        try {
            await this.redis.getClient().ping();
            return 'up';
        }
        catch {
            return 'down';
        }
    }
    async checkClickHouse() {
        try {
            const isConnected = await this.clickhouse.ping();
            return isConnected ? 'up' : 'down';
        }
        catch {
            return 'down';
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
__decorate([
    (0, common_1.Get)('live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "live", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        clickhouse_service_1.ClickHouseService])
], HealthController);
//# sourceMappingURL=health.controller.js.map