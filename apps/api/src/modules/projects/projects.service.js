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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, userId, dto) {
        await this.checkTenantAccess(tenantId, userId, [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN]);
        const existingProject = await this.prisma.project.findUnique({
            where: {
                tenantId_domain: {
                    tenantId,
                    domain: dto.domain,
                },
            },
        });
        if (existingProject) {
            throw new common_1.BadRequestException('Project with this domain already exists');
        }
        return this.prisma.project.create({
            data: {
                tenantId,
                name: dto.name,
                domain: dto.domain,
                timezone: dto.timezone || 'America/Sao_Paulo',
                retentionDays: dto.retentionDays || 90,
            },
        });
    }
    async findAllForTenant(tenantId, userId) {
        await this.checkTenantAccess(tenantId, userId);
        return this.prisma.project.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: {
                        apiKeys: {
                            where: { revokedAt: null },
                        },
                    },
                },
                integrationMeta: {
                    select: {
                        enabled: true,
                        pixelId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(projectId, tenantId, userId) {
        await this.checkTenantAccess(tenantId, userId);
        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                tenantId,
            },
            include: {
                apiKeys: {
                    where: { revokedAt: null },
                    select: {
                        id: true,
                        name: true,
                        keyPrefix: true,
                        scopes: true,
                        createdAt: true,
                        lastUsedAt: true,
                    },
                },
                integrationMeta: {
                    select: {
                        id: true,
                        pixelId: true,
                        testEventCode: true,
                        enabled: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return project;
    }
    async update(projectId, tenantId, userId, dto) {
        await this.checkTenantAccess(tenantId, userId, [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN]);
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, tenantId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (dto.domain && dto.domain !== project.domain) {
            const existingProject = await this.prisma.project.findUnique({
                where: {
                    tenantId_domain: {
                        tenantId,
                        domain: dto.domain,
                    },
                },
            });
            if (existingProject) {
                throw new common_1.BadRequestException('Project with this domain already exists');
            }
        }
        return this.prisma.project.update({
            where: { id: projectId },
            data: dto,
        });
    }
    async delete(projectId, tenantId, userId) {
        await this.checkTenantAccess(tenantId, userId, [client_1.MemberRole.OWNER]);
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, tenantId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        await this.prisma.project.delete({
            where: { id: projectId },
        });
    }
    async updateStatus(projectId, tenantId, userId, status) {
        await this.checkTenantAccess(tenantId, userId, [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN]);
        return this.prisma.project.update({
            where: { id: projectId },
            data: { status },
        });
    }
    async checkTenantAccess(tenantId, userId, allowedRoles) {
        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId,
                    tenantId,
                },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Access denied to this tenant');
        }
        if (allowedRoles && !allowedRoles.includes(membership.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map