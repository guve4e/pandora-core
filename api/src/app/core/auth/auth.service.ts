import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthUserRepository } from './auth-user.repository';
import { TenantsService } from '../tenants/tenants.service';
import { RegisterDto } from '../common/dto/auth.register.dto';

type SafeUser = {
  id: string;
  tenant_id: string;
  username: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: AuthUserRepository,
    private readonly tenants: TenantsService,
    private readonly jwtService: JwtService,
  ) {}

  async me(_tenantId: string, userId: string) {
    const user = await this.users.findByIdGlobal(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      tenant_id: user.tenant_id,
      username: user.username,
      role: user.role,
    };
  }

  async validateUser(input: {
    email: string;
    password: string;
  }): Promise<SafeUser> {
    const user = await this.users.findByEmailGlobal(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(input.password, user.password_hash);

    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      tenant_id: user.tenant_id,
      username: user.username,
      role: user.role,
    };
  }

  async login(user: SafeUser) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    const refreshHash = await bcrypt.hash(refresh_token, 10);
    await this.users.setRefreshTokenHashGlobal(user.id, refreshHash);

    return { access_token, refresh_token };
  }

  async register(dto: RegisterDto) {
    const tenant = await this.tenants.create({
      name: dto.tenantName,
      slug: dto.tenantSlug,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.users.createUser({
      tenantId: tenant.id,
      username: dto.username,
      passwordHash,
      role: dto.role ?? 'owner',
    });

    return { tenant };
  }

  async refreshToken(providedRefreshToken: string) {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(providedRefreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.findByIdGlobal(decoded.sub);
    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const ok = await bcrypt.compare(
      providedRefreshToken,
      user.refresh_token_hash,
    );
    if (!ok) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id,
      },
      { expiresIn: '15m' },
    );

    return { access_token: newAccessToken };
  }

  async logout(_tenantId: string, userId: string) {
    await this.users.setRefreshTokenHashGlobal(userId, null);
    return { message: 'Logged out successfully' };
  }
}
