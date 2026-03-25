import { Body, Controller, Post, Req } from '@nestjs/common';

import { Public } from '../../../../core/common/lib/decorators/public.decorator';
import { TrackEventsDto } from './track-events.dto';
import { TrackEventsService } from './track-events.service';

@Controller('public')
export class TrackEventsController {
  constructor(private readonly service: TrackEventsService) {}

  @Public()
  @Post('track')
  async track(@Req() req: any, @Body() dto: TrackEventsDto) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.socket?.remoteAddress || null;

    const userAgent =
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : null;

    return this.service.track(dto, {
      ipAddress,
      userAgent,
    });
  }
}
