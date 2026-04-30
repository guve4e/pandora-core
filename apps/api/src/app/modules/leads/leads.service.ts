import { Injectable, BadRequestException } from '@nestjs/common';
import { LeadsRepository } from './leads.repository';
import { LeadMessagesRepository } from './lead-messages.repository';
import { CreateAssistantLeadDto } from './dto/create-assistant-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly repo: LeadsRepository,
    private readonly leadMessagesRepo: LeadMessagesRepository,
  ) {}

  async createLead(data: any) {
    return this.repo.create(data);
  }

  async createFromAssistant(data: CreateAssistantLeadDto) {
    if (!data.tenantSlug) {
      throw new BadRequestException('tenantSlug is required');
    }

    if (!data.phone?.trim()) {
      throw new BadRequestException('phone is required to create a lead');
    }

    const phone = data.phone.trim();

    const lead = await this.repo.create({
      tenantSlug: data.tenantSlug,
      name: data.name ?? null,
      phone,
      city: data.city ?? null,
      serviceType: data.serviceType ?? null,
      summary: data.summary ?? null,
      source: 'assistant',
    });

    if (Array.isArray(data.messages) && data.messages.length > 0) {
      await this.leadMessagesRepo.createMany(lead.id, data.messages);
    }

    return lead;
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
    return this.leadMessagesRepo.createMany(leadId, messages);
  }
}
