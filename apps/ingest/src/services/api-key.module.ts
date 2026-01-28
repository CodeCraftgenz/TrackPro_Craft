import { Module } from '@nestjs/common';

import { RedisModule } from './redis.module';
import { ApiKeyService } from './api-key.service';

@Module({
  imports: [RedisModule],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
