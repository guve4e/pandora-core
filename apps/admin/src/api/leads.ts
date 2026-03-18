import { http } from '@org/admin-core';

export interface LeadRow {
  id: string;
  tenant_slug: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  service_type: string | null;
  summary: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
}

export interface LeadMessageRow {
  id: string;
  lead_id: string;
  role: 'user' | 'assistant';
  text: string;
  created_at: string;
}

export async function getTenantLeads(): Promise<LeadRow[]> {
  const { data } = await http.get<LeadRow[]>('/tenant/leads');
  return data;
}

export async function getTenantLead(id: string): Promise<LeadRow> {
  const { data } = await http.get<LeadRow>(`/tenant/leads/${id}`);
  return data;
}

export async function getTenantLeadMessages(id: string): Promise<LeadMessageRow[]> {
  const { data } = await http.get<LeadMessageRow[]>(`/tenant/leads/${id}/messages`);
  return data;
}

export async function updateTenantLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'scheduled' | 'won' | 'lost',
): Promise<LeadRow> {
  const { data } = await http.patch<LeadRow>(`/tenant/leads/${id}/status`, {
    status,
  });
  return data;
}
