<template>
  <div class="relative w-full h-full flex flex-col">

    <!-- ── Chart Toolbar ─────────────────────────────────────── -->
    <div class="absolute top-2 left-2 z-10 flex items-center gap-2 glass rounded-lg px-2 py-1">
      <!-- Interval selector -->
      <div class="flex items-center gap-0.5">
        <button
          v-for="iv in CHART_INTERVALS" :key="iv"
          @click="setInterval(iv)"
          :class="[
            'text-[10px] font-bold px-1.5 py-0.5 rounded transition-all',
            chartInterval === iv
              ? 'bg-[#3b82f6] text-white'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2d45]'
          ]"
        >{{ iv }}</button>
      </div>

      <div class="w-px h-4 bg-[#1e2d45]" />

      <!-- Overlay toggles -->
      <button
        @click="showMuros = !showMuros"
        :class="[
          'text-[10px] font-medium px-1.5 py-0.5 rounded transition-all flex items-center gap-1',
          showMuros
            ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
            : 'text-[#475569] hover:text-[#94a3b8]'
        ]"
      >🧱 Muros</button>

      <button
        @click="showFVGs = !showFVGs"
        :class="[
          'text-[10px] font-medium px-1.5 py-0.5 rounded transition-all flex items-center gap-1',
          showFVGs
            ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]'
            : 'text-[#475569] hover:text-[#94a3b8]'
        ]"
      >🐋 FVGs</button>
    </div>

    <div ref="chartEl" class="w-full h-full" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  createChart,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
} from 'lightweight-charts'

const props = defineProps({
  srLevels: { type: Array, default: () => [] },
  fvgs:     { type: Array, default: () => [] },
  symbol:   { type: String, default: 'BTC/USDT' },
})

const CHART_INTERVALS = ['15m', '1h', '4h', '1d', '1w']

const chartEl       = ref(null)
const chartInterval = ref('4h')
const showMuros     = ref(true)
const showFVGs      = ref(true)

let chart      = null
let candles    = null
let priceLines = []     // S/R price lines
let fvgPrimitive = null // Custom FVG rectangle primitive

// ─────────────────────────────────────────────────
// FVG Rectangle Primitive (draws semi-transparent boxes)
// ─────────────────────────────────────────────────
class FVGBoxPrimitive {
  _chart = null
  _series = null
  _requestUpdate = null
  _fvgs = []
  _visible = true

  constructor() {
    this._paneView = {
      renderer: () => ({
        draw: (target) => this._draw(target)
      }),
    }
  }

  attached({ chart, series, requestUpdate }) {
    this._chart = chart
    this._series = series
    this._requestUpdate = requestUpdate
  }

  detached() {
    this._chart = null
    this._series = null
  }

  paneViews() {
    return [this._paneView]
  }

  update(fvgs, visible) {
    this._fvgs = fvgs
    this._visible = visible
    if (this._requestUpdate) this._requestUpdate()
  }

  _draw(target) {
    if (!this._visible || !this._chart || !this._series || !this._fvgs.length) return

    target.useBitmapCoordinateSpace((scope) => {
      const { context: ctx, horizontalPixelRatio: hR, verticalPixelRatio: vR } = scope
      const ts = this._chart.timeScale()
      const chartWidth = ts.width()

      for (const fvg of this._fvgs) {
        const topY = this._series.priceToCoordinate(fvg.top_price)
        const botY = this._series.priceToCoordinate(fvg.bottom_price)
        if (topY === null || botY === null) continue

        // Convert fvg_date to UNIX seconds for chart coordinate
        let startX = 0
        if (fvg.fvg_date) {
          const ts_sec = Math.floor(new Date(fvg.fvg_date).getTime() / 1000)
          const coord = ts.timeToCoordinate(ts_sec)
          if (coord !== null) startX = coord
        }

        // Extend to right edge of chart
        const endX = chartWidth
        if (endX <= startX) continue

        const isBull = fvg.type?.includes('ALCISTA')
        ctx.fillStyle = isBull
          ? 'rgba(16, 185, 129, 0.12)'   // green
          : 'rgba(239, 68, 68, 0.12)'     // red

        const y = Math.min(topY, botY) * vR
        const h = Math.abs(botY - topY) * vR
        const x = startX * hR
        const w = (endX - startX) * hR

        ctx.fillRect(x, y, w, h)

        // Draw top and bottom border lines
        ctx.strokeStyle = isBull
          ? 'rgba(16, 185, 129, 0.35)'
          : 'rgba(239, 68, 68, 0.35)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(x, y);           ctx.lineTo(x + w, y)
        ctx.moveTo(x, y + h);       ctx.lineTo(x + w, y + h)
        ctx.stroke()
        ctx.setLineDash([])

        // Small label at start
        ctx.fillStyle = isBull
          ? 'rgba(16, 185, 129, 0.7)'
          : 'rgba(239, 68, 68, 0.7)'
        ctx.font = `${9 * vR}px sans-serif`
        const label = `FVG ${isBull ? '↑' : '↓'} ${fvg.timeframe || ''}`
        ctx.fillText(label, x + 4 * hR, y + 11 * vR)
      }
    })
  }
}

