<template>
  <div class="space-y-4 max-w-xl">
    <div>
      <h2 class="text-sm font-semibold text-slate-100">Settings</h2>
      <p class="text-xs text-slate-400 mt-1">
        Internal toggles for models, limits, and safety.
      </p>
    </div>

    <div class="border border-slate-800 rounded-lg bg-slate-900/60 p-4 space-y-4 text-xs">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-medium text-slate-100">Enable non-legal chat</div>
          <div class="text-[11px] text-slate-500 mt-1">
            Allow AIAdvocate to answer normal questions when category = non-legal.
          </div>
        </div>
        <button class="px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[11px] font-medium">
          ON
        </button>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-medium text-slate-100">Max tokens per answer</div>
          <div class="text-[11px] text-slate-500 mt-1">
            Limit cost per answer to avoid surprises.
          </div>
        </div>
        <input
          type="number"
          class="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value="1024"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
