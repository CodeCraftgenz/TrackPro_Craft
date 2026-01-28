import { ConfigService } from '@nestjs/config';
interface UploadOptions {
    contentType?: string;
    metadata?: Record<string, string>;
}
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    private readonly storageType;
    private readonly localPath;
    private readonly s3Bucket?;
    private readonly s3Region?;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    uploadFile(key: string, content: Buffer | string, options?: UploadOptions): Promise<string>;
    getFileUrl(key: string): Promise<string>;
    deleteFile(key: string): Promise<void>;
    private uploadToLocal;
    private getLocalUrl;
    private deleteFromLocal;
    private uploadToS3;
    private getS3Url;
    private deleteFromS3;
    generateSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
export {};
//# sourceMappingURL=storage.service.d.ts.map