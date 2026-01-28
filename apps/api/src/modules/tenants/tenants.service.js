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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let TenantsService = class TenantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const slug = this.generateSlug(dto.name);
        const existingTenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });
        if (existingTenant) {
            throw new common_1.BadRequestException('Tenant with this name already exists');
        }
        const tenant = await this.prisma.tenant.create({
            data: {
                name: dto.name,
                slug,
                memberships: {
                    create: {
                        userId,
                        role: client_1.MemberRole.OWNER,
                    },
                },
            },
            include: {
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        return tenant;
    }
    async findAllForUser(userId) {
        return this.prisma.tenant.findMany({
            where: {
                memberships: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                memberships: {
                    where: { userId },
                    select: { role: true },
                },
                _count: {
                    select: {
                        projects: true,
                        memberships: true,
                    },
                },
            },
        });
    }
    async findById(tenantId, userId) {
        const tenant = await this.prisma.tenant.findFirst({
            where: {
                id: tenantId,
                memberships: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async update(tenantId, userId, dto) {
        await this.checkOwnerPermission(tenantId, userId);
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: { name: dto.name },
        });
    }
    async delete(tenantId, userId) {
        await this.checkOwnerPermission(tenantId, userId);
        await this.prisma.tenant.delete({
            where: { id: tenantId },
        });
    }
    async addMember(tenantId, actorUserId, dto) {
        await this.checkAdminPermission(tenantId, actorUserId);
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingMembership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId: user.id,
                    tenantId,
                },
            },
        });
        if (existingMembership) {
            throw new common_1.BadRequestException('User is already a member');
        }
        return this.prisma.membership.create({
            data: {
                userId: user.id,
                tenantId,
                role: dto.role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async removeMember(tenantId, actorUserId, memberUserId) {
        await this.checkAdminPermission(tenantId, actorUserId);
        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId: memberUserId,
                    tenantId,
                },
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (membership.role === client_1.MemberRole.OWNER) {
            throw new common_1.ForbiddenException('Cannot remove the owner');
        }
        await this.prisma.membership.delete({
            where: {
                userId_tenantId: {
                    userId: memberUserId,
                    tenantId,
                },
            },
        });
    }
    async updateMemberRole(tenantId, actorUserId, memberUserId, role) {
        await this.checkOwnerPermission(tenantId, actorUserId);
        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId: memberUserId,
                    tenantId,
                },
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (membership.role === client_1.MemberRole.OWNER && role !== client_1.MemberRole.OWNER) {
            throw new common_1.ForbiddenException('Cannot change owner role');
        }
        return this.prisma.membership.update({
            where: {
                userId_tenantId: {
                    userId: memberUserId,
                    tenantId,
                },
            },
            data: { role },
        });
    }
    async checkOwnerPermission(tenantId, userId) {
        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId,
                    tenantId,
                },
            },
        });
        if (!membership || membership.role !== client_1.MemberRole.OWNER) {
            throw new common_1.ForbiddenException('Only the owner can perform this action');
        }
    }
    async checkAdminPermission(tenantId, userId) {
        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_tenantId: {
                    userId,
                    tenantId,
                },
            },
        });
        if (!membership ||
            (membership.role !== client_1.MemberRole.OWNER && membership.role !== client_1.MemberRole.ADMIN)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map