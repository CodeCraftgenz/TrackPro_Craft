import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from '../analytics/clickhouse.service';
import { ReportsCacheService } from './reports-cache.service';
interface DateRange {
    startDate?: string;
    endDate?: string;
}
export interface OverviewReport {
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
    eventsToday: number;
    eventsTrend: number;
    topEvents: Array<{
        event_name: string;
        count: number;
    }>;
    eventsByDay: Array<{
        date: string;
        count: number;
    }>;
}
interface FunnelStep {
    name: string;
    count: number;
    percentage: number;
    dropoff: number;
}
export interface FunnelReport {
    steps: FunnelStep[];
    conversionRate: number;
    totalStarted: number;
    totalCompleted: number;
}
export interface PerformanceReport {
    bySource: Array<{
        source: string;
        events: number;
        users: number;
        sessions: number;
        revenue: number;
    }>;
    byMedium: Array<{
        medium: string;
        events: number;
        users: number;
        revenue: number;
    }>;
    byCampaign: Array<{
        campaign: string;
        events: number;
        users: number;
        revenue: number;
    }>;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
}
export interface QualityReport {
    eventValidation: {
        total: number;
        valid: number;
        invalid: number;
        validationRate: number;
    };
    metaDelivery: {
        total: number;
        delivered: number;
        failed: number;
        retrying: number;
        deliveryRate: number;
    };
    recentErrors: Array<{
        type: string;
        message: string;
        count: number;
    }>;
}
export declare class ReportsService {
    private readonly prisma;
    private readonly clickhouse;
    private readonly cache;
    constructor(prisma: PrismaService, clickhouse: ClickHouseService, cache: ReportsCacheService);
    getOverviewReport(projectId: string, tenantId: string, userId: string, range: DateRange): Promise<OverviewReport>;
    getFunnelReport(projectId: string, tenantId: string, userId: string, range: DateRange, steps: string[]): Promise<FunnelReport>;
    getPerformanceReport(projectId: string, tenantId: string, userId: string, range: DateRange): Promise<PerformanceReport>;
    getQualityReport(projectId: string, tenantId: string, userId: string): Promise<QualityReport>;
    private queryOverview;
    private queryFunnel;
    private queryPerformance;
    private queryQuality;
    private getDateRange;
    private escape;
    private checkProjectAccess;
}
export {};
//# sourceMappingURL=reports.service.d.ts.map