import { Controller, Get, Param, Req } from '@nestjs/common';
import { TenantLeadsService } from './tenant-leads.service';

@Controller('tenant/leads')
export class TenantLeadsController {
  constructor(private readonly tenantLeads: TenantLeadsService) {}

  @Get()
  async list(@Req() req: any) {
    return this.tenantLeads.listForTenant(req.user.tenant_id);
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.tenantLeads.getOneForTenant(req.user.tenant_id, id);
  }

  @Get(':id/messages')
  async getMessages(@Req() req: any, @Param('id') id: string) {
    return this.tenantLeads.getMessagesForTenant(req.user.tenant_id, id);
  }
}
