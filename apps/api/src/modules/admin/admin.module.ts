import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
