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
exports.ConsentController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const consent_service_1 = require("./consent.service");
const consent_dto_1 = require("./dto/consent.dto");
let ConsentController = class ConsentController {
    consentService;
    constructor(consentService) {
        this.consentService = consentService;
    }
    async recordConsent(projectId, body, ip, userAgent) {
        const dto = consent_dto_1.recordConsentSchema.parse(body);
        return this.consentService.recordConsent(projectId, dto, ip, userAgent);
    }
    async getConsentLogs(tenantId, projectId, limit, offset, anonymousId, req) {
        return this.consentService.getConsentLogs(projectId, tenantId, req.user.userId, {
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            anonymousId,
        });
    }
    async getConsentStats(tenantId, projectId, req) {
        return this.consentService.getConsentStats(projectId, tenantId, req.user.userId);
    }
    async getConsentSettings(tenantId, projectId, req) {
        return this.consentService.getConsentSettings(projectId, tenantId, req.user.userId);
    }
    async updateConsentSettings(tenantId, projectId, body, req) {
        const dto = consent_dto_1.updateConsentSettingsSchema.parse(body);
        return this.consentService.updateConsentSettings(projectId, tenantId, req.user.userId, dto);
    }
    async getUserConsent(projectId, anonymousId) {
        return this.consentService.getLatestConsentForUser(projectId, anonymousId);
    }
};
exports.ConsentController = ConsentController;
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], ConsentController.prototype, "recordConsent", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('anonymousId')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ConsentController.prototype, "getConsentLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ConsentController.prototype, "getConsentStats", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ConsentController.prototype, "getConsentSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ConsentController.prototype, "updateConsentSettings", null);
__decorate([
    (0, common_1.Get)('user/:anonymousId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('anonymousId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConsentController.prototype, "getUserConsent", null);
exports.ConsentController = ConsentController = __decorate([
    (0, common_1.Controller)('tenants/:tenantId/projects/:projectId/consent'),
    __metadata("design:paramtypes", [consent_service_1.ConsentService])
], ConsentController);
//# sourceMappingURL=consent.controller.js.map