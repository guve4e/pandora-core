<template>
  <div v-if="isLoginRoute">
    <slot />
  </div>

  <div v-else class="min-h-screen bg-slate-950 text-slate-100">
    <header
      class="lg:hidden h-14 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-4 backdrop-blur"
    >
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 transition"
        @click="sidebarOpen = true"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-5 w-5 text-slate-200"
        >
          <path
            fill-rule="evenodd"
            d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25A.75.75 0 013.75 11.25h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25A.75.75 0 013.75 16.5h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 17.25z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <div class="min-w-0 flex-1 px-3">
        <div class="text-xs text-slate-400 truncate">{{ appName }}</div>
        <div class="text-sm font-semibold text-slate-100 truncate">
          {{ currentTitle }}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div ref="notificationsElMobile" class="relative">
          <button
            type="button"
            class="relative rounded-full p-1.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 transition"
            aria-label="Notifications"
            @click.stop="toggleNotifications()"
          >
            <span
              v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
            >
              {{ unreadBadge }}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-4 w-4 text-slate-400 opacity-80"
            >
              <path
                d="M12 2a7 7 0 00-7 7v3.586l-.707.707A1 1 0 005 16h14a1 1 0 00.707-1.707L19 12.586V9a7 7 0 00-7-7zm0 20a3 3 0 002.995-2.824L15 19h-6a3 3 0 002.824 2.995L12 22z"
              />
            </svg>
          </button>

          <div
            v-if="notificationsOpen"
            class="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-md border border-slate-800 bg-slate-900 shadow-lg overflow-hidden z-50"
          >
            <div
              class="flex items-center justify-between px-3 py-2 border-b border-slate-800"
            >
              <span class="text-xs font-semibold text-slate-100"
                >Notifications</span
              >
              <button
                v-if="notifications.length"
                type="button"
                class="text-[11px] text-slate-400 hover:text-slate-200"
                @click="onMarkAllRead"
              >
                Mark all read
              </button>
            </div>

            <div
              v-if="notificationsLoading"
              class="px-3 py-4 text-xs text-slate-400"
            >
              Loading...
            </div>

            <div
              v-else-if="!notifications.length"
              class="px-3 py-4 text-xs text-slate-500"
            >
              No notifications.
            </div>

            <div v-else class="max-h-96 overflow-y-auto">
              <button
                v-for="item in notifications"
                :key="item.id"
                type="button"
                class="w-full text-left px-3 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50"
                @click="onNotificationClick(item)"
              >
                <div class="flex items-start gap-2">
                  <span
                    class="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                    :class="severityDotClass(item.severity, item.is_read)"
                  ></span>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-3">
                          <p
                            class="text-xs truncate"
                            :class="
                              item.is_read
                                ? 'text-slate-400'
                                : 'text-slate-100 font-medium'
                            "
                          >
                            {{ item.title }}
                          </p>
                          <span
                            class="text-[10px] text-slate-500 whitespace-nowrap"
                          >
                            {{ formatDate(item.created_at) }}
                          </span>
                        </div>

                        <p
                          class="mt-1 text-[11px] leading-5"
                          :class="
                            item.is_read ? 'text-slate-500' : 'text-slate-300'
                          "
                        >
                          {{ item.message }}
                        </p>
                      </div>

                      <button
                        type="button"
                        class="ml-2 rounded p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800/80"
                        aria-label="Dismiss notification"
                        @click.stop="onDismissNotification(item)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          class="h-3.5 w-3.5"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div ref="userMenuElMobile" class="relative">
          <button
            type="button"
            class="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] border border-slate-600 hover:border-slate-400 transition"
            aria-label="User menu"
            @click.stop="toggleUserMenu()"
          >
            {{ initials }}
          </button>

          <div
            v-if="userMenuOpen"
            class="absolute right-0 mt-2 w-44 rounded-md border border-slate-800 bg-slate-900 shadow-lg overflow-hidden z-50"
          >
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/70"
              @click="goSettings"
            >
              Settings
            </button>

            <div class="h-px bg-slate-800"></div>

            <button
              type="button"
              class="w-full text-left px-3 py-2 text-xs text-red-200 hover:bg-slate-800/70"
              @click="onLogout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="sidebarOpen"
      class="lg:hidden fixed inset-0 z-50"
      aria-modal="true"
      role="dialog"
    >
      <div
        class="absolute inset-0 bg-black/60"
        @click="sidebarOpen = false"
      ></div>

      <aside
        class="absolute left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 flex flex-col"
      >
        <div
          class="h-14 px-4 flex items-center justify-between border-b border-slate-800"
        >
          <span class="text-sm font-semibold tracking-tight">
            {{ shellTitle }}
          </span>

          <button
            type="button"
            class="rounded-md p-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 transition"
            @click="sidebarOpen = false"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-5 w-5 text-slate-200"
            >
              <path
                fill-rule="evenodd"
                d="M6.22 6.22a.75.75 0 011.06 0L12 10.94l4.72-4.72a.75.75 0 111.06 1.06L13.06 12l4.72 4.72a.75.75 0 11-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 11-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 010-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <nav class="flex-1 px-2 py-4 space-y-1 text-xs">
          <RouterLink
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            class="group flex items-center px-3 py-2 rounded-md"
            :class="
              isActive(item.to)
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            "
            @click="sidebarOpen = false"
          >
            <span class="mr-2 text-[10px] opacity-70">●</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="p-3 border-t border-slate-800 text-[11px] text-slate-500">
          {{ footerText }}
        </div>
      </aside>
    </div>

    <div class="flex">
      <aside
        class="hidden lg:flex w-64 bg-slate-900 text-slate-100 flex-col border-r border-slate-800 min-h-screen"
      >
        <div class="h-14 px-4 flex items-center border-b border-slate-800">
          <span class="text-sm font-semibold tracking-tight">
            {{ shellTitle }}
          </span>
        </div>

        <nav class="flex-1 px-2 py-4 space-y-1 text-xs">
          <RouterLink
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            class="group flex items-center px-3 py-2 rounded-md"
            :class="
              isActive(item.to)
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            "
          >
            <span class="mr-2 text-[10px] opacity-70">●</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="p-3 border-t border-slate-800 text-[11px] text-slate-500">
          {{ footerText }}
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-h-screen">
        <header
          class="hidden lg:flex h-14 bg-slate-900/95 border-b border-slate-800 items-center justify-between px-6 backdrop-blur"
        >
          <div>
            <h1 class="text-sm font-semibold text-slate-100">
              {{ currentTitle }}
            </h1>
            <p class="text-xs text-slate-400">{{ appSubtitle }}</p>
          </div>

          <div class="flex items-center gap-4 text-xs text-slate-300">
            <div ref="notificationsEl" class="relative">
              <button
                type="button"
                class="relative rounded-full p-1.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 transition"
                aria-label="Notifications"
                @click.stop="toggleNotifications()"
              >
                <span
                  v-if="unreadCount > 0"
                  class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
                >
                  {{ unreadBadge }}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-4 w-4 text-slate-400 opacity-80"
                >
                  <path
                    d="M12 2a7 7 0 00-7 7v3.586l-.707.707A1 1 0 005 16h14a1 1 0 00.707-1.707L19 12.586V9a7 7 0 00-7-7zm0 20a3 3 0 002.995-2.824L15 19h-6a3 3 0 002.824 2.995L12 22z"
                  />
                </svg>
              </button>

              <div
                v-if="notificationsOpen"
                class="absolute right-0 mt-2 w-96 rounded-md border border-slate-800 bg-slate-900 shadow-lg overflow-hidden z-50"
              >
                <div
                  class="flex items-center justify-between px-3 py-2 border-b border-slate-800"
                >
                  <span class="text-xs font-semibold text-slate-100"
                    >Notifications</span
                  >
                  <button
                    v-if="notifications.length"
                    type="button"
                    class="text-[11px] text-slate-400 hover:text-slate-200"
                    @click="onMarkAllRead"
                  >
                    Mark all read
                  </button>
                </div>

                <div
                  v-if="notificationsLoading"
                  class="px-3 py-4 text-xs text-slate-400"
                >
                  Loading...
                </div>

                <div
                  v-else-if="!notifications.length"
                  class="px-3 py-4 text-xs text-slate-500"
                >
                  No notifications.
                </div>

                <div v-else class="max-h-96 overflow-y-auto">
                  <button
                    v-for="item in notifications"
                    :key="item.id"
                    type="button"
                    class="w-full text-left px-3 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50"
                    @click="onNotificationClick(item)"
                  >
                    <div class="flex items-start gap-2">
                      <span
                        class="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                        :class="severityDotClass(item.severity, item.is_read)"
                      ></span>

                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-3">
                          <p
                            class="text-xs truncate"
                            :class="
                              item.is_read
                                ? 'text-slate-400'
                                : 'text-slate-100 font-medium'
                            "
                          >
                            {{ item.title }}
                          </p>
                          <span
                            class="text-[10px] text-slate-500 whitespace-nowrap"
                          >
                            {{ formatDate(item.created_at) }}
                          </span>
                        </div>

                        <p
                          class="mt-1 text-[11px] leading-5"
                          :class="
                            item.is_read ? 'text-slate-500' : 'text-slate-300'
                          "
                        >
                          {{ item.message }}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div ref="userMenuEl" class="relative">
              <button
                type="button"
                class="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] border border-slate-600 hover:border-slate-400 transition"
                aria-label="User menu"
                @click.stop="toggleUserMenu()"
              >
                {{ initials }}
              </button>

              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-44 rounded-md border border-slate-800 bg-slate-900 shadow-lg overflow-hidden"
              >
                <button
                  type="button"
                  class="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/70"
                  @click="goSettings"
                >
                  Settings
                </button>

                <div class="h-px bg-slate-800"></div>

                <button
                  type="button"
                  class="w-full text-left px-3 py-2 text-xs text-red-200 hover:bg-slate-800/70"
                  @click="onLogout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1">
          <div class="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
            <div
              class="border border-slate-800 rounded-lg bg-slate-900/60 shadow-sm p-4"
            >
              <slot />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../auth/auth.store';
