import { z } from 'zod';
export declare const createMetaIntegrationSchema: z.ZodObject<{
    pixelId: z.ZodString;
    accessToken: z.ZodString;
    testEventCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    pixelId: string;
    testEventCode?: string | undefined;
}, {
    accessToken: string;
    pixelId: string;
    testEventCode?: string | undefined;
}>;
export declare const updateMetaIntegrationSchema: z.ZodObject<{
    pixelId: z.ZodOptional<z.ZodString>;
    accessToken: z.ZodOptional<z.ZodString>;
    testEventCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    accessToken?: string | undefined;
    pixelId?: string | undefined;
    testEventCode?: string | null | undefined;
    enabled?: boolean | undefined;
}, {
    accessToken?: string | undefined;
    pixelId?: string | undefined;
    testEventCode?: string | null | undefined;
    enabled?: boolean | undefined;
}>;
export type CreateMetaIntegrationDto = z.infer<typeof createMetaIntegrationSchema>;
export type UpdateMetaIntegrationDto = z.infer<typeof updateMetaIntegrationSchema>;
//# sourceMappingURL=integrations.dto.d.ts.map