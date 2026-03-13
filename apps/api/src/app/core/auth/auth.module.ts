import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantsModule } from '../tenants/tenants.module';
import { PgModule } from '@org/backend-db';
import { LoggingModule } from '@org/backend-logging';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthInvitesService } from './auth-invites.service';
import { AuthUserRepository } from './auth-user.repository';
import { AuthInvitesRepository } from './auth-invites.repository';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TenantsModule,
    ConfigModule,
    PgModule,
    LoggingModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthInvitesService,
    AuthUserRepository,
    AuthInvitesRepository,
    JwtStrategy,
  ],
  exports: [AuthService, AuthInvitesService],
})
export class AuthModule {}
