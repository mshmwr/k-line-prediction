import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseOfficialCsvFile } from '../utils/officialCsvParsing'

/**
 * AC-046-PHASE2-EXAMPLE-PARSE — parse-layer coverage for the committed example
 * CSV fixture at `frontend/public/examples/ETHUSDT_1h_test.csv`.
 *
 * Why parse-layer (not endpoint-layer): `/api/upload-history` is post-K-046
 * Phase 1 neutralized; its response has zero discriminatory power against a
 * broken fixture (response is computed from authoritative `existing` state,
 * not uploaded bytes). Unit-testing `parseOfficialCsvFile` is the layer
 * strictly upstream of the neutralized endpoint — see ticket B4 / Action 5
 * "neutralize-masked invariant" for methodology.
 *
 * Cross-reference monitor (K-046 Phase 2e Reviewer I-1): this row-count=24
 * invariant pairs with backend/tests/test_main.py::test_upload_example_csv_fixture_round_trip
 * (byte-count=3926 invariant). Both must stay green; either flipping red
 * signals fixture drift that needs coordinated update on both sides.
 */

describe('parseOfficialCsvFile — example CSV fixture', () => {
  it('AC-046-PHASE2-EXAMPLE-PARSE — parses 24 rows cleanly', () => {
    const csvPath = path.resolve(__dirname, '../../public/examples/ETHUSDT_1h_test.csv')
    const text = fs.readFileSync(csvPath, 'utf-8')
    const rows = parseOfficialCsvFile(text, 'ETHUSDT_1h_test.csv')

    expect(rows).toHaveLength(24)

    for (const row of rows) {
      expect(typeof row.time).toBe('string')
      expect(row.time.length).toBeGreaterThan(0)
      expect(typeof row.open).toBe('string')
      expect(typeof row.high).toBe('string')
      expect(typeof row.low).toBe('string')
      expect(typeof row.close).toBe('string')
      expect(Number.isFinite(Number(row.open))).toBe(true)
      expect(Number.isFinite(Number(row.high))).toBe(true)
      expect(Number.isFinite(Number(row.low))).toBe(true)
      expect(Number.isFinite(Number(row.close))).toBe(true)
    }
  })
})
