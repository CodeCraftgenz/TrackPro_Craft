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
exports.ReportsCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
let ReportsCacheService = class ReportsCacheService {
    redis;
    PREFIX = 'report:';
    DEFAULT_TTL = 300;
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        return this.redis.getJson(this.PREFIX + key);
    }
    async set(key, value, ttlSeconds) {
        await this.redis.setJson(this.PREFIX + key, value, ttlSeconds || this.DEFAULT_TTL);
    }
    async invalidate(pattern) {
        const client = this.redis.getClient();
        const keys = await client.keys(this.PREFIX + pattern + '*');
        if (keys.length > 0) {
            await client.del(...keys);
        }
    }
    buildKey(projectId, reportType, params) {
        const paramStr = Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return `${projectId}:${reportType}:${paramStr}`;
    }
    getTtlForPeriod(startDate, endDate) {
        const now = new Date();
        const end = endDate ? new Date(endDate) : now;
        if (end.toDateString() === now.toDateString()) {
            return 60;
        }
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (end <= yesterday) {
            return 3600;
        }
        return 300;
    }
};
exports.ReportsCacheService = ReportsCacheService;
exports.ReportsCacheService = ReportsCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], ReportsCacheService);
//# sourceMappingURL=reports-cache.service.js.map