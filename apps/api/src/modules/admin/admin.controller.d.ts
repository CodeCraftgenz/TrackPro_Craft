import { AdminService } from './admin.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getSystemStats(req: AuthRequest): Promise<{
        users: number;
        tenants: number;
        projects: number;
        activeProjects: number;
        totalEvents: number;
    }>;
    getQueuesOverview(req: AuthRequest): Promise<import("./admin.service").QueueStats[]>;
    getQueueJobs(req: AuthRequest, queueName: string, status?: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed', limit?: string): Promise<import("./admin.service").QueueJob[]>;
    retryJob(req: AuthRequest, queueName: string, jobId: string): Promise<{
        success: boolean;
    }>;
    removeJob(req: AuthRequest, queueName: string, jobId: string): Promise<void>;
    pauseQueue(req: AuthRequest, queueName: string): Promise<{
        success: boolean;
    }>;
    resumeQueue(req: AuthRequest, queueName: string): Promise<{
        success: boolean;
    }>;
    cleanQueue(req: AuthRequest, queueName: string, status?: 'completed' | 'failed', olderThanHours?: string): Promise<{
        cleaned: number;
    }>;
    getAuditLogs(req: AuthRequest, limit?: string, offset?: string, userId?: string, entity?: string, action?: string): Promise<{
        logs: import("./admin.service").AuditEntry[];
        total: number;
    }>;
    getErrorLogs(req: AuthRequest, limit?: string, offset?: string, level?: string): Promise<{
        logs: import("./admin.service").ErrorLogEntry[];
        total: number;
    }>;
}
export {};
//# sourceMappingURL=admin.controller.d.ts.map