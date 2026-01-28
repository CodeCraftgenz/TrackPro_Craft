import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKeysService } from '../projects/api-keys.service';
export interface ApiKeyValidationResult {
    projectId: string;
    tenantId: string;
    scopes: string[];
    status: string;
}
export declare class InternalService {
    private readonly configService;
    private readonly prisma;
    private readonly apiKeysService;
    private readonly internalSecret;
    constructor(configService: ConfigService, prisma: PrismaService, apiKeysService: ApiKeysService);
    validateInternalRequest(secret: string): void;
    validateApiKey(apiKey: string): Promise<ApiKeyValidationResult | null>;
}
//# sourceMappingURL=internal.service.d.ts.map