import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import {
  IntakeSession,
  IntakeExtractedFields,
} from './intake.types';
import { IntakeExtractorService } from './intake-extractor.service';
import { AiService } from '../../core/ai/ai.service';
import { LeadsService } from '../leads/leads.service';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { PG_POOL } from '../../core/db/pg.tokens';

@Injectable()
export class IntakeService {
  private sessions = new Map<string, IntakeSession>();

  constructor(
    private readonly extractor: IntakeExtractorService,
    private readonly ai: AiService,
    private readonly leads: LeadsService,
    private readonly notifications: NotificationsService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  async createSession(tenantSlug: string): Promise<IntakeSession> {
    const tenantRes = await this.pool.query<{ id: string }>(
      `
      SELECT id
      FROM tenants
      WHERE slug = $1
      LIMIT 1
      `,
      [tenantSlug],
    );

    const tenant = tenantRes.rows[0];
    if (!tenant) {
      throw new NotFoundException(`Tenant not found for slug: ${tenantSlug}`);
    }

    const session: IntakeSession = {
      id: randomUUID(),
      tenant_id: tenant.id,
      tenant_slug: tenantSlug,
      messages: [
        {
          id: randomUUID(),
          role: 'assistant',
          text: 'Здравейте. Опишете накратко какво ви трябва, в кой град е обектът и оставете телефон за връзка.',
          created_at: new Date().toISOString(),
        },
      ],
      status: 'collecting',
      fields: {
        name: null,
        phone: null,
        city: null,
        serviceType: null,
        summary: null,
      },
      lead_id: null,
      created_at: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): IntakeSession | null {
    return this.sessions.get(id) ?? null;
  }

  async addUserMessage(sessionId: string, text: string): Promise<IntakeSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (!session.tenant_id) {
      this.sessions.delete(sessionId);
      throw new NotFoundException('Session invalid, please start a new one.');
    }

    session.messages.push({
      id: randomUUID(),
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    });

    let extracted = this.extractor.extract(text);

    try {
      const aiExtracted = await this.ai.extractLeadFields(text);
      extracted = {
        ...extracted,
        ...aiExtracted,
      };
    } catch {
      // keep heuristic extraction if AI fails
    }

    session.fields = this.mergeFields(session.fields, extracted);

    const nowComplete = this.isComplete(session.fields);
    if (nowComplete) {
      session.status = 'completed';

      if (!session.lead_id) {
        const lead = await this.leads.createLead({
          tenantSlug: session.tenant_slug,
          name: session.fields.name,
          phone: session.fields.phone,
          city: session.fields.city,
          serviceType: session.fields.serviceType,
          summary: session.fields.summary,
        });

        session.lead_id = lead.id;

        await this.leads.saveLeadMessages(
          lead.id,
          session.messages.map((m) => ({
            role: m.role,
            text: m.text,
            created_at: m.created_at,
          })),
        );

        console.log('[intake] creating notification for tenant', session.tenant_id);

        await this.notifications.create({
          tenantId: session.tenant_id,
          userId: null,
          type: 'lead.new',
          title: 'Нова заявка',
          message: `${session.fields.city ?? 'Без град'} · ${session.fields.serviceType ?? 'услуга'} · ${session.fields.phone ?? ''}`,
          severity: 'info',
          channels: ['in_app'],
          entityType: 'lead',
          entityId: lead.id,
          link: `/leads/${lead.id}`,
          meta: {
            source: 'chat',
            tenantSlug: session.tenant_slug,
            summary: session.fields.summary,
          },
        });
      }
    }

    const reply = this.buildAssistantReply(session);

    session.messages.push({
      id: randomUUID(),
      role: 'assistant',
      text: reply,
      created_at: new Date().toISOString(),
    });

    if (session.status === 'completed' && session.lead_id) {
      const lastAssistant = session.messages[session.messages.length - 1];
      await this.leads.saveLeadMessages(session.lead_id, [
        {
          role: lastAssistant.role,
          text: lastAssistant.text,
          created_at: lastAssistant.created_at,
        },
      ]);
    }

    return session;
  }

  private mergeFields(
    current: IntakeExtractedFields,
    incoming: IntakeExtractedFields,
  ): IntakeExtractedFields {
    return {
      name: current.name || incoming.name || null,
      phone: current.phone || incoming.phone || null,
      city: current.city || incoming.city || null,
      serviceType: current.serviceType || incoming.serviceType || null,
      summary: this.pickBetterSummary(current.summary, incoming.summary),
    };
  }

  private pickBetterSummary(
    current?: string | null,
    incoming?: string | null,
  ): string | null {
    if (incoming && incoming.length > (current?.length ?? 0)) {
      return incoming;
    }

    return current ?? null;
  }

  private isComplete(fields: IntakeExtractedFields): boolean {
    return !!fields.phone && !!fields.city && !!fields.summary;
  }

  private buildAssistantReply(session: IntakeSession): string {
    const { phone, city, summary } = session.fields;

    if (!city) {
      return 'В кой град или район е обектът?';
    }

    if (!phone) {
      return 'Може ли телефон за връзка, за да се свържем с вас?';
    }

    if (!summary) {
      return 'Опишете накратко каква работа трябва да се свърши.';
    }

    return 'Благодаря. Заявката е записана и ще се свържем с вас.';
  }
}
