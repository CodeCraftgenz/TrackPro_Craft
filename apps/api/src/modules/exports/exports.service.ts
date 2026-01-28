import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MemberRole, ExportType, ExportStatus } from '@prisma/client';
import { Queue, ConnectionOptions } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExportDto } from './dto/exports.dto';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);
  private readonly exportsQueue: Queue;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.exportsQueue = new Queue('exports', {
      connection: this.redis.getClient() as unknown as ConnectionOptions,
    });
  }

  async createExport(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateExportDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const exportJob = await this.prisma.exportJob.create({
      data: {
        projectId,
        type: dto.type as ExportType,
        status: ExportStatus.PENDING,
        params: {
          startDate: dto.startDate,
          endDate: dto.endDate,
          eventNames: dto.eventNames,
          format: dto.format,
        },
      },
    });

    // Queue the export job for processing
    await this.exportsQueue.add(
      'export',
      {
        exportJobId: exportJob.id,
        projectId,
        type: dto.type,
        params: {
          startDate: dto.startDate,
          endDate: dto.endDate,
          eventNames: dto.eventNames,
          format: dto.format,
        },
      },
      {
        jobId: `export-${exportJob.id}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log({
      message: 'Export job queued',
      exportJobId: exportJob.id,
      projectId,
      type: dto.type,
    });

    return {
      id: exportJob.id,
      type: exportJob.type,
      status: exportJob.status,
      params: exportJob.params,
      createdAt: exportJob.createdAt,
    };
  }

  async getExports(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const exports = await this.prisma.exportJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return exports.map((e) => ({
      id: e.id,
      type: e.type,
      status: e.status,
      params: e.params,
      fileUrl: e.fileUrl,
      error: e.error,
      createdAt: e.createdAt,
      finishedAt: e.finishedAt,
    }));
  }

  async getExport(
    exportId: string,
    projectId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const exportJob = await this.prisma.exportJob.findFirst({
      where: { id: exportId, projectId },
    });

    if (!exportJob) {
      throw new NotFoundException('Export not found');
    }

    return {
      id: exportJob.id,
      type: exportJob.type,
      status: exportJob.status,
      params: exportJob.params,
      fileUrl: exportJob.fileUrl,
      error: exportJob.error,
      createdAt: exportJob.createdAt,
      finishedAt: exportJob.finishedAt,
    };
  }

  async cancelExport(
    exportId: string,
    projectId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const exportJob = await this.prisma.exportJob.findFirst({
      where: { id: exportId, projectId },
    });

    if (!exportJob) {
      throw new NotFoundException('Export not found');
    }

    if (exportJob.status !== ExportStatus.PENDING) {
      throw new ForbiddenException('Can only cancel pending exports');
    }

    await this.prisma.exportJob.update({
      where: { id: exportId },
      data: {
        status: ExportStatus.FAILED,
        error: 'Cancelled by user',
        finishedAt: new Date(),
      },
    });
  }

  async getDownloadUrl(
    exportId: string,
    projectId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const exportJob = await this.prisma.exportJob.findFirst({
      where: { id: exportId, projectId },
    });

    if (!exportJob) {
      throw new NotFoundException('Export not found');
    }

    if (exportJob.status !== ExportStatus.COMPLETED) {
      throw new ForbiddenException('Export is not ready for download');
    }

    if (!exportJob.fileUrl) {
      throw new NotFoundException('Export file not found');
    }

    // For now, return the direct URL
    // In production with S3, you would generate a presigned URL here
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    return {
      downloadUrl: exportJob.fileUrl,
      expiresAt,
    };
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
