import type { AdminAppConfig } from '@org/admin-core';
import DashboardView from './views/DashboardView.vue';
import AiUsageView from './views/AiUsageView.vue';
import ConversationsView from './views/ConversationsView.vue';
import VisitorsView from './views/VisitorsView.vue';
import SettingsView from './views/SettingsView.vue';
import PlatformTenantsView from './views/PlatformTenantsView.vue';
import PlatformTenantDetailView from './views/PlatformTenantDetailView.vue';
import PlatformUsersView from './views/PlatformUsersView.vue';
import PlatformLeadsView from './views/PlatformLeadsView.vue';
import PlatformNotificationsView from './views/PlatformNotificationsView.vue';

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
    { to: '/platform/tenants', label: 'Platform · Tenants' },
    { to: '/platform/users', label: 'Platform · Users' },
    { to: '/platform/leads', label: 'Platform · Leads' },
    { to: '/platform/notifications', label: 'Platform · Notifications' },
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
      path: '/platform/tenants',
      name: 'platform-tenants',
      component: PlatformTenantsView,
    },
    {
      path: '/platform/tenants/:slug',
      name: 'platform-tenant-detail',
      component: PlatformTenantDetailView,
    },
    {
      path: '/platform/users',
      name: 'platform-users',
      component: PlatformUsersView,
    },
    {
      path: '/platform/leads',
      name: 'platform-leads',
      component: PlatformLeadsView,
    },
    {
      path: '/platform/notifications',
      name: 'platform-notifications',
      component: PlatformNotificationsView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
};
