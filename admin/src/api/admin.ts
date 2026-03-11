// admin/src/api/admin.ts
import { http } from '@org/admin-core';

// --- AI Usage ---
export interface AiUsageDailyRow {
  day: string;
  callCount: number;
  totalTokens: number;
  totalCostUsd: number | null;
}

export interface AiUsageKindRow {
  kind: string;
  callCount: number;
  totalTokens: number;
  totalCostUsd: number | null;
}

export interface AiUsageTotals {
  lastNDays: number;
  totalCalls: number;
  totalTokens: number;
  totalCostUsd: number;
  avgTokensPerCall: number;
  avgCostPerCall: number;
}

export interface AiUsageOverview {
  totals: AiUsageTotals;
  daily: AiUsageDailyRow[];
  byKind: AiUsageKindRow[];
}

export async function getAiUsageOverview(params: {
  days?: number;
  from?: string;
  to?: string;
}): Promise<AiUsageOverview> {
  const res = await http.get<AiUsageOverview>('/admin/ai-usage/overview', {
    params,
  });
  return res.data;
}

export interface DailyTrafficRow {
  day: string;
  pageViews: number;
  uniqueVisitors: number;
}

export async function getDailyTraffic(
  params: { days?: number } = {},
): Promise<DailyTrafficRow[]> {
  const { data } = await http.get<DailyTrafficRow[]>('/admin/traffic/daily', {
    params,
  });
  return data;
}
// --- Platform Owner Debug Views ---
export interface PlatformTenantRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PlatformUserRow {
  id: string;
  email: string;
  username: string | null;
  role: string;
  tenant_id: string;
  tenant_slug: string | null;
  tenant_name: string | null;
  created_at: string;
}

export interface PlatformLeadRow {
  id: string;
  tenant_slug: string;
  name: string | null;
  phone: string;
  city: string | null;
  service_type: string | null;
  summary: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
}

export interface PlatformNotificationRow {
  id: string;
  tenant_id: string;
  tenant_slug: string | null;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  severity: string;
  entity_type: string | null;
  entity_id: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export async function getPlatformTenants(): Promise<PlatformTenantRow[]> {
  const { data } = await http.get<PlatformTenantRow[]>('/admin/platform/tenants');
  return data;
}

export async function getPlatformUsers(): Promise<PlatformUserRow[]> {
  const { data } = await http.get<PlatformUserRow[]>('/admin/platform/users');
  return data;
}

export async function getPlatformLeads(): Promise<PlatformLeadRow[]> {
  const { data } = await http.get<PlatformLeadRow[]>('/admin/platform/leads');
  return data;
}

export async function getPlatformNotifications(
  params: { limit?: number } = {},
): Promise<PlatformNotificationRow[]> {
  const { data } = await http.get<PlatformNotificationRow[]>(
    '/admin/platform/notifications',
    { params },
  );
  return data;
}

export async function getPlatformTenantBySlug(
  slug: string,
): Promise<PlatformTenantRow> {
  const { data } = await http.get<PlatformTenantRow>(`/admin/platform/tenants/${slug}`);
  return data;
}

export async function getPlatformTenantUsers(
  slug: string,
): Promise<PlatformUserRow[]> {
  const { data } = await http.get<PlatformUserRow[]>(
    `/admin/platform/tenants/${slug}/users`,
  );
  return data;
}

export async function getPlatformTenantLeads(
  slug: string,
): Promise<PlatformLeadRow[]> {
  const { data } = await http.get<PlatformLeadRow[]>(
    `/admin/platform/tenants/${slug}/leads`,
  );
  return data;
}

export async function getPlatformTenantNotifications(
  slug: string,
  params: { limit?: number } = {},
): Promise<PlatformNotificationRow[]> {
  const { data } = await http.get<PlatformNotificationRow[]>(
    `/admin/platform/tenants/${slug}/notifications`,
    { params },
  );
  return data;
}
