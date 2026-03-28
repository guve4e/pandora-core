import { Injectable } from '@nestjs/common';
import { TenantDb } from '@org/backend-db';

@Injectable()
export class TenantAiUsageRepository {
  constructor(private readonly db: TenantDb) {}

  async getTenantSummary(tenantId: string) {
    const totalsRes = await this.db.systemQuery<{
      tenant_slug: string | null;
      today_cost_usd: string | number | null;
      month_cost_usd: string | number | null;
      total_calls: string | number | null;
      total_tokens: string | number | null;
    }>(
      `
      select
        t.slug as tenant_slug,
        coalesce(sum(case when u.created_at >= date_trunc('day', now()) then u.estimated_cost_usd end), 0) as today_cost_usd,
        coalesce(sum(case when u.created_at >= date_trunc('month', now()) then u.estimated_cost_usd end), 0) as month_cost_usd,
        count(u.*) as total_calls,
        coalesce(sum(u.total_tokens), 0) as total_tokens
      from tenants t
      left join assistant.ai_usage u
        on u.tenant_slug = t.slug
      where t.id = $1
      group by t.slug
      `,
      [tenantId],
    );

    const byFeatureRes = await this.db.systemQuery<{
      feature: string;
      calls: string | number | null;
      total_tokens: string | number | null;
      total_cost_usd: string | number | null;
    }>(
      `
      select
        u.feature,
        count(*) as calls,
        coalesce(sum(u.total_tokens), 0) as total_tokens,
        coalesce(sum(u.estimated_cost_usd), 0) as total_cost_usd
      from assistant.ai_usage u
      inner join tenants t
        on t.slug = u.tenant_slug
      where t.id = $1
      group by u.feature
      order by total_cost_usd desc
      `,
      [tenantId],
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
        date_trunc('day', u.created_at) as day,
        u.feature,
        count(*) as calls,
        coalesce(sum(u.total_tokens), 0) as total_tokens,
        coalesce(sum(u.estimated_cost_usd), 0) as total_cost_usd
      from assistant.ai_usage u
      inner join tenants t
        on t.slug = u.tenant_slug
      where t.id = $1
      group by 1, 2
      order by day desc, u.feature
      `,
      [tenantId],
    );

    const totals = totalsRes.rows[0];

    return {
      tenantSlug: totals?.tenant_slug ?? 'unknown',
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
      dailyTrend: dailyTrendRes.rows.map((row) => ({
        day: row.day,
        feature: row.feature,
        calls: Number(row.calls ?? 0),
        totalTokens: Number(row.total_tokens ?? 0),
        totalCostUsd: Number(row.total_cost_usd ?? 0),
      })),
    };
  }
}
