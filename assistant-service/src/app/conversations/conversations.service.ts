import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { LeadCaptureService } from '../lead-capture/lead-capture.service';
import { TenantValidationService } from '../tenant-validation/tenant-validation.service';
import { ConversationsRepository } from './conversations.repository';
import { AiService } from '../ai/ai.service';
import { AiUsageRepository } from './ai-usage.repository';
import { getAssistantGuardConfig } from '../config';
import { AssistantConfigService } from '../assistant-config/assistant-config.service';
import { EstimatorOrchestratorService } from './estimator/estimator-orchestrator.service';


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
    private readonly estimatorOrchestrator: EstimatorOrchestratorService,
    private readonly assistantConfig: AssistantConfigService,
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

    const budgetBlockedReply = await this.checkDailyBudgetAndMaybeBlock({
      conversationId,
      tenantSlug: conversation.tenant_slug,
      leadId: conversation.lead_id ?? null,
    });

    if (budgetBlockedReply) {
      return budgetBlockedReply;
    }

    const historyRows = await this.repo.listMessages(conversationId);
    const history = historyRows.map((row) => ({
      role: row.role,
      text: row.message_text,
    }));

    const profile = await this.assistantConfig.getTenantProfile(
      conversation.tenant_slug,
    );

    const chatResult = await this.chatService.chat({
      tenantSlug: conversation.tenant_slug,
      message,
      history,
      conversationMeta: conversation.meta ?? {},
    });

    this.logger.log(
      `chat result type=${chatResult.type} conversation=${conversationId} message="${message}"`,
    );

    if (chatResult.type === 'call_estimator') {
      const estimatorReply = await this.runEstimatorTool({
        conversationId,
        tenantSlug: conversation.tenant_slug,
        message: chatResult.toolInput.message,
        conversationMeta: conversation.meta ?? {},
        leadId: conversation.lead_id ?? null,
        profile,
        model: chatResult.model,
        tokensInput: chatResult.tokensInput,
        tokensOutput: chatResult.tokensOutput,
        chatMeta: chatResult.meta ?? {},
      });

      await this.recordAiUsageIfPresent({
        tenantSlug: conversation.tenant_slug,
        conversationId,
        visitorId: conversation.visitor_id,
        app: 'assistant',
        feature: 'chat_routing_with_estimator',
        model: chatResult.model,
        tokensInput: chatResult.tokensInput,
        tokensOutput: chatResult.tokensOutput,
        meta: chatResult.meta ?? {},
      });

      return estimatorReply;
    }

    const assistantMessage = await this.repo.insertMessage({
      conversationId,
      role: 'assistant',
      messageText: chatResult.reply,
      model: chatResult.model,
      tokensInput: chatResult.tokensInput,
      tokensOutput: chatResult.tokensOutput,
      meta: chatResult.meta ?? {},
    });

    await this.recordAiUsageIfPresent({
      tenantSlug: conversation.tenant_slug,
      conversationId,
      visitorId: conversation.visitor_id,
      app: 'assistant',
      feature: 'chat_reply',
      model: chatResult.model,
      tokensInput: chatResult.tokensInput,
      tokensOutput: chatResult.tokensOutput,
      meta: chatResult.meta ?? {},
    });

    const finalRows = await this.repo.listMessages(conversationId);
    const finalHistory = finalRows.map((row) => ({
      role: row.role,
      text: row.message_text,
    }));

    if (finalRows.length >= 4) {
      await this.tryAnalyzeConversation({
        tenantSlug: conversation.tenant_slug,
        conversationId,
        visitorId: conversation.visitor_id,
        history: finalHistory,
      });
    }

    const leadId = await this.tryLeadCapture({
      tenantSlug: conversation.tenant_slug,
      conversationId,
      visitorId: conversation.visitor_id,
      existingLeadId: conversation.lead_id ?? null,
      historyRowsCount: historyRows.length,
      message,
      finalRows,
    });

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

  private async checkDailyBudgetAndMaybeBlock(input: {
    conversationId: string;
    tenantSlug: string;
    leadId: string | null;
  }): Promise<{
    conversationId: string;
    reply: string;
    leadId: string | null;
  } | null> {
    const todayUsage = await this.aiUsageRepo.getTodayUsage(input.tenantSlug);

    if (todayUsage.totalCostUsd < this.guardConfig.dailyTenantAiBudgetUsd) {
      return null;
    }

    this.logger.warn(
      `Tenant ${input.tenantSlug} exceeded daily AI budget: costUsd=${todayUsage.totalCostUsd.toFixed(6)} budgetUsd=${this.guardConfig.dailyTenantAiBudgetUsd.toFixed(6)} calls=${todayUsage.calls} tokens=${todayUsage.totalTokens}`,
    );

    if (!this.guardConfig.hardBlockWhenExceeded) {
      return null;
    }

    const budgetReply =
      'Временно сме достигнали лимита за обработка на запитвания за днес. Моля, опитайте отново по-късно или се свържете с нас директно.';

    const assistantMessage = await this.repo.insertMessage({
      conversationId: input.conversationId,
      role: 'assistant',
      messageText: budgetReply,
      model: null,
      tokensInput: null,
      tokensOutput: null,
      meta: {
        provider: 'system',
        budgetBlocked: true,
        tenantSlug: input.tenantSlug,
        dailyBudgetUsd: this.guardConfig.dailyTenantAiBudgetUsd,
        todayUsageUsd: todayUsage.totalCostUsd,
      },
    });

    return {
      conversationId: input.conversationId,
      reply: assistantMessage.message_text,
      leadId: input.leadId,
    };
  }

  private async runEstimatorTool(input: {
    conversationId: string;
    tenantSlug: string;
    message: string;
    conversationMeta: Record<string, unknown> | null;
    leadId: string | null;
    profile: Awaited<ReturnType<AssistantConfigService['getTenantProfile']>>;
    model: string | null;
    tokensInput: number | null;
    tokensOutput: number | null;
    chatMeta?: Record<string, unknown>;
  }): Promise<{
    conversationId: string;
    reply: string;
    leadId: string | null;
  } | null> {
    this.logger.log(
      `checking estimator branch for conversation=${input.conversationId}`,
    );

    const estimatorResult = await this.estimatorOrchestrator.runStep({
      tenantSlug: input.tenantSlug,
      message: input.message,
      conversationMeta: input.conversationMeta,
      profile: input.profile,
    });

    if (!estimatorResult.handled || !estimatorResult.reply) {
      return null;
    }

    this.logger.log('estimator branch handled message');

    if (estimatorResult.conversationMeta) {
      await this.repo.updateMeta(
        input.conversationId,
        estimatorResult.conversationMeta,
      );
    }

    const assistantMessage = await this.repo.insertMessage({
      conversationId: input.conversationId,
      role: 'assistant',
      messageText: estimatorResult.reply,
      model: input.model,
      tokensInput: input.tokensInput,
      tokensOutput: input.tokensOutput,
      meta: {
        ...(input.chatMeta ?? {}),
        ...(estimatorResult.assistantMeta ?? {}),
      },
    });

    return {
      conversationId: input.conversationId,
      reply: assistantMessage.message_text,
      leadId: input.leadId,
    };
  }

  private async tryAnalyzeConversation(input: {
    tenantSlug: string;
    conversationId: string;
    visitorId?: string | null;
    history: Array<{ role: string; text: string }>;
  }): Promise<void> {
    try {
      const analysis = await this.aiService.analyzeConversation(
        input.tenantSlug,
        input.history,
      );

      await this.repo.updateAnalysis(input.conversationId, analysis);

      await this.recordAiUsageIfPresent({
        tenantSlug: input.tenantSlug,
        conversationId: input.conversationId,
        visitorId: input.visitorId ?? null,
        app: 'assistant',
        feature: 'conversation_analysis',
        model: analysis.model,
        tokensInput: analysis.tokensInput,
        tokensOutput: analysis.tokensOutput,
        meta: analysis.meta ?? {},
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Conversation analysis skipped for ${input.conversationId}: ${errorMessage}`,
      );
    }
  }

  private async tryLeadCapture(input: {
    tenantSlug: string;
    conversationId: string;
    visitorId?: string | null;
    existingLeadId: string | null;
    historyRowsCount: number;
    message: string;
    finalRows: Array<{
      role: string;
      message_text: string;
      created_at: string;
    }>;
  }): Promise<string | null> {
    if (
      input.existingLeadId ||
      input.historyRowsCount < 2 ||
      !this.containsContactSignal(input.message)
    ) {
      return input.existingLeadId;
    }

    const captureResult = await this.leadCapture.tryCapture({
      tenantSlug: input.tenantSlug,
      conversationId: input.conversationId,
      messages: input.finalRows.map((row) => ({
        role: row.role,
        text: row.message_text,
        created_at: row.created_at,
      })),
    });

    await this.recordAiUsageIfPresent({
      tenantSlug: input.tenantSlug,
      conversationId: input.conversationId,
      visitorId: input.visitorId ?? null,
      app: 'assistant',
      feature: 'lead_extraction',
      model: captureResult.usage?.model ?? null,
      tokensInput: captureResult.usage?.tokensInput ?? null,
      tokensOutput: captureResult.usage?.tokensOutput ?? null,
      meta: captureResult.usage?.meta ?? {},
    });

    if (captureResult.leadId) {
      await this.repo.setLeadId(input.conversationId, captureResult.leadId);
      return captureResult.leadId;
    }

    return input.existingLeadId;
  }

  private async recordAiUsageIfPresent(input: {
    tenantSlug: string;
    conversationId: string;
    visitorId?: string | null;
    app: string;
    feature: string;
    model: string | null;
    tokensInput: number | null;
    tokensOutput: number | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    if (!input.model) {
      return;
    }

    const meta = input.meta ?? {};
    const totalTokens =
      typeof meta.totalTokens === 'number' ? meta.totalTokens : null;
    const estimatedCostUsd =
      typeof meta.estimatedCostUsd === 'number' ? meta.estimatedCostUsd : null;
    const latencyMs =
      typeof meta.latencyMs === 'number' ? meta.latencyMs : null;
    const provider =
      typeof meta.provider === 'string' ? meta.provider : 'openai';

    await this.aiUsageRepo.insertUsage({
      provider,
      model: input.model,
      app: input.app,
      feature: input.feature,
      tenantSlug: input.tenantSlug,
      conversationId: input.conversationId,
      visitorId: input.visitorId ?? null,
      inputTokens: input.tokensInput,
      outputTokens: input.tokensOutput,
      totalTokens,
      estimatedCostUsd,
      latencyMs,
      meta,
    });
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
