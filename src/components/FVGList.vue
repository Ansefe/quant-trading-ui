<template>
  <div class="glass rounded-xl overflow-hidden">
    <button @click="open = !open"
      class="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <p class="text-xs font-semibold text-[#e2e8f0] tracking-wide">🐋 Fair Value Gaps</p>
      <div class="flex items-center gap-2">
        <span v-if="loading" class="w-3 h-3 rounded-full border-2 border-[#3b82f6] border-t-transparent animate-spin" />
        <span class="text-[10px] text-[#475569] transition-transform" :class="open ? '' : '-rotate-90'">▾</span>
      </div>
    </button>

    <div v-show="open" class="px-4 pb-4 flex flex-col gap-2">
      <div v-if="!fvgs.length && !loading" class="flex items-center justify-center py-2">
        <p class="text-xs text-[#475569]">No hay FVGs sin mitigar en vista.</p>
      </div>

      <!-- Above price (magnets up) -->
      <div v-if="above.length">
        <p class="text-[10px] uppercase tracking-widest text-[#475569] mb-1">Imanes ↑ (Alcistas)</p>
        <div v-for="f in above" :key="f.id" class="table-row-hover rounded-md px-2 py-1.5 border border-[#10b981]/20 bg-[#10b981]/5 mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-[#e2e8f0] font-mono">${{ fmt(f.bottom_price) }} – ${{ fmt(f.top_price) }}</span>
              <span class="text-[9px] text-[#475569]">{{ formatDate(f.fvg_date) }}</span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-[9px] px-1 rounded bg-[#1e2d45] text-[#94a3b8]">{{ f.timeframe }}</span>
              <span class="text-[10px] text-[#10b981] font-semibold">+{{ f.distance_pct?.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="above.length && below.length" class="border-t border-[#1e2d45] my-1" />

      <!-- Below price (magnets down) -->
      <div v-if="below.length">
        <p class="text-[10px] uppercase tracking-widest text-[#475569] mb-1">Imanes ↓ (Bajistas)</p>
        <div v-for="f in below" :key="f.id" class="table-row-hover rounded-md px-2 py-1.5 border border-[#ef4444]/20 bg-[#ef4444]/5 mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-[#e2e8f0] font-mono">${{ fmt(f.bottom_price) }} – ${{ fmt(f.top_price) }}</span>
              <span class="text-[9px] text-[#475569]">{{ formatDate(f.fvg_date) }}</span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-[9px] px-1 rounded bg-[#1e2d45] text-[#94a3b8]">{{ f.timeframe }}</span>
              <span class="text-[10px] text-[#ef4444] font-semibold">{{ f.distance_pct?.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const open = ref(true)

const props = defineProps({
  fvgs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const above = computed(() => props.fvgs.filter(f => f.distance_pct > 0).slice(0, 4))
const below = computed(() => props.fvgs.filter(f => f.distance_pct <= 0).slice(0, 4))

function fmt(p) {
  if (!p) return '-'
  if (p < 0.001) return p.toFixed(8)
  if (p < 1) return p.toFixed(4)
  return p.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
