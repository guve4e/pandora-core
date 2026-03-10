import { Injectable } from '@nestjs/common';
import { LeadsRepository } from './leads.repository';

@Injectable()
export class LeadsService {
  constructor(private readonly repo: LeadsRepository) {}

  async createLead(data: any) {
    return this.repo.create(data);
  }

  async listLeads(tenantSlug: string) {
    return this.repo.list(tenantSlug);
  }
}
