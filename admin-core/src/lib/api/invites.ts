import { http } from './http';

export interface InviteCreateResponse {
  invite_url: string;
}

export async function createTenantInvite(
  tenantSlug: string,
  payload: { email: string; role?: string },
) {
  const { data } = await http.post(
    `/admin/platform/tenants/${tenantSlug}/invites`,
    payload,
  );
  return data as InviteCreateResponse;
}

export async function validateInvite(token: string) {
  const { data } = await http.post('/auth/invites/validate', { token });
  return data;
}

export async function acceptInvite(payload: {
  token: string;
  password: string;
}) {
  const { data } = await http.post('/auth/invites/accept', payload);
  return data;
}
