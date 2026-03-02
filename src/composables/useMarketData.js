import { ref, reactive, watch } from 'vue'
import { supabase } from '../lib/supabase.js'

// Global filter state - shared across all components
export const filters = reactive({
  symbol: 'BTC/USDT',
  timeframes: ['4h', '1d'],          // default: Swing mode
  showHistorical: false,
  minTouches: 1,
  mode: 'swing',                     // scalping | swing | spot | multitf | custom
  includeMultiTF: false,             // include multi_tf source_run levels
})

export const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT']
export const TIMEFRAMES = ['15m', '1h', '4h', '1d', '1w']

// ──────────────────────────────────────────────────
// SR Levels
// ──────────────────────────────────────────────────
export function useSRLevels() {
  const levels = ref([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data, error } = await supabase
      .from('support_resistance_levels')
      .select('*')
      .eq('symbol', filters.symbol)
      .order('created_at', { ascending: false })
      .limit(500)                     // fetch more, we'll dedup client-side

    if (!error && data) {
      // 1. source_run filter:
      //    - In 'multitf' mode: only multi_tf rows
      //    - Otherwise: per_tf rows matching the TF selection
      //    - includeMultiTF: adds multi_tf rows on top when not in multitf mode
      const isMultiTFMode = filters.mode === 'multitf'

      let filtered = data.filter(row => {
        const conf = row.confluence || []
        const src  = row.source_run || 'per_tf'

        if (isMultiTFMode) {
          // Only show multi_tf rows
          return src === 'multi_tf'
        }

        // per_tf rows matching at least one selected TF
        const matchesTF = filters.timeframes.some(tf => conf.includes(tf))
        if (src === 'per_tf' && matchesTF) return true
        // optionally include multi_tf rows
        if (src === 'multi_tf' && filters.includeMultiTF) return true
        return false
      })

      // 2. Deduplicate: sort by price, merge levels within 0.3% of each other
      //    keeping the one with the highest touch count
      const sorted = [...filtered].sort((a, b) => a.price_level - b.price_level)
      const deduped = []
      for (const row of sorted) {
        const prev = deduped[deduped.length - 1]
        if (prev && Math.abs(row.price_level - prev.price_level) / prev.price_level < 0.003) {
          if ((row.touches || 1) > (prev.touches || 1)) {
            deduped[deduped.length - 1] = row
          }
        } else {
          deduped.push(row)
        }
      }

      levels.value = deduped
    }
    loading.value = false
  }

  watch(
    () => [filters.symbol, filters.timeframes.join(), filters.mode, filters.includeMultiTF],
    fetch,
    { immediate: true }
  )
  return { levels, loading, fetch }
}

// ──────────────────────────────────────────────────
// RSI Divergences
// ──────────────────────────────────────────────────
export function useDivergences() {
  const divergences = ref([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    let query = supabase
      .from('rsi_divergences')
      .select('*')
      .eq('symbol', filters.symbol)
      .in('timeframe', filters.timeframes)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!filters.showHistorical) {
      query = query.ilike('state', '%ACTIVA%')
    }

    const { data, error } = await query
    if (!error) divergences.value = data
    loading.value = false
  }

  watch(() => [filters.symbol, filters.timeframes.join(), filters.showHistorical], fetch, { immediate: true })
  return { divergences, loading, fetch }
}

// ──────────────────────────────────────────────────
// Fair Value Gaps
// ──────────────────────────────────────────────────
export function useFVGs() {
  const fvgs = ref([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data, error } = await supabase
      .from('fair_value_gaps')
      .select('*')
      .eq('symbol', filters.symbol)
      .in('timeframe', filters.timeframes)
      .eq('mitigated', false)
      .order('distance_pct', { ascending: true })
      .limit(50)

    if (!error) fvgs.value = data
    loading.value = false
  }

  watch(() => [filters.symbol, filters.timeframes.join()], fetch, { immediate: true })
  return { fvgs, loading, fetch }
}

