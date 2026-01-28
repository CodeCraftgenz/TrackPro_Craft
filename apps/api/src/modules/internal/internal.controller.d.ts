import { InternalService } from './internal.service';
interface ValidateApiKeyBody {
    apiKey: string;
}
export declare class InternalController {
    private readonly internalService;
    constructor(internalService: InternalService);
    validateApiKey(internalSecret: string, body: ValidateApiKeyBody): Promise<import("./internal.service").ApiKeyValidationResult>;
}
export {};
//# sourceMappingURL=internal.controller.d.ts.map