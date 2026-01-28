export interface IngestEventDto {
    event_id: string;
    event_name: string;
    event_time: number;
    anonymous_id?: string;
    user_id?: string;
    session_id: string;
    url?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    user_agent?: string;
    consent_categories?: string[];
    order_id?: string;
    value?: number;
    currency?: string;
    payload?: Record<string, unknown>;
}
export interface BatchEventsDto {
    events: IngestEventDto[];
}
export interface SingleEventDto extends IngestEventDto {
}
export interface ConsentDto {
    anonymous_id: string;
    categories: string[];
    source?: string;
}
export interface IngestResponse {
    requestId: string;
    accepted: number;
    rejected: number;
    errors?: Array<{
        index: number;
        message: string;
    }>;
}
//# sourceMappingURL=events.dto.d.ts.map