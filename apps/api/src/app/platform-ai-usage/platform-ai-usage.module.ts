import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { PlatformAiUsageController } from './platform-ai-usage.controller';
import { PlatformAiUsageRepository } from './platform-ai-usage.repository';
import { PlatformAiUsageService } from './platform-ai-usage.service';

@Module({
  imports: [PgModule],
  controllers: [PlatformAiUsageController],
  providers: [PlatformAiUsageRepository, PlatformAiUsageService],
  exports: [PlatformAiUsageService],
})
export class PlatformAiUsageModule {}