// ──────────────────────────────────────────────────
// Sentiment
// ──────────────────────────────────────────────────
export function useSentiment() {
  const sentiment = ref(null)
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    // sentiment uses asset names not symbol pairs — map the symbol
    const assetMap = {
      'BTC/USDT': 'Bitcoin', 'ETH/USDT': 'Ethereum',
      'SOL/USDT': 'Solana', 'BNB/USDT': 'Binance Coin', 'XRP/USDT': 'XRP'
    }
    const assetName = assetMap[filters.symbol] || filters.symbol

    const { data } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .eq('symbol', assetName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) sentiment.value = data
    loading.value = false
  }

  watch(() => filters.symbol, fetch, { immediate: true })
  return { sentiment, loading, fetch }
}

// ──────────────────────────────────────────────────
// Official Confluences
// ──────────────────────────────────────────────────
export function useConfluences() {
  const confluences = ref([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data, error } = await supabase
      .from('trade_confluences')
      .select('*')
      .eq('symbol', filters.symbol)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error) confluences.value = data
    loading.value = false
  }

  watch(() => filters.symbol, fetch, { immediate: true })
  return { confluences, loading, fetch }
}

// ──────────────────────────────────────────────────
// Micro-Confluences (calculated client-side)
// ──────────────────────────────────────────────────
export function calcMicroConfluences(levels, divergences, fvgs, sentiment) {
  const results = []
  const price = levels.value.find(() => true)?.price_level  // proxy for current price

  const bullDiv = divergences.value.filter(d => d.type?.includes('ALCISTA') && d.state?.includes('ACTIVA'))
  const bearDiv = divergences.value.filter(d => d.type?.includes('BAJISTA') && d.state?.includes('ACTIVA'))

  const nearSupports = levels.value.filter(l => l.is_support)
  const nearRes = levels.value.filter(l => !l.is_support)

  // LONG micro setup: support visible + bullish divergence + bull FVG above
  if (nearSupports.length && bullDiv.length) {
    const fvgMagnet = fvgs.value.find(f => f.type?.includes('ALCISTA'))
    const sentScore = sentiment.value?.sentiment === 'Alcista' ? 1 : sentiment.value?.sentiment === 'Neutral' ? 0 : -1
    const score = Math.min(10, 5 + bullDiv.length + nearSupports[0]?.confluence?.length + (fvgMagnet ? 2 : 0) + sentScore)
    results.push({
      id: 'micro-long',
      symbol: filters.symbol,
      setup_type: 'LONG',
      score,
      target_price: fvgMagnet?.center_price,
      details: {
        support: nearSupports[0]?.price_level,
        support_tf: nearSupports[0]?.confluence,
        rsi_divs: bullDiv.length,
        rsi_tf: bullDiv.map(d => d.timeframe),
        sentiment: sentiment.value?.sentiment,
        fvg_target: fvgMagnet?.center_price,
      }
    })
  }

  // SHORT micro setup: resistance visible + bearish divergence
  if (nearRes.length && bearDiv.length) {
    const fvgMagnet = fvgs.value.find(f => f.type?.includes('BAJISTA'))
    const sentScore = sentiment.value?.sentiment === 'Bajista' ? 1 : sentiment.value?.sentiment === 'Neutral' ? 0 : -1
    const score = Math.min(10, 5 + bearDiv.length + nearRes[0]?.confluence?.length + (fvgMagnet ? 2 : 0) + sentScore)
    results.push({
      id: 'micro-short',
      symbol: filters.symbol,
      setup_type: 'SHORT',
      score,
      target_price: fvgMagnet?.center_price,
      details: {
        resistance: nearRes[0]?.price_level,
        resistance_tf: nearRes[0]?.confluence,
        rsi_divs: bearDiv.length,
        rsi_tf: bearDiv.map(d => d.timeframe),
        sentiment: sentiment.value?.sentiment,
        fvg_target: fvgMagnet?.center_price,
      }
    })
  }

  return results
}
