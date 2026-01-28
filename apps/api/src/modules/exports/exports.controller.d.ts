import { ExportsService } from './exports.service';
interface AuthRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class ExportsController {
    private readonly exportsService;
    constructor(exportsService: ExportsService);
    getExports(tenantId: string, projectId: string, req: AuthRequest): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ExportType;
        status: import("@prisma/client").$Enums.ExportStatus;
        params: import("@prisma/client/runtime/library").JsonValue;
        fileUrl: string | null;
        error: string | null;
        createdAt: Date;
        finishedAt: Date | null;
    }[]>;
    createExport(tenantId: string, projectId: string, body: unknown, req: AuthRequest): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ExportType;
        status: import("@prisma/client").$Enums.ExportStatus;
        params: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }>;
    getExport(tenantId: string, projectId: string, exportId: string, req: AuthRequest): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ExportType;
        status: import("@prisma/client").$Enums.ExportStatus;
        params: import("@prisma/client/runtime/library").JsonValue;
        fileUrl: string | null;
        error: string | null;
        createdAt: Date;
        finishedAt: Date | null;
    }>;
    cancelExport(tenantId: string, projectId: string, exportId: string, req: AuthRequest): Promise<void>;
    getDownloadUrl(tenantId: string, projectId: string, exportId: string, req: AuthRequest): Promise<{
        downloadUrl: string;
        expiresAt: Date;
    }>;
}
export {};
//# sourceMappingURL=exports.controller.d.ts.map