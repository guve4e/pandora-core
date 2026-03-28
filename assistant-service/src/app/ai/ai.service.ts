import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import type {
  AssistantChatInput,
  AssistantChatResult,
  AssistantChatTurn,
  BusinessProfile,
} from './ai.types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { buildConversationAnalysisPrompt } from './analysis.prompts';
import { getOpenAiConfig } from '../config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly config = getOpenAiConfig();

  private readonly openai = new OpenAI({
    apiKey: this.config.apiKey ?? undefined,
    timeout: this.config.timeoutMs,
  });

  async chat(
    input: AssistantChatInput,
    profile: BusinessProfile,
  ): Promise<AssistantChatResult> {
    if (!this.config.apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is missing. Returning fallback response.',
      );
      return {
        reply:
          'The assistant is not configured yet because OPENAI_API_KEY is missing.',
      };
    }

    const systemPrompt = buildSystemPrompt(input.tenantSlug, profile);
    const userPrompt = buildUserPrompt(input.message, input.history ?? []);

    this.logger.log(
      `Calling OpenAI model=${this.config.model} tenant=${input.tenantSlug} timeoutMs=${this.config.timeoutMs}`,
    );

    try {
      const res = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
      });

      const reply =
        res.choices?.[0]?.message?.content?.trim() ||
        'I could not generate a valid answer.';

      return { reply };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`OpenAI chat failed: ${message}`);

      if (message.toLowerCase().includes('timeout')) {
        return {
          reply:
            'The assistant is taking too long to respond right now. Please try again in a moment.',
        };
      }

      return {
        reply:
          'There was a problem generating a response. Please try again shortly.',
      };
    }
  }

  async analyzeConversation(
    tenantSlug: string,
    history: AssistantChatTurn[],
  ): Promise<{
    summary: string;
    intent: string;
    city: string | null;
    serviceType: string | null;
    leadScore: number;
  }> {
    if (!this.config.apiKey) {
      this.logger.warn('OPENAI_API_KEY missing; skipping conversation analysis');
      return {
        summary: '',
        intent: '',
        city: null,
        serviceType: null,
        leadScore: 0,
      };
    }

    const prompt = buildConversationAnalysisPrompt(tenantSlug, history);

    const res = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'system', content: prompt }],
      temperature: 0,
      max_tokens: 200,
    });

    const text = res.choices?.[0]?.message?.content ?? '{}';

    try {
      return JSON.parse(text);
    } catch {
      return {
        summary: '',
        intent: '',
        city: null,
        serviceType: null,
        leadScore: 0,
      };
    }
  }
}
