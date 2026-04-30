import { Controller, Post, Query } from '@nestjs/common';
import { EnrichIpService } from './enrich-ip.service';

@Controller('analytics/ip-enrichment')
export class EnrichIpController {
  constructor(private readonly service: EnrichIpService) {}

  @Post('missing')
  enrichMissing(@Query('limit') limit?: string) {
    return this.service.enrichMissing(limit ? Number(limit) : 25);
  }
}
