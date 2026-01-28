"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = exports.REQUEST_ID_HEADER = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const crypto_1 = require("crypto");
exports.REQUEST_ID_HEADER = 'x-request-id';
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { method, originalUrl, ip } = request;
        const userAgent = request.get('user-agent') || '';
        const requestId = request.headers[exports.REQUEST_ID_HEADER] || (0, crypto_1.randomUUID)();
        request.headers[exports.REQUEST_ID_HEADER] = requestId;
        response.setHeader(exports.REQUEST_ID_HEADER, requestId);
        const startTime = Date.now();
        const user = request.user;
        const userId = user?.userId;
        const tenantId = request.params.tenantId;
        const projectId = request.params.projectId;
        const baseLog = {
            requestId,
            method,
            path: originalUrl,
            userId,
            tenantId,
            projectId,
            ip: ip || undefined,
            userAgent,
        };
        this.logStructured({
            ...baseLog,
            level: 'info',
            message: 'Request started',
        });
        return next.handle().pipe((0, operators_1.tap)(() => {
            const duration = Date.now() - startTime;
            const statusCode = response.statusCode;
            this.logStructured({
                ...baseLog,
                level: 'info',
                message: 'Request completed',
                statusCode,
                duration,
            });
        }), (0, operators_1.catchError)((error) => {
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
            });
            throw error;
        }));
    }
    logStructured(log) {
        const output = {
            ...log,
            timestamp: new Date().toISOString(),
        };
        if (log.level === 'error') {
            this.logger.error(JSON.stringify(output));
        }
        else if (log.level === 'warn') {
            this.logger.warn(JSON.stringify(output));
        }
        else {
            this.logger.log(JSON.stringify(output));
        }
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map