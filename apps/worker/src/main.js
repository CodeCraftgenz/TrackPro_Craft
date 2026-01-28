"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Worker');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    logger.log('Worker service started');
    logger.log('Listening for jobs on BullMQ queues...');
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            logger.log(`Received ${signal}, shutting down gracefully...`);
            await app.close();
            process.exit(0);
        });
    });
}
bootstrap();
//# sourceMappingURL=main.js.map