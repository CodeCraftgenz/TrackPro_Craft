"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const projects_module_1 = require("./modules/projects/projects.module");
const health_module_1 = require("./modules/health/health.module");
const audit_module_1 = require("./modules/audit/audit.module");
const internal_module_1 = require("./modules/internal/internal.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const exports_module_1 = require("./modules/exports/exports.module");
const consent_module_1 = require("./modules/consent/consent.module");
const reports_module_1 = require("./modules/reports/reports.module");
const privacy_module_1 = require("./modules/privacy/privacy.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 10,
                },
                {
                    name: 'medium',
                    ttl: 10000,
                    limit: 50,
                },
                {
                    name: 'long',
                    ttl: 60000,
                    limit: 200,
                },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            projects_module_1.ProjectsModule,
            health_module_1.HealthModule,
            internal_module_1.InternalModule,
            analytics_module_1.AnalyticsModule,
            integrations_module_1.IntegrationsModule,
            exports_module_1.ExportsModule,
            consent_module_1.ConsentModule,
            reports_module_1.ReportsModule,
            privacy_module_1.PrivacyModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map