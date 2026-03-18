import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  assistant_enabled: boolean;
  lead_forms_enabled: boolean;
  analytics_enabled: boolean;
  conversations_enabled: boolean;
  visitors_enabled: boolean;
  created_at: string;
};

@Injectable()
export class TenantsService {
  constructor(private readonly db: TenantDb) {}

  async list(): Promise<TenantRow[]> {
    const res = await this.db.systemQuery<TenantRow>(
      `SELECT
         id,
         name,
         slug,
         tier,
         assistant_enabled,
         lead_forms_enabled,
         analytics_enabled,
         conversations_enabled,
         visitors_enabled,
         created_at
       FROM tenants
       ORDER BY created_at DESC`,
    );
    return res.rows;
  }

  async create(input: { name: string; slug: string }): Promise<TenantRow> {
    const res = await this.db.systemQuery<TenantRow>(
      `INSERT INTO tenants (name, slug)
       VALUES ($1, $2)
       RETURNING
         id,
         name,
         slug,
         tier,
         assistant_enabled,
         lead_forms_enabled,
         analytics_enabled,
         conversations_enabled,
         visitors_enabled,
         created_at`,
      [input.name, input.slug],
    );
    return res.rows[0];
  }

  async findBySlug(slug: string): Promise<TenantRow | null> {
    const res = await this.db.systemQuery<TenantRow>(
      `SELECT
         id,
         name,
         slug,
         tier,
         assistant_enabled,
         lead_forms_enabled,
         analytics_enabled,
         conversations_enabled,
         visitors_enabled,
         created_at
       FROM tenants
       WHERE slug = $1
       LIMIT 1`,
      [slug],
    );
    return res.rows[0] ?? null;
  }

  async getById(id: string): Promise<TenantRow | null> {
    const res = await this.db.systemQuery<TenantRow>(
      `SELECT
         id,
         name,
         slug,
         tier,
         assistant_enabled,
         lead_forms_enabled,
         analytics_enabled,
         conversations_enabled,
         visitors_enabled,
         created_at
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return res.rows[0] ?? null;
  }
}
