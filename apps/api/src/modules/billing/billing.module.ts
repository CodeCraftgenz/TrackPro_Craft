import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BillingService } from './billing.service';
import { PlansService } from './plans.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule],
  controllers: [BillingController],
  providers: [BillingService, PlansService],
  exports: [BillingService, PlansService],
})
export class BillingModule {}
