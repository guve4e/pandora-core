import { Inject, Injectable } from '@nestjs/common'
import { Pool } from 'pg'

import { PG_POOL } from '../../../../../db/pg.pool'
import { GetOverviewQueryDto } from './get-overview.query.dto'

type CountRow = {
  count: string
}

type TopPageRow = {
  page_path: string | null
  count: string
}

type TopEventRow = {
  event_name: string | null
  event_type: string
  count: string
}

@Injectable()
export class GetOverviewService {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async getOverview(tenantId: string, query: GetOverviewQueryDto) {
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const to = query.to ? new Date(query.to) : new Date()

    const client = await this.pool.connect()

    try {
      const visitorsResult = await client.query<CountRow>(
        `
          select count(*)::text as count
          from analytics.tracking_visitors
          where tenant_id = $1
            and created_at between $2 and $3
        `,
        [tenantId, from, to],
      )

      const sessionsResult = await client.query<CountRow>(
        `
          select count(*)::text as count
          from analytics.tracking_sessions
          where tenant_id = $1
            and created_at between $2 and $3
        `,
        [tenantId, from, to],
      )

      const pageViewsResult = await client.query<CountRow>(
        `
          select count(*)::text as count
          from analytics.tracking_events
          where tenant_id = $1
            and occurred_at between $2 and $3
            and event_type = 'page_view'
        `,
        [tenantId, from, to],
      )

      const chatOpensResult = await client.query<CountRow>(
        `
          select count(*)::text as count
          from analytics.tracking_events
          where tenant_id = $1
            and occurred_at between $2 and $3
            and event_type = 'chat_opened'
        `,
        [tenantId, from, to],
      )

      const topPagesResult = await client.query<TopPageRow>(
        `
          select
            page_path,
            count(*)::text as count
          from analytics.tracking_events
          where tenant_id = $1
            and occurred_at between $2 and $3
            and event_type = 'page_view'
            and page_path is not null
          group by page_path
          order by count(*) desc, page_path asc
          limit 10
        `,
        [tenantId, from, to],
      )

      const topEventsResult = await client.query<TopEventRow>(
        `
          select
            event_name,
            event_type,
            count(*)::text as count
          from analytics.tracking_events
          where tenant_id = $1
            and occurred_at between $2 and $3
          group by event_name, event_type
          order by count(*) desc, event_type asc, event_name asc nulls last
          limit 10
        `,
        [tenantId, from, to],
      )

      return {
        range: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        totals: {
          visitors: Number(visitorsResult.rows[0]?.count ?? 0),
          sessions: Number(sessionsResult.rows[0]?.count ?? 0),
          pageViews: Number(pageViewsResult.rows[0]?.count ?? 0),
          chatOpens: Number(chatOpensResult.rows[0]?.count ?? 0),
        },
        topPages: topPagesResult.rows.map((row) => ({
          pagePath: row.page_path,
          count: Number(row.count),
        })),
        topEvents: topEventsResult.rows.map((row) => ({
          eventName: row.event_name,
          eventType: row.event_type,
          count: Number(row.count),
        })),
      }
    } finally {
      client.release()
    }
  }
}
