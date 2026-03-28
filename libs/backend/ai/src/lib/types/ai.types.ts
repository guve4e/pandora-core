export type AiProvider = 'openai';

export interface AiUsageContext {
  app: string;
  feature: string;
  tenantSlug?: string;
  conversationId?: string;
  visitorId?: string;
}

export interface AiTokenUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
}

export interface AiExecutionMeta {
  latencyMs: number;
  provider: AiProvider;
  model: string;
}

export interface AiExecutionResult<T> {
  data: T;
  usage: AiTokenUsage;
  meta: AiExecutionMeta;
  context?: AiUsageContext;
  raw?: Record<string, unknown>;
}

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatTextResult {
  text: string;
}
