import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

@Injectable()
export class PlatformAiUsageRepository {
  constructor(private readonly db: TenantDb) {}

  async getSummary() {
    const totalsRes = await this.db.systemQuery<{
      today_cost_usd: string | number | null;
      month_cost_usd: string | number | null;
      total_calls: string | number | null;
      total_tokens: string | number | null;
    }>(`
      select
        coalesce(sum(case when created_at >= date_trunc('day', now()) then estimated_cost_usd end), 0) as today_cost_usd,
        coalesce(sum(case when created_at >= date_trunc('month', now()) then estimated_cost_usd end), 0) as month_cost_usd,
        count(*) as total_calls,
        coalesce(sum(total_tokens), 0) as total_tokens
      from assistant.ai_usage
    `);

    const byFeatureRes = await this.db.systemQuery<{
      feature: string;
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
    }>(`
      select
        feature,
        count(*) as calls,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(estimated_cost_usd), 0) as total_cost_usd
      from assistant.ai_usage
      group by feature
      order by total_cost_usd desc
    `);

    const totals = totalsRes.rows[0];

    return {
      totals: {
        todayCostUsd: Number(totals?.today_cost_usd ?? 0),
        monthCostUsd: Number(totals?.month_cost_usd ?? 0),
        totalCalls: Number(totals?.total_calls ?? 0),
        totalTokens: Number(totals?.total_tokens ?? 0),
      },
      byFeature: byFeatureRes.rows.map((row) => ({
        feature: row.feature,
        calls: Number(row.calls ?? 0),
        totalTokens: Number(row.total_tokens ?? 0),
        totalCostUsd: Number(row.total_cost_usd ?? 0),
      })),
    };
  }

  async listTenants() {
    const res = await this.db.systemQuery<{
      tenant_slug: string | null;
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
      today_cost_usd: string | number | null;
      month_cost_usd: string | number | null;
    }>(`
      select
        tenant_slug,
        count(*) as calls,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(estimated_cost_usd), 0) as total_cost_usd,
        coalesce(sum(case when created_at >= date_trunc('day', now()) then estimated_cost_usd end), 0) as today_cost_usd,
        coalesce(sum(case when created_at >= date_trunc('month', now()) then estimated_cost_usd end), 0) as month_cost_usd
      from assistant.ai_usage
      group by tenant_slug
      order by total_cost_usd desc
    `);

    return res.rows.map((row) => ({
      tenantSlug: row.tenant_slug ?? 'unknown',
      calls: Number(row.calls ?? 0),
      totalTokens: Number(row.total_tokens ?? 0),
      totalCostUsd: Number(row.total_cost_usd ?? 0),
      todayCostUsd: Number(row.today_cost_usd ?? 0),
      monthCostUsd: Number(row.month_cost_usd ?? 0),
    }));
  }

  async getTenantDetail(tenantSlug: string) {
    const totalsRes = await this.db.systemQuery<{
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
      today_cost_usd: string | number | null;
      month_cost_usd: string | number | null;
    }>(
      `
      select
        count(*) as calls,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(estimated_cost_usd), 0) as total_cost_usd,
        coalesce(sum(case when created_at >= date_trunc('day', now()) then estimated_cost_usd end), 0) as today_cost_usd,
        coalesce(sum(case when created_at >= date_trunc('month', now()) then estimated_cost_usd end), 0) as month_cost_usd
      from assistant.ai_usage
      where tenant_slug = $1
      `,
      [tenantSlug],
    );

    const byFeatureRes = await this.db.systemQuery<{
      feature: string;
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
    }>(
      `
      select
        feature,
        count(*) as calls,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(estimated_cost_usd), 0) as total_cost_usd
      from assistant.ai_usage
      where tenant_slug = $1
      group by feature
      order by total_cost_usd desc
      `,
      [tenantSlug],
    );

    const dailyTrendRes = await this.db.systemQuery<{
      day: string;
      feature: string;
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
    }>(
      `
      select
        date_trunc('day', created_at) as day,
        feature,
        count(*) as calls,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(estimated_cost_usd), 0) as total_cost_usd
      from assistant.ai_usage
      where tenant_slug = $1
      group by 1, 2
      order by day desc, feature
      `,
      [tenantSlug],
    );

    const topConversationsRes = await this.db.systemQuery<{
      conversation_id: string | null;
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
    }>(
      `
      select
        conversation_id,
        count(*) as calls,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(estimated_cost_usd), 0) as total_cost_usd
      from assistant.ai_usage
      where tenant_slug = $1
      group by conversation_id
      order by total_cost_usd desc
      limit 20
      `,
      [tenantSlug],
    );

    const totals = totalsRes.rows[0];

    return {
      tenantSlug,
      totals: {
        calls: Number(totals?.calls ?? 0),
        totalTokens: Number(totals?.total_tokens ?? 0),
        totalCostUsd: Number(totals?.total_cost_usd ?? 0),
        todayCostUsd: Number(totals?.today_cost_usd ?? 0),
        monthCostUsd: Number(totals?.month_cost_usd ?? 0),
      },
      byFeature: byFeatureRes.rows.map((row) => ({
        feature: row.feature,
        calls: Number(row.calls ?? 0),
        totalTokens: Number(row.total_tokens ?? 0),
        totalCostUsd: Number(row.total_cost_usd ?? 0),
      })),
      dailyTrend: dailyTrendRes.rows.map((row) => ({
        day: row.day,
        feature: row.feature,
        calls: Number(row.calls ?? 0),
        totalTokens: Number(row.total_tokens ?? 0),
        totalCostUsd: Number(row.total_cost_usd ?? 0),
      })),
      topConversations: topConversationsRes.rows.map((row) => ({
        conversationId: row.conversation_id,
        calls: Number(row.calls ?? 0),
        totalTokens: Number(row.total_tokens ?? 0),
        totalCostUsd: Number(row.total_cost_usd ?? 0),
      })),
    };
  }
}
