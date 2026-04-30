import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { AiModule } from '../ai/ai.module';
import { ChatModule } from '../chat/chat.module';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';
import { TenantValidationModule } from '../tenant-validation/tenant-validation.module';
import { AssistantConfigModule } from '../assistant-config/assistant-config.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsService } from './conversations.service';
import { AiUsageRepository } from './ai-usage.repository';
import { EstimatorClientService } from './estimator/estimator-client.service';
import { EstimatorOrchestratorService } from './estimator/estimator-orchestrator.service';

@Module({
  imports: [
    PgModule,
    AiModule,
    ChatModule,
    LeadCaptureModule,
    TenantValidationModule,
    AssistantConfigModule,
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsRepository,
    ConversationsService,
    AiUsageRepository,
    EstimatorClientService,
    EstimatorOrchestratorService,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
