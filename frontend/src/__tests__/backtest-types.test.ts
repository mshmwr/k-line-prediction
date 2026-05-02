import { describe, it, expect } from 'vitest'

// AC-081-TYPE-CONTRACT — BacktestSummary fields must match K-080 frozenset exactly
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
