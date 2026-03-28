import { Controller, Get, Param } from '@nestjs/common';
import { PlatformAiUsageService } from './platform-ai-usage.service';

@Controller('admin/platform/ai-usage')
export class PlatformAiUsageController {
  constructor(private readonly service: PlatformAiUsageService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('tenants')
  listTenants() {
    return this.service.listTenants();
  }

  @Get('tenants/:tenantSlug')
  getTenantDetail(@Param('tenantSlug') tenantSlug: string) {
    return this.service.getTenantDetail(tenantSlug);
  }
}
