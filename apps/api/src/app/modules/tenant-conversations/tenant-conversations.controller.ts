import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { TenantConversationsService } from './tenant-conversations.service';

// Authenticated by the application's global JwtTenantGuard. Tenant identity
// comes only from that guard, never from a query parameter or conversation ID.
@Controller('tenant/conversations')
export class TenantConversationsController {
  constructor(private readonly conversations: TenantConversationsService) {}
  @Get()
  list(@Req() req: any) {
    return this.conversations.list(req.user?.tenant_id);
  }
  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.conversations.remove(req.user?.tenant_id, id);
  }
  @Get(':id/messages')
  messages(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.conversations.messages(req.user?.tenant_id, id);
  }
}
