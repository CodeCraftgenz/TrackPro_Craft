import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  tenantId: string;
  actorUserId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          actorUserId: data.actorUserId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          payload: data.payload as object | undefined,
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
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  async getLogsForTenant(
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const { limit = 50, offset = 0, action, resource, startDate, endDate } = options;

    const where: Record<string, unknown> = { tenantId };

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
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
}
