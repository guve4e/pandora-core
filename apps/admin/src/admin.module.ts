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
import TenantLeadsView from './views/TenantLeadsView.vue';
import LeadDetailView from './views/LeadDetailView.vue';

export const adminModule = {
  appName: 'AIAdvocate',
  appSubtitle: 'Internal tools for AIAdvocate.',
  shellTitle: 'Internal system console',
  footerText: 'v0.1 · internal',
  userInitials: 'VK',

  platformMenu: [
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

  tenantMenu: [
    { to: '/', label: 'Dashboard' },
    { to: '/leads', label: 'Leads' },
    { to: '/conversations', label: 'Conversations' },
    { to: '/visitors', label: 'Visitors' },
    { to: '/assistant-config', label: 'Assistant' },
    { to: '/settings', label: 'Settings' },
  ],

  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { tenantOnly: true, platformOnly: false },
    },
    {
      path: '/ai-usage',
      name: 'ai-usage',
      component: AiUsageView,
      meta: { tenantOnly: false, platformOnly: true },
    },
    {
      path: '/leads',
      name: 'tenant-leads',
      component: TenantLeadsView,
      meta: { tenantOnly: true, platformOnly: false },
    },
    {
      path: '/leads/:id',
      name: 'tenant-lead-detail',
      component: LeadDetailView,
      meta: { tenantOnly: true, platformOnly: false },
    },
    {
      path: '/conversations',
      name: 'conversations',
      component: ConversationsView,
      meta: { tenantOnly: true, platformOnly: false },
    },
    {
      path: '/visitors',
      name: 'visitors',
      component: VisitorsView,
      meta: { tenantOnly: true, platformOnly: false },
    },
    {
      path: '/platform/tenants',
      name: 'platform-tenants',
      component: PlatformTenantsView,
      meta: { tenantOnly: false, platformOnly: true },
    },
    {
      path: '/platform/tenants/:slug',
      name: 'platform-tenant-detail',
      component: PlatformTenantDetailView,
      meta: { tenantOnly: false, platformOnly: true },
    },
    {
      path: '/platform/users',
      name: 'platform-users',
      component: PlatformUsersView,
      meta: { tenantOnly: false, platformOnly: true },
    },
    {
      path: '/platform/leads',
      name: 'platform-leads',
      component: PlatformLeadsView,
      meta: { tenantOnly: false, platformOnly: true },
    },
    {
      path: '/platform/notifications',
      name: 'platform-notifications',
      component: PlatformNotificationsView,
      meta: { tenantOnly: false, platformOnly: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { tenantOnly: true, platformOnly: false },
    },
  ],
};
