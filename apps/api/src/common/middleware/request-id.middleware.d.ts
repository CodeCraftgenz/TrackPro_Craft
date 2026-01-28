import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare const REQUEST_ID_HEADER = "x-request-id";
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            startTime: number;
        }
    }
}
export declare class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=request-id.middleware.d.ts.map