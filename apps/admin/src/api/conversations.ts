import { http } from '@org/admin-core';

export interface ConversationRow {
  id: string;
  visitor_id: string | null;
  status: string;
  lead_id: string | null;
  has_lead: boolean;
  channel: string | null;
  started_at: string;
  last_message_at: string;
  last_message: string | null;
}

export interface ConversationMessageRow {
  role: 'user' | 'assistant';
  message_text: string;
  created_at: string;
}

export async function getTenantConversations(): Promise<ConversationRow[]> {
  const { data } = await http.get<ConversationRow[]>('/tenant/conversations');
  return data;
}

export async function deleteTenantConversation(id: string): Promise<void> {
  await http.delete(`/tenant/conversations/${id}`);
}

export async function getTenantConversationMessages(
  id: string,
): Promise<ConversationMessageRow[]> {
  const { data } = await http.get<ConversationMessageRow[]>(
    `/tenant/conversations/${id}/messages`,
  );
  return data;
}
