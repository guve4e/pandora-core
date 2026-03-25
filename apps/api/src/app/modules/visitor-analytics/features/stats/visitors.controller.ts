import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { VisitorsService } from './visitors.service';

@Controller('analytics')
export class VisitorsController {
  constructor(private readonly service: VisitorsService) {}

  @Get('visitors')
  async getVisitors(@Req() req: any) {
    const tenantId = req.user?.tenant_id ?? req.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant_id');
    }

    return this.service.getVisitors(tenantId);
  }
}
