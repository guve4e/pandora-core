import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../../db/pg.pool';

@Injectable()
export class VisitorsService {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async getVisitors(tenantId: string) {
    const summaryResult = await this.pool.query(
      `
      select
        count(distinct visitor_id) as visitors,
        count(distinct session_id) as sessions,
        count(*) filter (where event_type = 'page_view') as page_views,
        count(*) filter (where event_type = 'conversion') as conversions
      from analytics.tracking_events
      where tenant_id = $1
      `,
      [tenantId],
    );

    const itemsResult = await this.pool.query(
      `
      with visitor_stats as (
        select
          visitor_id,
          min(created_at) as first_seen_at,
          max(created_at) as last_seen_at,
          count(distinct session_id) as sessions,
          count(*) filter (where event_type = 'page_view') as page_views,
          count(*) filter (where event_type = 'conversion') as conversions,
          count(*) filter (
            where event_type in ('conversion', 'cta_click', 'lead_submitted', 'phone_click', 'estimator_opened', 'assistant_opened')
              or event_name in ('phone_click', 'estimator_opened', 'assistant_opened', 'lead_submitted')
          ) as intent_events
        from analytics.tracking_events
        where tenant_id = $1
        group by visitor_id
      ),
      last_events as (
        select distinct on (visitor_id)
          visitor_id,
          page_path,
          ip_address,
          user_agent,
          referrer
        from analytics.tracking_events
        where tenant_id = $1
        order by visitor_id, created_at desc
      )
      select
        v.visitor_id,
        v.first_seen_at,
        v.last_seen_at,
        v.sessions,
        v.page_views,
        v.conversions,
        v.intent_events,
        l.page_path as latest_page,
        l.ip_address as latest_ip,
        l.user_agent as latest_user_agent,
        l.referrer as latest_referrer,
        ip.country,
        ip.region,
        ip.city,
        ip.org,
        ip.timezone,
        ip.is_vpn,
        ip.is_proxy,
        ip.traffic_type,
        ip.traffic_score,
        ip.traffic_reason
      from visitor_stats v
      left join last_events l on l.visitor_id = v.visitor_id
      left join analytics.tracking_ip_enrichments ip on ip.ip_address = l.ip_address
      order by v.last_seen_at desc
      limit 100
      `,
      [tenantId],
    );

    return {
      summary: {
        visitors: Number(summaryResult.rows[0].visitors),
        sessions: Number(summaryResult.rows[0].sessions),
        pageViews: Number(summaryResult.rows[0].page_views),
        conversions: Number(summaryResult.rows[0].conversions),
      },
      items: itemsResult.rows.map((r) => ({
        visitorId: r.visitor_id,
        firstSeenAt: r.first_seen_at,
        lastSeenAt: r.last_seen_at,
        sessions: Number(r.sessions),
        pageViews: Number(r.page_views),
        conversions: Number(r.conversions),
        intentEvents: Number(r.intent_events),
        latestPage: r.latest_page,
        latestIp: r.latest_ip,
        latestUserAgent: r.latest_user_agent,
        latestReferrer: r.latest_referrer,
        geo: {
          country: r.country,
          region: r.region,
          city: r.city,
          org: r.org,
          timezone: r.timezone,
          isVpn: r.is_vpn,
          isProxy: r.is_proxy,
          trafficType: r.traffic_type,
          trafficScore: r.traffic_score,
          trafficReason: r.traffic_reason,
        },
      })),
    };
  }

