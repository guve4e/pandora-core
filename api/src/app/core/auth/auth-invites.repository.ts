import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@org/backend-db';

export type AuthInviteRow = {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  token_hash: string;
  expires_at: string;
  accepted_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
};

@Injectable()
export class AuthInvitesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(input: {
    tenantId: string;
    email: string;
    role: string;
    tokenHash: string;
    expiresAt: Date;
    createdByUserId?: string | null;
  }): Promise<AuthInviteRow> {
    const { rows } = await this.pool.query<AuthInviteRow>(
      `
      INSERT INTO auth_invites (
        tenant_id,
        email,
        role,
        token_hash,
        expires_at,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        input.tenantId,
        input.email,
        input.role,
        input.tokenHash,
        input.expiresAt.toISOString(),
        input.createdByUserId ?? null,
      ],
    );

    return rows[0];
  }

  async findActiveByTokenHash(tokenHash: string): Promise<AuthInviteRow | null> {
    const { rows } = await this.pool.query<AuthInviteRow>(
      `
      SELECT *
      FROM auth_invites
      WHERE token_hash = $1
        AND accepted_at IS NULL
      LIMIT 1
      `,
      [tokenHash],
    );

    return rows[0] ?? null;
  }

  async markAccepted(id: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE auth_invites
      SET accepted_at = NOW()
      WHERE id = $1
      `,
      [id],
    );
  }
}
