import { z } from 'zod';
export declare const deleteUserDataSchema: z.ZodObject<{
    anonymousId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    anonymousId: string;
    reason?: string | undefined;
}, {
    anonymousId: string;
    reason?: string | undefined;
}>;
export declare const anonymizeUserDataSchema: z.ZodObject<{
    anonymousId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    anonymousId: string;
    reason?: string | undefined;
}, {
    anonymousId: string;
    reason?: string | undefined;
}>;
export declare const exportUserDataSchema: z.ZodObject<{
    anonymousId: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<["json", "csv"]>>;
}, "strip", z.ZodTypeAny, {
    format: "csv" | "json";
    anonymousId: string;
}, {
    anonymousId: string;
    format?: "csv" | "json" | undefined;
}>;
export type DeleteUserDataDto = z.infer<typeof deleteUserDataSchema>;
export type AnonymizeUserDataDto = z.infer<typeof anonymizeUserDataSchema>;
export type ExportUserDataDto = z.infer<typeof exportUserDataSchema>;
//# sourceMappingURL=privacy.dto.d.ts.map