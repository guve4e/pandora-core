<template>
  <div class="space-y-6">
    <PageHeader
      :title="tenant ? `Tenant · ${tenant.name}` : 'Tenant detail'"
      :description="tenant ? `Slug: ${tenant.slug}` : 'Loading tenant...'"
    />

    <div v-if="tenant" class="grid gap-4 md:grid-cols-3">
      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">Tenant Name</div>
        <div class="mt-2 text-lg font-semibold text-slate-100">{{ tenant.name }}</div>
      </div>

      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">Slug</div>
        <div class="mt-2 text-lg font-semibold text-slate-100">{{ tenant.slug }}</div>
      </div>

      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">Created</div>
        <div class="mt-2 text-sm font-medium text-slate-100">{{ formatDate(tenant.created_at) }}</div>
      </div>
    </div>

    <section class="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-4">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">Invite tenant user</h2>
        <p class="mt-1 text-xs text-slate-400">
          Create a one-time activation link for this tenant.
        </p>
      </div>

      <form class="grid gap-3 md:grid-cols-[1fr_180px_auto]" @submit.prevent="onCreateInvite">
        <input
          v-model.trim="inviteEmail"
          type="email"
          placeholder="user@example.com"
          class="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100"
        />

        <select
          v-model="inviteRole"
          class="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100"
        >
          <option value="owner">owner</option>
          <option value="admin">admin</option>
          <option value="staff">staff</option>
        </select>

        <button
          type="submit"
          :disabled="inviteSubmitting"
          class="rounded-md bg-emerald-500/95 hover:bg-emerald-400/95 disabled:opacity-60 text-xs font-medium text-slate-950 px-3 py-2 transition-colors"
        >
          <span v-if="!inviteSubmitting">Create invite</span>
          <span v-else>Creating…</span>
        </button>
      </form>

      <div
        v-if="inviteError"
        class="text-[11px] text-red-400 border border-red-500/40 bg-red-950/30 rounded-md px-3 py-2"
      >
        {{ inviteError }}
      </div>

      <div v-if="inviteUrl" class="space-y-2">
        <div class="text-[11px] text-emerald-300 border border-emerald-500/30 bg-emerald-950/30 rounded-md px-3 py-2">
          Invite created successfully.
        </div>

        <label class="text-xs text-slate-400">Invite URL</label>
        <textarea
          readonly
          :value="inviteUrl"
          class="w-full min-h-[86px] rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100"
        />
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-3">
      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-slate-100">Users</h2>
        <div class="overflow-x-auto rounded-lg border border-slate-800">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-900 text-slate-300">
              <tr>
                <th class="px-3 py-2 text-left">Email</th>
                <th class="px-3 py-2 text-left">Role</th>
                <th class="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in users" :key="item.id" class="border-t border-slate-800">
                <td class="px-3 py-2 text-slate-100">{{ item.email }}</td>
                <td class="px-3 py-2 text-slate-300">{{ item.role }}</td>
                <td class="px-3 py-2 text-slate-400">{{ formatDate(item.created_at) }}</td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="3" class="px-3 py-4 text-slate-500">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-slate-100">Leads</h2>
        <div class="overflow-x-auto rounded-lg border border-slate-800">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-900 text-slate-300">
              <tr>
                <th class="px-3 py-2 text-left">Phone</th>
                <th class="px-3 py-2 text-left">City</th>
                <th class="px-3 py-2 text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in leads" :key="item.id" class="border-t border-slate-800">
                <td class="px-3 py-2 text-slate-100">{{ item.phone }}</td>
                <td class="px-3 py-2 text-slate-300">{{ item.city || '—' }}</td>
                <td class="px-3 py-2 text-slate-400">{{ item.summary || '—' }}</td>
              </tr>
              <tr v-if="!leads.length">
                <td colspan="3" class="px-3 py-4 text-slate-500">No leads found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-slate-100">Notifications</h2>
        <div class="overflow-x-auto rounded-lg border border-slate-800">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-900 text-slate-300">
              <tr>
                <th class="px-3 py-2 text-left">Type</th>
                <th class="px-3 py-2 text-left">Title</th>
                <th class="px-3 py-2 text-left">Read</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in notifications" :key="item.id" class="border-t border-slate-800">
                <td class="px-3 py-2 text-slate-100">{{ item.type }}</td>
                <td class="px-3 py-2 text-slate-300">{{ item.title }}</td>
                <td class="px-3 py-2 text-slate-400">{{ item.is_read ? 'yes' : 'no' }}</td>
              </tr>
              <tr v-if="!notifications.length">
                <td colspan="3" class="px-3 py-4 text-slate-500">No notifications found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { PageHeader } from '@org/admin-core';
import {
  createPlatformTenantInvite,
  getPlatformTenantBySlug,
  getPlatformTenantUsers,
  getPlatformTenantLeads,
  getPlatformTenantNotifications,
  type PlatformTenantRow,
  type PlatformUserRow,
  type PlatformLeadRow,
  type PlatformNotificationRow,
} from '../api/admin';

const route = useRoute();

const tenant = ref<PlatformTenantRow | null>(null);
const users = ref<PlatformUserRow[]>([]);
const leads = ref<PlatformLeadRow[]>([]);
const notifications = ref<PlatformNotificationRow[]>([]);

const inviteEmail = ref('');
const inviteRole = ref('owner');
const inviteSubmitting = ref(false);
const inviteError = ref<string | null>(null);
const inviteUrl = ref<string | null>(null);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function normalizeError(e: any): string {
  const apiMsg = e?.response?.data?.message;
  if (typeof apiMsg === 'string' && apiMsg.trim()) return apiMsg;
  if (Array.isArray(apiMsg) && apiMsg.length) return apiMsg.join(', ');
  return e?.message || 'Something went wrong.';
}

async function load() {
  const slug = String(route.params.slug || '');
  if (!slug) return;

  tenant.value = await getPlatformTenantBySlug(slug);
  users.value = await getPlatformTenantUsers(slug);
  leads.value = await getPlatformTenantLeads(slug);
  notifications.value = await getPlatformTenantNotifications(slug, {
    limit: 100,
  });
}

async function onCreateInvite() {
  inviteError.value = null;
  inviteUrl.value = null;

  const slug = String(route.params.slug || '');
  if (!slug) return;

  if (!inviteEmail.value) {
    inviteError.value = 'Email is required.';
    return;
  }

  inviteSubmitting.value = true;
  try {
    const res = await createPlatformTenantInvite(slug, {
      email: inviteEmail.value,
      role: inviteRole.value,
    });

    inviteUrl.value = `${window.location.origin}${res.invite_url}`;
    inviteEmail.value = '';
    inviteRole.value = 'owner';

    await load();
  } catch (e: any) {
    inviteError.value = normalizeError(e);
  } finally {
    inviteSubmitting.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, load);
</script>
