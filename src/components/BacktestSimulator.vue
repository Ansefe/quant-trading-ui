<template>
  <div class="flex h-full">
    <!-- LEFT PANEL: Parameters -->
    <aside class="w-72 flex-shrink-0 p-4 border-r border-[#1e2d45] overflow-y-auto space-y-4">
      <h2 class="text-sm font-bold text-[#e2e8f0] tracking-wide flex items-center gap-2">
        🧪 Motor de Backtesting
      </h2>

      <!-- Server Status -->
      <div class="flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg"
           :class="serverOnline ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'">
        <span class="w-2 h-2 rounded-full" :class="serverOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'"></span>
        {{ serverOnline ? 'Servidor conectado' : 'Servidor offline — Ejecutar setup_and_run.bat' }}
      </div>

      <!-- Symbol -->
      <div>
        <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Dataset</label>
        <select v-model="selectedDatasetFile"
          class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none">
          <option v-for="d in datasets" :key="d.file" :value="d.file">
            {{ d.symbol }} {{ d.timeframe }} — {{ d.candles }} velas ({{ d.date_range }})
          </option>
          <option v-if="!datasets.length" disabled>Sin datasets — Descargar primero</option>
        </select>
        <p class="text-[9px] text-[#475569] mt-1">Descarga: <code class="text-[#94a3b8]">python download_history.py --symbol BTC/USDT --timeframe 1h --days 365</code></p>
      </div>

      <hr class="border-[#1e2d45]">

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
          <label class="block text-[10px] text-[#94a3b8] uppercase font-bold mb-1">Intervalo scan</label>
          <input v-model.number="params.scan_interval" type="number" step="1" min="1" max="100"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-2 text-sm text-[#94a3b8] font-mono focus:border-[#3b82f6] outline-none"
            title="Ejecuta los scanners (S/R, FVG, RSI) cada N velas. Mayor = más rápido pero menos preciso.">
        </div>
      </div>

      <p class="text-[9px] text-[#475569]">
        <strong>Scan c/N:</strong> Ejecuta los 3 scanners (S/R, FVG, RSI) cada N velas para ganar velocidad. Menor = más preciso pero más lento.
      </p>

      <!-- Execute / Cancel Buttons -->
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
          <button v-for="(run, idx) in history" :key="idx" @click="loadRun(run)"
            class="w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-all border"
            :class="selectedRunIdx === idx
              ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#e2e8f0]'
              : 'border-[#1e2d45] text-[#475569] hover:text-[#94a3b8] hover:bg-[#0f1729]'">
            <div class="flex justify-between">
              <span>{{ run.params.symbol }} {{ run.params.timeframe }}</span>
              <span :class="run.metrics.pnl_total >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">
                ${{ run.metrics.pnl_total.toFixed(2) }}
              </span>
            </div>
            <div class="flex justify-between mt-0.5">
              <span>TP:{{ run.params.take_profit_pct }}% SL:{{ run.params.stop_loss_pct }}% {{ run.params.leverage }}x</span>
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
          <p class="text-[10px] text-[#374151]">El motor simulará vela a vela usando tus algoritmos de trading</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { createChart, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts'

const API_URL = 'http://localhost:8877'
const STORAGE_KEY = 'backtest_history'

const chartContainer = ref(null)
let chart = null
let candleSeries = null
let seriesMarkers = null  // v5 markers plugin

const serverOnline = ref(false)
const running = ref(false)
const error = ref('')
const result = ref(null)
const datasets = ref([])
const progress = ref(0)
const progressText = ref('')
const selectedRunIdx = ref(-1)
const selectedDatasetFile = ref('')

const params = ref({
  symbol: 'BTC/USDT',
  timeframe: '1h',
  take_profit_pct: 2.0,
  stop_loss_pct: 1.0,
  leverage: 5,
  scan_interval: 10
})

// Load history from localStorage
const history = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

// Sync selected dataset file to params
watch(selectedDatasetFile, (file) => {
  if (!file) return
  const ds = datasets.value.find(d => d.file === file)
  if (ds) {
    params.value.symbol = ds.symbol
    params.value.timeframe = ds.timeframe
  }
})

const metricCards = computed(() => {
  if (!result.value?.metrics) return []
  const m = result.value.metrics
  const pnlPositive = m.pnl_total >= 0
  return [
    {
      label: 'Win Rate', value: `${m.win_rate}%`,
      borderClass: m.win_rate >= 50 ? 'border-[#10b981]/30' : 'border-[#ef4444]/30',
      labelColor: 'text-[#475569]',
      valueColor: m.win_rate >= 50 ? 'text-[#10b981]' : 'text-[#ef4444]'
    },
    {
      label: 'PnL Total', value: `$${m.pnl_total.toFixed(2)}`,
      borderClass: pnlPositive ? 'border-[#10b981]/30' : 'border-[#ef4444]/30',
      labelColor: 'text-[#475569]',
      valueColor: pnlPositive ? 'text-[#10b981]' : 'text-[#ef4444]'
    },
    {
      label: 'Max Drawdown', value: `$${m.max_drawdown.toFixed(2)}`,
      borderClass: 'border-[#f59e0b]/30',
      labelColor: 'text-[#475569]',
      valueColor: 'text-[#f59e0b]'
    },
    {
      label: 'Trades', value: `${m.total_trades} (${m.wins}W / ${m.losses}L)`,
      borderClass: 'border-[#3b82f6]/30',
      labelColor: 'text-[#475569]',
      valueColor: 'text-[#3b82f6]'
    },
    {
      label: 'Profit Factor', value: `${m.profit_factor}x`,
      borderClass: m.profit_factor >= 1 ? 'border-[#10b981]/30' : 'border-[#ef4444]/30',
      labelColor: 'text-[#475569]',
      valueColor: m.profit_factor >= 1 ? 'text-[#10b981]' : 'text-[#ef4444]'
    }
  ]
})

// Check server (less frequently to avoid spam)
async function checkServer() {
  try {
    const res = await fetch(`${API_URL}/datasets`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      serverOnline.value = true
      datasets.value = await res.json()
      // Auto-select first dataset ONLY if nothing selected yet
      if (!selectedDatasetFile.value && datasets.value.length) {
        selectedDatasetFile.value = datasets.value[0].file
      }
    } else {
      serverOnline.value = false
    }
  } catch {
    serverOnline.value = false
  }
}

async function runBacktest() {
  running.value = true
  error.value = ''
  result.value = null
  progress.value = 5
  progressText.value = 'Enviando a Python...'
  selectedRunIdx.value = -1

  try {
    progress.value = 10
    progressText.value = 'Motor de simulación corriendo vela a vela...'

    const res = await fetch(`${API_URL}/run-backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params.value,
        dataset_file: selectedDatasetFile.value
      })
    })

    progress.value = 90
    progressText.value = 'Procesando resultados...'

    const data = await res.json()

    if (data.error) {
      error.value = data.error
    } else {
      result.value = data
      progress.value = 100
      progressText.value = '✅ Completado!'

      // Save to history
      const run = {
        params: { ...params.value },
        metrics: data.metrics,
        trades: data.trades,
        candles: data.candles,
        timestamp: new Date().toISOString()
      }
      history.value.unshift(run)
      // Keep last 20 runs
      if (history.value.length > 20) history.value = history.value.slice(0, 20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
      selectedRunIdx.value = 0

      await nextTick()
      renderChart(data)
    }
  } catch (e) {
    error.value = `Error conectando al servidor: ${e.message}`
  } finally {
    running.value = false
    setTimeout(() => { progress.value = 0; progressText.value = '' }, 2000)
  }
}

function loadRun(run) {
  selectedRunIdx.value = history.value.indexOf(run)
  result.value = {
    metrics: run.metrics,
    trades: run.trades,
    candles: run.candles
  }
  nextTick(() => renderChart(result.value))
}

function clearHistory() {
  history.value = []
  localStorage.removeItem(STORAGE_KEY)
}

function renderChart(data) {
  // Dispose previous chart cleanly
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
    width: chartContainer.value.clientWidth,
    height: chartContainer.value.clientHeight,
    layout: {
      background: { type: 'solid', color: '#080c14' },
      textColor: '#475569',
      fontSize: 11,
    },
    grid: {
      vertLines: { color: '#111827' },
      horzLines: { color: '#111827' },
    },
    crosshair: { mode: 0 },
    timeScale: { timeVisible: true, borderColor: '#1e2d45' },
    rightPriceScale: { borderColor: '#1e2d45' },
  })

  // v5 API: chart.addSeries(CandlestickSeries, options)
  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
  })

  candleSeries.setData(data.candles)

  // Add trade markers
  if (data.trades?.length) {
    const markers = []
    const candleTimes = data.candles.map(c => c.time)

    for (const trade of data.trades) {
      const entryTime = Math.floor(new Date(trade.entry_date).getTime() / 1000)
      const exitTime = trade.exit_date ? Math.floor(new Date(trade.exit_date).getTime() / 1000) : null

      // Snap entry to nearest candle
      const snapEntry = candleTimes.reduce((prev, curr) =>
        Math.abs(curr - entryTime) < Math.abs(prev - entryTime) ? curr : prev
      )

      markers.push({
        time: snapEntry,
        position: trade.type === 'LONG' ? 'belowBar' : 'aboveBar',
        color: trade.type === 'LONG' ? '#10b981' : '#ef4444',
        shape: trade.type === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `${trade.type}`
      })

      if (exitTime) {
        const snapExit = candleTimes.reduce((prev, curr) =>
          Math.abs(curr - exitTime) < Math.abs(prev - exitTime) ? curr : prev
        )
        const isTP = trade.exit_reason === 'TP'
        markers.push({
          time: snapExit,
          position: trade.type === 'LONG' ? 'aboveBar' : 'belowBar',
          color: isTP ? '#3b82f6' : '#f59e0b',
          shape: 'circle',
          text: `${trade.exit_reason} ${trade.pnl_usd >= 0 ? '+' : ''}$${trade.pnl_usd.toFixed(2)}`
        })
      }
    }

    // v5 API: createSeriesMarkers(series, sorted markers)
    markers.sort((a, b) => a.time - b.time)
    if (seriesMarkers) seriesMarkers.setMarkers([])  // Clear previous
    seriesMarkers = createSeriesMarkers(candleSeries, markers)
  }

  chart.timeScale().fitContent()
}

function handleResize() {
  if (chart && chartContainer.value) {
    chart.resize(chartContainer.value.clientWidth, chartContainer.value.clientHeight)
  }
}

let serverPoll = null

onMounted(() => {
  checkServer()
  serverPoll = setInterval(checkServer, 15000)  // Every 15s instead of 5s (less spam)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (serverPoll) clearInterval(serverPoll)
  if (chart) chart.remove()
  window.removeEventListener('resize', handleResize)
})
</script>
