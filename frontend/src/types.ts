// frontend/src/types.ts
export interface OHLCRow {
  open: string;
  high: string;
  low: string;
  close: string;
  time: string;
}

export interface Ma99Gap {
  fromDate: string;
  toDate: string;
}

export interface MatchCase {
  id: string;
  correlation: number;
  historicalOhlc: Array<{ open: number; high: number; low: number; close: number }>;
  futureOhlc: Array<{ open: number; high: number; low: number; close: number; time?: string }>;
  startDate: string;
  endDate: string;
  historicalMa99: (number | null)[];
  futureMa99: (number | null)[];
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
  queryMa99: (number | null)[];
  queryMa99Gap: Ma99Gap | null;
}

export interface DayStats {
  label: string;
  highest: { price: number; pct: number; time: string };
  lowest: { price: number; pct: number; time: string };
}
