import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AnalyticsService } from './analytics.service';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('tenants/:tenantId')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  async getDashboardStats(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getDashboardStats(tenantId, req.user.userId);
  }

  @Get('projects/:projectId/events')
  async getProjectEvents(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('eventName') eventName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getProjectEvents(
      projectId,
      tenantId,
      req!.user.userId,
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        eventName,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );
  }

  @Get('projects/:projectId/stats')
  async getProjectStats(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getProjectStats(projectId, tenantId, req!.user.userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('projects/:projectId/meta-delivery')
  async getMetaDeliveryLogs(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getMetaDeliveryLogs(projectId, tenantId, req!.user.userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      status,
    });
  }

  @Get('projects/:projectId/meta-delivery/stats')
  async getMetaDeliveryStats(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getMetaDeliveryStats(projectId, tenantId, req!.user.userId);
  }
}
