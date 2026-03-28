import { OpenAI } from 'openai';
import type {
  AiExecutionResult,
  AiUsageContext,
  ChatMessageInput,
  ChatTextResult,
} from '../types/ai.types';
import { buildOpenAiTokenUsage } from '../utils/usage.utils';

export interface OpenAiChatClientOptions {
  apiKey: string;
  timeoutMs?: number;
}

export interface OpenAiTextGenerationInput {
  model: string;
  messages: ChatMessageInput[];
  temperature?: number;
  maxTokens?: number;
  context?: AiUsageContext;
}

export class OpenAiChatClient {
  private readonly client: OpenAI;

  constructor(private readonly options: OpenAiChatClientOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs ?? 20000,
    });
  }

  async generateText(
    input: OpenAiTextGenerationInput,
  ): Promise<AiExecutionResult<ChatTextResult>> {
    const startedAt = Date.now();

    const response = await this.client.chat.completions.create({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.1,
      max_tokens: input.maxTokens ?? 300,
    });

    const latencyMs = Date.now() - startedAt;

    const text =
      response.choices?.[0]?.message?.content?.trim() ??
      'I could not generate a valid answer.';

    const usage = buildOpenAiTokenUsage({
      model: input.model,
      promptTokens: response.usage?.prompt_tokens ?? null,
      completionTokens: response.usage?.completion_tokens ?? null,
      totalTokens: response.usage?.total_tokens ?? null,
    });

    return {
      data: {
        text,
      },
      usage,
      meta: {
        latencyMs,
        provider: 'openai',
        model: input.model,
      },
      context: input.context,
      raw: {
        id: response.id,
        finishReason: response.choices?.[0]?.finish_reason ?? null,
      },
    };
  }
}
