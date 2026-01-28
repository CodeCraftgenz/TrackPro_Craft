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
var ClickHouseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickHouseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ClickHouseService = ClickHouseService_1 = class ClickHouseService {
    configService;
    logger = new common_1.Logger(ClickHouseService_1.name);
    config;
    baseUrl;
    constructor(configService) {
        this.configService = configService;
        this.config = {
            host: this.configService.get('CLICKHOUSE_HOST', 'localhost'),
            port: this.configService.get('CLICKHOUSE_PORT', 8123),
            database: this.configService.get('CLICKHOUSE_DATABASE', 'trackpro'),
            username: this.configService.get('CLICKHOUSE_USER', 'default'),
            password: this.configService.get('CLICKHOUSE_PASSWORD', ''),
            protocol: this.configService.get('CLICKHOUSE_PROTOCOL', 'http'),
        };
        this.baseUrl = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
    }
    async onModuleInit() {
        try {
            await this.query('SELECT 1');
            this.logger.log('ClickHouse connected');
        }
        catch (error) {
            this.logger.warn('Failed to connect to ClickHouse - analytics will be unavailable', error);
        }
    }
    async query(sql) {
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
            return [];
        }
        const lines = text.trim().split('\n');
        return lines.map((line) => JSON.parse(line));
    }
    async queryRows(sql) {
        return this.query(sql);
    }
    async getRecentEvents(projectId, options = {}) {
        const { limit = 50, offset = 0, eventName, startDate, endDate } = options;
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
        const countResult = await this.query(countSql);
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
        const events = await this.query(eventsSql);
        return { events, total };
    }
    async getEventStats(projectId, options = {}) {
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
        const totalSql = `SELECT count() as total FROM events_raw WHERE ${where}`;
        const totalResult = await this.query(totalSql);
        const totalEvents = parseInt(totalResult[0]?.total || '0', 10);
        const todaySql = `
      SELECT count() as total
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}'
        AND event_time >= ${todayStart}
    `;
        const todayResult = await this.query(todaySql);
        const eventsToday = parseInt(todayResult[0]?.total || '0', 10);
        const usersSql = `
      SELECT uniq(anonymous_id) as unique_users
      FROM events_raw
      WHERE ${where}
    `;
        const usersResult = await this.query(usersSql);
        const uniqueUsers = parseInt(usersResult[0]?.unique_users || '0', 10);
        const topSql = `
      SELECT event_name, count() as count
      FROM events_raw
      WHERE ${where}
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
    `;
        const topResult = await this.query(topSql);
        const topEvents = topResult.map((row) => ({
            event_name: row.event_name,
            count: parseInt(row.count, 10),
        }));
        return { totalEvents, eventsToday, uniqueUsers, topEvents };
    }
    async ping() {
        try {
            await this.query('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
    async getMetaDeliveryLogs(projectId, options = {}) {
        const { limit = 50, offset = 0, status } = options;
        const conditions = [`project_id = '${this.escape(projectId)}'`];
        if (status) {
            conditions.push(`status = '${this.escape(status)}'`);
        }
        const where = conditions.join(' AND ');
        try {
            const countSql = `SELECT count() as total FROM meta_delivery_log WHERE ${where}`;
            const countResult = await this.query(countSql);
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
            const logs = await this.query(logsSql);
            return { logs, total };
        }
        catch {
            return { logs: [], total: 0 };
        }
    }
    async getMetaDeliveryStats(projectId) {
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
            const result = await this.query(sql);
            return {
                total: parseInt(result[0]?.total || '0', 10),
                delivered: parseInt(result[0]?.delivered || '0', 10),
                failed: parseInt(result[0]?.failed || '0', 10),
                retrying: parseInt(result[0]?.retrying || '0', 10),
            };
        }
        catch {
            return { total: 0, delivered: 0, failed: 0, retrying: 0 };
        }
    }
    async deleteUserData(projectId, anonymousId) {
        const sql = `ALTER TABLE events_raw DELETE WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'`;
        await this.query(sql);
        this.logger.log({
            message: 'User data deleted from ClickHouse',
            projectId,
            anonymousId,
        });
    }
    async anonymizeUserData(projectId, anonymousId) {
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
    async getUserEventCount(projectId, anonymousId) {
        const sql = `
      SELECT count() as total
      FROM events_raw
      WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'
    `;
        const result = await this.query(sql);
        return parseInt(result[0]?.total || '0', 10);
    }
    escape(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
    }
};
exports.ClickHouseService = ClickHouseService;
exports.ClickHouseService = ClickHouseService = ClickHouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClickHouseService);
//# sourceMappingURL=clickhouse.service.js.map