import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';

export type LeadMessageRow = {
  id: string;
  lead_id: string;
  role: 'user' | 'assistant';
  text: string;
  created_at: string;
};

@Injectable()
export class LeadMessagesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async exists(leadId: string, role: 'user' | 'assistant', text: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `
      SELECT 1
      FROM lead_messages
      WHERE lead_id = $1
        AND role = $2
        AND text = $3
      LIMIT 1
      `,
      [leadId, role, text],
    );

    return rows.length > 0;
  }

  async createMany(
    leadId: string,
    messages: Array<{ role: 'user' | 'assistant'; text: string; created_at?: string }>,
  ): Promise<void> {
    for (const m of messages) {
      const alreadyExists = await this.exists(leadId, m.role, m.text);

      if (alreadyExists) {
        continue;
      }

      await this.pool.query(
        `
        INSERT INTO lead_messages (lead_id, role, text, created_at)
        VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
        `,
        [leadId, m.role, m.text, m.created_at ?? null],
      );
    }
  }

  async listByLeadId(leadId: string): Promise<LeadMessageRow[]> {
    const { rows } = await this.pool.query<LeadMessageRow>(
      `
      SELECT id, lead_id, role, text, created_at
      FROM lead_messages
      WHERE lead_id = $1
      ORDER BY created_at ASC
      `,
      [leadId],
    );

    return rows;
  }
}
