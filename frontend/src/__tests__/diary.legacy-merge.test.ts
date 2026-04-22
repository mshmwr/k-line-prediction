import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DiaryJsonSchema } from '../types/diary'

// AC-024-LEGACY-MERGE — at most 1 entry with ticketId key absent.
// Required shape per design §3.4 + PM ruling:
//   title: "Early project phases and deployment setup"
//   date: "2026-04-16"
//   text: 50–100 words
//   ticketId key absent (not empty string, not null, not undefined)

const diaryJsonPath = path.join(__dirname, '../../public/diary.json')
const diaryRaw = JSON.parse(readFileSync(diaryJsonPath, 'utf-8')) as unknown[]

describe('AC-024-LEGACY-MERGE — legacy entry constraints', () => {
  it('exactly one entry lacks a ticketId key', () => {
    const noTicketId = diaryRaw.filter((e) => {
      return typeof e === 'object' && e !== null && !('ticketId' in e)
    })
    expect(noTicketId).toHaveLength(1)
  })

  it('legacy entry title equals the PM-locked literal', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.find((e) => e.ticketId === undefined)
    expect(legacy).toBeDefined()
    expect(legacy!.title).toBe('Early project phases and deployment setup')
  })

  it('legacy entry date equals the PM-locked literal 2026-04-16', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.find((e) => e.ticketId === undefined)
    expect(legacy!.date).toBe('2026-04-16')
  })

  it('legacy entry text word count is within 50–100', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    const legacy = entries.find((e) => e.ticketId === undefined)
    const words = legacy!.text.trim().split(/\s+/).filter(Boolean).length
    expect(words).toBeGreaterThanOrEqual(50)
    expect(words).toBeLessThanOrEqual(100)
  })

  it('legacy entry stores ticketId as key-absent (not "", null, or undefined explicit)', () => {
    // Key-absent check at raw JSON level (post-parse, undefined survives).
    const legacyRaw = (diaryRaw as Array<Record<string, unknown>>).find(
      (e) => !('ticketId' in e),
    )
    expect(legacyRaw).toBeDefined()
    // Belt-and-suspenders: no ticketId property at all
    expect(Object.prototype.hasOwnProperty.call(legacyRaw, 'ticketId')).toBe(false)
  })
})
