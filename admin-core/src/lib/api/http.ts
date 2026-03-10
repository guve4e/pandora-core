import axios from 'axios';
import { getAccessToken } from '../auth/auth.storage';
import { debug, debugError } from '../debug';

type TimedRequestConfig = {
  metadata?: {
    startedAt: number;
  };
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
  (err) => {
    const startedAt = err?.config?.metadata?.startedAt;
    const durationMs = startedAt ? Date.now() - startedAt : undefined;

    debugError('http', 'response-error', {
      method: err?.config?.method?.toUpperCase(),
      url: err?.config?.url,
      status: err?.response?.status,
      durationMs,
      message: err?.message,
      data: err?.response?.data,
    });

    // DO NOT clear tokens here.
    // A random 401 should not silently corrupt auth state.
    return Promise.reject(err);
  },
);
