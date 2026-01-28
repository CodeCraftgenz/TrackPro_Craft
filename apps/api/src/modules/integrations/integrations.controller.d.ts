import { IntegrationsService } from './integrations.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class IntegrationsController {
    private readonly integrationsService;
    constructor(integrationsService: IntegrationsService);
    getMetaIntegration(tenantId: string, projectId: string, req: AuthRequest): Promise<{
        id: string;
        pixelId: string;
        testEventCode: string | null;
        enabled: boolean;
        hasAccessToken: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createMetaIntegration(tenantId: string, projectId: string, body: unknown, req: AuthRequest): Promise<{
        id: string;
        pixelId: string;
        testEventCode: string | null;
        enabled: boolean;
        hasAccessToken: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMetaIntegration(tenantId: string, projectId: string, body: unknown, req: AuthRequest): Promise<{
        id: string;
        pixelId: string;
        testEventCode: string | null;
        enabled: boolean;
        hasAccessToken: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteMetaIntegration(tenantId: string, projectId: string, req: AuthRequest): Promise<void>;
    testMetaIntegration(tenantId: string, projectId: string, req: AuthRequest): Promise<{
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
}
export {};
//# sourceMappingURL=integrations.controller.d.ts.map