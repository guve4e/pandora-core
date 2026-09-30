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
  customerHistory?: string[];
}

export interface EstimatorExplanationResult {
  steps: string[];
  summaryBg: string;
}

export interface EstimatorAssistantStepResponse {
  status: 'needs_input' | 'preview' | 'updated_preview' | 'explanation' | 'proposal' | 'needs_inspection';
  rangePreview?: { min: number; max: number; currency: 'EUR'; needsInspection: boolean; lines: unknown[] };
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
    const endpoint = input.tenantSlug === 'energrid' ? 'assistant-step-v2' : 'assistant-step';
    const res = await fetch(`${this.config.baseUrl}/estimator/${endpoint}`, {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      this.logger.error(`Energrid assistant-step failed: ${res.status}`);
      throw new Error(`Energrid assistant-step failed: ${res.status}`);
    }

    this.logger.log(
      `estimator engine responded tenant=${input.tenantSlug} status=${res.status}`,
    );

    return (await res.json()) as EstimatorAssistantStepResponse;
  }
}
