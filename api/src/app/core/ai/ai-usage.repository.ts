import { Injectable, Logger } from '@nestjs/common';
import { TenantDb } from '../db/tenant-db';

export interface AiUsageLogInput {
  kind: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd?: number | null;
  extra?: Record<string, any>;
}

export interface DailyUsageStatRow {
  day: string;
  call_count: number;
  total_tokens: string;
  total_cost_usd: string | null;
}

export interface KindUsageStatRow {
  kind: string;
  call_count: number;
  total_tokens: string;
  total_cost_usd: string | null;
}

@Injectable()
export class AiUsageRepository {
  private readonly logger = new Logger(AiUsageRepository.name);

  constructor(private readonly db: TenantDb) {}

  async create(data: AiUsageLogInput): Promise<void> {
    try {
      await this.db.tenantQuery(
        `INSERT INTO ai_usage_logs
           (tenant_id, kind, model, input_tokens, output_tokens, total_tokens, cost_usd, extra, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          data.kind,
          data.model,
          data.inputTokens,
          data.outputTokens,
          data.totalTokens,
          data.costUsd ?? null,
          data.extra ? JSON.stringify(data.extra) : null,
        ],
      );
    } catch (e) {
      this.logger.warn(`Failed to insert AI usage log: ${(e as Error).message}`);
    }
  }

  async getDailyStats(days: number): Promise<DailyUsageStatRow[]> {
    const sql = `
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)::int                                AS call_count,
        COALESCE(SUM(total_tokens), 0)::bigint       AS total_tokens,
        COALESCE(SUM(cost_usd), 0)::numeric(12,6)    AS total_cost_usd
      FROM ai_usage_logs
      WHERE tenant_id = $1
        AND created_at >= NOW() - ($2::int || ' days')::interval
      GROUP BY 1
      ORDER BY 1 DESC;
    `;
    const res = await this.db.tenantQuery<DailyUsageStatRow>(sql, [days]);
    return res.rows;
  }

  async getKindStats(from?: Date, to?: Date): Promise<KindUsageStatRow[]> {
    const sql = `
      SELECT
        kind,
        COUNT(*)::int                             AS call_count,
        COALESCE(SUM(total_tokens), 0)::bigint    AS total_tokens,
        COALESCE(SUM(cost_usd), 0)::numeric(12,6) AS total_cost_usd
      FROM ai_usage_logs
      WHERE tenant_id = $1
        AND ($2::timestamptz IS NULL OR created_at >= $2)
        AND ($3::timestamptz IS NULL OR created_at <= $3)
      GROUP BY kind
      ORDER BY kind;
    `;
    const res = await this.db.tenantQuery<KindUsageStatRow>(sql, [
      from ?? null,
      to ?? null,
    ]);
    return res.rows;
  }
}
