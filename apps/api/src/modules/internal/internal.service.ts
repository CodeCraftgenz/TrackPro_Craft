import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';
import { ApiKeysService } from '../projects/api-keys.service';

export interface ApiKeyValidationResult {
  projectId: string;
  tenantId: string;
  scopes: string[];
  status: string;
}

@Injectable()
export class InternalService {
  private readonly internalSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
  ) {
    this.internalSecret = this.configService.get<string>('INTERNAL_API_SECRET', '');
  }

  validateInternalRequest(secret: string): void {
    // In development mode, allow requests without secret
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      return;
    }

    if (!this.internalSecret || secret !== this.internalSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }
  }

  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult | null> {
    if (!apiKey || !apiKey.startsWith('tp_')) {
      return null;
    }

    // Use existing API key validation
    const result = await this.apiKeysService.validateApiKey(apiKey);

    if (!result) {
      return null;
    }

    // Get tenant ID from project
    const project = await this.prisma.project.findUnique({
      where: { id: result.projectId },
      select: { tenantId: true, status: true },
    });

    if (!project) {
      return null;
    }

    return {
      projectId: result.projectId,
      tenantId: project.tenantId,
      scopes: result.scopes,
      status: project.status,
    };
  }
}
