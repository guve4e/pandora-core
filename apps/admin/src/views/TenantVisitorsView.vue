<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  getDailyTraffic,
  getVisitorDetail,
  getVisitors,
  type DailyTrafficRow,
  type VisitorDetailResponse,
  type VisitorItem,
  type VisitorsResponse,
} from '../api/analytics';

const loading = ref(true);
const detailLoading = ref(false);
const data = ref<VisitorsResponse | null>(null);
const daily = ref<DailyTrafficRow[]>([]);
const selectedVisitor = ref<VisitorDetailResponse | null>(null);

const trafficFilter = ref('all');
const visitorLimit = ref(25);

const filteredVisitors = computed(() => {
  if (!data.value) return [];

  let visitors = data.value.items;

  if (trafficFilter.value !== 'all') {
    visitors = visitors.filter(
      (v) => v.geo?.trafficType === trafficFilter.value,
    );
  }

  return visitors.slice(0, visitorLimit.value);
});

const hasAnyData = computed(() => {
  if (!data.value) return false;
  return data.value.summary.visitors > 0 || data.value.summary.pageViews > 0;
});

const conversionRate = computed(() => {
  if (!data.value?.summary.visitors) return '0%';
  return `${((data.value.summary.conversions / data.value.summary.visitors) * 100).toFixed(1)}%`;
});

const topReferrers = computed(
  () => data.value?.acquisition?.topReferrers ?? [],
);
const topPages = computed(() => data.value?.behavior?.topPages ?? []);
const topIntentEvents = computed(
  () => data.value?.businessIntent?.topEvents ?? [],
);

