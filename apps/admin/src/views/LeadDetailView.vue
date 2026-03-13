<template>
  <div class="space-y-6">
    <PageHeader
      title="Lead Detail"
      description="Lead information and conversation transcript."
    />

    <div v-if="loading" class="text-xs text-slate-400">
      Loading lead...
    </div>

    <div
      v-else-if="error"
      class="text-[11px] text-red-400 border border-red-500/40 bg-red-950/30 rounded-md px-3 py-2"
    >
      {{ error }}
    </div>

    <template v-else-if="lead">
      <div class="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="space-y-4">
          <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div class="text-xs text-slate-400">Phone</div>
            <div class="mt-2 text-lg font-semibold text-slate-100">
              <a :href="`tel:${lead.phone}`" class="hover:underline">
                {{ lead.phone }}
              </a>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <div class="text-xs text-slate-400">City</div>
                <div class="mt-1 text-sm text-slate-100">{{ lead.city || '—' }}</div>
              </div>

              <div>
                <div class="text-xs text-slate-400">Service</div>
                <div class="mt-1 text-sm text-slate-100">{{ lead.service_type || '—' }}</div>
              </div>

              <div>
                <div class="text-xs text-slate-400">Status</div>
                <div class="mt-1 text-sm text-slate-100">{{ lead.status || '—' }}</div>
              </div>

              <div>
                <div class="text-xs text-slate-400">Created</div>
                <div class="mt-1 text-sm text-slate-100">{{ formatDate(lead.created_at) }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div class="text-xs text-slate-400">Summary</div>
            <div class="mt-2 text-sm leading-6 text-slate-100 whitespace-pre-wrap">
              {{ lead.summary || '—' }}
            </div>
          </div>
        </section>

        <section class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-100">Conversation</h2>
            <div class="text-[11px] text-slate-500">
              {{ messages.length }} message{{ messages.length === 1 ? '' : 's' }}
            </div>
          </div>

          <div
            v-if="!messages.length"
            class="mt-4 text-xs text-slate-500"
          >
            No transcript found.
          </div>

          <div v-else class="mt-4 space-y-3">
            <div
              v-for="m in messages"
              :key="m.id"
              :class="m.role === 'user' ? 'items-end' : 'items-start'"
              class="flex flex-col"
            >
              <div class="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                {{ m.role === 'user' ? 'Client' : 'Assistant' }}
              </div>

              <div
                class="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-6"
                :class="
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-100'
                "
              >
                {{ m.text }}
              </div>

              <div class="mt-1 text-[10px] text-slate-500">
                {{ formatDate(m.created_at) }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { PageHeader } from '@org/admin-core';
import {
  getTenantLeadById,
  getTenantLeadMessages,
  type TenantLeadRow,
  type TenantLeadMessageRow,
} from '../api/admin';

const route = useRoute();

const loading = ref(true);
const error = ref<string | null>(null);
const lead = ref<TenantLeadRow | null>(null);
const messages = ref<TenantLeadMessageRow[]>([]);

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
  return e?.message || 'Failed to load lead.';
}

onMounted(async () => {
  const id = String(route.params.id || '');

  try {
    lead.value = await getTenantLeadById(id);
    messages.value = await getTenantLeadMessages(id);
  } catch (e: any) {
    error.value = normalizeError(e);
  } finally {
    loading.value = false;
  }
});
</script>
