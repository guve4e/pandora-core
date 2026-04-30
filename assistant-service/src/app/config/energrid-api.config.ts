export interface EnergridApiConfig {
  baseUrl: string;
}

function normalizeBaseUrl(raw: string | undefined): string {
  const value = (raw ?? 'http://localhost:3020/core').trim();
  if (!value) {
    throw new Error('ENERGRID_CORE_BASE_URL cannot be empty');
  }
  return value.replace(/\/+$/, '');
}

export function getEnergridApiConfig(): EnergridApiConfig {
  return {
    baseUrl: normalizeBaseUrl(process.env.ENERGRID_CORE_BASE_URL),
  };
}
