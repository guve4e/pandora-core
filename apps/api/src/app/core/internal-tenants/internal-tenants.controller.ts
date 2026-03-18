import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';
import { Public } from '../common/lib/decorators/public.decorator';

@Controller('internal/tenants')
export class InternalTenantsController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Public()
  @Get('slug/:slug')
  async getBySlug(
    @Param('slug') slug: string,
    @Headers('x-internal-token') internalToken: string | undefined,
  ) {
    const expected = process.env.INTERNAL_API_TOKEN || '';

    if (!expected || internalToken !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }

    const { rows } = await this.pool.query(
      `
      SELECT id, slug, name
      FROM tenants
      WHERE slug = $1
      LIMIT 1
      `,
      [slug],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Tenant not found for slug: ${slug}`);
    }

    return row;
  }
}
