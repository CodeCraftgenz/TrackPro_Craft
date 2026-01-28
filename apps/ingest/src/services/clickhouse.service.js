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
    async insertEvents(events) {
        if (events.length === 0)
            return;
        const columns = [
            'event_id',
            'project_id',
            'event_name',
            'event_time',
            'received_at',
            'anonymous_id',
            'user_id',
            'session_id',
            'url',
            'path',
            'referrer',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
            'ip',
            'user_agent',
            'country',
            'consent_categories',
            'order_id',
            'value',
            'currency',
            'payload_json',
        ];
        const values = events
            .map((e) => {
            const row = [
                this.escape(e.event_id),
                this.escape(e.project_id),
                this.escape(e.event_name),
                e.event_time,
                e.received_at,
                this.escape(e.anonymous_id),
                this.escape(e.user_id || ''),
                this.escape(e.session_id),
                this.escape(e.url || ''),
                this.escape(e.path || ''),
                this.escape(e.referrer || ''),
                this.escape(e.utm_source || ''),
                this.escape(e.utm_medium || ''),
                this.escape(e.utm_campaign || ''),
                this.escape(e.utm_content || ''),
                this.escape(e.utm_term || ''),
                this.escape(e.ip || ''),
                this.escape(e.user_agent || ''),
                this.escape(e.country || ''),
                `[${e.consent_categories.map((c) => this.escape(c)).join(',')}]`,
                this.escape(e.order_id || ''),
                e.value ?? 0,
                this.escape(e.currency || ''),
                this.escape(e.payload_json),
            ];
            return `(${row.join(',')})`;
        })
            .join(',');
        const sql = `INSERT INTO events_raw (${columns.join(',')}) VALUES ${values}`;
        await this.query(sql);
        this.logger.debug(`Inserted ${events.length} events`);
    }
    async insertInvalidEvent(event) {
        const sql = `INSERT INTO events_invalid (request_id, reason, raw_payload, received_at) VALUES (
      ${this.escape(event.request_id)},
      ${this.escape(event.reason)},
      ${this.escape(event.raw_payload)},
      ${event.received_at}
    )`;
        await this.query(sql);
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
    escape(value) {
        if (value === null || value === undefined) {
            return "''";
        }
        return `'${String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\')}'`;
    }
};
exports.ClickHouseService = ClickHouseService;
exports.ClickHouseService = ClickHouseService = ClickHouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClickHouseService);
//# sourceMappingURL=clickhouse.service.js.map