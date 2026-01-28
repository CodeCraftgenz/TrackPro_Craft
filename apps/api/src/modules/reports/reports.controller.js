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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getOverviewReport(tenantId, projectId, startDate, endDate, req) {
        return this.reportsService.getOverviewReport(projectId, tenantId, req.user.userId, { startDate, endDate });
    }
    async getFunnelReport(tenantId, projectId, startDate, endDate, steps, req) {
        const stepsList = steps ? steps.split(',').map((s) => s.trim()) : [];
        return this.reportsService.getFunnelReport(projectId, tenantId, req.user.userId, { startDate, endDate }, stepsList);
    }
    async getPerformanceReport(tenantId, projectId, startDate, endDate, req) {
        return this.reportsService.getPerformanceReport(projectId, tenantId, req.user.userId, { startDate, endDate });
    }
    async getQualityReport(tenantId, projectId, req) {
        return this.reportsService.getQualityReport(projectId, tenantId, req.user.userId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getOverviewReport", null);
__decorate([
    (0, common_1.Get)('funnel'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('steps')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getFunnelReport", null);
__decorate([
    (0, common_1.Get)('performance'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPerformanceReport", null);
__decorate([
    (0, common_1.Get)('quality'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getQualityReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('tenants/:tenantId/projects/:projectId/reports'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map