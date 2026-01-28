import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface EventRow {
    event_id: string;
    project_id: string;
    event_name: string;
    event_time: number;
    received_at: number;
    anonymous_id: string;
    user_id?: string;
    session_id: string;
    url?: string;
    path?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    ip?: string;
    user_agent?: string;
    country?: string;
    consent_categories: string[];
    order_id?: string;
    value?: number;
    currency?: string;
    payload_json: string;
}
export interface InvalidEventRow {
    request_id: string;
    reason: string;
    raw_payload: string;
    received_at: number;
}
export declare class ClickHouseService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private baseUrl;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private query;
    insertEvents(events: EventRow[]): Promise<void>;
    insertInvalidEvent(event: InvalidEventRow): Promise<void>;
    ping(): Promise<boolean>;
    private escape;
}
//# sourceMappingURL=clickhouse.service.d.ts.map