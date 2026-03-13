<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-sm font-semibold text-slate-100">Open AI</h2>
    </div>

    <div v-if="loading" class="text-xs text-slate-400">
      Loading…
    </div>

    <div
        v-if="error"
        class="text-xs text-red-400 border border-red-500/40 bg-red-950/30 rounded-md px-3 py-2"
    >
      {{ error }}
    </div>

    <template v-if="!loading && !error && overview">
      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
            class="border border-slate-800 rounded-lg bg-slate-900/60 px-4 py-3 flex flex-col gap-1"
        >
          <div class="text-[11px] uppercase tracking-wide text-slate-500">
            Total calls ({{ overview.totals.lastNDays }} days)
          </div>
          <div class="text-lg font-semibold text-slate-50">
            {{ overview.totals.totalCalls }}
          </div>
        </div>

        <div
            class="border border-slate-800 rounded-lg bg-slate-900/60 px-4 py-3 flex flex-col gap-1"
        >
          <div class="text-[11px] uppercase tracking-wide text-slate-500">
            Tokens ({{ overview.totals.lastNDays }} days)
          </div>
          <div class="text-lg font-semibold text-slate-50">
            {{ overview.totals.totalTokens }}
          </div>
          <div class="text-[11px] text-slate-500">
            ~{{ Math.round(overview.totals.avgTokensPerCall) }} tokens / call
          </div>
        </div>

        <div
            class="border border-slate-800 rounded-lg bg-slate-900/60 px-4 py-3 flex flex-col gap-1"
        >
          <div class="text-[11px] uppercase tracking-wide text-slate-500">
            Cost ({{ overview.totals.lastNDays }} days)
          </div>
          <div class="text-lg font-semibold text-emerald-300">
            {{ overview.totals.totalCostUsd.toFixed(6) }}
          </div>
          <div class="text-[11px] text-slate-500">
            ~{{ overview.totals.avgCostPerCall.toFixed(6) }} / call
          </div>
        </div>
      </div>

      <!-- Daily usage -->
      <div
          class="border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden"
      >
        <div class="px-4 py-3 border-b border-slate-800">
          <h3 class="text-xs font-semibold text-slate-100">
            Daily usage (last {{ overview.totals.lastNDays }} days)
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-900/80 border-b border-slate-800">
            <tr class="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th class="px-4 py-2">Date</th>
              <th class="px-4 py-2 text-right">Calls</th>
              <th class="px-4 py-2 text-right">Tokens</th>
              <th class="px-4 py-2 text-right">Cost (USD)</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="row in overview.daily"
                :key="row.day"
                class="border-b border-slate-800/60 last:border-b-0"
            >
              <td class="px-4 py-2 text-slate-200">
                {{ formatDate(row.day) }}
              </td>
              <td class="px-4 py-2 text-right text-slate-100">
                {{ row.callCount }}
              </td>
              <td class="px-4 py-2 text-right text-slate-100">
                {{ row.totalTokens }}
              </td>
              <td class="px-4 py-2 text-right text-slate-300">
                {{ (row.totalCostUsd ?? 0).toFixed(6) }}
              </td>
            </tr>

            <tr v-if="!overview.daily.length">
              <td
                  colspan="4"
                  class="px-4 py-4 text-center text-[11px] text-slate-500"
              >
                No usage data.
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- By-kind usage -->
      <div
          class="border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden"
      >
        <div class="px-4 py-3 border-b border-slate-800">
          <h3 class="text-xs font-semibold text-slate-100">
            Usage by kind (current month)
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-900/80 border-b border-slate-800">
            <tr class="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th class="px-4 py-2">Kind</th>
              <th class="px-4 py-2 text-right">Calls</th>
              <th class="px-4 py-2 text-right">Tokens</th>
              <th class="px-4 py-2 text-right">Cost (USD)</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="row in overview.byKind"
                :key="row.kind"
                class="border-b border-slate-800/60 last:border-b-0"
            >
              <td class="px-4 py-2 text-slate-200 font-mono text-[11px]">
                {{ row.kind }}
              </td>
              <td class="px-4 py-2 text-right text-slate-100">
                {{ row.callCount }}
              </td>
              <td class="px-4 py-2 text-right text-slate-100">
                {{ row.totalTokens }}
              </td>
              <td class="px-4 py-2 text-right text-slate-300">
                {{ (row.totalCostUsd ?? 0).toFixed(6) }}
              </td>
            </tr>

            <tr v-if="!overview.byKind.length">
              <td
                  colspan="4"
                  class="px-4 py-4 text-center text-[11px] text-slate-500"
              >
                No usage data.
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  getAiUsageOverview,
  type AiUsageOverview,
} from '../api/admin';

const loading = ref(true);
const error = ref<string | null>(null);
const overview = ref<AiUsageOverview | null>(null);

// current-month range for by-kind
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const from = `${yyyy}-${mm}-01`;
const to = `${yyyy}-${mm}-${dd}`;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    overview.value = await getAiUsageOverview({ days: 7, from, to });
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? 'Failed to load AI usage.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>