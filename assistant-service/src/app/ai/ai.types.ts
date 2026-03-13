export interface AssistantChatInput {
  tenantSlug: string;
  message: string;
  history?: AssistantChatTurn[];
}

export interface AssistantChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantChatResult {
  reply: string;
}

export interface BusinessProfile {
  tenantSlug: string;
  businessName: string;
  businessDescription: string;
  knownFacts: string[];
  services: string[];
  contactPrompt: string | null;
  tone: string | null;
}
