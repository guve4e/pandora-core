import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  async createConversation(@Body() body: CreateConversationDto) {
    return this.conversations.createConversation({
      tenantSlug: body.tenantSlug,
      visitorId: body.visitorId,
      channel: body.channel,
    });
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.conversations.sendMessage(id, body.message);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    return this.conversations.getConversation(id);
  }
}
