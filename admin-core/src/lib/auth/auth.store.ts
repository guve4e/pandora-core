import { defineStore } from 'pinia';
import { loginRequest, meRequest, logoutRequest } from '../api/auth';
import type { LoginResponse, MeResponse } from '../api/auth';
import { clearTokens } from './auth.storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  email: string | null;
  userId: string | null;
  tenantId: string | null;
  role: string | null;
}

const STORAGE_KEY = 'aiadvocate_auth';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    refreshToken: null,
    username: null,
    email: null,
    userId: null,
    tenantId: null,
    role: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    loadFromStorage() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        this.accessToken = parsed.accessToken ?? null;
        this.refreshToken = parsed.refreshToken ?? null;
        this.username = parsed.username ?? null;
        this.email = parsed.email ?? null;
        this.userId = parsed.userId ?? null;
        this.tenantId = parsed.tenantId ?? null;
        this.role = parsed.role ?? null;
      } catch {
        // ignore
      }
    },

    saveToStorage() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          username: this.username,
          email: this.email,
          userId: this.userId,
          tenantId: this.tenantId,
          role: this.role,
        }),
      );
    },

    setUser(me: MeResponse) {
      this.userId = me.id;
      this.tenantId = me.tenant_id;
      this.username = me.username;
      this.email = me.email;
      this.role = me.role;
      this.saveToStorage();
    },

    clear() {
      this.accessToken = null;
      this.refreshToken = null;
      this.username = null;
      this.email = null;
      this.userId = null;
      this.tenantId = null;
      this.role = null;

      clearTokens();
    },

    async login(email: string, password: string) {
      const tokens: LoginResponse = await loginRequest({ email, password });

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.email = email;

      this.saveToStorage();

      const me = await meRequest();
      this.setUser(me);
    },

    async hydrateFromServer(): Promise<boolean> {
      if (!this.accessToken) return false;

      try {
        const me = await meRequest();
        this.setUser(me);
        return true;
      } catch {
        this.clear();
        return false;
      }
    },

    async logout() {
      try {
        if (this.accessToken) {
          await logoutRequest();
        }
      } catch {
        // ignore backend logout failure
      } finally {
        this.clear();
      }
    },
  },
});
