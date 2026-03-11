<template>
  <div class="space-y-4">
    <PageHeader
      title="Platform · Notifications"
      description="Latest notifications across all tenants."
    />

    <div class="overflow-x-auto rounded-lg border border-slate-800">
      <table class="min-w-full text-xs">
        <thead class="bg-slate-900 text-slate-300">
          <tr>
            <th class="px-3 py-2 text-left">Tenant</th>
            <th class="px-3 py-2 text-left">User ID</th>
            <th class="px-3 py-2 text-left">Type</th>
            <th class="px-3 py-2 text-left">Title</th>
            <th class="px-3 py-2 text-left">Message</th>
            <th class="px-3 py-2 text-left">Read</th>
            <th class="px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-t border-slate-800"
          >
            <td class="px-3 py-2 text-slate-100">{{ item.tenant_slug || item.tenant_id }}</td>
            <td class="px-3 py-2 text-slate-400 break-all">{{ item.user_id || 'tenant-wide' }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.type }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.title }}</td>
            <td class="px-3 py-2 text-slate-400 max-w-[320px]">{{ item.message }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.is_read ? 'yes' : 'no' }}</td>
            <td class="px-3 py-2 text-slate-400">{{ formatDate(item.created_at) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="px-3 py-4 text-slate-500">No notifications found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PageHeader } from '@org/admin-core';
import {
  getPlatformNotifications,
  type PlatformNotificationRow,
} from '../api/admin';

const rows = ref<PlatformNotificationRow[]>([]);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

onMounted(async () => {
  rows.value = await getPlatformNotifications({ limit: 200 });
});
</script>
