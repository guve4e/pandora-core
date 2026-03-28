import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AssistantConfigModule } from '../assistant-config/assistant-config.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AiModule, AssistantConfigModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
