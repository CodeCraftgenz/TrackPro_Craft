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
var PrivacyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const clickhouse_service_1 = require("../analytics/clickhouse.service");
let PrivacyService = PrivacyService_1 = class PrivacyService {
    prisma;
    clickhouse;
    logger = new common_1.Logger(PrivacyService_1.name);
    constructor(prisma, clickhouse) {
        this.prisma = prisma;
        this.clickhouse = clickhouse;
    }
    async deleteUserData(projectId, tenantId, userId, dto) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const eventCount = await this.clickhouse.getUserEventCount(projectId, dto.anonymousId);
        if (eventCount === 0) {
            return {
                success: true,
                message: 'No data found for this user',
                eventsDeleted: 0,
            };
        }
        await this.clickhouse.deleteUserData(projectId, dto.anonymousId);
        await this.prisma.consentLog.deleteMany({
            where: {
                projectId,
                anonymousId: dto.anonymousId,
            },
        });
        this.logger.log({
            message: 'User data deleted (LGPD request)',
            projectId,
            anonymousId: dto.anonymousId,
            requestedBy: userId,
            reason: dto.reason,
            eventsDeleted: eventCount,
        });
        return {
            success: true,
            message: `User data deleted successfully. ${eventCount} events removed.`,
            eventsDeleted: eventCount,
        };
    }
    async anonymizeUserData(projectId, tenantId, userId, dto) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const eventCount = await this.clickhouse.getUserEventCount(projectId, dto.anonymousId);
        if (eventCount === 0) {
            return {
                success: true,
                message: 'No data found for this user',
                newAnonymousId: '',
                eventsAnonymized: 0,
            };
        }
        const newAnonymousId = await this.clickhouse.anonymizeUserData(projectId, dto.anonymousId);
        await this.prisma.consentLog.updateMany({
            where: {
                projectId,
                anonymousId: dto.anonymousId,
            },
            data: {
                anonymousId: newAnonymousId,
            },
        });
        this.logger.log({
            message: 'User data anonymized (LGPD request)',
            projectId,
            originalAnonymousId: dto.anonymousId,
            newAnonymousId,
            requestedBy: userId,
            reason: dto.reason,
            eventsAnonymized: eventCount,
        });
        return {
            success: true,
            message: `User data anonymized successfully. ${eventCount} events updated.`,
            newAnonymousId,
            eventsAnonymized: eventCount,
        };
    }
    async getUserDataSummary(projectId, tenantId, userId, anonymousId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const eventCount = await this.clickhouse.getUserEventCount(projectId, anonymousId);
        const consentLogsCount = await this.prisma.consentLog.count({
            where: {
                projectId,
                anonymousId,
            },
        });
        const [firstConsent, lastConsent] = await Promise.all([
            this.prisma.consentLog.findFirst({
                where: { projectId, anonymousId },
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true },
            }),
            this.prisma.consentLog.findFirst({
                where: { projectId, anonymousId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            }),
        ]);
        return {
            anonymousId,
            eventCount,
            consentLogsCount,
            firstSeen: firstConsent?.createdAt,
            lastSeen: lastConsent?.createdAt,
        };
    }
    async searchUsers(projectId, tenantId, userId, options = {}) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const { query, limit = 20, offset = 0 } = options;
        const where = {
            projectId,
            ...(query && {
                anonymousId: {
                    contains: query,
                },
            }),
        };
        const groupedLogs = await this.prisma.consentLog.groupBy({
            by: ['anonymousId'],
            where,
            _count: { id: true },
            _max: { createdAt: true },
            orderBy: { _max: { createdAt: 'desc' } },
            take: limit,
            skip: offset,
        });
        const totalGroups = await this.prisma.consentLog.groupBy({
            by: ['anonymousId'],
            where,
        });
        const users = groupedLogs.map((group) => ({
            anonymousId: group.anonymousId,
            consentLogsCount: group._count.id,
            lastActivity: group._max.createdAt,
        }));
        return {
            users,
            total: totalGroups.length,
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
exports.PrivacyService = PrivacyService;
exports.PrivacyService = PrivacyService = PrivacyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        clickhouse_service_1.ClickHouseService])
], PrivacyService);
//# sourceMappingURL=privacy.service.js.map