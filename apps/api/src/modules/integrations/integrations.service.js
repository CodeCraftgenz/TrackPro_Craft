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
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const encryption_service_1 = require("./encryption.service");
let IntegrationsService = class IntegrationsService {
    prisma;
    encryption;
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    async getMetaIntegration(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        const integration = await this.prisma.integrationMeta.findUnique({
            where: { projectId },
        });
        if (!integration) {
            return null;
        }
        return {
            id: integration.id,
            pixelId: integration.pixelId,
            testEventCode: integration.testEventCode,
            enabled: integration.enabled,
            hasAccessToken: !!integration.accessTokenEncrypted,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
        };
    }
    async createMetaIntegration(projectId, tenantId, userId, dto) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const existing = await this.prisma.integrationMeta.findUnique({
            where: { projectId },
        });
        if (existing) {
            throw new common_1.ConflictException('Meta integration already exists for this project');
        }
        const encryptedToken = this.encryption.encrypt(dto.accessToken);
        const integration = await this.prisma.integrationMeta.create({
            data: {
                projectId,
                pixelId: dto.pixelId,
                accessTokenEncrypted: encryptedToken,
                testEventCode: dto.testEventCode,
                enabled: true,
            },
        });
        return {
            id: integration.id,
            pixelId: integration.pixelId,
            testEventCode: integration.testEventCode,
            enabled: integration.enabled,
            hasAccessToken: true,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
        };
    }
    async updateMetaIntegration(projectId, tenantId, userId, dto) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const existing = await this.prisma.integrationMeta.findUnique({
            where: { projectId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Meta integration not found');
        }
        const updateData = {};
        if (dto.pixelId !== undefined) {
            updateData.pixelId = dto.pixelId;
        }
        if (dto.accessToken !== undefined) {
            updateData.accessTokenEncrypted = this.encryption.encrypt(dto.accessToken);
        }
        if (dto.testEventCode !== undefined) {
            updateData.testEventCode = dto.testEventCode;
        }
        if (dto.enabled !== undefined) {
            updateData.enabled = dto.enabled;
        }
        const integration = await this.prisma.integrationMeta.update({
            where: { projectId },
            data: updateData,
        });
        return {
            id: integration.id,
            pixelId: integration.pixelId,
            testEventCode: integration.testEventCode,
            enabled: integration.enabled,
            hasAccessToken: !!integration.accessTokenEncrypted,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
        };
    }
    async deleteMetaIntegration(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId, [client_1.MemberRole.OWNER]);
        const existing = await this.prisma.integrationMeta.findUnique({
            where: { projectId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Meta integration not found');
        }
        await this.prisma.integrationMeta.delete({
            where: { projectId },
        });
    }
    async testMetaIntegration(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const integration = await this.prisma.integrationMeta.findUnique({
            where: { projectId },
        });
        if (!integration) {
            throw new common_1.NotFoundException('Meta integration not found');
        }
        const accessToken = this.encryption.decrypt(integration.accessTokenEncrypted);
        try {
            const response = await fetch(`https://graph.facebook.com/v18.0/${integration.pixelId}?access_token=${accessToken}`);
            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.error?.message || 'Failed to connect to Meta API',
                };
            }
            const data = await response.json();
            return {
                success: true,
                pixelName: data.name,
                pixelId: data.id,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection failed',
            };
        }
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
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map