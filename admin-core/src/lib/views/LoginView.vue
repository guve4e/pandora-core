<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center px-4">
    <div
      class="w-full max-w-sm border border-slate-800 rounded-2xl bg-slate-900/80 shadow-xl p-6 space-y-6"
    >
      <div class="space-y-1">
        <h1 class="text-sm font-semibold text-slate-100">
          {{ title }}
        </h1>
        <p class="text-xs text-slate-400">
          {{ subtitle }}
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-1">
          <label class="text-xs text-slate-300" for="email">Email</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            class="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="you@example.com"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs text-slate-300" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="••••••••"
          />
        </div>

        <div
          v-if="error"
          class="text-[11px] text-red-400 border border-red-500/40 bg-red-950/30 rounded-md px-3 py-2"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full inline-flex items-center justify-center rounded-md bg-emerald-500/95 hover:bg-emerald-400/95 disabled:opacity-60 text-xs font-medium text-slate-950 px-3 py-2 transition-colors"
        >
          <span v-if="!loading">Sign in</span>
          <span v-else>Signing in…</span>
        </button>
      </form>

      <p class="text-[11px] text-slate-500 text-center">
        Authorized users only.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../auth/auth.store';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const title = computed(() => import.meta.env.VITE_ADMIN_TITLE || 'Admin');
const subtitle = computed(
  () => import.meta.env.VITE_ADMIN_SUBTITLE || 'Sign in to continue.',
);

function normalizeError(e: any): string {
  if (e?.message?.toLowerCase?.().includes('network')) {
    return 'Cannot reach the server. Is the backend running and /api proxy configured?';
  }

  const apiMsg = e?.response?.data?.message;
  if (typeof apiMsg === 'string' && apiMsg.trim()) return apiMsg;
  if (Array.isArray(apiMsg) && apiMsg.length) return apiMsg.join(', ');
  if (e?.response?.status === 401) return 'Invalid email or password.';

  return e?.message || 'Login failed.';
}

async function onSubmit() {
  error.value = null;

  if (!email.value || !password.value) {
    error.value = 'Please enter email and password.';
    return;
  }

  loading.value = true;
  try {
    await auth.login(email.value, password.value);

    const redirect = (route.query.redirect as string) || '/';
    await router.push(redirect);
  } catch (e: any) {
    console.error(e);
    error.value = normalizeError(e);
  } finally {
    loading.value = false;
  }
}
</script>
