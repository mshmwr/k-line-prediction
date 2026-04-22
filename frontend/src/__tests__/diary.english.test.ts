import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DiaryJsonSchema } from '../types/diary'

// AC-024-ENGLISH — all title + text strings have zero CJK characters.
//
// CJK unicode ranges covered:
//   一-鿿     CJK Unified Ideographs
//   㐀-䶿     CJK Unified Ideographs Extension A
//   ぀-ゟ     Hiragana
//   ゠-ヿ     Katakana
//   ＀-￯     Fullwidth forms (includes fullwidth punctuation often used in zh text)
//   　-〿     CJK punctuation (。、「」etc.)

const CJK_REGEX = /[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]/

const diaryJsonPath = path.join(__dirname, '../../public/diary.json')
const diaryRaw = JSON.parse(readFileSync(diaryJsonPath, 'utf-8'))

describe('AC-024-ENGLISH — diary.json has no CJK characters', () => {
  it('diary.json parses into DiaryEntry[]', () => {
    const parsed = DiaryJsonSchema.safeParse(diaryRaw)
    expect(parsed.success).toBe(true)
  })

  it('every entry title has no CJK character', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    for (const e of entries) {
      const hit = e.title.match(CJK_REGEX)
      expect(hit, `CJK found in title "${e.title}" at char "${hit?.[0]}"`).toBeNull()
    }
  })

  it('every entry text has no CJK character', () => {
    const entries = DiaryJsonSchema.parse(diaryRaw)
    for (const e of entries) {
      const hit = e.text.match(CJK_REGEX)
      expect(hit, `CJK found in text (date=${e.date}) at char "${hit?.[0]}"`).toBeNull()
    }
  })
})
