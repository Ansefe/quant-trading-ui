<template>
  <div class="h-full flex overflow-hidden">

    <!-- LEFT SIDEBAR: Config + Status -->
    <aside class="w-72 flex-shrink-0 flex flex-col gap-2 p-3 border-r border-[#1e2d45] overflow-y-auto">

      <!-- Connection Status -->
      <div class="flex items-center gap-2 p-2 rounded-lg" :class="wsConnected ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10'">
        <div class="w-2 h-2 rounded-full" :class="wsConnected ? 'bg-[#10b981] animate-pulse' : 'bg-[#ef4444]'" />
        <span class="text-[10px] font-bold" :class="wsConnected ? 'text-[#10b981]' : 'text-[#ef4444]'">
          {{ wsConnected ? 'CONECTADO' : 'DESCONECTADO' }}
        </span>
        <span v-if="statusMessage" class="text-[9px] text-[#94a3b8] truncate flex-1">{{ statusMessage }}</span>
      </div>

      <!-- Config Panel -->
      <div class="space-y-2">
        <p class="text-[10px] text-[#3b82f6] uppercase font-bold tracking-wider">⚙️ Configuración</p>

        <!-- Symbol -->
        <div>
          <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Symbol</label>
          <select v-model="config.symbol" :disabled="engineRunning"
            class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none">
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="SOL/USDT">SOL/USDT</option>
          </select>
        </div>

        <!-- Mode Toggle -->
        <div>
          <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Modo de Entrada</label>
          <div class="flex gap-1">
            <button @click="config.mode = 'clean'" :disabled="engineRunning"
              :class="['flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all',
                       config.mode === 'clean' ? 'bg-[#ef4444] text-white' : 'text-[#475569] bg-[#0f1729] border border-[#1e2d45]']">
              ⛔ Entrada Limpia
            </button>
            <button @click="config.mode = 'martingale'" :disabled="engineRunning"
              :class="['flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all',
                       config.mode === 'martingale' ? 'bg-[#8b5cf6] text-white' : 'text-[#475569] bg-[#0f1729] border border-[#1e2d45]']">
              🏗 Martingale
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Take Profit %</label>
            <input v-model.number="config.take_profit_pct" type="number" step="0.1" min="0.1" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#10b981] font-mono focus:border-[#3b82f6] outline-none">
          </div>
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Stop Loss %</label>
            <input v-model.number="config.stop_loss_pct" type="number" step="0.1" min="0.1" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#ef4444] font-mono focus:border-[#3b82f6] outline-none">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Apalancamiento (X)</label>
            <input v-model.number="config.leverage" type="number" step="1" min="1" max="50" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#e2e8f0] font-mono focus:border-[#3b82f6] outline-none">
          </div>
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Capital $</label>
            <input v-model.number="config.total_capital" type="number" step="50" min="100" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#e2e8f0] font-mono focus:border-[#3b82f6] outline-none">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Scan c/N velas</label>
            <input v-model.number="config.scan_interval" type="number" step="1" min="1" max="20" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#e2e8f0] font-mono focus:border-[#3b82f6] outline-none">
          </div>
          <div v-if="config.mode === 'martingale'">
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">N° Entradas</label>
            <input v-model.number="config.entries_count" type="number" step="1" min="2" max="8" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#8b5cf6] font-mono focus:border-[#3b82f6] outline-none">
          </div>
        </div>

        <!-- Martingale extra params -->
        <div v-if="config.mode === 'martingale'" class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Dist. Entradas %</label>
            <input v-model.number="config.entry_distance_pct" type="number" step="0.1" min="0.5" :disabled="engineRunning"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-sm text-[#8b5cf6] font-mono focus:border-[#3b82f6] outline-none">
          </div>
        </div>

        <!-- S/R Filters -->
        <div class="space-y-2 p-2 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5">
          <p class="text-[9px] text-[#f59e0b] uppercase font-bold tracking-wider">🏛️ Filtros Institucionales S/R</p>

          <!-- Global min touches -->
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Toques Totales Mín.</label>
            <div class="flex gap-0.5">
              <button v-for="t in [2,3,4,5,6,8]" :key="t" @click="config.global_min_touches = t"
                :class="['text-[10px] font-bold px-2 py-1 rounded transition-all flex-1',
                         config.global_min_touches === t ? 'bg-[#f59e0b] text-black' : 'text-[#475569] bg-[#0f1729] border border-[#1e2d45]']">
                {{ t }}
              </button>
            </div>
          </div>

          <!-- Mandatory TFs -->
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">TFs Obligatorios</label>
            <div class="flex gap-0.5">
              <button v-for="tf in ['15m','1h','4h','1d','1w']" :key="tf"
                @click="toggleMandatoryTF(tf)"
                :class="['text-[10px] font-bold px-2 py-1 rounded transition-all flex-1',
                         config.mandatory_tfs.includes(tf) ? 'bg-[#10b981] text-white' : 'text-[#475569] bg-[#0f1729] border border-[#1e2d45]']">
                {{ tf }}
              </button>
            </div>
            <p class="text-[8px] text-[#475569] mt-0.5">El muro DEBE existir en estas temporalidades</p>
          </div>

          <!-- Min touches by TF -->
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Mín. Toques por TF</label>
            <div class="grid grid-cols-5 gap-1">
              <div v-for="tf in ['15m','1h','4h','1d','1w']" :key="'mt-'+tf" class="text-center">
                <span class="text-[8px] text-[#475569]">{{ tf }}</span>
                <input v-model.number="config.min_touches_by_tf[tf]" type="number" min="0" max="10"
                  class="w-full bg-[#0f1729] border border-[#1e2d45] rounded px-1 py-0.5 text-[11px] text-center text-[#e2e8f0] font-mono focus:border-[#f59e0b] outline-none">
              </div>
            </div>
            <p class="text-[8px] text-[#475569] mt-0.5">0 = sin requisito para esa temporalidad</p>
          </div>

          <!-- Proximity -->
          <div>
            <label class="block text-[9px] text-[#94a3b8] uppercase font-bold mb-0.5">Proximidad S/R %</label>
            <input v-model.number="config.proximity_pct" type="number" step="0.1" min="0.1"
              class="w-full bg-[#0f1729] border border-[#1e2d45] rounded px-2 py-1 text-[11px] text-[#8b5cf6] font-mono focus:border-[#f59e0b] outline-none">
            <p class="text-[8px] text-[#475569] mt-0.5">Distancia max del precio al muro</p>
          </div>
        </div>

        <!-- Divergence Filter -->
        <div class="flex items-center justify-between p-2 rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/5">
          <div>
            <p class="text-[9px] text-[#3b82f6] font-bold">🔮 Filtro Divergencia RSI</p>
            <select v-if="config.require_divergence === 'on'" v-model="config.divergence_max_tf"
              class="mt-1 bg-[#0f1729] border border-[#1e2d45] rounded px-1 py-0.5 text-[10px] text-[#e2e8f0] outline-none">
              <option value="15m">Solo 15m</option>
              <option value="1h">1h o menos</option>
              <option value="4h">4h o menos</option>
              <option value="1d">1d o menos</option>
              <option value="any">Cualquiera</option>
            </select>
          </div>
          <button @click="config.require_divergence = config.require_divergence === 'on' ? 'off' : 'on'"
            :class="['text-[10px] font-bold px-3 py-1 rounded transition-all',
                     config.require_divergence === 'on' ? 'bg-[#3b82f6] text-white' : 'bg-[#0f1729] text-[#475569] border border-[#1e2d45]']">
            {{ config.require_divergence === 'on' ? 'ON' : 'OFF' }}
          </button>
        </div>

        <!-- Start/Stop Button -->
        <button @click="toggleEngine"
          :class="['w-full py-2.5 rounded-xl font-bold text-sm transition-all',
                   engineRunning
                     ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                     : 'bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white hover:opacity-90']">
          {{ engineRunning ? '⏹ Detener' : '▶ Iniciar Paper Trading' }}
        </button>

        <!-- Apply Config (hot-reload while running) -->
        <button v-if="engineRunning" @click="applyConfig"
          class="w-full py-2 rounded-xl font-bold text-[11px] transition-all bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 hover:bg-[#3b82f6]/30">
          🔧 Aplicar Cambios (sin reiniciar)
        </button>
        <p v-if="configUpdateMsg" class="text-[9px] text-[#10b981] text-center">{{ configUpdateMsg }}</p>
      </div>

      <!-- Balance Panel -->
      <div v-if="engineRunning" class="p-3 rounded-xl glass border border-[#1e2d45]">
        <p class="text-[10px] text-[#94a3b8] uppercase font-bold mb-1">💰 Balance</p>
        <div class="text-2xl font-black font-mono" :class="totalBalance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">
          ${{ totalBalance.toFixed(2) }}
        </div>
        <div class="flex gap-3 mt-1">
          <span class="text-[10px] text-[#94a3b8]">Cerrado: <span class="font-mono" :class="balance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">${{ balance.toFixed(2) }}</span></span>
          <span class="text-[10px] text-[#94a3b8]">Abierto: <span class="font-mono" :class="openPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">${{ openPnl.toFixed(2) }}</span></span>
        </div>
        <div class="text-[10px] text-[#475569] mt-0.5">Trades: {{ tradeCount }}</div>
      </div>

      <!-- Open Position -->
      <div v-if="openPosition" class="p-2 rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/5">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] uppercase font-bold" :class="openPosition.type === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'">
            {{ openPosition.type === 'LONG' ? '🟢' : '🔴' }} {{ openPosition.type }}
          </span>
          <span class="text-[10px] text-[#94a3b8]">Score: {{ openPosition.score }}</span>
        </div>
        <div class="grid grid-cols-2 gap-0.5 text-[10px]">
          <div class="text-[#94a3b8]">Entrada</div><div class="text-[#e2e8f0] font-mono text-right">${{ openPosition.entry_price?.toLocaleString() }}</div>
          <div class="text-[#10b981]">TP</div><div class="text-[#10b981] font-mono text-right">${{ openPosition.tp?.toLocaleString() }}</div>
          <div class="text-[#ef4444]">SL</div><div class="text-[#ef4444] font-mono text-right">${{ openPosition.sl?.toLocaleString() }}</div>
        </div>
      </div>

      <!-- Pending Order -->
      <div v-if="pendingOrder" class="p-2 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5">
        <span class="text-[10px] text-[#f59e0b] font-bold">📋 PENDING {{ pendingOrder.type }}</span>
        <span class="text-[10px] text-[#94a3b8] ml-1">@ ${{ pendingOrder.limit_price?.toLocaleString() }}</span>
      </div>

      <!-- Trade History -->
      <div v-if="tradeHistory.length" class="flex-1 min-h-0">
        <p class="text-[10px] text-[#94a3b8] uppercase font-bold mb-1">📜 Historial</p>
        <div class="space-y-1 overflow-y-auto max-h-32">
          <div v-for="(t, i) in tradeHistory.slice().reverse().slice(0, 10)" :key="i"
            class="flex items-center justify-between px-2 py-1 rounded bg-[#0f1729] text-[10px]">
            <span :class="t.type === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'">{{ t.type }}</span>
            <span class="text-[#94a3b8]">{{ t.exit_reason }}</span>
            <span class="font-mono" :class="t.pnl_usd >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">${{ t.pnl_usd?.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Scanner Info -->
      <div v-if="scanInfo" class="p-2 rounded-lg bg-[#0f1729] text-[10px] text-[#94a3b8]">
        SR: {{ scanInfo.sr_count }} ({{ scanInfo.sr_multi_tf }} multi) ·
        FVG: {{ scanInfo.fvg_count }} ·
        DIV: {{ scanInfo.div_count }}
      </div>

      <!-- Signal History -->
      <div v-if="signalHistory.length" class="flex-shrink-0">
        <p class="text-[10px] text-[#f59e0b] uppercase font-bold mb-1">📡 Señales ({{ signalHistory.length }})</p>
        <div class="space-y-1 overflow-y-auto max-h-52">
          <div v-for="(s, i) in signalHistory.slice().reverse().slice(0, 20)" :key="i"
            class="p-1.5 rounded bg-[#0f1729] text-[10px] border border-[#1e2d45] cursor-pointer hover:border-[#475569] transition-all"
            @click="s._expanded = !s._expanded">
            <div class="flex items-center justify-between">
              <span :class="s.type === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'" class="font-bold">
                {{ s.type === 'LONG' ? '🟢' : '🔴' }} {{ s.type }}
              </span>
              <span class="text-[#94a3b8] font-mono">${{ s.limit_price?.toLocaleString() }}</span>
              <span class="text-[#f59e0b] font-bold">S{{ s.score }}</span>
            </div>
            <div class="flex justify-between text-[9px] text-[#475569] mt-0.5">
              <span>Precio: ${{ s.price_at_signal?.toLocaleString() }}</span>
              <span>{{ s.status }}</span>
              <span>{{ formatTime(s.time) }}</span>
            </div>
            <!-- Expanded Details -->
            <div v-if="s._expanded" class="mt-1.5 pt-1.5 border-t border-[#1e2d45] space-y-1">
              <div class="text-[9px] text-[#94a3b8]">
                <template v-if="s.details">
                  <div v-if="s.details.support">Soporte: ${{ s.details.support?.toLocaleString() }} ({{ s.details.touches }} toques)</div>
                  <div v-if="s.details.resistance">Resistencia: ${{ s.details.resistance?.toLocaleString() }} ({{ s.details.touches }} toques)</div>
                  <div v-if="s.details.confluence">TFs: {{ s.details.confluence?.join(', ') }}</div>
                  <div v-if="s.details.rsi_div">RSI Div: {{ s.details.rsi_div?.join(', ') }}</div>
                  <div v-if="s.details.fvg_target">FVG Target: ${{ s.details.fvg_target?.toLocaleString() }} ({{ s.details.fvg_tf }})</div>
                </template>
              </div>
              <div v-if="s.config_snapshot" class="text-[8px] text-[#475569] p-1 rounded bg-[#0a0e1a]">
                <span class="text-[#3b82f6] font-bold">Config:</span>
                TP:{{ s.config_snapshot.tp_pct }}% · SL:{{ s.config_snapshot.sl_pct }}% ·
                Lev:{{ s.config_snapshot.leverage }}x · Mode:{{ s.config_snapshot.mode }} ·
                Touches≥{{ s.config_snapshot.global_min_touches }} ·
                TFs:{{ s.config_snapshot.mandatory_tfs?.join(',') }} ·
                Prox:{{ s.config_snapshot.proximity_pct }}%
                <span v-if="s.config_snapshot.require_div === 'on'"> · Div:ON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN: Chart -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Chart Toolbar -->
      <div class="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e2d45]">
        <div class="flex gap-0.5">
          <button v-for="tf in ['5m','15m','1h','4h','1d','1w']" :key="tf" @click="switchTF(tf)"
            :class="['text-[10px] font-bold px-2 py-1 rounded transition-all',
                     currentTF === tf ? 'bg-[#3b82f6] text-white' : 'text-[#475569] hover:text-[#94a3b8]']">
            {{ tf }}
          </button>
        </div>
        <div class="w-px h-4 bg-[#1e2d45]" />
        <button @click="showEMA = !showEMA"
          :class="['text-[10px] font-medium px-2 py-1 rounded transition-all',
                   showEMA ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'text-[#475569]']">
          📈 EMA
        </button>
        <button @click="showRSI = !showRSI"
          :class="['text-[10px] font-medium px-2 py-1 rounded transition-all',
                   showRSI ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-[#475569]']">
          📊 RSI
        </button>
        <div class="flex-1" />
        <!-- Candle countdown -->
        <div v-if="candleCountdown && engineRunning" class="text-[10px] font-mono text-[#f59e0b] px-2 py-0.5 rounded bg-[#f59e0b]/10">
          🕐 {{ candleCountdown }}
        </div>
        <div v-if="currentPrice" class="text-sm font-mono font-bold text-[#e2e8f0]">
          ${{ currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
        </div>
      </div>

      <!-- Chart Container -->
      <div class="flex-1 relative min-h-0">
        <div ref="chartEl" class="absolute inset-0" />
      </div>

      <!-- RSI Sub-chart -->
      <div v-if="showRSI" class="h-24 border-t border-[#1e2d45]">
        <div ref="rsiChartEl" class="w-full h-full" />
      </div>
    </main>

    <!-- RIGHT SIDEBAR: S/R Visualization -->
    <aside v-if="engineRunning" class="w-56 flex-shrink-0 flex flex-col border-l border-[#1e2d45] overflow-hidden">
      <div class="p-2 border-b border-[#1e2d45]">
        <p class="text-[10px] text-[#e2e8f0] font-semibold tracking-wide">🧱 Muros Detectados</p>
        <div class="mt-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[9px] text-[#475569] uppercase">Mín. toques</span>
            <span class="text-[10px] font-bold text-[#3b82f6]">×{{ srVisMinTouches }}+</span>
          </div>
          <input type="range" :min="1" :max="srVisMaxTouches"
            v-model.number="srVisMinTouches"
            class="w-full h-1 mt-1 appearance-none rounded-full bg-[#1e2d45] cursor-pointer accent-[#3b82f6]" />
          <div class="flex justify-between text-[8px] text-[#475569] mt-0.5">
            <span>1</span><span>{{ srVisMaxTouches }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <label class="flex items-center gap-1 text-[9px] text-[#94a3b8] cursor-pointer">
            <input type="checkbox" v-model="srDrawOnChart" class="accent-[#3b82f6] w-3 h-3" />
            Dibujar en gráfico
          </label>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
        <!-- Resistances -->
        <p class="text-[9px] text-[#475569] uppercase tracking-wider">🔴 Resistencias ({{ srVisResistances.length }})</p>
        <div v-for="lvl in srVisResistances" :key="'r'+lvl.price_level"
          class="flex items-center justify-between px-1.5 py-1 rounded hover:bg-white/[0.02] transition-colors">
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full bg-[#ef4444]" :style="{ opacity: Math.min(1, 0.3 + lvl.touches * 0.1) }" />
            <span class="text-[10px] text-[#e2e8f0] font-mono">${{ formatSRPrice(lvl.price_level) }}</span>
          </div>
          <div class="flex items-center gap-0.5">
            <span v-for="tf in (lvl.confluence || [])" :key="tf"
              class="text-[8px] px-0.5 rounded bg-[#1e2d45] text-[#94a3b8]">{{ tf }}</span>
            <span class="text-[9px] text-[#ef4444] font-bold">×{{ lvl.touches }}</span>
          </div>
        </div>

        <div class="border-t border-[#1e2d45] my-1">
          <p class="text-[8px] text-[#3b82f6] px-1 py-0.5 text-center">── PRECIO ──</p>
        </div>

        <!-- Supports -->
        <p class="text-[9px] text-[#475569] uppercase tracking-wider">🟢 Soportes ({{ srVisSupports.length }})</p>
        <div v-for="lvl in srVisSupports" :key="'s'+lvl.price_level"
          class="flex items-center justify-between px-1.5 py-1 rounded hover:bg-white/[0.02] transition-colors">
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full bg-[#10b981]" :style="{ opacity: Math.min(1, 0.3 + lvl.touches * 0.1) }" />
            <span class="text-[10px] text-[#e2e8f0] font-mono">${{ formatSRPrice(lvl.price_level) }}</span>
          </div>
          <div class="flex items-center gap-0.5">
            <span v-for="tf in (lvl.confluence || [])" :key="tf"
              class="text-[8px] px-0.5 rounded bg-[#1e2d45] text-[#94a3b8]">{{ tf }}</span>
            <span class="text-[9px] text-[#10b981] font-bold">×{{ lvl.touches }}</span>
          </div>
        </div>

        <p v-if="!srVisFiltered.length" class="text-[10px] text-[#475569] text-center py-3">
          Sin muros con ≥{{ srVisMinTouches }} toques
        </p>
      </div>

      <div class="p-2 border-t border-[#1e2d45] text-[9px] text-[#475569]">
        {{ srVisFiltered.length }} muros · ×{{ srVisMinTouches }}+ toques
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts'

const WS_URL = 'ws://localhost:8877/ws/live-feed'

// ── State ──
const wsConnected = ref(false)
const engineRunning = ref(false)
const statusMessage = ref('')
const currentPrice = ref(null)
const balance = ref(0)
const openPnl = ref(0)
const totalBalance = ref(0)
const tradeCount = ref(0)
const openPosition = ref(null)
const pendingOrder = ref(null)
const tradeHistory = ref([])
const signalHistory = ref([])
const scanInfo = ref(null)
const configUpdateMsg = ref('')
const currentTF = ref('15m')
const showEMA = ref(true)
const showRSI = ref(false)
const candleCountdown = ref('')

// ── Chart refs ──
const chartEl = ref(null)
const rsiChartEl = ref(null)
let chart = null
let candleSeries = null
let ema20Line = null
let ema50Line = null
let ema200Line = null
let elliottSeries = null
let fiboPriceLines = []
let allElliottData = {} // { '15m': data, '1h': data, ... }
let rsiChart = null
let rsiSeries = null
let markers = []
let chartResizeObs = null  // store for cleanup
let rsiResizeObs = null

// S/R Visualization (right panel)
const srLevels = ref([])
const srVisMinTouches = ref(3)
const srDrawOnChart = ref(true)
let srPriceLines = []  // track chart price lines for cleanup

// ── LocalStorage Persistence ──
const LS_KEY = 'live-trading-config'
const LS_UI_KEY = 'live-trading-ui'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // Merge saved values into config (preserve structure)
      Object.assign(config.value, saved)
    }
    const uiRaw = localStorage.getItem(LS_UI_KEY)
    if (uiRaw) {
      const ui = JSON.parse(uiRaw)
      if (ui.showEMA !== undefined) showEMA.value = ui.showEMA
      if (ui.showRSI !== undefined) showRSI.value = ui.showRSI
      if (ui.currentTF) currentTF.value = ui.currentTF
      if (ui.srVisMinTouches !== undefined) srVisMinTouches.value = ui.srVisMinTouches
      if (ui.srDrawOnChart !== undefined) srDrawOnChart.value = ui.srDrawOnChart
    }
  } catch (e) { /* ignore corrupt data */ }
}

function saveToStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config.value))
    localStorage.setItem(LS_UI_KEY, JSON.stringify({
      showEMA: showEMA.value,
      showRSI: showRSI.value,
      currentTF: currentTF.value,
      srVisMinTouches: srVisMinTouches.value,
      srDrawOnChart: srDrawOnChart.value,
    }))
  } catch (e) { /* ignore */ }
}

