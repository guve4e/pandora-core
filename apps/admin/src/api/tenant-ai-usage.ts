import { http } from '@org/admin-core';

export interface TenantAiUsageFeatureRow {
  feature: string;
  calls: number;
  totalTokens: number;
  totalCostUsd: number;
}

export interface TenantAiUsageDailyRow {
  day: string;
  feature: string;
  calls: number;
  totalTokens: number;
  totalCostUsd: number;
}

export interface TenantAiUsageSummaryResponse {
  tenantSlug: string;
  totals: {
    todayCostUsd: number;
    monthCostUsd: number;
    totalCalls: number;
    totalTokens: number;
  };
  byFeature: TenantAiUsageFeatureRow[];
  dailyTrend: TenantAiUsageDailyRow[];
}

export async function getTenantAiUsageSummary(): Promise<TenantAiUsageSummaryResponse> {
  const { data } = await http.get<TenantAiUsageSummaryResponse>(
    '/tenant/ai-usage/summary',
  );
  return data;
}
