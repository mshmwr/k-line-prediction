// frontend/src/types.ts
export interface OHLCRow {
  open: string;
  high: string;
  low: string;
  close: string;
  time: string;
}

export interface MatchCase {
  id: string;
  correlation: number;
  historicalOhlc: Array<{ open: number; high: number; low: number; close: number }>;
  futureOhlc: Array<{ open: number; high: number; low: number; close: number }>;
  startDate: string;
  endDate: string;
}

export interface PredictStats {
  optimistic: number;
  baseline: number;
  pessimistic: number;
  optimisticPct: number;
  baselinePct: number;
  pessimisticPct: number;
  winRate: number;
  meanCorrelation: number;
}

export interface PredictResponse {
  matches: MatchCase[];
  stats: PredictStats;
}
