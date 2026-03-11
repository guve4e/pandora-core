<template>
  <div class="space-y-4">
    <PageHeader
      title="Platform · Users"
      description="Global user list with tenant mapping for debugging."
    />

    <div class="overflow-x-auto rounded-lg border border-slate-800">
      <table class="min-w-full text-xs">
        <thead class="bg-slate-900 text-slate-300">
          <tr>
            <th class="px-3 py-2 text-left">Email</th>
            <th class="px-3 py-2 text-left">Username</th>
            <th class="px-3 py-2 text-left">Role</th>
            <th class="px-3 py-2 text-left">Tenant</th>
            <th class="px-3 py-2 text-left">Tenant ID</th>
            <th class="px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-t border-slate-800"
          >
            <td class="px-3 py-2 text-slate-100">{{ item.email }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.username || '—' }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.role }}</td>
            <td class="px-3 py-2 text-slate-300">
              {{ item.tenant_slug || '—' }}
            </td>
            <td class="px-3 py-2 text-slate-400 break-all">{{ item.tenant_id }}</td>
            <td class="px-3 py-2 text-slate-400">{{ formatDate(item.created_at) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="px-3 py-4 text-slate-500">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PageHeader } from '@org/admin-core';
import { getPlatformUsers, type PlatformUserRow } from '../api/admin';

const rows = ref<PlatformUserRow[]>([]);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

onMounted(async () => {
  rows.value = await getPlatformUsers();
});
</script>
