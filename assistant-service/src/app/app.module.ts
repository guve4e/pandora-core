import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '@org/backend-logging';
import { PgModule } from '@org/backend-db';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule,
    PgModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
