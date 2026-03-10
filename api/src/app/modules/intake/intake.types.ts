export type IntakeMessageRole = 'user' | 'assistant';

export interface IntakeMessage {
  id: string;
  role: IntakeMessageRole;
  text: string;
  created_at: string;
}

export interface IntakeExtractedFields {
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  serviceType?: string | null;
  summary?: string | null;
}

export interface IntakeSession {
  id: string;
  tenant_id: string;
  tenant_slug: string;
  messages: IntakeMessage[];
  status: 'collecting' | 'completed';
  fields: IntakeExtractedFields;
  created_at: string;
}
