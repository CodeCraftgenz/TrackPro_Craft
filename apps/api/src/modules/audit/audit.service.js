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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(data) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantId: data.tenantId,
                    actorUserId: data.actorUserId,
                    action: data.action,
                    resource: data.resource,
                    resourceId: data.resourceId,
                    payload: data.payload,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });
            this.logger.debug({
                message: 'Audit log created',
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
            });
        }
        catch (error) {
            this.logger.error('Failed to create audit log', error);
        }
    }
    async getLogsForTenant(tenantId, options = {}) {
        const { limit = 50, offset = 0, action, resource, startDate, endDate } = options;
        const where = { tenantId };
        if (action)
            where.action = action;
        if (resource)
            where.resource = resource;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { logs, total, limit, offset };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map