import type { AiTokenUsage } from '../types/ai.types';
import { estimateOpenAiChatCostUsd } from '../pricing/openai-pricing';

export function buildOpenAiTokenUsage(input: {
  model: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}): AiTokenUsage {
  const inputTokens = input.promptTokens ?? null;
  const outputTokens = input.completionTokens ?? null;
  const totalTokens =
    input.totalTokens ??
    (inputTokens !== null && outputTokens !== null
      ? inputTokens + outputTokens
      : null);

  const estimatedCostUsd = estimateOpenAiChatCostUsd({
    model: input.model,
    inputTokens,
    outputTokens,
  });

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd,
  };
}
