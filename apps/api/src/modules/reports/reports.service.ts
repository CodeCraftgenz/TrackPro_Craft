import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from '../analytics/clickhouse.service';
import { ReportsCacheService } from './reports-cache.service';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface OverviewReport {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  eventsToday: number;
  eventsTrend: number; // percentage change vs previous period
  topEvents: Array<{ event_name: string; count: number }>;
  eventsByDay: Array<{ date: string; count: number }>;
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface FunnelReport {
  steps: FunnelStep[];
  conversionRate: number;
  totalStarted: number;
  totalCompleted: number;
}

interface PerformanceReport {
  bySource: Array<{
    source: string;
    events: number;
    users: number;
    sessions: number;
    revenue: number;
  }>;
  byMedium: Array<{
    medium: string;
    events: number;
    users: number;
    revenue: number;
  }>;
  byCampaign: Array<{
    campaign: string;
    events: number;
    users: number;
    revenue: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface QualityReport {
  eventValidation: {
    total: number;
    valid: number;
    invalid: number;
    validationRate: number;
  };
  metaDelivery: {
    total: number;
    delivered: number;
    failed: number;
    retrying: number;
    deliveryRate: number;
  };
  recentErrors: Array<{
    type: string;
    message: string;
    count: number;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouse: ClickHouseService,
    private readonly cache: ReportsCacheService,
  ) {}

  async getOverviewReport(
    projectId: string,
    tenantId: string,
    userId: string,
    range: DateRange,
  ): Promise<OverviewReport> {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const cacheKey = this.cache.buildKey(projectId, 'overview', range);
    const cached = await this.cache.get<OverviewReport>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(range);

    // Get overview data from ClickHouse
    const result = await this.queryOverview(projectId, startDate, endDate);

    const ttl = this.cache.getTtlForPeriod(startDate, endDate);
    await this.cache.set(cacheKey, result, ttl);

    return result;
  }

  async getFunnelReport(
    projectId: string,
    tenantId: string,
    userId: string,
    range: DateRange,
    steps: string[],
  ): Promise<FunnelReport> {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const cacheKey = this.cache.buildKey(projectId, 'funnel', {
      ...range,
      steps: steps.join(','),
    });
    const cached = await this.cache.get<FunnelReport>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(range);

    // Default funnel steps if none provided
    const funnelSteps =
      steps.length > 0
        ? steps
        : ['page_view', 'view_content', 'add_to_cart', 'initiate_checkout', 'purchase'];

    const result = await this.queryFunnel(projectId, startDate, endDate, funnelSteps);

    const ttl = this.cache.getTtlForPeriod(startDate, endDate);
    await this.cache.set(cacheKey, result, ttl);

    return result;
  }

  async getPerformanceReport(
    projectId: string,
    tenantId: string,
    userId: string,
    range: DateRange,
  ): Promise<PerformanceReport> {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const cacheKey = this.cache.buildKey(projectId, 'performance', range);
    const cached = await this.cache.get<PerformanceReport>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(range);

    const result = await this.queryPerformance(projectId, startDate, endDate);

    const ttl = this.cache.getTtlForPeriod(startDate, endDate);
    await this.cache.set(cacheKey, result, ttl);

    return result;
  }

  async getQualityReport(
    projectId: string,
    tenantId: string,
    userId: string,
  ): Promise<QualityReport> {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const cacheKey = this.cache.buildKey(projectId, 'quality', {});
    const cached = await this.cache.get<QualityReport>(cacheKey);
    if (cached) return cached;

    const result = await this.queryQuality(projectId);

    await this.cache.set(cacheKey, result, 60); // 1 minute cache for quality

    return result;
  }

  private async queryOverview(
    projectId: string,
    startDate: string,
    endDate: string,
  ): Promise<OverviewReport> {
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

    // Calculate previous period for trend
    const periodDays =
      Math.ceil((endTimestamp - startTimestamp) / 86400) || 1;
    const prevStartTimestamp = startTimestamp - periodDays * 86400;
    const prevEndTimestamp = startTimestamp - 1;

    // Main stats query
    const statsQuery = `
      SELECT
        count() as total_events,
        uniqExact(anonymous_id) as unique_users,
        uniqExact(session_id) as unique_sessions
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
      FORMAT JSONEachRow
    `;

    // Previous period stats
    const prevStatsQuery = `
      SELECT count() as total_events
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${prevStartTimestamp}
        AND event_time <= ${prevEndTimestamp}
      FORMAT JSONEachRow
    `;

    // Today's events
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const todayQuery = `
      SELECT count() as events_today
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${todayStart}
      FORMAT JSONEachRow
    `;

    // Top events
    const topEventsQuery = `
      SELECT event_name, count() as count
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
      FORMAT JSONEachRow
    `;

    // Events by day
    const byDayQuery = `
      SELECT
        toDate(toDateTime(event_time)) as date,
        count() as count
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
      GROUP BY date
      ORDER BY date
      FORMAT JSONEachRow
    `;

    const [stats, prevStats, today, topEvents, byDay] = await Promise.all([
      this.clickhouse.queryRows<{
        total_events: string;
        unique_users: string;
        unique_sessions: string;
      }>(statsQuery),
      this.clickhouse.queryRows<{ total_events: string }>(prevStatsQuery),
      this.clickhouse.queryRows<{ events_today: string }>(todayQuery),
      this.clickhouse.queryRows<{ event_name: string; count: string }>(topEventsQuery),
      this.clickhouse.queryRows<{ date: string; count: string }>(byDayQuery),
    ]);

    const totalEvents = parseInt(stats[0]?.total_events || '0', 10);
    const prevTotalEvents = parseInt(prevStats[0]?.total_events || '0', 10);
    const eventsTrend =
      prevTotalEvents > 0
        ? Math.round(((totalEvents - prevTotalEvents) / prevTotalEvents) * 100)
        : 0;

    return {
      totalEvents,
      uniqueUsers: parseInt(stats[0]?.unique_users || '0', 10),
      uniqueSessions: parseInt(stats[0]?.unique_sessions || '0', 10),
      eventsToday: parseInt(today[0]?.events_today || '0', 10),
      eventsTrend,
      topEvents: topEvents.map((e) => ({
        event_name: e.event_name,
        count: parseInt(e.count, 10),
      })),
      eventsByDay: byDay.map((d) => ({
        date: d.date,
        count: parseInt(d.count, 10),
      })),
    };
  }

  private async queryFunnel(
    projectId: string,
    startDate: string,
    endDate: string,
    steps: string[],
  ): Promise<FunnelReport> {
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

    // Query each step count
    const stepCounts: FunnelStep[] = [];
    let previousCount = 0;

    for (let i = 0; i < steps.length; i++) {
      const stepName = steps[i];
      const query = `
        SELECT uniqExact(anonymous_id) as users
        FROM events_raw
        WHERE project_id = '${this.escape(projectId)}'
          AND event_time >= ${startTimestamp}
          AND event_time <= ${endTimestamp}
          AND event_name = '${this.escape(stepName)}'
        FORMAT JSONEachRow
      `;

      const result = await this.clickhouse.queryRows<{ users: string }>(query);
      const count = parseInt(result[0]?.users || '0', 10);
      const percentage = i === 0 ? 100 : previousCount > 0 ? Math.round((count / previousCount) * 100) : 0;
      const dropoff = i === 0 ? 0 : previousCount - count;

      stepCounts.push({
        name: stepName,
        count,
        percentage,
        dropoff,
      });

      if (i === 0) previousCount = count;
      else previousCount = count;
    }

    const totalStarted = stepCounts[0]?.count || 0;
    const totalCompleted = stepCounts[stepCounts.length - 1]?.count || 0;
    const conversionRate =
      totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

    return {
      steps: stepCounts,
      conversionRate,
      totalStarted,
      totalCompleted,
    };
  }

  private async queryPerformance(
    projectId: string,
    startDate: string,
    endDate: string,
  ): Promise<PerformanceReport> {
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

    // By source
    const bySourceQuery = `
      SELECT
        utm_source as source,
        count() as events,
        uniqExact(anonymous_id) as users,
        uniqExact(session_id) as sessions,
        sum(if(event_name = 'purchase', value, 0)) as revenue
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
        AND utm_source != ''
      GROUP BY utm_source
      ORDER BY events DESC
      LIMIT 20
      FORMAT JSONEachRow
    `;

    // By medium
    const byMediumQuery = `
      SELECT
        utm_medium as medium,
        count() as events,
        uniqExact(anonymous_id) as users,
        sum(if(event_name = 'purchase', value, 0)) as revenue
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
        AND utm_medium != ''
      GROUP BY utm_medium
      ORDER BY events DESC
      LIMIT 20
      FORMAT JSONEachRow
    `;

    // By campaign
    const byCampaignQuery = `
      SELECT
        utm_campaign as campaign,
        count() as events,
        uniqExact(anonymous_id) as users,
        sum(if(event_name = 'purchase', value, 0)) as revenue
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
        AND utm_campaign != ''
      GROUP BY utm_campaign
      ORDER BY events DESC
      LIMIT 20
      FORMAT JSONEachRow
    `;

    // Revenue totals
    const revenueQuery = `
      SELECT
        count() as total_orders,
        sum(value) as total_revenue
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${startTimestamp}
        AND event_time <= ${endTimestamp}
        AND event_name = 'purchase'
        AND value > 0
      FORMAT JSONEachRow
    `;

    const [bySource, byMedium, byCampaign, revenue] = await Promise.all([
      this.clickhouse.queryRows<{
        source: string;
        events: string;
        users: string;
        sessions: string;
        revenue: string;
      }>(bySourceQuery),
      this.clickhouse.queryRows<{
        medium: string;
        events: string;
        users: string;
        revenue: string;
      }>(byMediumQuery),
      this.clickhouse.queryRows<{
        campaign: string;
        events: string;
        users: string;
        revenue: string;
      }>(byCampaignQuery),
      this.clickhouse.queryRows<{ total_orders: string; total_revenue: string }>(
        revenueQuery,
      ),
    ]);

    const totalRevenue = parseFloat(revenue[0]?.total_revenue || '0');
    const totalOrders = parseInt(revenue[0]?.total_orders || '0', 10);

    return {
      bySource: bySource.map((s) => ({
        source: s.source,
        events: parseInt(s.events, 10),
        users: parseInt(s.users, 10),
        sessions: parseInt(s.sessions, 10),
        revenue: parseFloat(s.revenue),
      })),
      byMedium: byMedium.map((m) => ({
        medium: m.medium,
        events: parseInt(m.events, 10),
        users: parseInt(m.users, 10),
        revenue: parseFloat(m.revenue),
      })),
      byCampaign: byCampaign.map((c) => ({
        campaign: c.campaign,
        events: parseInt(c.events, 10),
        users: parseInt(c.users, 10),
        revenue: parseFloat(c.revenue),
      })),
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }

  private async queryQuality(projectId: string): Promise<QualityReport> {
    // Event validation stats (last 24h)
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;

    const validQuery = `
      SELECT count() as valid
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND received_at >= ${oneDayAgo}
      FORMAT JSONEachRow
    `;

    const invalidQuery = `
      SELECT count() as invalid
      FROM events_invalid
      WHERE received_at >= ${oneDayAgo}
      FORMAT JSONEachRow
    `;

    const metaQuery = `
      SELECT
        count() as total,
        countIf(status = 'delivered') as delivered,
        countIf(status = 'failed') as failed,
        countIf(status = 'retrying') as retrying
      FROM meta_delivery_log
      WHERE project_id = '${this.escape(projectId)}'
      FORMAT JSONEachRow
    `;

    const [valid, invalid, meta] = await Promise.all([
      this.clickhouse.queryRows<{ valid: string }>(validQuery),
      this.clickhouse.queryRows<{ invalid: string }>(invalidQuery),
      this.clickhouse.queryRows<{
        total: string;
        delivered: string;
        failed: string;
        retrying: string;
      }>(metaQuery),
    ]);

    const validCount = parseInt(valid[0]?.valid || '0', 10);
    const invalidCount = parseInt(invalid[0]?.invalid || '0', 10);
    const totalEvents = validCount + invalidCount;

    const metaTotal = parseInt(meta[0]?.total || '0', 10);
    const metaDelivered = parseInt(meta[0]?.delivered || '0', 10);

    // Get recent errors from MySQL
    const recentErrors = await this.prisma.errorLog.groupBy({
      by: ['type', 'message'],
      where: { projectId },
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 10,
    });

    return {
      eventValidation: {
        total: totalEvents,
        valid: validCount,
        invalid: invalidCount,
        validationRate: totalEvents > 0 ? Math.round((validCount / totalEvents) * 100) : 100,
      },
      metaDelivery: {
        total: metaTotal,
        delivered: metaDelivered,
        failed: parseInt(meta[0]?.failed || '0', 10),
        retrying: parseInt(meta[0]?.retrying || '0', 10),
        deliveryRate: metaTotal > 0 ? Math.round((metaDelivered / metaTotal) * 100) : 100,
      },
      recentErrors: recentErrors.map((e) => ({
        type: e.type,
        message: e.message,
        count: e._count,
      })),
    };
  }

  private getDateRange(range: DateRange): { startDate: string; endDate: string } {
    const endDate = range.endDate || new Date().toISOString().split('T')[0];
    const startDate =
      range.startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return { startDate, endDate };
  }

  private escape(value: string): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
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
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
