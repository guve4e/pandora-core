import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

export interface AssistantConfigRow {
  id: string;
  tenant_slug: string;
  business_name: string;
  business_description: string;
  services_json: string[] | null;
  facts_json: string[] | null;
  contact_prompt: string | null;
  tone: string | null;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
        contact_prompt,
        tone,
        language,
        is_active,
        created_at,
        updated_at
      FROM assistant.assistant_configs
      WHERE tenant_slug = $1
      LIMIT 1
      `,
      [tenantSlug],
    );

    return res.rows[0] ?? null;
  }

  async upsert(input: {
    tenantSlug: string;
    businessName: string;
    businessDescription: string;
    services: string[];
    facts: string[];
    contactPrompt?: string | null;
    tone?: string | null;
    language?: string | null;
    isActive?: boolean;
  }): Promise<AssistantConfigRow> {
    const res = await this.db.systemQuery<AssistantConfigRow>(
      `
      INSERT INTO assistant.assistant_configs (
        tenant_slug,
        business_name,
        business_description,
        services_json,
        facts_json,
        contact_prompt,
        tone,
        language,
        is_active
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9)
      ON CONFLICT (tenant_slug)
      DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_description = EXCLUDED.business_description,
        services_json = EXCLUDED.services_json,
        facts_json = EXCLUDED.facts_json,
        contact_prompt = EXCLUDED.contact_prompt,
        tone = EXCLUDED.tone,
        language = EXCLUDED.language,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING
        id,
        tenant_slug,
        business_name,
        business_description,
        services_json,
        facts_json,
        contact_prompt,
        tone,
        language,
        is_active,
        created_at,
        updated_at
      `,
      [
        input.tenantSlug,
        input.businessName,
        input.businessDescription,
        JSON.stringify(input.services ?? []),
        JSON.stringify(input.facts ?? []),
        input.contactPrompt ?? null,
        input.tone ?? null,
        input.language ?? 'bg',
        input.isActive ?? true,
      ],
    );

    return res.rows[0];
  }
}
