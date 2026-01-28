import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Worker');

  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log('Worker service started');
  logger.log('Listening for jobs on BullMQ queues...');

  // Handle graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  });
}

bootstrap();