// ─────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────
function initChart() {
  if (!chartEl.value) return

  chart = createChart(chartEl.value, {
    layout: {
      background: { color: '#0a0e1a' },
      textColor: '#94a3b8',
      fontSize: 11,
    },
    grid: {
      vertLines: { color: '#111827', style: LineStyle.Dotted },
      horzLines: { color: '#111827', style: LineStyle.Dotted },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: '#3b82f6', labelBackgroundColor: '#1e2d45' },
      horzLine: { color: '#3b82f6', labelBackgroundColor: '#1e2d45' },
    },
    rightPriceScale: { borderColor: '#1e2d45' },
    timeScale: {
      borderColor: '#1e2d45',
      timeVisible: true,
      secondsVisible: false,
    },
    watermark: {
      visible: true,
      fontSize: 52,
      horzAlign: 'center',
      vertAlign: 'center',
      color: 'rgba(30,45,69,0.2)',
      text: props.symbol,
    },
    autoSize: true,
  })

  candles = chart.addSeries(CandlestickSeries, {
    upColor:         '#10b981',
    downColor:       '#ef4444',
    borderUpColor:   '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor:     '#6ee7b7',
    wickDownColor:   '#fca5a5',
  })

  // Attach FVG box primitive to the candlestick series
  fvgPrimitive = new FVGBoxPrimitive()
  candles.attachPrimitive(fvgPrimitive)

  loadBinance()
}

// ─────────────────────────────────────────────────
// Binance Live Data
// ─────────────────────────────────────────────────
async function loadBinance() {
  if (!candles || !props.symbol) return
  const pair = props.symbol.replace('/', '')
  if (!pair) return

  const limitMap = { '15m': 200, '1h': 200, '4h': 300, '1d': 365, '1w': 156 }
  const limit = limitMap[chartInterval.value] || 200

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${chartInterval.value}&limit=${limit}`
    const data = await fetch(url).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })

    const formatted = data.map(k => ({
      time:  k[0] / 1000,
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
    }))

    candles.setData(formatted)
    chart.timeScale().fitContent()
    drawSRLines()
    drawFVGs()
  } catch (err) {
    console.error('Binance fetch error:', err.message)
  }
}

// ─────────────────────────────────────────────────
// Draw S/R overlay lines
// ─────────────────────────────────────────────────
function drawSRLines() {
  if (!candles) return
  priceLines.forEach(pl => { try { candles.removePriceLine(pl) } catch {} })
  priceLines = []

  if (!showMuros.value) return

  props.srLevels.forEach(level => {
    const touches = level.touches || 1
    const alpha   = Math.min(1, 0.35 + touches * 0.12)
    const color   = level.is_support
      ? `rgba(16,185,129,${alpha})`
      : `rgba(239,68,68,${alpha})`
    const tfStr   = (level.confluence || []).join('+')

    const pl = candles.createPriceLine({
      price:            level.price_level,
      color,
      lineWidth:        Math.min(3, 1 + Math.floor(touches / 4)),
      lineStyle:        LineStyle.Dashed,
      axisLabelVisible: true,
      title:            `${level.is_support ? 'S' : 'R'} [${tfStr}] ×${touches}`,
    })
    priceLines.push(pl)
  })
}

// ─────────────────────────────────────────────────
// Update FVG rectangles via primitive
// ─────────────────────────────────────────────────
function drawFVGs() {
  if (fvgPrimitive) {
    fvgPrimitive.update(props.fvgs, showFVGs.value)
  }
}

// ─────────────────────────────────────────────────
function setInterval(iv) {
  chartInterval.value = iv
  loadBinance()
}

// ─────────────────────────────────────────────────
// Watchers
// ─────────────────────────────────────────────────
watch(() => props.symbol, (val) => {
  if (!chart || !val) return
  chart.applyOptions({ watermark: { text: val } })
  loadBinance()
})

watch(() => props.srLevels, drawSRLines, { deep: true })
watch(() => props.fvgs, drawFVGs, { deep: true })
watch(showMuros, drawSRLines)
watch(showFVGs, drawFVGs)

// ─────────────────────────────────────────────────
onMounted(initChart)
onUnmounted(() => { if (chart) chart.remove() })
</script>
