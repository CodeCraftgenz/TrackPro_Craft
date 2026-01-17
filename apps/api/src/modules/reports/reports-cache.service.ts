import { Injectable } from '@nestjs/common';

import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ReportsCacheService {
  private readonly PREFIX = 'report:';
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redis.getJson<T>(this.PREFIX + key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.redis.setJson(this.PREFIX + key, value, ttlSeconds || this.DEFAULT_TTL);
  }

  async invalidate(pattern: string): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(this.PREFIX + pattern + '*');
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  buildKey(
    projectId: string,
    reportType: string,
    params: {
      startDate?: string;
      endDate?: string;
      [key: string]: string | undefined;
    },
  ): string {
    const paramStr = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');

    return `${projectId}:${reportType}:${paramStr}`;
  }

  getTtlForPeriod(startDate?: string, endDate?: string): number {
    // If dates are in the past (completed period), cache longer
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;

    // Same day - cache 1 minute
    if (end.toDateString() === now.toDateString()) {
      return 60;
    }

    // Yesterday or before - cache 1 hour
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (end <= yesterday) {
      return 3600;
    }

    // Default - 5 minutes
    return 300;
  }
}
