import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResult } from 'pg';
import { PG_POOL } from './pg.tokens';

@Injectable()
export class TenantDb {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async systemQuery<T = any>(
    sql: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  async tenantQuery<T = any>(
    tenantId: string,
    sql: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    if (!tenantId) {
      throw new Error('TenantDb.tenantQuery(): tenantId is required');
    }

    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    const isInsert = normalizedSql.startsWith('insert into');
    const isSelectUpdateDelete =
      normalizedSql.startsWith('select') ||
      normalizedSql.startsWith('update') ||
      normalizedSql.startsWith('delete');

    if (isInsert) {
      const hasTenantColumn =
        /\(\s*tenant_id\b/.test(normalizedSql) ||
        /,\s*tenant_id\b/.test(normalizedSql);

      const hasValuesFirstParam = /values\s*\(\s*\$1\b/.test(normalizedSql);

      if (!hasTenantColumn || !hasValuesFirstParam) {
        throw new Error(
          `TenantDb.tenantQuery(): INSERT must include tenant_id and use $1 for tenantId.\nSQL: ${sql}`,
        );
      }
    } else if (isSelectUpdateDelete) {
      const hasTenantFilter =
        /tenant_id\s*=\s*\$1\b/.test(normalizedSql) ||
        /tenant_id\s*=\s*any\s*\(/.test(normalizedSql) ||
        /tenant_id\s+in\s*\(/.test(normalizedSql);

      if (!hasTenantFilter) {
        throw new Error(
          `TenantDb.tenantQuery(): SQL missing tenant_id filter.\nSQL: ${sql}`,
        );
      }
    } else {
      throw new Error(
        `TenantDb.tenantQuery(): unsupported tenant-scoped SQL statement.\nSQL: ${sql}`,
      );
    }

    return this.pool.query<T>(sql, [tenantId, ...params]);
  }
}
