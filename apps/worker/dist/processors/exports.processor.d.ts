import { OnModuleInit } from '@nestjs/common';
import IORedis from 'ioredis';
import { ClickHouseService } from '../services/clickhouse.service';
import { PrismaService } from '../services/prisma.service';
import { StorageService } from '../services/storage.service';
export declare class ExportsProcessor implements OnModuleInit {
    private readonly redis;
    private readonly clickhouse;
    private readonly prisma;
    private readonly storage;
    private readonly logger;
    private worker;
    constructor(redis: IORedis, clickhouse: ClickHouseService, prisma: PrismaService, storage: StorageService);
    onModuleInit(): void;
    private process;
    private exportEventsRaw;
    private exportEventsAgg;
    private convertToCSV;
    private getDefaultStartDate;
    private getDefaultEndDate;
}
//# sourceMappingURL=exports.processor.d.ts.map