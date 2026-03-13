import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';

@Injectable()
export class LeadsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(data: any) {
    const { rows } = await this.pool.query(
      `
      INSERT INTO leads
      (tenant_slug, name, phone, city, service_type, summary)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        data.tenantSlug,
        data.name ?? null,
        data.phone,
        data.city ?? null,
        data.serviceType ?? null,
        data.summary ?? null,
      ],
    );

    return rows[0];
  }

  async findByIdForTenantSlug(id: string, tenantSlug: string) {
    const { rows } = await this.pool.query(
      `
      SELECT
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
      FROM leads
      WHERE id = $1
        AND tenant_slug = $2
      LIMIT 1
      `,
      [id, tenantSlug],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Lead not found');
    }

    return row;
  }

  async list(tenantSlug: string) {
    const { rows } = await this.pool.query(
      `
      SELECT
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
      FROM leads
      WHERE tenant_slug = $1
      ORDER BY created_at DESC
      `,
      [tenantSlug],
    );

    return rows;
  }
}
