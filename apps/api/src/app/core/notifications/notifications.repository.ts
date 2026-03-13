import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';
import type {
  NotificationDeliveryCommand,
  StoredNotification,
  UnreadCountRow,
} from './notifications.types';

@Injectable()
export class NotificationsRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  async create(command: NotificationDeliveryCommand): Promise<StoredNotification> {
    const { rows } = await this.pool.query<StoredNotification>(
      `
      INSERT INTO notifications (
        tenant_id,
        user_id,
        type,
        title,
        message,
        severity,
        entity_type,
        entity_id,
        link,
        meta
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        command.tenantId,
        command.userId ?? null,
        command.type,
        command.title,
        command.message,
        command.severity,
        command.entityType ?? null,
        command.entityId ?? null,
        command.link ?? null,
        command.meta ?? null,
      ],
    );

    return rows[0];
  }

  async listForUser(
    tenantId: string,
    userId: string,
    limit = 50,
  ): Promise<StoredNotification[]> {
    const { rows } = await this.pool.query<StoredNotification>(
      `
      SELECT *
      FROM notifications
      WHERE tenant_id = $1
        AND (user_id = $2 OR user_id IS NULL)
      ORDER BY is_read ASC, created_at DESC
      LIMIT $3
      `,
      [tenantId, userId, limit],
    );

    return rows;
  }

  async unreadCountForUser(
    tenantId: string,
    userId: string,
  ): Promise<number> {
    const { rows } = await this.pool.query<UnreadCountRow>(
      `
      SELECT COUNT(*)::text AS count
      FROM notifications
      WHERE tenant_id = $1
        AND (user_id = $2 OR user_id IS NULL)
        AND is_read = FALSE
      `,
      [tenantId, userId],
    );

    return Number(rows[0]?.count ?? 0);
  }

  async markRead(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<number> {
    const res = await this.pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE,
          read_at = NOW()
      WHERE tenant_id = $1
        AND id = $2
        AND (user_id = $3 OR user_id IS NULL)
        AND is_read = FALSE
      `,
      [tenantId, id, userId],
    );

    return res.rowCount ?? 0;
  }

  async markAllRead(
    tenantId: string,
    userId: string,
  ): Promise<number> {
    const res = await this.pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE,
          read_at = NOW()
      WHERE tenant_id = $1
        AND (user_id = $2 OR user_id IS NULL)
        AND is_read = FALSE
      `,
      [tenantId, userId],
    );

    return res.rowCount ?? 0;
  }
}
