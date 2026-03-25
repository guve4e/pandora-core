import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { DailyTrafficService } from './daily-traffic.service';

@Controller('analytics')
export class DailyTrafficController {
  constructor(private readonly service: DailyTrafficService) {}

  @Get('daily')
  async getDailyTraffic(
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    const tenantId = req.user?.tenant_id ?? req.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant_id');
    }

    const parsedDays = Number(days ?? 7);

    return this.service.getDailyTraffic(
      tenantId,
      Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7,
    );
  }
}
