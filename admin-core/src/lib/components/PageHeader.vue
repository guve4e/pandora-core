<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <h1 class="text-lg font-semibold text-slate-100 truncate">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-1 text-sm text-slate-400">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.default" class="flex items-center gap-2 shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>
