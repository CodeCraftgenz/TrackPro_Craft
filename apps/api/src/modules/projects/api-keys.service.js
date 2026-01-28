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
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../prisma/prisma.service");
let ApiKeysService = class ApiKeysService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(projectId, tenantId, userId, dto) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const apiKey = this.generateApiKey();
        const apiSecret = this.generateSecret();
        const keyHash = this.hashKey(apiKey);
        const secretHash = this.hashKey(apiSecret);
        const keyPrefix = apiKey.substring(0, 8);
        const createdKey = await this.prisma.apiKey.create({
            data: {
                projectId,
                name: dto.name,
                keyHash,
                keyPrefix,
                secretHash,
                scopes: dto.scopes || ['events:write'],
            },
        });
        return {
            id: createdKey.id,
            name: createdKey.name,
            apiKey,
            apiSecret,
            keyPrefix,
            scopes: createdKey.scopes,
            createdAt: createdKey.createdAt,
        };
    }
    async findAllForProject(projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId);
        return this.prisma.apiKey.findMany({
            where: {
                projectId,
                revokedAt: null,
            },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                scopes: true,
                createdAt: true,
                lastUsedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async revoke(apiKeyId, projectId, tenantId, userId) {
        await this.checkProjectAccess(projectId, tenantId, userId, [
            client_1.MemberRole.OWNER,
            client_1.MemberRole.ADMIN,
        ]);
        const apiKey = await this.prisma.apiKey.findFirst({
            where: {
                id: apiKeyId,
                projectId,
                revokedAt: null,
            },
        });
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        await this.prisma.apiKey.update({
            where: { id: apiKeyId },
            data: { revokedAt: new Date() },
        });
    }
    async validateApiKey(apiKey) {
        const keyHash = this.hashKey(apiKey);
        const key = await this.prisma.apiKey.findUnique({
            where: { keyHash },
            include: {
                project: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
        });
        if (!key || key.revokedAt || key.project.status !== 'ACTIVE') {
            return null;
        }
        await this.prisma.apiKey.update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() },
        });
        return {
            projectId: key.projectId,
            scopes: key.scopes,
        };
    }
    async getSecretForProject(projectId, apiKey) {
        const keyHash = this.hashKey(apiKey);
        const key = await this.prisma.apiKey.findFirst({
            where: {
                projectId,
                keyHash,
                revokedAt: null,
            },
        });
        if (!key) {
            return null;
        }
        return key.secretHash;
    }
    generateApiKey() {
        return `tp_${crypto.randomBytes(24).toString('hex')}`;
    }
    generateSecret() {
        return `tps_${crypto.randomBytes(32).toString('hex')}`;
    }
    hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
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
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiKeysService);
//# sourceMappingURL=api-keys.service.js.map