import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { LeadCaptureService } from '../lead-capture/lead-capture.service';
import { TenantValidationService } from '../tenant-validation/tenant-validation.service';
import { ConversationsRepository } from './conversations.repository';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly repo: ConversationsRepository,
    private readonly chatService: ChatService,
    private readonly leadCapture: LeadCaptureService,
    private readonly tenantValidation: TenantValidationService,
    private readonly aiService: AiService,
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
    const finalHistory = finalRows.map((row) => ({
      role: row.role,
      text: row.message_text,
    }));

    // --- Conversation analysis (gated)
    const shouldAnalyzeConversation =
      finalRows.length >= 4;

    if (shouldAnalyzeConversation) {
      try {
        const analysis = await this.aiService.analyzeConversation(
          conversation.tenant_slug,
          finalHistory,
        );

        await this.repo.updateAnalysis(conversationId, analysis);
      } catch {
        // swallow for now; analysis should not break reply path
      }
    }

    // --- Lead capture (gated)
    let leadId = conversation.lead_id ?? null;

    const shouldAttemptLeadCapture =
      !conversation.lead_id &&
      historyRows.length >= 2 &&
      this.containsContactSignal(message);

    if (shouldAttemptLeadCapture) {
      const captureResult = await this.leadCapture.tryCapture({
        tenantSlug: conversation.tenant_slug,
        conversationId,
        messages: finalRows.map((row) => ({
          role: row.role,
          text: row.message_text,
          created_at: row.created_at,
        })),
      });

      if (captureResult.leadId) {
        await this.repo.setLeadId(conversationId, captureResult.leadId);
        leadId = captureResult.leadId;
      }
    }

    return {
      conversationId,
      reply: assistantMessage.message_text,
      leadId,
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

  private containsContactSignal(message: string): boolean {
    const lower = message.toLowerCase();
    const phoneRegex = /(\+?\d[\d\s\-]{6,})/;

    return (
      phoneRegex.test(message) ||
      lower.includes('call me') ||
      lower.includes('phone') ||
      lower.includes('номер') ||
      lower.includes('обади') ||
      lower.includes('връзка') ||
      lower.includes('contact')
    );
  }
}
