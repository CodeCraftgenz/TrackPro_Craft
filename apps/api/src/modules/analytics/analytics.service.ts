import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService, EventRow } from './clickhouse.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  async getProjectEvents(
    projectId: string,
    tenantId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      eventName?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{ events: EventRow[]; total: number; limit: number; offset: number }> {
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

  async getProjectStats(
    projectId: string,
    tenantId: string,
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    return this.clickhouse.getEventStats(projectId, options);
  }

  async getDashboardStats(tenantId: string, userId: string) {
    // Check tenant access
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

    // Get all projects for tenant
    const projects = await this.prisma.project.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    // Aggregate stats from all projects
    let totalEvents = 0;
    let eventsToday = 0;
    let uniqueUsers = 0;

    for (const project of projects) {
      try {
        const stats = await this.clickhouse.getEventStats(project.id);
        totalEvents += stats.totalEvents;
        eventsToday += stats.eventsToday;
        uniqueUsers += stats.uniqueUsers;
      } catch {
        // Skip projects with no data
      }
    }

    return {
      totalProjects: projects.length,
      totalEvents,
      eventsToday,
      uniqueUsers,
    };
  }

  async getMetaDeliveryLogs(
    projectId: string,
    tenantId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {},
  ) {
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

  async getMetaDeliveryStats(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    return this.clickhouse.getMetaDeliveryStats(projectId);
  }

  private async checkProjectAccess(
    projectId: string,
    tenantId: string,
    userId: string,
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
  }
}
