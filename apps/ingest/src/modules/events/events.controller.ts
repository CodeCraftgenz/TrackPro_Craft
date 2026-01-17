import {
  Controller,
  Post,
  Body,
  Headers,
  Ip,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { EventsService } from './events.service';
import { SignatureService } from './signature.service';
import { BatchEventsDto, SingleEventDto, IngestResponse } from './dto/events.dto';
import { RedisService } from '../../services/redis.service';
import { ApiKeyService } from '../../services/api-key.service';

@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly signatureService: SignatureService,
    private readonly redis: RedisService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 100, ttl: 1000 } })
  async ingestBatch(
    @Body() body: BatchEventsDto,
    @Headers('x-api-key') apiKey: string,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Headers('x-request-id') requestId: string,
    @Ip() ip: string,
  ): Promise<IngestResponse> {
    // Validate required headers
    this.validateHeaders(apiKey, signature, timestamp);

    // Validate timestamp (anti-replay)
    if (!this.signatureService.validateTimestamp(timestamp)) {
      throw new UnauthorizedException('Invalid or expired timestamp');
    }

    // Get project ID from API key (in production, validate against DB)
    const projectId = await this.getProjectIdFromApiKey(apiKey);
    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check rate limit per project
    const isAllowed = await this.redis.checkRateLimit(projectId, 1000, 1); // 1000 requests/second
    if (!isAllowed) {
      throw new BadRequestException('Rate limit exceeded');
    }

    // Validate signature
    const projectSecret = this.signatureService.deriveProjectSecret(projectId);
    const bodyString = JSON.stringify(body);

    if (!this.signatureService.validateSignature(signature, timestamp, bodyString, projectSecret)) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Store timestamp for anti-replay
    const replayKey = `replay:${signature}`;
    const isNewRequest = await this.redis.storeTimestamp(replayKey, parseInt(timestamp), 300);
    if (!isNewRequest) {
      throw new UnauthorizedException('Replay attack detected');
    }

    // Validate body
    if (!body.events || !Array.isArray(body.events)) {
      throw new BadRequestException('Invalid body: events array required');
    }

    if (body.events.length === 0) {
      throw new BadRequestException('Empty events array');
    }

    if (body.events.length > 100) {
      throw new BadRequestException('Maximum 100 events per batch');
    }

    // Process events
    const result = await this.eventsService.processEvents(
      projectId,
      body.events,
      ip,
      requestId,
    );

    return {
      requestId: result.requestId,
      accepted: result.accepted,
      rejected: result.rejected,
      errors: result.errors.length > 0 ? result.errors : undefined,
    };
  }

  @Post('event')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 100, ttl: 1000 } })
  async ingestSingle(
    @Body() body: SingleEventDto,
    @Headers('x-api-key') apiKey: string,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Headers('x-request-id') requestId: string,
    @Ip() ip: string,
  ): Promise<IngestResponse> {
    // Reuse batch logic with single event
    return this.ingestBatch(
      { events: [body] },
      apiKey,
      signature,
      timestamp,
      requestId,
      ip,
    );
  }

  private validateHeaders(apiKey: string, signature: string, timestamp: string): void {
    if (!apiKey) {
      throw new BadRequestException('Missing x-api-key header');
    }

    if (!signature) {
      throw new BadRequestException('Missing x-signature header');
    }

    if (!timestamp) {
      throw new BadRequestException('Missing x-timestamp header');
    }
  }

  private async getProjectIdFromApiKey(apiKey: string): Promise<string | null> {
    const keyInfo = await this.apiKeyService.validateApiKey(apiKey);

    if (!keyInfo) {
      return null;
    }

    // Check if the key has the required scope
    if (!keyInfo.scopes.includes('events:write')) {
      this.logger.warn({
        message: 'API key missing events:write scope',
        projectId: keyInfo.projectId,
      });
      return null;
    }

    return keyInfo.projectId;
  }
}
