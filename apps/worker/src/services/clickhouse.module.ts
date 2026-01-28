import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ClickHouseService } from './clickhouse.service';

@Global()
@Module({
  providers: [
    {
      provide: ClickHouseService,
      useFactory: (configService: ConfigService) => {
        return new ClickHouseService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
