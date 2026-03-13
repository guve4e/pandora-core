import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { AssistantChatInput } from '../ai/ai.types';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: AssistantChatInput) {
    return this.chatService.chat(body);
  }
}
