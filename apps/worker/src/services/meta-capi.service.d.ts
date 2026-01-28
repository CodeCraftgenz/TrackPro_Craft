import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
interface MetaCapiResponse {
    events_received: number;
    messages?: string[];
    fbtrace_id?: string;
}
export declare class MetaCapiService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly apiVersion;
    constructor(configService: ConfigService, prisma: PrismaService);
    sendEvent(projectId: string, event: {
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
    }): Promise<MetaCapiResponse>;
    private mapEventName;
    private buildUserData;
    private buildCustomData;
    private hashValue;
    private normalizePhone;
    private decryptAccessToken;
}
export {};
//# sourceMappingURL=meta-capi.service.d.ts.map