import type { AdminMenuItem } from './types';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../api/notifications';
import { debug, debugError } from '../debug';

const props = withDefaults(
  defineProps<{
    menu: AdminMenuItem[];
    appName?: string;
    appSubtitle?: string;
    shellTitle?: string;
    footerText?: string;
    userInitials?: string;
  }>(),
  {
    appName: 'Admin',
    appSubtitle: 'Internal tools',
    shellTitle: 'Internal system console',
    footerText: 'v0.1 · internal',
    userInitials: 'AD',
  },
);

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const sidebarOpen = ref(false);
const isLoginRoute = computed(() => route.name === 'login');

const currentTitle = computed(() => {
  const found = props.menu.find((m) => m.to === route.path);
  return found?.label ?? 'Dashboard';
});

function isActive(path: string) {
  return route.path === path;
}

const userMenuOpen = ref(false);
const userMenuEl = ref<HTMLElement | null>(null);
const userMenuElMobile = ref<HTMLElement | null>(null);

const notificationsOpen = ref(false);
const notificationsEl = ref<HTMLElement | null>(null);
const notificationsElMobile = ref<HTMLElement | null>(null);
const notificationsLoading = ref(false);
const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);
let pollTimer: number | null = null;

const initials = computed(() => props.userInitials || 'AD');
const unreadBadge = computed(() =>
  unreadCount.value > 99 ? '99+' : String(unreadCount.value),
);

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
  if (userMenuOpen.value) {
    notificationsOpen.value = false;
  }
  debug('shell', 'toggleUserMenu', { userMenuOpen: userMenuOpen.value });
}

