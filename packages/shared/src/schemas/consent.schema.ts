import { z } from 'zod';

import { CONSENT_CATEGORIES } from '../constants';

export const consentCategoriesSchema = z.array(
  z.enum([
    CONSENT_CATEGORIES.NECESSARY,
    CONSENT_CATEGORIES.ANALYTICS,
    CONSENT_CATEGORIES.MARKETING,
    CONSENT_CATEGORIES.PREFERENCES,
  ]),
);

export const updateConsentSchema = z.object({
  anonymous_id: z.string().min(1).max(100),
  categories: consentCategoriesSchema,
  source: z.enum(['sdk', 'api', 'manual']).optional().default('sdk'),
});

export const consentLogSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  anonymousId: z.string(),
  categories: consentCategoriesSchema,
  source: z.string(),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});

export type ConsentCategories = z.infer<typeof consentCategoriesSchema>;
export type UpdateConsentInput = z.infer<typeof updateConsentSchema>;
export type ConsentLog = z.infer<typeof consentLogSchema>;
