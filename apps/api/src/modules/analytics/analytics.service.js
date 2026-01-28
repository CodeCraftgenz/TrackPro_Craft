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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const clickhouse_service_1 = require("./clickhouse.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    clickhouse;
    constructor(prisma, clickhouse) {
        this.prisma = prisma;
        this.clickhouse = clickhouse;
    }
    async getProjectEvents(projectId, tenantId, userId, options = {}) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const { limit = 50, offset = 0 } = options;
        const result = await this.clickhouse.getRecentEvents(projectId, options);
        return {
            events: result.events,
            total: result.total,
            limit,
            offset,
        };
    }
    async getProjectStats(projectId, tenantId, userId, options = {}) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        return this.clickhouse.getEventStats(projectId, options);
    }
    async getDashboardStats(tenantId, userId) {
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
        const projects = await this.prisma.project.findMany({
            where: { tenantId },
            select: { id: true, name: true },
        });
        let totalEvents = 0;
        let eventsToday = 0;
        let uniqueUsers = 0;
        for (const project of projects) {
            try {
                const stats = await this.clickhouse.getEventStats(project.id);
                totalEvents += stats.totalEvents;
                eventsToday += stats.eventsToday;
                uniqueUsers += stats.uniqueUsers;
            }
            catch {
            }
        }
        return {
            totalProjects: projects.length,
            totalEvents,
            eventsToday,
            uniqueUsers,
        };
    }
    async getMetaDeliveryLogs(projectId, tenantId, userId, options = {}) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const { limit = 50, offset = 0 } = options;
        const result = await this.clickhouse.getMetaDeliveryLogs(projectId, options);
        return {
            logs: result.logs,
            total: result.total,
            limit,
            offset,
        };
    }
    async getMetaDeliveryStats(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        return this.clickhouse.getMetaDeliveryStats(projectId);
    }
    async checkProjectAccess(projectId, tenantId, userId) {
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
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        clickhouse_service_1.ClickHouseService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map