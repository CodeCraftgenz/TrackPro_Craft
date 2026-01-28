import { AnalyticsService } from './analytics.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(tenantId: string, req: AuthRequest): Promise<{
        totalProjects: number;
        totalEvents: number;
        eventsToday: number;
        uniqueUsers: number;
    }>;
    getProjectEvents(tenantId: string, projectId: string, limit?: string, offset?: string, eventName?: string, startDate?: string, endDate?: string, req?: AuthRequest): Promise<{
        events: import("./clickhouse.service").EventRow[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getProjectStats(tenantId: string, projectId: string, startDate?: string, endDate?: string, req?: AuthRequest): Promise<{
        totalEvents: number;
        eventsToday: number;
        uniqueUsers: number;
        topEvents: Array<{
            event_name: string;
            count: number;
        }>;
    }>;
    getMetaDeliveryLogs(tenantId: string, projectId: string, limit?: string, offset?: string, status?: string, req?: AuthRequest): Promise<{
        logs: {
            event_id: string;
            project_id: string;
            status: string;
            attempts: number;
            last_error: string;
            delivered_at: number;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getMetaDeliveryStats(tenantId: string, projectId: string, req?: AuthRequest): Promise<{
        total: number;
        delivered: number;
        failed: number;
        retrying: number;
    }>;
}
export {};
//# sourceMappingURL=analytics.controller.d.ts.map