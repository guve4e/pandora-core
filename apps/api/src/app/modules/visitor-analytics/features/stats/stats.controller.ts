import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('analytics')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  async getOverview(@Query('tenantId') tenantId: string) {
    return this.service.getOverview(tenantId);
  }
}
