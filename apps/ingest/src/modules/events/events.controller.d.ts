import { EventsService } from './events.service';
import { SignatureService } from './signature.service';
import { BatchEventsDto, SingleEventDto, IngestResponse } from './dto/events.dto';
import { RedisService } from '../../services/redis.service';
import { ApiKeyService } from '../../services/api-key.service';
export declare class EventsController {
    private readonly eventsService;
    private readonly signatureService;
    private readonly redis;
    private readonly apiKeyService;
    private readonly logger;
    constructor(eventsService: EventsService, signatureService: SignatureService, redis: RedisService, apiKeyService: ApiKeyService);
    ingestBatch(body: BatchEventsDto, apiKey: string, signature: string, timestamp: string, requestId: string, ip: string): Promise<IngestResponse>;
    ingestSingle(body: SingleEventDto, apiKey: string, signature: string, timestamp: string, requestId: string, ip: string): Promise<IngestResponse>;
    private validateHeaders;
    private getProjectIdFromApiKey;
}
//# sourceMappingURL=events.controller.d.ts.map