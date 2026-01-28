import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisModule } from './services/redis.module';
import { ClickHouseModule } from './services/clickhouse.module';
import { PrismaModule } from './services/prisma.module';
import { MetaCapiProcessor } from './processors/meta-capi.processor';
import { AggregatesProcessor } from './processors/aggregates.processor';
import { ExportsProcessor } from './processors/exports.processor';
import { RetentionProcessor } from './processors/retention.processor';
import { MetaCapiService } from './services/meta-capi.service';
import { StorageService } from './services/storage.service';
import { SchedulerService } from './services/scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    RedisModule,
    ClickHouseModule,
    PrismaModule,
  ],
  providers: [
    MetaCapiService,
    StorageService,
    SchedulerService,
    MetaCapiProcessor,
    AggregatesProcessor,
    ExportsProcessor,
    RetentionProcessor,
  ],
})
export class AppModule {}