  async getVisitorDetail(tenantId: string, visitorId: string) {
    const visitorResult = await this.pool.query(
      `
      with base as (
        select
          v.id,
          v.anonymous_id,
          v.first_seen_at,
          v.last_seen_at,
          v.latest_user_agent
        from analytics.tracking_visitors v
        where v.tenant_id = $1
          and v.id = $2
        limit 1
      ),
      last_event as (
        select distinct on (e.visitor_id)
          e.visitor_id,
          e.ip_address,
          e.referrer,
          e.page_path
        from analytics.tracking_events e
        where e.tenant_id = $1
          and e.visitor_id = $2
        order by e.visitor_id, e.created_at desc
      )
      select
        b.id,
        b.anonymous_id,
        b.first_seen_at,
        b.last_seen_at,
        b.latest_user_agent,
        le.ip_address as latest_ip,
        le.referrer as latest_referrer,
        le.page_path as latest_page,
        ip.country,
        ip.region,
        ip.city,
        ip.org,
        ip.timezone,
        ip.is_vpn,
        ip.is_proxy,
        ip.traffic_type,
        ip.traffic_score,
        ip.traffic_reason
      from base b
      left join last_event le on le.visitor_id = b.id
      left join analytics.tracking_ip_enrichments ip on ip.ip_address = le.ip_address
      `,
      [tenantId, visitorId],
    );

    const visitor = visitorResult.rows[0];

    if (!visitor) return null;

    const sessionsResult = await this.pool.query(
      `
      with session_rows as (
        select
          s.id,
          s.session_key,
          s.started_at,
          s.ended_at,
          s.landing_page,
          s.entry_referrer,
          count(e.id) filter (where e.event_type = 'page_view') as page_views,
          count(e.id) filter (
            where event_type in ('conversion', 'cta_click', 'lead_submitted', 'phone_click', 'estimator_opened', 'assistant_opened')
              or event_name in ('phone_click', 'estimator_opened', 'assistant_opened', 'lead_submitted')
          ) as intent_events,
          min(e.occurred_at) as first_event_at,
          max(e.occurred_at) as last_event_at
        from analytics.tracking_sessions s
        left join analytics.tracking_events e on e.session_id = s.id
        where s.tenant_id = $1
          and s.visitor_id = $2
        group by s.id
        order by coalesce(max(e.occurred_at), s.started_at) desc
      )
      select * from session_rows
      `,
      [tenantId, visitorId],
    );

    const eventsResult = await this.pool.query(
      `
      select
        id,
        session_id,
        event_type,
        event_name,
        page_url,
        page_path,
        referrer,
        element_id,
        element_text,
        occurred_at,
        properties
      from analytics.tracking_events
      where tenant_id = $1
        and visitor_id = $2
      order by occurred_at asc
      `,
      [tenantId, visitorId],
    );

    const eventsBySession = new Map<string, any[]>();

    for (const event of eventsResult.rows) {
      const list = eventsBySession.get(event.session_id) ?? [];
      list.push({
        id: event.id,
        type: event.event_type,
        name: event.event_name,
        pageUrl: event.page_url,
        pagePath: event.page_path,
        referrer: event.referrer,
        elementId: event.element_id,
        elementText: event.element_text,
        occurredAt: event.occurred_at,
        properties: event.properties ?? {},
      });
      eventsBySession.set(event.session_id, list);
    }

    return {
      visitor: {
        visitorId: visitor.id,
        anonymousId: visitor.anonymous_id,
        firstSeenAt: visitor.first_seen_at,
        lastSeenAt: visitor.last_seen_at,
        latestIp: visitor.latest_ip,
        latestPage: visitor.latest_page,
        latestReferrer: visitor.latest_referrer,
        latestUserAgent: visitor.latest_user_agent,
        geo: {
          country: visitor.country,
          region: visitor.region,
          city: visitor.city,
          org: visitor.org,
          timezone: visitor.timezone,
          isVpn: visitor.is_vpn,
          isProxy: visitor.is_proxy,
          trafficType: visitor.traffic_type,
          trafficScore: visitor.traffic_score,
          trafficReason: visitor.traffic_reason,
        },
      },
      sessions: sessionsResult.rows.map((s) => ({
        sessionId: s.id,
        sessionKey: s.session_key,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        landingPage: s.landing_page,
        referrer: s.entry_referrer,
        pageViews: Number(s.page_views),
        intentEvents: Number(s.intent_events),
        firstEventAt: s.first_event_at,
        lastEventAt: s.last_event_at,
        events: eventsBySession.get(s.id) ?? [],
      })),
    };
  }
}
