import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ClickHouseModule } from './clickhouse.module';

@Module({
  imports: [PrismaModule, ClickHouseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
