import { z } from 'zod';

export const deleteUserDataSchema = z.object({
  anonymousId: z.string().min(1, 'anonymousId is required'),
  reason: z.string().optional(),
});

export const anonymizeUserDataSchema = z.object({
  anonymousId: z.string().min(1, 'anonymousId is required'),
  reason: z.string().optional(),
});

export const exportUserDataSchema = z.object({
  anonymousId: z.string().min(1, 'anonymousId is required'),
  format: z.enum(['json', 'csv']).default('json'),
});

export type DeleteUserDataDto = z.infer<typeof deleteUserDataSchema>;
export type AnonymizeUserDataDto = z.infer<typeof anonymizeUserDataSchema>;
export type ExportUserDataDto = z.infer<typeof exportUserDataSchema>;
