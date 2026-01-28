import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService, EventRow } from './clickhouse.service';
export declare class AnalyticsService {
    private readonly prisma;
    private readonly clickhouse;
    constructor(prisma: PrismaService, clickhouse: ClickHouseService);
    getProjectEvents(projectId: string, tenantId: string, userId: string, options?: {
        limit?: number;
        offset?: number;
        eventName?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        events: EventRow[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getProjectStats(projectId: string, tenantId: string, userId: string, options?: {
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
    getDashboardStats(tenantId: string, userId: string): Promise<{
        totalProjects: number;
        totalEvents: number;
        eventsToday: number;
        uniqueUsers: number;
    }>;
    getMetaDeliveryLogs(projectId: string, tenantId: string, userId: string, options?: {
        limit?: number;
        offset?: number;
        status?: string;
    }): Promise<{
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
    getMetaDeliveryStats(projectId: string, tenantId: string, userId: string): Promise<{
        total: number;
        delivered: number;
        failed: number;
        retrying: number;
    }>;
    private checkProjectAccess;
}
//# sourceMappingURL=analytics.service.d.ts.map