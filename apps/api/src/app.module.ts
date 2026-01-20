import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { InternalModule } from './modules/internal/internal.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ExportsModule } from './modules/exports/exports.module';
import { ConsentModule } from './modules/consent/consent.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { AdminModule } from './modules/admin/admin.module';
import { LeadsModule } from './modules/leads/leads.module';
import { EmailModule } from './modules/email/email.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 50, // 50 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 200, // 200 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000, // 1000 requests per minute
      },
    ]),
    PrismaModule,
    RedisModule,
    AuditModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    HealthModule,
    InternalModule,
    AnalyticsModule,
    IntegrationsModule,
    ExportsModule,
    ConsentModule,
    ReportsModule,
    PrivacyModule,
    AdminModule,
    LeadsModule,
    EmailModule,
    BillingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
