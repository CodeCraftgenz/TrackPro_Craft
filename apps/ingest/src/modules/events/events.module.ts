import { Module } from '@nestjs/common';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SignatureService } from './signature.service';
import { ApiKeyModule } from '../../services/api-key.module';

@Module({
  imports: [ApiKeyModule],
  controllers: [EventsController],
  providers: [EventsService, SignatureService],
})
export class EventsModule {}
