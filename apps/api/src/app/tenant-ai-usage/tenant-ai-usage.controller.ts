import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { TenantAiUsageService } from './tenant-ai-usage.service';

@Controller('tenant/ai-usage')
export class TenantAiUsageController {
  constructor(private readonly service: TenantAiUsageService) {}

  @Get('summary')
  getSummary(@Req() req: any) {
    const tenantId = req?.user?.tenant_id ?? req?.user?.tenantId ?? null;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context missing');
    }

    return this.service.getTenantSummary(tenantId);
  }
}
