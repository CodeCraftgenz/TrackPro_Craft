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
  user_id?: string;
  session_id: string;
  url?: string;
  path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ip?: string;
  user_agent?: string;
  country?: string;
  consent_categories: string[];
  order_id?: string;
  value?: number;
  currency?: string;
  payload_json: string;
}

export interface InvalidEventRow {
  request_id: string;
  reason: string;
  raw_payload: string;
  received_at: number;
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
      this.logger.error('Failed to connect to ClickHouse', error);
    }
  }

  private async query(sql: string): Promise<unknown> {
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

  async insertEvents(events: EventRow[]): Promise<void> {
    if (events.length === 0) return;

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

  async insertInvalidEvent(event: InvalidEventRow): Promise<void> {
    const sql = `INSERT INTO events_invalid (request_id, reason, raw_payload, received_at) VALUES (
      ${this.escape(event.request_id)},
      ${this.escape(event.reason)},
      ${this.escape(event.raw_payload)},
      ${event.received_at}
    )`;

    await this.query(sql);
  }

  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private escape(value: string): string {
    if (value === null || value === undefined) {
      return "''";
    }
    return `'${String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\')}'`;
  }
}
