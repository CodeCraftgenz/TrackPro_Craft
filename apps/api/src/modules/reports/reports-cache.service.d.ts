import { RedisService } from '../../redis/redis.service';
export declare class ReportsCacheService {
    private readonly redis;
    private readonly PREFIX;
    private readonly DEFAULT_TTL;
    constructor(redis: RedisService);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    invalidate(pattern: string): Promise<void>;
    buildKey(projectId: string, reportType: string, params: {
        startDate?: string;
        endDate?: string;
        [key: string]: string | undefined;
    }): string;
    getTtlForPeriod(startDate?: string, endDate?: string): number;
}
//# sourceMappingURL=reports-cache.service.d.ts.map