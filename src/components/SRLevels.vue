<template>
  <div class="glass rounded-xl overflow-hidden">
    <!-- Collapsible header -->
    <button @click="open = !open"
      class="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <p class="text-xs font-semibold text-[#e2e8f0] tracking-wide">🧱 Muros ATR</p>
      <div class="flex items-center gap-2">
        <span v-if="loading" class="w-3 h-3 rounded-full border-2 border-[#3b82f6] border-t-transparent animate-spin" />
        <span class="text-[10px] text-[#475569] transition-transform" :class="open ? '' : '-rotate-90'">▾</span>
      </div>
    </button>

    <div v-show="open" class="px-4 pb-4 flex flex-col gap-2">

    <!-- Touch filter: slider range -->
    <div>
      <div class="flex items-center justify-between">
        <p class="text-[10px] uppercase tracking-widest text-[#475569]">Mín. toques</p>
        <span class="text-xs font-bold text-[#3b82f6]">×{{ filters.minTouches }}+</span>
      </div>
      <input
        type="range"
        :min="1"
        :max="maxTouches"
        :value="filters.minTouches"
        @input="filters.minTouches = Number($event.target.value)"
        class="w-full h-1 mt-1 appearance-none rounded-full bg-[#1e2d45] cursor-pointer accent-[#3b82f6]"
      />
      <div class="flex justify-between text-[9px] text-[#475569] mt-0.5">
        <span>1</span>
        <span>{{ maxTouches }}</span>
      </div>
    </div>

    <div v-if="!filtered.length && !loading" class="flex-1 flex items-center justify-center">
      <p class="text-xs text-[#475569] text-center">Sin muros con ≥{{ filters.minTouches }} toques.</p>
    </div>

    <div v-else class="flex flex-col gap-1 overflow-y-auto flex-1">
      <div class="text-[10px] uppercase tracking-widest text-[#475569] px-1 mt-1">
        🔴 Resistencias ({{ resistances.length }})
      </div>
      <div
        v-for="lvl in resistances" :key="lvl.id"
        class="table-row-hover rounded-md px-2 py-1.5 flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <div class="w-1.5 h-1.5 rounded-full bg-[#ef4444] flex-shrink-0"
               :style="{ opacity: Math.min(1, 0.3 + lvl.touches * 0.1) }" />
          <span class="text-xs text-[#e2e8f0] font-mono">${{ formatPrice(lvl.price_level) }}</span>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <span v-for="tf in (lvl.confluence || [])" :key="tf"
            class="text-[9px] px-1 py-0.5 rounded bg-[#1e2d45] text-[#94a3b8]">{{ tf }}</span>
          <span class="text-[9px] text-[#3b82f6] font-semibold">×{{ lvl.touches }}</span>
        </div>
      </div>

      <div class="border-t border-[#1e2d45] my-1">
        <p class="text-[9px] text-[#3b82f6] px-1 py-0.5">── PRECIO ACTUAL ──</p>
      </div>

      <div class="text-[10px] uppercase tracking-widest text-[#475569] px-1">
        🟢 Soportes ({{ supports.length }})
      </div>
      <div
        v-for="lvl in supports" :key="lvl.id"
        class="table-row-hover rounded-md px-2 py-1.5 flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <div class="w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0"
               :style="{ opacity: Math.min(1, 0.3 + lvl.touches * 0.1) }" />
          <span class="text-xs text-[#e2e8f0] font-mono">${{ formatPrice(lvl.price_level) }}</span>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <span v-for="tf in (lvl.confluence || [])" :key="tf"
            class="text-[9px] px-1 py-0.5 rounded bg-[#1e2d45] text-[#94a3b8]">{{ tf }}</span>
          <span class="text-[9px] text-[#10b981] font-semibold">×{{ lvl.touches }}</span>
        </div>
      </div>
    </div>

    <p class="text-[9px] text-[#475569] pt-1 border-t border-[#1e2d45]">
      {{ filtered.length }} muros · ×{{ filters.minTouches }}+ toques
    </p>
    </div>
  </div>

<script setup>
import { ref, computed } from 'vue'
import { filters } from '../composables/useMarketData.js'

const open = ref(true)

const props = defineProps({
  levels:  { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

// Dynamic max — adapts to whatever data is loaded
const maxTouches = computed(() =>
  Math.max(1, ...props.levels.map(l => l.touches || 1))
)

const filtered = computed(() =>
  props.levels.filter(l => (l.touches || 1) >= filters.minTouches)
)

const supports    = computed(() => filtered.value.filter(l =>  l.is_support).sort((a,b) => b.price_level - a.price_level))
const resistances = computed(() => filtered.value.filter(l => !l.is_support).sort((a,b) => a.price_level - b.price_level))

function formatPrice(p) {
  if (!p) return '-'
  if (p < 0.001) return p.toFixed(8)
  if (p < 1)     return p.toFixed(4)
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
