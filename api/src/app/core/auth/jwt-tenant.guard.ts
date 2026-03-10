import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/lib/decorators/public.decorator';
import type { JwtUser } from './auth.types';

@Injectable()
export class JwtTenantGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const ok = (await super.canActivate(context)) as boolean;

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtUser | undefined;

    if (!user?.tenant_id) {
      throw new UnauthorizedException('Missing tenant_id');
    }

    return ok;
  }
}
