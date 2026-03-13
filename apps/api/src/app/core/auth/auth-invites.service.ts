import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuthInvitesRepository } from './auth-invites.repository';
import { AuthUserRepository } from './auth-user.repository';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthInvitesService {
  constructor(
    private readonly invites: AuthInvitesRepository,
    private readonly users: AuthUserRepository,
    private readonly tenants: TenantsService,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async createInvite(input: {
    tenantSlug: string;
    email: string;
    role: string;
    createdByUserId?: string | null;
    expiresInHours?: number;
  }) {
    const tenant = await this.tenants.findBySlug(input.tenantSlug);
    if (!tenant) {
      throw new NotFoundException(`Tenant not found for slug: ${input.tenantSlug}`);
    }

    const existingUser = await this.users.findByEmailGlobal(input.email);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresInHours = input.expiresInHours ?? 72;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invite = await this.invites.create({
      tenantId: tenant.id,
      email: input.email,
      role: input.role,
      tokenHash,
      expiresAt,
      createdByUserId: input.createdByUserId ?? null,
    });

    return {
      invite,
      invite_url: `/accept-invite?token=${rawToken}`,
      raw_token: rawToken,
      tenant,
    };
  }

  async validateInviteToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const invite = await this.invites.findActiveByTokenHash(tokenHash);

    if (!invite) {
      throw new NotFoundException('Invite not found or already used.');
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Invite has expired.');
    }

    const tenant = await this.tenants.getById(invite.tenant_id);

    return {
      email: invite.email,
      role: invite.role,
      tenant_id: invite.tenant_id,
      tenant_slug: tenant?.slug ?? null,
      tenant_name: tenant?.name ?? null,
      expires_at: invite.expires_at,
    };
  }

  async acceptInvite(input: { token: string; password: string }) {
    const tokenHash = this.hashToken(input.token);
    const invite = await this.invites.findActiveByTokenHash(tokenHash);

    if (!invite) {
      throw new NotFoundException('Invite not found or already used.');
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Invite has expired.');
    }

    const existingUser = await this.users.findByEmailGlobal(invite.email);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.users.createUser({
      tenantId: invite.tenant_id,
      email: invite.email,
      username: invite.email,
      passwordHash,
      role: invite.role,
    });

    await this.invites.markAccepted(invite.id);

    const tenant = await this.tenants.getById(invite.tenant_id);

    return {
      message: 'Invite accepted successfully.',
      email: invite.email,
      tenant_id: invite.tenant_id,
      tenant_slug: tenant?.slug ?? null,
    };
  }
}
