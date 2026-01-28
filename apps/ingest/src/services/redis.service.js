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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.client = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) {
                    return null;
                }
                return Math.min(times * 200, 2000);
            },
        });
        this.client.on('connect', () => {
            this.logger.log('Redis connected');
        });
        this.client.on('error', (error) => {
            this.logger.error('Redis error', error);
        });
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    getClient() {
        return this.client;
    }
    async checkDedupe(key, ttlSeconds = 3600) {
        const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    }
    async checkRateLimit(projectId, limit, windowSeconds) {
        const key = `rate:${projectId}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
        const current = await this.client.incr(key);
        if (current === 1) {
            await this.client.expire(key, windowSeconds);
        }
        return current <= limit;
    }
    async storeTimestamp(key, timestamp, ttlSeconds) {
        const exists = await this.client.exists(key);
        if (exists) {
            return false;
        }
        await this.client.set(key, timestamp.toString(), 'EX', ttlSeconds);
        return true;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map