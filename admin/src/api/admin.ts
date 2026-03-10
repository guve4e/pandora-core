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