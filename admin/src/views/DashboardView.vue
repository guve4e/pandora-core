<template>
  <div class="space-y-6">
    <PageHeader
      title="Dashboard"
      subtitle="Overview of platform activity and internal tools."
    />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">AI Usage</div>
        <div class="mt-2 text-2xl font-semibold text-slate-100">--</div>
      </div>

      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">Conversations</div>
        <div class="mt-2 text-2xl font-semibold text-slate-100">--</div>
      </div>

      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">Visitors</div>
        <div class="mt-2 text-2xl font-semibold text-slate-100">--</div>
      </div>

      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div class="text-xs text-slate-400">System</div>
        <div class="mt-2 text-2xl font-semibold text-slate-100">OK</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PageHeader } from '@org/admin-core';
</script>
