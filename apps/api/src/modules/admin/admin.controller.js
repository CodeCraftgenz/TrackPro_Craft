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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getSystemStats(req) {
        await this.adminService.checkAdminAccess(req.user.userId);
        return this.adminService.getSystemStats();
    }
    async getQueuesOverview(req) {
        await this.adminService.checkAdminAccess(req.user.userId);
        return this.adminService.getQueuesOverview();
    }
    async getQueueJobs(req, queueName, status = 'waiting', limit) {
        await this.adminService.checkAdminAccess(req.user.userId);
        return this.adminService.getQueueJobs(queueName, status, limit ? parseInt(limit, 10) : 20);
    }
    async retryJob(req, queueName, jobId) {
        await this.adminService.checkAdminAccess(req.user.userId);
        await this.adminService.retryFailedJob(queueName, jobId);
        return { success: true };
    }
    async removeJob(req, queueName, jobId) {
        await this.adminService.checkAdminAccess(req.user.userId);
        await this.adminService.removeJob(queueName, jobId);
    }
    async pauseQueue(req, queueName) {
        await this.adminService.checkAdminAccess(req.user.userId);
        await this.adminService.pauseQueue(queueName);
        return { success: true };
    }
    async resumeQueue(req, queueName) {
        await this.adminService.checkAdminAccess(req.user.userId);
        await this.adminService.resumeQueue(queueName);
        return { success: true };
    }
    async cleanQueue(req, queueName, status = 'completed', olderThanHours) {
        await this.adminService.checkAdminAccess(req.user.userId);
        const olderThanMs = olderThanHours
            ? parseInt(olderThanHours, 10) * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
        const cleaned = await this.adminService.cleanQueue(queueName, status, olderThanMs);
        return { cleaned };
    }
    async getAuditLogs(req, limit, offset, userId, entity, action) {
        await this.adminService.checkAdminAccess(req.user.userId);
        return this.adminService.getAuditLogs({
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            userId,
            entity,
            action,
        });
    }
    async getErrorLogs(req, limit, offset, level) {
        await this.adminService.checkAdminAccess(req.user.userId);
        return this.adminService.getErrorLogs({
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            level,
        });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemStats", null);
__decorate([
    (0, common_1.Get)('queues'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getQueuesOverview", null);
__decorate([
    (0, common_1.Get)('queues/:queueName/jobs'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('queueName')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getQueueJobs", null);
__decorate([
    (0, common_1.Post)('queues/:queueName/jobs/:jobId/retry'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('queueName')),
    __param(2, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "retryJob", null);
__decorate([
    (0, common_1.Delete)('queues/:queueName/jobs/:jobId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('queueName')),
    __param(2, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeJob", null);
__decorate([
    (0, common_1.Post)('queues/:queueName/pause'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('queueName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "pauseQueue", null);
__decorate([
    (0, common_1.Post)('queues/:queueName/resume'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('queueName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resumeQueue", null);
__decorate([
    (0, common_1.Post)('queues/:queueName/clean'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('queueName')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('olderThanHours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "cleanQueue", null);
__decorate([
    (0, common_1.Get)('audit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('entity')),
    __param(5, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('errors'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getErrorLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map