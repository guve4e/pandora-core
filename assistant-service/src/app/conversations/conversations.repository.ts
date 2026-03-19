import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

export interface AssistantConversationRow {
  id: string;
  tenant_slug: string;
  visitor_id: string | null;
  channel: string;
  status: string;
  lead_id: string | null;
  started_at: string;
  last_message_at: string;
  completed_at: string | null;
  meta: Record<string, unknown>;
}

export interface AssistantMessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  message_text: string;
  created_at: string;
  tokens_input: number | null;
  tokens_output: number | null;
  model: string | null;
  meta: Record<string, unknown>;
}

@Injectable()
export class ConversationsRepository {
  constructor(private readonly db: TenantDb) {}

  async updateAnalysis(
    conversationId: string,
    data: {
      summary: string;
      intent: string;
      city: string | null;
      serviceType: string | null;
      leadScore: number;
    },
  ) {
    await this.db.systemQuery(
      `
    UPDATE assistant.conversations
    SET
      summary = $2,
      intent = $3,
      city = $4,
      service_type = $5,
      lead_score = $6
    WHERE id = $1
    `,
      [
        conversationId,
        data.summary,
        data.intent,
        data.city,
        data.serviceType,
        data.leadScore,
      ],
    );
  }

  async createConversation(input: {
    tenantSlug: string;
    visitorId?: string;
    channel?: string;
  }): Promise<AssistantConversationRow> {
    const res = await this.db.systemQuery<AssistantConversationRow>(
      `
      INSERT INTO assistant.conversations (
        tenant_slug,
        visitor_id,
        channel,
        status,
        started_at,
        last_message_at,
        meta
      )
      VALUES ($1, $2, $3, 'active', now(), now(), '{}'::jsonb)
      RETURNING
        id,
        tenant_slug,
        visitor_id,
        channel,
        status,
        lead_id,
        started_at,
        last_message_at,
        completed_at,
        meta
      `,
      [input.tenantSlug, input.visitorId ?? null, input.channel ?? 'web'],
    );

    return res.rows[0];
  }

  async findConversationById(
    conversationId: string,
  ): Promise<AssistantConversationRow | null> {
    const res = await this.db.systemQuery<AssistantConversationRow>(
      `
      SELECT
        id,
        tenant_slug,
        visitor_id,
        channel,
        status,
        lead_id,
        started_at,
        last_message_at,
        completed_at,
        meta
      FROM assistant.conversations
      WHERE id = $1
      LIMIT 1
      `,
      [conversationId],
    );

    return res.rows[0] ?? null;
  }

  async setLeadId(conversationId: string, leadId: string): Promise<void> {
    await this.db.systemQuery(
      `
      UPDATE assistant.conversations
      SET lead_id = $2
      WHERE id = $1
      `,
      [conversationId, leadId],
    );
  }

  async insertMessage(input: {
    conversationId: string;
    role: 'user' | 'assistant';
    messageText: string;
    model?: string | null;
    tokensInput?: number | null;
    tokensOutput?: number | null;
    meta?: Record<string, unknown>;
  }): Promise<AssistantMessageRow> {
    const res = await this.db.systemQuery<AssistantMessageRow>(
      `
      INSERT INTO assistant.messages (
        conversation_id,
        role,
        message_text,
        model,
        tokens_input,
        tokens_output,
        meta,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING
        id,
        conversation_id,
        role,
        message_text,
        created_at,
        tokens_input,
        tokens_output,
        model,
        meta
      `,
      [
        input.conversationId,
        input.role,
        input.messageText,
        input.model ?? null,
        input.tokensInput ?? null,
        input.tokensOutput ?? null,
        JSON.stringify(input.meta ?? {}),
      ],
    );

    await this.db.systemQuery(
      `
      UPDATE assistant.conversations
      SET last_message_at = now()
      WHERE id = $1
      `,
      [input.conversationId],
    );

    return res.rows[0];
  }

  async listMessages(conversationId: string): Promise<AssistantMessageRow[]> {
    const res = await this.db.systemQuery<AssistantMessageRow>(
      `
      SELECT
        id,
        conversation_id,
        role,
        message_text,
        created_at,
        tokens_input,
        tokens_output,
        model,
        meta
      FROM assistant.messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [conversationId],
    );

    return res.rows;
  }
}
