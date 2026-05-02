// Mirrors backend/firestore_config.py frozensets — keep in sync; cross-ticket contract from K-080.

// Source: FIRESTORE_PREDICTION_FIELDS (backend/firestore_config.py)
export interface Prediction {
  params_hash: string;          // sha256 hex (full 64 chars)
  projected_high: number | null;
  projected_low: number | null;
  projected_median: number | null;
  top_k_count: number;
  trend: 'up' | 'down' | 'flat' | 'unknown';
  query_ts: string;             // ISO8601 UTC
  created_at: string;           // ISO8601 UTC
  _doc_id?: string;             // injected by hook; not a Firestore field
}

// Source: FIRESTORE_ACTUAL_FIELDS (backend/firestore_config.py)
export interface ActualOutcome {
  high_hit: boolean;
  low_hit: boolean;
  mae: number;
  rmse: number;
  actual_high: number;
  actual_low: number;
  computed_at: string;          // ISO8601 UTC
  _doc_id?: string;             // injected by hook; not a Firestore field
}

// Source: FIRESTORE_BACKTEST_SUMMARY_FIELDS (backend/firestore_config.py)
export interface PerTrendEntry {
  hit_rate_high: number;
  hit_rate_low: number;
  avg_mae: number;
  sample_size: number;
}

export interface BacktestSummary {
  hit_rate_high: number;
  hit_rate_low: number;
  avg_mae: number;
  avg_rmse: number;
  sample_size: number;
  per_trend: Partial<Record<'up' | 'down' | 'flat', PerTrendEntry>>;
  window_days: number;
  computed_at: string;          // ISO8601 UTC
}

// Source: FIRESTORE_PREDICTOR_PARAMS_FIELDS (backend/firestore_config.py)
// Note: ParamSnapshot on backend stores ma_trend_window_days etc. —
// the Firestore doc uses shorter key names (window_days, pearson_threshold, top_k).
// The hook maps Firestore doc keys to these interface fields.
export interface ActiveParams {
  ma_trend_window_days: number;        // Firestore key: window_days
  ma_trend_pearson_threshold: number;  // Firestore key: pearson_threshold
  top_k: number;
  optimized_at: string | null;
  params_hash: string;                 // computed by hook from window+pearson+top_k
}

// Assembled chart point for TimeSeriesChart (hook builds this from Prediction + ActualOutcome join)
export interface ChartPoint {
  date: string;          // YYYY-MM-DD from query_ts
  projectedMedian: number;
  actualClose: number;   // (actual_high + actual_low) / 2 — midpoint of 72-bar realized window
}
