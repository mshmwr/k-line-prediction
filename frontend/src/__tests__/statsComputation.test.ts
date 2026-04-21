import { describe, it, expect } from 'vitest'
import { MatchCase, OhlcBar } from '../types'
import {
  computeStatsFromMatches,
  snakeStatsToCamel,
  snakeSuggestionToCamel,
  SnakePredictStats,
} from '../utils/statsComputation'
import fixtures from '../../../backend/tests/fixtures/stats_contract_cases.json'

// Contract fixture — shared with backend/tests/test_predictor.py contract block.
// See docs/designs/K-013-consensus-stats-ssot.md §2 and §3 for the JSON schema
// and the snake_case ↔ camelCase mapping. Changes to either side require
// regenerating the fixture via
//   cd backend && python3 tests/fixtures/generate_stats_contract_cases.py

type SnakeOhlcBar = {
  open: number
  high: number
  low: number
  close: number
  time?: string
}

type SnakeMatch = {
  id: string
  correlation: number
  historical_ohlc: SnakeOhlcBar[]
  future_ohlc: SnakeOhlcBar[]
  historical_ohlc_1d: SnakeOhlcBar[]
  future_ohlc_1d: SnakeOhlcBar[]
  start_date: string
  end_date: string
  historical_ma99: (number | null)[]
  future_ma99: (number | null)[]
  historical_ma99_1d: (number | null)[]
  future_ma99_1d: (number | null)[]
}

type ContractCase = {
  name: string
  description: string
  input: {
    matches: SnakeMatch[]
    current_close: number
    timeframe: '1H' | '1D'
  }
  expected: SnakePredictStats
}

function bar(raw: SnakeOhlcBar): OhlcBar {
  return {
    open: raw.open,
    high: raw.high,
    low: raw.low,
    close: raw.close,
    time: raw.time ?? '',
  }
}

function matchToCamel(raw: SnakeMatch): MatchCase {
  return {
    id: raw.id,
    correlation: raw.correlation,
    historicalOhlc: raw.historical_ohlc.map(bar),
    futureOhlc: raw.future_ohlc.map(bar),
    historicalOhlc1d: raw.historical_ohlc_1d.map(bar),
    futureOhlc1d: raw.future_ohlc_1d.map(bar),
    startDate: raw.start_date,
    endDate: raw.end_date,
    historicalMa99: raw.historical_ma99,
    futureMa99: raw.future_ma99,
    historicalMa991d: raw.historical_ma99_1d,
    futureMa991d: raw.future_ma99_1d,
  }
}

const TOLERANCE_DECIMALS = 6

const cases = fixtures as unknown as ContractCase[]

describe('computeStatsFromMatches — contract parity with backend compute_stats', () => {
  it('fixture sanity: at least one case loaded', () => {
    expect(cases.length).toBeGreaterThan(0)
  })

  cases.forEach(testCase => {
    it(`[${testCase.name}] matches backend expected within 1e-6`, () => {
      const matches = testCase.input.matches.map(matchToCamel)
      const { stats } = computeStatsFromMatches(
        matches,
        testCase.input.current_close,
        testCase.input.timeframe,
      )
      const expectedCamel = snakeStatsToCamel(testCase.expected)

      // Compare OrderSuggestion bucket-by-bucket — isolates failures per bucket.
      const buckets = ['highest', 'secondHighest', 'secondLowest', 'lowest'] as const
      buckets.forEach(bucket => {
        expect(stats[bucket].label).toBe(expectedCamel[bucket].label)
        expect(stats[bucket].price).toBeCloseTo(expectedCamel[bucket].price, TOLERANCE_DECIMALS)
        expect(stats[bucket].pct).toBeCloseTo(expectedCamel[bucket].pct, TOLERANCE_DECIMALS)
        expect(stats[bucket].occurrenceBar).toBe(expectedCamel[bucket].occurrenceBar)
        expect(stats[bucket].occurrenceWindow).toBe(expectedCamel[bucket].occurrenceWindow)
        expect(stats[bucket].historicalTime).toBe(expectedCamel[bucket].historicalTime)
      })

      expect(stats.winRate).toBeCloseTo(expectedCamel.winRate, TOLERANCE_DECIMALS)
      expect(stats.meanCorrelation).toBeCloseTo(
        expectedCamel.meanCorrelation,
        TOLERANCE_DECIMALS,
      )
    })
  })
})

describe('computeStatsFromMatches — error contract', () => {
  it('throws when matches is empty', () => {
    expect(() => computeStatsFromMatches([], 2100, '1H')).toThrow(
      /at least one match/i,
    )
  })

  it('throws when currentClose is zero or negative', () => {
    const matches = cases[0].input.matches.map(matchToCamel)
    expect(() => computeStatsFromMatches(matches, 0, '1H')).toThrow(
      /positive finite number/i,
    )
    expect(() => computeStatsFromMatches(matches, -1, '1H')).toThrow(
      /positive finite number/i,
    )
  })

  it('throws when projectedFutureBars < 2 (single future bar edge)', () => {
    // Hand-craft a single-match / single-future-bar case — cannot come from
    // the shared fixture because the fixture requires >= 2 future bars.
    const singleBarMatch: MatchCase = {
      id: 'single',
      correlation: 0.9,
      historicalOhlc: [{ open: 2000, high: 2000, low: 2000, close: 2000, time: '' }],
      futureOhlc: [{ open: 2010, high: 2020, low: 2005, close: 2015, time: '' }],
      historicalOhlc1d: [],
      futureOhlc1d: [],
      startDate: '',
      endDate: '',
      historicalMa99: [],
      futureMa99: [],
      historicalMa991d: [],
      futureMa991d: [],
    }
    expect(() => computeStatsFromMatches([singleBarMatch], 2100, '1H')).toThrow(
      /at least two future bars/i,
    )
  })
})

describe('snake_case → camelCase key mapping', () => {
  it('snakeSuggestionToCamel maps all fields including numeric-adjacent keys', () => {
    const raw = {
      label: 'Highest',
      price: 1234.56,
      pct: 7.89,
      occurrence_bar: 3,
      occurrence_window: 'Hour +3',
      historical_time: 'Consensus',
    }
    const camel = snakeSuggestionToCamel(raw)
    expect(camel.occurrenceBar).toBe(3)
    expect(camel.occurrenceWindow).toBe('Hour +3')
    expect(camel.historicalTime).toBe('Consensus')
  })

  it('snakeStatsToCamel passes win_rate / mean_correlation through correctly', () => {
    const raw = cases[0].expected
    const camel = snakeStatsToCamel(raw)
    expect(camel.winRate).toBe(raw.win_rate)
    expect(camel.meanCorrelation).toBe(raw.mean_correlation)
  })
})
