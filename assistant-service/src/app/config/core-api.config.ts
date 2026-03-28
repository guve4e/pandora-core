export interface CoreApiConfig {
  baseUrl: string;
  internalToken: string;
}

function normalizeBaseUrl(raw: string | undefined): string {
  const value = (raw ?? 'http://localhost:3001/api').trim();
  if (!value) {
    throw new Error('CORE_API_BASE_URL cannot be empty');
  }
  return value.replace(/\/+$/, '');
}

export function getCoreApiConfig(): CoreApiConfig {
  return {
    baseUrl: normalizeBaseUrl(process.env.CORE_API_BASE_URL),
    internalToken: process.env.INTERNAL_API_TOKEN?.trim() || '',
  };
}
