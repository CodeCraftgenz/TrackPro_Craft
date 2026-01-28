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
var ApiKeyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("./redis.service");
let ApiKeyService = ApiKeyService_1 = class ApiKeyService {
    configService;
    redis;
    logger = new common_1.Logger(ApiKeyService_1.name);
    apiUrl;
    cachePrefix = 'apikey:';
    cacheTtl = 300;
    constructor(configService, redis) {
        this.configService = configService;
        this.redis = redis;
        this.apiUrl = this.configService.get('API_URL', 'http://localhost:3001');
    }
    async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('tp_')) {
            return null;
        }
        const cached = await this.redis.getClient().get(`${this.cachePrefix}${apiKey}`);
        if (cached) {
            if (cached === 'invalid') {
                return null;
            }
            return JSON.parse(cached);
        }
        try {
            const response = await fetch(`${this.apiUrl}/api/v1/internal/validate-api-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Secret': this.configService.get('INTERNAL_API_SECRET', ''),
                },
                body: JSON.stringify({ apiKey }),
            });
            if (!response.ok) {
                await this.redis.getClient().set(`${this.cachePrefix}${apiKey}`, 'invalid', 'EX', 60);
                return null;
            }
            const data = (await response.json());
            await this.redis.getClient().set(`${this.cachePrefix}${apiKey}`, JSON.stringify(data), 'EX', this.cacheTtl);
            return data;
        }
        catch (error) {
            this.logger.error('Failed to validate API key', error);
            if (this.configService.get('NODE_ENV') === 'development') {
                const devInfo = {
                    projectId: 'dev-project-id',
                    tenantId: 'dev-tenant-id',
                    scopes: ['events:write', 'events:read'],
                    status: 'active',
                };
                await this.redis.getClient().set(`${this.cachePrefix}${apiKey}`, JSON.stringify(devInfo), 'EX', this.cacheTtl);
                return devInfo;
            }
            return null;
        }
    }
    async invalidateCache(apiKey) {
        await this.redis.getClient().del(`${this.cachePrefix}${apiKey}`);
    }
};
exports.ApiKeyService = ApiKeyService;
exports.ApiKeyService = ApiKeyService = ApiKeyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], ApiKeyService);
//# sourceMappingURL=api-key.service.js.map