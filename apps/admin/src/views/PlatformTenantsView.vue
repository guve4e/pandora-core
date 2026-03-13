<template>
  <div class="space-y-4">
    <PageHeader
      title="Platform · Tenants"
      description="Global tenant list for debugging and platform visibility."
    />

    <div class="overflow-x-auto rounded-lg border border-slate-800">
      <table class="min-w-full text-xs">
        <thead class="bg-slate-900 text-slate-300">
          <tr>
            <th class="px-3 py-2 text-left">Name</th>
            <th class="px-3 py-2 text-left">Slug</th>
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
            <td class="px-3 py-2 text-slate-100">
              <RouterLink
                :to="`/platform/tenants/${item.slug}`"
                class="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {{ item.name }}
              </RouterLink>
            </td>
            <td class="px-3 py-2 text-slate-300">
              <RouterLink
                :to="`/platform/tenants/${item.slug}`"
                class="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {{ item.slug }}
              </RouterLink>
            </td>
            <td class="px-3 py-2 text-slate-400 break-all">{{ item.id }}</td>
            <td class="px-3 py-2 text-slate-400">{{ formatDate(item.created_at) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="4" class="px-3 py-4 text-slate-500">No tenants found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { PageHeader } from '@org/admin-core';
import { getPlatformTenants, type PlatformTenantRow } from '../api/admin';

const rows = ref<PlatformTenantRow[]>([]);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

onMounted(async () => {
  rows.value = await getPlatformTenants();
});
</script>