// S/R Computed properties
const srVisMaxTouches = computed(() => Math.max(1, ...srLevels.value.map(l => l.touches || 1)))
const srVisFiltered = computed(() => srLevels.value.filter(l => (l.touches || 1) >= srVisMinTouches.value))
const srVisResistances = computed(() =>
  srVisFiltered.value.filter(l => !l.is_support).sort((a, b) => a.price_level - b.price_level)
)
const srVisSupports = computed(() =>
  srVisFiltered.value.filter(l => l.is_support).sort((a, b) => b.price_level - a.price_level)
)

function formatSRPrice(p) {
  if (!p) return '-'
  if (p < 0.001) return p.toFixed(8)
  if (p < 1) return p.toFixed(4)
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function drawSRPriceLines() {
  if (!candleSeries || !srDrawOnChart.value) {
    // Clear any existing lines
    clearSRPriceLines()
    return
  }
  // Clear old lines
  clearSRPriceLines()

  // Draw lines for filtered levels
  for (const lvl of srVisFiltered.value) {
    try {
      const line = candleSeries.createPriceLine({
        price: lvl.price_level,
        color: lvl.is_support ? '#10b98160' : '#ef444460',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `${lvl.is_support ? 'S' : 'R'} ×${lvl.touches} [${(lvl.confluence || []).join(',')}]`,
      })
      srPriceLines.push(line)
    } catch (e) {
      // Lightweight charts may throw if disposed
    }
  }
}

function clearSRPriceLines() {
  for (const line of srPriceLines) {
    try {
      candleSeries?.removePriceLine(line)
    } catch (e) { /* ignore */ }
  }
  srPriceLines = []
}

const config = ref({
  symbol: 'BTC/USDT',
  mode: 'clean',
  take_profit_pct: 2.0,
  stop_loss_pct: 1.0,
  leverage: 5,
  total_capital: 500,
  scan_interval: 3,
  global_min_touches: 3,
  mandatory_tfs: ['1h'],
  min_touches_by_tf: { '15m': 0, '1h': 0, '4h': 1, '1d': 0, '1w': 0 },
  proximity_pct: 1.0,
  require_divergence: 'off',
  divergence_max_tf: 'any',
  // Martingale
  entries_count: 4,
  entry_distance_pct: 1.5,
})

function toggleMandatoryTF(tf) {
  const idx = config.value.mandatory_tfs.indexOf(tf)
  if (idx >= 0) config.value.mandatory_tfs.splice(idx, 1)
  else config.value.mandatory_tfs.push(tf)
}


// ── Candle Countdown ──
const TF_SECONDS = { '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800 }
let countdownInterval = null

function updateCountdown() {
  const tfSec = TF_SECONDS[currentTF.value] || 900
  const now = Math.floor(Date.now() / 1000)
  const remaining = tfSec - (now % tfSec)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  if (mins > 59) {
    const hrs = Math.floor(mins / 60)
    candleCountdown.value = `${hrs}h ${mins % 60}m ${secs.toString().padStart(2, '0')}s`
  } else {
    candleCountdown.value = `${mins}:${secs.toString().padStart(2, '0')}`
  }
}

// ── WebSocket ──
let ws = null
let reconnectTimer = null

function connectWS() {
  if (ws && ws.readyState === WebSocket.OPEN) return

  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    wsConnected.value = true
    statusMessage.value = 'Listo'
    sendWS({ action: 'status' })
  }

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      handleMessage(msg)
    } catch (err) {
      console.error('WS parse error:', err)
    }
  }

  ws.onclose = () => {
    wsConnected.value = false
    statusMessage.value = 'Reconectando...'
    reconnectTimer = setTimeout(connectWS, 3000)
  }

  ws.onerror = () => {
    ws.close()
  }
}

