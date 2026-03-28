<template>
  <div class="page">
    <div class="hero">
      <div>
        <div class="eyebrow">Business intelligence</div>
        <h1 class="page-title">AI Usage</h1>
        <p class="page-subtitle">
          Usage for your business assistant, including cost, tokens, and feature breakdown.
        </p>
      </div>

      <button class="refresh-button" :disabled="loading" @click="loadData">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div class="stats-grid">
      <div class="metric-card">
        <div class="metric-label">Cost today</div>
        <div class="metric-value">${{ formatUsd(summary?.totals.todayCostUsd ?? 0) }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Cost this month</div>
        <div class="metric-value">${{ formatUsd(summary?.totals.monthCostUsd ?? 0) }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Total AI calls</div>
        <div class="metric-value">{{ formatInt(summary?.totals.totalCalls ?? 0) }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Total tokens</div>
        <div class="metric-value">{{ formatInt(summary?.totals.totalTokens ?? 0) }}</div>
      </div>
    </div>

    <div class="main-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-kicker">Breakdown</div>
            <h2>By feature</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Calls</th>
                <th>Tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in summary?.byFeature ?? []" :key="row.feature">
                <td><span class="feature-chip">{{ row.feature }}</span></td>
                <td>{{ formatInt(row.calls) }}</td>
                <td>{{ formatInt(row.totalTokens) }}</td>
                <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
              </tr>
              <tr v-if="!summary?.byFeature?.length">
                <td colspan="4" class="empty-cell">No AI usage yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-kicker">Trend</div>
            <h2>Daily usage</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Feature</th>
                <th>Calls</th>
                <th>Tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in summary?.dailyTrend ?? []"
                :key="`${row.day}-${row.feature}`"
              >
                <td>{{ formatDay(row.day) }}</td>
                <td><span class="feature-chip">{{ row.feature }}</span></td>
                <td>{{ formatInt(row.calls) }}</td>
                <td>{{ formatInt(row.totalTokens) }}</td>
                <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
              </tr>
              <tr v-if="!summary?.dailyTrend?.length">
                <td colspan="5" class="empty-cell">No trend data yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  getTenantAiUsageSummary,
  type TenantAiUsageSummaryResponse,
} from '../api/tenant-ai-usage';

const loading = ref(false);
const error = ref('');
const summary = ref<TenantAiUsageSummaryResponse | null>(null);

function formatUsd(value: number) {
  return value.toFixed(6);
}

function formatInt(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

async function loadData() {
  loading.value = true;
  error.value = '';

  try {
    summary.value = await getTenantAiUsageSummary();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load tenant AI usage.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.page {
  display: grid;
  gap: 24px;
  color: #e2e8f0;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #60a5fa;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #f8fafc;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #94a3b8;
  max-width: 760px;
}

.refresh-button {
  border: 1px solid #334155;
  background: #0f172a;
  color: #f8fafc;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}

.error-banner {
  border: 1px solid #7f1d1d;
  background: #450a0a;
  color: #fecaca;
  border-radius: 14px;
  padding: 14px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card,
.panel {
  background: linear-gradient(180deg, #0f172a 0%, #0b1220 100%);
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 18px;
}

.metric-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.metric-value {
  margin-top: 10px;
  font-size: 30px;
  line-height: 1.05;
  font-weight: 800;
  color: #f8fafc;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

.panel-header {
  margin-bottom: 14px;
}

.panel-kicker {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #60a5fa;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  color: #e2e8f0;
}

.data-table th,
.data-table td {
  padding: 11px 8px;
  border-bottom: 1px solid #1e293b;
  vertical-align: middle;
}

.data-table th {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #334155;
  background: #111827;
  color: #cbd5e1;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.cost-cell {
  font-variant-numeric: tabular-nums;
  color: #c4b5fd;
  font-weight: 700;
}

.empty-cell {
  text-align: center;
  color: #475569;
  padding: 22px 8px;
}

@media (max-width: 1200px) {
  .stats-grid,
  .main-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
