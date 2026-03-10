<template>
  <AdminShell
    :menu="adminModule.menu"
    :app-name="adminModule.appName"
    :app-subtitle="adminModule.appSubtitle"
    :shell-title="adminModule.shellTitle"
    :footer-text="adminModule.footerText"
    :user-initials="adminModule.userInitials"
  >
    <RouterView />
  </AdminShell>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { AdminShell } from '@org/admin-core';
import { adminModule } from './admin.module';
</script>
