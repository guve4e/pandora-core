<template>
  <component :is="isPublicRoute ? 'div' : AdminShell"
    v-bind="isPublicRoute ? {} : shellProps">
    <RouterView />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { AdminShell, useAuthStore } from '@org/admin-core';
import { adminModule } from './admin.module';

const route = useRoute();
const auth = useAuthStore();
auth.loadFromStorage();
auth.hydrateFromServer();

const isPlatformOwner = computed(() => auth.role === 'platform_owner');
const isPublicRoute = computed(() => !!route.meta.public);

const tenantFeatures = computed(() => auth.tenantFeatures ?? {
  assistant_enabled: false,
  lead_forms_enabled: true,
  analytics_enabled: true,
  conversations_enabled: false,
  visitors_enabled: false,
});

const currentMenu = computed(() => {
  if (isPlatformOwner.value) {
    return adminModule.platformMenu;
  }

  return adminModule.tenantMenu.filter((item) => {
    if (item.to === '/leads') {
      return tenantFeatures.value.lead_forms_enabled;
    }

    if (item.to === '/visitors') {
      return tenantFeatures.value.visitors_enabled;
    }

    if (item.to === '/conversations') {
      return tenantFeatures.value.conversations_enabled;
    }

    if (item.to === '/assistant-config') {
      return tenantFeatures.value.assistant_enabled;
    }

    return true;
  });
});

const tenantDisplayName = computed(() => auth.tenantName || 'Business');

const currentAppName = computed(() =>
  isPlatformOwner.value ? adminModule.appName : tenantDisplayName.value,
);

const currentShellTitle = computed(() =>
  isPlatformOwner.value ? adminModule.shellTitle : tenantDisplayName.value,
);

const currentSubtitle = computed(() =>
  isPlatformOwner.value
    ? 'Platform owner control plane.'
    : 'Business dashboard',
);

const shellProps = computed(() => ({
  menu: currentMenu.value,
  appName: currentAppName.value,
  appSubtitle: currentSubtitle.value,
  shellTitle: currentShellTitle.value,
  footerText: adminModule.footerText,
  userInitials: adminModule.userInitials,
}));
</script>
