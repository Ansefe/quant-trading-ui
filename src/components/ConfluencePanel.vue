<template>
  <!-- Official Confluences from Orchestrator -->
  <div v-if="official.length || micro.length" class="flex flex-col gap-2">
    <!-- Official -->
    <template v-if="official.length">
      <div
        v-for="c in official"
        :key="c.id"
        :class="[
          'rounded-xl p-4 border relative overflow-hidden',
          c.setup_type === 'LONG'
            ? 'border-[#10b981]/40 bg-gradient-to-r from-[#10b981]/10 to-[#0a0e1a] score-' + c.score
            : 'border-[#ef4444]/40 bg-gradient-to-r from-[#ef4444]/10 to-[#0a0e1a] score-' + c.score
        ]"
      >
        <!-- Glow accent bar -->
        <div :class="['absolute top-0 left-0 h-0.5 w-full', c.setup_type === 'LONG' ? 'bg-[#10b981]' : 'bg-[#ef4444]']" />

        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="text-base font-black" :class="c.setup_type === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'">
                {{ c.setup_type === 'LONG' ? '🚀 LONG' : '🩸 SHORT' }}
              </span>
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] font-bold uppercase tracking-wider">
                👑 Oficial
              </span>
            </div>
            <p class="text-[10px] text-[#94a3b8]">
              Target: <span class="text-[#e2e8f0] font-mono">${{ fmt(c.target_price) }}</span>
            </p>
            <p v-if="c.details?.sentiment" class="text-[10px] text-[#94a3b8]">
              Sentimiento: <span class="font-medium" :class="sentClass(c.details.sentiment)">{{ c.details.sentiment }}</span>
            </p>
            <div v-if="c.details?.support_tf || c.details?.resistance_tf" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="tf in (c.details?.support_tf || c.details?.resistance_tf || [])"
                :key="tf"
                class="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2d45] text-[#94a3b8]"
              >{{ tf }}</span>
            </div>
          </div>
          <!-- Score ring -->
          <div :class="[
            'flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm',
            c.score >= 9 ? 'border-[#10b981] text-[#10b981]' : 'border-[#f59e0b] text-[#f59e0b]'
          ]">
            {{ c.score }}/10
          </div>
        </div>
      </div>
    </template>

    <!-- Micro confluences (client-side) -->
    <template v-if="micro.length">
      <div
        v-for="c in micro"
        :key="c.id"
        :class="[
          'rounded-xl p-3 border',
          c.setup_type === 'LONG'
            ? 'border-[#10b981]/20 bg-[#10b981]/5'
            : 'border-[#ef4444]/20 bg-[#ef4444]/5'
        ]"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold" :class="c.setup_type === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'">
                {{ c.setup_type === 'LONG' ? '↑ MicroLong' : '↓ MicroShort' }}
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] font-medium">
                ⚡ Vista actual
              </span>
            </div>
            <p class="text-[9px] text-[#94a3b8]">
              RSI divs en: {{ (c.details?.rsi_tf || []).join(', ') }}
            </p>
          </div>
          <div class="text-xs font-bold text-[#94a3b8]">{{ c.score }}/10</div>
        </div>
      </div>
    </template>
  </div>

  <!-- Empty state -->
  <div v-else class="glass rounded-xl p-4 flex items-center gap-3">
    <span class="text-xl">💤</span>
    <div>
      <p class="text-xs font-semibold text-[#e2e8f0]">Sin confluencias activas</p>
      <p class="text-[10px] text-[#475569]">Ajusta los filtros o espera la próxima actualización.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  official: { type: Array, default: () => [] },
  micro: { type: Array, default: () => [] },
})

function fmt(p) {
  if (!p) return '-'
  return p.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function sentClass(s) {
  if (s === 'Alcista') return 'text-[#10b981]'
  if (s === 'Bajista') return 'text-[#ef4444]'
  return 'text-[#f59e0b]'
}
</script>
