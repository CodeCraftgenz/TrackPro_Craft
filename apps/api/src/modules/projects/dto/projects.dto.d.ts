import { ProjectStatus } from '@prisma/client';
export declare class CreateProjectDto {
    name: string;
    domain: string;
    timezone?: string;
    retentionDays?: number;
}
export declare class UpdateProjectDto {
    name?: string;
    domain?: string;
    status?: ProjectStatus;
    timezone?: string;
    retentionDays?: number;
}
export declare class CreateApiKeyDto {
    name: string;
    scopes?: string[];
}
//# sourceMappingURL=projects.dto.d.ts.map