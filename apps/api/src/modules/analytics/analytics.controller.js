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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboardStats(tenantId, req) {
        return this.analyticsService.getDashboardStats(tenantId, req.user.userId);
    }
    async getProjectEvents(tenantId, projectId, limit, offset, eventName, startDate, endDate, req) {
        return this.analyticsService.getProjectEvents(projectId, tenantId, req.user.userId, {
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            eventName,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }
    async getProjectStats(tenantId, projectId, startDate, endDate, req) {
        return this.analyticsService.getProjectStats(projectId, tenantId, req.user.userId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }
    async getMetaDeliveryLogs(tenantId, projectId, limit, offset, status, req) {
        return this.analyticsService.getMetaDeliveryLogs(projectId, tenantId, req.user.userId, {
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            status,
        });
    }
    async getMetaDeliveryStats(tenantId, projectId, req) {
        return this.analyticsService.getMetaDeliveryStats(projectId, tenantId, req.user.userId);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/events'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('eventName')),
    __param(5, (0, common_1.Query)('startDate')),
    __param(6, (0, common_1.Query)('endDate')),
    __param(7, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProjectEvents", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/stats'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProjectStats", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/meta-delivery'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMetaDeliveryLogs", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/meta-delivery/stats'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMetaDeliveryStats", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('tenants/:tenantId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map