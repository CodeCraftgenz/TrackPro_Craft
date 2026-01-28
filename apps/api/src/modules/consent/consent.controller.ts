import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  Ip,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ConsentService } from './consent.service';
import {
  recordConsentSchema,
  updateConsentSettingsSchema,
} from './dto/consent.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('tenants/:tenantId/projects/:projectId/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  // Public endpoint - used by SDK
  @Post('record')
  async recordConsent(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const dto = recordConsentSchema.parse(body);
    return this.consentService.recordConsent(projectId, dto, ip, userAgent);
  }

  @Get('logs')
  @UseGuards(AuthGuard('jwt'))
  async getConsentLogs(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('anonymousId') anonymousId?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.consentService.getConsentLogs(
      projectId,
      tenantId,
      req!.user.userId,
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        anonymousId,
      },
    );
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getConsentStats(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req?: AuthRequest,
  ) {
    return this.consentService.getConsentStats(
      projectId,
      tenantId,
      req!.user.userId,
    );
  }

  @Get('settings')
  @UseGuards(AuthGuard('jwt'))
  async getConsentSettings(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req?: AuthRequest,
  ) {
    return this.consentService.getConsentSettings(
      projectId,
      tenantId,
      req!.user.userId,
    );
  }

  @Put('settings')
  @UseGuards(AuthGuard('jwt'))
  async updateConsentSettings(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Request() req?: AuthRequest,
  ) {
    const dto = updateConsentSettingsSchema.parse(body);
    return this.consentService.updateConsentSettings(
      projectId,
      tenantId,
      req!.user.userId,
      dto,
    );
  }

  // Public endpoint - check consent status for a user
  @Get('user/:anonymousId')
  async getUserConsent(
    @Param('projectId') projectId: string,
    @Param('anonymousId') anonymousId: string,
  ) {
    return this.consentService.getLatestConsentForUser(projectId, anonymousId);
  }
}
