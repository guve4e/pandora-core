import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './core/auth/auth.module';
import { AiModule } from './core/ai/ai.module';
import { TenantsModule } from './core/tenants/tenants.module';
import { NotificationsModule } from './core/notifications/notifications.module';

import { LoggingModule } from '@org/backend-logging';
import { JwtTenantGuard } from './core/auth/jwt-tenant.guard';
import { TenantContextModule } from './core/tenants/tenant-context.module';
import { ScheduleModule } from '@nestjs/schedule';

import { IntakeModule } from './modules/intake/intake.module';
import { PlatformModule } from './modules/platform/platform.module';
import { TenantLeadsModule } from './modules/tenant-leads/tenant-leads.module';
import { AssistantConfigModule } from './modules/assistant-config/assistant-config.module';
import { LeadsModule } from './modules/leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LoggingModule,
    TenantContextModule,
    AuthModule,
    AiModule,
    TenantsModule,
    NotificationsModule,
    IntakeModule,
    PlatformModule,
    TenantLeadsModule,
    AssistantConfigModule,
    LeadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtTenantGuard,
    },
  ],
})
export class AppModule {}
