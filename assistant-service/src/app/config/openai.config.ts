export interface OpenAiConfig {
  apiKey: string | null;
  model: string;
  timeoutMs: number;
}

function parseTimeout(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid OPENAI_TIMEOUT_MS value: ${raw}`);
  }
  return value;
}

export function getOpenAiConfig(): OpenAiConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || null;

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini',
    timeoutMs: parseTimeout(process.env.OPENAI_TIMEOUT_MS, 20000),
  };
}
