import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/projects.dto';

export interface GeneratedApiKey {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: Date;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<GeneratedApiKey> {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    // Generate API key and secret
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateSecret();

    const keyHash = this.hashKey(apiKey);
    const secretHash = this.hashKey(apiSecret);
    const keyPrefix = apiKey.substring(0, 8);

    const createdKey = await this.prisma.apiKey.create({
      data: {
        projectId,
        name: dto.name,
        keyHash,
        keyPrefix,
        secretHash,
        scopes: dto.scopes || ['events:write'],
      },
    });

    // Return the plain key and secret only once
    return {
      id: createdKey.id,
      name: createdKey.name,
      apiKey,
      apiSecret,
      keyPrefix,
      scopes: createdKey.scopes as string[],
      createdAt: createdKey.createdAt,
    };
  }

  async findAllForProject(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    return this.prisma.apiKey.findMany({
      where: {
        projectId,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(apiKeyId: string, projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        projectId,
        revokedAt: null,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { revokedAt: new Date() },
    });
  }

  async validateApiKey(
    apiKey: string,
  ): Promise<{ projectId: string; scopes: string[] } | null> {
    const keyHash = this.hashKey(apiKey);

    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        project: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!key || key.revokedAt || key.project.status !== 'ACTIVE') {
      return null;
    }

    // Update last used
    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      projectId: key.projectId,
      scopes: key.scopes as string[],
    };
  }

  async getSecretForProject(projectId: string, apiKey: string): Promise<string | null> {
    const keyHash = this.hashKey(apiKey);

    const key = await this.prisma.apiKey.findFirst({
      where: {
        projectId,
        keyHash,
        revokedAt: null,
      },
    });

    if (!key) {
      return null;
    }

    return key.secretHash;
  }

  private generateApiKey(): string {
    return `tp_${crypto.randomBytes(24).toString('hex')}`;
  }

  private generateSecret(): string {
    return `tps_${crypto.randomBytes(32).toString('hex')}`;
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private async checkProjectAccess(
    projectId: string,
    tenantId: string,
    userId: string,
    allowedRoles?: MemberRole[],
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
