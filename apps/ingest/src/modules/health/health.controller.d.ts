import { RedisService } from '../../services/redis.service';
import { ClickHouseService } from '../../services/clickhouse.service';
interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
        redis: 'up' | 'down';
        clickhouse: 'up' | 'down';
    };
    uptime: number;
}
export declare class HealthController {
    private readonly redis;
    private readonly clickhouse;
    private readonly startTime;
    constructor(redis: RedisService, clickhouse: ClickHouseService);
    check(): Promise<HealthStatus>;
    ready(): Promise<{
        ready: boolean;
    }>;
    live(): {
        live: boolean;
    };
    private checkRedis;
    private checkClickHouse;
}
export {};
//# sourceMappingURL=health.controller.d.ts.map