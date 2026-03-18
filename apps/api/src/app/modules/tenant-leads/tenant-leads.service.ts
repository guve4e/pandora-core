import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';

@Injectable()
export class TenantLeadsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listForTenant(tenantId: string) {
    const { rows } = await this.pool.query(
      `
      SELECT
        l.id,
        l.tenant_slug,
        l.name,
        l.phone,
        l.city,
        l.service_type,
        l.summary,
        l.source,
        l.status,
        l.created_at
      FROM leads l
      INNER JOIN tenants t ON t.slug = l.tenant_slug
      WHERE t.id = $1
      ORDER BY l.created_at DESC
      `,
      [tenantId],
    );

    return rows;
  }

  async getOneForTenant(tenantId: string, leadId: string) {
    const { rows } = await this.pool.query(
      `
      SELECT
        l.id,
        l.tenant_slug,
        l.name,
        l.phone,
        l.city,
        l.service_type,
        l.summary,
        l.source,
        l.status,
        l.created_at
      FROM leads l
      INNER JOIN tenants t ON t.slug = l.tenant_slug
      WHERE t.id = $1
        AND l.id = $2
      LIMIT 1
      `,
      [tenantId, leadId],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Lead not found');
    }

    return row;
  }

  async getMessagesForTenant(tenantId: string, leadId: string) {
    const lead = await this.getOneForTenant(tenantId, leadId);

    const { rows } = await this.pool.query(
      `
      SELECT
        id,
        lead_id,
        role,
        text,
        created_at
      FROM lead_messages
      WHERE lead_id = $1
      ORDER BY created_at ASC
      `,
      [lead.id],
    );

    return rows;
  }

  async updateStatusForTenant(
    tenantId: string,
    leadId: string,
    status: string,
  ) {
    const allowed = new Set(['new', 'contacted', 'scheduled', 'won', 'lost']);

    if (!allowed.has(status)) {
      throw new NotFoundException('Invalid lead status');
    }

    const lead = await this.getOneForTenant(tenantId, leadId);

    const { rows } = await this.pool.query(
      `
      UPDATE leads
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        tenant_slug,
        name,
        phone,
        city,
        service_type,
        summary,
        source,
        status,
        created_at
      `,
      [lead.id, status],
    );

    return rows[0];
  }
}
