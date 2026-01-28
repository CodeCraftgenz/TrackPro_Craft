"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const logging_interceptor_1 = require("../interceptors/logging.interceptor");
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('ExceptionFilter');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.headers[logging_interceptor_1.REQUEST_ID_HEADER] || 'unknown';
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse;
                message = resp.message || message;
                error = resp.error || exception.name;
                details = resp.details;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }
        const errorResponse = {
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
        this.logger.error({
            timestamp: errorResponse.timestamp,
            requestId,
            statusCode,
            error,
            message,
            path: request.url,
            method: request.method,
            userId: request.user?.userId,
            stack: exception instanceof Error && process.env.NODE_ENV !== 'production'
                ? exception.stack
                : undefined,
        });
        response.status(statusCode).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map