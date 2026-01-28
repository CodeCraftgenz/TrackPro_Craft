import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { LeadPlatform, LeadIntegrationStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { LeadsService } from './leads.service';
import { FacebookLeadsService, FacebookPage, FacebookForm } from './facebook-leads.service';
import { EncryptionService } from '../integrations/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateLeadIntegrationDto,
  UpdateLeadIntegrationDto,
  CreateLeadFormDto,
  UpdateLeadFormDto,
  CaptureLeadDto,
  CreateNotificationConfigDto,
  UpdateNotificationConfigDto,
  LeadQueryDto,
  WebhookLeadDto,
} from './dto/leads.dto';
import { ApiKeysService } from '../projects/api-keys.service';

@ApiTags('leads')
@Controller('tenants/:tenantId/projects/:projectId/leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly facebookLeadsService: FacebookLeadsService,
    private readonly encryption: EncryptionService,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== Integrations ====================

  @Get('integrations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all lead integrations for a project' })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async getIntegrations(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getIntegrations(projectId, tenantId, user.sub);
  }

  @Get('integrations/:platform')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific lead integration' })
  @ApiParam({ name: 'platform', enum: LeadPlatform })
  @ApiResponse({ status: 200, description: 'Integration details' })
  async getIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('platform') platform: LeadPlatform,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getIntegration(projectId, tenantId, user.sub, platform);
  }

  @Post('integrations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create lead integration' })
  @ApiResponse({ status: 201, description: 'Integration created' })
  async createIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateLeadIntegrationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.createIntegration(projectId, tenantId, user.sub, dto);
  }

  @Put('integrations/:platform')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead integration' })
  @ApiParam({ name: 'platform', enum: LeadPlatform })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  async updateIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('platform') platform: LeadPlatform,
    @Body() dto: UpdateLeadIntegrationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.updateIntegration(projectId, tenantId, user.sub, platform, dto);
  }

  @Delete('integrations/:platform')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead integration' })
  @ApiParam({ name: 'platform', enum: LeadPlatform })
  @ApiResponse({ status: 204, description: 'Integration deleted' })
  async deleteIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('platform') platform: LeadPlatform,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.deleteIntegration(projectId, tenantId, user.sub, platform);
  }

  // ==================== Forms ====================

  @Get('forms')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all lead forms for a project' })
  @ApiResponse({ status: 200, description: 'List of forms' })
  async getForms(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getForms(projectId, tenantId, user.sub);
  }

  @Get('forms/:formId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific lead form' })
  @ApiResponse({ status: 200, description: 'Form details' })
  async getForm(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getForm(projectId, tenantId, user.sub, formId);
  }

  @Post('forms')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create lead form' })
  @ApiResponse({ status: 201, description: 'Form created' })
  async createForm(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateLeadFormDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.createForm(projectId, tenantId, user.sub, dto);
  }

  @Put('forms/:formId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead form' })
  @ApiResponse({ status: 200, description: 'Form updated' })
  async updateForm(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('formId') formId: string,
    @Body() dto: UpdateLeadFormDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.updateForm(projectId, tenantId, user.sub, formId, dto);
  }

  @Delete('forms/:formId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead form' })
  @ApiResponse({ status: 204, description: 'Form deleted' })
  async deleteForm(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.deleteForm(projectId, tenantId, user.sub, formId);
  }

  // ==================== Reports ====================

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get leads list' })
  @ApiResponse({ status: 200, description: 'List of leads' })
  async getLeads(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query() query: LeadQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getLeads(projectId, tenantId, user.sub, query);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead statistics' })
  @ApiResponse({ status: 200, description: 'Lead statistics' })
  async getLeadStats(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query() query: LeadQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getLeadStats(projectId, tenantId, user.sub, query);
  }

  // ==================== Notifications ====================

  @Get('notifications')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification configs' })
  @ApiResponse({ status: 200, description: 'List of notification configs' })
  async getNotificationConfigs(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.getNotificationConfigs(projectId, tenantId, user.sub);
  }

  @Post('notifications')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create notification config' })
  @ApiResponse({ status: 201, description: 'Notification config created' })
  async createNotificationConfig(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateNotificationConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.createNotificationConfig(projectId, tenantId, user.sub, dto);
  }

  @Put('notifications/:configId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification config' })
  @ApiResponse({ status: 200, description: 'Notification config updated' })
  async updateNotificationConfig(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('configId') configId: string,
    @Body() dto: UpdateNotificationConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadsService.updateNotificationConfig(
      projectId,
      tenantId,
      user.sub,
      configId,
      dto,
    );
  }

  @Delete('notifications/:configId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification config' })
  @ApiResponse({ status: 204, description: 'Notification config deleted' })
  async deleteNotificationConfig(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('configId') configId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.deleteNotificationConfig(
      projectId,
      tenantId,
      user.sub,
      configId,
    );
  }

  // ==================== Facebook OAuth ====================

  @Get('integrations/facebook/oauth-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Facebook OAuth URL for Lead Ads' })
  @ApiResponse({ status: 200, description: 'OAuth URL returned' })
  async getFacebookOAuthUrl(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.checkProjectAccess(projectId, tenantId, user.sub);
    const url = this.facebookLeadsService.getOAuthUrl(projectId, tenantId);
    return { url };
  }

  @Get('integrations/facebook/pages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Facebook Pages for Lead Ads' })
  @ApiResponse({ status: 200, description: 'List of Facebook pages' })
  async getFacebookPages(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ pages: FacebookPage[] }> {
    await this.leadsService.checkProjectAccess(projectId, tenantId, user.sub);

    const integration = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
        },
      },
    });

    if (!integration || !integration.accessTokenEncrypted) {
      return { pages: [] };
    }

    const accessToken = this.encryption.decrypt(integration.accessTokenEncrypted);
    const pages = await this.facebookLeadsService.getPages(accessToken);
    return { pages };
  }

  @Get('integrations/facebook/forms')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Facebook Lead Forms' })
  @ApiResponse({ status: 200, description: 'List of lead forms' })
  async getFacebookForms(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ forms: FacebookForm[] }> {
    await this.leadsService.checkProjectAccess(projectId, tenantId, user.sub);

    const integration = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
        },
      },
    });

    if (!integration || !integration.accessTokenEncrypted || !integration.pageId) {
      return { forms: [] };
    }

    const accessToken = this.encryption.decrypt(integration.accessTokenEncrypted);
    const forms = await this.facebookLeadsService.getLeadForms(integration.pageId, accessToken);
    return { forms };
  }

  @Post('integrations/facebook/select-page')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select Facebook Page for Lead Ads' })
  @ApiResponse({ status: 200, description: 'Page selected' })
  async selectFacebookPage(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() body: { pageId: string; pageName: string; pageAccessToken: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.checkProjectAccess(projectId, tenantId, user.sub);

    // Update integration with page token
    const encryptedToken = this.encryption.encrypt(body.pageAccessToken);

    await this.prisma.leadIntegration.upsert({
      where: {
        projectId_platform: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
        },
      },
      update: {
        pageId: body.pageId,
        pageName: body.pageName,
        accessTokenEncrypted: encryptedToken,
        status: LeadIntegrationStatus.ACTIVE,
      },
      create: {
        projectId,
        platform: LeadPlatform.FACEBOOK,
        pageId: body.pageId,
        pageName: body.pageName,
        accessTokenEncrypted: encryptedToken,
        status: LeadIntegrationStatus.ACTIVE,
      },
    });

    // Subscribe to leadgen webhooks
    await this.facebookLeadsService.subscribeToLeadgenWebhook(body.pageId, body.pageAccessToken);

    return { success: true };
  }

  @Post('integrations/facebook/select-forms')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select Facebook Lead Forms' })
  @ApiResponse({ status: 200, description: 'Forms selected' })
  async selectFacebookForms(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() body: { formIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.checkProjectAccess(projectId, tenantId, user.sub);

    await this.prisma.leadIntegration.update({
      where: {
        projectId_platform: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
        },
      },
      data: {
        formIds: body.formIds,
      },
    });

    return { success: true };
  }

  @Post('integrations/facebook/sync')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually sync Facebook leads' })
  @ApiResponse({ status: 200, description: 'Sync completed' })
  async syncFacebookLeads(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.leadsService.checkProjectAccess(projectId, tenantId, user.sub);
    const result = await this.facebookLeadsService.syncLeads(projectId);
    return result;
  }
}

