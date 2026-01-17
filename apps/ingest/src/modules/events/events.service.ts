import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { RedisService } from '../../services/redis.service';
import { ClickHouseService, EventRow } from '../../services/clickhouse.service';
import { QueueService } from '../../services/queue.service';
import { IngestEventDto } from './dto/events.dto';

interface ProcessResult {
  requestId: string;
  accepted: number;
  rejected: number;
  errors: Array<{ index: number; message: string }>;
}

const META_CAPI_EVENTS = ['lead', 'purchase', 'initiate_checkout', 'add_to_cart', 'view_content'];

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly clickhouse: ClickHouseService,
    private readonly queue: QueueService,
  ) {}

  async processEvents(
    projectId: string,
    events: IngestEventDto[],
    clientIp?: string,
    requestId?: string,
  ): Promise<ProcessResult> {
    const id = requestId || uuidv4();
    const receivedAt = Math.floor(Date.now() / 1000);

    const validEvents: EventRow[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      try {
        // Validate event
        this.validateEvent(event);

        // Check deduplication by event_id
        const isDupe = !(await this.redis.checkDedupe(`dedupe:${event.event_id}`, 3600));
        if (isDupe) {
          errors.push({ index: i, message: 'Duplicate event_id' });
          continue;
        }

        // Extra deduplication for purchase (order_id + project_id)
        if (event.event_name === 'purchase' && event.order_id) {
          const isOrderDupe = !(await this.redis.checkDedupe(
            `dedupe:order:${projectId}:${event.order_id}`,
            86400, // 24 hours
          ));
          if (isOrderDupe) {
            errors.push({ index: i, message: 'Duplicate order_id' });
            continue;
          }
        }

        // Normalize event
        const normalizedEvent = this.normalizeEvent(event, projectId, receivedAt, clientIp);
        validEvents.push(normalizedEvent);

        // Queue Meta CAPI job for relevant events
        if (META_CAPI_EVENTS.includes(event.event_name)) {
          await this.queue.addMetaCapiJob({
            projectId,
            eventId: event.event_id,
            eventName: event.event_name,
            eventTime: event.event_time,
            userData: {
              externalId: event.user_id,
              clientIpAddress: clientIp,
              clientUserAgent: event.user_agent,
              fbp: event.payload?.fbp,
              fbc: event.payload?.fbc,
            },
            customData: {
              value: event.value,
              currency: event.currency,
              orderId: event.order_id,
            },
            eventSourceUrl: event.url,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ index: i, message });

        // Store invalid event
        await this.clickhouse.insertInvalidEvent({
          request_id: id,
          reason: message,
          raw_payload: JSON.stringify(event),
          received_at: receivedAt,
        });
      }
    }

    // Insert valid events to ClickHouse
    if (validEvents.length > 0) {
      await this.clickhouse.insertEvents(validEvents);
    }

    this.logger.log({
      message: 'Events processed',
      requestId: id,
      projectId,
      total: events.length,
      accepted: validEvents.length,
      rejected: errors.length,
    });

    return {
      requestId: id,
      accepted: validEvents.length,
      rejected: errors.length,
      errors,
    };
  }

  private validateEvent(event: IngestEventDto): void {
    if (!event.event_id) {
      throw new BadRequestException('Missing event_id');
    }

    if (!event.event_name) {
      throw new BadRequestException('Missing event_name');
    }

    if (!event.event_time) {
      throw new BadRequestException('Missing event_time');
    }

    if (!event.anonymous_id && !event.user_id) {
      throw new BadRequestException('Missing anonymous_id or user_id');
    }

    if (!event.session_id) {
      throw new BadRequestException('Missing session_id');
    }

    // Validate purchase event requirements
    if (event.event_name === 'purchase') {
      if (!event.order_id) {
        throw new BadRequestException('Purchase event requires order_id');
      }
      if (event.value === undefined || event.value === null) {
        throw new BadRequestException('Purchase event requires value');
      }
      if (!event.currency) {
        throw new BadRequestException('Purchase event requires currency');
      }
    }

    // Validate timestamp is not too old (max 7 days)
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const now = Math.floor(Date.now() / 1000);
    if (event.event_time < now - maxAge) {
      throw new BadRequestException('Event timestamp too old');
    }
  }

  private normalizeEvent(
    event: IngestEventDto,
    projectId: string,
    receivedAt: number,
    clientIp?: string,
  ): EventRow {
    // Extract path from URL
    let path = '';
    if (event.url) {
      try {
        const url = new URL(event.url);
        path = url.pathname;
      } catch {
        path = event.url;
      }
    }

    return {
      event_id: event.event_id,
      project_id: projectId,
      event_name: event.event_name,
      event_time: event.event_time,
      received_at: receivedAt,
      anonymous_id: event.anonymous_id || '',
      user_id: event.user_id,
      session_id: event.session_id,
      url: event.url,
      path,
      referrer: event.referrer,
      utm_source: event.utm_source,
      utm_medium: event.utm_medium,
      utm_campaign: event.utm_campaign,
      utm_content: event.utm_content,
      utm_term: event.utm_term,
      ip: clientIp,
      user_agent: event.user_agent,
      country: undefined, // Will be enriched later if needed
      consent_categories: event.consent_categories || [],
      order_id: event.order_id,
      value: event.value,
      currency: event.currency,
      payload_json: JSON.stringify(event.payload || {}),
    };
  }
}
