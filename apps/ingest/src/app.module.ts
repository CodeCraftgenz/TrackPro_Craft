import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { RedisModule } from './services/redis.module';
import { ClickHouseModule } from './services/clickhouse.module';
import { QueueModule } from './services/queue.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 1000,
        limit: 100, // 100 requests per second per IP
      },
    ]),
    RedisModule,
    ClickHouseModule,
    QueueModule,
    EventsModule,
    HealthModule,
  ],
})
export class AppModule {}
