"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportUserDataSchema = exports.anonymizeUserDataSchema = exports.deleteUserDataSchema = void 0;
const zod_1 = require("zod");
exports.deleteUserDataSchema = zod_1.z.object({
    anonymousId: zod_1.z.string().min(1, 'anonymousId is required'),
    reason: zod_1.z.string().optional(),
});
exports.anonymizeUserDataSchema = zod_1.z.object({
    anonymousId: zod_1.z.string().min(1, 'anonymousId is required'),
    reason: zod_1.z.string().optional(),
});
exports.exportUserDataSchema = zod_1.z.object({
    anonymousId: zod_1.z.string().min(1, 'anonymousId is required'),
    format: zod_1.z.enum(['json', 'csv']).default('json'),
});
//# sourceMappingURL=privacy.dto.js.map