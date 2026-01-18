import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberRole, LeadPlatform, LeadIntegrationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../integrations/encryption.service';
import { ClickHouseService } from '../analytics/clickhouse.service';
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

interface LeadData {
  lead_id: string;
  project_id: string;
  platform: string;
  form_id: string;
  form_name: string;
  email: string;
  name: string;
  phone: string;
  custom_fields: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
  page_url: string;
  ip: string;
  user_agent: string;
  created_at: number;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly clickhouse: ClickHouseService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== Lead Integrations ====================

  async getIntegrations(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const integrations = await this.prisma.leadIntegration.findMany({
      where: { projectId },
    });

    return integrations.map((integration) => ({
      id: integration.id,
      platform: integration.platform,
      status: integration.status,
      pageId: integration.pageId,
      pageName: integration.pageName,
      formIds: integration.formIds,
      hasAccessToken: !!integration.accessTokenEncrypted,
      lastSyncAt: integration.lastSyncAt,
      errorMessage: integration.errorMessage,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }));
  }

  async getIntegration(
    projectId: string,
    tenantId: string,
    userId: string,
    platform: LeadPlatform,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const integration = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform,
        },
      },
    });

    if (!integration) {
      return null;
    }

    return {
      id: integration.id,
      platform: integration.platform,
      status: integration.status,
      pageId: integration.pageId,
      pageName: integration.pageName,
      formIds: integration.formIds,
      hasAccessToken: !!integration.accessTokenEncrypted,
      lastSyncAt: integration.lastSyncAt,
      errorMessage: integration.errorMessage,
      metadata: integration.metadata,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  async createIntegration(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateLeadIntegrationDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const existing = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform: dto.platform as LeadPlatform,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Integration for ${dto.platform} already exists`);
    }

    const webhookSecret = randomBytes(32).toString('hex');

    const integration = await this.prisma.leadIntegration.create({
      data: {
        projectId,
        platform: dto.platform as LeadPlatform,
        status: dto.accessToken ? LeadIntegrationStatus.ACTIVE : LeadIntegrationStatus.PENDING,
        accessTokenEncrypted: dto.accessToken
          ? this.encryption.encrypt(dto.accessToken)
          : null,
        refreshTokenEncrypted: dto.refreshToken
          ? this.encryption.encrypt(dto.refreshToken)
          : null,
        pageId: dto.pageId,
        pageName: dto.pageName,
        formIds: dto.formIds || [],
        webhookSecret,
      },
    });

    this.logger.log(`Lead integration created: ${dto.platform} for project ${projectId}`);

    return {
      id: integration.id,
      platform: integration.platform,
      status: integration.status,
      pageId: integration.pageId,
      pageName: integration.pageName,
      formIds: integration.formIds,
      webhookSecret: integration.webhookSecret,
      hasAccessToken: !!integration.accessTokenEncrypted,
      createdAt: integration.createdAt,
    };
  }

  async updateIntegration(
    projectId: string,
    tenantId: string,
    userId: string,
    platform: LeadPlatform,
    dto: UpdateLeadIntegrationDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const existing = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Integration not found');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.accessToken !== undefined) {
      updateData.accessTokenEncrypted = this.encryption.encrypt(dto.accessToken);
      updateData.status = LeadIntegrationStatus.ACTIVE;
      updateData.errorMessage = null;
    }

    if (dto.refreshToken !== undefined) {
      updateData.refreshTokenEncrypted = this.encryption.encrypt(dto.refreshToken);
    }

    if (dto.pageId !== undefined) updateData.pageId = dto.pageId;
    if (dto.pageName !== undefined) updateData.pageName = dto.pageName;
    if (dto.formIds !== undefined) updateData.formIds = dto.formIds;
    if (dto.enabled !== undefined) {
      updateData.status = dto.enabled
        ? LeadIntegrationStatus.ACTIVE
        : LeadIntegrationStatus.INACTIVE;
    }

    const integration = await this.prisma.leadIntegration.update({
      where: {
        projectId_platform: {
          projectId,
          platform,
        },
      },
      data: updateData,
    });

    return {
      id: integration.id,
      platform: integration.platform,
      status: integration.status,
      pageId: integration.pageId,
      pageName: integration.pageName,
      formIds: integration.formIds,
      hasAccessToken: !!integration.accessTokenEncrypted,
      updatedAt: integration.updatedAt,
    };
  }

  async deleteIntegration(
    projectId: string,
    tenantId: string,
    userId: string,
    platform: LeadPlatform,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [MemberRole.OWNER]);

    const existing = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.leadIntegration.delete({
      where: {
        projectId_platform: {
          projectId,
          platform,
        },
      },
    });

    this.logger.log(`Lead integration deleted: ${platform} for project ${projectId}`);
  }

  // ==================== Lead Forms ====================

  async getForms(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    return this.prisma.leadFormConfig.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForm(projectId: string, tenantId: string, userId: string, formId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const form = await this.prisma.leadFormConfig.findFirst({
      where: { id: formId, projectId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async createForm(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateLeadFormDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
    const formId = `form_${randomBytes(8).toString('hex')}`;

    const embedCode = this.generateEmbedCode(apiUrl, projectId, formId, dto);

    const form = await this.prisma.leadFormConfig.create({
      data: {
        id: formId,
        projectId,
        name: dto.name,
        fields: JSON.parse(JSON.stringify(dto.fields)),
        styling: dto.styling ? JSON.parse(JSON.stringify(dto.styling)) : {},
        redirectUrl: dto.redirectUrl,
        embedCode,
      },
    });

    this.logger.log(`Lead form created: ${form.name} for project ${projectId}`);

    return form;
  }

  async updateForm(
    projectId: string,
    tenantId: string,
    userId: string,
    formId: string,
    dto: UpdateLeadFormDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const existing = await this.prisma.leadFormConfig.findFirst({
      where: { id: formId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Form not found');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.fields !== undefined) updateData.fields = dto.fields;
    if (dto.styling !== undefined) updateData.styling = dto.styling;
    if (dto.redirectUrl !== undefined) updateData.redirectUrl = dto.redirectUrl;
    if (dto.enabled !== undefined) updateData.enabled = dto.enabled;

    // Regenerate embed code if fields changed
    if (dto.fields !== undefined) {
      const apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
      updateData.embedCode = this.generateEmbedCode(apiUrl, projectId, formId, {
        name: dto.name || existing.name,
        fields: dto.fields,
        styling: dto.styling || (existing.styling as Record<string, unknown>),
        redirectUrl: dto.redirectUrl || existing.redirectUrl || undefined,
      });
    }

    return this.prisma.leadFormConfig.update({
      where: { id: formId },
      data: updateData,
    });
  }

  async deleteForm(projectId: string, tenantId: string, userId: string, formId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId, [MemberRole.OWNER]);

    const existing = await this.prisma.leadFormConfig.findFirst({
      where: { id: formId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Form not found');
    }

    await this.prisma.leadFormConfig.delete({
      where: { id: formId },
    });

    this.logger.log(`Lead form deleted: ${formId} for project ${projectId}`);
  }

  // ==================== Lead Capture ====================

  async captureLead(
    projectId: string,
    dto: CaptureLeadDto,
    ip: string,
    userAgent: string,
  ) {
    // Verify form exists and is enabled
    const form = await this.prisma.leadFormConfig.findFirst({
      where: { id: dto.formId, projectId, enabled: true },
    });

    if (!form) {
      throw new BadRequestException('Form not found or disabled');
    }

    // Extract standard fields
    const email = (dto.data.email as string) || '';
    const name = (dto.data.name as string) || '';
    const phone = (dto.data.phone as string) || '';

    // Remove standard fields from custom_fields
    const customFields = { ...dto.data };
    delete customFields.email;
    delete customFields.name;
    delete customFields.phone;

    const leadId = `lead_${Date.now()}_${randomBytes(4).toString('hex')}`;

    // Insert into ClickHouse
    await this.insertLeadToClickHouse({
      lead_id: leadId,
      project_id: projectId,
      platform: 'WEBSITE',
      form_id: dto.formId,
      form_name: form.name,
      email,
      name,
      phone,
      custom_fields: JSON.stringify(customFields),
      utm_source: dto.utm_source || '',
      utm_medium: dto.utm_medium || '',
      utm_campaign: dto.utm_campaign || '',
      referrer: dto.referrer || '',
      page_url: dto.page_url || '',
      ip,
      user_agent: userAgent,
      created_at: Math.floor(Date.now() / 1000),
    });

    // Send notifications
    await this.sendLeadNotifications(projectId, 'WEBSITE', {
      leadId,
      formName: form.name,
      email,
      name,
      phone,
      customFields,
    });

    this.logger.log(`Lead captured: ${leadId} from form ${dto.formId}`);

    return {
      success: true,
      leadId,
      redirectUrl: form.redirectUrl,
    };
  }

  async captureWebhookLead(
    projectId: string,
    dto: WebhookLeadDto,
    ip: string,
    userAgent: string,
  ) {
    const leadId = `lead_webhook_${Date.now()}_${randomBytes(4).toString('hex')}`;

    // Insert into ClickHouse
    await this.insertLeadToClickHouse({
      lead_id: leadId,
      project_id: projectId,
      platform: 'WEBSITE',
      form_id: 'webhook',
      form_name: 'API Webhook',
      email: dto.email || '',
      name: dto.name || '',
      phone: dto.phone || '',
      custom_fields: JSON.stringify(dto.custom || {}),
      utm_source: dto.utm_source || '',
      utm_medium: dto.utm_medium || '',
      utm_campaign: dto.utm_campaign || '',
      referrer: dto.referrer || '',
      page_url: dto.page_url || '',
      ip,
      user_agent: userAgent,
      created_at: Math.floor(Date.now() / 1000),
    });

    // Send notifications
    await this.sendLeadNotifications(projectId, 'WEBSITE', {
      leadId,
      formName: 'API Webhook',
      email: dto.email || '',
      name: dto.name || '',
      phone: dto.phone || '',
      customFields: dto.custom || {},
    });

    this.logger.log(`Webhook lead captured: ${leadId} for project ${projectId}`);

    return {
      success: true,
      leadId,
      message: 'Lead captured successfully',
    };
  }

  async processExternalLead(
    projectId: string,
    platform: LeadPlatform,
    leadData: {
      externalId: string;
      formId: string;
      formName: string;
      email?: string;
      name?: string;
      phone?: string;
      customFields?: Record<string, unknown>;
    },
  ) {
    const leadId = `lead_${platform.toLowerCase()}_${leadData.externalId}`;

    await this.insertLeadToClickHouse({
      lead_id: leadId,
      project_id: projectId,
      platform,
      form_id: leadData.formId,
      form_name: leadData.formName,
      email: leadData.email || '',
      name: leadData.name || '',
      phone: leadData.phone || '',
      custom_fields: JSON.stringify(leadData.customFields || {}),
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      referrer: '',
      page_url: '',
      ip: '',
      user_agent: '',
      created_at: Math.floor(Date.now() / 1000),
    });

    // Send notifications
    await this.sendLeadNotifications(projectId, platform, {
      leadId,
      formName: leadData.formName,
      email: leadData.email || '',
      name: leadData.name || '',
      phone: leadData.phone || '',
      customFields: leadData.customFields || {},
    });

    this.logger.log(`External lead processed: ${leadId} from ${platform}`);

    return { leadId };
  }

  // ==================== Lead Reports ====================

  async getLeads(projectId: string, tenantId: string, userId: string, query: LeadQueryDto) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const { limit = 50, offset = 0, platform, formId, startDate, endDate } = query;

    const conditions = [`project_id = '${this.escape(projectId)}'`];

    if (platform) {
      conditions.push(`platform = '${this.escape(platform)}'`);
    }

    if (formId) {
      conditions.push(`form_id = '${this.escape(formId)}'`);
    }

    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      conditions.push(`created_at >= ${startTimestamp}`);
    }

    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      conditions.push(`created_at <= ${endTimestamp}`);
    }

    const where = conditions.join(' AND ');

    try {
      const countSql = `SELECT count() as total FROM events_leads WHERE ${where}`;
      const countResult = await this.clickhouse.queryRows<{ total: string }>(countSql);
      const total = parseInt(countResult[0]?.total || '0', 10);

      const leadsSql = `
        SELECT
          lead_id,
          project_id,
          platform,
          form_id,
          form_name,
          email,
          name,
          phone,
          custom_fields,
          utm_source,
          utm_medium,
          utm_campaign,
          referrer,
          page_url,
          created_at
        FROM events_leads
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const leads = await this.clickhouse.queryRows<LeadData>(leadsSql);

      return {
        leads: leads.map((lead) => ({
          ...lead,
          custom_fields: JSON.parse(lead.custom_fields || '{}'),
          created_at: new Date(lead.created_at * 1000).toISOString(),
        })),
        total,
        limit,
        offset,
      };
    } catch {
      // Table might not exist yet
      return { leads: [], total: 0, limit, offset };
    }
  }

  async getLeadStats(projectId: string, tenantId: string, userId: string, query: LeadQueryDto) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    const { startDate, endDate } = query;

    const conditions = [`project_id = '${this.escape(projectId)}'`];

    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      conditions.push(`created_at >= ${startTimestamp}`);
    }

    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      conditions.push(`created_at <= ${endTimestamp}`);
    }

    const where = conditions.join(' AND ');

    try {
      // Total leads
      const totalSql = `SELECT count() as total FROM events_leads WHERE ${where}`;
      const totalResult = await this.clickhouse.queryRows<{ total: string }>(totalSql);
      const totalLeads = parseInt(totalResult[0]?.total || '0', 10);

      // Leads by platform
      const platformSql = `
        SELECT platform, count() as count
        FROM events_leads
        WHERE ${where}
        GROUP BY platform
        ORDER BY count DESC
      `;
      const platformResult = await this.clickhouse.queryRows<{
        platform: string;
        count: string;
      }>(platformSql);

      // Leads by form
      const formSql = `
        SELECT form_id, form_name, count() as count
        FROM events_leads
        WHERE ${where}
        GROUP BY form_id, form_name
        ORDER BY count DESC
        LIMIT 10
      `;
      const formResult = await this.clickhouse.queryRows<{
        form_id: string;
        form_name: string;
        count: string;
      }>(formSql);

      // Leads over time (daily)
      const timelineSql = `
        SELECT
          toDate(toDateTime(created_at)) as date,
          count() as count
        FROM events_leads
        WHERE ${where}
        GROUP BY date
        ORDER BY date DESC
        LIMIT 30
      `;
      const timelineResult = await this.clickhouse.queryRows<{
        date: string;
        count: string;
      }>(timelineSql);

      // Today's leads
      const now = Math.floor(Date.now() / 1000);
      const todayStart = now - (now % 86400);
      const todaySql = `
        SELECT count() as total
        FROM events_leads
        WHERE project_id = '${this.escape(projectId)}' AND created_at >= ${todayStart}
      `;
      const todayResult = await this.clickhouse.queryRows<{ total: string }>(todaySql);
      const leadsToday = parseInt(todayResult[0]?.total || '0', 10);

      return {
        totalLeads,
        leadsToday,
        byPlatform: platformResult.map((row) => ({
          platform: row.platform,
          count: parseInt(row.count, 10),
        })),
        byForm: formResult.map((row) => ({
          formId: row.form_id,
          formName: row.form_name,
          count: parseInt(row.count, 10),
        })),
        timeline: timelineResult.map((row) => ({
          date: row.date,
          count: parseInt(row.count, 10),
        })),
      };
    } catch {
      return {
        totalLeads: 0,
        leadsToday: 0,
        byPlatform: [],
        byForm: [],
        timeline: [],
      };
    }
  }

  // ==================== Notification Config ====================

  async getNotificationConfigs(projectId: string, tenantId: string, userId: string) {
    await this.checkProjectAccess(projectId, tenantId, userId);

    return this.prisma.leadNotificationConfig.findMany({
      where: { projectId },
    });
  }

  async createNotificationConfig(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateNotificationConfigDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    return this.prisma.leadNotificationConfig.create({
      data: {
        projectId,
        email: dto.email,
        webhookUrl: dto.webhookUrl,
        platforms: dto.platforms,
      },
    });
  }

  async updateNotificationConfig(
    projectId: string,
    tenantId: string,
    userId: string,
    configId: string,
    dto: UpdateNotificationConfigDto,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [
      MemberRole.OWNER,
      MemberRole.ADMIN,
    ]);

    const existing = await this.prisma.leadNotificationConfig.findFirst({
      where: { id: configId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Notification config not found');
    }

    return this.prisma.leadNotificationConfig.update({
      where: { id: configId },
      data: dto,
    });
  }

  async deleteNotificationConfig(
    projectId: string,
    tenantId: string,
    userId: string,
    configId: string,
  ) {
    await this.checkProjectAccess(projectId, tenantId, userId, [MemberRole.OWNER]);

    const existing = await this.prisma.leadNotificationConfig.findFirst({
      where: { id: configId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Notification config not found');
    }

    await this.prisma.leadNotificationConfig.delete({
      where: { id: configId },
    });
  }

  // ==================== Private Helpers ====================

  private async insertLeadToClickHouse(lead: LeadData): Promise<void> {
    const sql = `
      INSERT INTO events_leads (
        lead_id, project_id, platform, form_id, form_name,
        email, name, phone, custom_fields,
        utm_source, utm_medium, utm_campaign,
        referrer, page_url, ip, user_agent, created_at
      ) VALUES (
        '${this.escape(lead.lead_id)}',
        '${this.escape(lead.project_id)}',
        '${this.escape(lead.platform)}',
        '${this.escape(lead.form_id)}',
        '${this.escape(lead.form_name)}',
        '${this.escape(lead.email)}',
        '${this.escape(lead.name)}',
        '${this.escape(lead.phone)}',
        '${this.escape(lead.custom_fields)}',
        '${this.escape(lead.utm_source)}',
        '${this.escape(lead.utm_medium)}',
        '${this.escape(lead.utm_campaign)}',
        '${this.escape(lead.referrer)}',
        '${this.escape(lead.page_url)}',
        '${this.escape(lead.ip)}',
        '${this.escape(lead.user_agent)}',
        ${lead.created_at}
      )
    `;

    await this.clickhouse.queryRows(sql);
  }

  private async sendLeadNotifications(
    projectId: string,
    platform: string,
    leadData: {
      leadId: string;
      formName: string;
      email: string;
      name: string;
      phone: string;
      customFields: Record<string, unknown>;
    },
  ): Promise<void> {
    const configs = await this.prisma.leadNotificationConfig.findMany({
      where: {
        projectId,
        enabled: true,
      },
    });

    for (const config of configs) {
      const platforms = config.platforms as string[];
      if (!platforms.includes(platform)) continue;

      // Send webhook notification
      if (config.webhookUrl) {
        try {
          await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'lead.created',
              platform,
              ...leadData,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          this.logger.error(`Failed to send webhook notification: ${error}`);
        }
      }

      // Email notification would be implemented with a proper email service
      // For now, just log it
      if (config.email) {
        this.logger.log(
          `Email notification would be sent to ${config.email} for lead ${leadData.leadId}`,
        );
      }
    }
  }

  private generateEmbedCode(
    apiUrl: string,
    projectId: string,
    formId: string,
    dto: CreateLeadFormDto,
  ): string {
    const styling = dto.styling || {};

    return `<!-- ZtackPro Lead Capture Form -->
<div id="ztackpro-form-${formId}"></div>
<script>
(function() {
  var formConfig = ${JSON.stringify({
    formId,
    projectId,
    apiUrl: `${apiUrl}/api/v1/public/leads/capture`,
    fields: dto.fields,
    styling: {
      primaryColor: styling.primaryColor || '#00E4F2',
      backgroundColor: styling.backgroundColor || '#ffffff',
      textColor: styling.textColor || '#333333',
      buttonText: styling.buttonText || 'Enviar',
      successMessage: styling.successMessage || 'Obrigado! Entraremos em contato.',
    },
    redirectUrl: dto.redirectUrl,
  })};

  function createForm() {
    var container = document.getElementById('ztackpro-form-' + formConfig.formId);
    if (!container) return;

    var form = document.createElement('form');
    form.style.cssText = 'font-family: system-ui, sans-serif; max-width: 400px; padding: 20px; background: ' + formConfig.styling.backgroundColor + '; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';

    formConfig.fields.forEach(function(field) {
      var wrapper = document.createElement('div');
      wrapper.style.marginBottom = '16px';

      var label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = 'display: block; margin-bottom: 4px; font-weight: 500; color: ' + formConfig.styling.textColor + ';';

      var input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 3;
      } else if (field.type === 'select' && field.options) {
        input = document.createElement('select');
        field.options.forEach(function(opt) {
          var option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      } else {
        input = document.createElement('input');
        input.type = field.type === 'phone' ? 'tel' : field.type;
      }

      input.name = field.name;
      input.required = field.required;
      input.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;';

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      form.appendChild(wrapper);
    });

    var button = document.createElement('button');
    button.type = 'submit';
    button.textContent = formConfig.styling.buttonText;
    button.style.cssText = 'width: 100%; padding: 12px; background: ' + formConfig.styling.primaryColor + '; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer;';
    form.appendChild(button);

    var message = document.createElement('div');
    message.id = 'ztackpro-message-' + formConfig.formId;
    message.style.cssText = 'display: none; margin-top: 16px; padding: 12px; border-radius: 4px; text-align: center;';
    form.appendChild(message);

    form.onsubmit = function(e) {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Enviando...';

      var data = {};
      formConfig.fields.forEach(function(field) {
        data[field.name] = form[field.name].value;
      });

      fetch(formConfig.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: formConfig.formId,
          data: data,
          source: 'embed',
          referrer: document.referrer,
          page_url: window.location.href,
          utm_source: new URLSearchParams(window.location.search).get('utm_source') || '',
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || '',
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || ''
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.success) {
          message.textContent = formConfig.styling.successMessage;
          message.style.display = 'block';
          message.style.background = '#d4edda';
          message.style.color = '#155724';
          form.reset();
          if (result.redirectUrl) {
            setTimeout(function() { window.location.href = result.redirectUrl; }, 2000);
          }
        } else {
          message.textContent = 'Erro ao enviar. Tente novamente.';
          message.style.display = 'block';
          message.style.background = '#f8d7da';
          message.style.color = '#721c24';
        }
      })
      .catch(function() {
        message.textContent = 'Erro ao enviar. Tente novamente.';
        message.style.display = 'block';
        message.style.background = '#f8d7da';
        message.style.color = '#721c24';
      })
      .finally(function() {
        button.disabled = false;
        button.textContent = formConfig.styling.buttonText;
      });
    };

    container.appendChild(form);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createForm);
  } else {
    createForm();
  }
})();
</script>`;
  }

  async checkProjectAccess(
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

  private escape(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }
}
