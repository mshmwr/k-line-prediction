import { useEffect, useState } from 'react'
import type { BacktestSummary, ActiveParams, Prediction, ActualOutcome, ChartPoint } from '../types/backtest'

// must match scripts/daily_predict.py firestore project (Known Gap KG-1: env-var wiring deferred to deploy ticket)
const K_LINE_FIRESTORE_PROJECT_ID = 'k-line-prediction'
const PROJECT_ID = import.meta.env.VITE_FIRESTORE_PROJECT_ID ?? K_LINE_FIRESTORE_PROJECT_ID

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const RETRY_DELAY_MS = 5000

type Status = 'loading' | 'ready' | 'error'

export interface BacktestDataResult {
  summary: BacktestSummary | null
  params: ActiveParams | null
  predictions: Prediction[]
  actuals: ActualOutcome[]
  chartPoints: ChartPoint[]
  status: Status
  error: string | null
}

// ─── Firestore field value decoder ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeValue(v: any): unknown {
  if (v == null) return null
  if ('stringValue' in v) return v.stringValue as string
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue as number
  if ('booleanValue' in v) return v.booleanValue as boolean
  if ('nullValue' in v) return null
  if ('mapValue' in v) return decodeFields(v.mapValue.fields ?? {})
  if ('arrayValue' in v) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (v.arrayValue.values ?? []).map((item: any) => decodeValue(item))
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeFields(fields: Record<string, any>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(fields)) {
    result[key] = decodeValue(val)
  }
  return result
}

