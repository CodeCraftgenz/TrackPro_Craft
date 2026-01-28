import { RedisService } from '../../services/redis.service';
import { ClickHouseService } from '../../services/clickhouse.service';
import { QueueService } from '../../services/queue.service';
import { IngestEventDto } from './dto/events.dto';
interface ProcessResult {
    requestId: string;
    accepted: number;
    rejected: number;
    errors: Array<{
        index: number;
        message: string;
    }>;
}
export declare class EventsService {
    private readonly redis;
    private readonly clickhouse;
    private readonly queue;
    private readonly logger;
    constructor(redis: RedisService, clickhouse: ClickHouseService, queue: QueueService);
    processEvents(projectId: string, events: IngestEventDto[], clientIp?: string, requestId?: string): Promise<ProcessResult>;
    private validateEvent;
    private normalizeEvent;
}
export {};
//# sourceMappingURL=events.service.d.ts.map