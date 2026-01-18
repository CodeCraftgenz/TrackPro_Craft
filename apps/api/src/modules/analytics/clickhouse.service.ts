import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ClickHouseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  protocol: 'http' | 'https';
}

export interface EventRow {
  event_id: string;
  project_id: string;
  event_name: string;
  event_time: number;
  received_at: number;
  anonymous_id: string;
  user_id: string;
  session_id: string;
  url: string;
  path: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  ip: string;
  user_agent: string;
  country: string;
  value: number;
  currency: string;
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private readonly config: ClickHouseConfig;
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      host: this.configService.get<string>('CLICKHOUSE_HOST', 'localhost'),
      port: this.configService.get<number>('CLICKHOUSE_PORT', 8123),
      database: this.configService.get<string>('CLICKHOUSE_DATABASE', 'trackpro'),
      username: this.configService.get<string>('CLICKHOUSE_USER', 'default'),
      password: this.configService.get<string>('CLICKHOUSE_PASSWORD', ''),
      protocol: this.configService.get<'http' | 'https'>('CLICKHOUSE_PROTOCOL', 'http'),
    };

    this.baseUrl = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
  }

  async onModuleInit() {
    try {
      await this.query('SELECT 1');
      this.logger.log('ClickHouse connected');
    } catch (error) {
      this.logger.warn('Failed to connect to ClickHouse - analytics will be unavailable', error);
    }
  }

  private async query<T>(sql: string): Promise<T> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('database', this.config.database);
    url.searchParams.set('default_format', 'JSONEachRow');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-ClickHouse-User': this.config.username,
        'X-ClickHouse-Key': this.config.password,
      },
      body: sql,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ClickHouse error: ${text}`);
    }

    const text = await response.text();
    if (!text.trim()) {
      return [] as T;
    }

    // Parse JSONEachRow format
    const lines = text.trim().split('\n');
    return lines.map((line) => JSON.parse(line)) as T;
  }

  async queryRows<T>(sql: string): Promise<T[]> {
    return this.query<T[]>(sql);
  }

  async getRecentEvents(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      eventName?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{ events: EventRow[]; total: number }> {
    const { limit = 50, offset = 0, eventName, startDate, endDate } = options;

    try {
      const conditions = [`project_id = '${this.escape(projectId)}'`];

      if (eventName) {
        conditions.push(`event_name = '${this.escape(eventName)}'`);
      }

      if (startDate) {
        conditions.push(`event_time >= ${Math.floor(startDate.getTime() / 1000)}`);
      }

      if (endDate) {
        conditions.push(`event_time <= ${Math.floor(endDate.getTime() / 1000)}`);
      }

      const where = conditions.join(' AND ');

      const countSql = `SELECT count() as total FROM events_raw WHERE ${where}`;
      const countResult = await this.query<[{ total: string }]>(countSql);
      const total = parseInt(countResult[0]?.total || '0', 10);

      const eventsSql = `
        SELECT
          event_id,
          project_id,
          event_name,
          event_time,
          received_at,
          anonymous_id,
          user_id,
          session_id,
          url,
          path,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          ip,
          user_agent,
          country,
          value,
          currency
        FROM events_raw
        WHERE ${where}
        ORDER BY event_time DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const events = await this.query<EventRow[]>(eventsSql);

      return { events, total };
    } catch (error) {
      this.logger.warn('Failed to fetch events from ClickHouse', error);
      return { events: [], total: 0 };
    }
  }

  async getEventStats(
    projectId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    totalEvents: number;
    eventsToday: number;
    uniqueUsers: number;
    topEvents: Array<{ event_name: string; count: number }>;
  }> {
    try {
      const { startDate, endDate } = options;

      const now = Math.floor(Date.now() / 1000);
      const todayStart = now - (now % 86400);

      const conditions = [`project_id = '${this.escape(projectId)}'`];

      if (startDate) {
        conditions.push(`event_time >= ${Math.floor(startDate.getTime() / 1000)}`);
      }

      if (endDate) {
        conditions.push(`event_time <= ${Math.floor(endDate.getTime() / 1000)}`);
      }

      const where = conditions.join(' AND ');

      // Total events
      const totalSql = `SELECT count() as total FROM events_raw WHERE ${where}`;
      const totalResult = await this.query<[{ total: string }]>(totalSql);
      const totalEvents = parseInt(totalResult[0]?.total || '0', 10);

      // Events today
      const todaySql = `
        SELECT count() as total
        FROM events_raw
        WHERE project_id = '${this.escape(projectId)}'
          AND event_time >= ${todayStart}
      `;
      const todayResult = await this.query<[{ total: string }]>(todaySql);
      const eventsToday = parseInt(todayResult[0]?.total || '0', 10);

      // Unique users
      const usersSql = `
        SELECT uniq(anonymous_id) as unique_users
        FROM events_raw
        WHERE ${where}
      `;
      const usersResult = await this.query<[{ unique_users: string }]>(usersSql);
      const uniqueUsers = parseInt(usersResult[0]?.unique_users || '0', 10);

      // Top events
      const topSql = `
        SELECT event_name, count() as count
        FROM events_raw
        WHERE ${where}
        GROUP BY event_name
        ORDER BY count DESC
        LIMIT 10
      `;
      const topResult = await this.query<Array<{ event_name: string; count: string }>>(topSql);
      const topEvents = topResult.map((row) => ({
        event_name: row.event_name,
        count: parseInt(row.count, 10),
      }));

      return { totalEvents, eventsToday, uniqueUsers, topEvents };
    } catch (error) {
      this.logger.warn('Failed to fetch event stats from ClickHouse', error);
      return { totalEvents: 0, eventsToday: 0, uniqueUsers: 0, topEvents: [] };
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async getMetaDeliveryLogs(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {},
  ): Promise<{
    logs: Array<{
      event_id: string;
      project_id: string;
      status: string;
      attempts: number;
      last_error: string;
      delivered_at: number;
    }>;
    total: number;
  }> {
    const { limit = 50, offset = 0, status } = options;

    const conditions = [`project_id = '${this.escape(projectId)}'`];

    if (status) {
      conditions.push(`status = '${this.escape(status)}'`);
    }

    const where = conditions.join(' AND ');

    try {
      const countSql = `SELECT count() as total FROM meta_delivery_log WHERE ${where}`;
      const countResult = await this.query<[{ total: string }]>(countSql);
      const total = parseInt(countResult[0]?.total || '0', 10);

      const logsSql = `
        SELECT
          event_id,
          project_id,
          status,
          attempts,
          last_error,
          delivered_at
        FROM meta_delivery_log
        WHERE ${where}
        ORDER BY delivered_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const logs = await this.query<
        Array<{
          event_id: string;
          project_id: string;
          status: string;
          attempts: number;
          last_error: string;
          delivered_at: number;
        }>
      >(logsSql);

      return { logs, total };
    } catch {
      // Table might not exist yet
      return { logs: [], total: 0 };
    }
  }

  async getMetaDeliveryStats(projectId: string): Promise<{
    total: number;
    delivered: number;
    failed: number;
    retrying: number;
  }> {
    try {
      const sql = `
        SELECT
          count() as total,
          countIf(status = 'delivered') as delivered,
          countIf(status = 'failed') as failed,
          countIf(status = 'retrying') as retrying
        FROM meta_delivery_log
        WHERE project_id = '${this.escape(projectId)}'
      `;

      const result = await this.query<
        [{ total: string; delivered: string; failed: string; retrying: string }]
      >(sql);

      return {
        total: parseInt(result[0]?.total || '0', 10),
        delivered: parseInt(result[0]?.delivered || '0', 10),
        failed: parseInt(result[0]?.failed || '0', 10),
        retrying: parseInt(result[0]?.retrying || '0', 10),
      };
    } catch {
      return { total: 0, delivered: 0, failed: 0, retrying: 0 };
    }
  }

  async deleteUserData(projectId: string, anonymousId: string): Promise<void> {
    const sql = `ALTER TABLE events_raw DELETE WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'`;
    await this.query(sql);

    this.logger.log({
      message: 'User data deleted from ClickHouse',
      projectId,
      anonymousId,
    });
  }

  async anonymizeUserData(projectId: string, anonymousId: string): Promise<string> {
    const anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const updateSql = `
      ALTER TABLE events_raw UPDATE
        anonymous_id = '${anonId}',
        user_id = '',
        ip = '',
        user_agent = 'anonymized'
      WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'
    `;
    await this.query(updateSql);

    this.logger.log({
      message: 'User data anonymized in ClickHouse',
      projectId,
      originalAnonymousId: anonymousId,
      newAnonymousId: anonId,
    });

    return anonId;
  }

  async getUserEventCount(projectId: string, anonymousId: string): Promise<number> {
    const sql = `
      SELECT count() as total
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'
    `;
    const result = await this.query<[{ total: string }]>(sql);
    return parseInt(result[0]?.total || '0', 10);
  }

  private escape(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }
}