function sendWS(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function handleMessage(msg) {
  const { type, data } = msg

  switch (type) {
    case 'candle':
      // Only update the live candle if we're on 15m view (stream is 15m)
      if (currentTF.value === '15m' && candleSeries) {
        candleSeries.update(data)
      }
      currentPrice.value = data.close
      break

    case 'elliott_wave_update':
      allElliottData = data
      renderElliottWaves()
      break

    case 'balance':
      balance.value = data.balance
      openPnl.value = data.open_pnl
      totalBalance.value = data.total
      tradeCount.value = data.trades
      break

    case 'signal':
      pendingOrder.value = {
        type: data.type,
        limit_price: data.limit_price,
        score: data.score
      }
      // Add to signal history
      signalHistory.value.push({ ...data, _expanded: false })
      break

    case 'trade_open':
      openPosition.value = {
        type: data.type,
        entry_price: data.entry_price,
        tp: data.tp,
        sl: data.sl,
        score: data.score
      }
      pendingOrder.value = null
      addMarker(data.time, data.type === 'LONG' ? 'buy' : 'sell', data.entry_price)
      break

    case 'trade_close':
      openPosition.value = null
      tradeHistory.value.push(data)
      balance.value = data.balance
      addMarker(data.time, data.pnl_usd >= 0 ? 'buy' : 'sell', data.exit_price,
        data.exit_reason === 'TP' ? '✅' : '❌')
      break

    case 'order_expired':
      pendingOrder.value = null
      break

    case 'scan_result':
      scanInfo.value = data
      // SR levels come with candles_data, but also update on scan
      if (data.sr_levels) {
        srLevels.value = data.sr_levels
        drawSRPriceLines()
      }
      break

    case 'engine_started':
      engineRunning.value = true
      statusMessage.value = `${data.symbol} — Paper Trading activo`
      // Wait a moment for buffered data to be ready, then request candles
      setTimeout(() => requestCandles(), 500)
      break

    case 'engine_stopped':
      engineRunning.value = false
      statusMessage.value = 'Motor detenido'
      break

    case 'status':
      if (data.message) {
        statusMessage.value = data.message
      } else if (data.running !== undefined) {
        engineRunning.value = data.running
        if (data.running) {
          balance.value = data.balance
          tradeCount.value = data.trade_count
          openPosition.value = data.open_position
          pendingOrder.value = data.pending_order
          tradeHistory.value = data.trade_history || []
          signalHistory.value = (data.signal_history || []).map(s => ({ ...s, _expanded: false }))
          statusMessage.value = `${data.symbol} — Activo`
          setTimeout(() => requestCandles(), 300)
        }
      }
      break

    case 'config_updated':
      configUpdateMsg.value = `✅ Actualizado: ${data.changed?.join(', ') || 'sin cambios'}`
      setTimeout(() => { configUpdateMsg.value = '' }, 4000)
      break

    case 'start_result':
    case 'stop_result':
      break

    case 'candles_data':
      console.log('[WS] candles_data received, candles:', data?.candles?.length)
      renderFullChart(data)
      break
  }
}

// ── Engine Control ──
function toggleEngine() {
  if (engineRunning.value) {
    sendWS({ action: 'stop' })
  } else {
    // Clean min_touches_by_tf: only send non-zero values
    const cleanConfig = { ...config.value }
    const cleanTouches = {}
    for (const [tf, v] of Object.entries(cleanConfig.min_touches_by_tf)) {
      if (v > 0) cleanTouches[tf] = v
    }
    cleanConfig.min_touches_by_tf = cleanTouches
    sendWS({ action: 'start', config: cleanConfig })
  }
}

function switchTF(tf) {
  currentTF.value = tf
  requestCandles()
}

function requestCandles() {
  if (!engineRunning.value) return
  sendWS({ action: 'get_candles', tf: currentTF.value, limit: 500 })
}

function applyConfig() {
  const cleanConfig = { ...config.value }
  const cleanTouches = {}
  for (const [tf, v] of Object.entries(cleanConfig.min_touches_by_tf)) {
    if (v > 0) cleanTouches[tf] = v
  }
  cleanConfig.min_touches_by_tf = cleanTouches
  sendWS({ action: 'update_config', config: cleanConfig })
}

function formatTime(unixSec) {
  if (!unixSec) return ''
  const d = new Date(unixSec * 1000)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

// ── Chart ──
function initChart() {
  if (!chartEl.value) return

  chart = createChart(chartEl.value, {
    layout: {
      background: { color: '#0a0e1a' },
      textColor: '#94a3b8',
      fontSize: 10,
    },
    grid: {
      vertLines: { color: '#1e2d4520' },
      horzLines: { color: '#1e2d4520' },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: '#1e2d45' },
    timeScale: {
      borderColor: '#1e2d45',
      timeVisible: true,
      secondsVisible: false,
    },
  })

  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
  })

  // EMA lines
  ema20Line = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
  ema50Line = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
  ema200Line = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

  // Handle resize (store ref for cleanup)
  if (chartResizeObs) chartResizeObs.disconnect()
  chartResizeObs = new ResizeObserver(() => {
    if (chart && chartEl.value) {
      try { chart.applyOptions({ width: chartEl.value.clientWidth, height: chartEl.value.clientHeight }) } catch(e) {}
    }
  })
  chartResizeObs.observe(chartEl.value)
}

