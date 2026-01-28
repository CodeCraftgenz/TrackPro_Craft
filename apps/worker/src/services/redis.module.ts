import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        return new IORedis(redisUrl, {
          maxRetriesPerRequest: null,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CONNECTION],
})
export class RedisModule {}
