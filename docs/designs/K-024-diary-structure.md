---
id: K-024-design
title: /diary structure rework + diary.json schema flattening — system design
ticket: K-024
author: senior-architect
created: 2026-04-22
status: ready-for-engineer
visual-spec: docs/designs/K-024-visual-spec.json
depends-on:
  - K-021 (closed, base for paper palette + three-font system + NavBar)
  - QA Early Consultation R1 (commit e2b6fe5, 11 AC supplemented)
inherits-from:
  - K-027 §6 (mobile breakpoint + 5 items — each explicitly evaluated below, §5)
---

## 0 Pre-Design Audit

### 0.1 Files inspected (`git show main:<path>` + on-disk confirmed)

| File | Inspected range | Dry-run verified? | Notes |
|------|-----------------|-------------------|-------|
| `frontend/public/diary.json` | full (16 milestones / 28 items, `{ milestone, items[] }` shape) | yes (counted, schema confirmed old-shape) | All Phase 1 migration inputs |
| `frontend/src/types/diary.ts` | L1–9 (`DiaryItem` / `DiaryMilestone`) | yes | Old type definitions to replace |
| `frontend/src/hooks/useDiary.ts` | L1–54 | yes — traced `limit` branching: `undefined → all`, `0 → []`, `N → data.slice(0, N)` | Consumes old-shape array; needs reshape |
| `frontend/src/pages/DiaryPage.tsx` | L1–31 `git show main:...` | yes — renders `<DiaryTimeline milestones>` which still uses accordion | Phase 3 primary rewrite target |
| `frontend/src/components/diary/DiaryTimeline.tsx` | full 17 lines | yes | Will be deleted or wholly rewritten |
| `frontend/src/components/diary/MilestoneSection.tsx` | full 33 lines | yes — confirmed K-027 classes present: `mb-4 sm:mb-3`, `overflow-hidden` | Delete in Phase 3 (accordion removed per AC-024-TIMELINE-STRUCTURE) |
| `frontend/src/components/diary/DiaryEntry.tsx` | full 15 lines | yes — confirmed K-027 classes: `flex-col sm:flex-row`, `w-auto sm:w-24`, `break-words` | Delete in Phase 3 (replaced by new flat entry component) |
| `frontend/src/components/home/DevDiarySection.tsx` | full 114 lines `git show main:...` | yes — traced rail `top:40 / bottom:40`, marker `20×14 bg-brick-dark`, `m.items[0]` singleton read | K-023 + K-028 contracts; rework needed to consume flat schema |
| `frontend/src/pages/HomePage.tsx` | full 28 lines | yes — confirmed `useDiary(3)` call site | Propagates new flat schema to DevDiarySection |
| `frontend/src/components/common/LoadingSpinner.tsx` | full 16 lines | yes — `role="status"` + `aria-label` + `bg-[#0D1117]` dark-theme residue | Phase 3 Loading component structure; needs isolation for `data-testid="diary-loading"` |
| `frontend/src/components/common/ErrorMessage.tsx` | full 21 lines | yes — text-red-400, conditional Retry button, text `"Retry"` literal | Phase 3 Error component structure; needs `data-testid="diary-error"` + canonical error literal |
| `frontend/e2e/pages.spec.ts` | L78–121 (AC-DIARY-1 three tests) | yes — old locator `.px-4.pb-4 p` + `getByRole('button').first()` aria-expanded accordion asserts | AC-024-REGRESSION allowed-to-change — rewrite after Phase 3 |
| `frontend/e2e/diary-mobile.spec.ts` | full 353 lines (grep'd test IDs + viewport list) | yes — TC-001~006 target `.border.border-ink\/10.rounded-sm` (MilestoneSection wrapper) | Entire suite targets removed DOM; delete in Phase 3 or rewrite after flat structure lands (see §7) |
| `frontend/e2e/pages.spec.ts` | L167–215 (AC-023-DIARY-BULLET marker width/height/color/radius) | yes | Sacred — must still pass on Homepage 3-entry curation |
| `frontend/e2e/pages.spec.ts` | L383–432 (AC-028 marker count integrity) | yes | Sacred — must still pass on Homepage 3-entry curation |
| `docs/designs/K-024-visual-spec.json` | full | yes — 2 frames × 10 roles | SSOT |
| `docs/designs/VISUAL-SPEC-SCHEMA.md` | full | yes | Consumer protocol for Architect |
| `docs/designs/K-027-mobile-diary-layout.md` | §6 + full read | yes — 5 inheritance items | §5 K-027 inheritance table below |
| `frontend/package.json` | `"zod"` grep | yes — NOT installed (`npm ls zod → empty`) | Phase 1 includes `npm install zod` step |
| `docs/retrospectives/architect.md` | top 10 entries | yes | K-027 drift / K-013 dry-run / K-017 cross-page audit / K-021 Pre-Verdict + Scope Question Pause |

### 0.2 `pre-existing` / `既存行為` claim verification

No "pre-existing" or "既存行為" claim is made in this design doc that asserts OLD code behavior survives unchanged. The entire Phase 3 rewrites `DiaryPage` / `DiaryTimeline` / creates new `DiaryEntry-v2` / `DiaryRail` / `DiaryMarker` primitives. The DevDiarySection changes are explicitly "reshape to consume flat schema" — not "pre-existing behavior preserved".

The only pre-existing contracts held invariant:
1. **Homepage marker shape (20×14px, `#9C4A3B`, `borderRadius: 0px`)** — locked by K-023 AC-023-DIARY-BULLET, verified by `git show main:frontend/src/components/home/DevDiarySection.tsx` L79–83 `bg-brick-dark` + `w-5 h-3.5` + no `rounded-*` class
2. **Homepage rail `top:40 / bottom:40` inset** — locked by K-028, verified by same file L66–68 `style={{ left: 29, top: 40, bottom: 40 }}`
3. **K-017/021 NavBar + Footer visibility on `/diary`** — no footer on `/diary`, locked by `pages.spec.ts` L158–164; this design does not introduce a footer

All three are asserted against `git show main:...` output, not just HEAD Read.

### 0.3 Dry-run truth table — `useDiary(limit)` behavior (Phase 2 preparation)

OLD (main): returns `DiaryMilestone[]` (nested shape).
NEW (Phase 2): returns `DiaryEntry[]` (flat shape, sorted).

| Input | OLD result | NEW result | Verified against |
|-------|-----------|-----------|------------------|
| `useDiary()` (limit=undefined), diary.json=[16 milestones] | `[m1..m16]` (16 items) | `[e1..eN]` sorted by `date desc, index desc` (N = all flat entries; see §2.1 schema spec) | useDiary.ts L39 `limit !== undefined ? slice : data` |
| `useDiary(3)` | `[m1..m3]` | `[e1..e3]` (3 newest by date, array-index tie-break) | useDiary.ts L39 slice |
| `useDiary(0)` | `[]` | `[]` | useDiary.ts L39 `limit === 0 ? [] : ...` |
| `useDiary()` on empty diary.json | `[]` | `[]` | same |
| `useDiary(5)` on diary.json with 2 entries | `[e1, e2]` (only 2 — no padding) | `[e1, e2]` (only 2) | slice(0, 5) caps at array length |

No OLD → NEW observable breakage at the `useDiary` signature level — the schema migration (Phase 1 one-shot) means the data shape changes under the hook in one atomic commit; hook signature stays identical (`{ entries, loading, error, refetch }`). Consumers (`HomePage`, `DiaryPage`) get the new shape immediately.

---

## 1 Blocking Questions (BQ) — to PM

**BQ-024-01 RESOLVED 2026-04-22** — PM ruled Option (b): rename K-024 AC literal `homepage-diary-entry` → `diary-entry-wrapper` (reuse K-028 Sacred). Ticket already edited by PM (lines 184 / 195 / 401); design doc §6.4 updated accordingly. Sacred immutability preserved, no second DOM attribute, Phase 2 unblocked. Full rationale: `docs/tickets/K-024-diary-structure-and-schema.md` §放行狀態 PM 裁決紀錄 block + §6.4 above + §20 retrospective below.

No other blocking questions. All 11 AC (post-R1 supplementation + PM 2026-04-22 ruling) have sufficient contract detail for Architect to produce a complete design. AC-024-LOADING-ERROR-PRESERVED is DEFERRED awaiting this design doc's §3.4 — it becomes a BQ *reopen* target (QA Round 2) rather than a design-blocker (PM already ruled in ticket §放行狀態 that Round 2 happens after this design).

No AC text errors found vs visual-spec.json cross-check — QA R1 already fixed PRD L385 em-dash drift and ticket already cites JSON roles for all CSS properties. No ticket-AC-vs-codebase path mismatch (no `/login`-style missing route).

**Known untestable-by-Playwright DoD item (not a BQ, just forwarded):** `AC-024-PM-PERSONA-SYNC` is already demoted to `## 放行狀態` DoD checklist by PM on 2026-04-22 (ticket L357–362). Architect does not process it.

---

## 2 Phase Overview

| Phase | Scope | File class | Gate (per `~/.claude/CLAUDE.md` file-class table) | Rough size |
|-------|-------|-----------|--------------------------------------------------|-----------|
| **Phase 1** | diary.json schema flatten + zod schema + 3 Vitest spec files (AC-024-SCHEMA / AC-024-ENGLISH / AC-024-LEGACY-MERGE) + TS type shift | `frontend/public/diary.json` (runtime-read) + `frontend/src/types/diary.ts` (runtime TS) + `frontend/src/__tests__/diary.schema.test.ts` (new) + `frontend/package.json` (+zod) | **Full** (tsc + Vitest + Playwright DiaryPage subset) | **L** (~500–700 LOC delta across data + types + tests) |
| **Phase 2** | Frontend curation (Homepage 3-entry + /diary default-5 + Load more + sort/tie-break + consume flat schema) — `useDiary` reshape, DevDiarySection reshape, new `useDiaryPagination` hook | `frontend/src/hooks/useDiary.ts`, `frontend/src/hooks/useDiaryPagination.ts` (new), `frontend/src/components/home/DevDiarySection.tsx` | **Full** | **M** (~200–300 LOC) |
| **Phase 3** | /diary page visual rework (Hero + rail + marker + 3-layer entries + Load more button + loading/error `data-testid` contract) + mobile layout + delete old components + rewrite E2E | `frontend/src/pages/DiaryPage.tsx`, `frontend/src/components/diary/*` (delete old, add new), `frontend/e2e/*.spec.ts` (new + rewrite) | **Full** | **L** (~800–1200 LOC net, accounting for deletes) |
| **Phase 4** | PM persona one-line edit on close | `~/.claude/agents/pm.md` (not runtime) | **No gate** (project-external file; DoD checklist per ticket `## 放行狀態`) | **S** (1 string replace) |

**Phase ordering rationale (hard):**
- Phase 1 must land before Phase 2: Phase 2 consumes the new flat schema type
- Phase 2 must land before Phase 3's `/diary` rewrite: the page depends on `useDiaryPagination`
- Phase 3 may split into **3a** (page structure + visual) and **3b** (E2E rewrite) if PR size becomes a review burden — Engineer's call, not mandatory
- Phase 4 is PM-only on ticket close; independent

**What CANNOT be parallelized:**
- Phase 1 schema change must complete before Phase 2 touches `useDiary` (type errors would cascade)

**What MAY be parallelized within Phase 3:**
- (3a) new component files (DiaryHero, DiaryTimeline-v2, DiaryEntry-v2, DiaryRail, DiaryMarker, LoadMoreButton) can be built in parallel once Phase 2 lands
- (3b) E2E rewrite requires new DOM to run against, so it follows 3a

---

## 3 Phase 1 — diary.json schema flattening (data layer)

### 3.1 New schema (source of truth: ticket L50–66 + AC-024-SCHEMA L133–146)

```ts
// NEW frontend/src/types/diary.ts
export interface DiaryEntry {
  ticketId?: string     // optional; if present, matches /^K-\d{3}$/
  title: string         // required, non-empty (.length > 0 after trim)
  date: string          // required, YYYY-MM-DD, must be calendar-valid
  text: string          // required, non-empty
}

export type DiaryJson = DiaryEntry[]   // top-level JSON = array
```

**Deletion:** `DiaryItem` and `DiaryMilestone` types are removed. Any file importing them must switch to `DiaryEntry`.

### 3.2 zod schema — `frontend/src/types/diary.ts` same file append

```ts
import { z } from 'zod'

const K_ID_REGEX = /^K-\d{3}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const DiaryEntrySchema = z
  .object({
    ticketId: z.string().regex(K_ID_REGEX).optional(),  // empty string invalid (regex rejects "")
    title: z.string().trim().min(1),
    date: z
      .string()
      .regex(DATE_REGEX)
      .refine(
        (d) => new Date(d).toISOString().slice(0, 10) === d,
        { message: 'invalid calendar date' },
      ),
    text: z.string().trim().min(1),
  })
  .strict()  // .strict() → any extra key fails parse (AC-024-SCHEMA 禁 extra keys)

export const DiaryJsonSchema = z.array(DiaryEntrySchema)
```

**Dependency:** `npm install zod` in `frontend/`. **Verified 2026-04-22:** zod is NOT currently installed (`npm ls zod` → empty). Engineer adds `"zod": "^3.x"` to `frontend/package.json`.

### 3.3 Migration strategy — **one-shot, no dual-schema transition**

**Decision: one-shot migration (Phase 1 single PR).**

Options considered:

| Option | Pros | Cons |
|--------|------|------|
| **A. One-shot** | Atomic; no cross-phase type churn; no dual-schema runtime branch | Must commit translated English content + merged legacy entry in same PR |
| B. Dual-schema transition | Incremental | Requires `type: "legacy" | "flat"` discriminator on useDiary; 2× consumer code paths; regression risk doubles; TD-K030-04 (zh entries) blocks any gradual migration anyway |
| C. Separate data-shape PR from content-translation PR | Content review easier | Impossible — AC-024-ENGLISH requires zero CJK; leaving Chinese entries under new shape would fail zod test before content PR lands |

**Recommendation: A.** Translation + shape-flatten + legacy-merge happens in one atomic Phase 1 PR. The AC block fully constrains the shape (AC-024-SCHEMA) AND the content (AC-024-ENGLISH, AC-024-LEGACY-MERGE), so partial migration would land a file that fails AC anyway.

### 3.4 Translation + legacy-merge concrete rules

**Translation (AC-024-ENGLISH):**
- Preserve intent, not literal word-for-word; keep K-Line technical terms as-is (`MA99`, `OHLC`, `Pearson`, `JWT`, `UTC+0`)
- Collapse multi-sentence Chinese `text` into one concise English sentence (per `~/.claude/CLAUDE.md` Daily Diary Style: one sentence per sub-item)
- Preserve specific identifiers (K-IDs, commit SHAs, metric numbers) verbatim
- Engineer must run AC-024-ENGLISH zod test after translation — any CJK hit = failing spec = unblock required

**Legacy merge (AC-024-LEGACY-MERGE):**
- Old milestones with no `K-XXX` prefix collapse into **one** flat entry with `ticketId` key absent (not `""` empty string)
- Covered milestones: `Phase 0 — Architecture Planning + Design`, `Phase 1 — JWT Auth Endpoints`, `Phase 2 — BrowserRouter Routing + Page Shells`, `Phase 3 — Frontend Pages`, `Deployment — Firebase Hosting + Cloud Run`, `MA99 Pearson 趨勢過濾器`, `Shared 1H/1D Forecast UI`, `Early MA99 計算 + Match Trend Labels`, `K-005 — UnifiedNavBar 統一五頁導覽列` (no K-ID prefix in title after translation), `Codex Review Follow-up — K-009 / K-010 / K-011`. Actual grouping is Engineer's mechanical collapse.
- Merged entry (locked by PM ticket ruling):
  - `title: "Early project phases and deployment setup"`
  - `date: "2026-04-16"`
  - `text`: 50–100 words summarizing Phase 0–3 + Deployment + Codex Review Follow-up + MA99 / Shared Forecast / Early MA99 threads
  - `ticketId` absent (omit the key; do not set to `""`, `null`, or `undefined`)

**Suggested `text` template (Engineer may refine; 50–100 words enforced by Vitest):**

```
Foundational phases: stood up FastAPI + React monorepo with JWT-protected
business-logic endpoint, BrowserRouter SPA with five routes, and four base
pages with a shared component library (useAsyncState, LoadingSpinner,
ErrorMessage). Shipped 1H/1D forecast UI with unified UTC+0 timestamps, MA99
Pearson trend filter, early MA99 pre-compute hook for snappier UX, and per-match
trend labels. Deployed backend to Cloud Run (multi-stage Docker) and frontend
to Firebase Hosting via VITE_API_BASE_URL. Codex Review follow-up closed
K-009 (1H predict MA history bug), K-010 (Vitest testid regression), and K-011
(LoadingSpinner label prop).
```

(Word-count: ~87 — within 50–100 envelope.)

### 3.5 Sort order (must be applied BEFORE slicing in Phase 2; Phase 1 sets up)

Sorting is logically Phase 2 (consumer-layer behavior) but the **tie-break contract is defined here** so Phase 1 tests can verify sortability:

**Contract:** `sortDiary(entries: DiaryEntry[]): DiaryEntry[]` returns a new array sorted primarily by `date` descending; when two entries share a `date`, the one later in the original array (higher index) comes first (AC-024-HOMEPAGE-CURATION tie-break + AC-024-DIARY-PAGE-CURATION tie-break — "array-index later = newer").

```ts
// frontend/src/utils/diarySort.ts — NEW in Phase 1 (used by Phase 2)
export function sortDiary(entries: DiaryEntry[]): DiaryEntry[] {
  return entries
    .map((e, originalIndex) => ({ e, originalIndex }))
    .sort((a, b) => {
      if (a.e.date !== b.e.date) return a.e.date < b.e.date ? 1 : -1  // date desc
      return b.originalIndex - a.originalIndex                          // index desc
    })
    .map(({ e }) => e)
}
```

**Phase 1 Vitest covers:** schema (AC-024-SCHEMA), English-only (AC-024-ENGLISH), legacy-merge (AC-024-LEGACY-MERGE), plus sort correctness with tie-break via 3 fixture cases (date-distinct / date-tie-2 / date-tie-3).

### 3.6 Phase 1 DoD verification flow (Engineer must run, in order)

1. `npm install zod` in `frontend/`
2. Create `frontend/src/types/diary.ts` new schema + zod exports
3. Delete old `DiaryItem` / `DiaryMilestone` (tsc will cascade errors — fix them in Phase 2's consumer reshape in the same PR OR split into 1a/1b; see Phase 1 → 2 sequencing note below)
4. Rewrite `frontend/public/diary.json` to flat schema + English-only + legacy-merge
5. Create `frontend/src/utils/diarySort.ts`
6. Create `frontend/src/__tests__/diary.schema.test.ts` (zod test)
7. Create `frontend/src/__tests__/diary.english.test.ts` (regex CJK test)
8. Create `frontend/src/__tests__/diary.legacy-merge.test.ts` (word count + entry count + missing-ticketId assertion)
9. Create `frontend/src/__tests__/diarySort.test.ts`
10. `npm test` → all 4 new Vitest spec files pass
11. `npx tsc --noEmit` → exit 0
12. `/playwright` — DiaryPage.spec.ts subset passes (tolerated failure: old AC-DIARY-1 E2E expects accordion; will be rewritten in Phase 3 — Engineer adds a `test.skip` or `test.fail` marker here with comment `// K-024 Phase 3 rewrite — skipping until timeline reimplementation lands`; PM accepts this as a Phase 1 intermediate gate, re-enabled at Phase 3)

**Phase 1 → 2 sequencing note:** Because `useDiary` and `DevDiarySection` use the old `DiaryMilestone` type, `npx tsc --noEmit` at Phase 1 isolated commit WILL fail (`DiaryMilestone` deleted → consumer errors). Two options:
- (a) Bundle Phase 1 + Phase 2 into a single PR (recommended — avoids a "broken-between" commit on `k024` branch)
- (b) Keep `DiaryMilestone` type aliased to `DiaryEntry` temporarily and delete in Phase 2 (reversible, but carries ghost type)

**Recommended: (a)** — Phase 1 and Phase 2 land in one PR. PR review is organized by file-diff commit per Phase.

---

## 4 Phase 2 — Curation (frontend rendering layer)

### 4.1 `useDiary` reshape

```ts
// frontend/src/hooks/useDiary.ts — AFTER
import { useState, useEffect, useCallback } from 'react'
import { DiaryJsonSchema } from '../types/diary'
import type { DiaryEntry } from '../types/diary'
import { sortDiary } from '../utils/diarySort'

interface DiaryState {
  entries: DiaryEntry[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDiary(limit?: number): DiaryState {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiary = useCallback(() => {
    setLoading(true)
    setError(null)

    fetch('/diary.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load diary: ${res.status}`)
        return res.json()
      })
      .then((data: unknown) => {
        const parsed = DiaryJsonSchema.parse(data)   // zod validates at runtime
        const sorted = sortDiary(parsed)
        const result =
          limit === 0 ? [] : limit !== undefined ? sorted.slice(0, limit) : sorted
        setEntries(result)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [limit])

  useEffect(() => { fetchDiary() }, [fetchDiary])

  return { entries, loading, error, refetch: fetchDiary }
}
```

**Observable OLD → NEW behavior diff:**

| Caller | OLD | NEW |
|--------|-----|-----|
| `useDiary()` | returns `DiaryMilestone[]` | returns `DiaryEntry[]` (flat, sorted) |
| `useDiary(3)` | first 3 milestones | 3 newest flat entries by `(date desc, array-index desc)` |
| `useDiary(0)` | `[]` | `[]` |
| zod parse failure | N/A (no runtime schema) | `error` state set with zod message; `entries` stays `[]` |
| Empty array | `entries=[]` | `entries=[]` (identical) |

**Boundary registered by this hook:**
- Fetch 200 but malformed JSON → caught by `.catch` (JSON.parse error)
- Fetch 404 → `error` = `"Failed to load diary: 404"`
- Fetch 200 + schema violation → `error` = zod error message (string); `entries=[]`; Loading flag clears to false
- Network timeout → browser default timeout → fetch rejects → same error handling

### 4.2 New hook: `useDiaryPagination` (DiaryPage only)

```ts
// frontend/src/hooks/useDiaryPagination.ts — NEW in Phase 2
import { useCallback, useMemo, useState } from 'react'
import type { DiaryEntry } from '../types/diary'