function initRSIChart() {
  if (!rsiChartEl.value) return
  if (rsiChart) { rsiChart.remove(); rsiChart = null }

  rsiChart = createChart(rsiChartEl.value, {
    layout: { background: { color: '#0a0e1a' }, textColor: '#94a3b8', fontSize: 9 },
    grid: { vertLines: { color: '#1e2d4510' }, horzLines: { color: '#1e2d4520' } },
    rightPriceScale: { borderColor: '#1e2d45', scaleMargins: { top: 0.05, bottom: 0.05 } },
    timeScale: { visible: false },
    crosshair: { mode: 0 },
  })

  rsiSeries = rsiChart.addSeries(LineSeries, {
    color: '#8b5cf6', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true
  })

  // ── Sync time scales between main chart and RSI chart ──
  let isSyncing = false
  chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
    if (isSyncing || !rsiChart) return
    isSyncing = true
    try { rsiChart.timeScale().setVisibleLogicalRange(range) } catch(e) {}
    isSyncing = false
  })
  rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
    if (isSyncing || !chart) return
    isSyncing = true
    try { chart.timeScale().setVisibleLogicalRange(range) } catch(e) {}
    isSyncing = false
  })

  if (rsiResizeObs) rsiResizeObs.disconnect()
  rsiResizeObs = new ResizeObserver(() => {
    if (rsiChart && rsiChartEl.value) {
      try { rsiChart.applyOptions({ width: rsiChartEl.value.clientWidth, height: rsiChartEl.value.clientHeight }) } catch(e) {}
    }
  })
  rsiResizeObs.observe(rsiChartEl.value)
}

