import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from './redis.service';

interface ApiKeyInfo {
  projectId: string;
  tenantId: string;
  scopes: string[];
  status: string;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly apiUrl: string;
  private readonly cachePrefix = 'apikey:';
  private readonly cacheTtl = 300; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
  }

  async validateApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
    if (!apiKey || !apiKey.startsWith('tp_')) {
      return null;
    }

    // Check cache first
    const cached = await this.redis.getClient().get(`${this.cachePrefix}${apiKey}`);
    if (cached) {
      if (cached === 'invalid') {
        return null;
      }
      return JSON.parse(cached);
    }

    // Validate against API service
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/internal/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.configService.get<string>('INTERNAL_API_SECRET', ''),
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        // Cache invalid result to avoid hammering the API
        await this.redis.getClient().set(
          `${this.cachePrefix}${apiKey}`,
          'invalid',
          'EX',
          60, // 1 minute for invalid keys
        );
        return null;
      }

      const data = (await response.json()) as ApiKeyInfo;

      // Cache valid result
      await this.redis.getClient().set(
        `${this.cachePrefix}${apiKey}`,
        JSON.stringify(data),
        'EX',
        this.cacheTtl,
      );

      return data;
    } catch (error) {
      this.logger.error('Failed to validate API key', error);

      // In development mode, return a mock project ID
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        const devInfo: ApiKeyInfo = {
          projectId: 'dev-project-id',
          tenantId: 'dev-tenant-id',
          scopes: ['events:write', 'events:read'],
          status: 'active',
        };

        await this.redis.getClient().set(
          `${this.cachePrefix}${apiKey}`,
          JSON.stringify(devInfo),
          'EX',
          this.cacheTtl,
        );

        return devInfo;
      }

      return null;
    }
  }

  async invalidateCache(apiKey: string): Promise<void> {
    await this.redis.getClient().del(`${this.cachePrefix}${apiKey}`);
  }
}
