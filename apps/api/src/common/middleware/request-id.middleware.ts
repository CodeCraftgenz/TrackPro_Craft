import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID or generate new one
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();

    req.requestId = requestId;
    req.startTime = Date.now();

    // Add to response headers
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
