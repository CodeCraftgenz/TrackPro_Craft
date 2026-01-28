import { PrivacyService } from './privacy.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class PrivacyController {
    private readonly privacyService;
    constructor(privacyService: PrivacyService);
    searchUsers(tenantId: string, projectId: string, query?: string, limit?: string, offset?: string, req?: AuthRequest): Promise<{
        users: Array<{
            anonymousId: string;
            consentLogsCount: number;
            lastActivity: Date;
        }>;
        total: number;
    }>;
    getUserDataSummary(tenantId: string, projectId: string, anonymousId: string, req?: AuthRequest): Promise<{
        anonymousId: string;
        eventCount: number;
        consentLogsCount: number;
        firstSeen?: Date;
        lastSeen?: Date;
    }>;
    deleteUserData(tenantId: string, projectId: string, anonymousId: string, body: unknown, req?: AuthRequest): Promise<{
        success: boolean;
        message: string;
        eventsDeleted: number;
    }>;
    anonymizeUserData(tenantId: string, projectId: string, anonymousId: string, body: unknown, req?: AuthRequest): Promise<{
        success: boolean;
        message: string;
        newAnonymousId: string;
        eventsAnonymized: number;
    }>;
}
export {};
//# sourceMappingURL=privacy.controller.d.ts.map