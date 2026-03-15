export class CreateAssistantLeadDto {
  tenantSlug!: string;
  conversationId?: string | null;
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  serviceType?: string | null;
  summary?: string | null;
  messages!: Array<{
    role: 'user' | 'assistant';
    text: string;
    created_at?: string;
  }>;
}