// ==================== Facebook OAuth Callback Controller ====================

@ApiTags('leads-oauth')
@Controller('leads/oauth')
export class LeadsOAuthController {
  private readonly logger = new Logger(LeadsOAuthController.name);

  constructor(
    private readonly facebookLeadsService: FacebookLeadsService,
    private readonly encryption: EncryptionService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get('facebook/callback')
  @ApiExcludeEndpoint()
  async facebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    if (error) {
      this.logger.error(`Facebook OAuth error: ${error} - ${errorDescription}`);
      return res.redirect(`${frontendUrl}/dashboard/leads/integrations?error=${encodeURIComponent(errorDescription || error)}`);
    }

    try {
      // Decode state to get projectId and tenantId
      const { projectId, tenantId } = JSON.parse(Buffer.from(state, 'base64').toString());

      // Exchange code for token
      const { accessToken, expiresIn } = await this.facebookLeadsService.exchangeCodeForToken(code);

      // Store token in integration
      const encryptedToken = this.encryption.encrypt(accessToken);
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      await this.prisma.leadIntegration.upsert({
        where: {
          projectId_platform: {
            projectId,
            platform: LeadPlatform.FACEBOOK,
          },
        },
        update: {
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          status: LeadIntegrationStatus.PENDING,
          errorMessage: null,
        },
        create: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          status: LeadIntegrationStatus.PENDING,
        },
      });

      // Redirect back to frontend
      return res.redirect(`${frontendUrl}/dashboard/${tenantId}/${projectId}/leads/integrations?platform=facebook&step=select-page`);
    } catch (err) {
      this.logger.error(`Facebook OAuth callback error: ${err}`);
      return res.redirect(`${frontendUrl}/dashboard/leads/integrations?error=${encodeURIComponent('Falha ao conectar com Facebook')}`);
    }
  }

  @Post('facebook/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async facebookWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Body() body: { object: string; entry: unknown[] },
    @Res() res: Response,
  ) {
    // Webhook verification
    if (mode === 'subscribe') {
      const expectedToken = this.configService.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN');
      if (verifyToken === expectedToken) {
        this.logger.log('Facebook webhook verified');
        return res.status(200).send(challenge);
      }
      return res.sendStatus(403);
    }

    // Process incoming webhook
    if (body.object === 'page') {
      try {
        await this.facebookLeadsService.processWebhook(
          body.entry as {
            id: string;
            time: number;
            changes: Array<{
              field: string;
              value: {
                form_id: string;
                leadgen_id: string;
                page_id: string;
                created_time: number;
              };
            }>;
          }[],
        );
      } catch (err) {
        this.logger.error(`Facebook webhook processing error: ${err}`);
      }
      return res.sendStatus(200);
    }

    return res.sendStatus(404);
  }

  @Get('facebook/webhook')
  @ApiExcludeEndpoint()
  async facebookWebhookVerify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe') {
      const expectedToken = this.configService.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN');
      if (verifyToken === expectedToken) {
        this.logger.log('Facebook webhook verified');
        return res.status(200).send(challenge);
      }
    }
    return res.sendStatus(403);
  }
}

