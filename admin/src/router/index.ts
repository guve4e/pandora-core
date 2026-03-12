import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import {
  LoginView,
  AcceptInviteView,
  installAdminAuthGuard,
  useAuthStore,
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

router.beforeEach((to) => {
  if (to.meta?.public) return true;

  const auth = useAuthStore();
  auth.loadFromStorage();

  const isPlatformOwner = auth.role === 'platform_owner';

  if (to.meta?.platformOnly && !isPlatformOwner) {
    return '/';
  }

  if (to.meta?.tenantOnly && isPlatformOwner) {
    return '/platform/tenants';
  }

  return true;
});

export default router;
