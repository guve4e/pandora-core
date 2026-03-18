import { Injectable } from '@nestjs/common';
import { AssistantConfigRepository } from './assistant-config.repository';

export interface TenantKnowledgeProfile {
  tenantSlug: string;
  businessName: string;
  businessDescription: string;
  knownFacts: string[];
  services: string[];
  contactPrompt: string | null;
  tone: string | null;
  language: string;
}

@Injectable()
export class KnowledgeService {
  constructor(private readonly repo: AssistantConfigRepository) {}

  async getTenantProfile(tenantSlug: string): Promise<TenantKnowledgeProfile> {
    const row = await this.repo.findByTenantSlug(tenantSlug);

    if (!row) {
      return {
        tenantSlug,
        businessName: tenantSlug,
        businessDescription: 'No detailed business profile is configured yet.',
        knownFacts: [
          'The assistant must clearly say when business-specific information is missing.',
          'The assistant must not invent company facts.',
          'The assistant may still answer common domain questions in a practical way.',
        ],
        services: [],
        contactPrompt:
          'If useful, invite the user to leave contact details for follow-up.',
        tone: 'helpful and practical',
        language: 'bg',
      };
    }

    return {
      tenantSlug: row.tenant_slug,
      businessName: row.business_name,
      businessDescription: row.business_description,
      knownFacts: row.facts_json ?? [],
      services: row.services_json ?? [],
      contactPrompt: row.contact_prompt,
      tone: row.tone,
      language: row.language ?? 'bg',
    };
  }
}
