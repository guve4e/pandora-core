<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getDailyTraffic, getVisitors, type DailyTrafficRow, type VisitorsResponse } from '../api/analytics'

const loading = ref(true)
const data = ref<VisitorsResponse | null>(null)
const daily = ref<DailyTrafficRow[]>([])

const hasAnyData = computed(() => {
  if (!data.value) return false
  return (
    data.value.summary.visitors > 0 ||
    data.value.summary.sessions > 0 ||
    data.value.summary.pageViews > 0 ||
    data.value.summary.conversions > 0
  )
})

const chartSeries = computed(() => [
  {
    name: 'Visitors',
    data: daily.value.map((d) => d.uniqueVisitors),
  },
  {
    name: 'Page Views',
    data: daily.value.map((d) => d.pageViews),
  },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#94a3b8',
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  dataLabels: {
    enabled: false,
  },
  grid: {
    borderColor: '#1e293b',
  },
  xaxis: {
    categories: daily.value.map((d) => d.day),
    labels: {
      rotate: -30,
    },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
  },
  legend: {
    position: 'top',
  },
  tooltip: {
    theme: 'dark',
  },
}))

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const conversionRate = computed(() => {
  if (!data.value) return '0%'
  const visitors = data.value.summary.visitors
  const conversions = data.value.summary.conversions

  if (!visitors) return '0%'
  return `${((conversions / visitors) * 100).toFixed(1)}%`
})

onMounted(async () => {
  try {
    const [visitorsData, dailyData] = await Promise.all([
      getVisitors(),
      getDailyTraffic({ days: 7 }),
    ])

    data.value = visitorsData
    daily.value = dailyData
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6 p-6">
    <h1 class="text-2xl font-bold text-slate-100">Visitors</h1>

    <div v-if="loading" class="text-slate-400">
      Loading...
    </div>

    <template v-else-if="data">
      <!-- SUMMARY -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Visitors</p>
          <p class="mt-2 text-3xl font-semibold text-white">{{ data.summary.visitors }}</p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Sessions</p>
          <p class="mt-2 text-3xl font-semibold text-white">{{ data.summary.sessions }}</p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Page Views</p>
          <p class="mt-2 text-3xl font-semibold text-white">{{ data.summary.pageViews }}</p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Conversions</p>
          <p class="mt-2 text-3xl font-semibold text-white">{{ data.summary.conversions }}</p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Conv Rate</p>
          <p class="mt-2 text-3xl font-semibold text-white">{{ conversionRate }}</p>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-if="!hasAnyData"
        class="rounded-2xl border border-slate-700 bg-slate-950 p-10 text-center"
      >
        <p class="text-lg font-semibold text-white">No visitors yet</p>
        <p class="mt-2 text-sm text-slate-400">
          Publish the site, open it from a real browser, and start navigating to collect analytics.
        </p>
      </div>

      <template v-else>
        <!-- GRAPH -->
        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-white">Last 7 days</h2>
            <p class="text-sm text-slate-400">Visitors and page views over time.</p>
          </div>

          <apexchart
            type="line"
            height="320"
            :options="chartOptions"
            :series="chartSeries"
          />
        </div>

        <!-- VISITOR TABLE -->
        <div class="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-900 text-left text-slate-300">
              <tr>
                <th class="px-4 py-3">Visitor</th>
                <th class="px-4 py-3">First Seen</th>
                <th class="px-4 py-3">Last Seen</th>
                <th class="px-4 py-3">Sessions</th>
                <th class="px-4 py-3">Views</th>
                <th class="px-4 py-3">Conversions</th>
                <th class="px-4 py-3">Last Page</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="v in data.items"
                :key="v.visitorId"
                class="border-t border-slate-800"
              >
                <td class="px-4 py-3 font-mono text-xs text-slate-200">{{ v.visitorId }}</td>
                <td class="px-4 py-3 text-slate-300">{{ formatDate(v.firstSeenAt) }}</td>
                <td class="px-4 py-3 text-slate-300">{{ formatDate(v.lastSeenAt) }}</td>
                <td class="px-4 py-3 text-slate-300">{{ v.sessions }}</td>
                <td class="px-4 py-3 text-slate-300">{{ v.pageViews }}</td>
                <td class="px-4 py-3 text-slate-300">{{ v.conversions }}</td>
                <td class="px-4 py-3 text-slate-300">{{ v.latestPage || '—' }}</td>
              </tr>

              <tr v-if="!data.items.length">
                <td colspan="7" class="px-4 py-6 text-center text-slate-500">
                  No visitor rows yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>
