import { OnModuleInit } from '@nestjs/common';
import IORedis from 'ioredis';
import { PrismaService } from './prisma.service';
export declare class SchedulerService implements OnModuleInit {
    private readonly redis;
    private readonly prisma;
    private readonly logger;
    private retentionQueue;
    private aggregatesQueue;
    constructor(redis: IORedis, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private scheduleRetentionCleanup;
    private scheduleAggregatesRebuild;
    triggerRetentionCleanup(): Promise<void>;
    triggerAggregatesRebuild(date?: string): Promise<void>;
    private getYesterdayDate;
}
//# sourceMappingURL=scheduler.service.d.ts.map