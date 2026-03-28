import { Injectable, Logger } from '@nestjs/common';
import { OpenAiChatClient } from '@org/backend-ai';
import { getCoreApiConfig, getOpenAiConfig } from '../config';

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
  usage?: {
    model: string | null;
    tokensInput: number | null;
    tokensOutput: number | null;
    meta?: Record<string, unknown>;
  };
};

@Injectable()
export class LeadCaptureService {
  private readonly logger = new Logger(LeadCaptureService.name);
  private readonly openAiConfig = getOpenAiConfig();
  private readonly coreApiConfig = getCoreApiConfig();

  private readonly chatClient = this.openAiConfig.apiKey
    ? new OpenAiChatClient({
        apiKey: this.openAiConfig.apiKey,
        timeoutMs: this.openAiConfig.timeoutMs,
      })
    : null;

  async tryCapture(input: {
    tenantSlug: string;
    conversationId: string;
    messages: ChatMsg[];
  }): Promise<CapturedLeadResult> {
    const extraction = await this.extractLead(
      input.tenantSlug,
      input.conversationId,
      input.messages,
    );

    const extracted = extraction.extracted;

    if (!extracted?.phone?.trim()) {
      this.logger.log(
        `Lead not created for conversation ${input.conversationId}: phone missing`,
      );
      return {
        leadId: null,
        extracted,
        usage: extraction.usage,
      };
    }

    const res = await fetch(`${this.coreApiConfig.baseUrl}/internal/leads/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': this.coreApiConfig.internalToken,
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
        usage: extraction.usage,
      };
    }

    const lead = (await res.json()) as { id?: string };

    this.logger.log(
      `Lead captured for conversation ${input.conversationId}: ${lead.id ?? 'unknown-id'}`,
    );

    return {
      leadId: lead.id ?? null,
      extracted,
      usage: extraction.usage,
    };
  }

  private async extractLead(
    tenantSlug: string,
    conversationId: string,
    messages: ChatMsg[],
  ): Promise<{
    extracted: ExtractedLead | null;
    usage?: {
      model: string | null;
      tokensInput: number | null;
      tokensOutput: number | null;
      meta?: Record<string, unknown>;
    };
  }> {
    if (!this.openAiConfig.apiKey || !this.chatClient) {
      this.logger.warn('OPENAI_API_KEY missing; skipping lead extraction');
      return {
        extracted: null,
        usage: {
          model: null,
          tokensInput: null,
          tokensOutput: null,
          meta: {
            provider: 'openai',
            configured: false,
          },
        },
      };
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
      const result = await this.chatClient.generateText({
        model: this.openAiConfig.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.1,
        maxTokens: 200,
        context: {
          app: 'assistant',
          feature: 'lead_extraction',
          tenantSlug,
          conversationId,
        },
      });

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(result.data.text);
      } catch {
        parsed = {};
      }

      return {
        extracted: {
          name: (parsed.name as string | null) ?? null,
          phone: (parsed.phone as string | null) ?? null,
          city: (parsed.city as string | null) ?? null,
          serviceType: (parsed.serviceType as string | null) ?? null,
          summary: (parsed.summary as string | null) ?? null,
        },
        usage: {
          model: result.meta.model,
          tokensInput: result.usage.inputTokens,
          tokensOutput: result.usage.outputTokens,
          meta: {
            provider: result.meta.provider,
            latencyMs: result.meta.latencyMs,
            estimatedCostUsd: result.usage.estimatedCostUsd,
            totalTokens: result.usage.totalTokens,
            raw: result.raw ?? null,
          },
        },
      };
    } catch (error: any) {
      this.logger.error(`Lead extraction failed: ${error?.message}`, error?.stack);
      return {
        extracted: null,
        usage: {
          model: this.openAiConfig.model,
          tokensInput: null,
          tokensOutput: null,
          meta: {
            provider: 'openai',
            error: true,
          },
        },
      };
    }
  }
}