const chartSeries = computed(() => [
  { name: 'Visitors', data: daily.value.map((d) => d.uniqueVisitors) },
  { name: 'Page Views', data: daily.value.map((d) => d.pageViews) },
]);

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#94a3b8',
  },
  stroke: { curve: 'smooth', width: 3 },
  dataLabels: { enabled: false },
  grid: { borderColor: '#1e293b' },
  xaxis: { categories: daily.value.map((d) => d.day), labels: { rotate: -30 } },
  yaxis: { min: 0, forceNiceScale: true },
  legend: { position: 'top' },
  tooltip: { theme: 'dark' },
}));

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function shortDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function cleanReferrer(value: string | null | undefined) {
  if (!value || value === 'direct') return 'Direct';
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function locationLabel(v: VisitorItem) {
  const city = v.geo?.city;
  const country = v.geo?.country;

  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return 'Unknown';
}

function sourceLabel(v: VisitorItem) {
  return cleanReferrer(v.latestReferrer);
}

async function openVisitor(visitorId: string) {
  detailLoading.value = true;
  selectedVisitor.value = null;

  try {
    selectedVisitor.value = await getVisitorDetail(visitorId);
  } finally {
    detailLoading.value = false;
  }
}

function closeVisitor() {
  selectedVisitor.value = null;
}

function eventLabel(type: string, name: string | null) {
  if (name && name !== type) return `${type} · ${name}`;
  return type;
}

function trafficLabel(type: string | null | undefined) {
  switch (type) {
    case 'likely_human':
      return 'Likely human';
    case 'search_bot':
      return 'Search bot';
    case 'social_preview':
      return 'Social preview';
    case 'datacenter':
      return 'Datacenter';
    case 'suspicious':
      return 'Suspicious';
    default:
      return 'Unknown';
  }
}

function trafficBadgeClass(type: string | null | undefined) {
  switch (type) {
    case 'likely_human':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    case 'search_bot':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    case 'social_preview':
      return 'border-purple-500/40 bg-purple-500/10 text-purple-300';
    case 'datacenter':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    case 'suspicious':
      return 'border-red-500/40 bg-red-500/10 text-red-300';
    default:
      return 'border-slate-600 bg-slate-800/60 text-slate-300';
  }
}

onMounted(async () => {
  try {
    const [visitorsData, dailyData] = await Promise.all([
      getVisitors(),
      getDailyTraffic({ days: 7 }),
    ]);

    data.value = visitorsData;
    daily.value = dailyData;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-100">Visitors</h1>
      <p class="mt-1 text-sm text-slate-400">
        Traffic quality, acquisition, behavior, and sales intent.
      </p>
    </div>

    <div v-if="loading" class="text-slate-400">Loading...</div>

    <template v-else-if="data">
      <!-- KPI CARDS -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Visitors</p>
          <p class="mt-2 text-3xl font-semibold text-white">
            {{ data.summary.visitors }}
          </p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Sessions</p>
          <p class="mt-2 text-3xl font-semibold text-white">
            {{ data.summary.sessions }}
          </p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">
            Page Views
          </p>
          <p class="mt-2 text-3xl font-semibold text-white">
            {{ data.summary.pageViews }}
          </p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">
            Avg Pages
          </p>
          <p class="mt-2 text-3xl font-semibold text-white">
            {{ data.summary.avgPagesPerSession ?? 0 }}
          </p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">Bounce</p>
          <p class="mt-2 text-3xl font-semibold text-white">
            {{ data.summary.bounceRate ?? 0 }}%
          </p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">
            Returning
          </p>
          <p class="mt-2 text-3xl font-semibold text-white">
            {{ data.summary.returningVisitors ?? 0 }}
          </p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p class="text-xs uppercase tracking-wide text-slate-400">
            Conv Rate
          </p>
          <p class="mt-2 text-3xl font-semibold text-emerald-300">
            {{ conversionRate }}
          </p>
        </div>
      </div>

      <div
        v-if="!hasAnyData"
        class="rounded-2xl border border-slate-700 bg-slate-950 p-10 text-center"
      >
        <p class="text-lg font-semibold text-white">No visitors yet</p>
        <p class="mt-2 text-sm text-slate-400">
          Open the real public domain, not localhost.
        </p>
      </div>

      <template v-else>
        <!-- FULL WIDTH GRAPH -->
        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div
            class="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold text-white">Last 7 days</h2>
              <p class="text-sm text-slate-400">
                Visitors and page views over time.
              </p>
            </div>

            <p class="text-xs text-slate-500">
              Raw traffic, including bots and previews.
            </p>
          </div>

          <apexchart
            type="line"
            height="400"
            :options="chartOptions"
            :series="chartSeries"
          />
        </div>

        <!-- INSIGHT STRIP -->
        <div
          class="grid grid-cols-1 gap-4"
          :class="topIntentEvents.length ? 'xl:grid-cols-3' : 'xl:grid-cols-2'"
        >
          <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <h2 class="text-sm font-semibold text-white">Top Referrers</h2>

            <div class="mt-4 space-y-3">
              <div
                v-for="r in topReferrers"
                :key="r.referrer"
                class="flex justify-between gap-3 text-sm"
              >
                <span class="truncate text-slate-300">
                  {{ cleanReferrer(r.referrer) }}
                </span>
                <span class="text-slate-400">{{ r.visits }}</span>
              </div>

              <p v-if="!topReferrers.length" class="text-sm text-slate-500">
                No referrer data yet.
              </p>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <h2 class="text-sm font-semibold text-white">Top Pages</h2>

            <div class="mt-4 space-y-3">
              <div
                v-for="p in topPages"
                :key="p.pagePath"
                class="flex justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm"
              >
                <span class="truncate text-slate-300">{{ p.pagePath }}</span>
                <span class="text-slate-400">{{ p.views }}</span>
              </div>

              <p v-if="!topPages.length" class="text-sm text-slate-500">
                No page data yet.
              </p>
            </div>
          </div>

          <div
            v-if="topIntentEvents.length"
            class="rounded-2xl border border-slate-700 bg-slate-950 p-5"
          >
            <h2 class="text-sm font-semibold text-white">High Intent</h2>

            <div class="mt-4 space-y-3">
              <div
                v-for="e in topIntentEvents"
                :key="e.name"
                class="flex justify-between gap-3 text-sm"
              >
                <span class="truncate text-slate-300">{{ e.name }}</span>
                <span class="text-emerald-300">{{ e.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- VISITOR TABLE -->
        <div class="rounded-2xl border border-slate-700 bg-slate-950">
          <div
            class="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-sm font-semibold text-white">Visitor list</h2>
              <p class="mt-1 text-xs text-slate-500">
                Filter noise and focus on real visitors.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 text-xs">
              <label class="flex items-center gap-2 text-slate-400">
                Quality
                <select
                  v-model="trafficFilter"
                  class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                >
                  <option value="all">All</option>
                  <option value="likely_human">Humans</option>
                  <option value="search_bot">Bots</option>
                  <option value="datacenter">Datacenter</option>
                  <option value="social_preview">Social previews</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>

              <label class="flex items-center gap-2 text-slate-400">
                Show
                <select
                  v-model.number="visitorLimit"
                  class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                >
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </label>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-900 text-left text-slate-300">
                <tr>
                  <th class="px-4 py-3">Visitor</th>
                  <th class="px-4 py-3">Location</th>
                  <th class="px-4 py-3">Source</th>
                  <th class="px-4 py-3">Quality</th>
                  <th class="px-4 py-3 text-right">Sessions</th>
                  <th class="px-4 py-3 text-right">Views</th>
                  <th class="px-4 py-3 text-right">Intent</th>
                  <th class="px-4 py-3">Last Seen</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="v in filteredVisitors"
                  :key="v.visitorId"
                  class="cursor-pointer border-t border-slate-800 hover:bg-slate-900/70"
                  @click="openVisitor(v.visitorId)"
                >
                  <td class="px-4 py-3">
                    <div class="font-mono text-xs text-slate-200">
                      {{ shortId(v.visitorId) }}
                    </div>
                    <div class="mt-1 text-[11px] text-slate-500">
                      {{ v.latestIp || '—' }}
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <div class="text-slate-300">{{ locationLabel(v) }}</div>
                    <div class="max-w-52 truncate text-[11px] text-slate-500">
                      {{ v.geo?.org || '—' }}
                    </div>
                  </td>

                  <td class="px-4 py-3 text-slate-300">{{ sourceLabel(v) }}</td>

                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      :class="trafficBadgeClass(v.geo?.trafficType)"
                      :title="v.geo?.trafficReason || ''"
                    >
                      {{ trafficLabel(v.geo?.trafficType) }}
                    </span>
                  </td>

                  <td class="px-4 py-3 text-right text-slate-300">
                    {{ v.sessions }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-300">
                    {{ v.pageViews }}
                  </td>
                  <td class="px-4 py-3 text-right text-emerald-300">
                    {{ v.intentEvents ?? 0 }}
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    {{ shortDate(v.lastSeenAt) }}
                  </td>
                </tr>

                <tr v-if="!filteredVisitors.length">
                  <td colspan="8" class="px-4 py-6 text-center text-slate-500">
                    No visitors match this filter.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <!-- DRAWER -->
    <div
      v-if="detailLoading || selectedVisitor"
      class="fixed inset-0 z-50 flex justify-end bg-black/60"
      @click.self="closeVisitor"
    >
      <aside
        class="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-700 bg-slate-950 p-6 shadow-2xl"
      >
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-white">Visitor journey</h2>
            <p class="mt-1 text-sm text-slate-400">
              Sessions, pages, clicks, and intent events.
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-900"
            @click="closeVisitor"
          >
            Close
          </button>
        </div>

        <div v-if="detailLoading" class="text-slate-400">
          Loading visitor...
        </div>

        <template v-else-if="selectedVisitor">
          <div
            class="mb-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-5"
          >
            <div class="font-mono text-xs text-slate-400">
              {{ selectedVisitor.visitor.visitorId }}
            </div>

            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-xs uppercase tracking-wide text-slate-500">
                  Location
                </div>
                <div class="mt-1 text-slate-200">
                  {{ selectedVisitor.visitor.geo?.city || 'Unknown' }}
                  <span v-if="selectedVisitor.visitor.geo?.country">
                    , {{ selectedVisitor.visitor.geo.country }}
                  </span>
                </div>
              </div>

              <div>
                <div class="text-xs uppercase tracking-wide text-slate-500">
                  IP / Org
                </div>
                <div class="mt-1 text-slate-200">
                  {{ selectedVisitor.visitor.latestIp || '—' }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ selectedVisitor.visitor.geo?.org || '—' }}
                </div>
              </div>

              <div>
                <div class="text-xs uppercase tracking-wide text-slate-500">
                  First Seen
                </div>
                <div class="mt-1 text-slate-200">
                  {{ formatDate(selectedVisitor.visitor.firstSeenAt) }}
                </div>
              </div>

              <div>
                <div class="text-xs uppercase tracking-wide text-slate-500">
                  Last Seen
                </div>
                <div class="mt-1 text-slate-200">
                  {{ formatDate(selectedVisitor.visitor.lastSeenAt) }}
                </div>
              </div>

              <div class="col-span-2">
                <div class="text-xs uppercase tracking-wide text-slate-500">
                  Traffic Quality
                </div>
                <div class="mt-1">
                  <span
                    class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    :class="
                      trafficBadgeClass(
                        selectedVisitor.visitor.geo?.trafficType,
                      )
                    "
                  >
                    {{ trafficLabel(selectedVisitor.visitor.geo?.trafficType) }}
                  </span>
                  <span class="ml-2 text-xs text-slate-500">
                    {{ selectedVisitor.visitor.geo?.trafficScore ?? '—' }}/100 ·
                    {{ selectedVisitor.visitor.geo?.trafficReason || '—' }}
                  </span>
                </div>
              </div>

              <div class="col-span-2">
                <div class="text-xs uppercase tracking-wide text-slate-500">
                  User Agent
                </div>
                <div class="mt-1 break-all text-xs text-slate-400">
                  {{ selectedVisitor.visitor.latestUserAgent || '—' }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="session in selectedVisitor.sessions"
              :key="session.sessionId"
              class="rounded-2xl border border-slate-700 bg-slate-900/40 p-5"
            >
              <div class="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div class="text-sm font-semibold text-white">
                    Session · {{ shortDate(session.startedAt) }}
                  </div>
                  <div class="mt-1 text-xs text-slate-500">
                    Landing: {{ session.landingPage || '—' }} · Source:
                    {{ cleanReferrer(session.referrer) }}
                  </div>
                </div>

                <div class="text-right text-xs text-slate-400">
                  <div>{{ session.pageViews }} views</div>
                  <div class="text-emerald-300">
                    {{ session.intentEvents }} intent
                  </div>
                </div>
              </div>

              <div class="space-y-3 border-l border-slate-700 pl-4">
                <div
                  v-for="event in session.events"
                  :key="event.id"
                  class="relative"
                >
                  <div
                    class="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-500"
                  ></div>

                  <div class="text-xs text-slate-500">
                    {{ formatDate(event.occurredAt) }}
                  </div>
                  <div class="mt-1 text-sm text-slate-200">
                    {{ eventLabel(event.type, event.name) }}
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ event.pagePath || event.elementText || '—' }}
                  </div>
                </div>

                <div
                  v-if="!session.events.length"
                  class="text-sm text-slate-500"
                >
                  No events in this session.
                </div>
              </div>
            </div>

            <div
              v-if="!selectedVisitor.sessions.length"
              class="rounded-2xl border border-slate-700 bg-slate-900/40 p-5 text-sm text-slate-500"
            >
              No sessions found for this visitor.
            </div>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>
