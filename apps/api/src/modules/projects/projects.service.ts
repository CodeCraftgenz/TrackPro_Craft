import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MemberRole, ProjectStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateProjectDto) {
    await this.checkTenantAccess(tenantId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

    const existingProject = await this.prisma.project.findUnique({
      where: {
        tenantId_domain: {
          tenantId,
          domain: dto.domain,
        },
      },
    });

    if (existingProject) {
      throw new BadRequestException('Project with this domain already exists');
    }

    return this.prisma.project.create({
      data: {
        tenantId,
        name: dto.name,
        domain: dto.domain,
        timezone: dto.timezone || 'America/Sao_Paulo',
        retentionDays: dto.retentionDays || 90,
      },
    });
  }

  async findAllForTenant(tenantId: string, userId: string) {
    await this.checkTenantAccess(tenantId, userId);

    return this.prisma.project.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            apiKeys: {
              where: { revokedAt: null },
            },
          },
        },
        integrationMeta: {
          select: {
            enabled: true,
            pixelId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(projectId: string, tenantId: string, userId: string) {
    await this.checkTenantAccess(tenantId, userId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId,
      },
      include: {
        apiKeys: {
          where: { revokedAt: null },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            scopes: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
        integrationMeta: {
          select: {
            id: true,
            pixelId: true,
            testEventCode: true,
            enabled: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(projectId: string, tenantId: string, userId: string, dto: UpdateProjectDto) {
    await this.checkTenantAccess(tenantId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.domain && dto.domain !== project.domain) {
      const existingProject = await this.prisma.project.findUnique({
        where: {
          tenantId_domain: {
            tenantId,
            domain: dto.domain,
          },
        },
      });

      if (existingProject) {
        throw new BadRequestException('Project with this domain already exists');
      }
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async delete(projectId: string, tenantId: string, userId: string) {
    await this.checkTenantAccess(tenantId, userId, [MemberRole.OWNER]);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  async updateStatus(
    projectId: string,
    tenantId: string,
    userId: string,
    status: ProjectStatus,
  ) {
    await this.checkTenantAccess(tenantId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status },
    });
  }

  private async checkTenantAccess(
    tenantId: string,
    userId: string,
    allowedRoles?: MemberRole[],
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
