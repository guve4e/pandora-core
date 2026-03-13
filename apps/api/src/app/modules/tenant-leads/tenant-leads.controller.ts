import { Controller, Get, Param, Request } from '@nestjs/common';
import { TenantLeadsService } from './tenant-leads.service';

@Controller('admin/leads')
export class TenantLeadsController {
  constructor(private readonly tenantLeads: TenantLeadsService) {}

  @Get()
  async list(@Request() req: any) {
    return this.tenantLeads.listForTenant(req.user.tenant_id);
  }

  @Get(':id')
  async getOne(@Request() req: any, @Param('id') id: string) {
    return this.tenantLeads.getOneForTenant(req.user.tenant_id, id);
  }

  @Get(':id/messages')
  async getMessages(@Request() req: any, @Param('id') id: string) {
    return this.tenantLeads.getMessagesForTenant(req.user.tenant_id, id);
  }
}
