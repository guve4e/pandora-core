import { Injectable } from '@nestjs/common';
import { PlatformAiUsageRepository } from './platform-ai-usage.repository';

@Injectable()
export class PlatformAiUsageService {
  constructor(private readonly repo: PlatformAiUsageRepository) {}

  getSummary() {
    return this.repo.getSummary();
  }

  listTenants() {
    return this.repo.listTenants();
  }

  getTenantDetail(tenantSlug: string) {
    return this.repo.getTenantDetail(tenantSlug);
  }
}
