import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../interceptors/logging.interceptor';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  requestId: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers[REQUEST_ID_HEADER] as string) || 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        error = (resp.error as string) || exception.name;
        details = resp.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details) {
      errorResponse.details = details;
    }

    // Log the error with full context
    this.logger.error({
      timestamp: errorResponse.timestamp,
      requestId,
      statusCode,
      error,
      message,
      path: request.url,
      method: request.method,
      userId: (request as Request & { user?: { userId?: string } }).user?.userId,
      stack: exception instanceof Error && process.env.NODE_ENV !== 'production'
        ? exception.stack
        : undefined,
    });

    response.status(statusCode).json(errorResponse);
  }
}
