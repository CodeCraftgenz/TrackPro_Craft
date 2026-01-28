import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export interface MetaCapiJobData {
    projectId: string;
    eventId: string;
    eventName: string;
    eventTime: number;
    userData: {
        email?: string;
        phone?: string;
        externalId?: string;
        clientIpAddress?: string;
        clientUserAgent?: string;
        fbp?: string;
        fbc?: string;
    };
    customData?: {
        value?: number;
        currency?: string;
        contentIds?: string[];
        contentType?: string;
        orderId?: string;
    };
    eventSourceUrl?: string;
}
export interface AggregateJobData {
    projectId: string;
    date: string;
}
export interface ExportJobData {
    exportJobId: string;
    projectId: string;
    type: string;
    params: Record<string, unknown>;
}
export interface RetentionJobData {
    projectId: string;
    retentionDays: number;
}
export declare class QueueService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly connection;
    private readonly metaCapiQueue;
    private readonly aggregatesQueue;
    private readonly exportsQueue;
    private readonly retentionQueue;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    addMetaCapiJob(data: MetaCapiJobData): Promise<string>;
    addAggregateJob(data: AggregateJobData): Promise<string>;
    addExportJob(data: ExportJobData): Promise<string>;
    addRetentionJob(data: RetentionJobData): Promise<string>;
    getMetaCapiQueue(): Queue<MetaCapiJobData>;
    getAggregatesQueue(): Queue<AggregateJobData>;
    getExportsQueue(): Queue<ExportJobData>;
    getRetentionQueue(): Queue<RetentionJobData>;
}
//# sourceMappingURL=queue.service.d.ts.map