export const DIARY_INITIAL_PAGE_SIZE = 5
export const DIARY_LOAD_MORE_STEP = 5

interface UseDiaryPaginationResult {
  visible: DiaryEntry[]
  hasMore: boolean
  loadMore: () => void
  canLoadMore: boolean         // false while a load-more click is in-flight (concurrency gate)
}

export function useDiaryPagination(all: DiaryEntry[]): UseDiaryPaginationResult {
  const [count, setCount] = useState(DIARY_INITIAL_PAGE_SIZE)
  const [inFlight, setInFlight] = useState(false)

  const visible = useMemo(() => all.slice(0, count), [all, count])
  const hasMore = count < all.length

  const loadMore = useCallback(() => {
    if (inFlight) return                    // AC-024-DIARY-PAGE-CURATION concurrency gate
    setInFlight(true)
    setCount((prev) => Math.min(prev + DIARY_LOAD_MORE_STEP, all.length))
    // Synchronous state update — release in-flight on next tick
    queueMicrotask(() => setInFlight(false))
  }, [inFlight, all.length])

  const canLoadMore = hasMore && !inFlight

  return { visible, hasMore, loadMore, canLoadMore }
}
```

**Concurrency contract (AC-024-DIARY-PAGE-CURATION rapid double-click case):**
- `loadMore` checks `inFlight` before mutating state → two rapid clicks collapse to one 5-step advance
- Button `disabled={!canLoadMore}` — React re-renders button as disabled after first click's microtask
- Playwright spec target: `await Promise.all([btn.click(), btn.click()])` yields +5 not +10 entries

### 4.3 `DevDiarySection` reshape (Homepage 3-entry + flat schema)

Consumer-side change (flat schema consumption):

**Before (main):** reads `m.milestone` (title), `m.items[0].date`, `m.items[0].text`, iterates `milestones.map`
**After:** reads `e.ticketId`, `e.title`, `e.date`, `e.text`, iterates `entries.map`

**Props interface:**

```ts
interface DevDiarySectionProps {
  entries: DiaryEntry[]    // (was: milestones: DiaryMilestone[])
  loading: boolean
  error: string | null
}
```

**DOM stays structurally identical to main HEAD** (already flex-col + `data-testid="diary-entries"` / `"diary-rail"` / `"diary-entry-wrapper"` / `"diary-marker"` from K-028) — only text content source changes. Title rendering uses new `entry-title` rule:

```tsx
<p className="font-['Bodoni_Moda'] text-[18px] italic font-bold text-[#1A1814] leading-tight">
  {e.ticketId ? `${e.ticketId} — ${e.title}` : e.title}
