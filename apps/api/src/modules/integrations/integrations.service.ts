import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { CreateMetaIntegrationDto, UpdateMetaIntegrationDto } from './dto/integrations.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async getMetaIntegration(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const integration = await this.prisma.integrationMeta.findUnique({
      where: { projectId },
    });

    if (!integration) {
      return null;
    }

    // Don't return the encrypted token, just indicate it exists
    return {
      id: integration.id,
      pixelId: integration.pixelId,
      testEventCode: integration.testEventCode,
      enabled: integration.enabled,
      hasAccessToken: !!integration.accessTokenEncrypted,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  async createMetaIntegration(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateMetaIntegrationDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    // Check if integration already exists
    const existing = await this.prisma.integrationMeta.findUnique({
      where: { projectId },
    });

    if (existing) {
      throw new ConflictException('Meta integration already exists for this project');
    }

    // Encrypt the access token
    const encryptedToken = this.encryption.encrypt(dto.accessToken);

    const integration = await this.prisma.integrationMeta.create({
      data: {
        projectId,
        pixelId: dto.pixelId,
        accessTokenEncrypted: encryptedToken,
        testEventCode: dto.testEventCode,
        enabled: true,
      },
    });

    return {
      id: integration.id,
      pixelId: integration.pixelId,
      testEventCode: integration.testEventCode,
      enabled: integration.enabled,
      hasAccessToken: true,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  async updateMetaIntegration(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: UpdateMetaIntegrationDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const existing = await this.prisma.integrationMeta.findUnique({
      where: { projectId },
    });

    if (!existing) {
      throw new NotFoundException('Meta integration not found');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.pixelId !== undefined) {
      updateData.pixelId = dto.pixelId;
    }

    if (dto.accessToken !== undefined) {
      updateData.accessTokenEncrypted = this.encryption.encrypt(dto.accessToken);
    }

    if (dto.testEventCode !== undefined) {
      updateData.testEventCode = dto.testEventCode;
    }

    if (dto.enabled !== undefined) {
      updateData.enabled = dto.enabled;
    }

    const integration = await this.prisma.integrationMeta.update({
      where: { projectId },
      data: updateData,
    });

    return {
      id: integration.id,
      pixelId: integration.pixelId,
      testEventCode: integration.testEventCode,
      enabled: integration.enabled,
      hasAccessToken: !!integration.accessTokenEncrypted,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  async deleteMetaIntegration(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId, [MemberRole.OWNER]);

    const existing = await this.prisma.integrationMeta.findUnique({
      where: { projectId },
    });

    if (!existing) {
      throw new NotFoundException('Meta integration not found');
    }

    await this.prisma.integrationMeta.delete({
      where: { projectId },
    });
  }

  async testMetaIntegration(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const integration = await this.prisma.integrationMeta.findUnique({
      where: { projectId },
    });

    if (!integration) {
      throw new NotFoundException('Meta integration not found');
    }

    // Decrypt the access token
    const accessToken = this.encryption.decrypt(integration.accessTokenEncrypted);

    // Test the connection by fetching pixel info
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${integration.pixelId}?access_token=${accessToken}`,
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Failed to connect to Meta API',
        };
      }

      const data = await response.json();

      return {
        success: true,
        pixelName: data.name,
        pixelId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  private async checkProjectAccess(
    projectId: string,
    tenantId: string,
    userId: string,
    allowedRoles?: MemberRole[],
  ): Promise<void> {
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
