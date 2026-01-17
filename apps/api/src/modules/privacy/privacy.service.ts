import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from '../analytics/clickhouse.service';
import {
  DeleteUserDataDto,
  AnonymizeUserDataDto,
  ExportUserDataDto,
} from './dto/privacy.dto';

export interface PrivacyRequestLog {
  id: string;
  projectId: string;
  anonymousId: string;
  requestType: 'DELETE' | 'ANONYMIZE' | 'EXPORT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedBy: string;
  reason?: string;
  completedAt?: Date;
  createdAt: Date;
}

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  async deleteUserData(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: DeleteUserDataDto,
  ): Promise<{ success: boolean; message: string; eventsDeleted: number }> {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get event count before deletion
    const eventCount = await this.clickhouse.getUserEventCount(
      projectId,
      dto.anonymousId,
    );

    if (eventCount === 0) {
      return {
        success: true,
        message: 'No data found for this user',
        eventsDeleted: 0,
      };
    }

    // Delete from ClickHouse
    await this.clickhouse.deleteUserData(projectId, dto.anonymousId);

    // Delete consent logs from MySQL
    await this.prisma.consentLog.deleteMany({
      where: {
        projectId,
        anonymousId: dto.anonymousId,
      },
    });

    // Log the privacy request
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

  async anonymizeUserData(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: AnonymizeUserDataDto,
  ): Promise<{ success: boolean; message: string; newAnonymousId: string; eventsAnonymized: number }> {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get event count before anonymization
    const eventCount = await this.clickhouse.getUserEventCount(
      projectId,
      dto.anonymousId,
    );

    if (eventCount === 0) {
      return {
        success: true,
        message: 'No data found for this user',
        newAnonymousId: '',
        eventsAnonymized: 0,
      };
    }

    // Anonymize in ClickHouse
    const newAnonymousId = await this.clickhouse.anonymizeUserData(
      projectId,
      dto.anonymousId,
    );

    // Update consent logs in MySQL (anonymize the anonymousId)
    await this.prisma.consentLog.updateMany({
      where: {
        projectId,
        anonymousId: dto.anonymousId,
      },
      data: {
        anonymousId: newAnonymousId,
      },
    });

    // Log the privacy request
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

  async getUserDataSummary(
    projectId: string,
    tenantId: string,
    userId: string,
    anonymousId: string,
  ): Promise<{
    anonymousId: string;
    eventCount: number;
    consentLogsCount: number;
    firstSeen?: Date;
    lastSeen?: Date;
  }> {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get event count from ClickHouse
    const eventCount = await this.clickhouse.getUserEventCount(
      projectId,
      anonymousId,
    );

    // Get consent logs count from MySQL
    const consentLogsCount = await this.prisma.consentLog.count({
      where: {
        projectId,
        anonymousId,
      },
    });

    // Get first and last consent log
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

  async searchUsers(
    projectId: string,
    tenantId: string,
    userId: string,
    options: {
      query?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    users: Array<{ anonymousId: string; consentLogsCount: number; lastActivity: Date }>;
    total: number;
  }> {
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

    // Get unique anonymous IDs from consent logs with counts
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
      lastActivity: group._max.createdAt!,
    }));

    return {
      users,
      total: totalGroups.length,
    };
  }

  private async checkProjectAccess(
    projectId: string,
    tenantId: string,
    userId: string,
    allowedRoles?: MemberRole[],
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
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
      throw new ForbiddenException('Access denied');
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
