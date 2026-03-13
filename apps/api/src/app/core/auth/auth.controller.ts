import { Controller, Post, Body, Inject, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthInvitesService } from './auth-invites.service';
import type { LoggerService } from '../logging/types';
import { RegisterDto } from '../common/dto/auth.register.dto';
import { LoginDto } from '../common/dto/auth.login.dto';
import { ValidateInviteDto } from '../common/dto/validate-invite.dto';
import { AcceptInviteDto } from '../common/dto/accept-invite.dto';
import { Public } from '../common/lib/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authInvites: AuthInvitesService,
    @Inject('LOGGER_SERVICE') private readonly logger: LoggerService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const res = await this.authService.register(dto);

    await this.logger.log(
      `Registered tenant:${dto.tenantSlug} email:${dto.email}`,
    );

    return { message: 'Registered', ...res };
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser({
      email: body.email,
      password: body.password,
    });

    await this.logger.log(
      `User login email:${body.email} tenant:${user.tenant_id}`,
    );

    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Public()
  @Post('invites/validate')
  async validateInvite(@Body() dto: ValidateInviteDto) {
    return this.authInvites.validateInviteToken(dto.token);
  }

  @Public()
  @Post('invites/accept')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authInvites.acceptInvite(dto);
  }

  @Get('me')
  async me(@Request() req: any) {
    return this.authService.me(req.user.tenant_id, req.user.sub);
  }

  @Post('logout')
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.tenant_id, req.user.sub);
  }
}
