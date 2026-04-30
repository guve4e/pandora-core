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

export interface AssistantEstimatorContext {
  enabled: boolean;
  stage?: string | null;
  hasDraft: boolean;
  lastPreview?: {
    subtotal?: number;
    confidence?: string;
    needsInspection?: boolean;
    linesCount?: number;
  } | null;
}

export interface AssistantRoutingInput extends AssistantChatInput {
  estimatorContext?: AssistantEstimatorContext;
}

export type AssistantRoutingResult =
  | {
      type: 'assistant_reply';
      reply: string;
      model: string | null;
      tokensInput: number | null;
      tokensOutput: number | null;
      meta?: Record<string, unknown>;
    }
  | {
      type: 'call_estimator';
      toolInput: {
        message: string;
      };
      model: string | null;
      tokensInput: number | null;
      tokensOutput: number | null;
      meta?: Record<string, unknown>;
    };

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

  async chatWithRouting(
    input: AssistantRoutingInput,
    profile: BusinessProfile,
  ): Promise<AssistantRoutingResult> {
    if (!this.config.apiKey || !this.chatClient) {
      this.logger.warn(
        'OPENAI_API_KEY is missing. Returning fallback routed response.',
      );
      return {
        type: 'assistant_reply',
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

    const systemPrompt = this.buildRoutingSystemPrompt(input.tenantSlug, profile);
    const userPrompt = this.buildRoutingUserPrompt(input);

    this.logger.log(
      `Calling OpenAI routing model=${this.config.model} tenant=${input.tenantSlug} timeoutMs=${this.config.timeoutMs}`,
    );

    try {
      const result = await this.chatClient.generateText({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0,
        maxTokens: 350,
        context: {
          app: 'assistant',
          feature: 'chat_routing',
          tenantSlug: input.tenantSlug,
        },
      });

      const parsed = this.tryParseRoutingJson(result.data.text);

      if (parsed?.action === 'call_estimator') {
        return {
          type: 'call_estimator',
          toolInput: {
            message: input.message,
          },
          model: result.meta.model,
          tokensInput: result.usage.inputTokens,
          tokensOutput: result.usage.outputTokens,
          meta: {
            provider: result.meta.provider,
            latencyMs: result.meta.latencyMs,
            estimatedCostUsd: result.usage.estimatedCostUsd,
            totalTokens: result.usage.totalTokens,
            raw: result.raw ?? null,
            routingAction: 'call_estimator',
            estimatorMessageSource: 'raw_user_message',
          },
        };
      }

      return {
        type: 'assistant_reply',
        reply:
          typeof parsed?.reply === 'string' && parsed.reply.trim().length > 0
            ? parsed.reply
            : result.data.text,
        model: result.meta.model,
        tokensInput: result.usage.inputTokens,
        tokensOutput: result.usage.outputTokens,
        meta: {
          provider: result.meta.provider,
          latencyMs: result.meta.latencyMs,
          estimatedCostUsd: result.usage.estimatedCostUsd,
          totalTokens: result.usage.totalTokens,
          raw: result.raw ?? null,
          routingAction: 'assistant_reply',
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`OpenAI routed chat failed: ${message}`);

      if (message.toLowerCase().includes('timeout')) {
        return {
          type: 'assistant_reply',
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
        type: 'assistant_reply',
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

  private buildRoutingSystemPrompt(
    tenantSlug: string,
    profile: BusinessProfile,
  ): string {
    const basePrompt = buildSystemPrompt(tenantSlug, profile);

    return [
      basePrompt,
      '',
      'You are also the routing layer for the assistant.',
      'Decide whether the next action should be a normal assistant reply or a call to the estimator tool.',
      '',
      'Return JSON only with one of these shapes:',
      '{"action":"assistant_reply","reply":"..."}',
      '{"action":"call_estimator","toolInput":{"message":""}}',
      '',
      'Use call_estimator when the user:',
      '- asks for a new estimate',
      '- adds or changes scope of an existing estimate',
      '- asks to explain an existing estimate',
      '',
      'Use assistant_reply for general business questions or any non-estimator topic.',
      'If there is an existing estimator draft, do not assume every follow-up belongs to the estimator.',
      'Do not invent prices yourself. Use the estimator tool for all estimate-related work.',
      'Do not rewrite, summarize, expand, or translate the user message for estimator calls.',
      'The estimator receives the raw user message from the application layer, not from your toolInput.message.',
    ].join('\n');
  }

  private buildRoutingUserPrompt(input: AssistantRoutingInput): string {
    const historyPrompt = buildUserPrompt(input.message, input.history ?? []);

    const estimatorContext = JSON.stringify(input.estimatorContext ?? null, null, 2);

    return [
      historyPrompt,
      '',
      'Estimator context:',
      estimatorContext,
      '',
      'Respond with JSON only.',
    ].join('\n');
  }

  private tryParseRoutingJson(rawText: string):
    | {
        action?: string;
        reply?: string;
        toolInput?: { message?: string };
      }
    | null {
    const trimmed = rawText.trim();

    try {
      return JSON.parse(trimmed) as {
        action?: string;
        reply?: string;
        toolInput?: { message?: string };
      };
    } catch {
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
      }

      const candidate = trimmed.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(candidate) as {
          action?: string;
          reply?: string;
          toolInput?: { message?: string };
        };
      } catch {
        return null;
      }
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
