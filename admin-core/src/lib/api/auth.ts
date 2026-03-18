import { http } from './http';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface TenantFeatures {
  assistant_enabled: boolean;
  lead_forms_enabled: boolean;
  analytics_enabled: boolean;
  conversations_enabled: boolean;
  visitors_enabled: boolean;
}

export interface MeResponse {
  id: string;
  tenant_id: string;
  tenant_slug: string | null;
  tenant_name: string | null;
  tenant_tier: string | null;
  tenant_features: TenantFeatures;
  username: string | null;
  email: string;
  role: string;
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function refreshRequest(payload: {
  refresh_token: string;
}): Promise<RefreshResponse> {
  const { data } = await http.post<RefreshResponse>('/auth/refresh', payload, {
    skipAuthRefresh: true as any,
  } as any);
  return data;
}

export async function meRequest(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/auth/me');
  return data;
}

export async function logoutRequest(): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>('/auth/logout');
  return data;
}
