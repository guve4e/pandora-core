<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4">
    <div
      class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
    >
      <h1 class="text-sm text-slate-100 font-semibold">Accept Invitation</h1>

      <div v-if="loading" class="text-xs text-slate-400">
        Validating invite...
      </div>

      <div v-else-if="error" class="text-xs text-red-400">
        {{ error }}
      </div>

      <form v-else-if="invite" class="space-y-4" @submit.prevent="submit">
        <div class="text-xs text-slate-400">
          Invited to <b>{{ invite.tenant_name }}</b> as <b>{{ invite.role }}</b>
        </div>

        <div class="space-y-1">
          <label class="text-xs text-slate-300">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Create password"
            class="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs text-slate-300">Confirm password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat password"
            class="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100"
          />
        </div>

        <div v-if="submitError" class="text-xs text-red-400">
          {{ submitError }}
        </div>

        <button
          type="submit"
          class="w-full bg-emerald-500 text-xs font-medium text-black py-2 rounded"
        >
          Create Account
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { validateInvite, acceptInvite } from '../api/invites';

const route = useRoute();
const router = useRouter();

const token = route.query.token as string;

const invite = ref<any>(null);
const password = ref('');
const confirmPassword = ref('');
const loading = ref(true);
const error = ref<string | null>(null);
const submitError = ref<string | null>(null);

onMounted(async () => {
  try {
    invite.value = await validateInvite(token);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Invalid invite';
  } finally {
    loading.value = false;
  }
});

async function submit() {
  submitError.value = null;

  if (!password.value || password.value.length < 6) {
    submitError.value = 'Password must be at least 6 characters.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    submitError.value = 'Passwords do not match.';
    return;
  }

  try {
    await acceptInvite({
      token,
      password: password.value,
    });

    router.push('/login');
  } catch (e: any) {
    submitError.value = e?.response?.data?.message || 'Failed';
  }
}
</script>
