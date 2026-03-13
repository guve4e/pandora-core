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

  async createMany(
    leadId: string,
    messages: Array<{ role: 'user' | 'assistant'; text: string; created_at?: string }>,
  ): Promise<void> {
    console.log('[lead-messages] createMany start', {
      leadId,
      count: messages.length,
    });

    for (const m of messages) {
      console.log('[lead-messages] inserting', {
        leadId,
        role: m.role,
        text: m.text,
        created_at: m.created_at ?? null,
      });

      await this.pool.query(
        `
        INSERT INTO lead_messages (lead_id, role, text, created_at)
        VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
        `,
        [leadId, m.role, m.text, m.created_at ?? null],
      );
    }

    console.log('[lead-messages] createMany done', {
      leadId,
      count: messages.length,
    });
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
