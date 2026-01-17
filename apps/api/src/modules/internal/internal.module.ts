import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [InternalController],
  providers: [InternalService],
})
export class InternalModule {}
