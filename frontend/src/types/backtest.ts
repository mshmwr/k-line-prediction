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
// Wire format uses window_days / pearson_threshold — NOT the Python ParamSnapshot attribute
// names (ma_trend_window_days / ma_trend_pearson_threshold). AC-081-TYPE-CONTRACT mandates parity.
export interface ActiveParams {
  /** Mirrors backend/firestore_config.py FIRESTORE_PREDICTOR_PARAMS_FIELDS. */
  window_days: number
  pearson_threshold: number
  top_k: number
  optimized_at: string | null
  /** Computed by useBacktestData from {window_days, pearson_threshold, top_k}; not a Firestore wire field. */
  params_hash: string
}

// Assembled chart point for TimeSeriesChart (hook builds this from Prediction + ActualOutcome join)
export interface ChartPoint {
  date: string;          // YYYY-MM-DD from query_ts
  projectedMedian: number;
  actualClose: number;   // (actual_high + actual_low) / 2 — midpoint of 72-bar realized window
}