// ── Render Elliott Waves ──────────────────────────────────────────
function renderElliottWaves() {
  if (!chart || !candleSeries) return

  const data = allElliottData[currentTF.value]

  // 1. Ensure LineSeries exists
  if (!elliottSeries) {
    elliottSeries = chart.addSeries(LineSeries, {
      color: '#38bdf8', // Light blue
      lineWidth: 2,
      lineStyle: 0,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false
    })
  }

  // 2. Clear old fibo lines
  fiboPriceLines.forEach(line => candleSeries.removePriceLine(line))
  fiboPriceLines = []

  if (!data || !data.points || data.points.length === 0) {
    elliottSeries.setData([])
    // Clear custom markers if needed, but they are managed as part of the overall markers logic.
    // We'll update overall markers later.
    return
  }

  // 3. Set data for wave lines
  const dedup = (arr) => {
    if (!arr || !arr.length) return []
    const map = new Map()
    for (const item of arr) {
      if (item.time) map.set(item.time, item)
    }
    return Array.from(map.values()).sort((a, b) => a.time - b.time)
  }
  
  // Format data for LineSeries ({ time, value })
  const lineData = data.points.map(p => ({ time: p.time, value: p.price }))
  elliottSeries.setData(dedup(lineData))

  // 4. Draw Fibo Targets as PriceLines
  if (data.fibo_targets) {
    data.fibo_targets.forEach(target => {
      const line = candleSeries.createPriceLine({
        price: target.price,
        color: '#4ade80', // Green
        lineWidth: 1,
        lineStyle: 1, // Dashed
        axisLabelVisible: true,
        title: `Target ${target.level}`,
      })
      fiboPriceLines.push(line)
    })
  }
  
  // Also draw Invalidation Price
  if (data.invalidation_price) {
    const invLine = candleSeries.createPriceLine({
      price: data.invalidation_price,
      color: '#ef4444', // Red
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: 'Invalidation',
    })
    fiboPriceLines.push(invLine)
  }

  // We save the labeled points to state, so `updateChartMarkers` can pick them up
  elliottMarkersData = data.labeled_points || []
  updateChartMarkers()
}

