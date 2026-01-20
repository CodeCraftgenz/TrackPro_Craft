// Initialize Sentry FIRST, before any other imports
import { initSentry } from './sentry';
initSentry();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/nestjs';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ===================
  // SECURITY HARDENING
  // ===================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Body size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser for httpOnly cookie auth
  app.use(cookieParser());

  // CORS Configuration
  const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-api-key'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86400, // 24 hours
  });

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // Sentry error handler should be first
  app.useGlobalFilters(
    new Sentry.SentryGlobalFilter(),
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Graceful shutdown
  app.enableShutdownHooks();

  // Swagger documentation (only in development)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TrackPro API')
      .setDescription('API for TrackPro Analytics Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('tenants', 'Tenant management')
      .addTag('projects', 'Project management')
      .addTag('integrations', 'Third-party integrations')
      .addTag('reports', 'Analytics reports')
      .addTag('exports', 'Data exports')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  console.log(`[API] Running on port ${port} in ${nodeEnv} mode`);
  console.log(`[API] Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
