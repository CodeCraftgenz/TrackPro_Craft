"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Ingest');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({
        logger: false,
        trustProxy: true,
        bodyLimit: 1048576,
    }));
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3002);
    const nodeEnv = configService.get('NODE_ENV', 'development');
    app.enableCors({
        origin: '*',
        methods: ['POST', 'GET', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'x-api-key',
            'x-signature',
            'x-timestamp',
            'x-request-id',
        ],
    });
    app.setGlobalPrefix('v1');
    await app.listen(port, '0.0.0.0');
    logger.log(`Ingest service running on port ${port} in ${nodeEnv} mode`);
    logger.log(`Health check: http://localhost:${port}/v1/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map