// Global variable for elliott markers state
let elliottMarkersData = []

// Helper to rebuild markers including trade history + elliott labels
function updateChartMarkers() {
  if (!candleSeries) return
  
  let markers = []
  
  // 1. Add Trade History Markers
  tradeHistory.value.forEach(trade => {
    if (trade.entry_time) {
      markers.push({
        time: trade.entry_time,
        position: trade.side === 'LONG' ? 'belowBar' : 'aboveBar',
        color: trade.side === 'LONG' ? '#10b981' : '#ef4444',
        shape: trade.side === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `${trade.side} ${trade.symbol}`
      })
    }
  })

  // 2. Add Elliott Wave Labels
  elliottMarkersData.forEach(p => {
    markers.push({
      time: p.time,
      position: p.label % 2 === 0 ? 'belowBar' : 'aboveBar', // Alternate above/below
      color: '#38bdf8',
      shape: p.label % 2 === 0 ? 'arrowUp' : 'arrowDown',
      text: `Wally ${p.label}` // Wave label (0, 1, 2, 3...)
    })
  })
  
  // Sort markers by time as required by lightweight-charts
  markers.sort((a, b) => a.time - b.time)
  
  // Lightweight charts doesn't allow multiple markers on exactly the same timestamp (it acts weird in some versions)
  // Let's deduplicate markers if they clash on exact TIME
  const uniqueTime = new Map()
  markers.forEach(m => {
    // If a collision happens, combine text maybe, but here we'll just prioritize trade markers since they come first in map
    if (!uniqueTime.has(m.time)) uniqueTime.set(m.time, m)
    else uniqueTime.get(m.time).text += ` | ${m.text}`
  })
  
  candleSeries.setMarkers(Array.from(uniqueTime.values()).sort((a,b) => a.time - b.time))
}

