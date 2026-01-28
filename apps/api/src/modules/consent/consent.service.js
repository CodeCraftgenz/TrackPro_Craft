"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULT_CONSENT_SETTINGS = {
    bannerEnabled: true,
    bannerPosition: 'bottom',
    bannerTheme: 'auto',
    privacyPolicyUrl: '',
    cookiePolicyUrl: '',
    categoriesConfig: {
        analytics: {
            enabled: true,
            description: 'Cookies de análise nos ajudam a entender como você usa nosso site.',
        },
        marketing: {
            enabled: true,
            description: 'Cookies de marketing são usados para rastrear visitantes entre sites.',
        },
        personalization: {
            enabled: true,
            description: 'Cookies de personalização permitem lembrar suas preferências.',
        },
    },
};
let ConsentService = class ConsentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordConsent(projectId, dto, ipAddress, userAgent) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const ipHash = ipAddress
            ? crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 16)
            : null;
        const consentLog = await this.prisma.consentLog.create({
            data: {
                projectId,
                anonymousId: dto.anonymousId,
                categories: dto.categories,
                source: dto.source,
                ipHash,
                userAgent,
            },
        });
        return {
            id: consentLog.id,
            anonymousId: consentLog.anonymousId,
            categories: consentLog.categories,
            createdAt: consentLog.createdAt,
        };
    }
    async getConsentLogs(projectId, tenantId, userId, options = {}) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const { limit = 50, offset = 0, anonymousId } = options;
        const where = {
            projectId,
            ...(anonymousId && { anonymousId }),
        };
        const [logs, total] = await Promise.all([
            this.prisma.consentLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.consentLog.count({ where }),
        ]);
        return {
            logs: logs.map((log) => ({
                id: log.id,
                anonymousId: log.anonymousId,
                categories: log.categories,
                source: log.source,
                createdAt: log.createdAt,
            })),
            total,
            limit,
            offset,
        };
    }
    async getConsentStats(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalConsents, last30DaysConsents, last7DaysConsents, uniqueUsers, recentLogs,] = await Promise.all([
            this.prisma.consentLog.count({ where: { projectId } }),
            this.prisma.consentLog.count({
                where: { projectId, createdAt: { gte: thirtyDaysAgo } },
            }),
            this.prisma.consentLog.count({
                where: { projectId, createdAt: { gte: sevenDaysAgo } },
            }),
            this.prisma.consentLog.groupBy({
                by: ['anonymousId'],
                where: { projectId },
                _count: true,
            }),
            this.prisma.consentLog.findMany({
                where: { projectId },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
        ]);
        const categoryStats = {
            analytics: { accepted: 0, total: 0 },
            marketing: { accepted: 0, total: 0 },
            personalization: { accepted: 0, total: 0 },
        };
        for (const log of recentLogs) {
            const categories = log.categories;
            for (const cat of ['analytics', 'marketing', 'personalization']) {
                if (categories[cat] !== undefined) {
                    categoryStats[cat].total++;
                    if (categories[cat]) {
                        categoryStats[cat].accepted++;
                    }
                }
            }
        }
        return {
            total: totalConsents,
            last30Days: last30DaysConsents,
            last7Days: last7DaysConsents,
            uniqueUsers: uniqueUsers.length,
            acceptanceRates: {
                analytics: categoryStats.analytics.total > 0
                    ? Math.round((categoryStats.analytics.accepted / categoryStats.analytics.total) * 100)
                    : 0,
                marketing: categoryStats.marketing.total > 0
                    ? Math.round((categoryStats.marketing.accepted / categoryStats.marketing.total) * 100)
                    : 0,
                personalization: categoryStats.personalization.total > 0
                    ? Math.round((categoryStats.personalization.accepted /
                        categoryStats.personalization.total) *
                        100)
                    : 0,
            },
        };
    }
    async getConsentSettings(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return DEFAULT_CONSENT_SETTINGS;
    }
    async updateConsentSettings(projectId, tenantId, userId, dto) {
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
        return {
            ...DEFAULT_CONSENT_SETTINGS,
            ...dto,
        };
    }
    async getLatestConsentForUser(projectId, anonymousId) {
        const consent = await this.prisma.consentLog.findFirst({
            where: { projectId, anonymousId },
            orderBy: { createdAt: 'desc' },
        });
        if (!consent) {
            return null;
        }
        return {
            id: consent.id,
            anonymousId: consent.anonymousId,
            categories: consent.categories,
            createdAt: consent.createdAt,
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
exports.ConsentService = ConsentService;
exports.ConsentService = ConsentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsentService);
//# sourceMappingURL=consent.service.js.map