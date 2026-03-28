import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { AssistantConfigService } from './assistant-config.service';
import { AssistantConfigRepository } from './assistant-config.repository';

@Module({
  imports: [PgModule],
  providers: [AssistantConfigService, AssistantConfigRepository],
  exports: [AssistantConfigService],
})
export class AssistantConfigModule {}
