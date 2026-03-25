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
          count(*) filter (where event_type = 'conversion') as conversions
        from analytics.tracking_events
        where tenant_id = $1
        group by visitor_id
      ),
      last_events as (
        select distinct on (visitor_id)
          visitor_id,
          page_path,
          ip_address,
          user_agent
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
        l.page_path as latest_page,
        l.ip_address as latest_ip,
        l.user_agent as latest_user_agent
      from visitor_stats v
      left join last_events l on l.visitor_id = v.visitor_id
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
        latestPage: r.latest_page,
        latestIp: r.latest_ip,
        latestUserAgent: r.latest_user_agent,
      })),
    };
  }
}
