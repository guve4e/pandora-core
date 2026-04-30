import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../../db/pg.pool';

@Injectable()
export class DailyTrafficService {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async getDailyTraffic(tenantId: string, days: number) {
    const { rows } = await this.pool.query(
      `
      with date_series as (
        select generate_series(
          current_date - ($2::int - 1),
          current_date,
          interval '1 day'
        )::date as day
      ),
      traffic as (
        select
          date(e.created_at) as day,
          count(*) filter (where e.event_type = 'page_view') as page_views,
          count(distinct e.visitor_id) filter (where e.event_type = 'page_view') as unique_visitors
        from analytics.tracking_events e
        left join analytics.tracking_ip_enrichments ip
          on ip.ip_address = e.ip_address
        where e.tenant_id = $1
          and e.created_at >= current_date - ($2::int - 1)
          and coalesce(ip.traffic_type, 'unknown') = 'likely_human'
        group by date(e.created_at)
      )
      select
        ds.day::text as day,
        coalesce(t.page_views, 0)::int as "pageViews",
        coalesce(t.unique_visitors, 0)::int as "uniqueVisitors"
      from date_series ds
      left join traffic t on t.day = ds.day
      order by ds.day asc
      `,
      [tenantId, days],
    );

    return rows;
  }
}