// ─── Fetch with one retry ──────────────────────────────────────────────────────

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
    try {
      const resp = await fetch(url, options)
      if (!resp.ok) {
        lastError = new Error(`HTTP ${resp.status} from ${url}`)
        continue
      }
      return resp
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`)
}

// ─── Summary fetch (latest backtest_summaries doc by name desc) ────────────────

async function fetchLatestSummary(): Promise<BacktestSummary> {
  const url = `${BASE_URL}/backtest_summaries?pageSize=1&orderBy=__name__%20desc`
  const resp = await fetchWithRetry(url)
  const json = await resp.json()
  const docs = json.documents
  if (!docs || docs.length === 0) {
    throw new Error('No backtest summary available yet')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = decodeFields((docs[0] as any).fields ?? {})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perTrendRaw = fields.per_trend as Record<string, any> | undefined
  const per_trend: BacktestSummary['per_trend'] = {}
  if (perTrendRaw) {
    for (const trend of ['up', 'down', 'flat'] as const) {
      const entry = perTrendRaw[trend] as Record<string, unknown> | undefined
      if (entry) {
        per_trend[trend] = {
          hit_rate_high: entry.hit_rate_high as number,
          hit_rate_low: entry.hit_rate_low as number,
          avg_mae: entry.avg_mae as number,
          sample_size: entry.sample_size as number,
        }
      }
    }
  }
  return {
    hit_rate_high: fields.hit_rate_high as number,
    hit_rate_low: fields.hit_rate_low as number,
    avg_mae: fields.avg_mae as number,
    avg_rmse: fields.avg_rmse as number,
    sample_size: fields.sample_size as number,
    per_trend,
    window_days: fields.window_days as number,
    computed_at: fields.computed_at as string,
  }
}

// ─── Active params fetch ───────────────────────────────────────────────────────

/**
 * Default sentinel returned when predictor_params/active doc is missing (404).
 * Matches DEFAULT_PARAMS from K-078. AC-081-ACTIVE-PARAMS-CARD: card displays
 * "Defaults — never optimized" when the doc does not exist.
 */
const DEFAULT_ACTIVE_PARAMS_SENTINEL: Omit<ActiveParams, 'params_hash'> = {
  window_days: 30,
  pearson_threshold: 0.4,
  top_k: 10,
  optimized_at: null,
}

async function computeParamsHash(window_days: number, pearson: number, top_k: number): Promise<string> {
  const hashSource = `${window_days}:${pearson.toFixed(6)}:${top_k}`
  try {
    const encoded = new TextEncoder().encode(hashSource)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // crypto.subtle unavailable in some test environments — use placeholder
    return hashSource
  }
}

async function fetchActiveParams(): Promise<ActiveParams> {
  const url = `${BASE_URL}/predictor_params/active`
  let resp: Response
  try {
    resp = await fetchWithRetry(url)
  } catch (err) {
    // fetchWithRetry throws on non-ok; treat 404 as "doc missing" → return defaults sentinel
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('HTTP 404')) {
      const params_hash = await computeParamsHash(
        DEFAULT_ACTIVE_PARAMS_SENTINEL.window_days,
        DEFAULT_ACTIVE_PARAMS_SENTINEL.pearson_threshold,
        DEFAULT_ACTIVE_PARAMS_SENTINEL.top_k,
      )
      return { ...DEFAULT_ACTIVE_PARAMS_SENTINEL, params_hash }
    }
    throw err
  }
  const json = await resp.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = decodeFields((json as any).fields ?? {})
  const window_days = fields.window_days as number
  const pearson = fields.pearson_threshold as number
  const top_k = fields.top_k as number
  // Compute params_hash from window+pearson+top_k for display (not a Firestore wire field)
  const params_hash = await computeParamsHash(window_days, pearson, top_k)
  return {
    window_days,
    pearson_threshold: pearson,
    top_k,
    optimized_at: (fields.optimized_at as string | null | undefined) ?? null,
    params_hash,
  }
}

// ─── 30-day time-series runQuery ───────────────────────────────────────────────

/**
 * Returns a doc-ID lower bound in YYYY-MM-DD-HH format (UTC) representing ~30 days ago.
 * Both `predictions` and `actuals` collections use this format for their doc IDs,
 * so `__name__ >= cutoffDocId` is the correct range filter for both collections
 * (the `actuals` collection has no `query_ts` field — C-1 fix).
 */
function thirtyDaysAgoDocId(): string {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  // YYYY-MM-DD-HH format, e.g. "2026-04-02-16"
  const yyyy = cutoff.getUTCFullYear()
  const mm = String(cutoff.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(cutoff.getUTCDate()).padStart(2, '0')
  const hh = String(cutoff.getUTCHours()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}-${hh}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runQueryBody(collectionId: string, cutoffDocId: string): any {
  return {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath: '__name__' },
          op: 'GREATER_THAN_OR_EQUAL',
          value: { referenceValue: `projects/${PROJECT_ID}/databases/(default)/documents/${collectionId}/${cutoffDocId}` },
        },
      },
      orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
      limit: 35,
    },
  }
}

async function fetchPredictions(cutoffDocId: string): Promise<Prediction[]> {
  const url = `${BASE_URL}:runQuery`
  const resp = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runQueryBody('predictions', cutoffDocId)),
  })
  const json: unknown[] = await resp.json()
  return json
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => item.document)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      const doc = item.document
      const fields = decodeFields(doc.fields ?? {})
      const nameParts = (doc.name as string).split('/')
      const docId = nameParts[nameParts.length - 1]
      return {
        params_hash: fields.params_hash as string,
        projected_high: fields.projected_high as number | null,
        projected_low: fields.projected_low as number | null,
        projected_median: fields.projected_median as number | null,
        top_k_count: fields.top_k_count as number,
        trend: fields.trend as Prediction['trend'],
        query_ts: fields.query_ts as string,
        created_at: fields.created_at as string,
        _doc_id: docId,
      }
    })
}

async function fetchActuals(cutoffDocId: string): Promise<ActualOutcome[]> {
  const url = `${BASE_URL}:runQuery`
  const resp = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runQueryBody('actuals', cutoffDocId)),
  })
  const json: unknown[] = await resp.json()
  return json
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => item.document)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      const doc = item.document
      const fields = decodeFields(doc.fields ?? {})
      const nameParts = (doc.name as string).split('/')
      const docId = nameParts[nameParts.length - 1]
      return {
        high_hit: fields.high_hit as boolean,
        low_hit: fields.low_hit as boolean,
        mae: fields.mae as number,
        rmse: fields.rmse as number,
        actual_high: fields.actual_high as number,
        actual_low: fields.actual_low as number,
        computed_at: fields.computed_at as string,
        _doc_id: docId,
      }
    })
}

// ─── Chart points assembly ─────────────────────────────────────────────────────

function assembleChartPoints(predictions: Prediction[], actuals: ActualOutcome[]): ChartPoint[] {
  const actualsMap = new Map<string, ActualOutcome>()
  for (const a of actuals) {
    if (a._doc_id) actualsMap.set(a._doc_id, a)
  }
  const points: ChartPoint[] = []
  for (const p of predictions) {
    if (!p._doc_id || p.projected_median == null) continue
    const actual = actualsMap.get(p._doc_id)
    if (!actual) continue
    points.push({
      date: p.query_ts.slice(0, 10), // YYYY-MM-DD
      projectedMedian: p.projected_median,
      actualClose: (actual.actual_high + actual.actual_low) / 2,
    })
  }
  return points
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useBacktestData(): BacktestDataResult {
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<BacktestSummary | null>(null)
  const [params, setParams] = useState<ActiveParams | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [actuals, setActuals] = useState<ActualOutcome[]>([])
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Compute cutoff once per load() — shared by both predictions + actuals queries (C-1 fix)
        const cutoffDocId = thirtyDaysAgoDocId()
        const [summaryResult, paramsResult, predsResult, actualsResult] = await Promise.all([
          fetchLatestSummary(),
          fetchActiveParams(),
          fetchPredictions(cutoffDocId),
          fetchActuals(cutoffDocId),
        ])
        if (cancelled) return
        // Warn BEFORE join if either collection saturated the 35-doc cap (B-W3 fix)
        if (predsResult.length === 35 || actualsResult.length === 35) {
          console.warn('runQuery saturated 35-doc cap; older data may be missing from chart')
        }
        const points = assembleChartPoints(predsResult, actualsResult)
        setSummary(summaryResult)
        setParams(paramsResult)
        setPredictions(predsResult)
        setActuals(actualsResult)
        setChartPoints(points)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { summary, params, predictions, actuals, chartPoints, status, error }
}