function closeUserMenu() {
  userMenuOpen.value = false;
}

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value;

  if (notificationsOpen.value) {
    userMenuOpen.value = false;
  }

  debug('shell', 'toggleNotifications', {
    notificationsOpen: notificationsOpen.value,
    accessToken: !!auth.accessToken,
    userId: auth.userId,
  });
}

function closeNotifications() {
  notificationsOpen.value = false;
}

function onDocClick(e: MouseEvent) {
  const t = e.target as Node;

  if (userMenuOpen.value) {
    const insideDesktop = userMenuEl.value?.contains(t);
    const insideMobile = userMenuElMobile.value?.contains(t);
    if (!insideDesktop && !insideMobile) closeUserMenu();
  }

  if (notificationsOpen.value) {
    const insideDesktop = notificationsEl.value?.contains(t);
    const insideMobile = notificationsElMobile.value?.contains(t);
    if (!insideDesktop && !insideMobile) closeNotifications();
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeUserMenu();
    closeNotifications();
  }
}

function goSettings() {
  closeUserMenu();
  closeNotifications();
  sidebarOpen.value = false;
  router.push('/settings');
}

async function onLogout() {
  sidebarOpen.value = false;
  closeUserMenu();
  closeNotifications();
  await auth.logout();
  await router.push({ name: 'login' });
}

async function loadUnreadCount(source = 'unknown') {
  debug('shell', 'loadUnreadCount:start', {
    source,
    accessToken: !!auth.accessToken,
    userId: auth.userId,
    route: route.fullPath,
  });

  if (!auth.accessToken || !auth.userId) {
    unreadCount.value = 0;
    debug('shell', 'loadUnreadCount:skip:not-ready');
    return;
  }

  try {
    const count = await getUnreadNotificationCount();
    unreadCount.value = count;
    debug('shell', 'loadUnreadCount:done', { source, count });
  } catch (err) {
    unreadCount.value = 0;
    debugError('shell', 'loadUnreadCount:error', err);
  }
}

