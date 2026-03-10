import type { Router, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../auth/auth.store';

export function createAdminAuthGuard() {
  let authBootstrapPromise: Promise<boolean> | null = null;

  return async (to: RouteLocationNormalized) => {
    const auth = useAuthStore();

    if (!auth.accessToken) {
      auth.loadFromStorage();
    }

    if (auth.accessToken && !auth.userId) {
      if (!authBootstrapPromise) {
        authBootstrapPromise = auth.hydrateFromServer();
      }
      await authBootstrapPromise;
    }

    if (to.meta.public) {
      if (to.name === 'login' && auth.isAuthenticated && auth.userId) {
        return '/';
      }
      return true;
    }

    if (!auth.isAuthenticated || !auth.userId) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    return true;
  };
}

export function installAdminAuthGuard(router: Router) {
  router.beforeEach(createAdminAuthGuard());
}