</p>
```

**Explicit codepoint usage:** `—` em-dash with single space on each side. No `·` (middle-dot), no `-` (hyphen-minus) at the `ticketId / title` boundary.

**Homepage CURATION boundary (AC-024-HOMEPAGE-CURATION):**
- `entries.length === 0` → DevDiarySection conditional wraps `diary-entries` div in `entries.length > 0` (already present on main line 52 as `!loading && !error && milestones.length > 0`). Keep. **Entire section hides — no heading, no rail, no marker** — satisfying the `diary.json = []` case.
- `entries.length === 1 or 2` → render N entries, N markers (the flex wrapper + single absolute rail will still span `top:40 / bottom:40`; with 1 entry the rail becomes short but visible since wrapper `min-h-[48px]` ensures positive height — verified: top(40) + bottom(40) on `min-h-48px` equals zero height or negative; see §4.3.1 boundary below)

### 4.3.1 Boundary — 1-entry homepage rail height

**Issue:** Current K-028 rail uses `style={{ left: 29, top: 40, bottom: 40 }}` on a flex wrapper. With 1 entry at `min-h-[48px]`, wrapper actual height ≈ 48px → rail renders with 40 top inset + 40 bottom inset in a 48px container → **negative height → invisible rail**.

**Resolution:**
- For `entries.length === 1`: hide the rail entirely (single entry has nothing to "connect"). Add conditional: `{entries.length >= 2 && <div aria-hidden data-testid="diary-rail" ... />}`
- For `entries.length === 2`: wrapper grows past 80px (two entries each ≥ 48px) → rail renders with positive height
- For `entries.length === 0`: section not rendered at all (existing code path)

**Playwright spec target (Phase 3 rewrite):** on `diary.json=[1 entry]` fixture, `expect(page.locator('[data-testid="diary-rail"]')).toHaveCount(0)`. On `[2 entries]` fixture, count = 1.

### 4.4 Boundary truth table — curation × entry count × viewport

Cartesian dry-run (AC-024-HOMEPAGE-CURATION + AC-024-DIARY-PAGE-CURATION combined):

| Route | entry count | viewport | Rendered count | Rail rendered? | Load More? |
|-------|------------|----------|---------------|----------------|-----------|
| `/` | 0 | desktop | 0 (section hidden) | no | n/a |
| `/` | 1 | desktop | 1 | **no** (§4.3.1 fix) | n/a |
| `/` | 2 | desktop | 2 | yes | n/a |
| `/` | 3 | desktop | 3 | yes | n/a |
| `/` | 5 | desktop | 3 (curation: min(3, N)) | yes | n/a |
| `/` | 16 | desktop | 3 | yes | n/a |
| `/diary` | 0 | desktop | 0 (empty state message — see §6) | no | no |
| `/diary` | 1 | desktop | 1 | no | no |
| `/diary` | 2 | desktop | 2 | yes | no |
| `/diary` | 5 | desktop | 5 | yes | no (count === total) |
| `/diary` | 10 | desktop | 5 → 10 after click → hidden | yes | yes → hidden after click |
| `/diary` | 11 | desktop | 5 → 10 → 11 after 2 clicks | yes | yes → yes → hidden |
| `/diary` | 5 | mobile 390×844 | 5 | yes (rail inherits from desktop spec, see §5) | no |
| `/diary` | 11 | mobile 390×844 | 5 → 11 (2 clicks) | yes | yes → hidden |

---

## 5 K-027 §6 inheritance evaluation (mandatory — per ticket §K-027 設計繼承)

Per ticket L30–42 + `docs/designs/K-027-mobile-diary-layout.md` §6, each row must be explicitly "inherit" or "redesign" with reason.

| # | K-027 decision | K-024 decision | Reason |
|---|---------------|---------------|--------|
| 1 | Mobile breakpoint: Tailwind `sm:` = 640px | **INHERIT** `sm:` = 640px | K-027 established; ticket §放行狀態 PM暫定 inherit unless Architect raises blocker + TD. No design reason to move to 480px custom — (a) new flat timeline uses `contentWidth` (1248px desktop) which gracefully degrades below 640px via shrink+reflow (see §6 mobile spec), (b) no element has 480–640px intermediate behavior that differs from < 640px, (c) custom breakpoint would require maintaining a second scale system in `tailwind.config.js` for just one route. Keep `sm:` consistent with K-027 and K-028. |
| 2 | DiaryEntry mobile layout: `flex-col`, date on top, text below | **REDESIGN** — flat timeline has title → date → body (3 layers, not 2) → on mobile all three stack `flex-col` in DOM order (title → date → body) with font-size scaled down (see §6) | K-024 ticket AC-024-ENTRY-LAYOUT locks DOM order `title → date → body` (entry-title's `compareDocumentPosition` assertion). Order stays identical on desktop and mobile — only size/gap changes. |
| 3 | Milestone spacing: `mb-4 sm:mb-3` | **REDESIGN** — no milestone wrappers exist (accordion removed). Entry-to-entry vertical step uses visual-spec `entryVerticalStepY: 160` (desktop) → on mobile reduces to `gap-8` (32px) between entries | Flat timeline's natural gap is between entries, not between milestone groups. `160px` desktop step was derived from .pen frame (Designer). Mobile compression to `32px` preserves readability while fitting narrower columns. |
| 4 | `overflow-hidden` on accordion expanded area | **REDESIGN — N/A for timeline** | No accordion, no expanded area to clip. `break-words` + `max-w-full` on entry-body suffices to prevent horizontal overflow. Rail is absolutely positioned inside a `relative` wrapper with `overflow-visible` (default) — spec violation would only occur if entry-body exceeds frame width, which `break-words` prevents. |
| 5 | `break-words` on DiaryEntry text | **INHERIT** — apply to entry-body `<p>` | Same CJK-and-long-english-token concern, even though diary.json will be all-English after Phase 1, defensive class remains cheap. |

**K-027 regression policy (per ticket L382):** rows 2, 3, 4 are redesigns, not silent inheritance. Row 2 replaces K-027's 2-layer `(date, text)` with 3-layer `(title, date, body)` — AC-024-ENTRY-LAYOUT requires this; K-027's AC-027-TEXT-READABLE still holds (all three layers readable, no ellipsis, font-size ≥ 12px). Row 3 replaces `mb-4 sm:mb-3` with `gap-8` (32px, flex wrapper) — rail continuity improved. Row 4 N/A because accordion gone. **No K-027 Sacred assertion violated** (the assertions target the accordion DOM which no longer exists; once K-027 tests are deleted in Phase 3, AC-024-REGRESSION Allowed-to-change clause covers this).

**Tech Debt flag to log when K-027 specs are removed (Phase 3):** TD-K027-02 (locator fragility) is resolved by removal (the spec disappears); TD-K027-03 / TD-K027-04 (overflow assertion, hardcoded sleep) are moot because the target DOM is gone. TD-K027-01 (three-viewport desktop regression) does NOT carry over — K-024 has its own viewport strategy (§6).

---

## 6 Phase 3 — /diary visual rework

### 6.1 Component tree — `/diary` page

```
<DiaryPage>                                          [file: pages/DiaryPage.tsx — REWRITE]
├── <UnifiedNavBar />                                [existing; K-021]
├── <main className="px-6 sm:px-24 pb-24">           [content wrap; content width = 1248px via max-w; centered margin]
│   ├── <DiaryHero />                                [NEW: components/diary/DiaryHero.tsx]
│   │   ├── <h1> "Dev Diary"                        [hero-title role; Bodoni italic 64px]
│   │   ├── <hr />                                  [hero-divider role; 1px bg-charcoal full width]
│   │   └── <p> "Each entry records..."             [hero-subtitle role; Newsreader italic 17px]
│   ├── if (loading)   → <DiaryLoading />            [NEW: components/diary/DiaryLoading.tsx]
│   ├── if (error)     → <DiaryError message onRetry /> [NEW: components/diary/DiaryError.tsx]
│   ├── if (!loading && !error && visible.length === 0)
│   │                  → <DiaryEmptyState />         [NEW: components/diary/DiaryEmptyState.tsx]
│   └── if (!loading && !error && visible.length > 0)
│       ├── <DiaryTimeline entries={visible} />     [NEW: components/diary/DiaryTimeline.tsx — REWRITE, same filename, different shape]
│       │   ├── <DiaryRail count={visible.length} /> [NEW: components/diary/DiaryRail.tsx]
│       │   └── entries.map → <DiaryEntryV2 entry={e} />  [NEW: components/diary/DiaryEntryV2.tsx — replaces old DiaryEntry.tsx]
│       │       ├── <DiaryMarker />                 [NEW: components/diary/DiaryMarker.tsx]
│       │       ├── <h2> title                      [entry-title role]
│       │       ├── <time> date                     [entry-date role]
│       │       └── <p> body                        [entry-body role]
│       └── if (hasMore) → <LoadMoreButton onClick disabled={!canLoadMore} />  [NEW: components/diary/LoadMoreButton.tsx]
```

Note: Old `MilestoneSection.tsx` + old `DiaryEntry.tsx` **deleted** in Phase 3. Filename `DiaryTimeline.tsx` kept (different internals). New components use `-V2` suffix only on `DiaryEntry` because `DiaryEntry` is also the new type name — without suffix there's a name clash. `DiaryEntryV2.tsx` is the component; `DiaryEntry` (no suffix) is the type.

### 6.2 Component tree — Homepage diary block

```
<DevDiarySection />                                  [file: home/DevDiarySection.tsx — RESHAPE shape consumer]
├── diaryHead section label (§ DEV DIARY)           [preserved from K-028]
├── introduction <p>                                 [preserved]
├── loading / error gates                            [preserved]
└── <div data-testid="diary-entries">                [preserved flex-col wrapper]
    ├── if (entries.length >= 2)
    │     └── <div data-testid="diary-rail" />       [§4.3.1 boundary: hide on 1-entry]
    └── entries.map → <div data-testid="diary-entry-wrapper">
         ├── <div data-testid="diary-marker" />      [preserved 20×14 brick-dark radius 0]
         ├── title <p>                               [flat schema: e.ticketId ? `${ticketId} — ${title}` : title]
         ├── date <span>                             [entry-date role]
         └── body <p>                                [entry-body role]
