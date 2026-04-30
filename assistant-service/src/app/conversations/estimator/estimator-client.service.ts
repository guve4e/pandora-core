import { Injectable, Logger } from '@nestjs/common';
import { getEnergridApiConfig } from '../../config';

export interface EstimatorPreviewResult {
  currency: 'EUR';
  subtotal: number;
  confidence: 'low' | 'medium' | 'high';
  needsInspection: boolean;
  assumptions: string[];
  lines: Array<{
    code: string;
    label: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface EstimatorAssistantStepRequest {
  tenantSlug: string;
  message: string;
  draft?: unknown | null;
}

export interface EstimatorExplanationResult {
  steps: string[];
  summaryBg: string;
}

export interface EstimatorAssistantStepResponse {
  status: 'needs_input' | 'preview' | 'updated_preview' | 'explanation';
  operation?:
    | 'start_estimate'
    | 'fill_missing_field'
    | 'add_item'
    | 'update_item'
    | 'remove_item'
    | 'recalculate'
    | 'summarize'
    | 'explain'
    | 'unknown';
  reply: string;
  draft: unknown;
  preview?: EstimatorPreviewResult;
  explanation?: EstimatorExplanationResult;
}

@Injectable()
export class EstimatorClientService {
  private readonly logger = new Logger(EstimatorClientService.name);
  private readonly config = getEnergridApiConfig();

  async assistantStep(
    input: EstimatorAssistantStepRequest,
  ): Promise<EstimatorAssistantStepResponse> {
    const res = await fetch(`${this.config.baseUrl}/estimator/assistant-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Energrid assistant-step failed: ${res.status} ${text}`);
      throw new Error(`Energrid assistant-step failed: ${res.status}`);
    }

    this.logger.log(
      `estimator engine responded tenant=${input.tenantSlug} status=${res.status}`,
    );

    return (await res.json()) as EstimatorAssistantStepResponse;
  }
}
