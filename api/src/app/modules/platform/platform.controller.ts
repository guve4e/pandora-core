import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../../core/common/lib/guards/roles.decorator';
import { RolesGuard } from '../../core/common/lib/guards/roles.guard';
import { CreateAuthInviteDto } from '../../core/common/dto/create-auth-invite.dto';
import { AuthInvitesService } from '../../core/auth/auth-invites.service';
import { PlatformService } from './platform.service';

@UseGuards(RolesGuard)
@Controller('admin/platform')
export class PlatformController {
  constructor(
    private readonly platform: PlatformService,
    private readonly authInvites: AuthInvitesService,
  ) {}

  @Get('tenants')
  @Roles('platform_owner')
  listTenants() {
    return this.platform.listTenants();
  }

  @Get('tenants/:slug')
  @Roles('platform_owner')
  getTenant(@Param('slug') slug: string) {
    return this.platform.getTenantBySlug(slug);
  }

  @Post('tenants/:slug/invites')
  @Roles('platform_owner')
  createInvite(
    @Param('slug') slug: string,
    @Body() dto: CreateAuthInviteDto,
    @Request() req: any,
  ) {
    return this.authInvites.createInvite({
      tenantSlug: slug,
      email: dto.email,
      role: dto.role ?? 'owner',
      createdByUserId: req.user?.sub ?? null,
    });
  }

  @Get('tenants/:slug/users')
  @Roles('platform_owner')
  listTenantUsers(@Param('slug') slug: string) {
    return this.platform.listUsersByTenantSlug(slug);
  }

  @Get('tenants/:slug/leads')
  @Roles('platform_owner')
  listTenantLeads(@Param('slug') slug: string) {
    return this.platform.listLeadsByTenantSlug(slug);
  }

  @Get('tenants/:slug/notifications')
  @Roles('platform_owner')
  listTenantNotifications(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    return this.platform.listNotificationsByTenantSlug(
      slug,
      limit ? Number(limit) : 100,
    );
  }

  @Get('users')
  @Roles('platform_owner')
  listUsers() {
    return this.platform.listUsers();
  }

  @Get('leads')
  @Roles('platform_owner')
  listLeads() {
    return this.platform.listLeads();
  }

  @Get('notifications')
  @Roles('platform_owner')
  listNotifications(@Query('limit') limit?: string) {
    return this.platform.listNotifications(limit ? Number(limit) : 100);
  }
}
