import { ReportsService } from './reports.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getOverviewReport(tenantId: string, projectId: string, startDate?: string, endDate?: string, req?: AuthRequest): Promise<import("./reports.service").OverviewReport>;
    getFunnelReport(tenantId: string, projectId: string, startDate?: string, endDate?: string, steps?: string, req?: AuthRequest): Promise<import("./reports.service").FunnelReport>;
    getPerformanceReport(tenantId: string, projectId: string, startDate?: string, endDate?: string, req?: AuthRequest): Promise<import("./reports.service").PerformanceReport>;
    getQualityReport(tenantId: string, projectId: string, req?: AuthRequest): Promise<import("./reports.service").QualityReport>;
}
export {};
//# sourceMappingURL=reports.controller.d.ts.map