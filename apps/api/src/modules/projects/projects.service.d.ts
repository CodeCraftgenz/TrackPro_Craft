import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';
export declare class ProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, userId: string, dto: CreateProjectDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        domain: string;
        timezone: string;
        retentionDays: number;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    findAllForTenant(tenantId: string, userId: string): Promise<({
        integrationMeta: {
            pixelId: string;
            enabled: boolean;
        } | null;
        _count: {
            apiKeys: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        domain: string;
        timezone: string;
        retentionDays: number;
        status: import("@prisma/client").$Enums.ProjectStatus;
    })[]>;
    findById(projectId: string, tenantId: string, userId: string): Promise<{
        integrationMeta: {
            id: string;
            createdAt: Date;
            pixelId: string;
            testEventCode: string | null;
            enabled: boolean;
        } | null;
        apiKeys: {
            name: string;
            id: string;
            createdAt: Date;
            scopes: import("@prisma/client/runtime/library").JsonValue;
            keyPrefix: string;
            lastUsedAt: Date | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        domain: string;
        timezone: string;
        retentionDays: number;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    update(projectId: string, tenantId: string, userId: string, dto: UpdateProjectDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        domain: string;
        timezone: string;
        retentionDays: number;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    delete(projectId: string, tenantId: string, userId: string): Promise<void>;
    updateStatus(projectId: string, tenantId: string, userId: string, status: ProjectStatus): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        domain: string;
        timezone: string;
        retentionDays: number;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    private checkTenantAccess;
}
//# sourceMappingURL=projects.service.d.ts.map