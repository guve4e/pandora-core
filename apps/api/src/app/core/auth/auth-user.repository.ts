import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { TenantDb } from '@org/backend-db';
import { PG_POOL } from '@org/backend-db';

export type AuthUserRow = {
  id: string;
  tenant_id: string;
  username: string | null;
  email: string;
  password_hash: string;
  role: string;
  refresh_token_hash: string | null;
  created_at: string;
};

@Injectable()
export class AuthUserRepository {
  constructor(
    private readonly db: TenantDb,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  async findByEmailGlobal(email: string): Promise<AuthUserRow | null> {
    const res = await this.pool.query<AuthUserRow>(
      `
      SELECT
        id,
        tenant_id,
        username,
        email,
        password_hash,
        role,
        refresh_token_hash,
        created_at
      FROM auth_users
      WHERE lower(email) = lower($1)
      LIMIT 1
      `,
      [email],
    );

    return res.rows[0] ?? null;
  }

  async findByIdGlobal(id: string): Promise<AuthUserRow | null> {
    const res = await this.pool.query<AuthUserRow>(
      `
      SELECT
        id,
        tenant_id,
        username,
        email,
        password_hash,
        role,
        refresh_token_hash,
        created_at
      FROM auth_users
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return res.rows[0] ?? null;
  }

  async setRefreshTokenHashGlobal(
    id: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE auth_users
      SET refresh_token_hash = $2
      WHERE id = $1
      `,
      [id, refreshTokenHash],
    );
  }

  async createUser(input: {
    tenantId: string;
    email: string;
    passwordHash: string;
    role?: string;
    username?: string | null;
  }): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO auth_users (tenant_id, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        input.tenantId,
        input.username ?? null,
        input.email,
        input.passwordHash,
        input.role ?? 'user',
      ],
    );
  }
}
