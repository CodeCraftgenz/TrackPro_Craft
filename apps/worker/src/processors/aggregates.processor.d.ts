import { OnModuleInit } from '@nestjs/common';
import IORedis from 'ioredis';
import { ClickHouseService } from '../services/clickhouse.service';
export declare class AggregatesProcessor implements OnModuleInit {
    private readonly redis;
    private readonly clickhouse;
    private readonly logger;
    private worker;
    constructor(redis: IORedis, clickhouse: ClickHouseService);
    onModuleInit(): void;
    private process;
}
//# sourceMappingURL=aggregates.processor.d.ts.map