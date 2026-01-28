import { ConsentService } from './consent.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class ConsentController {
    private readonly consentService;
    constructor(consentService: ConsentService);
    recordConsent(projectId: string, body: unknown, ip: string, userAgent: string): Promise<{
        id: string;
        anonymousId: string;
        categories: import("./dto/consent.dto").ConsentCategories;
        createdAt: Date;
    }>;
    getConsentLogs(tenantId: string, projectId: string, limit?: string, offset?: string, anonymousId?: string, req?: AuthRequest): Promise<{
        logs: {
            id: string;
            anonymousId: string;
            categories: import("./dto/consent.dto").ConsentCategories;
            source: string;
            createdAt: Date;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getConsentStats(tenantId: string, projectId: string, req?: AuthRequest): Promise<{
        total: number;
        last30Days: number;
        last7Days: number;
        uniqueUsers: number;
        acceptanceRates: {
            analytics: number;
            marketing: number;
            personalization: number;
        };
    }>;
    getConsentSettings(tenantId: string, projectId: string, req?: AuthRequest): Promise<import("./consent.service").ConsentSettings>;
    updateConsentSettings(tenantId: string, projectId: string, body: unknown, req?: AuthRequest): Promise<{
        bannerEnabled: boolean;
        bannerPosition: "bottom" | "top" | "center";
        bannerTheme: "light" | "dark" | "auto";
        privacyPolicyUrl: string;
        cookiePolicyUrl: string;
        categoriesConfig: {
            analytics: {
                enabled: boolean;
                description: string;
            };
            marketing: {
                enabled: boolean;
                description: string;
            };
            personalization: {
                enabled: boolean;
                description: string;
            };
        };
    }>;
    getUserConsent(projectId: string, anonymousId: string): Promise<{
        id: string;
        anonymousId: string;
        categories: import("./dto/consent.dto").ConsentCategories;
        createdAt: Date;
    } | null>;
}
export {};
//# sourceMappingURL=consent.controller.d.ts.map