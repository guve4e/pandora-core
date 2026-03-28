import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { AiModule } from '../ai/ai.module';
import { ChatModule } from '../chat/chat.module';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';
import { TenantValidationModule } from '../tenant-validation/tenant-validation.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [
    PgModule,
    AiModule,
    ChatModule,
    LeadCaptureModule,
    TenantValidationModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsRepository, ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
