import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '../auth/auth.storage';
import { debug, debugError } from '../debug';

type TimedRequestConfig = InternalAxiosRequestConfig & {
  metadata?: {
    startedAt: number;
  };
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: false,
  validateStatus: (s) => (s >= 200 && s < 400) || s === 409,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  (config as TimedRequestConfig).metadata = {
    startedAt: Date.now(),
  };

  debug('http', 'request', {
    method: config.method?.toUpperCase(),
    url: config.url,
    params: config.params,
    hasToken: !!token,
  });

  return config;
});

http.interceptors.response.use(
  (res) => {
    const startedAt = (res.config as TimedRequestConfig).metadata?.startedAt;
    const durationMs = startedAt ? Date.now() - startedAt : undefined;

    debug('http', 'response', {
      method: res.config.method?.toUpperCase(),
      url: res.config.url,
      status: res.status,
      durationMs,
    });

    return res;
  },
  async (err) => {
    const original = err?.config as TimedRequestConfig | undefined;
    const startedAt = original?.metadata?.startedAt;
    const durationMs = startedAt ? Date.now() - startedAt : undefined;

    debugError('http', 'response-error', {
      method: original?.method?.toUpperCase(),
      url: original?.url,
      status: err?.response?.status,
      durationMs,
      message: err?.message,
      data: err?.response?.data,
    });

    const status = err?.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.skipAuthRefresh &&
      !String(original.url || '').includes('/auth/login') &&
      !String(original.url || '').includes('/auth/refresh')
    ) {
      original._retry = true;

      try {
        const { useAuthStore } = await import('../auth/auth.store');
        const auth = useAuthStore();

        auth.loadFromStorage();

        const refreshed = await auth.refreshAccessToken();
        if (!refreshed) {
          return Promise.reject(err);
        }

        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${auth.accessToken}`;

        return http(original);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  },
);
