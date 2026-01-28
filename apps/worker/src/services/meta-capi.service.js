"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MetaCapiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaCapiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("./prisma.service");
let MetaCapiService = MetaCapiService_1 = class MetaCapiService {
    configService;
    prisma;
    logger = new common_1.Logger(MetaCapiService_1.name);
    apiVersion = 'v18.0';
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
    }
    async sendEvent(projectId, event) {
        const integration = await this.prisma.integrationMeta.findUnique({
            where: { projectId },
        });
        if (!integration || !integration.enabled) {
            throw new Error('Meta integration not enabled for this project');
        }
        const accessToken = this.decryptAccessToken(integration.accessTokenEncrypted);
        const pixelId = integration.pixelId;
        const capiEvent = {
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
        const payload = {
            data: [capiEvent],
        };
        if (integration.testEventCode) {
            payload.test_event_code = integration.testEventCode;
        }
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
        const result = (await response.json());
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
    mapEventName(eventName) {
        const mapping = {
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
    buildUserData(userData) {
        const result = {};
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
    buildCustomData(customData) {
        const result = {};
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
    hashValue(value) {
        return crypto.createHash('sha256').update(value).digest('hex');
    }
    normalizePhone(phone) {
        return phone.replace(/\D/g, '');
    }
    decryptAccessToken(encrypted) {
        const encryptionKey = this.configService.get('ENCRYPTION_KEY');
        if (!encryptionKey) {
            return encrypted;
        }
        try {
            const [ivHex, encryptedHex] = encrypted.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
            const key = crypto.scryptSync(encryptionKey, 'salt', 32);
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        }
        catch {
            return encrypted;
        }
    }
};
exports.MetaCapiService = MetaCapiService;
exports.MetaCapiService = MetaCapiService = MetaCapiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], MetaCapiService);
//# sourceMappingURL=meta-capi.service.js.map