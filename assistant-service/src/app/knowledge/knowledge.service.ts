import { Injectable } from '@nestjs/common';

export interface TenantKnowledgeProfile {
  tenantSlug: string;
  businessName: string;
  businessDescription: string;
  knownFacts: string[];
}

@Injectable()
export class KnowledgeService {
  async getTenantProfile(tenantSlug: string): Promise<TenantKnowledgeProfile> {
    if (tenantSlug === 'voltura') {
      return {
        tenantSlug: 'voltura',
        businessName: 'Voltura',
        businessDescription:
          'Voltura is a business focused on electrical services, installations, and related technical work.',
        knownFacts: [
          'The assistant must not claim exact prices unless they are explicitly configured.',
          'The assistant must not claim business hours unless they are explicitly configured.',
          'The assistant must not claim service coverage areas unless they are explicitly configured.',
          'If the user wants a quote or site visit, the assistant should encourage them to leave contact details.',
        ],
      };
    }

    return {
      tenantSlug,
      businessName: tenantSlug,
      businessDescription:
        'No detailed business profile is configured yet.',
      knownFacts: [
        'The assistant must clearly say when business information is missing.',
        'The assistant must not invent facts.',
      ],
    };
  }
}
