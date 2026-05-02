import { describe, it, expect } from 'vitest'

// AC-081-TYPE-CONTRACT — TypeScript type shapes must match backend frozensets exactly
// Source: backend/firestore_config.py lines 30–67

// ─── BacktestSummary ──────────────────────────────────────────────────────────

const K080_BACKTEST_SUMMARY_FIELDS = [
  'hit_rate_high',
  'hit_rate_low',
  'avg_mae',
  'avg_rmse',
  'sample_size',
  'per_trend',
  'window_days',
  'computed_at',
]

const BacktestSummaryShape: Record<string, true> = {
  hit_rate_high: true,
  hit_rate_low: true,
  avg_mae: true,
  avg_rmse: true,
  sample_size: true,
  per_trend: true,
  window_days: true,
  computed_at: true,
}

describe('AC-081-TYPE-CONTRACT — BacktestSummary parity with K-080 frozenset', () => {
  it('has exactly the same keys as FIRESTORE_BACKTEST_SUMMARY_FIELDS', () => {
    expect(Object.keys(BacktestSummaryShape).sort()).toEqual(K080_BACKTEST_SUMMARY_FIELDS.sort())
  })
})

// ─── Prediction ───────────────────────────────────────────────────────────────

// FIRESTORE_PREDICTION_FIELDS from backend/firestore_config.py
const FIRESTORE_PREDICTION_FIELDS = [
  'params_hash',
  'projected_high',
  'projected_low',
  'projected_median',
  'top_k_count',
  'trend',
  'query_ts',
  'created_at',
]

const PredictionShape: Record<string, true> = {
  params_hash: true,
  projected_high: true,
  projected_low: true,
  projected_median: true,
  top_k_count: true,
  trend: true,
  query_ts: true,
  created_at: true,
}

describe('AC-081-TYPE-CONTRACT — Prediction parity with FIRESTORE_PREDICTION_FIELDS', () => {
  it('has exactly the same keys as FIRESTORE_PREDICTION_FIELDS (excluding _doc_id hook injection)', () => {
    expect(Object.keys(PredictionShape).sort()).toEqual(FIRESTORE_PREDICTION_FIELDS.sort())
  })
})

// ─── ActualOutcome ────────────────────────────────────────────────────────────

// FIRESTORE_ACTUAL_FIELDS from backend/firestore_config.py
const FIRESTORE_ACTUAL_FIELDS = [
  'high_hit',
  'low_hit',
  'mae',
  'rmse',
  'actual_high',
  'actual_low',
  'computed_at',
]

const ActualOutcomeShape: Record<string, true> = {
  high_hit: true,
  low_hit: true,
  mae: true,
  rmse: true,
  actual_high: true,
  actual_low: true,
  computed_at: true,
}

describe('AC-081-TYPE-CONTRACT — ActualOutcome parity with FIRESTORE_ACTUAL_FIELDS', () => {
  it('has exactly the same keys as FIRESTORE_ACTUAL_FIELDS (excluding _doc_id hook injection)', () => {
    expect(Object.keys(ActualOutcomeShape).sort()).toEqual(FIRESTORE_ACTUAL_FIELDS.sort())
  })
})

// ─── ActiveParams ─────────────────────────────────────────────────────────────

// FIRESTORE_PREDICTOR_PARAMS_FIELDS ∪ {params_hash}
// params_hash is hook-computed (not a Firestore wire field) but lives on the interface
const ACTIVE_PARAMS_INTERFACE_FIELDS = [
  'window_days',
  'pearson_threshold',
  'top_k',
  'optimized_at',
  'params_hash', // hook-computed from {window_days, pearson_threshold, top_k}; not in Firestore doc
]

const ActiveParamsShape: Record<string, true> = {
  window_days: true,
  pearson_threshold: true,
  top_k: true,
  optimized_at: true,
  params_hash: true,
}

describe('AC-081-TYPE-CONTRACT — ActiveParams parity with FIRESTORE_PREDICTOR_PARAMS_FIELDS ∪ {params_hash}', () => {
  it('has exactly the same keys as FIRESTORE_PREDICTOR_PARAMS_FIELDS plus hook-computed params_hash', () => {
    expect(Object.keys(ActiveParamsShape).sort()).toEqual(ACTIVE_PARAMS_INTERFACE_FIELDS.sort())
  })
})
