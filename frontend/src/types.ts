// frontend/src/types.ts
export interface OHLCRow {
  open: string;
  high: string;
  low: string;
  close: string;
  time: string;
}

export interface OhlcBar {
  open: number;
  high: number;
  low: number;
  close: number;
  time?: string;
}

export interface Ma99Gap {
  fromDate: string;
  toDate: string;
}

export interface MatchCase {
  id: string;
  correlation: number;
  historicalOhlc: OhlcBar[];
  futureOhlc: OhlcBar[];
  historicalOhlc1d: OhlcBar[];
  futureOhlc1d: OhlcBar[];
  startDate: string;
  endDate: string;
  historicalMa99: (number | null)[];
  futureMa99: (number | null)[];
  historicalMa991d: (number | null)[];
  futureMa991d: (number | null)[];
}

export interface OrderSuggestion {
  label: string;
  price: number;
  pct: number;
  occurrenceBar: number;
  occurrenceWindow: string;
  historicalTime: string;
}

export interface ForecastBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PredictStats {
  highest: OrderSuggestion;
  secondHighest: OrderSuggestion;
  secondLowest: OrderSuggestion;
  lowest: OrderSuggestion;
  winRate: number;
  meanCorrelation: number;
  consensusForecast1h: ForecastBar[];
  consensusForecast1d: ForecastBar[];
}

export interface PredictResponse {
  matches: MatchCase[];
  stats: PredictStats;
  queryMa991h: (number | null)[];
  queryMa991d: (number | null)[];
  queryMa99Gap1h: Ma99Gap | null;
  queryMa99Gap1d: Ma99Gap | null;
}

export interface DayStats {
  label: string;
  highest: { price: number; pct: number; time: string };
  lowest: { price: number; pct: number; time: string };
}
