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
    const ipAddress = this.resolveClientIp(req);

    if (this.shouldIgnoreRequest(req, dto, ipAddress)) {
      return { success: true, ignored: true };
    }

    const userAgent =
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : null;

    return this.service.track(dto, {
      ipAddress,
      userAgent,
    });
  }

  private resolveClientIp(req: any): string | null {
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
      return cfConnectingIp.trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
      return realIp.trim();
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || null;
  }

  private shouldIgnoreRequest(
    req: any,
    dto: TrackEventsDto,
    ipAddress: string | null,
  ): boolean {
    const origin = String(req.headers.origin || '').toLowerCase();
    const host = String(req.headers.host || '').toLowerCase();

    const eventUrls = (dto.events || [])
      .flatMap((event) => [event.pageUrl, event.referrer])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const localMarkers = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '[::1]',
      '://::1',
    ];

    if (
      localMarkers.some(
        (marker) =>
          origin.includes(marker) ||
          host.includes(marker) ||
          eventUrls.includes(marker),
      )
    ) {
      return true;
    }

    return this.isPrivateOrLocalIp(ipAddress);
  }

  private isPrivateOrLocalIp(ipAddress: string | null): boolean {
    if (!ipAddress) return false;

    const ip = ipAddress.replace(/^::ffff:/, '');

    if (ip === '::1' || ip === '127.0.0.1' || ip === '0.0.0.0') return true;
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('192.168.')) return true;

    const match = ip.match(/^172\.(\d+)\./);
    if (match) {
      const second = Number(match[1]);
      if (second >= 16 && second <= 31) return true;
    }

    return false;
  }
}
