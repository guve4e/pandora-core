import {
  Inject,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PG_POOL } from '@org/backend-db';
import type { Pool } from 'pg';

@Injectable()
export class TenantConversationsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  private requireTenant(tenantId: string) {
    if (!tenantId) throw new UnauthorizedException('Missing tenant identity');
  }
  async list(tenantId: string) {
    this.requireTenant(tenantId);
    const result = await this.pool.query(
      `SELECT c.id,c.visitor_id,c.status,c.lead_id,c.channel,c.started_at,c.last_message_at,
      (c.lead_id IS NOT NULL OR EXISTS (SELECT 1 FROM assistant.leads l WHERE l.conversation_id=c.id)) AS has_lead,
      (SELECT m.message_text FROM assistant.messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) AS last_message
      FROM assistant.conversations c INNER JOIN tenants t ON t.slug=c.tenant_slug
      WHERE t.id=$1 ORDER BY c.last_message_at DESC,c.id DESC`,
      [tenantId],
    );
    return result.rows;
  }
  async messages(tenantId: string, id: string) {
    this.requireTenant(tenantId);
    const existing = await this.pool.query(
      `SELECT c.id FROM assistant.conversations c
      INNER JOIN tenants t ON t.slug=c.tenant_slug WHERE t.id=$1 AND c.id=$2`,
      [tenantId, id],
    );
    if (!existing.rows.length)
      throw new NotFoundException('Conversation not found');
    const result = await this.pool.query(
      `SELECT m.role,m.message_text,m.created_at FROM assistant.messages m
      INNER JOIN assistant.conversations c ON c.id=m.conversation_id
      INNER JOIN tenants t ON t.slug=c.tenant_slug WHERE t.id=$1 AND c.id=$2
      ORDER BY m.created_at ASC,m.id ASC`,
      [tenantId, id],
    );
    return result.rows;
  }
  async remove(tenantId: string, id: string) {
    this.requireTenant(tenantId);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Lock the parent before checking children: new FK references must wait.
      const owned = await client.query(
        `SELECT c.id,c.lead_id FROM assistant.conversations c
         INNER JOIN tenants t ON t.slug=c.tenant_slug
         WHERE t.id=$1 AND c.id=$2 FOR UPDATE OF c`,
        [tenantId, id],
      );
      if (!owned.rows.length)
        throw new NotFoundException('Conversation not found');
      const leads = await client.query(
        'SELECT 1 FROM assistant.leads WHERE conversation_id=$1 LIMIT 1',
        [id],
      );
      if (owned.rows[0].lead_id || leads.rows.length)
        throw new ConflictException(
          'Conversations with linked leads cannot be deleted',
        );
      // Messages cascade with the parent; saved pilot state lives on the parent.
      await client.query('DELETE FROM assistant.conversations WHERE id=$1', [
        id,
      ]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
