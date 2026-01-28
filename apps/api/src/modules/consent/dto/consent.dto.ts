import { z } from 'zod';

export const consentCategoriesSchema = z.object({
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false),
  personalization: z.boolean().default(false),
  necessary: z.boolean().default(true),
});

export const recordConsentSchema = z.object({
  anonymousId: z.string().min(1, 'Anonymous ID é obrigatório'),
  categories: consentCategoriesSchema,
  source: z.enum(['sdk', 'api', 'manual']).default('sdk'),
});

export const updateConsentSettingsSchema = z.object({
  bannerEnabled: z.boolean().optional(),
  bannerPosition: z.enum(['bottom', 'top', 'center']).optional(),
  bannerTheme: z.enum(['light', 'dark', 'auto']).optional(),
  privacyPolicyUrl: z.string().url().optional().or(z.literal('')),
  cookiePolicyUrl: z.string().url().optional().or(z.literal('')),
  categoriesConfig: z
    .object({
      analytics: z.object({
        enabled: z.boolean(),
        description: z.string(),
      }),
      marketing: z.object({
        enabled: z.boolean(),
        description: z.string(),
      }),
      personalization: z.object({
        enabled: z.boolean(),
        description: z.string(),
      }),
    })
    .optional(),
});

export type ConsentCategories = z.infer<typeof consentCategoriesSchema>;
export type RecordConsentDto = z.infer<typeof recordConsentSchema>;
export type UpdateConsentSettingsDto = z.infer<typeof updateConsentSettingsSchema>;