// ==================== Public Lead Capture Controller ====================

@ApiTags('public-leads')
@Controller('public/leads')
export class PublicLeadsController {
  private readonly logger = new Logger(PublicLeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Post('capture')
  @ApiOperation({ summary: 'Capture lead from embedded form' })
  @ApiResponse({ status: 200, description: 'Lead captured' })
  async captureLead(@Body() dto: CaptureLeadDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    // Extract projectId from formId
    const form = await this.leadsService['prisma'].leadFormConfig.findUnique({
      where: { id: dto.formId },
    });

    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    return this.leadsService.captureLead(form.projectId, dto, ip, userAgent);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Capture lead via webhook using API Key' })
  @ApiResponse({ status: 200, description: 'Lead captured successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API Key' })
  async captureLeadWebhook(@Body() dto: WebhookLeadDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    // Get API Key from header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return {
        success: false,
        error: 'API Key required. Send it in the X-API-Key header.'
      };
    }

    // Validate API Key and get projectId
    const keyData = await this.apiKeysService.validateApiKey(apiKey);

    if (!keyData) {
      return {
        success: false,
        error: 'Invalid API Key'
      };
    }

    this.logger.log(`Lead webhook received for project ${keyData.projectId}`);

    // Capture the lead
    return this.leadsService.captureWebhookLead(keyData.projectId, dto, ip, userAgent);
  }
}
