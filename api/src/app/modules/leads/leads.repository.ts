import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../core/db/pg.tokens';

@Injectable()
export class LeadsRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

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
}
