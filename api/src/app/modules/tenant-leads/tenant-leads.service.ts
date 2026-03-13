import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class TenantLeadsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly leads: LeadsService,
  ) {}

  private async getTenantSlug(tenantId: string): Promise<string> {
    const tenantRes = await this.pool.query<{ slug: string }>(
      `
      SELECT slug
      FROM tenants
      WHERE id = $1
      LIMIT 1
      `,
      [tenantId],
    );

    const tenant = tenantRes.rows[0];
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant.slug;
  }

  async listForTenant(tenantId: string) {
    const slug = await this.getTenantSlug(tenantId);
    return this.leads.listLeads(slug);
  }

  async getOneForTenant(tenantId: string, leadId: string) {
    const slug = await this.getTenantSlug(tenantId);
    return this.leads.getLeadByIdForTenantSlug(leadId, slug);
  }

  async getMessagesForTenant(tenantId: string, leadId: string) {
    const slug = await this.getTenantSlug(tenantId);
    await this.leads.getLeadByIdForTenantSlug(leadId, slug);
    return this.leads.getLeadMessages(leadId);
  }
}
