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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const integrations_service_1 = require("./integrations.service");
const integrations_dto_1 = require("./dto/integrations.dto");
let IntegrationsController = class IntegrationsController {
    integrationsService;
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async getMetaIntegration(tenantId, projectId, req) {
        return this.integrationsService.getMetaIntegration(projectId, tenantId, req.user.userId);
    }
    async createMetaIntegration(tenantId, projectId, body, req) {
        const result = integrations_dto_1.createMetaIntegrationSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        return this.integrationsService.createMetaIntegration(projectId, tenantId, req.user.userId, result.data);
    }
    async updateMetaIntegration(tenantId, projectId, body, req) {
        const result = integrations_dto_1.updateMetaIntegrationSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        return this.integrationsService.updateMetaIntegration(projectId, tenantId, req.user.userId, result.data);
    }
    async deleteMetaIntegration(tenantId, projectId, req) {
        await this.integrationsService.deleteMetaIntegration(projectId, tenantId, req.user.userId);
    }
    async testMetaIntegration(tenantId, projectId, req) {
        return this.integrationsService.testMetaIntegration(projectId, tenantId, req.user.userId);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)('meta'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getMetaIntegration", null);
__decorate([
    (0, common_1.Post)('meta'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "createMetaIntegration", null);
__decorate([
    (0, common_1.Put)('meta'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "updateMetaIntegration", null);
__decorate([
    (0, common_1.Delete)('meta'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "deleteMetaIntegration", null);
__decorate([
    (0, common_1.Post)('meta/test'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "testMetaIntegration", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('tenants/:tenantId/projects/:projectId/integrations'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map