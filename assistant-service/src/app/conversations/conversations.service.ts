import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { LeadCaptureService } from '../lead-capture/lead-capture.service';
import { TenantValidationService } from '../tenant-validation/tenant-validation.service';
import { ConversationsRepository } from './conversations.repository';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly repo: ConversationsRepository,
    private readonly chatService: ChatService,
    private readonly leadCapture: LeadCaptureService,
    private readonly tenantValidation: TenantValidationService,
  ) {}

  async createConversation(input: {
    tenantSlug: string;
    visitorId?: string;
    channel?: string;
  }) {
    await this.tenantValidation.validateTenantSlug(input.tenantSlug);

    return this.repo.createConversation(input);
  }

  async sendMessage(conversationId: string, message: string) {
    const conversation = await this.repo.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.repo.insertMessage({
      conversationId,
      role: 'user',
      messageText: message,
    });

    const historyRows = await this.repo.listMessages(conversationId);
    const history = historyRows.map((row) => ({
      role: row.role,
      text: row.message_text,
    }));

    const result = await this.chatService.chat({
      tenantSlug: conversation.tenant_slug,
      message,
      history,
    });

    const assistantMessage = await this.repo.insertMessage({
      conversationId,
      role: 'assistant',
      messageText: result.reply,
    });

    const finalRows = await this.repo.listMessages(conversationId);

    const captureResult = await this.leadCapture.tryCapture({
      tenantSlug: conversation.tenant_slug,
      conversationId,
      messages: finalRows.map((row) => ({
        role: row.role,
        text: row.message_text,
        created_at: row.created_at,
      })),
    });

    if (captureResult.leadId && conversation.lead_id !== captureResult.leadId) {
      await this.repo.setLeadId(conversationId, captureResult.leadId);
    }

    return {
      conversationId,
      reply: assistantMessage.message_text,
      leadId: captureResult.leadId ?? conversation.lead_id ?? null,
    };
  }

  async getConversation(conversationId: string) {
    const conversation = await this.repo.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.repo.listMessages(conversationId);

    return {
      conversation,
      messages,
    };
  }
}
