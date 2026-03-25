import { http } from '@org/admin-core';

export interface VisitorsSummary {
  visitors: number;
  sessions: number;
  pageViews: number;
  conversions: number;
}

export interface VisitorItem {
  visitorId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sessions: number;
  pageViews: number;
  conversions: number;
  latestPage: string | null;
  latestIp: string | null;
  latestUserAgent: string | null;
}

export interface VisitorsResponse {
  summary: VisitorsSummary;
  items: VisitorItem[];
}

export interface DailyTrafficRow {
  day: string;
  pageViews: number;
  uniqueVisitors: number;
}

export async function getVisitors(): Promise<VisitorsResponse> {
  const { data } = await http.get<VisitorsResponse>('/analytics/visitors');
  return data;
}

export async function getDailyTraffic(
  params: { days?: number } = {},
): Promise<DailyTrafficRow[]> {
  const { data } = await http.get<DailyTrafficRow[]>('/analytics/daily', {
    params,
  });
  return data;
}
