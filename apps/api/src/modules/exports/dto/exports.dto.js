"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExportSchema = void 0;
const zod_1 = require("zod");
exports.createExportSchema = zod_1.z.object({
    type: zod_1.z.enum(['EVENTS_RAW', 'EVENTS_AGG', 'FUNNEL', 'REVENUE']),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    eventNames: zod_1.z.array(zod_1.z.string()).optional(),
    format: zod_1.z.enum(['csv', 'json']).default('csv'),
});
//# sourceMappingURL=exports.dto.js.map