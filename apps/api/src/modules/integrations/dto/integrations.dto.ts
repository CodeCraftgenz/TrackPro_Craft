import { z } from 'zod';

export const createMetaIntegrationSchema = z.object({
  pixelId: z.string().min(1, 'Pixel ID é obrigatório'),
  accessToken: z.string().min(1, 'Access Token é obrigatório'),
  testEventCode: z.string().optional(),
});

export const updateMetaIntegrationSchema = z.object({
  pixelId: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  testEventCode: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

export type CreateMetaIntegrationDto = z.infer<typeof createMetaIntegrationSchema>;
export type UpdateMetaIntegrationDto = z.infer<typeof updateMetaIntegrationSchema>;
