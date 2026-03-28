export interface OpenAiModelPricing {
  inputPer1kUsd: number;
  outputPer1kUsd: number;
}

const OPENAI_MODEL_PRICING: Record<string, OpenAiModelPricing> = {
  'gpt-4.1-mini': {
    inputPer1kUsd: 0.0004,
    outputPer1kUsd: 0.0016,
  },
  'gpt-4.1': {
    inputPer1kUsd: 0.002,
    outputPer1kUsd: 0.008,
  },
};

export function getOpenAiModelPricing(
  model: string,
): OpenAiModelPricing | null {
  return OPENAI_MODEL_PRICING[model] ?? null;
}

export function estimateOpenAiChatCostUsd(input: {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}): number | null {
  const pricing = getOpenAiModelPricing(input.model);

  if (!pricing) {
    return null;
  }

  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;

  const inputCost = (inputTokens / 1000) * pricing.inputPer1kUsd;
  const outputCost = (outputTokens / 1000) * pricing.outputPer1kUsd;

  return Number((inputCost + outputCost).toFixed(8));
}
