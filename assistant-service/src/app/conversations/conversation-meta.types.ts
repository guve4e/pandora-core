export interface EstimatorPreviewSummary {
  subtotal: number;
  confidence: 'low' | 'medium' | 'high';
  needsInspection: boolean;
  linesCount: number;
}

export interface EstimatorExplanationSummary {
  stepsCount: number;
  summaryBg: string;
}

export type EstimatorStage = 'drafting' | 'previewed' | 'explained';

export interface EstimatorConversationMeta {
  stage?: EstimatorStage;
  coreDraft?: unknown;
  lastPreview?: EstimatorPreviewSummary;
  lastExplanation?: EstimatorExplanationSummary;
  lastOperation?: string;
}

export interface ConversationMeta {
  estimator?: EstimatorConversationMeta;
  [key: string]: unknown;
}
