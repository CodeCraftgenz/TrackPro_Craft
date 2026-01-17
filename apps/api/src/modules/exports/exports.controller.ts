import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ExportsService } from './exports.service';
import { createExportSchema } from './dto/exports.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('tenants/:tenantId/projects/:projectId/exports')
@UseGuards(AuthGuard('jwt'))
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  async getExports(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
  ) {
    return this.exportsService.getExports(projectId, tenantId, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Request() req: AuthRequest,
  ) {
    const result = createExportSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }

    return this.exportsService.createExport(
      projectId,
      tenantId,
      req.user.userId,
      result.data,
    );
  }

  @Get(':exportId')
  async getExport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('exportId') exportId: string,
    @Request() req: AuthRequest,
  ) {
    return this.exportsService.getExport(
      exportId,
      projectId,
      tenantId,
      req.user.userId,
    );
  }

  @Delete(':exportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelExport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('exportId') exportId: string,
    @Request() req: AuthRequest,
  ) {
    await this.exportsService.cancelExport(
      exportId,
      projectId,
      tenantId,
      req.user.userId,
    );
  }

  @Get(':exportId/download')
  async getDownloadUrl(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('exportId') exportId: string,
    @Request() req: AuthRequest,
  ) {
    return this.exportsService.getDownloadUrl(
      exportId,
      projectId,
      tenantId,
      req.user.userId,
    );
  }
}
