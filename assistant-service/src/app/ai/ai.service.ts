import { Injectable, Logger } from '@nestjs/common';
import {
  OpenAiChatClient,
  type ChatMessageInput,
} from '@org/backend-ai';
import type {
  AssistantChatInput,
  AssistantChatResult,
  AssistantChatTurn,
  BusinessProfile,
  ConversationAnalysisResult,
} from './ai.types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { buildConversationAnalysisPrompt } from './analysis.prompts';
import { getOpenAiConfig } from '../config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly config = getOpenAiConfig();

  private readonly chatClient = this.config.apiKey
    ? new OpenAiChatClient({
        apiKey: this.config.apiKey,
        timeoutMs: this.config.timeoutMs,
      })
    : null;

  async chat(
    input: AssistantChatInput,
    profile: BusinessProfile,
  ): Promise<AssistantChatResult> {
    if (!this.config.apiKey || !this.chatClient) {
      this.logger.warn(
        'OPENAI_API_KEY is missing. Returning fallback response.',
      );
      return {
        reply:
          'The assistant is not configured yet because OPENAI_API_KEY is missing.',
        model: null,
        tokensInput: null,
        tokensOutput: null,
        meta: {
          provider: 'openai',
          configured: false,
        },
      };
    }

    const systemPrompt = buildSystemPrompt(input.tenantSlug, profile);
    const userPrompt = buildUserPrompt(input.message, input.history ?? []);

    this.logger.log(
      `Calling OpenAI model=${this.config.model} tenant=${input.tenantSlug} timeoutMs=${this.config.timeoutMs}`,
    );

    try {
      const result = await this.chatClient.generateText({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        maxTokens: 300,
        context: {
          app: 'assistant',
          feature: 'chat_reply',
          tenantSlug: input.tenantSlug,
        },
      });

      return {
        reply: result.data.text,
        model: result.meta.model,
        tokensInput: result.usage.inputTokens,
        tokensOutput: result.usage.outputTokens,
        meta: {
          provider: result.meta.provider,
          latencyMs: result.meta.latencyMs,
          estimatedCostUsd: result.usage.estimatedCostUsd,
          totalTokens: result.usage.totalTokens,
          raw: result.raw ?? null,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`OpenAI chat failed: ${message}`);

      if (message.toLowerCase().includes('timeout')) {
        return {
          reply:
            'The assistant is taking too long to respond right now. Please try again in a moment.',
          model: this.config.model,
          tokensInput: null,
          tokensOutput: null,
          meta: {
            provider: 'openai',
            timeout: true,
          },
        };
      }

      return {
        reply:
          'There was a problem generating a response. Please try again shortly.',
        model: this.config.model,
        tokensInput: null,
        tokensOutput: null,
        meta: {
          provider: 'openai',
          error: true,
        },
      };
    }
  }

  async analyzeConversation(
    tenantSlug: string,
    history: AssistantChatTurn[],
  ): Promise<ConversationAnalysisResult> {
    if (!this.config.apiKey || !this.chatClient) {
      this.logger.warn('OPENAI_API_KEY missing; skipping conversation analysis');
      return {
        summary: '',
        intent: '',
        city: null,
        serviceType: null,
        leadScore: 0,
        model: null,
        tokensInput: null,
        tokensOutput: null,
        meta: {
          provider: 'openai',
          configured: false,
        },
      };
    }

    const prompt = buildConversationAnalysisPrompt(tenantSlug, history);

    try {
      const result = await this.chatClient.generateText({
        model: this.config.model,
        messages: [{ role: 'system', content: prompt } satisfies ChatMessageInput],
        temperature: 0,
        maxTokens: 200,
        context: {
          app: 'assistant',
          feature: 'conversation_analysis',
          tenantSlug,
        },
      });

      let parsed: {
        summary?: string;
        intent?: string;
        city?: string | null;
        serviceType?: string | null;
        leadScore?: number;
      } = {};

      try {
        parsed = JSON.parse(result.data.text);
      } catch {
        parsed = {};
      }

      return {
        summary: parsed.summary ?? '',
        intent: parsed.intent ?? '',
        city: parsed.city ?? null,
        serviceType: parsed.serviceType ?? null,
        leadScore: Number.isFinite(parsed.leadScore) ? Number(parsed.leadScore) : 0,
        model: result.meta.model,
        tokensInput: result.usage.inputTokens,
        tokensOutput: result.usage.outputTokens,
        meta: {
          provider: result.meta.provider,
          latencyMs: result.meta.latencyMs,
          estimatedCostUsd: result.usage.estimatedCostUsd,
          totalTokens: result.usage.totalTokens,
          raw: result.raw ?? null,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Conversation analysis failed: ${message}`);

      return {
        summary: '',
        intent: '',
        city: null,
        serviceType: null,
        leadScore: 0,
        model: this.config.model,
        tokensInput: null,
        tokensOutput: null,
        meta: {
          provider: 'openai',
          error: true,
        },
      };
    }
  }
}
