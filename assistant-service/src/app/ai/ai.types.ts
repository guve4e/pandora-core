export interface AssistantChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantChatInput {
  tenantSlug: string;
  message: string;
  history?: AssistantChatTurn[];
}

export interface BusinessProfile {
  businessName: string;
  businessDescription: string;
  knownFacts: string[];
  services: string[];
  contactPrompt: string | null;
  tone: string | null;
  language: string;
  features: {
    estimatorEnabled: boolean;
  };
  estimator: {
    provider: string | null;
    tenantKey: string | null;
    mode: string | null;
    hints: string[];
  };
}

export interface AssistantChatResult {
  reply: string;
  model: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  meta?: Record<string, unknown>;
}

export interface ConversationAnalysisResult {
  summary: string;
  intent: string;
  city: string | null;
  serviceType: string | null;
  leadScore: number;
  model: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  meta?: Record<string, unknown>;
}
