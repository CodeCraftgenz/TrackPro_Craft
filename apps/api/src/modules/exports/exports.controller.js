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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const exports_service_1 = require("./exports.service");
const exports_dto_1 = require("./dto/exports.dto");
let ExportsController = class ExportsController {
    exportsService;
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    async getExports(tenantId, projectId, req) {
        return this.exportsService.getExports(projectId, tenantId, req.user.userId);
    }
    async createExport(tenantId, projectId, body, req) {
        const result = exports_dto_1.createExportSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        return this.exportsService.createExport(projectId, tenantId, req.user.userId, result.data);
    }
    async getExport(tenantId, projectId, exportId, req) {
        return this.exportsService.getExport(exportId, projectId, tenantId, req.user.userId);
    }
    async cancelExport(tenantId, projectId, exportId, req) {
        await this.exportsService.cancelExport(exportId, projectId, tenantId, req.user.userId);
    }
    async getDownloadUrl(tenantId, projectId, exportId, req) {
        return this.exportsService.getDownloadUrl(exportId, projectId, tenantId, req.user.userId);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "getExports", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "createExport", null);
__decorate([
    (0, common_1.Get)(':exportId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('exportId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "getExport", null);
__decorate([
    (0, common_1.Delete)(':exportId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('exportId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "cancelExport", null);
__decorate([
    (0, common_1.Get)(':exportId/download'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('exportId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "getDownloadUrl", null);
exports.ExportsController = ExportsController = __decorate([
    (0, common_1.Controller)('tenants/:tenantId/projects/:projectId/exports'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map