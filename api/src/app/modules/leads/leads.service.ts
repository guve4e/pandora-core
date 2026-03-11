import { Injectable } from '@nestjs/common';
import { LeadsRepository } from './leads.repository';
import { LeadMessagesRepository } from './lead-messages.repository';

@Injectable()
export class LeadsService {
  constructor(
    private readonly repo: LeadsRepository,
    private readonly leadMessagesRepo: LeadMessagesRepository,
  ) {}

  async createLead(data: any) {
    return this.repo.create(data);
  }

  async listLeads(tenantSlug: string) {
    return this.repo.list(tenantSlug);
  }

  async getLeadByIdForTenantSlug(id: string, tenantSlug: string) {
    return this.repo.findByIdForTenantSlug(id, tenantSlug);
  }

  async getLeadMessages(id: string) {
    return this.leadMessagesRepo.listByLeadId(id);
  }

  async saveLeadMessages(
    leadId: string,
    messages: Array<{ role: 'user' | 'assistant'; text: string; created_at?: string }>,
  ) {
    console.log('[leads] saveLeadMessages called', {
      leadId,
      count: messages.length,
      messages,
    });

    const result = await this.leadMessagesRepo.createMany(leadId, messages);

    console.log('[leads] saveLeadMessages finished', {
      leadId,
      count: messages.length,
    });

    return result;
  }
}
