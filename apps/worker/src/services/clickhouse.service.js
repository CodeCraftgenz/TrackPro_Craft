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
            this.logger.error('Failed to connect to ClickHouse', error);
        }
    }
    async query(sql) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('database', this.config.database);
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
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return response.json();
        }
        return response.text();
    }
    async insertMetaDeliveryLog(data) {
        const sql = `INSERT INTO meta_delivery_log (event_id, project_id, status, attempts, last_error, updated_at)
      VALUES (
        '${data.event_id}',
        '${data.project_id}',
        '${data.status}',
        ${data.attempts},
        '${data.last_error || ''}',
        ${Math.floor(Date.now() / 1000)}
      )`;
        await this.query(sql);
    }
    async deleteOldEvents(projectId, retentionDays) {
        const cutoffTime = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;
        const sql = `ALTER TABLE events_raw DELETE WHERE project_id = '${this.escape(projectId)}' AND event_time < ${cutoffTime}`;
        await this.query(sql);
        return 0;
    }
    async deleteOldMetaDeliveryLogs(projectId, retentionDays) {
        const cutoffTime = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;
        const sql = `ALTER TABLE meta_delivery_log DELETE WHERE project_id = '${this.escape(projectId)}' AND updated_at < ${cutoffTime}`;
        await this.query(sql);
    }
    async deleteUserData(projectId, anonymousId) {
        const deleteEventsSql = `ALTER TABLE events_raw DELETE WHERE project_id = '${this.escape(projectId)}' AND anonymous_id = '${this.escape(anonymousId)}'`;
        await this.query(deleteEventsSql);
        this.logger.log({
            message: 'User data deleted from ClickHouse',
            projectId,
            anonymousId,
        });
    }
    async anonymizeUserData(projectId, anonymousId) {
        const anonId = `anon_${Date.now()}`;
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
    }
    escape(value) {
        if (value === null || value === undefined)
            return '';
        return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
    }
    async getEventsForExport(projectId, startDate, endDate, limit, offset) {
        const sql = `
      SELECT *
      FROM events_raw
      WHERE project_id = '${projectId}'
        AND toDate(toDateTime(event_time)) BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY event_time DESC
      LIMIT ${limit} OFFSET ${offset}
      FORMAT JSON
    `;
        const result = await this.query(sql);
        return result.data || [];
    }
    async getAggregatedEventsForExport(projectId, startDate, endDate) {
        const sql = `
      SELECT
        date,
        event_name,
        event_count,
        unique_users,
        unique_sessions
      FROM events_agg_daily
      WHERE project_id = '${this.escape(projectId)}'
        AND date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY date DESC, event_name
      FORMAT JSON
    `;
        try {
            const result = await this.query(sql);
            return result.data || [];
        }
        catch {
            return [];
        }
    }
    async buildDailyAggregates(projectId, date) {
        const sql = `
      INSERT INTO events_agg_daily
      SELECT
        '${projectId}' as project_id,
        toDate('${date}') as date,
        event_name,
        count() as event_count,
        uniqExact(anonymous_id) as unique_users,
        uniqExact(session_id) as unique_sessions
      FROM events_raw
      WHERE project_id = '${projectId}'
        AND toDate(toDateTime(event_time)) = '${date}'
      GROUP BY event_name
    `;
        await this.query(sql);
    }
};
exports.ClickHouseService = ClickHouseService;
exports.ClickHouseService = ClickHouseService = ClickHouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClickHouseService);
//# sourceMappingURL=clickhouse.service.js.map