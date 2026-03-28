export interface AssistantGuardConfig {
  dailyTenantAiBudgetUsd: number;
  hardBlockWhenExceeded: boolean;
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid numeric config value: ${raw}`);
  }
  return value;
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw === '') {
    return fallback;
  }

  const value = raw.trim().toLowerCase();

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`Invalid boolean config value: ${raw}`);
}

export function getAssistantGuardConfig(): AssistantGuardConfig {
  return {
    dailyTenantAiBudgetUsd: parseNumber(
      process.env.ASSISTANT_DAILY_TENANT_AI_BUDGET_USD,
      0.01,
    ),
    hardBlockWhenExceeded: parseBoolean(
      process.env.ASSISTANT_HARD_BLOCK_WHEN_BUDGET_EXCEEDED,
      false,
    ),
  };
}
