<template>
  <div class="glass rounded-xl overflow-hidden">
    <button @click="open = !open"
      class="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <p class="text-xs font-semibold text-[#e2e8f0] tracking-wide">📡 Divergencias RSI</p>
      <div class="flex items-center gap-2">
        <span v-if="loading" class="w-3 h-3 rounded-full border-2 border-[#3b82f6] border-t-transparent animate-spin" />
        <span class="text-[10px] text-[#475569] transition-transform" :class="open ? '' : '-rotate-90'">▾</span>
      </div>
    </button>

    <div v-show="open" class="px-4 pb-4 flex flex-col gap-1.5">
      <div v-if="!divergences.length && !loading" class="flex items-center justify-center py-2">
        <p class="text-xs text-[#475569]">No hay divergencias detectadas.</p>
      </div>

      <div class="flex flex-col gap-1.5 overflow-y-auto flex-1">
        <div
          v-for="div in divergences"
          :key="div.id"
          class="table-row-hover rounded-lg px-2 py-2 border"
          :class="isBull(div) ? 'border-[#10b981]/20 bg-[#10b981]/5' : 'border-[#ef4444]/20 bg-[#ef4444]/5'"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col gap-0.5 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold" :class="isBull(div) ? 'text-[#10b981]' : 'text-[#ef4444]'">
                  {{ isBull(div) ? '▲ ALCISTA' : '▼ BAJISTA' }}
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  :class="isActive(div) ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#1e2d45] text-[#475569]'"
                >{{ isActive(div) ? '🔥 ACTIVA' : '🕰️ HIST.' }}</span>
              </div>
              <p class="text-[10px] text-[#94a3b8] truncate">
                {{ formatDate(div.divergence_date) }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2d45] text-[#94a3b8] font-mono">{{ div.timeframe }}</span>
              <span class="text-[10px] text-[#94a3b8] font-mono">
                RSI {{ div.rsi?.toFixed(1) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const open = ref(true)

const props = defineProps({
  divergences: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const isBull = (d) => d.type?.includes('ALCISTA')
const isActive = (d) => d.state?.includes('ACTIVA')

function formatDate(dt) {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
