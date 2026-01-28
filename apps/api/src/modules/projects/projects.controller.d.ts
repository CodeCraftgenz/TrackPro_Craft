import { ProjectsService } from './projects.service';
import { ApiKeysService } from './api-keys.service';
import { CreateProjectDto, UpdateProjectDto, CreateApiKeyDto } from './dto/projects.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class ProjectsController {
    private readonly projectsService;
    private readonly apiKeysService;
    constructor(projectsService: ProjectsService, apiKeysService: ApiKeysService);
    create(user: JwtPayload, tenantId: string, dto: CreateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        domain: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        timezone: string;
        retentionDays: number;
        updatedAt: Date;
    }>;
    findAll(user: JwtPayload, tenantId: string): Promise<({
        integrationMeta: {
            pixelId: string;
            enabled: boolean;
        } | null;
        _count: {
            apiKeys: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        domain: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        timezone: string;
        retentionDays: number;
        updatedAt: Date;
    })[]>;
    findOne(user: JwtPayload, tenantId: string, id: string): Promise<{
        apiKeys: {
            id: string;
            name: string;
            keyPrefix: string;
            scopes: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            lastUsedAt: Date | null;
        }[];
        integrationMeta: {
            id: string;
            createdAt: Date;
            pixelId: string;
            testEventCode: string | null;
            enabled: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        domain: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        timezone: string;
        retentionDays: number;
        updatedAt: Date;
    }>;
    update(user: JwtPayload, tenantId: string, id: string, dto: UpdateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        domain: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        timezone: string;
        retentionDays: number;
        updatedAt: Date;
    }>;
    delete(user: JwtPayload, tenantId: string, id: string): Promise<void>;
    createApiKey(user: JwtPayload, tenantId: string, projectId: string, dto: CreateApiKeyDto): Promise<import("./api-keys.service").GeneratedApiKey>;
    listApiKeys(user: JwtPayload, tenantId: string, projectId: string): Promise<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        lastUsedAt: Date | null;
    }[]>;
    revokeApiKey(user: JwtPayload, tenantId: string, projectId: string, keyId: string): Promise<void>;
}
//# sourceMappingURL=projects.controller.d.ts.map