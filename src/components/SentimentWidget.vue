<template>
  <div class="glass rounded-xl p-4 flex flex-col gap-2">
    <p class="text-xs font-semibold text-[#e2e8f0] tracking-wide mb-1">📊 Sentimiento Macro IA</p>

    <div v-if="!sentiment && !loading" class="flex items-center justify-center py-4">
      <p class="text-xs text-[#475569]">Sin datos de sentimiento.</p>
    </div>

    <div v-else-if="sentiment" class="flex flex-col gap-3">
      <!-- Big Gauge indicator -->
      <div class="flex items-center justify-center py-2">
        <div :class="['relative w-20 h-20 rounded-full flex items-center justify-center border-4', borderClass]">
          <div class="text-center">
            <p class="text-lg font-black" :class="textClass">{{ emoji }}</p>
            <p class="text-[9px] uppercase font-bold tracking-widest" :class="textClass">{{ sentiment.sentiment }}</p>
          </div>
        </div>
      </div>

      <!-- Confidence bar -->
      <div>
        <div class="flex justify-between text-[10px] mb-1">
          <span class="text-[#475569]">Confianza GPT-4o</span>
          <span class="font-semibold" :class="textClass">{{ sentiment.confidence }}%</span>
        </div>
        <div class="h-1.5 bg-[#1e2d45] rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700" :class="barClass" :style="{ width: sentiment.confidence + '%' }" />
        </div>
      </div>

      <!-- Summary -->
      <p class="text-[10px] text-[#94a3b8] leading-relaxed italic border-l-2 pl-2" :class="borderLeftClass">
        "{{ sentiment.summary }}"
      </p>

      <p class="text-[9px] text-[#475569]">
        Actualizado: {{ formatDate(sentiment.created_at) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sentiment: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const isBull = computed(() => props.sentiment?.sentiment === 'Alcista')
const isBear = computed(() => props.sentiment?.sentiment === 'Bajista')

const emoji = computed(() => isBull.value ? '🟢' : isBear.value ? '🔴' : '🟡')
const textClass = computed(() => isBull.value ? 'text-[#10b981]' : isBear.value ? 'text-[#ef4444]' : 'text-[#f59e0b]')
const borderClass = computed(() => isBull.value ? 'border-[#10b981]/50' : isBear.value ? 'border-[#ef4444]/50' : 'border-[#f59e0b]/50')
const barClass = computed(() => isBull.value ? 'bg-[#10b981]' : isBear.value ? 'bg-[#ef4444]' : 'bg-[#f59e0b]')
const borderLeftClass = computed(() => isBull.value ? 'border-[#10b981]' : isBear.value ? 'border-[#ef4444]' : 'border-[#f59e0b]')

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
