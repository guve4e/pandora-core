import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { LeadCaptureService } from '../lead-capture/lead-capture.service';
import { TenantValidationService } from '../tenant-validation/tenant-validation.service';
import { ConversationsRepository } from './conversations.repository';
import { AiService } from '../ai/ai.service';
import { AiUsageRepository } from './ai-usage.repository';
import { getAssistantGuardConfig } from '../config';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  private readonly guardConfig = getAssistantGuardConfig();

  constructor(
    private readonly repo: ConversationsRepository,
    private readonly chatService: ChatService,
    private readonly leadCapture: LeadCaptureService,
    private readonly tenantValidation: TenantValidationService,
    private readonly aiService: AiService,
    private readonly aiUsageRepo: AiUsageRepository,
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

    const todayUsage = await this.aiUsageRepo.getTodayUsage(
      conversation.tenant_slug,
    );

    if (
      todayUsage.totalCostUsd >= this.guardConfig.dailyTenantAiBudgetUsd
    ) {
      this.logger.warn(
        `Tenant ${conversation.tenant_slug} exceeded daily AI budget: costUsd=${todayUsage.totalCostUsd.toFixed(6)} budgetUsd=${this.guardConfig.dailyTenantAiBudgetUsd.toFixed(6)} calls=${todayUsage.calls} tokens=${todayUsage.totalTokens}`,
      );

      if (this.guardConfig.hardBlockWhenExceeded) {
        const budgetReply =
          'Временно сме достигнали лимита за обработка на запитвания за днес. Моля, опитайте отново по-късно или се свържете с нас директно.';

        const assistantMessage = await this.repo.insertMessage({
          conversationId,
          role: 'assistant',
          messageText: budgetReply,
          model: null,
          tokensInput: null,
          tokensOutput: null,
          meta: {
            provider: 'system',
            budgetBlocked: true,
            tenantSlug: conversation.tenant_slug,
            dailyBudgetUsd: this.guardConfig.dailyTenantAiBudgetUsd,
            todayUsageUsd: todayUsage.totalCostUsd,
          },
        });

        return {
          conversationId,
          reply: assistantMessage.message_text,
          leadId: conversation.lead_id ?? null,
        };
      }
    }

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
      model: result.model,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      meta: result.meta ?? {},
    });

    if (result.model) {
      const meta = result.meta ?? {};
      const totalTokens =
        typeof meta.totalTokens === 'number' ? meta.totalTokens : null;
      const estimatedCostUsd =
        typeof meta.estimatedCostUsd === 'number'
          ? meta.estimatedCostUsd
          : null;
      const latencyMs =
        typeof meta.latencyMs === 'number' ? meta.latencyMs : null;
      const provider =
        typeof meta.provider === 'string' ? meta.provider : 'openai';

      await this.aiUsageRepo.insertUsage({
        provider,
        model: result.model,
        app: 'assistant',
        feature: 'chat_reply',
        tenantSlug: conversation.tenant_slug,
        conversationId,
        visitorId: conversation.visitor_id,
        inputTokens: result.tokensInput,
        outputTokens: result.tokensOutput,
        totalTokens,
        estimatedCostUsd,
        latencyMs,
        meta,
      });
    }

    const finalRows = await this.repo.listMessages(conversationId);
    const finalHistory = finalRows.map((row) => ({
      role: row.role,
      text: row.message_text,
    }));

    const shouldAnalyzeConversation = finalRows.length >= 4;

    if (shouldAnalyzeConversation) {
      try {
        const analysis = await this.aiService.analyzeConversation(
          conversation.tenant_slug,
          finalHistory,
        );

        await this.repo.updateAnalysis(conversationId, analysis);

        if (analysis.model) {
          const meta = analysis.meta ?? {};
          const totalTokens =
            typeof meta.totalTokens === 'number' ? meta.totalTokens : null;
          const estimatedCostUsd =
            typeof meta.estimatedCostUsd === 'number'
              ? meta.estimatedCostUsd
              : null;
          const latencyMs =
            typeof meta.latencyMs === 'number' ? meta.latencyMs : null;
          const provider =
            typeof meta.provider === 'string' ? meta.provider : 'openai';

          await this.aiUsageRepo.insertUsage({
            provider,
            model: analysis.model,
            app: 'assistant',
            feature: 'conversation_analysis',
            tenantSlug: conversation.tenant_slug,
            conversationId,
            visitorId: conversation.visitor_id,
            inputTokens: analysis.tokensInput,
            outputTokens: analysis.tokensOutput,
            totalTokens,
            estimatedCostUsd,
            latencyMs,
            meta,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Conversation analysis skipped for ${conversationId}: ${errorMessage}`,
        );
      }
    }

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

      if (captureResult.usage?.model) {
        const meta = captureResult.usage.meta ?? {};
        const totalTokens =
          typeof meta.totalTokens === 'number' ? meta.totalTokens : null;
        const estimatedCostUsd =
          typeof meta.estimatedCostUsd === 'number'
            ? meta.estimatedCostUsd
            : null;
        const latencyMs =
          typeof meta.latencyMs === 'number' ? meta.latencyMs : null;
        const provider =
          typeof meta.provider === 'string' ? meta.provider : 'openai';

        await this.aiUsageRepo.insertUsage({
          provider,
          model: captureResult.usage.model,
          app: 'assistant',
          feature: 'lead_extraction',
          tenantSlug: conversation.tenant_slug,
          conversationId,
          visitorId: conversation.visitor_id,
          inputTokens: captureResult.usage.tokensInput,
          outputTokens: captureResult.usage.tokensOutput,
          totalTokens,
          estimatedCostUsd,
          latencyMs,
          meta,
        });
      }

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
