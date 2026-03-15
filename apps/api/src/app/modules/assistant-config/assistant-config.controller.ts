import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { AssistantConfigService } from './assistant-config.service';
import { UpsertAssistantConfigDto } from './dto/upsert-assistant-config.dto';

@Controller('admin/assistant-config')
export class AssistantConfigController {
  constructor(private readonly service: AssistantConfigService) {}

  @Get()
  async getConfig(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    return this.service.getForTenantId(tenantId);
  }

  @Put()
  async upsertConfig(@Req() req: any, @Body() body: UpsertAssistantConfigDto) {
    const tenantId = req.user?.tenant_id;
    return this.service.upsertForTenantId(tenantId, body);
  }
}
