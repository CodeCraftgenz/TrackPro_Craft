import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis error', error);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // Deduplication: check if event_id was already processed
  async checkDedupe(key: string, ttlSeconds = 3600): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK'; // true = new event, false = duplicate
  }

  // Rate limiting by project
  async checkRateLimit(projectId: string, limit: number, windowSeconds: number): Promise<boolean> {
    const key = `rate:${projectId}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
    const current = await this.client.incr(key);

    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }

    return current <= limit;
  }

  // Store timestamp for anti-replay
  async storeTimestamp(key: string, timestamp: number, ttlSeconds: number): Promise<boolean> {
    const exists = await this.client.exists(key);
    if (exists) {
      return false; // Replay attack
    }
    await this.client.set(key, timestamp.toString(), 'EX', ttlSeconds);
    return true;
  }
}
