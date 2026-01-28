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
const redis_module_1 = require("./services/redis.module");
const clickhouse_module_1 = require("./services/clickhouse.module");
const prisma_module_1 = require("./services/prisma.module");
const meta_capi_processor_1 = require("./processors/meta-capi.processor");
const aggregates_processor_1 = require("./processors/aggregates.processor");
const exports_processor_1 = require("./processors/exports.processor");
const retention_processor_1 = require("./processors/retention.processor");
const meta_capi_service_1 = require("./services/meta-capi.service");
const storage_service_1 = require("./services/storage.service");
const scheduler_service_1 = require("./services/scheduler.service");
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
            redis_module_1.RedisModule,
            clickhouse_module_1.ClickHouseModule,
            prisma_module_1.PrismaModule,
        ],
        providers: [
            meta_capi_service_1.MetaCapiService,
            storage_service_1.StorageService,
            scheduler_service_1.SchedulerService,
            meta_capi_processor_1.MetaCapiProcessor,
            aggregates_processor_1.AggregatesProcessor,
            exports_processor_1.ExportsProcessor,
            retention_processor_1.RetentionProcessor,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map