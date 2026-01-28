import { OnModuleInit } from '@nestjs/common';
import IORedis from 'ioredis';
import { MetaCapiService } from '../services/meta-capi.service';
import { ClickHouseService } from '../services/clickhouse.service';
export declare class MetaCapiProcessor implements OnModuleInit {
    private readonly redis;
    private readonly metaCapiService;
    private readonly clickhouse;
    private readonly logger;
    private worker;
    constructor(redis: IORedis, metaCapiService: MetaCapiService, clickhouse: ClickHouseService);
    onModuleInit(): void;
    private process;
}
//# sourceMappingURL=meta-capi.processor.d.ts.map