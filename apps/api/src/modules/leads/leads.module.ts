import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ProjectsModule } from '../projects/projects.module';
import { LeadsController, PublicLeadsController, LeadsOAuthController } from './leads.controller';
import { LeadsService } from './leads.service';
import { FacebookLeadsService } from './facebook-leads.service';

@Module({
  imports: [ConfigModule, PrismaModule, IntegrationsModule, ProjectsModule],
  controllers: [LeadsController, PublicLeadsController, LeadsOAuthController],
  providers: [LeadsService, FacebookLeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
