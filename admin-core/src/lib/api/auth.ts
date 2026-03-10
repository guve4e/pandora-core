import { http } from './http';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface MeResponse {
  id: string;
  tenant_id: string;
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

export async function meRequest(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/auth/me');
  return data;
}

export async function logoutRequest(): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>('/auth/logout');
  return data;
}
