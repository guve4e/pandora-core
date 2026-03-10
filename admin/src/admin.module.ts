import type { AdminAppConfig } from '@org/admin-core';
import DashboardView from './views/DashboardView.vue';
import AiUsageView from './views/AiUsageView.vue';
import ConversationsView from './views/ConversationsView.vue';
import VisitorsView from './views/VisitorsView.vue';
import SettingsView from './views/SettingsView.vue';

export const adminModule: AdminAppConfig = {
  appName: 'AIAdvocate',
  appSubtitle: 'Internal tools for AIAdvocate.',
  shellTitle: 'Internal system console',
  footerText: 'v0.1 · internal',
  userInitials: 'VK',

  menu: [
    { to: '/', label: 'Dashboard' },
    { to: '/ai-usage', label: 'AI Usage' },
    { to: '/conversations', label: 'Conversations' },
    { to: '/visitors', label: 'Visitors' },
    { to: '/settings', label: 'Settings' },
  ],

  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/ai-usage',
      name: 'ai-usage',
      component: AiUsageView,
    },
    {
      path: '/conversations',
      name: 'conversations',
      component: ConversationsView,
    },
    {
      path: '/visitors',
      name: 'visitors',
      component: VisitorsView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
};
