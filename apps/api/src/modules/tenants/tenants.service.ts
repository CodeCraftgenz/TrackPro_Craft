import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, AddMemberDto } from './dto/tenants.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTenantDto) {
    const slug = this.generateSlug(dto.name);

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new BadRequestException('Tenant with this name already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        memberships: {
          create: {
            userId,
            role: MemberRole.OWNER,
          },
        },
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return tenant;
  }

  async findAllForUser(userId: string) {
    return this.prisma.tenant.findMany({
      where: {
        memberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        memberships: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            projects: true,
            memberships: true,
          },
        },
      },
    });
  }

  async findById(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        memberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(tenantId: string, userId: string, dto: UpdateTenantDto) {
    await this.checkOwnerPermission(tenantId, userId);

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { name: dto.name },
    });
  }

  async delete(tenantId: string, userId: string) {
    await this.checkOwnerPermission(tenantId, userId);

    await this.prisma.tenant.delete({
      where: { id: tenantId },
    });
  }

  async addMember(tenantId: string, actorUserId: string, dto: AddMemberDto) {
    await this.checkAdminPermission(tenantId, actorUserId);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member');
    }

    return this.prisma.membership.create({
      data: {
        userId: user.id,
        tenantId,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(tenantId: string, actorUserId: string, memberUserId: string) {
    await this.checkAdminPermission(tenantId, actorUserId);

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: memberUserId,
          tenantId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the owner');
    }

    await this.prisma.membership.delete({
      where: {
        userId_tenantId: {
          userId: memberUserId,
          tenantId,
        },
      },
    });
  }

  async updateMemberRole(
    tenantId: string,
    actorUserId: string,
    memberUserId: string,
    role: MemberRole,
  ) {
    await this.checkOwnerPermission(tenantId, actorUserId);

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: memberUserId,
          tenantId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === MemberRole.OWNER && role !== MemberRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    return this.prisma.membership.update({
      where: {
        userId_tenantId: {
          userId: memberUserId,
          tenantId,
        },
      },
      data: { role },
    });
  }

  private async checkOwnerPermission(tenantId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!membership || membership.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can perform this action');
    }
  }

  private async checkAdminPermission(tenantId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
}
