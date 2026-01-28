import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExportDto } from './dto/exports.dto';
export declare class ExportsService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly exportsQueue;
    constructor(prisma: PrismaService, redis: RedisService);
    createExport(projectId: string, tenantId: string, userId: string, dto: CreateExportDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ExportType;
        status: import("@prisma/client").$Enums.ExportStatus;
        params: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }>;
    getExports(projectId: string, tenantId: string, userId: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ExportType;
        status: import("@prisma/client").$Enums.ExportStatus;
        params: import("@prisma/client/runtime/library").JsonValue;
        fileUrl: string | null;
        error: string | null;
        createdAt: Date;
        finishedAt: Date | null;
    }[]>;
    getExport(exportId: string, projectId: string, tenantId: string, userId: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ExportType;
        status: import("@prisma/client").$Enums.ExportStatus;
        params: import("@prisma/client/runtime/library").JsonValue;
        fileUrl: string | null;
        error: string | null;
        createdAt: Date;
        finishedAt: Date | null;
    }>;
    cancelExport(exportId: string, projectId: string, tenantId: string, userId: string): Promise<void>;
    getDownloadUrl(exportId: string, projectId: string, tenantId: string, userId: string): Promise<{
        downloadUrl: string;
        expiresAt: Date;
    }>;
    private checkProjectAccess;
}
//# sourceMappingURL=exports.service.d.ts.map