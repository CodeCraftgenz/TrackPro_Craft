import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadPlatform, LeadIntegrationStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../integrations/encryption.service';
import { LeadsService } from './leads.service';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookForm {
  id: string;
  name: string;
  status: string;
  locale: string;
}

interface FacebookApiError {
  error?: {
    message?: string;
  };
}

interface FacebookLead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

@Injectable()
export class FacebookLeadsService {
  private readonly logger = new Logger(FacebookLeadsService.name);
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly configService: ConfigService,
    private readonly leadsService: LeadsService,
  ) {}

  /**
   * Get OAuth URL for Facebook Lead Ads authorization
   */
  getOAuthUrl(projectId: string, tenantId: string): string {
    const clientId = this.configService.get<string>('FACEBOOK_APP_ID');
    const redirectUri = this.configService.get<string>(
      'FACEBOOK_LEADS_CALLBACK_URL',
      'http://localhost:3001/api/v1/leads/oauth/facebook/callback',
    );

    const state = Buffer.from(JSON.stringify({ projectId, tenantId })).toString('base64');

    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'leads_retrieval',
      'pages_manage_ads',
    ].join(',');

    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const clientId = this.configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    const redirectUri = this.configService.get<string>(
      'FACEBOOK_LEADS_CALLBACK_URL',
      'http://localhost:3001/api/v1/leads/oauth/facebook/callback',
    );

    const response = await fetch(
      `${this.graphApiUrl}/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`,
    );

    if (!response.ok) {
      const error = (await response.json()) as FacebookApiError;
      throw new Error(error.error?.message || 'Failed to exchange code for token');
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    // Exchange for long-lived token
    const longLivedResponse = await fetch(
      `${this.graphApiUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${data.access_token}`,
    );

    if (longLivedResponse.ok) {
      const longLivedData = (await longLivedResponse.json()) as {
        access_token: string;
        expires_in: number;
      };
      return {
        accessToken: longLivedData.access_token,
        expiresIn: longLivedData.expires_in || 5184000, // 60 days default
      };
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
    };
  }

  /**
   * Get list of Facebook Pages the user manages
   */
  async getPages(accessToken: string): Promise<FacebookPage[]> {
    const response = await fetch(
      `${this.graphApiUrl}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`,
    );

    if (!response.ok) {
      const error = (await response.json()) as FacebookApiError;
      throw new Error(error.error?.message || 'Failed to fetch pages');
    }

    const data = (await response.json()) as { data: FacebookPage[] };
    return data.data;
  }

  /**
   * Get lead forms for a Facebook Page
   */
  async getLeadForms(pageId: string, pageAccessToken: string): Promise<FacebookForm[]> {
    const response = await fetch(
      `${this.graphApiUrl}/${pageId}/leadgen_forms?fields=id,name,status,locale&access_token=${pageAccessToken}`,
    );

    if (!response.ok) {
      const error = (await response.json()) as FacebookApiError;
      throw new Error(error.error?.message || 'Failed to fetch lead forms');
    }

    const data = (await response.json()) as { data: FacebookForm[] };
    return data.data;
  }

  /**
   * Get leads from a specific form
   */
  async getLeadsFromForm(
    formId: string,
    pageAccessToken: string,
    since?: number,
  ): Promise<FacebookLead[]> {
    let url = `${this.graphApiUrl}/${formId}/leads?fields=id,created_time,field_data&access_token=${pageAccessToken}`;

    if (since) {
      url += `&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${since}}]`;
    }

    const allLeads: FacebookLead[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        const error = (await response.json()) as FacebookApiError;
        throw new Error(error.error?.message || 'Failed to fetch leads');
      }

      const data = (await response.json()) as {
        data: FacebookLead[];
        paging?: { next?: string };
      };

      allLeads.push(...data.data);
      nextUrl = data.paging?.next || null;
    }

    return allLeads;
  }

  /**
   * Subscribe to leadgen webhooks for a page
   */
  async subscribeToLeadgenWebhook(
    pageId: string,
    pageAccessToken: string,
  ): Promise<boolean> {
    const response = await fetch(
      `${this.graphApiUrl}/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`,
      { method: 'POST' },
    );

    if (!response.ok) {
      const error = (await response.json()) as FacebookApiError;
      this.logger.error(`Failed to subscribe to leadgen webhook: ${error.error?.message}`);
      return false;
    }

    return true;
  }

  /**
   * Process incoming webhook for new leads
   */
  async processWebhook(
    entry: {
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
  ): Promise<void> {
    for (const pageEntry of entry) {
      const pageId = pageEntry.id;

      for (const change of pageEntry.changes) {
        if (change.field !== 'leadgen') continue;

        const { form_id, leadgen_id } = change.value;

        // Find integration for this page
        const integration = await this.prisma.leadIntegration.findFirst({
          where: {
            platform: LeadPlatform.FACEBOOK,
            pageId,
            status: LeadIntegrationStatus.ACTIVE,
          },
        });

        if (!integration || !integration.accessTokenEncrypted) {
          this.logger.warn(`No active integration found for page ${pageId}`);
          continue;
        }

        // Fetch lead details
        const accessToken = this.encryption.decrypt(integration.accessTokenEncrypted);

        try {
          const leadResponse = await fetch(
            `${this.graphApiUrl}/${leadgen_id}?fields=id,created_time,field_data&access_token=${accessToken}`,
          );

          if (!leadResponse.ok) {
            this.logger.error(`Failed to fetch lead ${leadgen_id}`);
            continue;
          }

          const lead = (await leadResponse.json()) as FacebookLead;

          // Parse lead data
          const leadData: Record<string, string> = {};
          for (const field of lead.field_data) {
            leadData[field.name] = field.values[0] || '';
          }

          // Process the lead
          await this.leadsService.processExternalLead(
            integration.projectId,
            LeadPlatform.FACEBOOK,
            {
              externalId: lead.id,
              formId: form_id,
              formName: `Facebook Form ${form_id}`,
              email: leadData.email,
              name: leadData.full_name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
              phone: leadData.phone_number,
              customFields: leadData,
            },
          );

          this.logger.log(`Processed Facebook lead: ${lead.id}`);
        } catch (error) {
          this.logger.error(`Error processing Facebook lead: ${error}`);
        }
      }
    }
  }

  /**
   * Sync leads from Facebook (manual sync)
   */
  async syncLeads(projectId: string): Promise<{ synced: number; errors: number }> {
    const integration = await this.prisma.leadIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
        },
      },
    });

    if (!integration || !integration.accessTokenEncrypted) {
      throw new Error('Facebook integration not configured');
    }

    const accessToken = this.encryption.decrypt(integration.accessTokenEncrypted);
    const formIds = (integration.formIds as string[]) || [];

    let synced = 0;
    let errors = 0;

    // Get leads since last sync
    const since = integration.lastSyncAt
      ? Math.floor(integration.lastSyncAt.getTime() / 1000)
      : undefined;

    for (const formId of formIds) {
      try {
        const leads = await this.getLeadsFromForm(formId, accessToken, since);

        for (const lead of leads) {
          try {
            const leadData: Record<string, string> = {};
            for (const field of lead.field_data) {
              leadData[field.name] = field.values[0] || '';
            }

            await this.leadsService.processExternalLead(
              projectId,
              LeadPlatform.FACEBOOK,
              {
                externalId: lead.id,
                formId,
                formName: `Facebook Form ${formId}`,
                email: leadData.email,
                name:
                  leadData.full_name ||
                  `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
                phone: leadData.phone_number,
                customFields: leadData,
              },
            );

            synced++;
          } catch {
            errors++;
          }
        }
      } catch (error) {
        this.logger.error(`Error syncing leads from form ${formId}: ${error}`);
        errors++;
      }
    }

    // Update last sync time
    await this.prisma.leadIntegration.update({
      where: {
        projectId_platform: {
          projectId,
          platform: LeadPlatform.FACEBOOK,
        },
      },
      data: { lastSyncAt: new Date() },
    });

    return { synced, errors };
  }
}
