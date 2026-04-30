import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

export interface AssistantConfigRow {
  id: string;
  tenant_slug: string;
  business_name: string;
  business_description: string;
  services_json: string[] | null;
  facts_json: string[] | null;
  features_json: Record<string, unknown> | null;
  estimator_json: Record<string, unknown> | null;
  contact_prompt: string | null;
  tone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  language: string | null;
}

@Injectable()
export class AssistantConfigRepository {
  constructor(private readonly db: TenantDb) {}

  async findByTenantSlug(tenantSlug: string): Promise<AssistantConfigRow | null> {
    const res = await this.db.systemQuery<AssistantConfigRow>(
      `
      SELECT
        id,
        tenant_slug,
        business_name,
        business_description,
        services_json,
        facts_json,
        features_json,
        estimator_json,
        contact_prompt,
        tone,
        is_active,
        created_at,
        updated_at,
        language
      FROM assistant.assistant_configs
      WHERE tenant_slug = $1
        AND is_active = true
      LIMIT 1
      `,
      [tenantSlug],
    );

    return res.rows[0] ?? null;
  }
}
