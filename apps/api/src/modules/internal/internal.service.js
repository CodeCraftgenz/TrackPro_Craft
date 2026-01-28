"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const api_keys_service_1 = require("../projects/api-keys.service");
let InternalService = class InternalService {
    configService;
    prisma;
    apiKeysService;
    internalSecret;
    constructor(configService, prisma, apiKeysService) {
        this.configService = configService;
        this.prisma = prisma;
        this.apiKeysService = apiKeysService;
        this.internalSecret = this.configService.get('INTERNAL_API_SECRET', '');
    }
    validateInternalRequest(secret) {
        if (this.configService.get('NODE_ENV') === 'development') {
            return;
        }
        if (!this.internalSecret || secret !== this.internalSecret) {
            throw new common_1.UnauthorizedException('Invalid internal secret');
        }
    }
    async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('tp_')) {
            return null;
        }
        const result = await this.apiKeysService.validateApiKey(apiKey);
        if (!result) {
            return null;
        }
        const project = await this.prisma.project.findUnique({
            where: { id: result.projectId },
            select: { tenantId: true, status: true },
        });
        if (!project) {
            return null;
        }
        return {
            projectId: result.projectId,
            tenantId: project.tenantId,
            scopes: result.scopes,
            status: project.status,
        };
    }
};
exports.InternalService = InternalService;
exports.InternalService = InternalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        api_keys_service_1.ApiKeysService])
], InternalService);
//# sourceMappingURL=internal.service.js.map