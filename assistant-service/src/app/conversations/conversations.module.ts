import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { ChatModule } from '../chat/chat.module';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [PgModule, ChatModule, LeadCaptureModule],
  controllers: [ConversationsController],
  providers: [ConversationsRepository, ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