async function loadNotifications(source = 'unknown') {
  debug('shell', 'loadNotifications:start', {
    source,
    accessToken: !!auth.accessToken,
    userId: auth.userId,
    route: route.fullPath,
  });

  if (!auth.accessToken || !auth.userId) {
    notifications.value = [];
    debug('shell', 'loadNotifications:skip:not-ready');
    return;
  }

  notificationsLoading.value = true;
  try {
    const items = await getNotifications(20);
    notifications.value = items;
    debug('shell', 'loadNotifications:done', {
      source,
      count: items.length,
      ids: items.map((x) => x.id),
    });
  } catch (err) {
    notifications.value = [];
    debugError('shell', 'loadNotifications:error', err);
  } finally {
    notificationsLoading.value = false;
  }
}

async function onMarkAllRead() {
  debug('shell', 'onMarkAllRead');
  await markAllNotificationsRead();
  await loadNotifications('mark-all');
  await loadUnreadCount('mark-all');
}

function severityDotClass(
  severity: NotificationItem['severity'],
  isRead: boolean,
) {
  if (isRead) return 'bg-slate-600';
  if (severity === 'critical' || severity === 'error') return 'bg-red-500';
  if (severity === 'warning') return 'bg-amber-400';
  if (severity === 'success') return 'bg-emerald-500';
  return 'bg-sky-400';
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function startPolling() {
  stopPolling();

  const intervalMs = notificationsOpen.value ? 5000 : 20000;

  debug('shell', 'startPolling', {
    intervalMs,
    notificationsOpen: notificationsOpen.value,
  });

  pollTimer = window.setInterval(async () => {
    debug('shell', 'poll:tick', {
      accessToken: !!auth.accessToken,
      userId: auth.userId,
      notificationsOpen: notificationsOpen.value,
      route: route.fullPath,
    });

    if (!auth.accessToken || !auth.userId || isLoginRoute.value) {
      debug('shell', 'poll:skip:not-ready-or-login');
      return;
    }

    await loadUnreadCount('poll');

    if (notificationsOpen.value) {
      await loadNotifications('poll');
    }
  }, intervalMs);
}

function stopPolling() {
  if (pollTimer !== null) {
    debug('shell', 'stopPolling');
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

watch(
  () => notificationsOpen.value,
  async (open) => {
    debug('shell', 'watch:notificationsOpen', open);

    if (!auth.accessToken || !auth.userId) {
      debug('shell', 'watch:notificationsOpen:skip:not-ready');
      return;
    }

    if (open) {
      await loadUnreadCount('open-watch');
      await loadNotifications('open-watch');
    }

    startPolling();
  },

  async function onDismissNotification(item: NotificationItem) {
    if (!item.is_read) {
      await markNotificationRead(item.id);
    }

    await loadNotifications('dismiss-item');
    await loadUnreadCount('dismiss-item');
  },
);

watch(
  () => route.fullPath,
  (value) => {
    debug('shell', 'watch:route.fullPath', value);
    sidebarOpen.value = false;
    closeUserMenu();
    closeNotifications();
  },
);

watch(
  () => [auth.accessToken, auth.userId],
  async ([accessToken, userId]) => {
    debug('shell', 'watch:auth', {
      accessToken: !!accessToken,
      userId,
      isAuthenticated: auth.isAuthenticated,
    });

    if (accessToken && userId) {
      await loadUnreadCount('auth-watch');
      if (notificationsOpen.value) {
        await loadNotifications('auth-watch');
      }
      startPolling();
    } else {
      notifications.value = [];
      unreadCount.value = 0;
      stopPolling();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  debug('shell', 'mounted', {
    accessToken: !!auth.accessToken,
    userId: auth.userId,
    isAuthenticated: auth.isAuthenticated,
    route: route.fullPath,
  });

  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);
  document.documentElement.classList.add('dark');

  if (auth.accessToken && auth.userId) {
    await loadUnreadCount('mounted');
    if (notificationsOpen.value) {
      await loadNotifications('mounted');
    }
    startPolling();
  }
});

onBeforeUnmount(() => {
  debug('shell', 'beforeUnmount');
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onKey);
  stopPolling();
});

async function onNotificationClick(item: NotificationItem) {
  debug('shell', 'onNotificationClick', {
    id: item.id,
    isRead: item.is_read,
    link: item.link,
  });

  if (!item.is_read) {
    await markNotificationRead(item.id);
  }

  await loadNotifications('click-item');
  await loadUnreadCount('click-item');

  if (item.link) {
    closeNotifications();
    await router.push(item.link);
  }
}

async function onDismissNotification(item: NotificationItem) {
  if (!item.is_read) {
    await markNotificationRead(item.id);
  }

  await loadNotifications('dismiss-item');
  await loadUnreadCount('dismiss-item');
}
</script>
