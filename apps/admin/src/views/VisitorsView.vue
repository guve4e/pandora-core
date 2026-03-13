<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">
          Visitors & traffic
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Pageviews and unique visitors based on client-side tracking.
        </p>
      </div>

      <!-- Days selector -->
      <div class="flex items-center gap-2 text-xs">
        <span class="text-slate-500">Range:</span>
        <select
            v-model.number="days"
            @change="loadData"
            class="bg-slate-900 border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option :value="7">Last 7 days</option>
          <option :value="14">Last 14 days</option>
          <option :value="30">Last 30 days</option>
        </select>
      </div>
    </div>

    <!-- Loading / error -->
    <div v-if="loading" class="text-xs text-slate-400">
      Loading…
    </div>

    <div
        v-if="error"
        class="text-xs text-red-400 border border-red-500/40 bg-red-950/30 rounded-md px-3 py-2"
    >
      {{ error }}
    </div>

    <!-- Content -->
    <template v-if="!loading && !error">
      <!-- If no data at all -->
      <div v-if="!rows.length" class="text-xs text-slate-500">
        No traffic data for this period.
      </div>

      <template v-else>
        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Total pageviews -->
          <div
              class="border border-slate-800 rounded-lg bg-slate-900/60 px-4 py-3 flex flex-col gap-1"
          >
            <div class="text-[11px] uppercase tracking-wide text-slate-500">
              Total pageviews ({{ days }} days)
            </div>
            <div class="text-lg font-semibold text-slate-50">
              {{ totalPageViews }}
            </div>
            <div class="text-[11px] text-slate-500">
              ~{{ avgPageViewsPerDay.toFixed(1) }} / day
            </div>
          </div>

          <!-- Unique visitors -->
          <div
              class="border border-slate-800 rounded-lg bg-slate-900/60 px-4 py-3 flex flex-col gap-1"
          >
            <div class="text-[11px] uppercase tracking-wide text-slate-500">
              Unique visitors ({{ days }} days)
            </div>
            <div class="text-lg font-semibold text-slate-50">
              {{ totalUniqueVisitors }}
            </div>
            <div class="text-[11px] text-slate-500">
              ~{{ avgVisitorsPerDay.toFixed(1) }} / day
            </div>
          </div>

          <!-- Intensity -->
          <div
              class="border border-slate-800 rounded-lg bg-slate-900/60 px-4 py-3 flex flex-col gap-1"
          >
            <div class="text-[11px] uppercase tracking-wide text-slate-500">
              Pageviews per visitor
            </div>
            <div class="text-lg font-semibold text-emerald-300">
              {{ viewsPerVisitor }}
            </div>
            <div class="text-[11px] text-slate-500">
              Total pageviews ÷ unique visitors
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div
            class="border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden"
        >
          <div
              class="px-4 py-3 border-b border-slate-800 flex items-center justify-between"
          >
            <h3 class="text-xs font-semibold text-slate-100">
              Traffic trend (last {{ days }} days)
            </h3>
            <p class="text-[11px] text-slate-500">
              Pageviews vs unique visitors
            </p>
          </div>
          <div class="px-2 py-3">
            <apexchart
                type="area"
                height="230"
                :options="chartOptions"
                :series="chartSeries"
            />
          </div>
        </div>

        <!-- Daily table -->
        <div
            class="border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-slate-800">
            <h3 class="text-xs font-semibold text-slate-100">
              Daily traffic (last {{ days }} days)
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-slate-900/80 border-b border-slate-800">
              <tr
                  class="text-left text-[11px] uppercase tracking-wide text-slate-500"
              >
                <th class="px-4 py-2">Date</th>
                <th class="px-4 py-2 text-right">Pageviews</th>
                <th class="px-4 py-2 text-right">Unique visitors</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="row in rows"
                  :key="row.day"
                  class="border-b border-slate-800/60 last:border-b-0"
              >
                <td class="px-4 py-2 text-slate-200">
                  {{ formatDate(row.day) }}
                </td>
                <td class="px-4 py-2 text-right text-slate-100">
                  {{ row.pageViews }}
                </td>
                <td class="px-4 py-2 text-right text-slate-100">
                  {{ row.uniqueVisitors }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { ApexOptions } from 'apexcharts';
import {
  getDailyTraffic,
  type DailyTrafficRow,
} from '../api/admin';

// Local types for series (instead of ApexAxisChartSeries)
type ApexPoint = { x: string | number; y: number };
type ApexSeries = { name: string; data: ApexPoint[] }[];

const loading = ref(true);
const error = ref<string | null>(null);
const rows = ref<DailyTrafficRow[]>([]);
const days = ref(7);

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', // Jan
    day: 'numeric', // 5
    year: 'numeric', // 2025
  });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', // Jan
    day: 'numeric',
  });
}

const totalPageViews = computed(() =>
    rows.value.reduce((sum, r) => sum + r.pageViews, 0),
);

const totalUniqueVisitors = computed(() =>
    rows.value.reduce((sum, r) => sum + r.uniqueVisitors, 0),
);

const avgPageViewsPerDay = computed(() =>
    rows.value.length ? totalPageViews.value / rows.value.length : 0,
);

const avgVisitorsPerDay = computed(() =>
    rows.value.length ? totalUniqueVisitors.value / rows.value.length : 0,
);

const viewsPerVisitor = computed(() => {
  if (!totalUniqueVisitors.value) return 0;
  const val = totalPageViews.value / totalUniqueVisitors.value;
  const safe = Number.isFinite(val) ? val : 0;
  return safe.toFixed(2);
});

const chartSeries = computed<ApexSeries>(() => [
  {
    name: 'Pageviews',
    data: rows.value.map((r) => ({
      x: r.day,
      y: r.pageViews,
    })),
  },
  {
    name: 'Unique visitors',
    data: rows.value.map((r) => ({
      x: r.day,
      y: r.uniqueVisitors,
    })),
  },
]);

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#9CA3AF',
    background: 'transparent',
  },
  dataLabels: { enabled: false },
  legend: {
    labels: { colors: '#E5E7EB' },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  xaxis: {
    type: 'category',
    labels: {
      style: {
        colors: '#6B7280',
        fontSize: '11px',
      },
      formatter: (value: string) => formatDateShort(value),
    },
    axisBorder: {
      color: '#1F2937',
    },
    axisTicks: {
      color: '#1F2937',
    },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      style: {
        colors: '#6B7280',
        fontSize: '11px',
      },
    },
  },
  grid: {
    borderColor: '#1F2937',
    strokeDashArray: 3,
  },
  colors: ['#22C55E', '#38BDF8'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.6,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  tooltip: {
    theme: 'dark',
    x: {
      formatter: (_value: string, opts?: any) => {
        const idx = opts?.dataPointIndex ?? 0;
        const row = rows.value[idx];
        return row ? formatDate(row.day) : '';
      },
    },
  },
}));

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    rows.value = await getDailyTraffic({ days: days.value });
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? 'Failed to load traffic data.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>