// ─────────────────────────────────────────────────────────────────
function renderFullChart(chartData) {
  if (!candleSeries || !chartData) return

  // Helper: deduplicate + sort ascending by time
  const dedup = (arr) => {
    if (!arr || !arr.length) return []
    const map = new Map()
    for (const item of arr) {
      map.set(item.time, item)  // last wins for same time
    }
    return Array.from(map.values()).sort((a, b) => a.time - b.time)
  }

  const { candles, indicators } = chartData

  if (candles && candles.length) {
    const unique = dedup(candles)
    candleSeries.setData(unique)
    currentPrice.value = unique[unique.length - 1]?.close || currentPrice.value
  }

  // Store SR levels from candles_data response
  if (chartData.sr_levels && chartData.sr_levels.length) {
    srLevels.value = chartData.sr_levels
    drawSRPriceLines()
  }

  // Set EMA lines
  if (indicators) {
    if (indicators.ema_20 && showEMA.value) ema20Line.setData(dedup(indicators.ema_20))
    else ema20Line.setData([])

    if (indicators.ema_50 && showEMA.value) ema50Line.setData(dedup(indicators.ema_50))
    else ema50Line.setData([])

    if (indicators.ema_200 && showEMA.value) ema200Line.setData(dedup(indicators.ema_200))
    else ema200Line.setData([])

    // RSI
    if (indicators.rsi && rsiSeries && showRSI.value) {
      rsiSeries.setData(dedup(indicators.rsi))
    }
  }

  // Fit to content
  if (chart) chart.timeScale().fitContent()
  if (rsiChart) rsiChart.timeScale().fitContent()
}

