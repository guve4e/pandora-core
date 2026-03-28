import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

@Injectable()
export class AiUsageRepository {
  constructor(private readonly db: TenantDb) {}

  async insertUsage(input: {
    provider: string;
    model: string;
    app: string;
    feature: string;
    tenantSlug?: string | null;
    conversationId?: string | null;
    visitorId?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    estimatedCostUsd?: number | null;
    latencyMs?: number | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.systemQuery(
      `
      INSERT INTO assistant.ai_usage (
        provider,
        model,
        app,
        feature,
        tenant_slug,
        conversation_id,
        visitor_id,
        input_tokens,
        output_tokens,
        total_tokens,
        estimated_cost_usd,
        latency_ms,
        meta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
        input.provider,
        input.model,
        input.app,
        input.feature,
        input.tenantSlug ?? null,
        input.conversationId ?? null,
        input.visitorId ?? null,
        input.inputTokens ?? null,
        input.outputTokens ?? null,
        input.totalTokens ?? null,
        input.estimatedCostUsd ?? null,
        input.latencyMs ?? null,
        JSON.stringify(input.meta ?? {}),
      ],
    );
  }

  async getTodayUsage(tenantSlug: string): Promise<{
    totalCostUsd: number;
    totalTokens: number;
    calls: number;
  }> {
    const res = await this.db.systemQuery<{
      total_cost_usd: string | number | null;
      total_tokens: string | number | null;
      calls: string | number | null;
    }>(
      `
      SELECT
        COALESCE(SUM(estimated_cost_usd), 0) AS total_cost_usd,
        COALESCE(SUM(total_tokens), 0) AS total_tokens,
        COUNT(*) AS calls
      FROM assistant.ai_usage
      WHERE tenant_slug = $1
        AND created_at >= date_trunc('day', now())
      `,
      [tenantSlug],
    );

    const row = res.rows[0];

    return {
      totalCostUsd: Number(row?.total_cost_usd ?? 0),
      totalTokens: Number(row?.total_tokens ?? 0),
      calls: Number(row?.calls ?? 0),
    };
  }
}
