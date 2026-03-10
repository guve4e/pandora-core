import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { IntakeExtractorService } from './intake-extractor.service';
import { AiModule } from '../../core/ai/ai.module';
import { LeadsModule } from '../leads/leads.module';
import { NotificationsModule } from '../../core/notifications/notifications.module';
import { PgModule } from '../../core/db/pg.module';

@Module({
  imports: [PgModule, AiModule, LeadsModule, NotificationsModule],
  controllers: [IntakeController],
  providers: [IntakeService, IntakeExtractorService],
})
export class IntakeModule {}
