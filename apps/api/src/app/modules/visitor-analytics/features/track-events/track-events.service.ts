import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Pool } from 'pg'

import { PG_POOL } from '../../../../../db/pg.pool'
import { TrackEventsDto } from './track-events.dto'
import { SessionResolutionService } from '../../shared/session-resolution.service'

type TrackingSiteRow = {
  id: string
  tenant_id: string
  public_key: string
  is_active: boolean
}

type TrackingVisitorRow = {
  id: string
}

type TrackingSessionRow = {
  id: string
}

type TrackRequestContext = {
  ipAddress: string | null
  userAgent: string | null
}

@Injectable()
export class TrackEventsService {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
    private readonly sessionResolver: SessionResolutionService,
  ) {}

  async track(
    dto: TrackEventsDto,
    context: TrackRequestContext,
  ): Promise<{ success: true }> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      const siteResult = await client.query<TrackingSiteRow>(
        `
          select id, tenant_id, public_key, is_active
          from analytics.tracking_sites
          where public_key = $1
            and is_active = true
          limit 1
        `,
        [dto.siteKey],
      )

      const site = siteResult.rows[0]

      if (!site) {
        throw new NotFoundException('Invalid siteKey')
      }

      const tenantId = site.tenant_id
      const now = new Date()

      const visitorResult = await client.query<TrackingVisitorRow>(
        `
          insert into analytics.tracking_visitors (
            tenant_id,
            anonymous_id,
            first_seen_at,
            last_seen_at,
            latest_user_agent,
            created_at,
            updated_at
          )
          values ($1, $2, $3, $3, $4, now(), now())
          on conflict (tenant_id, anonymous_id)
          do update set
            last_seen_at = excluded.last_seen_at,
            latest_user_agent = excluded.latest_user_agent,
            updated_at = now()
          returning id
        `,
        [tenantId, dto.visitorId, now, context.userAgent],
      )

      const visitor = visitorResult.rows[0]

      const sessionKey = this.sessionResolver.resolveSessionKey(dto.sessionId)
      const firstEvent = dto.events[0]

      const sessionResult = await client.query<TrackingSessionRow>(
        `
          insert into analytics.tracking_sessions (
            tenant_id,
            visitor_id,
            session_key,
            started_at,
            landing_page,
            entry_referrer,
            created_at,
            updated_at
          )
          values ($1, $2, $3, $4, $5, $6, now(), now())
          on conflict (tenant_id, session_key)
          do update set
            updated_at = now()
          returning id
        `,
        [
          tenantId,
          visitor.id,
          sessionKey,
          now,
          firstEvent?.pagePath ?? null,
          firstEvent?.referrer ?? null,
        ],
      )

      const session = sessionResult.rows[0]

      for (const event of dto.events) {
        await client.query(
          `
            insert into analytics.tracking_events (
              tenant_id,
              site_id,
              visitor_id,
              session_id,
              event_type,
              event_name,
              page_url,
              page_path,
              referrer,
              element_id,
              element_text,
              occurred_at,
              properties,
              ip_address,
              user_agent,
              created_at
            )
            values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, now()
            )
          `,
          [
            tenantId,
            site.id,
            visitor.id,
            session.id,
            event.type,
            event.eventName ?? null,
            event.pageUrl ?? null,
            event.pagePath ?? null,
            event.referrer ?? null,
            event.elementId ?? null,
            event.elementText ?? null,
            new Date(event.occurredAt),
            JSON.stringify(event.properties ?? {}),
            context.ipAddress,
            context.userAgent,
          ],
        )
      }

      await client.query('COMMIT')
      return { success: true }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
