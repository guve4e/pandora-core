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
}

export interface AssistantChatResult {
  reply: string;
}
