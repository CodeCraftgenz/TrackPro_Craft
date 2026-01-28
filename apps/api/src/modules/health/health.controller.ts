import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ClickHouseService } from '../analytics/clickhouse.service';

interface ServiceCheck {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceCheck;
    redis: ServiceCheck;
    clickhouse: ServiceCheck;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface MetricsResponse {
  timestamp: string;
  uptime: number;
  requests: {
    total: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();
  private requestCount = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check(@Res() res: Response): Promise<void> {
    this.requestCount++;

    const [dbCheck, redisCheck, clickhouseCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkClickHouse(),
    ]);

    const allUp = dbCheck.status === 'up' && redisCheck.status === 'up';
    const anyDown = dbCheck.status === 'down' || redisCheck.status === 'down';

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let httpStatus: number;

    if (allUp && clickhouseCheck.status === 'up') {
      status = 'healthy';
      httpStatus = HttpStatus.OK;
    } else if (anyDown) {
      status = 'unhealthy';
      httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
    } else {
      status = 'degraded';
      httpStatus = HttpStatus.OK;
    }

    const memUsage = process.memoryUsage();

    const response: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbCheck,
        redis: redisCheck,
        clickhouse: clickhouseCheck,
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
    };

    res.status(httpStatus).json(response);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for k8s' })
  async ready(@Res() res: Response): Promise<void> {
    const [dbCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const ready = dbCheck.status === 'up' && redisCheck.status === 'up';

    res.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      ready,
      timestamp: new Date().toISOString(),
    });
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check for k8s' })
  live(): { live: boolean; timestamp: string } {
    return {
      live: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Basic metrics endpoint' })
  metrics(): MetricsResponse {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: this.requestCount,
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000),
      },
    };
  }

  private async checkDatabase(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      await this.redis.getClient().ping();
      return {
        status: 'up',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkClickHouse(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      const isUp = await this.clickhouse.ping();
      return {
        status: isUp ? 'up' : 'down',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
