import { http } from '@org/admin-core';

export interface AiUsageFeatureRow {
  feature: string;
  calls: number;
  totalTokens: number;
  totalCostUsd: number;
}

export interface AiUsageSummaryResponse {
  totals: {
    todayCostUsd: number;
    monthCostUsd: number;
    totalCalls: number;
    totalTokens: number;
  };
  byFeature: AiUsageFeatureRow[];
}

export interface AiUsageTenantRow {
  tenantSlug: string;
  calls: number;
  totalTokens: number;
  totalCostUsd: number;
  todayCostUsd: number;
  monthCostUsd: number;
}

export interface AiUsageDailyTrendRow {
  day: string;
  feature: string;
  calls: number;
  totalTokens: number;
  totalCostUsd: number;
}

export interface AiUsageConversationRow {
  conversationId: string | null;
  calls: number;
  totalTokens: number;
  totalCostUsd: number;
}

export interface AiUsageTenantDetailResponse {
  tenantSlug: string;
  totals: {
    calls: number;
    totalTokens: number;
    totalCostUsd: number;
    todayCostUsd: number;
    monthCostUsd: number;
  };
  byFeature: AiUsageFeatureRow[];
  dailyTrend: AiUsageDailyTrendRow[];
  topConversations: AiUsageConversationRow[];
}

export async function getAiUsageSummary(): Promise<AiUsageSummaryResponse> {
  const { data } = await http.get<AiUsageSummaryResponse>(
    '/admin/platform/ai-usage/summary',
  );
  return data;
}

export async function getAiUsageTenants(): Promise<AiUsageTenantRow[]> {
  const { data } = await http.get<AiUsageTenantRow[]>(
    '/admin/platform/ai-usage/tenants',
  );
  return data;
}

export async function getAiUsageTenantDetail(
  tenantSlug: string,
): Promise<AiUsageTenantDetailResponse> {
  const { data } = await http.get<AiUsageTenantDetailResponse>(
    `/admin/platform/ai-usage/tenants/${encodeURIComponent(tenantSlug)}`,
  );
  return data;
}
