import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

interface StructuredLog {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  requestId: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  tenantId?: string;
  projectId?: string;
  ip?: string;
  userAgent?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';

    // Generate or use existing request ID
    const requestId = (request.headers[REQUEST_ID_HEADER] as string) || randomUUID();
    request.headers[REQUEST_ID_HEADER] = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    const startTime = Date.now();

    // Extract context from request
    const user = (request as Request & { user?: { userId?: string } }).user;
    const userId = user?.userId;
    const tenantId = request.params.tenantId;
    const projectId = request.params.projectId;

    const baseLog: Partial<StructuredLog> = {
      requestId,
      method,
      path: originalUrl,
      userId,
      tenantId,
      projectId,
      ip: ip || undefined,
      userAgent,
    };

    // Log incoming request
    this.logStructured({
      ...baseLog,
      level: 'info',
      message: 'Request started',
    } as StructuredLog);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logStructured({
          ...baseLog,
          level: 'info',
          message: 'Request completed',
          statusCode,
          duration,
        } as StructuredLog);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.logStructured({
          ...baseLog,
          level: 'error',
          message: 'Request failed',
          duration,
          error: {
            name: error.name || 'Error',
            message: error.message || 'Unknown error',
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
          },
        } as StructuredLog);

        throw error;
      }),
    );
  }

  private logStructured(log: StructuredLog): void {
    const output = {
      ...log,
      timestamp: new Date().toISOString(),
    };

    if (log.level === 'error') {
      this.logger.error(JSON.stringify(output));
    } else if (log.level === 'warn') {
      this.logger.warn(JSON.stringify(output));
    } else {
      this.logger.log(JSON.stringify(output));
    }
  }
}
