"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const redis_service_1 = require("../../services/redis.service");
const clickhouse_service_1 = require("../../services/clickhouse.service");
const queue_service_1 = require("../../services/queue.service");
const META_CAPI_EVENTS = ['lead', 'purchase', 'initiate_checkout', 'add_to_cart', 'view_content'];
let EventsService = EventsService_1 = class EventsService {
    redis;
    clickhouse;
    queue;
    logger = new common_1.Logger(EventsService_1.name);
    constructor(redis, clickhouse, queue) {
        this.redis = redis;
        this.clickhouse = clickhouse;
        this.queue = queue;
    }
    async processEvents(projectId, events, clientIp, requestId) {
        const id = requestId || (0, uuid_1.v4)();
        const receivedAt = Math.floor(Date.now() / 1000);
        const validEvents = [];
        const errors = [];
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            try {
                this.validateEvent(event);
                const isDupe = !(await this.redis.checkDedupe(`dedupe:${event.event_id}`, 3600));
                if (isDupe) {
                    errors.push({ index: i, message: 'Duplicate event_id' });
                    continue;
                }
                if (event.event_name === 'purchase' && event.order_id) {
                    const isOrderDupe = !(await this.redis.checkDedupe(`dedupe:order:${projectId}:${event.order_id}`, 86400));
                    if (isOrderDupe) {
                        errors.push({ index: i, message: 'Duplicate order_id' });
                        continue;
                    }
                }
                const normalizedEvent = this.normalizeEvent(event, projectId, receivedAt, clientIp);
                validEvents.push(normalizedEvent);
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
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                errors.push({ index: i, message });
                await this.clickhouse.insertInvalidEvent({
                    request_id: id,
                    reason: message,
                    raw_payload: JSON.stringify(event),
                    received_at: receivedAt,
                });
            }
        }
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
    validateEvent(event) {
        if (!event.event_id) {
            throw new common_1.BadRequestException('Missing event_id');
        }
        if (!event.event_name) {
            throw new common_1.BadRequestException('Missing event_name');
        }
        if (!event.event_time) {
            throw new common_1.BadRequestException('Missing event_time');
        }
        if (!event.anonymous_id && !event.user_id) {
            throw new common_1.BadRequestException('Missing anonymous_id or user_id');
        }
        if (!event.session_id) {
            throw new common_1.BadRequestException('Missing session_id');
        }
        if (event.event_name === 'purchase') {
            if (!event.order_id) {
                throw new common_1.BadRequestException('Purchase event requires order_id');
            }
            if (event.value === undefined || event.value === null) {
                throw new common_1.BadRequestException('Purchase event requires value');
            }
            if (!event.currency) {
                throw new common_1.BadRequestException('Purchase event requires currency');
            }
        }
        const maxAge = 7 * 24 * 60 * 60;
        const now = Math.floor(Date.now() / 1000);
        if (event.event_time < now - maxAge) {
            throw new common_1.BadRequestException('Event timestamp too old');
        }
    }
    normalizeEvent(event, projectId, receivedAt, clientIp) {
        let path = '';
        if (event.url) {
            try {
                const url = new URL(event.url);
                path = url.pathname;
            }
            catch {
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
            country: undefined,
            consent_categories: event.consent_categories || [],
            order_id: event.order_id,
            value: event.value,
            currency: event.currency,
            payload_json: JSON.stringify(event.payload || {}),
        };
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        clickhouse_service_1.ClickHouseService,
        queue_service_1.QueueService])
], EventsService);
//# sourceMappingURL=events.service.js.map