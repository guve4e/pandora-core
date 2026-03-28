<template>
  <div class="page">
    <div class="hero">
      <div>
        <div class="eyebrow">Platform intelligence</div>
        <h1 class="page-title">AI Usage</h1>
        <p class="page-subtitle">
          Platform-level AI cost, token usage, feature mix, and tenant spend.
        </p>
      </div>

      <button class="refresh-button" :disabled="loading" @click="loadAll">
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
                <td>
                  <span class="feature-chip">{{ row.feature }}</span>
                </td>
                <td>{{ formatInt(row.calls) }}</td>
                <td>{{ formatInt(row.totalTokens) }}</td>
                <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
              </tr>
              <tr v-if="!summary?.byFeature?.length">
                <td colspan="4" class="empty-cell">No feature usage yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-kicker">Consumption</div>
            <h2>Tenants</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Today</th>
                <th>Month</th>
                <th>Total</th>
                <th>Calls</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in tenants"
                :key="row.tenantSlug"
                class="clickable-row"
                :class="{ active: selectedTenantSlug === row.tenantSlug }"
                @click="selectTenant(row.tenantSlug)"
              >
                <td class="tenant-name">{{ row.tenantSlug }}</td>
                <td>${{ formatUsd(row.todayCostUsd) }}</td>
                <td>${{ formatUsd(row.monthCostUsd) }}</td>
                <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
                <td>{{ formatInt(row.calls) }}</td>
                <td>{{ formatInt(row.totalTokens) }}</td>
              </tr>
              <tr v-if="!tenants.length">
                <td colspan="6" class="empty-cell">No tenant usage yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section v-if="tenantDetail" class="panel detail-panel">
      <div class="panel-header">
        <div>
          <div class="panel-kicker">Selected tenant</div>
          <h2>Tenant detail: {{ tenantDetail.tenantSlug }}</h2>
        </div>
      </div>

      <div class="stats-grid detail-stats">
        <div class="metric-card subtle">
          <div class="metric-label">Today</div>
          <div class="metric-value">${{ formatUsd(tenantDetail.totals.todayCostUsd) }}</div>
        </div>

        <div class="metric-card subtle">
          <div class="metric-label">This month</div>
          <div class="metric-value">${{ formatUsd(tenantDetail.totals.monthCostUsd) }}</div>
        </div>

        <div class="metric-card subtle">
          <div class="metric-label">Calls</div>
          <div class="metric-value">{{ formatInt(tenantDetail.totals.calls) }}</div>
        </div>

        <div class="metric-card subtle">
          <div class="metric-label">Tokens</div>
          <div class="metric-value">{{ formatInt(tenantDetail.totals.totalTokens) }}</div>
        </div>
      </div>

      <div class="detail-grid">
        <section class="subpanel">
          <div class="subpanel-header">
            <h3>Feature breakdown</h3>
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
                <tr v-for="row in tenantDetail.byFeature" :key="row.feature">
                  <td>
                    <span class="feature-chip">{{ row.feature }}</span>
                  </td>
                  <td>{{ formatInt(row.calls) }}</td>
                  <td>{{ formatInt(row.totalTokens) }}</td>
                  <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
                </tr>
                <tr v-if="!tenantDetail.byFeature.length">
                  <td colspan="4" class="empty-cell">No feature rows.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="subpanel">
          <div class="subpanel-header">
            <h3>Top conversations</h3>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Conversation</th>
                  <th>Calls</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in tenantDetail.topConversations"
                  :key="row.conversationId ?? 'null-conversation'"
                >
                  <td class="mono">{{ shortConversation(row.conversationId) }}</td>
                  <td>{{ formatInt(row.calls) }}</td>
                  <td>{{ formatInt(row.totalTokens) }}</td>
                  <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
                </tr>
                <tr v-if="!tenantDetail.topConversations.length">
                  <td colspan="4" class="empty-cell">No conversation rows.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="subpanel trend-panel">
        <div class="subpanel-header">
          <h3>Daily trend</h3>
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
                v-for="row in tenantDetail.dailyTrend"
                :key="`${row.day}-${row.feature}`"
              >
                <td>{{ formatDay(row.day) }}</td>
                <td>
                  <span class="feature-chip">{{ row.feature }}</span>
                </td>
                <td>{{ formatInt(row.calls) }}</td>
                <td>{{ formatInt(row.totalTokens) }}</td>
                <td class="cost-cell">${{ formatUsd(row.totalCostUsd) }}</td>
              </tr>
              <tr v-if="!tenantDetail.dailyTrend.length">
                <td colspan="5" class="empty-cell">No daily trend rows.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  getAiUsageSummary,
  getAiUsageTenantDetail,
  getAiUsageTenants,
  type AiUsageSummaryResponse,
  type AiUsageTenantDetailResponse,
  type AiUsageTenantRow,
} from '../api/ai-usage';

const loading = ref(false);
const error = ref('');
const summary = ref<AiUsageSummaryResponse | null>(null);
const tenants = ref<AiUsageTenantRow[]>([]);
const tenantDetail = ref<AiUsageTenantDetailResponse | null>(null);
const selectedTenantSlug = ref('');

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

function shortConversation(value: string | null) {
  if (!value) return '—';
  return value.length > 12 ? `${value.slice(0, 12)}…` : value;
}

async function selectTenant(tenantSlug: string) {
  selectedTenantSlug.value = tenantSlug;
  tenantDetail.value = await getAiUsageTenantDetail(tenantSlug);
}

async function loadAll() {
  loading.value = true;
  error.value = '';

  try {
    const [summaryRes, tenantsRes] = await Promise.all([
      getAiUsageSummary(),
      getAiUsageTenants(),
    ]);

    summary.value = summaryRes;
    tenants.value = tenantsRes;

    if (tenantsRes.length > 0) {
      const tenantSlug = selectedTenantSlug.value || tenantsRes[0].tenantSlug;
      await selectTenant(tenantSlug);
    } else {
      tenantDetail.value = null;
      selectedTenantSlug.value = '';
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load AI usage.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
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
  transition: 0.18s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #1e293b;
  border-color: #475569;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.panel,
.subpanel {
  background: linear-gradient(180deg, #0f172a 0%, #0b1220 100%);
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.metric-card.subtle {
  background: #0f172a;
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
  grid-template-columns: 1.05fr 1.45fr;
  gap: 24px;
}

.detail-panel {
  display: grid;
  gap: 20px;
}

.detail-stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.trend-panel {
  display: grid;
  gap: 12px;
}

.panel-header,
.subpanel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.panel-header h2,
.subpanel-header h3 {
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

.data-table td {
  color: #e2e8f0;
}

.tenant-name {
  font-weight: 700;
  color: #f8fafc;
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
  white-space: nowrap;
}

.cost-cell {
  font-variant-numeric: tabular-nums;
  color: #c4b5fd;
  font-weight: 700;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.14s ease;
}

.clickable-row:hover {
  background: rgba(30, 41, 59, 0.85);
}

.clickable-row.active {
  background: rgba(49, 46, 129, 0.45);
}

.empty-cell {
  text-align: center;
  color: #475569;
  padding: 22px 8px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #93c5fd;
}

@media (max-width: 1200px) {
  .stats-grid,
  .detail-stats,
  .main-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .refresh-button {
    align-self: flex-start;
  }
}
</style>
