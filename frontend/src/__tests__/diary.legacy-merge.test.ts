import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DiaryJsonSchema } from '../types/diary'

// AC-024-LEGACY-MERGE — legacy entry pinned by title literal; other PM-level key-absent entries permitted.
// Required shape per design §3.4 + PM ruling:
//   title: "Early project phases and deployment setup"
//   date: "2026-04-16"
//   text: 50–100 words
//   ticketId key absent (not empty string, not null, not undefined)

const LEGACY_TITLE = 'Early project phases and deployment setup'

const diaryJsonPath = path.join(__dirname, '../../public/diary.json')
const diaryRaw = JSON.parse(readFileSync(diaryJsonPath, 'utf-8')) as unknown[]

describe('AC-024-LEGACY-MERGE — legacy entry constraints', () => {
  it('exactly one entry has the PM-locked legacy title', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.filter((e) => e.title === LEGACY_TITLE)
    expect(legacy).toHaveLength(1)
  })

  it('legacy entry title equals the PM-locked literal', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.find((e) => e.title === LEGACY_TITLE)
    expect(legacy).toBeDefined()
    expect(legacy!.title).toBe(LEGACY_TITLE)
  })

  it('legacy entry date equals the PM-locked literal 2026-04-16', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.find((e) => e.title === LEGACY_TITLE)
    expect(legacy!.date).toBe('2026-04-16')
  })

  it('legacy entry text word count is within 50–100', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.find((e) => e.title === LEGACY_TITLE)
    const words = legacy!.text.trim().split(/\s+/).filter(Boolean).length
    expect(words).toBeGreaterThanOrEqual(50)
    expect(words).toBeLessThanOrEqual(100)
  })

  it('legacy entry stores ticketId as key-absent (not "", null, or undefined explicit)', () => {
    // Find by title literal at raw JSON level, then assert key absence.
    const legacyRaw = (diaryRaw as Array<Record<string, unknown>>).find(
      (e) => e.title === LEGACY_TITLE,
    )
    expect(legacyRaw).toBeDefined()
    // Belt-and-suspenders: no ticketId property at all
    expect(Object.prototype.hasOwnProperty.call(legacyRaw, 'ticketId')).toBe(false)
  })

  it('non-legacy key-absent entries are permitted (PM-level milestones)', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const keyAbsent = (diaryRaw as Array<Record<string, unknown>>).filter(
      (e) => !('ticketId' in e),
    )
    const legacyCount = keyAbsent.filter(
      (e) => e.title === LEGACY_TITLE,
    ).length
    expect(legacyCount).toBe(1)
    // others permitted; no upper bound on non-legacy key-absent entries
    expect(entries.length).toBeGreaterThan(0)
  })
})
