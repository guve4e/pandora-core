export interface AppConfig {
  port: number;
  corsOrigins: string[];
  globalPrefix: string;
}

function parsePort(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return value;
}

function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getAppConfig(): AppConfig {
  return {
    port: parsePort(process.env.PORT, 3010),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    globalPrefix: 'assistant',
  };
}
