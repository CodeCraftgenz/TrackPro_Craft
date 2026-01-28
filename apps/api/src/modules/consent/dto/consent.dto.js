"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConsentSettingsSchema = exports.recordConsentSchema = exports.consentCategoriesSchema = void 0;
const zod_1 = require("zod");
exports.consentCategoriesSchema = zod_1.z.object({
    analytics: zod_1.z.boolean().default(false),
    marketing: zod_1.z.boolean().default(false),
    personalization: zod_1.z.boolean().default(false),
    necessary: zod_1.z.boolean().default(true),
});
exports.recordConsentSchema = zod_1.z.object({
    anonymousId: zod_1.z.string().min(1, 'Anonymous ID é obrigatório'),
    categories: exports.consentCategoriesSchema,
    source: zod_1.z.enum(['sdk', 'api', 'manual']).default('sdk'),
});
exports.updateConsentSettingsSchema = zod_1.z.object({
    bannerEnabled: zod_1.z.boolean().optional(),
    bannerPosition: zod_1.z.enum(['bottom', 'top', 'center']).optional(),
    bannerTheme: zod_1.z.enum(['light', 'dark', 'auto']).optional(),
    privacyPolicyUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    cookiePolicyUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    categoriesConfig: zod_1.z
        .object({
        analytics: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            description: zod_1.z.string(),
        }),
        marketing: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            description: zod_1.z.string(),
        }),
        personalization: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            description: zod_1.z.string(),
        }),
    })
        .optional(),
});
//# sourceMappingURL=consent.dto.js.map