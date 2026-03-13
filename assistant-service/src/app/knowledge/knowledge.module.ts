import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { KnowledgeService } from './knowledge.service';
import { AssistantConfigRepository } from './assistant-config.repository';

@Module({
  imports: [PgModule],
  providers: [KnowledgeService, AssistantConfigRepository],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
