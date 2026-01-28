import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ClickHouseService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private baseUrl;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    query<T = unknown>(sql: string): Promise<T>;
    insertMetaDeliveryLog(data: {
        event_id: string;
        project_id: string;
        status: string;
        attempts: number;
        last_error?: string;
    }): Promise<void>;
    deleteOldEvents(projectId: string, retentionDays: number): Promise<number>;
    deleteOldMetaDeliveryLogs(projectId: string, retentionDays: number): Promise<void>;
    deleteUserData(projectId: string, anonymousId: string): Promise<void>;
    anonymizeUserData(projectId: string, anonymousId: string): Promise<void>;
    private escape;
    getEventsForExport(projectId: string, startDate: string, endDate: string, limit: number, offset: number): Promise<unknown[]>;
    getAggregatedEventsForExport(projectId: string, startDate: string, endDate: string): Promise<unknown[]>;
    buildDailyAggregates(projectId: string, date: string): Promise<void>;
}
//# sourceMappingURL=clickhouse.service.d.ts.map