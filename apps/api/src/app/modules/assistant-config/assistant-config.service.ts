import { Injectable, NotFoundException } from '@nestjs/common';
import { AssistantConfigRepository } from './assistant-config.repository';
import { UpsertAssistantConfigDto } from './dto/upsert-assistant-config.dto';
import { TenantsService } from '../../core/tenants/tenants.service';

@Injectable()
export class AssistantConfigService {
  constructor(
    private readonly repo: AssistantConfigRepository,
    private readonly tenants: TenantsService,
  ) {}

  private async resolveTenantSlug(tenantId: string): Promise<string> {
    const tenant = await this.tenants.getById(tenantId);

    if (!tenant?.slug) {
      throw new NotFoundException(`Tenant not found for id: ${tenantId}`);
    }

    return tenant.slug;
  }

  async getForTenantId(tenantId: string) {
    const tenantSlug = await this.resolveTenantSlug(tenantId);
    const row = await this.repo.findByTenantSlug(tenantSlug);

    if (!row) {
      return {
        tenantSlug,
        businessName: '',
        businessDescription: '',
        services: [],
        facts: [],
        contactPrompt: null,
        tone: null,
        language: 'bg',
        isActive: true,
      };
    }

    return {
      tenantSlug: row.tenant_slug,
      businessName: row.business_name,
      businessDescription: row.business_description,
      services: row.services_json ?? [],
      facts: row.facts_json ?? [],
      contactPrompt: row.contact_prompt,
      tone: row.tone,
      language: row.language,
      isActive: row.is_active,
    };
  }

  async upsertForTenantId(tenantId: string, dto: UpsertAssistantConfigDto) {
    const tenantSlug = await this.resolveTenantSlug(tenantId);

    const row = await this.repo.upsert({
      tenantSlug,
      businessName: dto.businessName,
      businessDescription: dto.businessDescription,
      services: dto.services ?? [],
      facts: dto.facts ?? [],
      contactPrompt: dto.contactPrompt ?? null,
      tone: dto.tone ?? null,
      language: dto.language ?? 'bg',
      isActive: dto.isActive ?? true,
    });

    return {
      tenantSlug: row.tenant_slug,
      businessName: row.business_name,
      businessDescription: row.business_description,
      services: row.services_json ?? [],
      facts: row.facts_json ?? [],
      contactPrompt: row.contact_prompt,
      tone: row.tone,
      language: row.language,
      isActive: row.is_active,
    };
  }
}
