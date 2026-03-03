<template>
  <div class="glass rounded-xl overflow-hidden">
    <!-- Collapsible header -->
    <button @click="open = !open"
      class="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <p class="text-xs font-semibold text-[#e2e8f0] tracking-wide">📊 Sentimiento IA</p>
      <span class="text-[10px] text-[#475569] transition-transform" :class="open ? '' : '-rotate-90'">▾</span>
    </button>

    <div v-show="open" class="px-4 pb-4 flex flex-col gap-3">

      <!-- TF Selector -->
      <div class="flex items-center gap-0.5">
        <button
          v-for="tf in TFS" :key="tf"
          @click="sentimentTf = tf"
          :class="[
            'text-[9px] font-bold px-1.5 py-0.5 rounded transition-all',
            sentimentTf === tf
              ? 'bg-[#3b82f6] text-white'
              : 'text-[#475569] hover:text-[#94a3b8] hover:bg-[#1e2d45]'
          ]"
        >{{ tf }}</button>
      </div>

      <div v-if="!sentiment && !loading" class="flex items-center justify-center py-4">
        <p class="text-xs text-[#475569]">Sin datos para {{ sentimentTf }}.</p>
      </div>

      <template v-if="sentiment">
        <!-- Triple Gauge Row -->
        <div class="grid grid-cols-3 gap-2">
          <!-- Fundamental (News) -->
          <div class="flex flex-col items-center gap-1 p-2 rounded-lg border"
               :class="borderFor(sentiment.sentiment_news || sentiment.sentiment)">
            <span class="text-lg">📰</span>
            <span class="text-[9px] uppercase font-bold tracking-wider text-[#475569]">Noticias</span>
            <span class="text-xs font-black" :class="colorFor(sentiment.sentiment_news || sentiment.sentiment)">
              {{ emojiFor(sentiment.sentiment_news || sentiment.sentiment) }}
              {{ sentiment.sentiment_news || sentiment.sentiment }}
            </span>
            <span class="text-[10px] font-semibold" :class="colorFor(sentiment.sentiment_news || sentiment.sentiment)">
              {{ sentiment.confidence_news || sentiment.confidence }}%
            </span>
          </div>

          <!-- Technical -->
          <div class="flex flex-col items-center gap-1 p-2 rounded-lg border"
               :class="borderFor(sentiment.sentiment_technical)">
            <span class="text-lg">📈</span>
            <span class="text-[9px] uppercase font-bold tracking-wider text-[#475569]">Técnico</span>
            <span class="text-xs font-black" :class="colorFor(sentiment.sentiment_technical)">
              {{ emojiFor(sentiment.sentiment_technical) }}
              {{ sentiment.sentiment_technical || '-' }}
            </span>
            <span class="text-[10px] font-semibold" :class="colorFor(sentiment.sentiment_technical)">
              {{ sentiment.confidence_technical || '-' }}%
            </span>
          </div>

          <!-- Combined (Main Verdict) -->
          <div class="flex flex-col items-center gap-1 p-2 rounded-lg border-2"
               :class="borderFor(sentiment.sentiment)">
            <span class="text-lg">🎯</span>
            <span class="text-[9px] uppercase font-bold tracking-wider text-[#f59e0b]">Veredicto</span>
            <span class="text-sm font-black" :class="colorFor(sentiment.sentiment)">
              {{ emojiFor(sentiment.sentiment) }}
              {{ sentiment.sentiment }}
            </span>
            <span class="text-xs font-bold" :class="colorFor(sentiment.sentiment)">
              {{ sentiment.confidence }}%
            </span>
          </div>
        </div>

        <!-- Combined Summary -->
        <p class="text-[10px] text-[#94a3b8] italic border-l-2 pl-2"
           :class="borderLeftFor(sentiment.sentiment)">
          "{{ sentiment.summary }}"
        </p>

        <!-- Indicator Semaphore Grid -->
        <div v-if="indicators && Object.keys(indicators).length" class="mt-1">
          <button @click="showSemaphore = !showSemaphore"
            class="flex items-center gap-1 text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors mb-1">
            <span :class="showSemaphore ? '' : '-rotate-90'" class="transition-transform">▾</span>
            🚦 Semáforo de Indicadores
          </button>
          <div v-show="showSemaphore" class="grid grid-cols-2 gap-1">
            <div
              v-for="(data, key) in indicators" :key="key"
              class="flex items-center justify-between px-2 py-1 rounded-md bg-[#0a0e1a]/50 border border-[#1e2d45]"
            >
              <span class="text-[9px] text-[#94a3b8] uppercase font-medium">{{ formatKey(key) }}</span>
              <div class="flex items-center gap-1">
                <span v-if="data.value !== undefined" class="text-[9px] text-[#e2e8f0] font-mono">
                  {{ formatVal(key, data.value) }}
                </span>
                <span v-if="data.signal"
                  :class="[
                    'w-2.5 h-2.5 rounded-full flex-shrink-0',
                    data.signal === 'alcista' ? 'bg-[#10b981]' :
                    data.signal === 'bajista' ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'
                  ]"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TF badge + date -->
        <div class="flex items-center justify-between">
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2d45] text-[#94a3b8] font-mono">
            {{ sentiment.timeframe || '1d' }}
          </span>
          <p class="text-[9px] text-[#475569]">
            {{ formatDate(sentiment.created_at) }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { sentimentTf } from '../composables/useMarketData.js'

const TFS = ['15m', '1h', '4h', '1d', '1w']

const props = defineProps({
  sentiment: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const open = ref(true)
const showSemaphore = ref(false)

const indicators = computed(() => props.sentiment?.indicators || {})

function emojiFor(s) {
  if (s === 'Alcista') return '🟢'
  if (s === 'Bajista') return '🔴'
  return '🟡'
}
function colorFor(s) {
  if (s === 'Alcista') return 'text-[#10b981]'
  if (s === 'Bajista') return 'text-[#ef4444]'
  return 'text-[#f59e0b]'
}
function borderFor(s) {
  if (s === 'Alcista') return 'border-[#10b981]/30 bg-[#10b981]/5'
  if (s === 'Bajista') return 'border-[#ef4444]/30 bg-[#ef4444]/5'
  return 'border-[#f59e0b]/30 bg-[#f59e0b]/5'
}
function borderLeftFor(s) {
  if (s === 'Alcista') return 'border-[#10b981]'
  if (s === 'Bajista') return 'border-[#ef4444]'
  return 'border-[#f59e0b]'
}
function formatKey(k) {
  return k.replace(/_/g, ' ').replace('trend', '↗')
}
function formatVal(key, val) {
  if (val === undefined || val === null) return ''
  if (key.includes('rsi') || key.includes('stoch')) return val.toFixed(1)
  if (val > 100) return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return val.toFixed(2)
}
function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
