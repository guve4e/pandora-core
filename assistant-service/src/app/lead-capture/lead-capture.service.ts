import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';

type ChatMsg = {
  role: 'user' | 'assistant';
  text: string;
  created_at?: string;
};

type ExtractedLead = {
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  serviceType?: string | null;
  summary?: string | null;
};

type CapturedLeadResult = {
  leadId: string | null;
  extracted: ExtractedLead | null;
};

@Injectable()
export class LeadCaptureService {
  private readonly logger = new Logger(LeadCaptureService.name);
  private readonly model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async tryCapture(input: {
    tenantSlug: string;
    conversationId: string;
    messages: ChatMsg[];
  }): Promise<CapturedLeadResult> {
    const extracted = await this.extractLead(input.messages);

    if (!extracted?.phone?.trim()) {
      this.logger.log(
        `Lead not created for conversation ${input.conversationId}: phone missing`,
      );
      return {
        leadId: null,
        extracted,
      };
    }

    const apiBase = process.env.CORE_API_BASE_URL || 'http://localhost:3001/api';
    const internalToken = process.env.INTERNAL_API_TOKEN || '';

    const res = await fetch(`${apiBase}/internal/leads/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({
        tenantSlug: input.tenantSlug,
        conversationId: input.conversationId,
        ...extracted,
        messages: input.messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(
        `Lead capture failed for conversation ${input.conversationId}: ${res.status} ${text}`,
      );
      return {
        leadId: null,
        extracted,
      };
    }

    const lead = (await res.json()) as { id?: string };

    this.logger.log(
      `Lead captured for conversation ${input.conversationId}: ${lead.id ?? 'unknown-id'}`,
    );

    return {
      leadId: lead.id ?? null,
      extracted,
    };
  }

  private async extractLead(messages: ChatMsg[]): Promise<ExtractedLead | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY missing; skipping lead extraction');
      return null;
    }

    const convo = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');

    const system = `
Extract business lead data from the conversation.

Rules:
- Return JSON only.
- Extract only what is explicitly present or strongly implied.
- If a field is unknown, return null.
- phone is the key field for creating a lead.
- Use keys exactly:
  name
  phone
  city
  serviceType
  summary
`.trim();

    const user = `
Conversation:
${convo}
`.trim();

    try {
      const res = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });

      const text = res.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(text);

      return {
        name: parsed.name ?? null,
        phone: parsed.phone ?? null,
        city: parsed.city ?? null,
        serviceType: parsed.serviceType ?? null,
        summary: parsed.summary ?? null,
      };
    } catch (error: any) {
      this.logger.error(`Lead extraction failed: ${error?.message}`, error?.stack);
      return null;
    }
  }
}
