import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/projects.dto';
export interface GeneratedApiKey {
    id: string;
    name: string;
    apiKey: string;
    apiSecret: string;
    keyPrefix: string;
    scopes: string[];
    createdAt: Date;
}
export declare class ApiKeysService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(projectId: string, tenantId: string, userId: string, dto: CreateApiKeyDto): Promise<GeneratedApiKey>;
    findAllForProject(projectId: string, tenantId: string, userId: string): Promise<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        lastUsedAt: Date | null;
    }[]>;
    revoke(apiKeyId: string, projectId: string, tenantId: string, userId: string): Promise<void>;
    validateApiKey(apiKey: string): Promise<{
        projectId: string;
        scopes: string[];
    } | null>;
    getSecretForProject(projectId: string, apiKey: string): Promise<string | null>;
    private generateApiKey;
    private generateSecret;
    private hashKey;
    private checkProjectAccess;
}
//# sourceMappingURL=api-keys.service.d.ts.map