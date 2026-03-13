<template>
  <div class="space-y-4">
    <PageHeader
      title="Platform · Leads"
      description="Global leads list across tenants."
    />

    <div class="overflow-x-auto rounded-lg border border-slate-800">
      <table class="min-w-full text-xs">
        <thead class="bg-slate-900 text-slate-300">
          <tr>
            <th class="px-3 py-2 text-left">Tenant</th>
            <th class="px-3 py-2 text-left">Phone</th>
            <th class="px-3 py-2 text-left">City</th>
            <th class="px-3 py-2 text-left">Service</th>
            <th class="px-3 py-2 text-left">Summary</th>
            <th class="px-3 py-2 text-left">Status</th>
            <th class="px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-t border-slate-800"
          >
            <td class="px-3 py-2 text-slate-100">{{ item.tenant_slug }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.phone }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.city || '—' }}</td>
            <td class="px-3 py-2 text-slate-300">{{ item.service_type || '—' }}</td>
            <td class="px-3 py-2 text-slate-400 max-w-[320px]">
              {{ item.summary || '—' }}
            </td>
            <td class="px-3 py-2 text-slate-300">{{ item.status || '—' }}</td>
            <td class="px-3 py-2 text-slate-400">{{ formatDate(item.created_at) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="px-3 py-4 text-slate-500">No leads found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PageHeader } from '@org/admin-core';
import { getPlatformLeads, type PlatformLeadRow } from '../api/admin';

const rows = ref<PlatformLeadRow[]>([]);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

onMounted(async () => {
  rows.value = await getPlatformLeads();
});
</script>
