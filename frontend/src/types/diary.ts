import { z } from 'zod'

// K-024 Phase 1 — flat schema. Replaces old nested DiaryMilestone + DiaryItem.
// Source of truth: docs/designs/K-024-diary-structure.md §3.1 + §3.2
// + AC-024-SCHEMA / AC-024-ENGLISH / AC-024-LEGACY-MERGE.

const K_ID_REGEX = /^K-\d{3}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const DiaryEntrySchema = z
  .object({
    // Optional K-ID prefix; when present must match /^K-\d{3}$/.
    // Empty string is invalid (regex rejects ""). Legacy-merge entry omits key entirely.
    ticketId: z.string().regex(K_ID_REGEX).optional(),
    title: z.string().trim().min(1),
    date: z
      .string()
      .regex(DATE_REGEX)
      .refine(
        (d) => {
          // Calendar-valid check: reject 2026-02-30 etc.
          const parsed = new Date(d)
          if (Number.isNaN(parsed.getTime())) return false
          return parsed.toISOString().slice(0, 10) === d
        },
        { message: 'invalid calendar date' },
      ),
    text: z.string().trim().min(1),
  })
  .strict() // AC-024-SCHEMA: reject any extra keys

export const DiaryJsonSchema = z.array(DiaryEntrySchema)

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>
export type DiaryJson = z.infer<typeof DiaryJsonSchema>
