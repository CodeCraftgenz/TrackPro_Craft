import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
