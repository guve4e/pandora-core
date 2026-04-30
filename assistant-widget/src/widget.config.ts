import type { AssistantWidgetConfig } from './widget.types';

declare global {
  interface Window {
    AssistantWidgetConfig?: Partial<AssistantWidgetConfig>;
  }
}

const defaults: AssistantWidgetConfig = {
  apiBaseUrl: 'http://localhost:3010/assistant',
  tenantSlug: 'energrid',
  title: 'Energrid Assistant',
  subtitle: 'AI асистент за запитвания, огледи и оферти',
  welcomeMessage:
    'Здравейте! Аз съм AI асистентът на Energrid. Мога да помогна със запитвания за електроинсталации, табла, огледи и ориентировъчни оферти.',
  disclaimer:
    'Оставете телефон и кратко описание, за да се свържем с вас по-бързо.',
  launcherLabel: 'Запитване',
};

export function getWidgetConfig(): AssistantWidgetConfig {
  const runtime = window.AssistantWidgetConfig ?? {};

  return {
    apiBaseUrl: runtime.apiBaseUrl || defaults.apiBaseUrl,
    tenantSlug: runtime.tenantSlug || defaults.tenantSlug,
    title: runtime.title || defaults.title,
    subtitle: runtime.subtitle || defaults.subtitle,
    welcomeMessage: runtime.welcomeMessage || defaults.welcomeMessage,
    disclaimer: runtime.disclaimer || defaults.disclaimer,
    launcherLabel: runtime.launcherLabel || defaults.launcherLabel,
  };
}
