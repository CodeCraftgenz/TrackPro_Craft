import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ReportsService } from './reports.service';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('tenants/:tenantId/projects/:projectId/reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  async getOverviewReport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.reportsService.getOverviewReport(
      projectId,
      tenantId,
      req!.user.userId,
      { startDate, endDate },
    );
  }

  @Get('funnel')
  async getFunnelReport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('steps') steps?: string,
    @Request() req?: AuthRequest,
  ) {
    const stepsList = steps ? steps.split(',').map((s) => s.trim()) : [];
    return this.reportsService.getFunnelReport(
      projectId,
      tenantId,
      req!.user.userId,
      { startDate, endDate },
      stepsList,
    );
  }

  @Get('performance')
  async getPerformanceReport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.reportsService.getPerformanceReport(
      projectId,
      tenantId,
      req!.user.userId,
      { startDate, endDate },
    );
  }

  @Get('quality')
  async getQualityReport(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req?: AuthRequest,
  ) {
    return this.reportsService.getQualityReport(
      projectId,
      tenantId,
      req!.user.userId,
    );
  }
}