```

**Homepage does NOT consume `DiaryTimeline` or `DiaryEntryV2`** — it keeps its own inline render (DiaryTimeline is `/diary`-exclusive rail+marker structure; DevDiarySection inherits timeline primitives via visual-spec cross-frame consistency but implements them inline to preserve its `diaryHead` + `diaryViewAllRow` affordances). This matches main's pattern (DevDiarySection does not import from `components/diary/`).

**Cross-page consistency (per visual-spec.json `crossFrameConsistency.sharedPrimitives`):** rail + marker + entry-title + entry-date + entry-body roles share values between `wiDSi` (/diary) and `N0WWY` (/). When any value changes in visual-spec.json, both DevDiarySection inline render AND DiaryPage's `<DiaryRail>` / `<DiaryMarker>` / `<DiaryEntryV2>` must be updated. Engineer: use the SAME `hexToRgb` / font family strings in both places. See §6.9 explicit role-mapping table.

### 6.3 Component props interfaces

#### `DiaryPage` — no props (route component)

#### `DiaryHero`
```ts
interface DiaryHeroProps {
  // no props — content is static, from visual-spec.json
}
```

#### `DiaryTimeline` (rewrite)
```ts
interface DiaryTimelineProps {
  entries: DiaryEntry[]    // already sliced by useDiaryPagination
  // renders: <DiaryRail /> + entries.map → <DiaryEntryV2 entry={e} />
}
```

#### `DiaryRail`
```ts
interface DiaryRailProps {
  // no props — rail absolute-positioned; self-contained
  // renders: <div aria-hidden data-testid="diary-rail" ... />
}
```

#### `DiaryMarker`
```ts
interface DiaryMarkerProps {
  // no props — 20×14 brick-dark rect at left:20 top:10 (absolute, relative to parent entry)
  // renders: <div aria-hidden data-testid="diary-marker" ... />
}
```

#### `DiaryEntryV2`
```ts
interface DiaryEntryV2Props {
  entry: DiaryEntry
}
// renders:
// <div data-testid="diary-entry" className="relative pl-[92px] ...">
//   <DiaryMarker />
//   <h2 className="font-['Bodoni_Moda'] italic font-bold text-[18px] text-[#1A1814]">
//     {entry.ticketId ? `${entry.ticketId} — ${entry.title}` : entry.title}
//   </h2>
//   <time className="block font-mono text-[12px] text-[#6B5F4E] tracking-wide mt-1" dateTime={entry.date}>
//     {entry.date}
//   </time>
//   <p className="font-['Newsreader'] italic text-[18px] text-[#2A2520] leading-[1.55] mt-2 break-words">
//     {entry.text}
//   </p>
// </div>
```

#### `DiaryLoading`
```ts
interface DiaryLoadingProps {
  // no props
  // renders: <div data-testid="diary-loading" role="status" aria-label="Loading diary entries">
  //           <LoadingSpinner label="Loading diary…" />
  //         </div>
}
```

Note: `LoadingSpinner` currently has dark-theme residue (`bg-[#0D1117]`). K-021 paper palette established globally but LoadingSpinner was not migrated. **Decision:** DiaryLoading wraps LoadingSpinner in a `data-testid` container; keep LoadingSpinner's dark inner visual as-is for this ticket (out of scope). Engineer adds brief `// TODO K-0xx: LoadingSpinner paper-palette migration` comment. Log as TD (see §12).

#### `DiaryError`
```ts
interface DiaryErrorProps {
  message: string
  onRetry: () => void
}
// renders: <div data-testid="diary-error" role="alert" className="...">
//           <p>{message || "Couldn't load the diary right now. Please try again."}</p>
//           <button onClick={onRetry} ...>Retry</button>
//         </div>
```

**Canonical error literal (for AC-024-LOADING-ERROR-PRESERVED Round 2 QA readiness):**
- Primary: exact backend/network message (e.g., `"Failed to load diary: 404"` propagated from useDiary)
- Fallback (when `message === ''` or undefined-safe-fallback): `"Couldn't load the diary right now. Please try again."`
- Retry button literal: `"Retry"` (keeps ErrorMessage.tsx alignment)

**Error classification scope (single-fetch-only per AC-024-LOADING-ERROR-PRESERVED + AC-024-DIARY-PAGE-CURATION L205):**
- 4xx / 5xx HTTP errors → `"Failed to load diary: <status>"`
- Network failure (offline, DNS, CORS) → browser-default `TypeError` → rendered as-is (`err.message`)
- JSON parse failure → `"Unexpected token ..."` or zod error message → rendered as-is
- Timeout → treated as network failure (no explicit timeout handling; browser default)
- **No retry infinite loop** — single manual `onRetry` click triggers one re-fetch. No auto-retry.
- **Post-load (Load More) failures** — out of scope: all data is in-memory after initial fetch; pagination is pure client slicing (no mid-load fetch).

#### `DiaryEmptyState`
```ts
interface DiaryEmptyStateProps {
  // no props
  // renders: <div data-testid="diary-empty">
  //           <p>No entries yet. Check back soon.</p>
  //         </div>
}
```

**Literal:** `"No entries yet. Check back soon."` (Architect pick — short, neutral, English per AC-024-ENGLISH global rule)

#### `LoadMoreButton`
```ts
interface LoadMoreButtonProps {
  onClick: () => void
  disabled: boolean          // true when canLoadMore === false
}
// renders: <button
//            data-testid="diary-load-more"
//            onClick={onClick}
//            disabled={disabled}
//            className="font-mono text-[12px] font-bold text-[#9C4A3B] tracking-wide hover:underline disabled:opacity-40 disabled:cursor-not-allowed mt-12"
//            aria-label="Load more diary entries"
//          >
//            Load more ↓
//          </button>
```

**Literal text:** `"Load more ↓"` (aligns with existing `"— View full log →"` casing and arrow glyph style on DevDiarySection).
**Position:** below last rendered entry, right-aligned via wrapping `<div className="flex justify-end mt-12">`.
**Disabled styling:** `opacity-40 cursor-not-allowed` — WCAG-compliant visual distinction.

### 6.4 data-testid contract (authoritative, closes AC-024-LOADING-ERROR-PRESERVED Round 2)

| testid | Component | Location | Asserted by |
|--------|-----------|----------|-------------|
| `diary-loading` | `DiaryLoading` (wrapper) | `/diary` only | AC-024-LOADING-ERROR-PRESERVED Round 2 |
| `diary-error` | `DiaryError` (wrapper) | `/diary` only | AC-024-LOADING-ERROR-PRESERVED Round 2 |
| `diary-empty` | `DiaryEmptyState` | `/diary` entry=0 boundary | AC-024-DIARY-PAGE-CURATION entry=0 |
| `diary-rail` | `DiaryRail` (wrapper div) | `/diary` AND `/` (shared primitive name) | AC-024-TIMELINE-STRUCTURE + K-028 |
| `diary-marker` | `DiaryMarker` | `/diary` AND `/` | AC-024-TIMELINE-STRUCTURE + K-023 AC-023-DIARY-BULLET |
| `diary-entry` | `DiaryEntryV2` (wrapper) | `/diary` | AC-024-TIMELINE-STRUCTURE marker count = entries count |
| `diary-entry-wrapper` | Homepage inline entry wrapper (also satisfies AC-024-HOMEPAGE-CURATION per BQ-024-01 PM ruling (b) 2026-04-22) | `/` only | K-028 Sacred preserved; K-024 AC reuses same testid — no second attr |
| `diary-load-more` | `LoadMoreButton` | `/diary` only | AC-024-DIARY-PAGE-CURATION |
| `diary-main` | `DiaryPage` `<main role="main">` landmark | `/diary` only | AC-024-CONTENT-WIDTH fallback locator (added R2 2026-04-22 per D-4 finding) |

**Homepage entry testid resolution — BQ-024-01 RESOLVED 2026-04-22 (PM ruled Option (b)):**

PM ruled that the K-024 AC literal `homepage-diary-entry` be renamed to `diary-entry-wrapper` (ticket edit already applied — lines 184 / 195 / 401 of `docs/tickets/K-024-diary-structure-and-schema.md`). Rationale per PM block in ticket §放行狀態 PM 裁決紀錄 (summarized): K-028 closed 2026-04-21 + deployed + live CDN bundle grep-verified contains `diary-entry-wrapper` → Sacred immutability rule (per `feedback_sacred_contract_immutability`) forbids renaming; AC literal edit is PM-owned per `feedback_ticket_ac_pm_only` and carries minimal cost. Architect's original (a) recommendation (rename K-028 Sacred) was rejected on Sacred grounds; (c) dual-attribute was rejected as gratuitous DOM bloat.

**Implementation contract (authoritative):**
- DevDiarySection Homepage entry wrapper renders **one** `data-testid` attribute: `data-testid="diary-entry-wrapper"`
- **No second `data-testid`** on the same element (HTML disallows duplicate attribute names)
- **No `data-homepage-entry` custom attribute** — PM ruling obsoletes this workaround
- AC-024-HOMEPAGE-CURATION Playwright spec selector: `page.locator('[data-testid="diary-entry-wrapper"]')` scoped to Homepage → `toHaveCount(3)`
- K-028 Sacred spec (`pages.spec.ts` L419, L421) remains untouched and continues to pass against the same selector

**Concrete pattern in DevDiarySection render:**

```tsx
<div
  data-testid="diary-entry-wrapper"
  className="relative pl-[92px] min-h-[48px]"
>
```

Since AC-024-HOMEPAGE-CURATION and K-028 Sacred share the same selector on Homepage scope, the `toHaveCount(3)` assertion (K-024) and the existence/shape asserts (K-028) coexist without DOM collision or test interference.

**Playwright scoping note:** AC-024-HOMEPAGE-CURATION spec must scope the locator to the Homepage-only DevDiarySection subtree (e.g. nested under `data-testid="dev-diary-section"` or the `<section>` containing DevDiarySection), since the same testid also appears on `/diary` route. Simplest: `page.goto('/')` + `page.locator('[data-testid="diary-entry-wrapper"]')` returns exactly the 3 Homepage entries when on `/` (DiaryPage route uses `data-testid="diary-entry"` wrapper per row 620 above — different testid, no collision).

### 6.5 visual-spec role → CSS property mapping (authoritative)

All CSS values sourced from `docs/designs/K-024-visual-spec.json` — never hand-typed. Engineer imports the JSON at build time or embeds via Tailwind arbitrary values.

#### Desktop — `wiDSi` frame (/diary) + `N0WWY` frame (/)

| Role | JSON path | CSS property | Value | Applied to |
|------|-----------|--------------|-------|-----------|
| `hero-title` | `frames[0].components[0].font` | fontFamily | `Bodoni Moda, serif` | DiaryHero `<h1>` |
| `hero-title` | same | fontStyle | `italic` | DiaryHero `<h1>` |
| `hero-title` | same | fontSize | `64px` | DiaryHero `<h1>` |
| `hero-title` | same | fontWeight | `700` | DiaryHero `<h1>` |
| `hero-title` | same | lineHeight | `1.05` | DiaryHero `<h1>` |
| `hero-title` | `...color` | color | `#1A1814` (rgb(26,24,20)) | DiaryHero `<h1>` |
| `hero-divider` | `frames[0].components[1]` | height | `1px` | DiaryHero `<hr>` |
| `hero-divider` | same | backgroundColor | `#2A2520` (rgb(42,37,32)) | DiaryHero `<hr>` |
| `hero-divider` | same | width | `100%` (fill_container) | DiaryHero `<hr>` |
| `hero-subtitle` | `frames[0].components[2].font` | fontFamily | `Newsreader, serif` | DiaryHero `<p>` |
| `hero-subtitle` | same | fontStyle | `italic` | DiaryHero `<p>` |
| `hero-subtitle` | same | fontSize | `17px` | DiaryHero `<p>` |
| `hero-subtitle` | same | fontWeight | `normal` (400) | DiaryHero `<p>` |
| `hero-subtitle` | same | lineHeight | `1.55` | DiaryHero `<p>` |
| `hero-subtitle` | `...color` | color | `#1A1814` | DiaryHero `<p>` |
| `hero-subtitle` | `...text` | textContent | `"Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first."` | DiaryHero `<p>` |
| `rail` | `frames[0].components[3]` | width | `1px` | DiaryRail (absolute) |
| `rail` | same | backgroundColor | `#2A2520` | DiaryRail |
| `rail` | same | left | `29px` | DiaryRail |
| `rail` | same | top / bottom inset | `40px` / `40px` (from K-028 pattern; visual-spec `y: 40` start) | DiaryRail |
| `marker` | `frames[0].components[4].color` | backgroundColor | `#9C4A3B` (rgb(156,74,59)) | DiaryMarker |
| `marker` | `...shape.cornerRadius` | borderRadius | `6px` | DiaryMarker |
| `marker` | `...shape.size` | width / height | `20px` / `14px` | DiaryMarker |
| `marker` | `...shape.position` | left / top | `20px` / `10px` (absolute inside entry) | DiaryMarker |
| `entry-title` | `frames[0].components[5].font` | fontFamily | `Bodoni Moda, serif` | DiaryEntryV2 `<h2>` |
| `entry-title` | same | fontStyle | `italic` | DiaryEntryV2 `<h2>` |
| `entry-title` | same | fontSize | `18px` | DiaryEntryV2 `<h2>` |
| `entry-title` | same | fontWeight | `700` | DiaryEntryV2 `<h2>` |
| `entry-title` | `...color` | color | `#1A1814` | DiaryEntryV2 `<h2>` |
| `entry-title` | `...layout.x` | paddingLeft (from marker) | `92px` (handled by parent entry container) | DiaryEntryV2 wrapper |
| `entry-date` | `frames[0].components[6].font` | fontFamily | `Geist Mono, monospace` | DiaryEntryV2 `<time>` |
| `entry-date` | same | fontSize | `12px` | DiaryEntryV2 `<time>` |
| `entry-date` | same | fontWeight | `normal` | DiaryEntryV2 `<time>` |
| `entry-date` | same | letterSpacing | `1px` | DiaryEntryV2 `<time>` |
| `entry-date` | `...color` | color | `#6B5F4E` | DiaryEntryV2 `<time>` |
| `entry-body` | `frames[0].components[7].font` | fontFamily | `Newsreader, serif` | DiaryEntryV2 `<p>` |
| `entry-body` | same | fontStyle | `italic` | DiaryEntryV2 `<p>` |
| `entry-body` | same | fontSize | `18px` | DiaryEntryV2 `<p>` |
| `entry-body` | same | lineHeight | `1.55` | DiaryEntryV2 `<p>` |
| `entry-body` | `...color` | color | `#2A2520` | DiaryEntryV2 `<p>` |

**Cross-frame consistency (`crossFrameConsistency.sharedPrimitives`):** rail / marker / entry-title / entry-date / entry-body must render identically on `/diary` AND `/` (Homepage DevDiarySection). Any value change in visual-spec.json propagates to both inline Homepage render (`DevDiarySection.tsx` L64–99) AND `/diary` component set. Engineer uses a shared constant module:

```ts
// frontend/src/components/diary/timelinePrimitives.ts — NEW in Phase 3
// Derived from docs/designs/K-024-visual-spec.json cross-frame shared roles.
export const RAIL = {
  width: 1,
  color: '#2A2520',
  xOffset: 29,
  topInset: 40,
  bottomInset: 40,
} as const
export const MARKER = {
  width: 20,
  height: 14,
  cornerRadius: 6,
  color: '#9C4A3B',
  leftInset: 20,
  topInset: 10,
} as const
export const ENTRY_TYPE = {
  title: { font: 'Bodoni Moda, serif', style: 'italic', size: 18, weight: 700, color: '#1A1814' },
  date:  { font: 'Geist Mono, monospace', size: 12, color: '#6B5F4E', letterSpacing: 1 },
  body:  { font: 'Newsreader, serif', style: 'italic', size: 18, lineHeight: 1.55, color: '#2A2520' },
} as const
```

Both `/diary` component set AND `DevDiarySection.tsx` import from this module → single-source of primitive values.

### 6.6 Timeline HTML structure — `<ol>` decision

**Decision: `<ol role="list">` with `reversed={false}` and explicit ARIA fallback.**

Options:

| Option | Pros | Cons |
|--------|------|------|
| `<div>` + `role="list"` | Bypasses `<ol>`'s default marker CSS cleanup burden | Loses semantic list; screen readers announce "generic" not "list of N items"; AC-DIARY-1 accessibility-adjacent tests less robust |
| `<ul>` | Unordered (bulleted) semantic | Diary entries are chronologically ordered (date desc) — semantically `<ol>` is correct |
| **`<ol>` + `role="list"`** (recommended) | Semantic correctness; `role="list"` restoration after `list-style: none` to preserve SR announcement in Safari/WebKit (removed list semantics when default markers disabled) | Requires explicit `list-style: none` + `padding: 0` reset |

**Rationale:** diary entries are explicitly `date desc` sorted — ordered. `<ol>` is semantically correct; WebKit's "remove role=list when `list-style: none`" bug is worked around with explicit `role="list"`. Keeps SR announcements meaningful.

```tsx
// DiaryTimeline.tsx
<ol
  role="list"
  className="list-none p-0 m-0 relative flex flex-col gap-8"
>
  <DiaryRail />
  {entries.map((e) => (
    <li key={`${e.ticketId ?? 'no-id'}-${e.date}-${e.title}`} className="m-0 p-0">
      <DiaryEntryV2 entry={e} />
    </li>
  ))}
</ol>
```

**li key strategy:** `ticketId ?? 'no-id'` + `date` + `title` composite ensures uniqueness even if a ticketId is reused (future-proof; legacy-merge entry has `ticketId` absent → `'no-id'-2026-04-16-Early project phases and deployment setup`). Single legacy-merge entry per AC-024-LEGACY-MERGE means `'no-id'` never collides.

### 6.7 Curation UI pattern — Load more button (not infinite scroll)

**Decision locked by PM ticket ruling 2026-04-22 (L204).** Button click + client-side slicing.

Architect produces:
- Button literal: `"Load more ↓"` (§6.3)
- Position: right-aligned, below last entry, `mt-12`
- Disabled state: when no more entries OR during in-flight click (concurrency gate — §4.2)
- Disabled styling: `opacity-40 cursor-not-allowed` + `disabled` HTML attribute for SR
- Removed from DOM when `hasMore === false` (prefer removal over permanent-disabled; AC-024-DIARY-PAGE-CURATION allows either; removal is cleaner)

### 6.8 Mobile layout specs (viewport < 1248px, explicit per AC-024-CONTENT-WIDTH)

AC-024-CONTENT-WIDTH L310–333 scopes mobile to ≤ 480px with "no-overflow" constraint only. Mobile layout details below scope to ≤ 640px (inherits K-027 `sm:`).

#### Mobile viewport ≤ 640px (`<sm:` in Tailwind)

| Element | Mobile spec | Rationale |
|---------|------------|-----------|
| Page content padding | `px-6` (24px) | same as main (existing DiaryPage has `px-6`); comfortable single-column |
| content container maxWidth | `100%` of viewport (effectively; `max-w-none` override) | 1248px is desktop-only; mobile flows naturally |
| Hero title font-size | `40px` (desktop 64 × ~0.625) | visual-spec 64px too large for narrow columns |
| Hero divider | `1px` height unchanged | consistent |
| Hero subtitle font-size | `15px` (desktop 17 × ~0.88) | readability on small screens |
| Rail | **hidden on mobile (`<sm:`)** — `hidden sm:block` | 1px rail in 24px left padding clashes with marker visually; marker alone conveys timeline visually. **K-027 row 3/4 inheritance: N/A** — new design. |
| Marker | **hidden on mobile** — `hidden sm:block` | rail's visual anchor gone → marker becomes orphan dot; cleaner to drop both on mobile |
| Entry wrapper paddingLeft | `pl-0` (mobile) vs `pl-[92px]` (desktop) | no rail/marker on mobile → no indent needed |
| Entry stack order (DOM & visual) | title → date → body (unchanged; `flex-col` is natural) | AC-024-ENTRY-LAYOUT DOM order assertion holds on all viewports |
| entry-title font-size | `16px` (desktop 18 × ~0.88) | readability |
| entry-date font-size | `11px` (desktop 12 × ~0.92) | keep Geist Mono style; slightly smaller |
| entry-body font-size | `16px` (desktop 18 × ~0.88) | readability; `break-words` retained |
| Entry gap (between entries) | `gap-8` (32px) mobile / `gap-10` (40px) desktop | visually balanced |
| Load more button | same literal; position right-aligned; `text-[11px] sm:text-[12px]` | scaled |

#### Middle viewport (481–1247px, per AC-024-CONTENT-WIDTH)

No overflow constraint only: `scrollWidth <= innerWidth` must hold. Between `sm:` (640px) and 1248px, Tailwind `sm:` classes activate — rail + marker become visible; content uses `max-w-[1248px]` but fills viewport with `w-full`; padding `sm:px-24` (96px).

#### Mobile inherits (from K-027)

- `break-words` on entry-body: **yes** (row 5 inherit)
- `overflow-hidden` on accordion: **N/A** (no accordion; row 4 redesign)
- `flex-col` on entry: **N/A** (whole entry is `<article>`/`<li>` block-level; `flex-col` not needed — text flow handles it; row 2 redesign)

### 6.9 DOM structure reference (complete `/diary` — desktop)

```html
<!-- pages/DiaryPage.tsx -->
<div class="min-h-screen bg-paper text-ink">
  <!-- UnifiedNavBar (K-021) -->
  <nav ... />
  <main class="px-6 sm:px-24 pb-24 mx-auto max-w-[1248px]">
    <!-- DiaryHero -->
    <section class="pt-16 mb-16">
      <h1 class="font-['Bodoni_Moda'] italic font-bold text-[40px] sm:text-[64px] text-[#1A1814] leading-[1.05]">Dev Diary</h1>
      <hr class="h-px w-full bg-[#2A2520] my-4 border-0" role="separator" aria-hidden="true" />
      <p class="font-['Newsreader'] italic text-[15px] sm:text-[17px] text-[#1A1814] leading-[1.55]">
        Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first.
      </p>
    </section>

    <!-- loading gate -->
    <!-- <div data-testid="diary-loading" role="status" aria-label="Loading diary entries">...</div> -->

    <!-- error gate -->
    <!-- <div data-testid="diary-error" role="alert">...</div> -->

    <!-- empty state -->
    <!-- <div data-testid="diary-empty"><p>No entries yet. Check back soon.</p></div> -->

    <!-- DiaryTimeline + DiaryEntryV2 -->
    <ol role="list" class="list-none p-0 m-0 relative flex flex-col gap-8 sm:gap-10">
      <!-- DiaryRail -->
      <div class="hidden sm:block absolute w-px bg-[#2A2520]" style="left:29px; top:40px; bottom:40px;" aria-hidden="true" data-testid="diary-rail"></div>

      <!-- DiaryEntryV2 × N -->
      <li class="m-0 p-0">
        <article class="relative pl-0 sm:pl-[92px] min-h-[48px]" data-testid="diary-entry">
          <div class="hidden sm:block absolute w-5 h-3.5 rounded-[6px] bg-brick-dark" style="left:20px; top:10px;" aria-hidden="true" data-testid="diary-marker"></div>
          <h2 class="font-['Bodoni_Moda'] italic font-bold text-[16px] sm:text-[18px] text-[#1A1814]">K-017 — Portfolio /about Rewrite</h2>
          <time datetime="2026-04-19" class="block font-mono text-[11px] sm:text-[12px] text-[#6B5F4E] tracking-wide mt-1">2026-04-19</time>
          <p class="font-['Newsreader'] italic text-[16px] sm:text-[18px] text-[#2A2520] leading-[1.55] mt-2 break-words">...</p>
        </article>
      </li>
      <!-- repeat per entry -->
    </ol>

    <!-- LoadMoreButton (only when hasMore) -->
    <div class="flex justify-end mt-12">
      <button data-testid="diary-load-more" class="font-mono text-[11px] sm:text-[12px] font-bold text-[#9C4A3B] tracking-wide hover:underline disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Load more diary entries">Load more ↓</button>
    </div>
  </main>
</div>
```

---

## 7 Playwright test strategy (Phase 3)

### 7.1 Retire / rewrite

| Spec | Action | Reason |
|------|--------|--------|
| `frontend/e2e/diary-mobile.spec.ts` | **Delete** | Entire file targets removed accordion DOM (`.border.border-ink\/10.rounded-sm`, `MilestoneSection`). Inventory: 7 test cases. All target structure no longer exists. AC-024-REGRESSION Allowed-to-change clause covers deletion. K-027 AC-027-NO-OVERLAP / AC-027-TEXT-READABLE no longer applies (no accordion = no overlap risk). |
| `frontend/e2e/pages.spec.ts` AC-DIARY-1 three tests (L83–121) | **Rewrite** | Targets `getByRole('button').first()` (accordion button) and `.px-4.pb-4 p` (accordion inner). Both gone. Replace with tests asserting new `data-testid="diary-entry"` visibility + hero title/subtitle + load-more behavior. Part of AC-DIARY-1 rewrite per AC-024-REGRESSION Allowed-to-change. |
| `frontend/e2e/pages.spec.ts` AC-017-FOOTER `/diary` (L158–164) | **Keep** | Sacred — no footer on `/diary`. Rewrite does not add Footer. |
| `frontend/e2e/pages.spec.ts` AC-023-DIARY-BULLET (L174–215) | **Keep** | Sacred — Homepage marker shape. New DevDiarySection preserves. |
| `frontend/e2e/pages.spec.ts` AC-017-HOME-V2 (L128–151) | **Keep** | Sacred — Hero + ProjectLogic content; unrelated. |
| `frontend/e2e/pages.spec.ts` AC-028-MARKER-COUNT-INTEGRITY (L415–432) | **Keep** | Sacred — Homepage marker = entry count. Preserved in Phase 2 reshape. |
| `frontend/e2e/pages.spec.ts` AC-028-SECTION-SPACING (L460–497) | **Keep** | Sacred — Homepage section gap. Unrelated. |
| `frontend/e2e/sitewide-body-paper.spec.ts`, `sitewide-footer.spec.ts`, `sitewide-fonts.spec.ts` | **Keep** | Sacred — K-021 design system. Unrelated to diary. |
| `frontend/e2e/app-bg-isolation.spec.ts` | **Keep** | K-030 `/app`. Unrelated. |

### 7.2 New specs — Phase 3

Two new spec files:

**`frontend/e2e/diary-page.spec.ts`** (NEW, /diary-focused) — covers AC-024-SCHEMA (indirect), AC-024-TIMELINE-STRUCTURE, AC-024-ENTRY-LAYOUT, AC-024-PAGE-HERO, AC-024-CONTENT-WIDTH, AC-024-DIARY-PAGE-CURATION, AC-024-LOADING-ERROR-PRESERVED (pending QA R2 ruling but stubs included), AC-024-REGRESSION /diary portion.

**`frontend/e2e/diary-homepage.spec.ts`** (NEW, /-focused diary section) — covers AC-024-HOMEPAGE-CURATION including 0-entry / 1-entry / 2-entries fixture cases, tie-break on same-date.

### 7.3 Test case count vs AC mapping (Cross-Check Gate per persona)

Per persona "AC ↔ Test Case Count Cross-Check" rule: every AC requiring Playwright must have ≥1 test ID; PM-split ACs have separate test IDs not merged rows.

| AC | Required test IDs | Spec file | Count |
|----|-------------------|----------|-------|
| AC-024-SCHEMA | Vitest (diary.schema.test.ts), not Playwright | — | 0 Playwright |
| AC-024-ENGLISH | Vitest (diary.english.test.ts) | — | 0 Playwright |
| AC-024-LEGACY-MERGE | Vitest (diary.legacy-merge.test.ts) | — | 0 Playwright |
| AC-024-HOMEPAGE-CURATION | T-H1 (3-entry happy path) / T-H2 (tie-break: same-date array-index-later on top) / T-H3 (0-entry boundary per K-028 Sacred — DEV DIARY heading preserved, rail/marker count=0) / T-H4 (1-entry) / T-H5 (2-entry) | diary-homepage.spec.ts | **5** |
| AC-024-DIARY-PAGE-CURATION | T-D1 (5 initial) / T-D2 (Load more → 10) / T-D3 (entry=0 empty state) / T-D4 (entry=1) / T-D5 (entry=3 no button) / T-D6 (entry=5 no button) / T-D7 (entry=10 load once → hide) / T-D8 (entry=11 two loads) / T-D9 (rapid double-click) | diary-page.spec.ts | **9** |
| AC-024-TIMELINE-STRUCTURE | T-T1 (no accordion; no `<details>/<summary>`) / T-T2 (no `divide-y`) / T-T3 (no `milestone` wrapper class) / T-T4 (rail backgroundColor + width + height-geq-entries-box) / T-T5 (marker count = entry count dynamic after Load More) / T-T6 (marker CSS bg + width + height + borderRadius) | diary-page.spec.ts | **6** |
| AC-024-ENTRY-LAYOUT | T-E1 (DOM order title→date→body) / T-E2 (title regex /^K-\d{3} — .+$/) / T-E3 (no middle-dot prefix) / T-E4 (no hyphen-minus prefix) / T-E5 (no ticketId → title textContent doesn't match /^K-\d{3}/) / T-E6 (fontFamily + fontSize + fontStyle + fontWeight + lineHeight + letterSpacing + color catchall for all 3 layers — R2 2026-04-22: T-E6 extended with entry-date letterSpacing + entry-body fontWeight + lineHeight per I-5) | diary-page.spec.ts | **6** |
| AC-024-PAGE-HERO | T-P1 (hero-title text + CSS) / T-P2 (hero-subtitle text + CSS) / T-P3 (hero-divider backgroundColor) | diary-page.spec.ts | **3** |
| AC-024-CONTENT-WIDTH | T-C1 (1920 viewport maxWidth 1248) / T-C2 (1440 viewport) / T-C3 (1248 boundary) / T-C4 (800 / 1024 / 1200 no-overflow) / T-C5 (390 mobile no-overflow) / T-C6 (390 mobile DiaryMarker + DiaryRail computed `display:none` — R2 2026-04-22 added per I-1 / I-2) | diary-page.spec.ts | **6** |
| AC-024-LOADING-ERROR-PRESERVED | T-L1 (slow-network loading visible + role/label) / T-L2a (404 error + role=alert + message + Retry) / T-L2b (500 error + status-aware message) / T-L3 (empty state text) / T-L4 (Retry enabled when !loading, disabled during in-flight refetch — R2 2026-04-22 added `toBeDisabled()` assertion per D-2) / T-L5 (long error message no-overflow + Retry visible on mobile) | diary-page.spec.ts | **6** |
| AC-024-REGRESSION | Handled by keeping K-017 / K-021 / K-023 / K-028 Sacred specs + full suite regression | (cross-spec) | Implicit (not new count) |

**Playwright new test total: 5 + 9 + 6 + 6 + 3 + 6 + 6 = 41 total** (R2 fix-bundle 2026-04-22: LOADING-ERROR-PRESERVED unblocked with 6 full specs replacing 2 stubs; CONTENT-WIDTH gained T-C6 per I-1/I-2; ENTRY-LAYOUT T-E6 extended per I-5 but row count unchanged; HOMEPAGE-CURATION shipped with 5 tests — Phase 3 adjustment from original 4-row plan for K-028 Sacred 0-entry clause split).

**Vitest new test total: 4 spec files × (~3–6 cases each) ≈ 15–25 Vitest cases. Exact count determined at Engineer implementation.**

**Self-Check (AC ↔ Test Count Cross-Check gate):**
- Ticket AC total declared Playwright-necessary ACs: 7 (HOMEPAGE-CURATION, DIARY-PAGE-CURATION, TIMELINE-STRUCTURE, ENTRY-LAYOUT, PAGE-HERO, CONTENT-WIDTH, LOADING-ERROR-PRESERVED — unblocked in Round 2). REGRESSION is multi-spec wrapper.
- Expected test rows: 5 + 9 + 6 + 6 + 3 + 6 + 6 = **41** (R2 2026-04-22 update).
- Test total declared above: **41** ✓
- All PM-split ACs: only HOMEPAGE-CURATION-boundary is split (0 / 1 / 2 / 3+) — each subcase is a separate test ID ✓
- Count-vs-count: text total `41` ≡ table row sum `41` ≡ Declared test total "41" ✓

Engineer cross-check: on final delivery, `wc -l`/grep `test(` in diary-page.spec.ts + diary-homepage.spec.ts must equal 41 (actual: 36 + 5 = 41 ✓ as of R2 2026-04-22).

### 7.4 Test fixtures

Per AC-024-DIARY-PAGE-CURATION L236–238: boundary specs use `page.route('**/diary.json', ...)` fulfill-mocks; production diary.json not modified for tests.

**Fixture directory:** `frontend/e2e/_fixtures/diary/` (existing `_fixtures/` dir reused).

| Fixture file | Entry count | Shape | Used by |
|--------------|------------|-------|---------|
| `diary-empty.json` | 0 | `[]` | T-H2 (Homepage empty section hidden), T-D3 (DiaryPage empty state) |
| `diary-one.json` | 1 | 1 entry with ticketId | T-H3, T-D4 |
| `diary-two-same-date.json` | 2 | Tie-break | T-H1 tie-break assertion |
| `diary-three.json` | 3 | 3 entries | T-H4 (if applicable), T-D5 |
| `diary-five.json` | 5 | exactly 5 | T-D6 |
| `diary-ten.json` | 10 | exactly 10 | T-D7 |
| `diary-eleven.json` | 11 | exactly 11 | T-D8 |
| `diary-double-click.json` | 10 | for T-D9 rapid-click | T-D9 |

Production `frontend/public/diary.json` (post-Phase-1 flattened) is what most non-boundary specs run against (as per current pattern).

---

## 8 Route Impact Table (global style / schema change)

Per persona "Global Style Route Impact Table" rule: any sitewide schema change (diary.json shape) must enumerate all routes.

The diary.json schema change is NOT a global CSS change but IS a global data-shape change affecting any route that reads diary.json.

| Route | Status | Notes |
|-------|--------|-------|
| `/` | **affected** | HomePage → DevDiarySection consumes flat schema via `useDiary(3)`. Phase 2 reshape. |
| `/app` | unaffected | `/app` does not render diary content (K-030 isolated tool page). |
| `/about` | unaffected | No diary.json consumer. |
| `/diary` | **affected (primary)** | Entire page rewrite Phase 3. |
| `/business-logic` | unaffected | No diary.json consumer. |
| `*` (SPA catch-all) | unaffected | redirect only. |

**Grep verification:** `grep -rn "diary.json\|DiaryMilestone\|DiaryItem\|DiaryEntry" frontend/src/` — only `hooks/useDiary.ts`, `types/diary.ts`, `pages/DiaryPage.tsx`, `pages/HomePage.tsx`, `components/diary/*`, `components/home/DevDiarySection.tsx`. Confirms 2 routes affected, no others.

**No CSS-based sitewide change in this ticket.** `tailwind.config.js` and `index.css` are NOT touched.

---

## 9 Cross-page Duplicate Audit (mandatory — per persona)

Per persona "Cross-Page Duplicate Audit" rule: new components must be grep'd for semantic duplicates.

### 9.1 New components introduced

Listed with deduplication audit:

| Component | Semantic peers grep'd | Decision | Reason |
|-----------|----------------------|----------|--------|
| `DiaryHero` | `grep -rn "hero-title\|Hero" frontend/src/components/` → finds `HeroSection` (homepage). DOM/purpose different (homepage hero is marketing; diary hero is article-style). No extractable primitive. | **keep inline to /diary** | Page-specific content |
| `DiaryTimeline` | Searched. No other timeline component in codebase. | **page-specific** | |
| `DiaryRail` | `grep -rn "data-testid=\"diary-rail\"\|diaryRail\|DiaryRail" frontend/src/` → finds inline `DevDiarySection.tsx` L66–68. **Near-duplicate confirmed.** | **extract to shared primitive** (`components/diary/timelinePrimitives.ts` + `components/diary/DiaryRail.tsx`); DevDiarySection imports `<DiaryRail />` | visual-spec.json `crossFrameConsistency.sharedPrimitives` mandates identical rail across frames. Inline-twice = drift risk. |
| `DiaryMarker` | `grep -rn "data-testid=\"diary-marker\"\|diary-marker" frontend/src/` → finds `DevDiarySection.tsx` L79–83. **Near-duplicate confirmed.** | **extract to shared component**; both `DevDiarySection` and `DiaryEntryV2` import `<DiaryMarker />` | Same cross-frame consistency requirement. |
| `DiaryEntryV2` | No peer: DevDiarySection's inline entry render is Homepage-only (has different 3-column layout; reuses marker + font tokens but not the whole layout tree). | **page-specific** to /diary | Homepage uses inline since it's a different curation-level component |
| `DiaryLoading` | `grep LoadingSpinner` → found in `DiaryPage.tsx`, `DevDiarySection.tsx`, `AppPage.tsx`. **Reuses existing `<LoadingSpinner label=... />` inside a thin wrapper** for data-testid. No further extraction. | **thin wrapper, scope /diary** | Cannot alter LoadingSpinner's dark-theme without touching 3 consumers — out of scope |
| `DiaryError` | `grep ErrorMessage` → found same 3 consumers. **Reuses existing `<ErrorMessage>` inside thin wrapper** for data-testid. | **thin wrapper, scope /diary** | Same as above |
| `DiaryEmptyState` | No peer — no other page has empty-state for diary. | **page-specific** | |
| `LoadMoreButton` | No peer — no other paginated view in codebase. | **page-specific** | |

**Net:** 2 shared primitives (`DiaryRail`, `DiaryMarker`), 7 page-specific to /diary, 0 existing-component merges.

### 9.2 Shared constants file — `timelinePrimitives.ts`

See §6.5 — exports RAIL / MARKER / ENTRY_TYPE const objects. Both DevDiarySection (inline render) and DiaryEntryV2 + DiaryRail / DiaryMarker consume these constants. Single source of truth per cross-frame consistency.

---

## 10 File change list (surgical)

Columns: Path / Action / Before behavior / After behavior / Line delta est / Phase.

### Phase 1 files

| Path | Action | Before | After | LOC delta | Phase |
|------|--------|--------|-------|-----------|-------|
| `frontend/package.json` | MOD | no zod dep | `"zod": "^3.x"` added | +1 | 1 |
| `frontend/package-lock.json` | MOD | — | zod + deps | auto | 1 |
| `frontend/src/types/diary.ts` | REWRITE | `DiaryItem` + `DiaryMilestone` (nested) | `DiaryEntry` + zod schema `DiaryEntrySchema` + `DiaryJsonSchema` | ~−10 / +60 | 1 |
| `frontend/public/diary.json` | REWRITE | 16 milestones nested, mixed Ch/En | flat array, all English, legacy-merged | all-content-rewrite, ~−100 / +150 | 1 |
| `frontend/src/utils/diarySort.ts` | ADD | — | sortDiary() pure fn | +30 | 1 |
| `frontend/src/__tests__/diary.schema.test.ts` | ADD | — | zod validation test (all entries parse; strict mode rejects extra) | +80 | 1 |
| `frontend/src/__tests__/diary.english.test.ts` | ADD | — | CJK regex test | +40 | 1 |
| `frontend/src/__tests__/diary.legacy-merge.test.ts` | ADD | — | exact-1 missing-ticketId, word count 50–100 | +50 | 1 |
| `frontend/src/__tests__/diarySort.test.ts` | ADD | — | sort + tie-break tests | +60 | 1 |

### Phase 2 files

| Path | Action | Before | After | LOC delta | Phase |
|------|--------|--------|-------|-----------|-------|
| `frontend/src/hooks/useDiary.ts` | REWRITE | returns `DiaryMilestone[]`, no zod, no sort | returns `DiaryEntry[]`, zod.parse, sortDiary applied | ~−10 / +15 | 2 |
| `frontend/src/hooks/useDiaryPagination.ts` | ADD | — | 5/+5 pagination hook with concurrency gate | +60 | 2 |
| `frontend/src/components/home/DevDiarySection.tsx` | MOD | consumes `milestones: DiaryMilestone[]`, reads `m.milestone / m.items[0]` | consumes `entries: DiaryEntry[]`, reads `e.ticketId / e.title / e.date / e.text`; title template `${id} — ${title}`; rail hidden on 1-entry | ~−30 / +35 | 2 |
| `frontend/src/pages/HomePage.tsx` | MOD | passes `{ milestones: entries, ... }` | passes `{ entries, ... }` | ±1 | 2 |

### Phase 3 files

| Path | Action | Before | After | LOC delta | Phase |
|------|--------|--------|-------|-----------|-------|
| `frontend/src/pages/DiaryPage.tsx` | REWRITE | loads `<DiaryTimeline milestones>` | loads new `<DiaryPage>` tree (Hero + Timeline + LoadMore) with pagination | ~−20 / +80 | 3 |
| `frontend/src/components/diary/DiaryTimeline.tsx` | REWRITE | map milestones → MilestoneSection | `<ol role="list">` with `<DiaryRail>` + `<li><DiaryEntryV2>` | ~−15 / +35 | 3 |
| `frontend/src/components/diary/DiaryEntry.tsx` | DELETE | old entry flex row | — | −15 | 3 |
| `frontend/src/components/diary/MilestoneSection.tsx` | DELETE | accordion | — | −33 | 3 |
| `frontend/src/components/diary/DiaryHero.tsx` | ADD | — | Hero with title + divider + subtitle | +40 | 3 |
| `frontend/src/components/diary/DiaryEntryV2.tsx` | ADD | — | new 3-layer entry component | +80 | 3 |
| `frontend/src/components/diary/DiaryRail.tsx` | ADD | — | shared primitive rail | +20 | 3 |
| `frontend/src/components/diary/DiaryMarker.tsx` | ADD | — | shared primitive marker | +20 | 3 |
| `frontend/src/components/diary/DiaryLoading.tsx` | ADD | — | LoadingSpinner wrapper with `data-testid="diary-loading"` | +20 | 3 |
| `frontend/src/components/diary/DiaryError.tsx` | ADD | — | ErrorMessage wrapper with `data-testid="diary-error"` + canonical literal | +30 | 3 |
| `frontend/src/components/diary/DiaryEmptyState.tsx` | ADD | — | empty state literal | +15 | 3 |
| `frontend/src/components/diary/LoadMoreButton.tsx` | ADD | — | Load more button | +30 | 3 |
| `frontend/src/components/diary/timelinePrimitives.ts` | ADD | — | RAIL / MARKER / ENTRY_TYPE const object | +30 | 3 |
| `frontend/src/components/home/DevDiarySection.tsx` | MOD (secondary Phase 3) | inline rail+marker | import `<DiaryRail>` + `<DiaryMarker>` from `components/diary/` | ~−15 / +8 | 3 |
| `frontend/e2e/diary-mobile.spec.ts` | DELETE | K-027 accordion tests | — | −353 | 3 |
| `frontend/e2e/pages.spec.ts` | MOD | AC-DIARY-1 three tests target accordion | AC-DIARY-1 rewritten: hero title visible + at least one `data-testid="diary-entry"` visible + Load more present when entries > 5 | ~−40 / +30 | 3 |
| `frontend/e2e/diary-page.spec.ts` | ADD | — | 29 + 2-stubs Playwright tests (§7.3) | +800 | 3 |
| `frontend/e2e/diary-homepage.spec.ts` | ADD | — | 4 Playwright tests | +150 | 3 |
| `frontend/e2e/_fixtures/diary/diary-empty.json` | ADD | — | `[]` | +1 | 3 |
| `frontend/e2e/_fixtures/diary/diary-one.json` | ADD | — | 1 entry | +10 | 3 |
| `frontend/e2e/_fixtures/diary/diary-two-same-date.json` | ADD | — | 2 entries, same date | +15 | 3 |
| `frontend/e2e/_fixtures/diary/diary-three.json` | ADD | — | 3 entries | +20 | 3 |
| `frontend/e2e/_fixtures/diary/diary-five.json` | ADD | — | 5 entries | +30 | 3 |
| `frontend/e2e/_fixtures/diary/diary-ten.json` | ADD | — | 10 entries | +60 | 3 |
| `frontend/e2e/_fixtures/diary/diary-eleven.json` | ADD | — | 11 entries | +65 | 3 |
| `frontend/e2e/_fixtures/diary/diary-double-click.json` | ADD | — | 10 entries, used by rapid-click test | +60 | 3 |

### Phase 4 files

| Path | Action | Before | After | LOC delta | Phase |
|------|--------|--------|-------|-----------|-------|
| `~/.claude/agents/pm.md` | MOD | `"K-023 上線後生效"` string | `"K-024 上線後生效"` | +0 (text swap) | 4 (PM-only at ticket close) |

**Total estimated:**
- New files: 24
- Modified files: 8
- Deleted files: 3
- Net LOC: ~+2100 / −~600 = net ~+1500

---

## 11 API contract (backend unchanged)

**No backend changes.** diary.json is a static asset served by frontend build. No FastAPI endpoint touched. snake_case ↔ camelCase mapping table unchanged (diary data is already camelCase in the new flat schema: `ticketId`, no snake↔camel boundary because there is no backend).

**Wire-level diff:** `git diff main -- backend/` expected = 0 lines. Engineer verifies with `git diff main --name-only` at each phase.

**Frontend observable behavior diff (wire-level-equivalent of Architect persona "Pre-Design Dry-Run Proof" Gate 3):**

| Observable output | OLD (main) | NEW (post-K-024) | Diff rows |
|-------------------|-----------|-----------------|----------|
| `useDiary().entries` type | `DiaryMilestone[]` | `DiaryEntry[]` | full-set (all 16 milestones → N flat entries) / subset (useDiary(3) → 3 newest flat entries) / empty ([] → []) / boundary (useDiary(0) → []) — 4 rows covered in §0.3 |
| `DevDiarySection` DOM structure | renders `m.milestone + m.items[0].text` | renders `e.ticketId ? "K-X — title" : title + e.date + e.text` | full-set / 1-entry rail-hidden / 0-entry section-hidden — 3 rows |
| `DiaryPage` render | `<DiaryTimeline>` (accordion) | `<DiaryHero>` + `<DiaryTimeline>` (ol/li) + `<LoadMoreButton>` | full-set / empty / 1-entry / 5-entry-no-button / 10-entry-after-click — 5 rows |

**All diff rows are intentional** (required by AC-024-SCHEMA + AC-024-HOMEPAGE-CURATION + AC-024-DIARY-PAGE-CURATION + AC-024-TIMELINE-STRUCTURE). No accidental regression.

---

## 12 Tech Debt log (new entries from this design)

To append to `docs/tech-debt.md` by PM at ticket close:

| ID (proposed) | Description | Severity | Trigger |
|---------------|-------------|----------|---------|
| TD-K024-01 | LoadingSpinner retains `bg-[#0D1117]` dark-theme residue; K-021 paper palette migration pending | low | Future LoadingSpinner consumer polish; optional in K-024 scope — noted in DiaryLoading wrapper |
| TD-K024-02 | ErrorMessage.tsx retains `text-red-400` dark-optimized error color; paper palette re-eval | low | Same as above |

**No scope drift:** K-024 keeps LoadingSpinner / ErrorMessage visuals unchanged (inherits 3 consumers: DiaryPage, DevDiarySection, AppPage). Scope expansion requires PM ruling.

---

## 13 Implementation order (Engineer)

### Phase 1 + Phase 2 (combined PR)

1. `npm install zod` in `frontend/`
2. Write new `frontend/src/types/diary.ts` (types + zod schemas + sortDiary import stub)
3. Write new `frontend/src/utils/diarySort.ts`
4. Rewrite `frontend/public/diary.json` with flat schema + translation + legacy merge
5. Write 4 Vitest spec files
6. `npm test` — all pass
7. Rewrite `frontend/src/hooks/useDiary.ts`
8. Write `frontend/src/hooks/useDiaryPagination.ts`
9. Reshape `frontend/src/components/home/DevDiarySection.tsx` — consume `DiaryEntry[]`; title em-dash template; rail hidden on 1-entry; entry wrapper renders single `data-testid="diary-entry-wrapper"` (K-028 Sacred reused for AC-024-HOMEPAGE-CURATION per BQ-024-01 PM ruling (b) 2026-04-22); NO second testid, NO `data-homepage-entry` attr
10. Update `frontend/src/pages/HomePage.tsx` prop name if needed
11. `npx tsc --noEmit` — exit 0
12. `/playwright` — K-028 + K-023 Sacred specs pass; old AC-DIARY-1 may fail (accept temporarily — will be rewritten in Phase 3; add `test.skip` marker)
13. Commit Phase 1+2 as one PR; PR review reorganized per-phase via file diff

### Phase 3 (separate PR)

1. Delete `MilestoneSection.tsx`, `DiaryEntry.tsx` (old)
2. Add `timelinePrimitives.ts`, `DiaryRail.tsx`, `DiaryMarker.tsx`
3. Reshape `DevDiarySection.tsx` to import `<DiaryRail>` + `<DiaryMarker>` (removes inline duplicates)
4. Add `DiaryHero.tsx`, `DiaryEntryV2.tsx`, `DiaryLoading.tsx`, `DiaryError.tsx`, `DiaryEmptyState.tsx`, `LoadMoreButton.tsx`
5. Rewrite `DiaryTimeline.tsx` (`<ol>` + map)
6. Rewrite `DiaryPage.tsx`
7. `npx tsc --noEmit` — exit 0
8. Add `frontend/e2e/_fixtures/diary/*.json` (8 fixtures)
9. Write `frontend/e2e/diary-page.spec.ts` (29 tests + 2 stubs)
10. Write `frontend/e2e/diary-homepage.spec.ts` (4 tests)
11. Rewrite `pages.spec.ts` AC-DIARY-1 three tests (three → three rewrite)
12. Delete `frontend/e2e/diary-mobile.spec.ts`
13. `/playwright` — full suite passes (excluding 2 stubs)
14. Commit Phase 3 as separate PR

### Phase 4 (PM at ticket close)

1. `Edit ~/.claude/agents/pm.md`, replace literal `"K-023 上線後生效"` → `"K-024 上線後生效"`
2. Log diff in ticket `## Retrospective` per ticket L410 checklist
3. Mark AC-024-PM-PERSONA-SYNC line L362 as `Closed YYYY-MM-DD`

---

## 14 Boundary Pre-emption (persona gate — hardened)

| Scenario | Handled? | Location |
|----------|---------|----------|
| Empty `diary.json` (`[]`) | ✅ | §4.3 (Homepage section hidden), §6.1 + §6.3 DiaryEmptyState |
| 1-entry fixture | ✅ | §4.3.1 rail hidden, §7.4 fixture |
| 2-entry tie-break (same date) | ✅ | §3.5 sortDiary array-index, §7.4 fixture |
| Schema violation (extra key / zh entry) | ✅ | §4.1 zod error path → DiaryError rendered |
| Rapid double-click Load More | ✅ | §4.2 concurrency gate |
| Network 404 | ✅ | §6.3 DiaryError canonical literal |
| Network timeout | ✅ | §6.3 single-fetch, browser default, no auto-retry |
| Schema valid but date is calendar-invalid (9999-13-45) | ✅ | §3.2 zod refine |
| Mobile viewport (<640px) rail visibility | ✅ | §6.8 hidden |
| Tablet viewport (480–1247px) overflow | ✅ | §6.8 AC-024-CONTENT-WIDTH no-overflow constraint |
| Load More button disappears vs disabled on exhaustion | ✅ | §6.3 removed from DOM; §6.7 rationale |
| K-027 K-028 Sacred asserts (marker shape / count / bg / radius) | ✅ | §7.1 / §6.2 preserved |
| SSR hydration mismatch | N/A | Vite SPA — no SSR |
| Server-side diary mutation mid-click | N/A | Static asset, client-side slicing only |
| data-testid literal conflict (BQ-024-01) | ✅ | §6.4 RESOLVED 2026-04-22: PM ruled (b) — K-024 AC literal renamed to `diary-entry-wrapper` (reuse K-028 Sacred); Phase 2 unblocked |

Any ⚠️ = BQ to PM. All ✅ = design-complete.

---

## 15 Refactorability Checklist

- [x] **Single responsibility:** each new component does one thing (Hero / Rail / Marker / Timeline / Entry / LoadMore / Loading / Error / EmptyState each one concern)
- [x] **Interface minimization:** DiaryEntryV2 receives `{ entry }` only; no manager-prop bloat; LoadMoreButton accepts `{ onClick, disabled }` only
- [x] **Unidirectional dependency:** useDiary → useDiaryPagination → Timeline; no component writes back to hooks
- [x] **Replacement cost:** zod can be swapped to another validator with changes in 2 files (`types/diary.ts` + consumer `useDiary.ts`). LoadingSpinner / ErrorMessage wrappers (DiaryLoading / DiaryError) isolate the /diary surface from those components' dark-theme residue, so swapping LoadingSpinner doesn't touch diary contract.
- [x] **Clear test entry point:** every component has data-testid or role attribute for Playwright; every util has pure-fn Vitest entry
- [x] **Change isolation:** visual-spec.json changes propagate via `timelinePrimitives.ts` constant file — one edit, two consumers

---

## 16 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| 1 | ✅ N/A (no backend change) | ✅ N/A (data-layer only) | ✅ N/A | ✅ zod schema = data type interface |
| 2 | ✅ N/A | ✅ `/` + `/diary` identified | ✅ §4.3 + §4.4 boundary | ✅ §4.1 useDiary / §4.2 useDiaryPagination / §4.3 DevDiarySection props |
| 3 | ✅ N/A | ✅ `/diary` full tree | ✅ §6.1 + §6.2 | ✅ §6.3 all component props |
| 4 | ✅ N/A | ✅ N/A (persona-only) | ✅ N/A | ✅ N/A |

All ✅ — no Phase released with blanks.

---

## 17 Architect Self-Diff Verification (for architecture.md edits in §19)

### Self-Diff — architecture.md edits (executed 2026-04-22)

- **Sections edited:** frontmatter `updated:`, §Summary bullet, Directory Structure `public/` + `e2e/` + `types/` + `hooks/` + `utils/` + `__tests__/` + `diary/` blocks, §Key Data Models `types/diary.ts` snippet, §Frontend Routing `/` + `/diary` rows, §Design System Footer placement table `/diary` row, §Changelog prepend
- **Source of truth:** §10 File change list (this design doc) + `ls frontend/src/components/diary/` (confirms only `DiaryTimeline.tsx` / `MilestoneSection.tsx` / `DiaryEntry.tsx` on disk) + `docs/designs/K-024-diary-structure.md` §3.1 schema + §6.1/§6.2 component tree + §7.3 test count (33)
- **Row count comparison (Directory Structure diary/ block):** **12 entries after edit** (DiaryTimeline / MilestoneSection / DiaryEntry + 8 new components + timelinePrimitives.ts) vs §10 Phase 3 additions = 8 new files + 1 const module + 1 rewrite + 2 deletion markers = **12 entries** ✓
- **Row count comparison (e2e/ block):** 10 entries after edit (business-logic / pages / ma99-chart / navbar / diary-page NEW / diary-homepage NEW / diary-mobile PENDING-DEL / visual-report + _fixtures/diary + fixtures) vs §10 = diary-page(new) + diary-homepage(new) + diary-mobile(delete marker) + _fixtures/diary(new) = 4 K-024 changes ✓
- **Row count comparison (__tests__/ block):** 12 entries after edit (7 existing + 5 new Vitest specs) vs §10 Phase 1+2 Vitest spec count = 5 new files ✓
- **Same-file cross-table sweep:** `grep 'DiaryMilestone|DiaryItem|MilestoneSection|DiaryEntry.tsx|diary-mobile|diary/' agent-context/architecture.md` hit 18 locations — all verified:
  - L18 (K-017 Summary bullet) — historical statement of K-017 state at that time; preserved
  - L20 (K-024 Summary bullet added by this edit) ✓
  - L78 (public/diary.json) ✓
  - L88 (diary-mobile.spec.ts pending deletion) ✓
  - L91 (_fixtures/diary new) ✓
  - L99 (types/diary.ts reshape) ✓
  - L162–174 (diary/ block 12 entries) ✓
  - L175 (primitives/ diary/ 未落地 historical comment — preserved per Same-File Cross-Table rule: statement was correct at K-017 Pass 2 time)
  - L310–314 (§Key Data Models: OLD `DiaryItem`/`DiaryMilestone` kept visible + NEW `DiaryEntry` appended with migration note) ✓
  - L631 (Changelog new entry) ✓
  - L641 (K-027 Changelog — historical, preserved)
  - L645 (K-017 Pass 2 Changelog — historical, preserved)
  - L674 (Retrospective prose — historical)
- **Discrepancy:** None found.
- **Self-Diff verdict:** ✓ pass.

---

## 18 DoD Checklist (non-Playwright-measurable items)

| Item | Type | Owner | Gate |
|------|------|-------|------|
| `~/.claude/agents/pm.md` literal `"K-023 上線後生效"` → `"K-024 上線後生效"` | one-line Edit (Phase 4) | PM | ticket close |
| PM auto-trigger table in pm.md updated to match the literal | PM scans pm.md for other stale "K-023" references | PM | ticket close |
| Ticket `## Retrospective` PM section records before/after diff of pm.md edit | ticket edit | PM | ticket close |
| AC-024-PM-PERSONA-SYNC reclass section notes `Closed YYYY-MM-DD` | ticket edit | PM | ticket close |
| TD-K024-01 / TD-K024-02 appended to `docs/tech-debt.md` | doc edit | PM | ticket close |
| `agent-context/architecture.md` updated (diary.json schema + DevDiarySection shape + new diary components directory + primitives/timelinePrimitives.ts entry) | doc edit + Self-Diff + same-file cross-table sweep | Architect | ticket close |
| `docs/retrospectives/architect.md` prepended entry for K-024 | doc edit | Architect | design-complete (this delivery) |
| QA Early Consultation R2 run after Phase 3 delivery, covering AC-024-LOADING-ERROR-PRESERVED + 2 deferred stub specs | QA consultation | PM + QA | Engineer → Code Reviewer → QA pipeline |

---

## 19 Architecture Doc Sync Plan

Before task-complete: Edit `agent-context/architecture.md`:

1. **Summary section update** — note K-024 diary rework (diary.json flat schema + /diary v2 timeline + 3-entry homepage curation)
2. **Directory Structure diary/ block update**:
   - Remove: `MilestoneSection.tsx`, `DiaryEntry.tsx` (with "pending deletion (K-024 Phase 3 step 1)" marker since Engineer hasn't run yet)
   - Add: `DiaryHero.tsx`, `DiaryEntryV2.tsx`, `DiaryRail.tsx`, `DiaryMarker.tsx`, `DiaryLoading.tsx`, `DiaryError.tsx`, `DiaryEmptyState.tsx`, `LoadMoreButton.tsx`, `timelinePrimitives.ts` (all pending)
   - Keep: `DiaryTimeline.tsx` (pending rewrite — note in inline comment)
3. **Directory Structure hooks/ block** — add `useDiaryPagination.ts` pending
4. **Directory Structure utils/ block** — add `diarySort.ts` pending
5. **Directory Structure public/ block** — add note that `diary.json` schema changes to flat array (post-K-024 Phase 1)
6. **Directory Structure types/ block** — note `DiaryEntry` replacing `DiaryMilestone`/`DiaryItem`
7. **Directory Structure __tests__/ block** — add 4 new Vitest spec files pending
8. **Directory Structure e2e/ block** — add `diary-page.spec.ts`, `diary-homepage.spec.ts`, `_fixtures/diary/*` pending; flag `diary-mobile.spec.ts` for deletion
9. **Frontend Routing `/diary`** — update description: `v2 timeline (flat schema; Hero + rail + marker + 3-layer entries + Load more pagination)`
10. **Frontend Routing `/`** — update DevDiarySection note: `consumes DiaryEntry flat schema from useDiary(3) after K-024 Phase 2`
11. **Add Changelog row:** `2026-04-22 (Architect, K-024 design) — /diary v2 timeline rework + diary.json flat schema. New types/diary.ts shape: DiaryEntry { ticketId?, title, date, text }. Phase 1 zod validation + English-only + legacy-merge. Phase 2 useDiary returns sorted DiaryEntry[]; new useDiaryPagination hook. Phase 3 adds components/diary/{DiaryHero,DiaryEntryV2,DiaryRail,DiaryMarker,DiaryLoading,DiaryError,DiaryEmptyState,LoadMoreButton,timelinePrimitives.ts}; deletes MilestoneSection+old DiaryEntry; rewrites DiaryTimeline; DevDiarySection consumes shared primitives. Two new E2E specs (29 + 4 tests); 1 deleted (diary-mobile.spec.ts).`
12. **updated frontmatter:** `2026-04-22 (K-024 Architect design)`

All 11 sections in `agent-context/architecture.md` will be edited. Self-Diff Verification block at end of §19 below.

---

## 20 Retrospective

**Where most time was spent:** §6.4 data-testid contract resolution. The K-028 Sacred `diary-entry-wrapper` vs AC-024-HOMEPAGE-CURATION literal `homepage-diary-entry` conflict took three iterations to crystallize into BQ-024-01. Initial reflex was to do (C) dual-attribute, but HTML spec disallows duplicate `data-testid`. Recommendation flipped to (a) rename-K-028-Sacred only after confirming Phase 3 rewrites `pages.spec.ts` anyway — making the Sacred update seem cheap. **PM ruled (b) — AC literal edit — inverting Architect's recommendation.** PM rationale (ticket §放行狀態 PM 裁決紀錄): K-028 closed 2026-04-21, deployed, live CDN bundle grep-verified contains `diary-entry-wrapper` → Sacred immutability is absolute; Option (a)'s "cheap because Phase 3 rewrites pages.spec.ts anyway" argument missed that Sacred is about **deployed contract immutability**, not just spec-file touchability. AC literal edit is PM-owned per `feedback_ticket_ac_pm_only` and costs zero Sacred integrity.

**Which decisions needed revision:** BQ-024-01 drafted twice — first with incorrect "dual data-testid" hypothesis, then corrected to HTML-valid alternatives. Architect's recommendation (a) was also the wrong primary suggestion given Sacred immutability is a closed + deployed contract concept. Should have ordered the options as (b) → (c) → (a) with (a) flagged "requires PM Sacred-break override", not "Architect recommendation".

**Next time improvement:**
1. When AC literal specifies a `data-testid` value that overlaps with an existing **closed + deployed** Sacred value on the same element, the BQ's cheapest resolution is almost always an AC literal rename (PM-owned, zero Sacred breakage, zero extra DOM). Propose this as the **primary** recommendation, not as fallback option (b). A Sacred-breaking rename should always be the option-of-last-resort when the Sacred contract is live on CDN.
2. HTML spec sanity check for testid conflicts must run in the first pass of §data-testid contract section — not second pass after writing the initial recommendation.
3. Both learnings codified in `docs/retrospectives/architect.md` K-024 entry and (if pattern recurs in K-025+) as `~/.claude/agents/senior-architect.md` §Testid / Sacred-vs-AC Conflict Resolution rule: "deployed Sacred value + conflicting AC literal → primary recommendation is AC literal edit; Sacred rename requires explicit PM override and must be flagged as such".

---

## 21 Self-Diff Verification (mandatory, per persona)

### Self-Diff — design doc vs ticket AC + visual-spec.json

- **Section audited:** §6.5 visual-spec role → CSS property mapping (table), §7.3 test count mapping (table)
- **Source of truth:**
  - `docs/designs/K-024-visual-spec.json` frames[0].components (10 roles) + frames[1].components
  - `docs/tickets/K-024-diary-structure-and-schema.md` AC block (11 AC + 2 deferred/DoD)
- **§6.5 role → CSS mapping row count:** 32 rows covering 8 roles × ~4 CSS properties each
  - visual-spec role enum: hero-title / hero-divider / hero-subtitle / rail / marker / entry-title / entry-date / entry-body = **8 roles** ✓
  - cross-reference VISUAL-SPEC-SCHEMA.md Role Enum: 10 total (hero-title + hero-divider + hero-subtitle + rail + marker + entry-title + entry-date + entry-body + navbar + footer). K-024 doesn't use navbar (comes from K-021 UnifiedNavBar — unchanged) nor footer (ticket L380 AC-017-FOOTER confirms no footer on /diary). **8/10 roles relevant to K-024 ✓**
- **§7.3 Playwright test count:** HOMEPAGE(4) + DIARY-PAGE-CURATION(9) + TIMELINE(6) + ENTRY-LAYOUT(6) + PAGE-HERO(3) + CONTENT-WIDTH(5) = **33** ✓; declared test total 33 ✓; skipped stubs 2 (LOADING-ERROR R2) ✓
- **Discrepancy:** None found.

### Self-Diff — §5 K-027 inheritance vs K-027 §6

- **§5 table row count:** 5 rows
- **K-027 §6 table row count:** 5 rows (file `docs/designs/K-027-mobile-diary-layout.md` L312–318)
- **Cell-by-cell:** 5 items (Mobile breakpoint / DiaryEntry mobile layout / Milestone spacing / overflow-hidden / break-words) match ✓

### Self-Diff — §10 file change list vs §13 implementation order

- **§10 Phase 1+2 files:** 14 rows (listed above)
- **§13 Phase 1+2 steps:** 13 steps (1→13); each modifies or adds exactly one file (except step 1 `npm install` which affects package.json + lock file = 2 files)
- **Expected file count from §13:** 14 (types/diary.ts, diarySort.ts, diary.json, 4 test files, useDiary.ts, useDiaryPagination.ts, DevDiarySection.tsx, HomePage.tsx, package.json, package-lock.json) = **14** ✓
- **§10 Phase 3 files:** 24 rows (delete 3, modify 2, add 19)
- **§13 Phase 3 steps:** 14 steps (1→14); step coverage touches all 24 §10 rows (add primitives/rail/marker in step 2, reshape DevDiarySection in step 3, add 6 new components in step 4, rewrite DiaryTimeline in step 5, rewrite DiaryPage in step 6, add 8 fixtures in step 8, add 2 specs in step 9–10, rewrite pages.spec.ts in step 11, delete diary-mobile.spec.ts in step 12). ✓
- **Discrepancy:** None found.
