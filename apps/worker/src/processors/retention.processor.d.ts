import { OnModuleInit } from '@nestjs/common';
import IORedis from 'ioredis';
import { ClickHouseService } from '../services/clickhouse.service';
import { PrismaService } from '../services/prisma.service';
export declare class RetentionProcessor implements OnModuleInit {
    private readonly redis;
    private readonly clickhouse;
    private readonly prisma;
    private readonly logger;
    private worker;
    private queue;
    constructor(redis: IORedis, clickhouse: ClickHouseService, prisma: PrismaService);
    onModuleInit(): void;
    private process;
    private processAllProjects;
    private cleanupConsentLogs;
}
//# sourceMappingURL=retention.processor.d.ts.map