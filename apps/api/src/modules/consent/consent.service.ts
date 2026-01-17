import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import {
  RecordConsentDto,
  UpdateConsentSettingsDto,
  ConsentCategories,
} from './dto/consent.dto';

interface ConsentSettings {
  bannerEnabled: boolean;
  bannerPosition: 'bottom' | 'top' | 'center';
  bannerTheme: 'light' | 'dark' | 'auto';
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  categoriesConfig: {
    analytics: { enabled: boolean; description: string };
    marketing: { enabled: boolean; description: string };
    personalization: { enabled: boolean; description: string };
  };
}

const DEFAULT_CONSENT_SETTINGS: ConsentSettings = {
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

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async recordConsent(
    projectId: string,
    dto: RecordConsentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Hash IP for privacy
    const ipHash = ipAddress
      ? crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 16)
      : null;

    const consentLog = await this.prisma.consentLog.create({
      data: {
        projectId,
        anonymousId: dto.anonymousId,
        categories: dto.categories as Record<string, boolean>,
        source: dto.source,
        ipHash,
        userAgent,
      },
    });

    return {
      id: consentLog.id,
      anonymousId: consentLog.anonymousId,
      categories: consentLog.categories as ConsentCategories,
      createdAt: consentLog.createdAt,
    };
  }

  async getConsentLogs(
    projectId: string,
    tenantId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      anonymousId?: string;
    } = {},
  ) {
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
        categories: log.categories as ConsentCategories,
        source: log.source,
        createdAt: log.createdAt,
      })),
      total,
      limit,
      offset,
    };
  }

  async getConsentStats(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalConsents,
      last30DaysConsents,
      last7DaysConsents,
      uniqueUsers,
      recentLogs,
    ] = await Promise.all([
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

    // Calculate category acceptance rates
    const categoryStats = {
      analytics: { accepted: 0, total: 0 },
      marketing: { accepted: 0, total: 0 },
      personalization: { accepted: 0, total: 0 },
    };

    for (const log of recentLogs) {
      const categories = log.categories as Record<string, boolean>;
      for (const cat of ['analytics', 'marketing', 'personalization'] as const) {
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
        analytics:
          categoryStats.analytics.total > 0
            ? Math.round(
                (categoryStats.analytics.accepted / categoryStats.analytics.total) * 100,
              )
            : 0,
        marketing:
          categoryStats.marketing.total > 0
            ? Math.round(
                (categoryStats.marketing.accepted / categoryStats.marketing.total) * 100,
              )
            : 0,
        personalization:
          categoryStats.personalization.total > 0
            ? Math.round(
                (categoryStats.personalization.accepted /
                  categoryStats.personalization.total) *
                  100,
              )
            : 0,
      },
    };
  }

  async getConsentSettings(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // For now, return default settings
    // In a full implementation, these would be stored in a separate table
    return DEFAULT_CONSENT_SETTINGS;
  }

  async updateConsentSettings(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: UpdateConsentSettingsDto,
  ) {
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

    // For now, just return the merged settings
    // In a full implementation, these would be persisted
    return {
      ...DEFAULT_CONSENT_SETTINGS,
      ...dto,
    };
  }

  async getLatestConsentForUser(projectId: string, anonymousId: string) {
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
      categories: consent.categories as ConsentCategories,
      createdAt: consent.createdAt,
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
