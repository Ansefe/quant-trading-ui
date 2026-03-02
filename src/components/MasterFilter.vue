<template>
  <div class="glass rounded-xl p-4 flex flex-col gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#1e2d45] pb-3">
      <div class="flex items-center gap-2">
        <div class="live-dot" />
        <span class="text-sm font-semibold text-[#e2e8f0]">Centro de Mando</span>
      </div>
      <button @click="refresh" class="text-xs text-[#3b82f6] hover:text-[#93c5fd] transition-colors">↻ Refrescar</button>
    </div>

    <!-- Activo -->
    <div>
      <p class="text-[10px] uppercase tracking-widest text-[#475569] mb-2">Activo</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="s in SYMBOLS" :key="s"
          @click="filters.symbol = s"
          :class="[
            'px-3 py-1 rounded-md text-xs font-medium transition-all',
            filters.symbol === s
              ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
              : 'bg-[#1e2d45] text-[#94a3b8] hover:bg-[#2a3f60] hover:text-[#e2e8f0]'
          ]"
        >{{ s.replace('/USDT', '') }}</button>
      </div>
    </div>

    <!-- Trading Mode Cards -->
    <div>
      <p class="text-[10px] uppercase tracking-widest text-[#475569] mb-2">Modo de Análisis</p>
      <div class="flex flex-col gap-1.5">
        <button
          v-for="m in MODES" :key="m.key"
          @click="setMode(m.key)"
          :class="[
            'flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all',
            filters.mode === m.key
              ? 'border-[#3b82f6] bg-[#3b82f6]/10'
              : 'border-[#1e2d45] hover:border-[#2a3f60] bg-transparent'
          ]"
        >
          <span class="text-base leading-none mt-0.5 flex-shrink-0">{{ m.emoji }}</span>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-[#e2e8f0] leading-tight">{{ m.label }}</p>
            <p class="text-[9px] text-[#475569] leading-tight mt-0.5">{{ m.desc }}</p>
            <div class="flex gap-1 mt-1">
              <span
                v-for="tf in m.timeframes" :key="tf"
                class="text-[9px] px-1 rounded bg-[#1e2d45] text-[#94a3b8]"
              >{{ tf }}</span>
            </div>
          </div>
          <div class="ml-auto flex-shrink-0">
            <div :class="['w-2 h-2 rounded-full mt-1', filters.mode === m.key ? 'bg-[#3b82f6]' : 'bg-[#1e2d45]']" />
          </div>
        </button>
      </div>
    </div>

    <!-- Custom TF picker (only in custom mode) -->
    <div v-if="filters.mode === 'custom'" class="border-t border-[#1e2d45] pt-3">
      <p class="text-[10px] uppercase tracking-widest text-[#475569] mb-2">Temporalidades Manuales</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tf in TIMEFRAMES" :key="tf"
          @click="toggleTf(tf)"
          :class="['tf-pill', filters.timeframes.includes(tf) ? 'active' : 'inactive']"
        >{{ tf }}</button>
      </div>
    </div>

    <!-- Include multi-TF toggle -->
    <label class="flex items-center gap-3 cursor-pointer group border-t border-[#1e2d45] pt-3">
      <div
        @click="filters.includeMultiTF = !filters.includeMultiTF"
        :class="['relative w-9 h-5 rounded-full transition-all', filters.includeMultiTF ? 'bg-[#f59e0b]' : 'bg-[#1e2d45]']"
      >
        <span :class="[
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
          filters.includeMultiTF ? 'translate-x-4' : 'translate-x-0'
        ]" />
      </div>
      <div>
        <p class="text-xs text-[#e2e8f0]">Incluir confluencias multi-TF</p>
        <p class="text-[9px] text-[#475569]">
          {{ filters.includeMultiTF
            ? 'Mostrando muros de TF aislada + zonas multi-TF'
            : 'Solo muros puros de la TF seleccionada' }}
        </p>
      </div>
    </label>

    <!-- Divergencias históricas toggle -->
    <label class="flex items-center gap-3 cursor-pointer group">
      <div
        @click="filters.showHistorical = !filters.showHistorical"
        :class="['relative w-9 h-5 rounded-full transition-all', filters.showHistorical ? 'bg-[#3b82f6]' : 'bg-[#1e2d45]']"
      >
        <span :class="[
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
          filters.showHistorical ? 'translate-x-4' : 'translate-x-0'
        ]" />
      </div>
      <span class="text-xs text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors leading-tight">
        Mostrar divergencias históricas
      </span>
    </label>
  </div>
</template>

<script setup>
import { filters, SYMBOLS, TIMEFRAMES } from '../composables/useMarketData.js'

const emit = defineEmits(['refresh'])

const MODES = [
  {
    key: 'scalping',
    emoji: '⚡',
    label: 'Scalping',
    desc: 'Muros aislados de corto plazo',
    timeframes: ['15m', '1h'],
  },
  {
    key: 'swing',
    emoji: '📈',
    label: 'Swing Trading',
    desc: 'Zonas institucionales medias',
    timeframes: ['4h', '1d'],
  },
  {
    key: 'spot',
    emoji: '🏦',
    label: 'Spot / Largo Plazo',
    desc: 'Bloques macro semanales y diarios',
    timeframes: ['1d', '1w'],
  },
  {
    key: 'multitf',
    emoji: '🎯',
    label: 'Multi-TF (Santo Grial)',
    desc: 'Solo muros donde 2+ TFs coinciden',
    timeframes: ['15m', '1h', '4h', '1d', '1w'],
  },
  {
    key: 'custom',
    emoji: '⚙️',
    label: 'Control Manual',
    desc: 'Elige las temporalidades a mano',
    timeframes: [],
  },
]

function setMode(key) {
  filters.mode = key
  const m = MODES.find(m => m.key === key)
  if (key !== 'custom' && m?.timeframes.length) {
    filters.timeframes = [...m.timeframes]
  }
  // multitf mode forces source to multi_tf
  if (key === 'multitf') {
    filters.includeMultiTF = true
  }
}

function toggleTf(tf) {
  const idx = filters.timeframes.indexOf(tf)
  if (idx === -1) filters.timeframes.push(tf)
  else if (filters.timeframes.length > 1) filters.timeframes.splice(idx, 1)
}

function refresh() { emit('refresh') }
</script>
