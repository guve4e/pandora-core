import { Controller, Get, Query, Req } from '@nestjs/common';

import { GetOverviewQueryDto } from './get-overview.query.dto';
import { GetOverviewService } from './get-overview.service';

@Controller('analytics')
export class GetOverviewController {
  constructor(private readonly service: GetOverviewService) {}

  @Get('overview')
  async getOverview(@Req() req: any, @Query() query: GetOverviewQueryDto) {
    return this.service.getOverview(req.user.tenant_id, query);
  }
}
