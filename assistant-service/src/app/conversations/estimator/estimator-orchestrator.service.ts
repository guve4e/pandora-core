import { Injectable, Logger } from '@nestjs/common';
import type {
  ConversationMeta,
  EstimatorPreviewSummary,
} from '../conversation-meta.types';
import { EstimatorClientService } from './estimator-client.service';
import type { TenantAssistantProfile } from '../../assistant-config/assistant-config.service';

export interface EstimatorOrchestratorResult {
  handled: boolean;
  reply?: string;
  conversationMeta?: ConversationMeta;
  assistantMeta?: Record<string, unknown>;
}

@Injectable()
export class EstimatorOrchestratorService {
  private readonly logger = new Logger(EstimatorOrchestratorService.name);

  constructor(private readonly estimatorClient: EstimatorClientService) {}

  async runStep(input: {
    tenantSlug: string;
    message: string;
    conversationMeta?: Record<string, unknown> | null;
    profile: TenantAssistantProfile;
  }): Promise<EstimatorOrchestratorResult> {
    const meta = (input.conversationMeta ?? {}) as ConversationMeta;
    const existingCoreDraft = meta.estimator?.coreDraft;

    this.logger.log(
      `runStep tenant=${input.tenantSlug} message="${input.message}" hasDraft=${Boolean(existingCoreDraft)}`,
    );

    const result = await this.estimatorClient.assistantStep({
      tenantSlug: input.profile.estimator.tenantKey || input.tenantSlug,
      message: input.message,
      draft: existingCoreDraft,
    });

    const previewSummary: EstimatorPreviewSummary | undefined = result.preview
      ? {
          subtotal: result.preview.subtotal,
          confidence: result.preview.confidence,
          needsInspection: result.preview.needsInspection,
          linesCount: result.preview.lines.length,
        }
      : meta.estimator?.lastPreview;

    const stage =
      result.status === 'needs_input'
        ? 'drafting'
        : result.status === 'explanation'
          ? 'explained'
          : 'previewed';

    return {
      handled: true,
      reply: result.reply,
      conversationMeta: {
        ...meta,
        estimator: {
          ...(meta.estimator ?? {}),
          stage,
          coreDraft: result.draft,
          lastPreview: previewSummary,
          lastOperation: result.operation,
          lastExplanation: result.explanation
            ? {
                stepsCount: result.explanation.steps.length,
                summaryBg: result.explanation.summaryBg,
              }
            : meta.estimator?.lastExplanation,
        },
      },
      assistantMeta: {
        provider: 'energrid',
        estimator: true,
        stage,
        status: result.status,
        operation: result.operation,
        previewSummary,
        explanationSummary: result.explanation
          ? {
              stepsCount: result.explanation.steps.length,
              summaryBg: result.explanation.summaryBg,
            }
          : undefined,
      },
    };
  }
}
