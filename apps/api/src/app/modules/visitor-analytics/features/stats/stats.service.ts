import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../../db/pg.pool';

@Injectable()
export class StatsService {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async getOverview(tenantId: string) {
    const result = await this.pool.query(
      `
      select
        count(*) filter (where event_type = 'page_view') as page_views,

        count(*) filter (where event_type = 'cta_click') as cta_clicks,

        count(*) filter (
          where event_type = 'conversion'
            and properties->>'conversionType' = 'estimator_submitted'
        ) as estimator_conversions

      from analytics.tracking_events
      where tenant_id = $1
      `,
      [tenantId],
    );

    return result.rows[0];
  }
}
