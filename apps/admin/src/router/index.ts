import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import AiUsageView from '../views/AiUsageView.vue';
import TenantAiUsageView from '../views/TenantAiUsageView.vue';
import {
  LoginView,
  AcceptInviteView,
  installAdminAuthGuard,
} from '@org/admin-core';

import { adminModule } from '../admin.module';
import AssistantConfigView from '../views/AssistantConfigView.vue';
import TenantLeadsView from '../views/TenantLeadsView.vue';
import LeadDetailView from '../views/LeadDetailView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/ai-usage',
    name: 'tenant-ai-usage',
    component: TenantAiUsageView,
  },
  {
    path: '/platform/ai-usage',
    name: 'platform-ai-usage',
    component: AiUsageView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/accept-invite',
    name: 'acceptInvite',
    component: AcceptInviteView,
    meta: { public: true },
  },
  {
    path: '/assistant-config',
    name: 'assistantConfig',
    component: AssistantConfigView,
  },
  {
    path: '/tenant-leads',
    name: 'tenantLeads',
    component: TenantLeadsView,
  },
  {
    path: '/tenant-leads/:id',
    name: 'tenantLeadDetail',
    component: LeadDetailView,
  },
  ...adminModule.routes,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

installAdminAuthGuard(router);

function getStoredRole(): string | null {
  try {
    const raw = localStorage.getItem('pandora_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.role ?? null;
  } catch {
    return null;
  }
}

router.beforeEach((to) => {
  if (to.meta?.public) return true;

  const role = getStoredRole();
  const isPlatformOwner = role === 'platform_owner';

  if (to.meta?.platformOnly && !isPlatformOwner) {
    return '/';
  }

  if (to.meta?.tenantOnly && isPlatformOwner) {
    return '/platform/tenants';
  }

  return true;
});

export default router;
