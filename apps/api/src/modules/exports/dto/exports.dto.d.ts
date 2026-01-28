import { z } from 'zod';
export declare const createExportSchema: z.ZodObject<{
    type: z.ZodEnum<["EVENTS_RAW", "EVENTS_AGG", "FUNNEL", "REVENUE"]>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    eventNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    format: z.ZodDefault<z.ZodEnum<["csv", "json"]>>;
}, "strip", z.ZodTypeAny, {
    type: "EVENTS_RAW" | "EVENTS_AGG" | "FUNNEL" | "REVENUE";
    format: "csv" | "json";
    startDate?: string | undefined;
    endDate?: string | undefined;
    eventNames?: string[] | undefined;
}, {
    type: "EVENTS_RAW" | "EVENTS_AGG" | "FUNNEL" | "REVENUE";
    format?: "csv" | "json" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    eventNames?: string[] | undefined;
}>;
export type CreateExportDto = z.infer<typeof createExportSchema>;
//# sourceMappingURL=exports.dto.d.ts.map