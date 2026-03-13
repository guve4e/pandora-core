import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';

@Injectable()
export class NotificationsCleanupService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async cleanupOldNotifications(): Promise<number> {
    const res = await this.pool.query(
      `
      DELETE FROM notifications
      WHERE is_read = true
      AND created_at < now() - interval '30 days'
      `,
    );

    return res.rowCount ?? 0;
  }
}
