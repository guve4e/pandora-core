import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import type {
  AssistantChatInput,
  AssistantChatResult,
  BusinessProfile,
} from './ai.types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  private readonly timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 20000);

  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: this.timeoutMs,
  });

  async chat(
    input: AssistantChatInput,
    profile: BusinessProfile,
  ): Promise<AssistantChatResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is missing. Returning fallback response.');
      return {
        reply:
          'The assistant is not configured yet because OPENAI_API_KEY is missing.',
      };
    }

    const systemPrompt = buildSystemPrompt(input.tenantSlug, profile);
    const userPrompt = buildUserPrompt(input.message, input.history ?? []);

    this.logger.log(
      `Calling OpenAI model=${this.model} tenant=${input.tenantSlug} timeoutMs=${this.timeoutMs}`,
    );

    try {
      const res = await this.openai.chat.completions.create({
        model: this.model,
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
      const message =
        error instanceof Error ? error.message : String(error);

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
}
