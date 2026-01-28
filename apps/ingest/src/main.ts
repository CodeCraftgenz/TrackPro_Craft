import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Ingest');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
      bodyLimit: 1048576, // 1MB max payload
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // CORS
  app.enableCors({
    origin: '*', // Ingest accepts from any origin (SDK)
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'x-api-key',
      'x-signature',
      'x-timestamp',
      'x-request-id',
    ],
  });

  // Global prefix
  app.setGlobalPrefix('v1');

  await app.listen(port, '0.0.0.0');

  logger.log(`Ingest service running on port ${port} in ${nodeEnv} mode`);
  logger.log(`Health check: http://localhost:${port}/v1/health`);
}

bootstrap();
