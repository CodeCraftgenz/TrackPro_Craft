import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, EncryptionService],
  exports: [IntegrationsService, EncryptionService],
})
export class IntegrationsModule {}
