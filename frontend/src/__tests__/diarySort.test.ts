import { describe, it, expect } from 'vitest'
import { sortDiary } from '../utils/diarySort'
import type { DiaryEntry } from '../types/diary'

// Contract per design §3.5:
//   Primary: date desc
//   Tie-break: original array-index desc (later-in-array = newer)

function mk(ticketId: string, date: string, title = 't'): DiaryEntry {
  return { ticketId, date, title, text: 'x' }
}

describe('sortDiary — AC-024-HOMEPAGE-CURATION + AC-024-DIARY-PAGE-CURATION tie-break', () => {
  it('returns a new array (does not mutate input)', () => {
    const input = [mk('K-001', '2026-04-01'), mk('K-002', '2026-04-02')]
    const out = sortDiary(input)
    expect(out).not.toBe(input)
    expect(input.map((e) => e.ticketId)).toEqual(['K-001', 'K-002'])
  })

  it('empty array returns empty', () => {
    expect(sortDiary([])).toEqual([])
  })

  it('single-entry passes through', () => {
    const out = sortDiary([mk('K-005', '2026-04-15')])
    expect(out).toHaveLength(1)
    expect(out[0].ticketId).toBe('K-005')
  })

  it('sorts distinct dates descending', () => {
    const input = [
      mk('K-A', '2026-04-10'),
      mk('K-B', '2026-04-20'),
      mk('K-C', '2026-04-15'),
    ]
    const out = sortDiary(input)
    expect(out.map((e) => e.ticketId)).toEqual(['K-B', 'K-C', 'K-A'])
  })

  it('tie-break: same date — later array index is newer (2 entries)', () => {
    // Input order: earlier (idx 0), later (idx 1). Both same date.
    const input = [mk('K-1', '2026-04-20'), mk('K-2', '2026-04-20')]
    const out = sortDiary(input)
    expect(out.map((e) => e.ticketId)).toEqual(['K-2', 'K-1']) // later idx first
  })

  it('tie-break: same date — 3 entries, descending by array index', () => {
    const input = [
      mk('K-1', '2026-04-20'),
      mk('K-2', '2026-04-20'),
      mk('K-3', '2026-04-20'),
    ]
    const out = sortDiary(input)
    expect(out.map((e) => e.ticketId)).toEqual(['K-3', 'K-2', 'K-1'])
  })

  it('mixed: date primary desc, array-index tie-break', () => {
    const input = [
      mk('K-A', '2026-04-15'), // idx 0
      mk('K-B', '2026-04-20'), // idx 1
      mk('K-C', '2026-04-20'), // idx 2 — newer than K-B on tie
      mk('K-D', '2026-04-10'), // idx 3
    ]
    const out = sortDiary(input)
    expect(out.map((e) => e.ticketId)).toEqual(['K-C', 'K-B', 'K-A', 'K-D'])
  })
})
