import type { RouteRecordRaw } from 'vue-router';
import type { AdminMenuItem } from './types';

export type AdminAppConfig = {
  appName: string;
  appSubtitle: string;
  shellTitle: string;
  footerText: string;
  userInitials: string;
  menu: AdminMenuItem[];
  routes: RouteRecordRaw[];
};
