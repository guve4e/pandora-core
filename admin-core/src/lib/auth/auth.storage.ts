const STORAGE_KEY = 'aiadvocate_auth';

type StoredAuth = {
  accessToken?: string | null;
  refreshToken?: string | null;
  username?: string | null;
  email?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  role?: string | null;
};

function read(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return read()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return read()?.refreshToken ?? null;
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
