import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare const REQUEST_ID_HEADER = "x-request-id";
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private logStructured;
}
//# sourceMappingURL=logging.interceptor.d.ts.map