import { PrismaService } from '../../prisma/prisma.service';
import { RecordConsentDto, UpdateConsentSettingsDto, ConsentCategories } from './dto/consent.dto';
export interface ConsentSettings {
    bannerEnabled: boolean;
    bannerPosition: 'bottom' | 'top' | 'center';
    bannerTheme: 'light' | 'dark' | 'auto';
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
}
export declare class ConsentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordConsent(projectId: string, dto: RecordConsentDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        anonymousId: string;
        categories: ConsentCategories;
        createdAt: Date;
    }>;
    getConsentLogs(projectId: string, tenantId: string, userId: string, options?: {
        limit?: number;
        offset?: number;
        anonymousId?: string;
    }): Promise<{
        logs: {
            id: string;
            anonymousId: string;
            categories: ConsentCategories;
            source: string;
            createdAt: Date;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getConsentStats(projectId: string, tenantId: string, userId: string): Promise<{
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
    getConsentSettings(projectId: string, tenantId: string, userId: string): Promise<ConsentSettings>;
    updateConsentSettings(projectId: string, tenantId: string, userId: string, dto: UpdateConsentSettingsDto): Promise<{
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
    getLatestConsentForUser(projectId: string, anonymousId: string): Promise<{
        id: string;
        anonymousId: string;
        categories: ConsentCategories;
        createdAt: Date;
    } | null>;
    private checkProjectAccess;
}
//# sourceMappingURL=consent.service.d.ts.map