import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from '../analytics/clickhouse.service';
import { DeleteUserDataDto, AnonymizeUserDataDto } from './dto/privacy.dto';
export interface PrivacyRequestLog {
    id: string;
    projectId: string;
    anonymousId: string;
    requestType: 'DELETE' | 'ANONYMIZE' | 'EXPORT';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    requestedBy: string;
    reason?: string;
    completedAt?: Date;
    createdAt: Date;
}
export declare class PrivacyService {
    private readonly prisma;
    private readonly clickhouse;
    private readonly logger;
    constructor(prisma: PrismaService, clickhouse: ClickHouseService);
    deleteUserData(projectId: string, tenantId: string, userId: string, dto: DeleteUserDataDto): Promise<{
        success: boolean;
        message: string;
        eventsDeleted: number;
    }>;
    anonymizeUserData(projectId: string, tenantId: string, userId: string, dto: AnonymizeUserDataDto): Promise<{
        success: boolean;
        message: string;
        newAnonymousId: string;
        eventsAnonymized: number;
    }>;
    getUserDataSummary(projectId: string, tenantId: string, userId: string, anonymousId: string): Promise<{
        anonymousId: string;
        eventCount: number;
        consentLogsCount: number;
        firstSeen?: Date;
        lastSeen?: Date;
    }>;
    searchUsers(projectId: string, tenantId: string, userId: string, options?: {
        query?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        users: Array<{
            anonymousId: string;
            consentLogsCount: number;
            lastActivity: Date;
        }>;
        total: number;
    }>;
    private checkProjectAccess;
}
//# sourceMappingURL=privacy.service.d.ts.map