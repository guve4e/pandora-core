import { Global, Module } from '@nestjs/common';
import { LokiLoggerService } from './loki-logger.service.js';

@Global()
@Module({
  providers: [
    {
      provide: 'JOB_NAME',
      useValue: process.env.JOB_NAME || 'pandora-core',
    },
    {
      provide: 'APP_NAME',
      useValue: process.env.APP_NAME || 'api',
    },
    {
      provide: 'LOKI_HOST',
      useValue: process.env.LOKI_HOST || '',
    },
    LokiLoggerService,
    {
      provide: 'LOGGER_SERVICE',
      useExisting: LokiLoggerService,
    },
  ],
  exports: [
    'LOGGER_SERVICE',
    LokiLoggerService,
    'JOB_NAME',
    'APP_NAME',
    'LOKI_HOST',
  ],
})
export class LoggingModule {}
