import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    getClient(): Redis;
    checkDedupe(key: string, ttlSeconds?: number): Promise<boolean>;
    checkRateLimit(projectId: string, limit: number, windowSeconds: number): Promise<boolean>;
    storeTimestamp(key: string, timestamp: number, ttlSeconds: number): Promise<boolean>;
}
//# sourceMappingURL=redis.service.d.ts.map