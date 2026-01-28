import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AdminService } from './admin.service';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // System Stats
  @Get('stats')
  async getSystemStats(@Request() req: AuthRequest) {
    await this.adminService.checkAdminAccess(req.user.userId);
    return this.adminService.getSystemStats();
  }

  // Queue Management
  @Get('queues')
  async getQueuesOverview(@Request() req: AuthRequest) {
    await this.adminService.checkAdminAccess(req.user.userId);
    return this.adminService.getQueuesOverview();
  }

  @Get('queues/:queueName/jobs')
  async getQueueJobs(
    @Request() req: AuthRequest,
    @Param('queueName') queueName: string,
    @Query('status') status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'waiting',
    @Query('limit') limit?: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    return this.adminService.getQueueJobs(
      queueName,
      status,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('queues/:queueName/jobs/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  async retryJob(
    @Request() req: AuthRequest,
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    await this.adminService.retryFailedJob(queueName, jobId);
    return { success: true };
  }

  @Delete('queues/:queueName/jobs/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeJob(
    @Request() req: AuthRequest,
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    await this.adminService.removeJob(queueName, jobId);
  }

  @Post('queues/:queueName/pause')
  @HttpCode(HttpStatus.OK)
  async pauseQueue(
    @Request() req: AuthRequest,
    @Param('queueName') queueName: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    await this.adminService.pauseQueue(queueName);
    return { success: true };
  }

  @Post('queues/:queueName/resume')
  @HttpCode(HttpStatus.OK)
  async resumeQueue(
    @Request() req: AuthRequest,
    @Param('queueName') queueName: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    await this.adminService.resumeQueue(queueName);
    return { success: true };
  }

  @Post('queues/:queueName/clean')
  @HttpCode(HttpStatus.OK)
  async cleanQueue(
    @Request() req: AuthRequest,
    @Param('queueName') queueName: string,
    @Query('status') status: 'completed' | 'failed' = 'completed',
    @Query('olderThanHours') olderThanHours?: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    const olderThanMs = olderThanHours
      ? parseInt(olderThanHours, 10) * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
    const cleaned = await this.adminService.cleanQueue(queueName, status, olderThanMs);
    return { cleaned };
  }

  // Audit Logs
  @Get('audit')
  async getAuditLogs(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    return this.adminService.getAuditLogs({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      userId,
      entity,
      action,
    });
  }

  // Error Logs
  @Get('errors')
  async getErrorLogs(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('level') level?: string,
  ) {
    await this.adminService.checkAdminAccess(req.user.userId);
    return this.adminService.getErrorLogs({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      level,
    });
  }
}
