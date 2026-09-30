import { Module } from '@nestjs/common';
import { PilotController } from './pilot/pilot.controller';
import { PilotService } from './pilot/pilot.service';
import { PilotModelService } from './pilot/pilot-model.service';
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
  controllers: [ConversationsController, PilotController],
  providers: [
    PilotService,
    PilotModelService,
    ConversationsRepository,
    ConversationsService,
    AiUsageRepository,
    EstimatorClientService,
    EstimatorOrchestratorService,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
