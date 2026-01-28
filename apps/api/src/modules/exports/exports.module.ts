import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
