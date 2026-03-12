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

function write(data: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStoredAuth(): StoredAuth | null {
  return read();
}

export function getAccessToken(): string | null {
  return read()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return read()?.refreshToken ?? null;
}

export function setAccessToken(accessToken: string | null) {
  const current = read() ?? {};
  write({
    ...current,
    accessToken,
  });
}

export function setStoredTokens(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  const current = read() ?? {};
  write({
    ...current,
    accessToken:
      input.accessToken === undefined ? current.accessToken ?? null : input.accessToken,
    refreshToken:
      input.refreshToken === undefined ? current.refreshToken ?? null : input.refreshToken,
  });
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
