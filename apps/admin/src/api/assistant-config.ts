import { http } from '@org/admin-core';

export interface AssistantConfigDto {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  businessName: string;
  businessDescription: string;
  services: string[];
  facts: string[];
  contactPrompt: string | null;
  tone: string | null;
  language: string;
  isActive: boolean;
}

export async function getAssistantConfig(): Promise<AssistantConfigDto> {
  const { data } = await http.get<AssistantConfigDto>('/admin/assistant-config');
  return data;
}

export async function updateAssistantConfig(
  payload: Omit<AssistantConfigDto, 'tenantId' | 'tenantSlug' | 'tenantName'>,
): Promise<AssistantConfigDto> {
  const { data } = await http.put<AssistantConfigDto>(
    '/admin/assistant-config',
    payload,
  );
  return data;
}
