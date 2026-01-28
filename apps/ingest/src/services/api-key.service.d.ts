import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
interface ApiKeyInfo {
    projectId: string;
    tenantId: string;
    scopes: string[];
    status: string;
}
export declare class ApiKeyService {
    private readonly configService;
    private readonly redis;
    private readonly logger;
    private readonly apiUrl;
    private readonly cachePrefix;
    private readonly cacheTtl;
    constructor(configService: ConfigService, redis: RedisService);
    validateApiKey(apiKey: string): Promise<ApiKeyInfo | null>;
    invalidateCache(apiKey: string): Promise<void>;
}
export {};
//# sourceMappingURL=api-key.service.d.ts.map