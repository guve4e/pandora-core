import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import {
  LoginView,
  AcceptInviteView,
  installAdminAuthGuard,
} from '@org/admin-core';

import { adminModule } from '../admin.module';

const routes: RouteRecordRaw[] = [
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
  ...adminModule.routes,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

installAdminAuthGuard(router);

function getStoredRole(): string | null {
  try {
    const raw = localStorage.getItem('aiadvocate_auth');
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
