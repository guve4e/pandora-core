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

const isPlatformOwner = computed(() => auth.role === 'platform_owner');
const isPublicRoute = computed(() => !!route.meta.public);

const currentMenu = computed(() =>
  isPlatformOwner.value ? adminModule.platformMenu : adminModule.tenantMenu,
);

const currentSubtitle = computed(() =>
  isPlatformOwner.value
    ? 'Platform owner control plane.'
    : 'Tenant workspace.',
);

const shellProps = computed(() => ({
  menu: currentMenu.value,
  appName: adminModule.appName,
  appSubtitle: currentSubtitle.value,
  shellTitle: adminModule.shellTitle,
  footerText: adminModule.footerText,
  userInitials: adminModule.userInitials,
}));
</script>
