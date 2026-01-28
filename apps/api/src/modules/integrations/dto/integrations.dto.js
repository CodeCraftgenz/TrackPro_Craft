"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMetaIntegrationSchema = exports.createMetaIntegrationSchema = void 0;
const zod_1 = require("zod");
exports.createMetaIntegrationSchema = zod_1.z.object({
    pixelId: zod_1.z.string().min(1, 'Pixel ID é obrigatório'),
    accessToken: zod_1.z.string().min(1, 'Access Token é obrigatório'),
    testEventCode: zod_1.z.string().optional(),
});
exports.updateMetaIntegrationSchema = zod_1.z.object({
    pixelId: zod_1.z.string().min(1).optional(),
    accessToken: zod_1.z.string().min(1).optional(),
    testEventCode: zod_1.z.string().nullable().optional(),
    enabled: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=integrations.dto.js.map