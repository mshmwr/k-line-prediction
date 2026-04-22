import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DiaryEntrySchema, DiaryJsonSchema } from '../types/diary'

// AC-024-SCHEMA — flat array { ticketId?, title, date, text }.
// zod .strict() rejects extra keys.

const diaryJsonPath = path.join(__dirname, '../../public/diary.json')
const diaryRaw = JSON.parse(readFileSync(diaryJsonPath, 'utf-8'))

describe('AC-024-SCHEMA — diary.json zod validation', () => {
  it('production diary.json parses via DiaryJsonSchema', () => {
    const result = DiaryJsonSchema.safeParse(diaryRaw)
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('accepts entry with ticketId matching /^K-\\d{3}$/', () => {
    const parsed = DiaryEntrySchema.safeParse({
      ticketId: 'K-024',
      title: 'some title',
      date: '2026-04-22',
      text: 'some text',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts entry with ticketId key absent (legacy-merge shape)', () => {
    const parsed = DiaryEntrySchema.safeParse({
      title: 'Legacy',
      date: '2026-04-16',
      text: 'text',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects ticketId empty string', () => {
    const parsed = DiaryEntrySchema.safeParse({
      ticketId: '',
      title: 'x',
      date: '2026-04-22',
      text: 't',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects ticketId with wrong format', () => {
    const parsed = DiaryEntrySchema.safeParse({
      ticketId: 'K-1',
      title: 'x',
      date: '2026-04-22',
      text: 't',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects missing title', () => {
    const parsed = DiaryEntrySchema.safeParse({
      date: '2026-04-22',
      text: 't',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects empty title (after trim)', () => {
    const parsed = DiaryEntrySchema.safeParse({
      title: '   ',
      date: '2026-04-22',
      text: 't',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects non-YYYY-MM-DD date', () => {
    const parsed = DiaryEntrySchema.safeParse({
      title: 'x',
      date: '04/22/2026',
      text: 't',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects calendar-invalid date (2026-02-30)', () => {
    const parsed = DiaryEntrySchema.safeParse({
      title: 'x',
      date: '2026-02-30',
      text: 't',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects extra keys (strict mode)', () => {
    const parsed = DiaryEntrySchema.safeParse({
      ticketId: 'K-001',
      title: 'x',
      date: '2026-04-22',
      text: 't',
      extra: 'not allowed',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects empty text', () => {
    const parsed = DiaryEntrySchema.safeParse({
      title: 'x',
      date: '2026-04-22',
      text: '',
    })
    expect(parsed.success).toBe(false)
  })

  it('top-level must be an array', () => {
    const parsed = DiaryJsonSchema.safeParse({ not: 'an array' })
    expect(parsed.success).toBe(false)
  })
})
