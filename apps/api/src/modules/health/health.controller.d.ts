import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ClickHouseService } from '../analytics/clickhouse.service';
interface MetricsResponse {
    timestamp: string;
    uptime: number;
    requests: {
        total: number;
    };
    memory: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    cpu: {
        user: number;
        system: number;
    };
}
export declare class HealthController {
    private readonly prisma;
    private readonly redis;
    private readonly clickhouse;
    private readonly startTime;
    private requestCount;
    constructor(prisma: PrismaService, redis: RedisService, clickhouse: ClickHouseService);
    check(res: Response): Promise<void>;
    ready(res: Response): Promise<void>;
    live(): {
        live: boolean;
        timestamp: string;
    };
    metrics(): MetricsResponse;
    private checkDatabase;
    private checkRedis;
    private checkClickHouse;
}
export {};
//# sourceMappingURL=health.controller.d.ts.map