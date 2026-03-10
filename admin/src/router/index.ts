import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { LoginView, installAdminAuthGuard } from '@org/admin-core';
import { adminModule } from '../admin.module';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  ...adminModule.routes,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

installAdminAuthGuard(router);

export default router;
