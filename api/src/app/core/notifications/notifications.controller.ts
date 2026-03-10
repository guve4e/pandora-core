import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import type { NotificationEvent } from './notifications.types';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Number(limit || 50), 100);

    return this.notifications.listForUser(
      req.user.tenant_id,
      req.user.sub,
      parsedLimit,
    );
  }

  @Get('unread-count')
  async unreadCount(@Request() req: any) {
    const count = await this.notifications.unreadCountForUser(
      req.user.tenant_id,
      req.user.sub,
    );

    return { count };
  }

  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.notifications.markRead(
      req.user.tenant_id,
      id,
      req.user.sub,
    );
  }

  @Post('read-all')
  async markAllRead(@Request() req: any) {
    return this.notifications.markAllRead(
      req.user.tenant_id,
      req.user.sub,
    );
  }

  // NEW EVENT INGESTION ENDPOINT
  @Post('events')
  async createFromEvent(@Body() body: NotificationEvent) {
    await this.notifications.notify(body);
    return { ok: true };
  }
}
