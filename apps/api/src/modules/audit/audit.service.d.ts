import { PrismaService } from '../../prisma/prisma.service';
export interface AuditLogData {
    tenantId: string;
    actorUserId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    payload?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(data: AuditLogData): Promise<void>;
    getLogsForTenant(tenantId: string, options?: {
        limit?: number;
        offset?: number;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        logs: ({
            actor: {
                name: string;
                id: string;
                email: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            tenantId: string;
            action: string;
            resource: string;
            resourceId: string | null;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            actorUserId: string | null;
        })[];
        total: number;
        limit: number;
        offset: number;
    }>;
}
//# sourceMappingURL=audit.service.d.ts.map