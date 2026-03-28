import { Injectable } from '@nestjs/common';
import { TenantAiUsageRepository } from './tenant-ai-usage.repository';

@Injectable()
export class TenantAiUsageService {
  constructor(private readonly repo: TenantAiUsageRepository) {}

  getTenantSummary(tenantId: string) {
    return this.repo.getTenantSummary(tenantId);
  }
}
