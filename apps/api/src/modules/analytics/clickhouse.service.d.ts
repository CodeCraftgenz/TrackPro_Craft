import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface EventRow {
    event_id: string;
    project_id: string;
    event_name: string;
    event_time: number;
    received_at: number;
    anonymous_id: string;
    user_id: string;
    session_id: string;
    url: string;
    path: string;
    referrer: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    ip: string;
    user_agent: string;
    country: string;
    value: number;
    currency: string;
}
export declare class ClickHouseService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private baseUrl;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private query;
    queryRows<T>(sql: string): Promise<T[]>;
    getRecentEvents(projectId: string, options?: {
        limit?: number;
        offset?: number;
        eventName?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        events: EventRow[];
        total: number;
    }>;
    getEventStats(projectId: string, options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        totalEvents: number;
        eventsToday: number;
        uniqueUsers: number;
        topEvents: Array<{
            event_name: string;
            count: number;
        }>;
    }>;
    ping(): Promise<boolean>;
    getMetaDeliveryLogs(projectId: string, options?: {
        limit?: number;
        offset?: number;
        status?: string;
    }): Promise<{
        logs: Array<{
            event_id: string;
            project_id: string;
            status: string;
            attempts: number;
            last_error: string;
            delivered_at: number;
        }>;
        total: number;
    }>;
    getMetaDeliveryStats(projectId: string): Promise<{
        total: number;
        delivered: number;
        failed: number;
        retrying: number;
    }>;
    deleteUserData(projectId: string, anonymousId: string): Promise<void>;
    anonymizeUserData(projectId: string, anonymousId: string): Promise<string>;
    getUserEventCount(projectId: string, anonymousId: string): Promise<number>;
    private escape;
}
//# sourceMappingURL=clickhouse.service.d.ts.map