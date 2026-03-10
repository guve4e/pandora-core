import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { AiUsageRepository } from './ai-usage.repository';
import { PgModule } from '../db/pg.module';

@Module({
  imports: [PgModule],
  providers: [AiService, AiUsageService, AiUsageRepository],
  exports: [AiService, AiUsageService],
})
export class AiModule {}
