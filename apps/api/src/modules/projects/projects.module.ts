import { Module } from '@nestjs/common';

import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ApiKeysService } from './api-keys.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ApiKeysService],
  exports: [ProjectsService, ApiKeysService],
})
export class ProjectsModule {}
