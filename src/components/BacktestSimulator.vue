<template>
  <div class="flex h-full">
    <!-- LEFT PANEL: Parameters -->
    <aside class="w-80 flex-shrink-0 p-4 border-r border-[#1e2d45] overflow-y-auto space-y-4">
      <h2 class="text-sm font-bold text-[#e2e8f0] tracking-wide flex items-center gap-2">
        🧪 Motor de Backtesting V2
      </h2>

      <!-- Server Status -->
      <div class="flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg"
           :class="serverOnline ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'">
        <span class="w-2 h-2 rounded-full" :class="serverOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'"></span>
        {{ serverOnline ? 'Servidor conectado' : 'Servidor offline — Ejecutar setup_and_run.bat' }}
      </div>

      <!-- Dataset Selector -->
      <div>
        <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Dataset Multi-TF</label>
        <select v-model="selectedDataset"
          class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none">
          <option v-for="d in datasets" :key="d.name" :value="d.name">
            {{ d.symbol }} {{ d.days }}d — {{ d.timeframes.join(', ') }} ({{ d.date_range }})
          </option>
          <option v-if="!datasets.length" disabled>Sin datasets — Descargar primero</option>
        </select>
        <p class="text-[9px] text-[#475569] mt-1">Descarga: <code class="text-[#94a3b8]">python download_history.py --symbol BTC/USDT --days 30</code></p>
      </div>

      <hr class="border-[#1e2d45]">

      <!-- Mode Toggle -->
      <div>
        <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Modo de Entrada</label>
        <div class="flex gap-1">
          <button @click="params.mode = 'clean'"
            :class="['text-[11px] font-bold px-3 py-2 rounded-lg transition-all flex-1',
                     params.mode === 'clean'
                       ? 'bg-[#3b82f6] text-white'
                       : 'text-[#475569] hover:text-[#94a3b8] bg-[#0f1729] border border-[#1e2d45]']">
            🎯 Entrada Limpia
          </button>
          <button @click="params.mode = 'martingale'"
            :class="['text-[11px] font-bold px-3 py-2 rounded-lg transition-all flex-1',
                     params.mode === 'martingale'
                       ? 'bg-[#f59e0b] text-black'
                       : 'text-[#475569] hover:text-[#94a3b8] bg-[#0f1729] border border-[#1e2d45]']">
            📊 Martingale
          </button>
        </div>
      </div>

      <!-- Risk Params -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Take Profit %</label>
          <input v-model.number="params.take_profit_pct" type="number" step="0.1" min="0.1"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#10b981] font-mono focus:border-[#3b82f6] outline-none">
        </div>
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Stop Loss %</label>
          <input v-model.number="params.stop_loss_pct" type="number" step="0.1" min="0.1"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#ef4444] font-mono focus:border-[#3b82f6] outline-none">
        </div>
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Apalancamiento (x)</label>
          <input v-model.number="params.leverage" type="number" step="1" min="1" max="125"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#f59e0b] font-mono focus:border-[#3b82f6] outline-none">
        </div>
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Scan c/N velas</label>
          <input v-model.number="params.scan_interval" type="number" step="1" min="1" max="100"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#94a3b8] font-mono focus:border-[#3b82f6] outline-none">
        </div>
      </div>

      <!-- Filtros Institucionales S/R -->
      <div class="space-y-3 p-3 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5">
        <p class="text-[10px] text-[#f59e0b] uppercase font-bold">🏛️ Filtros Institucionales S/R</p>

        <!-- Global Min Touches -->
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Toques Totales Mínimos</label>
          <div class="flex gap-1">
            <button v-for="t in [2,3,4,5,6,8]" :key="t" @click="params.global_min_touches = t"
              :class="['text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex-1',
                       params.global_min_touches === t
                         ? 'bg-[#f59e0b] text-black'
                         : 'text-[#475569] hover:text-[#94a3b8] bg-[#0f1729] border border-[#1e2d45]']">
              {{ t }}
            </button>
          </div>
        </div>

        <!-- Mandatory TFs -->
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">TFs Obligatorios en Confluencia</label>
          <div class="flex gap-1">
            <label v-for="tf in ['15m','1h','4h','1d','1w']" :key="tf"
              :class="['text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex-1 text-center cursor-pointer select-none',
                       params.mandatory_tfs.includes(tf)
                         ? 'bg-[#10b981] text-white'
                         : 'text-[#475569] hover:text-[#94a3b8] bg-[#0f1729] border border-[#1e2d45]']">
              <input type="checkbox" :value="tf" v-model="params.mandatory_tfs" class="hidden">
              {{ tf }}
            </label>
          </div>
          <p class="text-[9px] text-[#475569] mt-0.5">El muro DEBE existir en estas temporalidades</p>
        </div>

        <!-- Min touches by TF -->
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Mín. Toques por TF</label>
          <div class="grid grid-cols-5 gap-1">
            <div v-for="tf in ['15m','1h','4h','1d','1w']" :key="tf" class="text-center">
              <span class="block text-[9px] text-[#64748b] mb-0.5">{{ tf }}</span>
              <input v-model.number="params.min_touches_by_tf[tf]" type="number" min="0" max="20" step="1"
                class="w-full bg-[#0f1729] border border-[#1e2d45] rounded px-1 py-1 text-[11px] text-[#e2e8f0] font-mono text-center focus:border-[#f59e0b] outline-none">
            </div>
          </div>
          <p class="text-[9px] text-[#475569] mt-0.5">0 = sin requisito para esa temporalidad</p>
        </div>
      </div>

      <!-- Proximity % -->
      <div>
        <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Proximidad S/R %</label>
        <input v-model.number="params.proximity_pct" type="number" step="0.1" min="0.1" max="10"
          class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#8b5cf6] font-mono focus:border-[#3b82f6] outline-none">
        <p class="text-[9px] text-[#475569] mt-0.5">Distancia max del precio actual al muro para generar señal</p>
      </div>

      <!-- Divergence Filter -->
      <div class="space-y-2 p-3 rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/5">
        <div class="flex items-center justify-between">
          <label class="text-[10px] text-[#8b5cf6] uppercase font-bold">🔀 Filtro Divergencia RSI</label>
          <button @click="params.require_divergence = params.require_divergence === 'off' ? 'on' : 'off'"
            :class="['text-[10px] font-bold px-3 py-1 rounded-lg transition-all',
                     params.require_divergence === 'on'
                       ? 'bg-[#8b5cf6] text-white'
                       : 'bg-[#0f1729] text-[#475569] border border-[#1e2d45]']">
            {{ params.require_divergence === 'on' ? 'ACTIVO' : 'OFF' }}
          </button>
        </div>
        <div v-if="params.require_divergence === 'on'">
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Max TF divergencia</label>
          <div class="flex gap-1">
            <button v-for="tf in ['15m','1h','4h','1d','any']" :key="tf" @click="params.divergence_max_tf = tf"
              :class="['text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all flex-1',
                       params.divergence_max_tf === tf
                         ? 'bg-[#8b5cf6] text-white'
                         : 'text-[#475569] hover:text-[#94a3b8] bg-[#0f1729] border border-[#1e2d45]']">
              {{ tf === 'any' ? 'Todas' : tf }}
            </button>
          </div>
          <p class="text-[9px] text-[#475569] mt-0.5">Solo entrar si hay divergencia RSI en TF ≤ seleccionada</p>
        </div>
      </div>

      <!-- Martingale Params -->
      <div v-if="params.mode === 'martingale'" class="space-y-3 p-3 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5">
        <p class="text-[10px] text-[#f59e0b] uppercase font-bold">⚙️ Config. Martingale</p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Capital Total $</label>
            <input v-model.number="params.total_capital" type="number" step="50" min="100"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] font-mono focus:border-[#f59e0b] outline-none">
          </div>
          <div>
            <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Nº Entradas</label>
            <input v-model.number="params.entries_count" type="number" step="1" min="2" max="10"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] font-mono focus:border-[#f59e0b] outline-none"
              @change="updateAllocations">
          </div>
        </div>

        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Distancia entre entradas %</label>
          <input v-model.number="params.entry_distance_pct" type="number" step="0.1" min="0.1" max="10"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] font-mono focus:border-[#f59e0b] outline-none">
        </div>

        <!-- Allocation Table -->
        <div>
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Allocations por entrada</label>
          <div class="space-y-1">
            <div v-for="(alloc, idx) in params.entry_allocations" :key="idx"
              class="flex items-center gap-2">
              <span class="text-[10px] text-[#475569] w-6">E{{ idx + 1 }}</span>
              <input v-model.number="params.entry_allocations[idx]" type="number" step="1" min="1" max="100"
                class="flex-1 bg-[#0f1729] border border-[#1e2d45] rounded px-2 py-1 text-[11px] text-[#e2e8f0] font-mono focus:border-[#f59e0b] outline-none">
              <span class="text-[10px] text-[#475569]">%</span>
              <span class="text-[10px] text-[#94a3b8] font-mono w-14 text-right">
                ${{ (params.total_capital * (alloc / allocTotal)).toFixed(0) }}
              </span>
            </div>
          </div>
          <p class="text-[9px] text-[#475569] mt-1">Total: {{ allocTotal }}% — se normaliza a 100%</p>
        </div>
      </div>

      <!-- Execute Button -->
      <div class="flex gap-2">
        <button @click="runBacktest" :disabled="running || !serverOnline"
          class="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          :class="running
            ? 'bg-[#475569] text-[#94a3b8] cursor-wait'
            : 'bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.98]'">
          <span v-if="running" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Simulando...
          </span>
          <span v-else>🚀 Ejecutar Backtest</span>
        </button>
      </div>

      <!-- Progress -->
      <div v-if="running && progress" class="space-y-1">
        <div class="w-full h-1.5 bg-[#1e2d45] rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all duration-300"
               :style="{ width: progress + '%' }"></div>
        </div>
        <p class="text-[9px] text-[#475569]">{{ progressText }}</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="text-[10px] text-[#ef4444] bg-[#ef4444]/10 rounded-lg p-2">{{ error }}</div>

      <hr class="border-[#1e2d45]" v-if="history.length">

      <!-- Previous Runs -->
      <div v-if="history.length">
        <p class="text-[10px] text-[#94a3b8] uppercase font-bold mb-2">📜 Ejecuciones anteriores</p>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <button v-for="(run, idx) in history" :key="idx" @click="loadRun(run, idx)"
            class="w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-all border"
            :class="selectedRunIdx === idx
              ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#e2e8f0]'
              : 'border-[#1e2d45] text-[#475569] hover:text-[#94a3b8] hover:bg-[#0f1729]'">
            <div class="flex justify-between">
              <span>{{ run.params.dataset }} · {{ run.params.mode === 'martingale' ? '📊' : '🎯' }}</span>
              <span :class="run.metrics.pnl_total >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">
                ${{ run.metrics.pnl_total.toFixed(2) }}
              </span>
            </div>
            <div class="flex justify-between mt-0.5">
              <span>TP:{{ run.params.take_profit_pct }}% SL:{{ run.params.stop_loss_pct }}% {{ run.params.leverage }}x T≥{{ run.params.min_touches }}</span>
              <span>WR: {{ run.metrics.win_rate }}%</span>
            </div>
          </button>
        </div>
        <button @click="clearHistory" class="text-[9px] text-[#475569] hover:text-[#ef4444] mt-1">🗑 Limpiar historial</button>
      </div>
    </aside>

    <!-- MAIN: Results -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Metrics Bar -->
      <div v-if="result" class="flex gap-3 px-4 py-3 border-b border-[#1e2d45] flex-shrink-0">
        <div v-for="m in metricCards" :key="m.label"
          class="flex-1 px-3 py-2 rounded-xl border bg-[#0a0e1a]/50"
          :class="m.borderClass">
          <p class="text-[9px] uppercase font-bold tracking-wider" :class="m.labelColor">{{ m.label }}</p>
          <p class="text-lg font-black font-mono" :class="m.valueColor">{{ m.value }}</p>
        </div>
      </div>

      <!-- Chart -->
      <div ref="chartContainer" class="flex-1 min-h-0" v-show="result"></div>

      <!-- Empty State -->
      <div v-if="!result && !running" class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-2">
          <p class="text-4xl">🧪</p>
          <p class="text-sm text-[#475569]">Configura los parámetros y ejecuta el backtest</p>
          <p class="text-[10px] text-[#374151]">V2: Multi-TF confluence, RSI/FVG por cada temporalidad, Martingale/DCA</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { createChart, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts'

const API_URL = 'http://localhost:8877'
const STORAGE_KEY = 'backtest_history_v2'

const chartContainer = ref(null)
let chart = null
let candleSeries = null
let seriesMarkers = null

const serverOnline = ref(false)
const running = ref(false)
const error = ref('')
const result = ref(null)
const datasets = ref([])
const progress = ref(0)
const progressText = ref('')
const selectedRunIdx = ref(-1)
const selectedDataset = ref('')

const params = ref({
  mode: 'clean',
  take_profit_pct: 2.0,
  stop_loss_pct: 1.0,
  leverage: 5,
  scan_interval: 10,
  global_min_touches: 3,
  mandatory_tfs: ['1h'],
  min_touches_by_tf: { '15m': 0, '1h': 0, '4h': 1, '1d': 0, '1w': 0 },
  proximity_pct: 1.0,
  require_divergence: 'off',
  divergence_max_tf: 'any',
  // Martingale
  total_capital: 500,
  entries_count: 4,
  entry_distance_pct: 1.5,
  entry_allocations: [25, 25, 25, 25]
})

const history = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

const allocTotal = computed(() => params.value.entry_allocations.reduce((s, v) => s + v, 0))

function updateAllocations() {
  const n = params.value.entries_count
  const equal = Math.round(100 / n)
  params.value.entry_allocations = Array(n).fill(equal)
}

watch(() => params.value.entries_count, (n) => {
  if (params.value.entry_allocations.length !== n) {
    updateAllocations()
  }
})

const metricCards = computed(() => {
  if (!result.value?.metrics) return []
  const m = result.value.metrics
  return [
    { label: 'Win Rate', value: m.win_rate + '%', borderClass: 'border-[#3b82f6]/20', labelColor: 'text-[#3b82f6]', valueColor: 'text-[#3b82f6]' },
    { label: 'PnL Total', value: '$' + m.pnl_total.toFixed(2), borderClass: m.pnl_total >= 0 ? 'border-[#10b981]/20' : 'border-[#ef4444]/20', labelColor: m.pnl_total >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]', valueColor: m.pnl_total >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]' },
    { label: 'Max Drawdown', value: '$' + m.max_drawdown.toFixed(2), borderClass: 'border-[#ef4444]/20', labelColor: 'text-[#ef4444]', valueColor: 'text-[#ef4444]' },
    { label: 'Trades', value: m.total_trades, borderClass: 'border-[#94a3b8]/20', labelColor: 'text-[#94a3b8]', valueColor: 'text-[#e2e8f0]' },
    { label: 'Profit Factor', value: m.profit_factor === Infinity ? '∞' : m.profit_factor.toFixed(2), borderClass: 'border-[#f59e0b]/20', labelColor: 'text-[#f59e0b]', valueColor: 'text-[#f59e0b]' },
    { label: 'Modo', value: (m.mode || 'clean').toUpperCase(), borderClass: 'border-[#8b5cf6]/20', labelColor: 'text-[#8b5cf6]', valueColor: 'text-[#8b5cf6]' },
  ]
})

// Server check
let serverInterval = null
async function checkServer() {
  try {
    const res = await fetch(`${API_URL}/datasets`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      serverOnline.value = true
      datasets.value = await res.json()
      if (!selectedDataset.value && datasets.value.length) {
        selectedDataset.value = datasets.value[0].name
      }
    } else {
      serverOnline.value = false
    }
  } catch {
    serverOnline.value = false
  }
}

onMounted(() => {
  checkServer()
  serverInterval = setInterval(checkServer, 15000)
})
onUnmounted(() => clearInterval(serverInterval))

// Run Backtest
async function runBacktest() {
  if (!selectedDataset.value) {
    error.value = 'Selecciona un dataset primero'
    return
  }

  running.value = true
  error.value = ''
  result.value = null
  progress.value = 10
  progressText.value = 'Cargando datasets multi-TF...'

  try {
    progress.value = 30
    progressText.value = 'Corriendo scanners multi-TF y simulación...'

    // Clean min_touches_by_tf: only send entries > 0
    const cleanTouchesByTf = Object.fromEntries(
      Object.entries(params.value.min_touches_by_tf).filter(([, v]) => v > 0)
    )

    const body = {
      dataset_dir: selectedDataset.value,
      take_profit_pct: params.value.take_profit_pct,
      stop_loss_pct: params.value.stop_loss_pct,
      leverage: params.value.leverage,
      scan_interval: params.value.scan_interval,
      global_min_touches: params.value.global_min_touches,
      mandatory_tfs: params.value.mandatory_tfs,
      min_touches_by_tf: cleanTouchesByTf,
      proximity_pct: params.value.proximity_pct,
      require_divergence: params.value.require_divergence,
      divergence_max_tf: params.value.divergence_max_tf,
      mode: params.value.mode,
    }

    if (params.value.mode === 'martingale') {
      body.total_capital = params.value.total_capital
      body.entries_count = params.value.entries_count
      body.entry_distance_pct = params.value.entry_distance_pct
      body.entry_allocations = params.value.entry_allocations
    } else {
      body.total_capital = params.value.total_capital || 100
    }

    const res = await fetch(`${API_URL}/run-backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    progress.value = 90
    progressText.value = 'Procesando resultados...'

    const data = await res.json()

    if (data.error) {
      error.value = data.error
    } else {
      result.value = data
      await nextTick()
      renderChart(data)

      // Save to history
      const run = {
        params: { ...params.value, dataset: selectedDataset.value },
        metrics: data.metrics,
        trades: data.trades,
        candles: data.candles,
        date: new Date().toISOString()
      }
      history.value.unshift(run)
      if (history.value.length > 20) history.value = history.value.slice(0, 20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    }
  } catch (e) {
    error.value = `Error conectando al servidor: ${e.message}`
  } finally {
    running.value = false
    progress.value = 0
    progressText.value = ''
  }
}

function loadRun(run, idx) {
  selectedRunIdx.value = idx
  result.value = { metrics: run.metrics, trades: run.trades, candles: run.candles }
  nextTick(() => renderChart(result.value))
}

function clearHistory() {
  history.value = []
  localStorage.removeItem(STORAGE_KEY)
}

// Chart rendering
function renderChart(data) {
  // Dispose previous
  if (seriesMarkers) {
    try { seriesMarkers.setMarkers([]) } catch {}
    seriesMarkers = null
  }
  if (chart) {
    try { chart.remove() } catch {}
    chart = null
    candleSeries = null
  }

  if (!chartContainer.value || !data.candles?.length) return

  chart = createChart(chartContainer.value, {
    layout: { background: { color: '#0a0e1a' }, textColor: '#94a3b8', fontSize: 11 },
    grid: { vertLines: { color: '#1e2d4520' }, horzLines: { color: '#1e2d4520' } },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: '#1e2d45' },
    timeScale: { borderColor: '#1e2d45', timeVisible: true }
  })
  chart.timeScale().fitContent()

  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#10b981', downColor: '#ef4444',
    borderUpColor: '#10b981', borderDownColor: '#ef4444',
    wickUpColor: '#10b981', wickDownColor: '#ef4444'
  })
  candleSeries.setData(data.candles)

  // Trade markers
  if (!data.trades?.length) return
  const markers = []

  for (const trade of data.trades) {
    // Timestamps come as Unix seconds from backend (matching chart candles)
    const entryTs = trade.entry_date
    const exitTs = trade.exit_date || null

    // For martingale, add numbered sub-entry markers
    if (trade.mode === 'martingale' && trade.entries_detail) {
      for (const entry of trade.entries_detail) {
        markers.push({
          time: entry.date,
          position: trade.type === 'LONG' ? 'belowBar' : 'aboveBar',
          color: '#f59e0b',
          shape: trade.type === 'LONG' ? 'arrowUp' : 'arrowDown',
          text: `E${entry.entry_num} $${entry.price.toFixed(0)} (${entry.alloc_pct.toFixed(0)}%)`
        })
      }
      // Avg price marker at the last entry time
      const lastEntry = trade.entries_detail[trade.entries_detail.length - 1]
      markers.push({
        time: lastEntry.date,
        position: 'inBar',
        color: '#8b5cf6',
        shape: 'circle',
        text: `AVG $${trade.avg_price?.toFixed(0) || '?'}`
      })
    } else {
      // Clean entry marker
      markers.push({
        time: entryTs,
        position: trade.type === 'LONG' ? 'belowBar' : 'aboveBar',
        color: trade.type === 'LONG' ? '#10b981' : '#ef4444',
        shape: trade.type === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `${trade.type} S:${trade.score} @ $${trade.entry_price.toFixed(0)}`
      })
    }

    // Exit marker
    if (exitTs) {
      const pnlStr = trade.pnl_usd >= 0 ? `+$${trade.pnl_usd.toFixed(2)}` : `-$${Math.abs(trade.pnl_usd).toFixed(2)}`
      markers.push({
        time: exitTs,
        position: trade.type === 'LONG' ? 'aboveBar' : 'belowBar',
        color: trade.exit_reason === 'TP' ? '#10b981' : '#ef4444',
        shape: 'circle',
        text: `${trade.exit_reason} ${pnlStr}`
      })
    }
  }

  markers.sort((a, b) => a.time - b.time)
  if (seriesMarkers) seriesMarkers.setMarkers([])
  seriesMarkers = createSeriesMarkers(candleSeries, markers)
}
</script>
