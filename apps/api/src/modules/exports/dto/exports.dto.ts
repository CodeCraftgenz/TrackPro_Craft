import { z } from 'zod';

export const createExportSchema = z.object({
  type: z.enum(['EVENTS_RAW', 'EVENTS_AGG', 'FUNNEL', 'REVENUE']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventNames: z.array(z.string()).optional(),
  format: z.enum(['csv', 'json']).default('csv'),
});

export type CreateExportDto = z.infer<typeof createExportSchema>;
