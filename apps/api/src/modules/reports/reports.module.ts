import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsCacheService } from './reports-cache.service';

@Module({
  imports: [PrismaModule, RedisModule, AnalyticsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsCacheService],
  exports: [ReportsService],
})
export class ReportsModule {}
