import { z } from 'zod';
export declare const consentCategoriesSchema: z.ZodObject<{
    analytics: z.ZodDefault<z.ZodBoolean>;
    marketing: z.ZodDefault<z.ZodBoolean>;
    personalization: z.ZodDefault<z.ZodBoolean>;
    necessary: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    necessary: boolean;
}, {
    analytics?: boolean | undefined;
    marketing?: boolean | undefined;
    personalization?: boolean | undefined;
    necessary?: boolean | undefined;
}>;
export declare const recordConsentSchema: z.ZodObject<{
    anonymousId: z.ZodString;
    categories: z.ZodObject<{
        analytics: z.ZodDefault<z.ZodBoolean>;
        marketing: z.ZodDefault<z.ZodBoolean>;
        personalization: z.ZodDefault<z.ZodBoolean>;
        necessary: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        analytics: boolean;
        marketing: boolean;
        personalization: boolean;
        necessary: boolean;
    }, {
        analytics?: boolean | undefined;
        marketing?: boolean | undefined;
        personalization?: boolean | undefined;
        necessary?: boolean | undefined;
    }>;
    source: z.ZodDefault<z.ZodEnum<["sdk", "api", "manual"]>>;
}, "strip", z.ZodTypeAny, {
    anonymousId: string;
    categories: {
        analytics: boolean;
        marketing: boolean;
        personalization: boolean;
        necessary: boolean;
    };
    source: "sdk" | "api" | "manual";
}, {
    anonymousId: string;
    categories: {
        analytics?: boolean | undefined;
        marketing?: boolean | undefined;
        personalization?: boolean | undefined;
        necessary?: boolean | undefined;
    };
    source?: "sdk" | "api" | "manual" | undefined;
}>;
export declare const updateConsentSettingsSchema: z.ZodObject<{
    bannerEnabled: z.ZodOptional<z.ZodBoolean>;
    bannerPosition: z.ZodOptional<z.ZodEnum<["bottom", "top", "center"]>>;
    bannerTheme: z.ZodOptional<z.ZodEnum<["light", "dark", "auto"]>>;
    privacyPolicyUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    cookiePolicyUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    categoriesConfig: z.ZodOptional<z.ZodObject<{
        analytics: z.ZodObject<{
            enabled: z.ZodBoolean;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            enabled: boolean;
        }, {
            description: string;
            enabled: boolean;
        }>;
        marketing: z.ZodObject<{
            enabled: z.ZodBoolean;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            enabled: boolean;
        }, {
            description: string;
            enabled: boolean;
        }>;
        personalization: z.ZodObject<{
            enabled: z.ZodBoolean;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            enabled: boolean;
        }, {
            description: string;
            enabled: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        analytics: {
            description: string;
            enabled: boolean;
        };
        marketing: {
            description: string;
            enabled: boolean;
        };
        personalization: {
            description: string;
            enabled: boolean;
        };
    }, {
        analytics: {
            description: string;
            enabled: boolean;
        };
        marketing: {
            description: string;
            enabled: boolean;
        };
        personalization: {
            description: string;
            enabled: boolean;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    bannerEnabled?: boolean | undefined;
    bannerPosition?: "bottom" | "top" | "center" | undefined;
    bannerTheme?: "light" | "dark" | "auto" | undefined;
    privacyPolicyUrl?: string | undefined;
    cookiePolicyUrl?: string | undefined;
    categoriesConfig?: {
        analytics: {
            description: string;
            enabled: boolean;
        };
        marketing: {
            description: string;
            enabled: boolean;
        };
        personalization: {
            description: string;
            enabled: boolean;
        };
    } | undefined;
}, {
    bannerEnabled?: boolean | undefined;
    bannerPosition?: "bottom" | "top" | "center" | undefined;
    bannerTheme?: "light" | "dark" | "auto" | undefined;
    privacyPolicyUrl?: string | undefined;
    cookiePolicyUrl?: string | undefined;
    categoriesConfig?: {
        analytics: {
            description: string;
            enabled: boolean;
        };
        marketing: {
            description: string;
            enabled: boolean;
        };
        personalization: {
            description: string;
            enabled: boolean;
        };
    } | undefined;
}>;
export type ConsentCategories = z.infer<typeof consentCategoriesSchema>;
export type RecordConsentDto = z.infer<typeof recordConsentSchema>;
export type UpdateConsentSettingsDto = z.infer<typeof updateConsentSettingsSchema>;
//# sourceMappingURL=consent.dto.d.ts.map