function addMarker(time, type, price, text) {
  markers.push({
    time,
    position: type === 'buy' ? 'belowBar' : 'aboveBar',
    color: type === 'buy' ? '#10b981' : '#ef4444',
    shape: type === 'buy' ? 'arrowUp' : 'arrowDown',
    text: text || (type === 'buy' ? '▲' : '▼')
  })
  markers.sort((a, b) => a.time - b.time)
  if (candleSeries) createSeriesMarkers(candleSeries, markers)
}

// ── Watchers ──
watch(showEMA, () => { saveToStorage(); requestCandles() })
watch(showRSI, async (val) => {
  saveToStorage()
  if (val) {
    await nextTick()
    initRSIChart()
  }
  requestCandles()
})
watch(srVisMinTouches, () => { saveToStorage(); drawSRPriceLines() })
watch(srDrawOnChart, () => { saveToStorage(); drawSRPriceLines() })
watch(currentTF, () => { 
  saveToStorage()
  renderElliottWaves()
})
// Deep watch config for auto-save
watch(config, () => saveToStorage(), { deep: true })

// ── Lifecycle ──
onMounted(() => {
  loadFromStorage()  // Restore saved config before anything
  initChart()
  connectWS()
  countdownInterval = setInterval(updateCountdown, 1000)
  updateCountdown()
})

onBeforeUnmount(() => {
  // Disconnect ResizeObservers BEFORE DOM removal
  if (chartResizeObs) { chartResizeObs.disconnect(); chartResizeObs = null }
  if (rsiResizeObs) { rsiResizeObs.disconnect(); rsiResizeObs = null }
  // Clear SR price lines before chart disposal
  clearSRPriceLines()
})

onUnmounted(() => {
  if (ws) ws.close()
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (countdownInterval) clearInterval(countdownInterval)
  // Remove charts (null all refs to prevent stale access)
  if (chart) { try { chart.remove() } catch(e) {} chart = null }
  if (rsiChart) { try { rsiChart.remove() } catch(e) {} rsiChart = null }
  candleSeries = null
  ema20Line = null
  ema50Line = null
  ema200Line = null
  rsiSeries = null
  markers = []
  srPriceLines = []
  elliottSeries = null
  fiboPriceLines = []
  elliottMarkersData = []
})
</script>
