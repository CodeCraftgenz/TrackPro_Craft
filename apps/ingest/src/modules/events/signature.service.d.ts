import { ConfigService } from '@nestjs/config';
export declare class SignatureService {
    private readonly configService;
    private readonly logger;
    private readonly masterSecret;
    private readonly timestampWindowMs;
    constructor(configService: ConfigService);
    validateSignature(signature: string, timestamp: string, body: string, projectSecret: string): boolean;
    validateTimestamp(timestamp: string): boolean;
    deriveProjectSecret(projectId: string): string;
    computeHmac(message: string, secret: string): string;
    generateSignature(body: string, projectSecret: string): {
        signature: string;
        timestamp: string;
    };
}
//# sourceMappingURL=signature.service.d.ts.map