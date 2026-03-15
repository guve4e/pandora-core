import type { AssistantWidgetConfig } from './widget.types';

declare global {
  interface Window {
    AssistantWidgetConfig?: Partial<AssistantWidgetConfig>;
  }
}

const defaults: AssistantWidgetConfig = {
  apiBaseUrl: 'http://localhost:3002/assistant',
  tenantSlug: 'energrid',
  title: 'Energrid Assistant',
  welcomeMessage: 'Здравейте! С какво можем да помогнем?',
};

export function getWidgetConfig(): AssistantWidgetConfig {
  const runtime = window.AssistantWidgetConfig ?? {};

  return {
    apiBaseUrl: runtime.apiBaseUrl || defaults.apiBaseUrl,
    tenantSlug: runtime.tenantSlug || defaults.tenantSlug,
    title: runtime.title || defaults.title,
    welcomeMessage: runtime.welcomeMessage || defaults.welcomeMessage,
  };
}
