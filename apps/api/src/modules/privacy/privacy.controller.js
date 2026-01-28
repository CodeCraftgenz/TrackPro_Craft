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
exports.PrivacyController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const privacy_service_1 = require("./privacy.service");
const privacy_dto_1 = require("./dto/privacy.dto");
let PrivacyController = class PrivacyController {
    privacyService;
    constructor(privacyService) {
        this.privacyService = privacyService;
    }
    async searchUsers(tenantId, projectId, query, limit, offset, req) {
        return this.privacyService.searchUsers(projectId, tenantId, req.user.userId, {
            query,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
    }
    async getUserDataSummary(tenantId, projectId, anonymousId, req) {
        return this.privacyService.getUserDataSummary(projectId, tenantId, req.user.userId, anonymousId);
    }
    async deleteUserData(tenantId, projectId, anonymousId, body, req) {
        const dto = privacy_dto_1.deleteUserDataSchema.parse({ ...body, anonymousId });
        return this.privacyService.deleteUserData(projectId, tenantId, req.user.userId, dto);
    }
    async anonymizeUserData(tenantId, projectId, anonymousId, body, req) {
        const dto = privacy_dto_1.anonymizeUserDataSchema.parse({ ...body, anonymousId });
        return this.privacyService.anonymizeUserData(projectId, tenantId, req.user.userId, dto);
    }
};
exports.PrivacyController = PrivacyController;
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('query')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], PrivacyController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('users/:anonymousId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('anonymousId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], PrivacyController.prototype, "getUserDataSummary", null);
__decorate([
    (0, common_1.Delete)('users/:anonymousId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('anonymousId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PrivacyController.prototype, "deleteUserData", null);
__decorate([
    (0, common_1.Post)('users/:anonymousId/anonymize'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('anonymousId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PrivacyController.prototype, "anonymizeUserData", null);
exports.PrivacyController = PrivacyController = __decorate([
    (0, common_1.Controller)('tenants/:tenantId/projects/:projectId/privacy'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [privacy_service_1.PrivacyService])
], PrivacyController);
//# sourceMappingURL=privacy.controller.js.map