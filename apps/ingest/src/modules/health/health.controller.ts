import { Controller, Get } from '@nestjs/common';

import { RedisService } from '../../services/redis.service';
import { ClickHouseService } from '../../services/clickhouse.service';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    redis: 'up' | 'down';
    clickhouse: 'up' | 'down';
  };
  uptime: number;
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly redis: RedisService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  @Get()
  async check(): Promise<HealthStatus> {
    const [redisStatus, clickhouseStatus] = await Promise.all([
      this.checkRedis(),
      this.checkClickHouse(),
    ]);

    const isHealthy = redisStatus === 'up' && clickhouseStatus === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
        clickhouse: clickhouseStatus,
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('ready')
  async ready(): Promise<{ ready: boolean }> {
    const [redisStatus, clickhouseStatus] = await Promise.all([
      this.checkRedis(),
      this.checkClickHouse(),
    ]);

    return {
      ready: redisStatus === 'up' && clickhouseStatus === 'up',
    };
  }

  @Get('live')
  live(): { live: boolean } {
    return { live: true };
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      await this.redis.getClient().ping();
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkClickHouse(): Promise<'up' | 'down'> {
    try {
      const isConnected = await this.clickhouse.ping();
      return isConnected ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
