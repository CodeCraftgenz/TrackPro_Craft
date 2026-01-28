import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { CreateMetaIntegrationDto, UpdateMetaIntegrationDto } from './dto/integrations.dto';
export declare class IntegrationsService {
    private readonly prisma;
    private readonly encryption;
    constructor(prisma: PrismaService, encryption: EncryptionService);
    getMetaIntegration(projectId: string, tenantId: string, userId: string): Promise<{
        id: string;
        pixelId: string;
        testEventCode: string | null;
        enabled: boolean;
        hasAccessToken: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createMetaIntegration(projectId: string, tenantId: string, userId: string, dto: CreateMetaIntegrationDto): Promise<{
        id: string;
        pixelId: string;
        testEventCode: string | null;
        enabled: boolean;
        hasAccessToken: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMetaIntegration(projectId: string, tenantId: string, userId: string, dto: UpdateMetaIntegrationDto): Promise<{
        id: string;
        pixelId: string;
        testEventCode: string | null;
        enabled: boolean;
        hasAccessToken: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteMetaIntegration(projectId: string, tenantId: string, userId: string): Promise<void>;
    testMetaIntegration(projectId: string, tenantId: string, userId: string): Promise<{
        success: boolean;
        error: any;
        pixelName?: undefined;
        pixelId?: undefined;
    } | {
        success: boolean;
        pixelName: any;
        pixelId: any;
        error?: undefined;
    }>;
    private checkProjectAccess;
}
//# sourceMappingURL=integrations.service.d.ts.map