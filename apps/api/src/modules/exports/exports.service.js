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
var ExportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let ExportsService = ExportsService_1 = class ExportsService {
    prisma;
    redis;
    logger = new common_1.Logger(ExportsService_1.name);
    exportsQueue;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.exportsQueue = new bullmq_1.Queue('exports', {
            connection: this.redis.getClient(),
        });
    }
    async createExport(projectId, tenantId, userId, dto) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const exportJob = await this.prisma.exportJob.create({
            data: {
                projectId,
                type: dto.type,
                status: client_1.ExportStatus.PENDING,
                params: {
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    eventNames: dto.eventNames,
                    format: dto.format,
                },
            },
        });
        await this.exportsQueue.add('export', {
            exportJobId: exportJob.id,
            projectId,
            type: dto.type,
            params: {
                startDate: dto.startDate,
                endDate: dto.endDate,
                eventNames: dto.eventNames,
                format: dto.format,
            },
        }, {
            jobId: `export-${exportJob.id}`,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });
        this.logger.log({
            message: 'Export job queued',
            exportJobId: exportJob.id,
            projectId,
            type: dto.type,
        });
        return {
            id: exportJob.id,
            type: exportJob.type,
            status: exportJob.status,
            params: exportJob.params,
            createdAt: exportJob.createdAt,
        };
    }
    async getExports(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const exports = await this.prisma.exportJob.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return exports.map((e) => ({
            id: e.id,
            type: e.type,
            status: e.status,
            params: e.params,
            fileUrl: e.fileUrl,
            error: e.error,
            createdAt: e.createdAt,
            finishedAt: e.finishedAt,
        }));
    }
    async getExport(exportId, projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const exportJob = await this.prisma.exportJob.findFirst({
            where: { id: exportId, projectId },
        });
        if (!exportJob) {
            throw new common_1.NotFoundException('Export not found');
        }
        return {
            id: exportJob.id,
            type: exportJob.type,
            status: exportJob.status,
            params: exportJob.params,
            fileUrl: exportJob.fileUrl,
            error: exportJob.error,
            createdAt: exportJob.createdAt,
            finishedAt: exportJob.finishedAt,
        };
    }
    async cancelExport(exportId, projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const exportJob = await this.prisma.exportJob.findFirst({
            where: { id: exportId, projectId },
        });
        if (!exportJob) {
            throw new common_1.NotFoundException('Export not found');
        }
        if (exportJob.status !== client_1.ExportStatus.PENDING) {
            throw new common_1.ForbiddenException('Can only cancel pending exports');
        }
        await this.prisma.exportJob.update({
            where: { id: exportId },
            data: {
                status: client_1.ExportStatus.FAILED,
                error: 'Cancelled by user',
                finishedAt: new Date(),
            },
        });
    }
    async getDownloadUrl(exportId, projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const exportJob = await this.prisma.exportJob.findFirst({
            where: { id: exportId, projectId },
        });
        if (!exportJob) {
            throw new common_1.NotFoundException('Export not found');
        }
        if (exportJob.status !== client_1.ExportStatus.COMPLETED) {
            throw new common_1.ForbiddenException('Export is not ready for download');
        }
        if (!exportJob.fileUrl) {
            throw new common_1.NotFoundException('Export file not found');
        }
        const expiresAt = new Date(Date.now() + 3600 * 1000);
        return {
            downloadUrl: exportJob.fileUrl,
            expiresAt,
        };
    }
    async checkProjectAccess(projectId, tenantId, userId, allowedRoles) {
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, tenantId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId,
                    tenantId,
                },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (allowedRoles && !allowedRoles.includes(membership.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = ExportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map