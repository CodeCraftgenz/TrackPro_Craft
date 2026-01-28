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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const events_service_1 = require("./events.service");
const signature_service_1 = require("./signature.service");
const redis_service_1 = require("../../services/redis.service");
const api_key_service_1 = require("../../services/api-key.service");
let EventsController = EventsController_1 = class EventsController {
    eventsService;
    signatureService;
    redis;
    apiKeyService;
    logger = new common_1.Logger(EventsController_1.name);
    constructor(eventsService, signatureService, redis, apiKeyService) {
        this.eventsService = eventsService;
        this.signatureService = signatureService;
        this.redis = redis;
        this.apiKeyService = apiKeyService;
    }
    async ingestBatch(body, apiKey, signature, timestamp, requestId, ip) {
        this.validateHeaders(apiKey, signature, timestamp);
        if (!this.signatureService.validateTimestamp(timestamp)) {
            throw new common_1.UnauthorizedException('Invalid or expired timestamp');
        }
        const projectId = await this.getProjectIdFromApiKey(apiKey);
        if (!projectId) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        const isAllowed = await this.redis.checkRateLimit(projectId, 1000, 1);
        if (!isAllowed) {
            throw new common_1.BadRequestException('Rate limit exceeded');
        }
        const projectSecret = this.signatureService.deriveProjectSecret(projectId);
        const bodyString = JSON.stringify(body);
        if (!this.signatureService.validateSignature(signature, timestamp, bodyString, projectSecret)) {
            throw new common_1.UnauthorizedException('Invalid signature');
        }
        const replayKey = `replay:${signature}`;
        const isNewRequest = await this.redis.storeTimestamp(replayKey, parseInt(timestamp), 300);
        if (!isNewRequest) {
            throw new common_1.UnauthorizedException('Replay attack detected');
        }
        if (!body.events || !Array.isArray(body.events)) {
            throw new common_1.BadRequestException('Invalid body: events array required');
        }
        if (body.events.length === 0) {
            throw new common_1.BadRequestException('Empty events array');
        }
        if (body.events.length > 100) {
            throw new common_1.BadRequestException('Maximum 100 events per batch');
        }
        const result = await this.eventsService.processEvents(projectId, body.events, ip, requestId);
        return {
            requestId: result.requestId,
            accepted: result.accepted,
            rejected: result.rejected,
            errors: result.errors.length > 0 ? result.errors : undefined,
        };
    }
    async ingestSingle(body, apiKey, signature, timestamp, requestId, ip) {
        return this.ingestBatch({ events: [body] }, apiKey, signature, timestamp, requestId, ip);
    }
    validateHeaders(apiKey, signature, timestamp) {
        if (!apiKey) {
            throw new common_1.BadRequestException('Missing x-api-key header');
        }
        if (!signature) {
            throw new common_1.BadRequestException('Missing x-signature header');
        }
        if (!timestamp) {
            throw new common_1.BadRequestException('Missing x-timestamp header');
        }
    }
    async getProjectIdFromApiKey(apiKey) {
        const keyInfo = await this.apiKeyService.validateApiKey(apiKey);
        if (!keyInfo) {
            return null;
        }
        if (!keyInfo.scopes.includes('events:write')) {
            this.logger.warn({
                message: 'API key missing events:write scope',
                projectId: keyInfo.projectId,
            });
            return null;
        }
        return keyInfo.projectId;
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, throttler_1.Throttle)({ default: { limit: 100, ttl: 1000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-api-key')),
    __param(2, (0, common_1.Headers)('x-signature')),
    __param(3, (0, common_1.Headers)('x-timestamp')),
    __param(4, (0, common_1.Headers)('x-request-id')),
    __param(5, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "ingestBatch", null);
__decorate([
    (0, common_1.Post)('event'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, throttler_1.Throttle)({ default: { limit: 100, ttl: 1000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-api-key')),
    __param(2, (0, common_1.Headers)('x-signature')),
    __param(3, (0, common_1.Headers)('x-timestamp')),
    __param(4, (0, common_1.Headers)('x-request-id')),
    __param(5, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "ingestSingle", null);
exports.EventsController = EventsController = EventsController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [events_service_1.EventsService,
        signature_service_1.SignatureService,
        redis_service_1.RedisService,
        api_key_service_1.ApiKeyService])
], EventsController);
//# sourceMappingURL=events.controller.js.map