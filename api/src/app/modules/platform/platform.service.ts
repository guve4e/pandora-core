import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../core/db/pg.tokens';

@Injectable()
export class PlatformService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listTenants() {
    const { rows } = await this.pool.query(
      `
      SELECT id, name, slug, created_at
      FROM tenants
      ORDER BY created_at DESC
      `,
    );
    return rows;
  }

  async getTenantBySlug(slug: string) {
    const { rows } = await this.pool.query(
      `
      SELECT id, name, slug, created_at
      FROM tenants
      WHERE slug = $1
      LIMIT 1
      `,
      [slug],
    );

    const tenant = rows[0];
    if (!tenant) {
      throw new NotFoundException(`Tenant not found for slug: ${slug}`);
    }

    return tenant;
  }

  async listUsers() {
    const { rows } = await this.pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.username,
        u.role,
        u.tenant_id,
        t.slug AS tenant_slug,
        t.name AS tenant_name,
        u.created_at
      FROM auth_users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      ORDER BY u.created_at DESC
      `,
    );
    return rows;
  }

  async listUsersByTenantSlug(slug: string) {
    const { rows } = await this.pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.username,
        u.role,
        u.tenant_id,
        t.slug AS tenant_slug,
        t.name AS tenant_name,
        u.created_at
      FROM auth_users u
      INNER JOIN tenants t ON t.id = u.tenant_id
      WHERE t.slug = $1
      ORDER BY u.created_at DESC
      `,
      [slug],
    );
    return rows;
  }

  async listLeads() {
    const { rows } = await this.pool.query(
      `
      SELECT
        l.id,
        l.tenant_slug,
        l.name,
        l.phone,
        l.city,
        l.service_type,
        l.summary,
        l.source,
        l.status,
        l.created_at
      FROM leads l
      ORDER BY l.created_at DESC
      `,
    );
    return rows;
  }

  async listLeadsByTenantSlug(slug: string) {
    const { rows } = await this.pool.query(
      `
      SELECT
        l.id,
        l.tenant_slug,
        l.name,
        l.phone,
        l.city,
        l.service_type,
        l.summary,
        l.source,
        l.status,
        l.created_at
      FROM leads l
      WHERE l.tenant_slug = $1
      ORDER BY l.created_at DESC
      `,
      [slug],
    );
    return rows;
  }

  async listNotifications(limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

    const { rows } = await this.pool.query(
      `
      SELECT
        n.id,
        n.tenant_id,
        t.slug AS tenant_slug,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.severity,
        n.entity_type,
        n.entity_id,
        n.link,
        n.is_read,
        n.read_at,
        n.created_at
      FROM notifications n
      LEFT JOIN tenants t ON t.id = n.tenant_id
      ORDER BY n.created_at DESC
      LIMIT $1
      `,
      [safeLimit],
    );

    return rows;
  }

  async listNotificationsByTenantSlug(slug: string, limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

    const { rows } = await this.pool.query(
      `
      SELECT
        n.id,
        n.tenant_id,
        t.slug AS tenant_slug,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.severity,
        n.entity_type,
        n.entity_id,
        n.link,
        n.is_read,
        n.read_at,
        n.created_at
      FROM notifications n
      INNER JOIN tenants t ON t.id = n.tenant_id
      WHERE t.slug = $1
      ORDER BY n.created_at DESC
      LIMIT $2
      `,
      [slug, safeLimit],
    );

    return rows;
  }
}
