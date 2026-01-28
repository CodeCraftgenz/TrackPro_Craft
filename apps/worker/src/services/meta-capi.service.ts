import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { PrismaService } from './prisma.service';

interface MetaCapiEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: 'website';
  user_data: {
    em?: string[];
    ph?: string[];
    external_id?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
  };
}

interface MetaCapiPayload {
  data: MetaCapiEvent[];
  test_event_code?: string;
}

interface MetaCapiResponse {
  events_received: number;
  messages?: string[];
  fbtrace_id?: string;
}

@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);
  private readonly apiVersion = 'v18.0';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendEvent(
    projectId: string,
    event: {
      eventId: string;
      eventName: string;
      eventTime: number;
      userData: {
        email?: string;
        phone?: string;
        externalId?: string;
        clientIpAddress?: string;
        clientUserAgent?: string;
        fbp?: string;
        fbc?: string;
      };
      customData?: {
        value?: number;
        currency?: string;
        contentIds?: string[];
        contentType?: string;
        orderId?: string;
      };
      eventSourceUrl?: string;
    },
  ): Promise<MetaCapiResponse> {
    // Get Meta integration config from database
    const integration = await this.prisma.integrationMeta.findUnique({
      where: { projectId },
    });

    if (!integration || !integration.enabled) {
      throw new Error('Meta integration not enabled for this project');
    }

    const accessToken = this.decryptAccessToken(integration.accessTokenEncrypted);
    const pixelId = integration.pixelId;

    // Build CAPI event
    const capiEvent: MetaCapiEvent = {
      event_name: this.mapEventName(event.eventName),
      event_time: event.eventTime,
      event_id: event.eventId,
      action_source: 'website',
      event_source_url: event.eventSourceUrl,
      user_data: this.buildUserData(event.userData),
    };

    if (event.customData) {
      capiEvent.custom_data = this.buildCustomData(event.customData);
    }

    const payload: MetaCapiPayload = {
      data: [capiEvent],
    };

    // Add test event code if configured
    if (integration.testEventCode) {
      payload.test_event_code = integration.testEventCode;
    }

    // Send to Meta CAPI
    const url = `https://graph.facebook.com/${this.apiVersion}/${pixelId}/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        access_token: accessToken,
      }),
    });

    const result = (await response.json()) as MetaCapiResponse & { error?: { message: string } };

    if (!response.ok) {
      throw new Error(result.error?.message || 'Meta CAPI request failed');
    }

    this.logger.log({
      message: 'Meta CAPI event sent',
      projectId,
      eventId: event.eventId,
      eventName: event.eventName,
      eventsReceived: result.events_received,
    });

    return result;
  }

  private mapEventName(eventName: string): string {
    const mapping: Record<string, string> = {
      page_view: 'PageView',
      view_content: 'ViewContent',
      lead: 'Lead',
      initiate_checkout: 'InitiateCheckout',
      add_to_cart: 'AddToCart',
      purchase: 'Purchase',
      search: 'Search',
      add_payment_info: 'AddPaymentInfo',
      complete_registration: 'CompleteRegistration',
    };

    return mapping[eventName] || eventName;
  }

  private buildUserData(userData: {
    email?: string;
    phone?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  }): MetaCapiEvent['user_data'] {
    const result: MetaCapiEvent['user_data'] = {};

    if (userData.email) {
      result.em = [this.hashValue(userData.email.toLowerCase().trim())];
    }

    if (userData.phone) {
      result.ph = [this.hashValue(this.normalizePhone(userData.phone))];
    }

    if (userData.externalId) {
      result.external_id = [this.hashValue(userData.externalId)];
    }

    if (userData.clientIpAddress) {
      result.client_ip_address = userData.clientIpAddress;
    }

    if (userData.clientUserAgent) {
      result.client_user_agent = userData.clientUserAgent;
    }

    if (userData.fbp) {
      result.fbp = userData.fbp;
    }

    if (userData.fbc) {
      result.fbc = userData.fbc;
    }

    return result;
  }

  private buildCustomData(customData: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    contentType?: string;
    orderId?: string;
  }): MetaCapiEvent['custom_data'] {
    const result: MetaCapiEvent['custom_data'] = {};

    if (customData.value !== undefined) {
      result.value = customData.value;
    }

    if (customData.currency) {
      result.currency = customData.currency;
    }

    if (customData.contentIds?.length) {
      result.content_ids = customData.contentIds;
    }

    if (customData.contentType) {
      result.content_type = customData.contentType;
    }

    if (customData.orderId) {
      result.order_id = customData.orderId;
    }

    return result;
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private normalizePhone(phone: string): string {
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  }

  private decryptAccessToken(encrypted: string): string {
    // In production, implement proper encryption/decryption
    // For now, we assume it's stored in plain text (not recommended for production)
    // TODO: Implement AES-256-GCM encryption

    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      // Development mode - return as-is
      return encrypted;
    }

    // Production decryption would go here
    try {
      const [ivHex, encryptedHex] = encrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch {
      // Fallback for development
      return encrypted;
    }
  }
}
