import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Roles } from '../common/lib/guards/roles.decorator';
import { RolesGuard } from '../common/lib/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('me')
  @Roles('owner')
  me(@Request() req: any) {
    return this.tenants.getById(req.user.tenant_id);
  }

  @Post()
  @Roles('owner')
  create(@Body() body: { name: string; slug: string }) {
    return this.tenants.create(body);
  }
}
