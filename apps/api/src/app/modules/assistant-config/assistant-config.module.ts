import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { TenantsModule } from '../../core/tenants/tenants.module';
import { AssistantConfigController } from './assistant-config.controller';
import { AssistantConfigRepository } from './assistant-config.repository';
import { AssistantConfigService } from './assistant-config.service';

@Module({
  imports: [PgModule, TenantsModule],
  controllers: [AssistantConfigController],
  providers: [AssistantConfigRepository, AssistantConfigService],
  exports: [AssistantConfigService],
})
export class AssistantConfigModule {}
