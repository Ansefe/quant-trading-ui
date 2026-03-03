<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-[#0a0e1a]">

    <!-- Top Bar -->
    <header class="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-[#1e2d45] glass">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">
          ⚡
        </div>
        <div>
          <h1 class="text-sm font-black text-[#e2e8f0] tracking-tight leading-none">Trading Suite</h1>
          <p class="text-[9px] text-[#475569] leading-none">Quant Intelligence · Smart Money Concepts</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Current symbol pill -->
        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e2d45] border border-[#2a3f60]">
          <div class="live-dot" />
          <span class="text-xs font-bold text-[#e2e8f0]">{{ filters.symbol }}</span>
        </div>

        <!-- TF badges -->
        <div class="hidden md:flex items-center gap-1">
          <span v-for="tf in filters.timeframes" :key="tf" class="tf-pill active text-[10px]">{{ tf }}</span>
        </div>

        <!-- Timestamp -->
        <p class="text-[10px] text-[#475569]">{{ currentTime }}</p>
      </div>
    </header>

    <!-- Main Dashboard Body -->
    <div class="flex flex-1 overflow-hidden gap-0">

      <!-- LEFT SIDEBAR: Filters + Confluences -->
      <aside class="w-64 flex-shrink-0 flex flex-col gap-3 p-3 border-r border-[#1e2d45] overflow-y-auto">
        <MasterFilter @refresh="refreshAll" />

        <!-- Confluences Section -->
        <div>
          <p class="text-[10px] uppercase tracking-widest text-[#475569] mb-2 px-1">
            🔥 Confluencias
          </p>
          <ConfluencePanel :official="confluences" :micro="microConfluences" />
        </div>
      </aside>

      <!-- CENTER: Chart -->
      <main class="flex-1 flex flex-col p-3 gap-3 overflow-hidden min-w-0">
        <!-- Chart -->
        <div class="flex-1 relative glass rounded-xl overflow-hidden min-h-0">
        <Chart
            :sr-levels="filteredLevels"
            :fvgs="fvgs"
            :symbol="filters.symbol"
          />
        </div>

        <!-- Bottom: Divergences horizontal strip -->
        <div class="flex-shrink-0 glass rounded-xl p-3">
          <div class="flex items-center gap-2 mb-2">
            <p class="text-[10px] uppercase tracking-widest text-[#475569]">📡 Divergencias RSI</p>
            <span v-if="divLoading" class="w-2.5 h-2.5 rounded-full border border-[#3b82f6] border-t-transparent animate-spin" />
          </div>
          <div v-if="!divergences.length" class="text-xs text-[#475569]">No hay divergencias con los filtros actuales.</div>
          <div v-else class="flex gap-2 overflow-x-auto pb-1">
            <div
              v-for="div in divergences"
              :key="div.id"
              :class="[
                'flex-shrink-0 rounded-lg px-3 py-2 border min-w-[130px]',
                div.type?.includes('ALCISTA')
                  ? 'border-[#10b981]/30 bg-[#10b981]/5'
                  : 'border-[#ef4444]/30 bg-[#ef4444]/5'
              ]"
            >
              <p class="text-[10px] font-bold" :class="div.type?.includes('ALCISTA') ? 'text-[#10b981]' : 'text-[#ef4444]'">
                {{ div.type?.includes('ALCISTA') ? '▲ Alcista' : '▼ Bajista' }}
              </p>
              <p class="text-[9px] text-[#94a3b8] mt-0.5">{{ div.timeframe }} · RSI {{ div.rsi?.toFixed(1) }}</p>
              <p class="text-[9px] text-[#475569]">{{ div.state?.includes('ACTIVA') ? '🔥 Activa' : '🕰 Hist.' }}</p>
            </div>
          </div>
        </div>
      </main>

      <!-- RIGHT SIDEBAR: SR Levels + FVGs + Sentiment -->
      <aside class="w-64 flex-shrink-0 p-3 space-y-3 border-l border-[#1e2d45] overflow-y-auto">
        <SentimentWidget :sentiment="sentiment" :loading="sentLoading" :sentimentTf="sentimentTf" />
        <SRLevels :levels="levels" :loading="srLoading" />
        <FVGList :fvgs="fvgs" :loading="fvgLoading" />
      </aside>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import Chart from './components/Chart.vue'
import MasterFilter from './components/MasterFilter.vue'
import SRLevels from './components/SRLevels.vue'
import Divergences from './components/Divergences.vue'
import FVGList from './components/FVGList.vue'
import SentimentWidget from './components/SentimentWidget.vue'
import ConfluencePanel from './components/ConfluencePanel.vue'

import {
  filters,
  useSRLevels,
  useDivergences,
  useFVGs,
  useSentiment,
  useConfluences,
  calcMicroConfluences,
} from './composables/useMarketData.js'

const { levels, loading: srLoading, fetch: fetchSR } = useSRLevels()
const { divergences, loading: divLoading, fetch: fetchDiv } = useDivergences()
const { fvgs, loading: fvgLoading, fetch: fetchFVG } = useFVGs()
const { sentiment, loading: sentLoading, sentimentTf, fetch: fetchSent } = useSentiment()
const { confluences, fetch: fetchConf } = useConfluences()

// Micro confluences are recalculated whenever visible data changes
const microConfluences = computed(() =>
  calcMicroConfluences(levels, divergences, fvgs, sentiment)
)

// Levels filtered by minTouches — shared by Chart and SRLevels widget
const filteredLevels = computed(() =>
  levels.value.filter(l => (l.touches || 1) >= filters.minTouches)
)

// Refresh all data
function refreshAll() {
  fetchSR(); fetchDiv(); fetchFVG(); fetchSent(); fetchConf()
}

// Live clock
const currentTime = ref('')
function updateTime() {
  currentTime.value = new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Bogota'
  })
}
let clockInterval
onMounted(() => {
  updateTime()
  clockInterval = setInterval(updateTime, 1000)
})
onUnmounted(() => clearInterval(clockInterval))
</script>
