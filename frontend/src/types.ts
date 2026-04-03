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
  futureOhlc: Array<{ open: number; high: number; low: number; close: number; time?: string }>;
  startDate: string;
  endDate: string;
}

export interface OrderSuggestion {
  label: string;
  price: number;
  pct: number;
  occurrenceBar: number;
  occurrenceWindow: string;
  historicalTime: string;
}

export interface PredictStats {
  highest: OrderSuggestion;
  secondHighest: OrderSuggestion;
  secondLowest: OrderSuggestion;
  lowest: OrderSuggestion;
  winRate: number;
  meanCorrelation: number;
}

export interface PredictResponse {
  matches: MatchCase[];
  stats: PredictStats;
}

export interface DayStats {
  label: string;
  highest: { price: number; pct: number; time: string };
  lowest: { price: number; pct: number; time: string };
}
