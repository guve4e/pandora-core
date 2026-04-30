import { http } from '@org/admin-core';

export interface VisitorsSummary {
  visitors: number;
  sessions: number;
  pageViews: number;
  conversions: number;
  avgPagesPerSession?: number;
  returningVisitors?: number;
  bounceRate?: number;
}

export interface VisitorGeo {
  country: string | null;
  region: string | null;
  city: string | null;
  org: string | null;
  timezone: string | null;
  isVpn: boolean | null;
  isProxy: boolean | null;
  trafficType?: string | null;
  trafficScore?: number | null;
  trafficReason?: string | null;
}

export interface VisitorItem {
  visitorId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sessions: number;
  pageViews: number;
  conversions: number;
  intentEvents?: number;
  landingPage?: string | null;
  latestPage: string | null;
  latestIp: string | null;
  latestUserAgent: string | null;
  latestReferrer?: string | null;
  geo?: VisitorGeo;
}

export interface VisitorsResponse {
  summary: VisitorsSummary;
  acquisition?: {
    topReferrers: Array<{ referrer: string; visits: number }>;
  };
  behavior?: {
    topPages: Array<{ pagePath: string; views: number }>;
  };
  businessIntent?: {
    topEvents: Array<{ name: string; count: number }>;
  };
  items: VisitorItem[];
}

export interface VisitorEvent {
  id: string;
  type: string;
  name: string | null;
  pageUrl: string | null;
  pagePath: string | null;
  referrer: string | null;
  elementId: string | null;
  elementText: string | null;
  occurredAt: string;
  properties: Record<string, unknown>;
}

export interface VisitorSession {
  sessionId: string;
  sessionKey: string;
  startedAt: string;
  endedAt: string | null;
  landingPage: string | null;
  referrer: string | null;
  pageViews: number;
  intentEvents: number;
  firstEventAt: string | null;
  lastEventAt: string | null;
  events: VisitorEvent[];
}

export interface VisitorDetailResponse {
  visitor: VisitorItem & {
    anonymousId: string;
  };
  sessions: VisitorSession[];
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

export async function getVisitorDetail(
  visitorId: string,
): Promise<VisitorDetailResponse | null> {
  const { data } = await http.get<VisitorDetailResponse | null>(
    `/analytics/visitors/${visitorId}`,
  );
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

export async function markVisitorInternal(
  visitorId: string,
  isInternal = true,
): Promise<{
  success: true;
  visitorId: string;
  isInternal: boolean;
  updatedEvents: number;
}> {
  const { data } = await http.patch(
    `/analytics/visitors/${visitorId}/internal`,
    {
      isInternal,
    },
  );
  return data;
}