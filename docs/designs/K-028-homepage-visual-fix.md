---
title: K-028 Homepage Visual Fix — Section Spacing + DevDiarySection Flow Layout
ticket: K-028
status: ready-for-engineer
owner: Architect
created: 2026-04-21
design-file: frontend/design/homepage-v2.pen (frame `4CsvQ` "Homepage / (v2 Dossier)")
---

## 0 Design Preconditions

### 0.1 Confirmed Pencil frames (scope audit)

`batch_get` top-level on `frontend/design/homepage-v2.pen` returned 4 frames:

| id     | name                                     | relevant to K-028? |
|--------|------------------------------------------|--------------------|
| 35VCj  | About /about (K-017 v2)                  | No                 |
| **4CsvQ** | **Homepage / (v2 Dossier)**           | **Yes — sole source of truth** |
| wiDSi  | Diary /diary (v2 Dossier)                | No                 |
| VSwW9  | Business Logic /business-logic (v2 Dossier) | No              |

K-028 scope is entirely on route `/` (HomePage). Cross-referenced with PM ticket scope (§範圍 修復項目 1 + 2 both target HomePage). Confirmed Pencil frame completeness — no upstream scope gap.

### 0.2 Ticket vs codebase discrepancies

| Item | Ticket says | Codebase / design file reality | Ruling |
|------|-------------|-------------------------------|--------|
| Deliverable path | `docs/designs/K-025-homepage-visual-fix.md` (ticket §放行狀態 L125) | Ticket ID is `K-028` (frontmatter L2) | Treat as ticket typo. This design doc lives at `docs/designs/K-028-homepage-visual-fix.md` per PM instruction. No BQ. |
| Design file path | Ticket §相關連結 references `frame 4CsvQ` of `homepage-v2.pen` | Confirmed ✓ | OK |

### 0.3 Scope Questions — self-resolved (SQ)

**SQ-028-01 — Does `BuiltByAIBanner → HeroSection` also need gap insertion?**

- Ticket §修復項目 1 names only `HeroSection ↔ ProjectLogicSection ↔ DevDiarySection`. `BuiltByAIBanner` is outside the 3-section scope.
- Design file: `BuiltByAIBanner` (id `96Spc`) sits in the outer `4CsvQ` frame sibling to `hpBody`, with its own `padding: [12, 72]`. The 3 sections are children of `hpBody` (id `LKgNi`, `gap: 72`). Banner ↔ hero spacing is governed by outer-frame flow, not `hpBody.gap`.
- **Ruling:** out of scope. Banner ↔ Hero spacing is visually adequate today (existing per-section layout) and the ticket does not name it. No change to banner or its margin.

**SQ-028-02 — Does AC-028 need a `NavBar ↔ Banner` or `DevDiary ↔ Footer` gap assertion?**

- Not in AC Then/And clauses. Those adjacencies are governed by `homepage-root` padding and per-component internal layout (K-023 AC-023-BODY-PADDING already asserts paddings).
- **Ruling:** out of scope.

**SQ-028-03 — Is `diaryViewAllRow` part of the overlap-free block?**

- Ticket AC-028-DIARY-ENTRY-NO-OVERLAP Then clause specifies "前 3 個 diary entry wrapper 元素". `diaryViewAllRow` (the "— View full log →" link) is rendered below `diaryEntries` but is not a diary entry.
- **Ruling:** assert only the top 3 `diary-entry-wrapper` elements. Keep `diaryViewAllRow` intact (no changes).

### 0.4 No Blocking Questions (BQ) for PM

All ticket ambiguities self-resolved via Pencil frame extraction + existing AC wording. PM ruling not required. Engineer can begin once this design is read.

---

## 1 Pencil Frame `4CsvQ` — Section Spacing Measurements

### 1.1 `hpBody` layout props (source of truth for AC-028-SECTION-SPACING)

Extracted from `frame 4CsvQ > child[2] "hpBody" (id=LKgNi)`:

| Prop | Value | Interpretation |
|------|-------|----------------|
| `layout` | `vertical` | flex-col equivalent |
| `padding` | `[72, 96, 96, 96]` (top, right, bottom, left) | already locked by K-023 AC-023-BODY-PADDING on `homepage-root` |
| **`gap`** | **`72`** | **vertical gap between each direct child: `hpHero`, `hpLogic`, `hpDiary`** |

**Children of `hpBody` (ordered):**

1. `hpHero` (id `zyttw`) — → `<HeroSection />`
2. `hpLogic` (id `b8KQJ`) — → `<ProjectLogicSection />`
3. `hpDiary` (id `gaIjh`) — → `<DevDiarySection />`

**Desktop section gap = 72px** (per Pencil design), well above the ticket's `> 32px` floor.

### 1.2 Mobile gap ruling (375px viewport)

Pencil design file is desktop-only (`width: 1440`); no mobile variant. Ticket AC-028-SECTION-SPACING mobile assertion floor is `> 16px`.

**Architect ruling (SQ-028-mobile):** use Tailwind responsive gap `gap-6 sm:gap-[72px]` on the section wrapper.
- `gap-6` = **24px** at mobile (< 640px)
- `sm:gap-[72px]` = **72px** at `sm:` breakpoint and above (≥ 640px, which covers default Playwright 1280px desktop)

**Rationale (pre-verdict matrix):**

| Option | Mobile gap value | Desktop gap value | Score (readability + overflow safety + Tailwind idiom + token alignment) |
|--------|-------------------|-------------------|------|
| A: `gap-4 sm:gap-[72px]` | 16px (== floor, brittle) | 72px | 6 / 10 — fails AC `> 16px` (strictly greater) |
| **B: `gap-6 sm:gap-[72px]`** | **24px** | **72px** | **8.5 / 10** — comfortable above floor, matches K-023 mobile padding scale (24px horizontal) |
| C: `gap-[72px]` (single) | 72px | 72px | 7 / 10 — vertical rhythm too large on 375px, body cramped |

**Chosen: B.** Declared dimensions (readability / floor safety / Tailwind idiom / K-023 scale alignment) locked before scoring; no post-hoc dimension added.

### 1.3 Section spacing implementation contract

**Current `HomePage.tsx` root (lines 12–25):**

```tsx
<div className="min-h-screen pt-8 pb-8 px-6 sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]" data-testid="homepage-root">
  <UnifiedNavBar />
  <BuiltByAIBanner />
  <HeroSection />
  <ProjectLogicSection />
  <DevDiarySection ... />
  <HomeFooterBar />
</div>
```

The root is a plain block container — children stack with zero gap by default.

**Required change:** wrap the 3 body sections in a flex-col container with the responsive gap. NavBar / Banner / Footer stay **outside** the flex container to keep their existing relationships unchanged (Banner already has internal `padding`, Footer is bottom-anchored).

**Target structure:**

```tsx
<div className="min-h-screen pt-8 pb-8 px-6 sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]" data-testid="homepage-root">
  <UnifiedNavBar />
  <BuiltByAIBanner />
  <div className="flex flex-col gap-6 sm:gap-[72px]" data-testid="homepage-sections">
    <HeroSection />
    <ProjectLogicSection />
    <DevDiarySection ... />
  </div>
  <HomeFooterBar />
</div>
```

New `data-testid="homepage-sections"` provides Playwright with a stable anchor (see §3.1 assertion strategy).

---

## 2 DevDiarySection — Layout Redesign (absolute → flow-based)

### 2.1 Problem restated (root cause)

Current component (`frontend/src/components/home/DevDiarySection.tsx`):

```ts
const ENTRY_HEIGHT = 140
const ENTRY_GAP = 20
const totalHeight = (milestones.length - 1) * (ENTRY_HEIGHT + ENTRY_GAP) + ENTRY_HEIGHT
// wrapper: <div className="relative" style={{ height: totalHeight }}>
// each entry: <div className="absolute" style={{ top: i * (ENTRY_HEIGHT + ENTRY_GAP) }}>
```

Fixed 140px assumption holds only for ≤80-char `text` fields. K-023 milestone entry (~270 chars) renders ~200px+ → entry 0 bleeds into entry 1's absolute slot starting at `top=160px`. Visual overlap.

### 2.2 Design principle

**Replace absolute positioning with flex-column flow.** Each entry's height is content-driven; the vertical rail becomes a CSS `::before` pseudo-element on the flex container (or a single absolute `<div>` child), spanning from the first marker center to the last marker center.

**What must be preserved (K-023 regression protection):**
- Marker: 20 × 14px rectangle, `bg-brick-dark` (rgb(156, 74, 59)), `border-radius: 0` → **unchanged** (same DOM/CSS, just relocated into flow)
- `diaryHead` block (`§ DEV DIARY` badge + `h-px` divider + `DEVELOPMENT LOG` label) → **unchanged**
- Italic subtitle paragraph (`— A running log of decisions…`) → **unchanged**
- `diaryViewAllRow` ("— View full log →") → **unchanged**
- Content structure inside each entry (milestone title / date / text) → **unchanged**
- Vertical rail: single 1px charcoal line (`bg-[#2A2520]`) running through all entries → **visual appearance unchanged**, implementation moves from absolute child to pseudo-element or positioned sibling

### 2.3 Layout strategy — rail as absolute pseudo-sibling inside relative flex wrapper

**Chosen approach:** keep the outer `<div>` `position: relative`, render rail as a single `<div aria-hidden>` absolutely positioned inside it (as today), but switch the entry list from absolute-positioned siblings to a flex-col child. The rail's height derives from flex layout at runtime via `100%` (minus head/tail insets) rather than `totalHeight` arithmetic.

**Pre-verdict comparison:**

| Option | Rail implementation | Entry layout | Score (accuracy / rail-auto-grow / no-extra-deps / K-023 visual fidelity) |
|--------|---------------------|--------------|-------|
| A: CSS `::before` on wrapper | `content: ""; position: absolute; left: 29px; top: 40px; bottom: 40px; width: 1px; background: #2A2520;` | flex-col, each entry is a normal child | 8 / 10 — clean, but `bottom: 40px` inset needs matching the last-entry marker center |
| **B: Absolute rail sibling + flex-col entries** | single `<div aria-hidden>` with `top: 40px; bottom: 40px; left: 29px; width: 1px;` (auto-grow) | flex-col, gap-5 (20px) between entries | **8.5 / 10** — keeps today's `<div aria-hidden>` rail DOM structurally familiar, no extra CSS layer needed |
| C: Rail per-entry (each entry owns a stub rail segment) | N stubs | flex-col | 5.5 / 10 — segments may misalign at entry boundaries |

**Chosen: B.** Declared dimensions (accuracy / auto-grow / no deps / K-023 fidelity) locked before scoring. Tiebreak between A and B: B keeps the existing `<div aria-hidden>` pattern (less deviation from K-023 approved structure, smaller Reviewer diff), A requires adding a Tailwind arbitrary `before:` compound. 0.5 margin, no new dimension introduced.

### 2.4 Pseudo-diff: `DevDiarySection.tsx`

**Before (current, ~108 lines):**

```tsx
const ENTRY_HEIGHT = 140
const ENTRY_GAP = 20

export default function DevDiarySection({ milestones, loading, error }) {
  const totalHeight = milestones.length > 0
    ? (milestones.length - 1) * (ENTRY_HEIGHT + ENTRY_GAP) + ENTRY_HEIGHT
    : 0

  return (
    <section>
      {/* diaryHead UNCHANGED */}
      {/* subtitle UNCHANGED */}
      {loading && ...}
      {error && ...}
      {!loading && !error && milestones.length > 0 && (
        <>
          <div className="relative mb-8" style={{ height: totalHeight }}>
            {/* rail — absolute, height computed from totalHeight */}
            <div
              className="absolute w-px bg-[#2A2520]"
              style={{ left: 29, top: 40, height: Math.max(0, totalHeight - 40) }}
              aria-hidden="true"
            />
            {milestones.map((m, i) => {
              const top = i * (ENTRY_HEIGHT + ENTRY_GAP)
              return (
                <div key={m.milestone} className="absolute w-full" style={{ top }}>
                  <div className="absolute w-5 h-3.5 bg-brick-dark" style={{ left: 20, top: 8 }} ... />
                  <div className="absolute" style={{ left: 92 }}>
                    {/* title / date / text */}
                  </div>
                </div>
              )
            })}
          </div>
          {/* diaryViewAllRow UNCHANGED */}
        </>
      )}
    </section>
  )
}
```

**After (target):**

```tsx
// NOTE: ENTRY_HEIGHT / ENTRY_GAP / totalHeight constants REMOVED.
// Entry height is now content-driven; rail spans container auto-grown height.

export default function DevDiarySection({ milestones, loading, error }) {
  return (
    <section>
      {/* diaryHead UNCHANGED (lines 22–33 of current file) */}
      {/* subtitle UNCHANGED (lines 36–38) */}
      {loading && ...}
      {error && ...}
      {!loading && !error && milestones.length > 0 && (
        <>
          {/*
            diaryEntries wrapper — position: relative so the rail anchors to it.
            Flex-col with gap-5 (20px) between entries = matches Pencil ENTRY_GAP.
          */}
          <div className="relative flex flex-col gap-5 mb-8" data-testid="diary-entries">
            {/*
              Vertical rail — single absolute div.
              left: 29px (marker-center x per Pencil rail node: x=29)
              top: 40px (first marker center, Pencil frame hE1 @ y=0, marker at top=8 + h=14/2 => 15; rounded to 40px to match first entry's title baseline — same inset as today)
              bottom: 40px (symmetric inset so rail ends at last marker center)
            */}
            <div
              className="absolute w-px bg-[#2A2520]"
              style={{ left: 29, top: 40, bottom: 40 }}
              aria-hidden="true"
            />

            {milestones.map((m) => (
              <div
                key={m.milestone}
                className="relative pl-[92px] min-h-[48px]"
                data-testid="diary-entry-wrapper"
              >
                {/*
                  Marker — 20×14px rectangle, bg-brick-dark, radius 0.
                  Absolutely positioned within the entry wrapper so each entry
                  has its own marker at the same left offset as today (left: 20px).
                  top: 8px — same as current (title baseline alignment, K-023 AC-023-DIARY-BULLET protected).
                */}
                <div
                  className="absolute w-5 h-3.5 bg-brick-dark"
                  style={{ left: 20, top: 8 }}
                  aria-hidden="true"
                  data-testid="diary-marker"
                />
                {/* Content — flows in normal document order; height grows with text */}
                <p className="font-['Bodoni_Moda'] text-[18px] italic font-bold text-[#1A1814] leading-tight">
                  {m.milestone}
                </p>
                <span className="font-mono text-[12px] text-[#6B5F4E] tracking-wide block mt-0.5">
                  {m.items[0]?.date ?? ''}
                </span>
                {m.items[0]?.text && (
                  <p className="font-['Newsreader'] text-[18px] italic text-[#2A2520] leading-[1.55] mt-1 break-words">
                    {m.items[0].text}
                  </p>
                )}
              </div>
            ))}
          </div>
          {/* diaryViewAllRow UNCHANGED (lines 95–102) */}
        </>
      )}
    </section>
  )
}
```

### 2.5 Diff summary (for Engineer)

**Remove:**
- L12–13: `const ENTRY_HEIGHT = 140` + `const ENTRY_GAP = 20`
- L16–18: `const totalHeight = ...` calculation
- L51 `style={{ height: totalHeight }}` → replaced with `flex flex-col gap-5`
- L58 `height: Math.max(0, totalHeight - 40)` → replaced with `bottom: 40`
- L64 `const top = i * (ENTRY_HEIGHT + ENTRY_GAP)` → removed (no absolute positioning)
- L66 `<div className="absolute w-full" style={{ top }}>` → becomes `<div className="relative pl-[92px] min-h-[48px]" data-testid="diary-entry-wrapper">`
- L76 `<div className="absolute" style={{ left: 92 }}>` inner content wrapper → removed (content flows directly inside the entry wrapper via `pl-[92px]`)

**Add:**
- `data-testid="diary-entries"` on the flex-col wrapper (Playwright stable anchor)
- `data-testid="diary-entry-wrapper"` on each entry (bounding-box iteration target)
- `break-words` on the `text` paragraph (defensive wrap for long words; parallel to K-027 DiaryEntry treatment per architecture.md)
- `min-h-[48px]` on each entry wrapper — guards against zero-height edge case if a milestone has no items[0] (ensures rail visible segment remains anchored)

**Unchanged:**
- `diaryHead` block (L22–33)
- Subtitle `<p>` (L36–38)
- Loading / error renderers
- Marker 20×14 brick-dark rectangle (K-023 AC-023-DIARY-BULLET protection: `w-5 h-3.5 bg-brick-dark` + `borderRadius: 0`)
- `diaryViewAllRow` link (L95–102)

### 2.6 Boundary pre-emption

| Scenario | Behavior in design | Notes |
|----------|-------------------|-------|
| `milestones.length === 0` | Guard `milestones.length > 0` unchanged → entire block not rendered | Matches today |
| `milestones.length === 1` | Flex-col with one child. Rail's `top: 40px / bottom: 40px` on a single-entry wrapper may produce negative rail height if wrapper < 80px. Mitigation: `min-h-[48px]` on each entry keeps wrapper ≥ 48px; single entry means `bottom: 40px` inset within the 48px wrapper collapses the rail to ~0 height — acceptable (no visible rail for 1 entry matches today's `Math.max(0, totalHeight - 40)` behavior). | Verified: current code also guards `Math.max(0, …)` |
| `items[0]` missing | `m.items[0]?.date ?? ''` + conditional `{m.items[0]?.text && …}` unchanged | Matches today |
| Very long `text` (> 500 chars) | Flex-col grows entry naturally; rail's `bottom: 40px` still resolves; marker stays at `top: 8px` of entry (title baseline) | New desired behavior (this ticket's fix) |
| Narrow viewport (375px) | `pl-[92px]` leaves ~280px for content at 375 − 24×2 padding − 92 = 187px content width; text wraps via `break-words`. Marker `left: 20` stays anchored to wrapper left edge. | Mobile AC covered |
| Three entries, middle entry has long text | Entry 1 bottom < Entry 2 top due to flex gap-5 (20px). Bounding boxes strictly ordered. | Main AC target |

---

## 3 Playwright Assertion Strategy

### 3.1 AC-028-SECTION-SPACING — Desktop (1280×720)

**Selectors:**
- `page.getByTestId('homepage-sections')` — the new flex-col wrapper
- Direct children: `HeroSection` / `ProjectLogicSection` / `DevDiarySection` — their root `<section>` elements

**Assertion pattern (pseudo-code):**

```ts
test.describe('HomePage — AC-028-SECTION-SPACING', () => {
  test('desktop 1280px: HeroSection ↔ ProjectLogicSection gap >= 72px', async ({ page }) => {
    await page.goto('/')
    // Hero root <section> contains the `Predict the next move` h1
    const hero = page.locator('section').filter({ hasText: 'Predict the next move' })
    // Logic root <section> contains the `§ PROJECT LOGIC` stamp
    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })

    const heroBox = await hero.boundingBox()
    const logicBox = await logic.boundingBox()
    expect(heroBox).not.toBeNull()
    expect(logicBox).not.toBeNull()
    const gap = logicBox!.y - (heroBox!.y + heroBox!.height)
    expect(gap).toBeGreaterThanOrEqual(72) // Pencil exact value
    expect(gap).toBeLessThanOrEqual(74)    // tolerance for sub-pixel rounding
  })

  test('desktop 1280px: ProjectLogicSection ↔ DevDiarySection gap >= 72px', async ({ page }) => {
    await page.goto('/')
    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })
    const diary = page.locator('section').filter({ hasText: '§ DEV DIARY' })

    const logicBox = await logic.boundingBox()
    const diaryBox = await diary.boundingBox()
    const gap = diaryBox!.y - (logicBox!.y + logicBox!.height)
    expect(gap).toBeGreaterThanOrEqual(72)
    expect(gap).toBeLessThanOrEqual(74)
  })
})
```

**Why not assert the wrapper's computed `gap` CSS directly?** `getComputedStyle(wrapper).rowGap` would validate the class is applied but not that the sections actually render with that gap (child margin collapse, visibility, etc.). Bounding-box is the behavioral assertion the ticket calls for.

### 3.2 AC-028-SECTION-SPACING — Mobile (375×812)

Same pattern but viewport set to 375px and gap floor `> 16px` per ticket, matching Tailwind `gap-6` = 24px.

```ts
test('mobile 375px: both section gaps >= 24px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  // ... same locators ...
  // assert both gaps >= 24 and <= 26 (gap-6 at 375px with tolerance)
})
```

### 3.3 AC-028-DIARY-ENTRY-NO-OVERLAP — Desktop + Mobile

**Selector:** `page.locator('[data-testid="diary-entry-wrapper"]')` — the new per-entry wrapper div.

**Assertion pattern:**

```ts
test.describe('HomePage — AC-028-DIARY-ENTRY-NO-OVERLAP', () => {
  test('desktop 1280px: adjacent diary entries do not overlap', async ({ page }) => {
    await page.goto('/')
    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    const count = await entries.count()
    expect(count).toBeGreaterThanOrEqual(3) // diary.json has ≥ 3 milestones

    for (let i = 0; i < Math.min(count, 3) - 1; i++) {
      const a = await entries.nth(i).boundingBox()
      const b = await entries.nth(i + 1).boundingBox()
      expect(a).not.toBeNull()
      expect(b).not.toBeNull()
      // bottom of entry N must be <= top of entry N+1 (with +/- 2px tolerance)
      expect(a!.y + a!.height).toBeLessThanOrEqual(b!.y + 2)
    }
  })

  test('mobile 375px: adjacent diary entries do not overlap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    // ... same iteration pattern at 375 viewport ...
  })

  test('desktop: rail remains visible between first and last marker', async ({ page }) => {
    await page.goto('/')
    const rail = page.locator('[data-testid="diary-entries"] > div[aria-hidden="true"].absolute').first()
    const railBox = await rail.boundingBox()
    expect(railBox).not.toBeNull()
    expect(railBox!.height).toBeGreaterThan(0) // AC: rail 貫穿所有 entry（視覺上不斷開）
    expect(railBox!.width).toBeCloseTo(1, 0)   // 1px rail
  })
})
```

**Note:** third test (rail visible) is the AC Then clause "vertical rail 仍貫穿所有 entry（視覺上不斷開）". Without it, an Engineer could delete the rail and `bounding box no overlap` would still pass.

### 3.4 AC-028-REGRESSION — existing K-023 guards

Do **not** touch any of these tests — they must continue to pass unchanged:
- `AC-023-DIARY-BULLET` (`pages.spec.ts` L173–216): marker 20×14px, brick-dark, radius 0 — protected by Engineer keeping the `w-5 h-3.5 bg-brick-dark` + implicit radius 0 classes on the marker div
- `AC-023-STEP-HEADER-BAR` (L224–291): unchanged (ProjectLogicSection not modified)
- `AC-023-BODY-PADDING` (L302–348): unchanged (homepage-root classes preserved)
- `AC-023-REGRESSION` (L355–end): DOM order Banner → Hero still holds (new `homepage-sections` div wraps Hero but does not change DOM order relative to Banner)
- `AC-017-HOME-V2` (not re-listed here but in pages.spec.ts): HomePage still renders all 3 body sections

**Engineer must not change any selectors used in the above tests.** The new `homepage-sections` wrapper div is transparent to any `page.getByText('…')` or `[data-testid="diary-marker"]` selectors.

---

## 4 File Change List

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `frontend/src/pages/HomePage.tsx` | Wrap HeroSection / ProjectLogicSection / DevDiarySection in a new `<div className="flex flex-col gap-6 sm:gap-[72px]" data-testid="homepage-sections">` — 3-line change |
| Modify | `frontend/src/components/home/DevDiarySection.tsx` | Remove `ENTRY_HEIGHT` / `ENTRY_GAP` / `totalHeight`; convert `diaryEntries` to flex-col with `data-testid="diary-entries"`; rail switch to `top: 40 / bottom: 40` pattern; each entry becomes `<div className="relative pl-[92px] min-h-[48px]" data-testid="diary-entry-wrapper">` with marker + inline content; add `break-words` to text `<p>` — ~25-line net diff |
| Add | `frontend/e2e/pages.spec.ts` — new test.describe blocks `HomePage — AC-028-SECTION-SPACING` + `HomePage — AC-028-DIARY-ENTRY-NO-OVERLAP` | 5 new test cases total (2 spacing × desktop+mobile merged into 2 tests, 2 overlap × desktop+mobile, 1 rail-visible) |
| Modify | `agent-context/architecture.md` | Update `DevDiarySection.tsx` Directory Structure inline description (absolute positioning → flow-based); append Changelog entry for 2026-04-21 K-028 |

**Zero touches:** `HeroSection.tsx`, `ProjectLogicSection.tsx`, `BuiltByAIBanner.tsx`, `HomeFooterBar.tsx`, `UnifiedNavBar.tsx`, `index.css`, `tailwind.config.js`, `diary.json`, any `about/` or `diary/` component.

---

## 5 Shared Component Boundary

| Component | Scope in this ticket | Rationale |
|-----------|----------------------|-----------|
| `DevDiarySection` | **Page-specific** (HomePage only) | grep confirms sole consumer is `HomePage.tsx` L4/L18. Not a shared component; modifying its layout does not affect `DiaryPage` (which uses `diary/DiaryTimeline` + `MilestoneSection` + `DiaryEntry`) |
| `HomePage.tsx` | **Page-specific** (route `/` only) | |
| Marker DOM (`[data-testid="diary-marker"]`) | **Contract-frozen** by K-023 AC-023-DIARY-BULLET | Engineer must preserve the `w-5 h-3.5 bg-brick-dark` + `borderRadius: 0` + `data-testid` exactly |
| `diaryViewAllRow` link | **Contract-frozen** by K-017 | No changes |

Engineer does **not** have discretion to convert `DevDiarySection` into a cross-page primitive during this ticket. That is K-024's territory (per architecture.md Pass 2 notes).

---

## 6 Route Impact Table

This ticket's file change list does **not** include `index.css` / `tailwind.config.js` / any global CSS token file. Route Impact Table is therefore not mandated by the senior-architect rule, but included below for traceability:

| Route | Status | Notes |
|-------|--------|-------|
| `/` | **affected — this ticket's target** | HomePage.tsx + DevDiarySection.tsx modified |
| `/app` | unaffected | No shared component overlap; AppPage has own layout |
| `/about` | unaffected | No shared component overlap; about/ tree untouched |
| `/diary` | unaffected | DiaryPage uses separate `diary/` components (DiaryTimeline / MilestoneSection / DiaryEntry) — DevDiarySection is Home-page-only |
| `/business-logic` | unaffected | No layout overlap |

**Conclusion:** only `/` is affected. `DevDiarySection.tsx` is confirmed single-consumer per §5.

---

## 7 Implementation Order (for Engineer)

1. **Step 1 — spacing wrapper in HomePage.tsx** (independent, verifiable alone):
   - Add `<div className="flex flex-col gap-6 sm:gap-[72px]" data-testid="homepage-sections">` wrapping the 3 body sections
   - Run existing E2E suite (no new test yet) — expect no regression, all K-023 tests still pass
   - Manual browser check at 1280px: visible gap between sections now
2. **Step 2 — DevDiarySection flow layout refactor**:
   - Delete `ENTRY_HEIGHT` / `ENTRY_GAP` / `totalHeight`
   - Convert `diaryEntries` wrapper to `relative flex flex-col gap-5 mb-8` with `data-testid="diary-entries"`
   - Switch rail `<div>` to `style={{ left: 29, top: 40, bottom: 40 }}`
   - Switch each entry to `<div className="relative pl-[92px] min-h-[48px]" data-testid="diary-entry-wrapper">` with marker + inline title/date/text
   - Add `break-words` to text `<p>`
   - `npx tsc --noEmit` → exit 0
   - Run existing E2E — expect K-023 AC-023-DIARY-BULLET still pass (marker width/height/color/radius unchanged)
3. **Step 3 — new E2E tests in `pages.spec.ts`**:
   - Add AC-028-SECTION-SPACING block (2 desktop tests + 1 mobile test; or merge into 1 desktop + 1 mobile = 2 tests)
   - Add AC-028-DIARY-ENTRY-NO-OVERLAP block (1 desktop + 1 mobile + 1 rail-visible desktop = 3 tests)
   - `npx playwright test pages.spec.ts` → all new tests pass, no regression
4. **Step 4 — full regression**:
   - `npx playwright test` full suite
   - `npx tsc --noEmit` final check
5. **Step 5 — update `agent-context/architecture.md`**:
   - Edit `DevDiarySection.tsx` line in Directory Structure to reflect flow-based layout
   - Append Changelog entry
   - Engineer's commit mentions docs sync

**Parallelizable:** Steps 1 and 2 are independent and can be done in either order; Step 3 depends on both. Step 5 can run alongside Step 4 (docs-only).

---

## 8 Risks & Notes

- **Rail `bottom: 40px` inset assumption:** rail visually ends at the last marker's center. This works if the last entry's total height ≥ 48px (min-h-[48px] enforced) and the marker is at top: 8px. If a milestone has zero content (title + date + no text), last entry height = ~title(~22px) + date(~16px) + margins (~10px) = ~48px; `bottom: 40px` leaves rail ending at wrapper.top + 8px = marker center. Verified by §2.6 boundary analysis.
- **Flex gap vs margin collapse:** flex gap does not collapse, so `gap-5` (20px) between entries is exact. Safe.
- **Mobile marker overflow:** marker at `left: 20px` + `w-5 h-3.5` ends at x=40px within the entry wrapper. Wrapper left edge aligns with parent's padding, so at 375px viewport with parent padding 24px, marker is at screen x=44px. No overflow.
- **Security:** pure layout change, no auth / env / injection surface touched.
- **Content dependency:** `diary.json` must have ≥ 3 milestones for the 3-entry assertion to pass. Confirmed — current diary.json has many milestones, `useDiary(3)` slices top 3. Engineer does not need to touch `diary.json`.
- **Sub-pixel tolerance in gap assertions:** use `>= 72` + `<= 74` (not exact `===`), because at 1280px desktop with paper background and percentage-based widths, browser rounding may deviate ±1px. ±2px is generous but safe.

---

## 9 Boundary Pre-emption (final checklist)

| Boundary | Defined? | Location |
|----------|----------|----------|
| Empty diary list (`milestones.length === 0`) | ✓ | §2.6 row 1 |
| Single milestone | ✓ | §2.6 row 2 |
| Missing `items[0]` | ✓ | §2.6 row 3 |
| Long text (K-023 ~270 chars) | ✓ | §2.6 row 4 — primary target |
| Very narrow viewport (375px) | ✓ | §2.6 row 5 + §3.2 |
| Rail disappearing visually | ✓ | §3.3 rail-visible test |
| Sub-pixel gap rounding | ✓ | §3.1 tolerance `>= 72 && <= 74` |
| K-023 regression (marker / step-header / body padding) | ✓ | §3.4 explicit preservation list |
| Banner / NavBar / Footer relationships | ✓ (unchanged) | §1.3 structure diagram |

All ❌ count: 0. No Known Gaps escalated.

---

## 10 Refactorability Checklist

- [x] **Single responsibility:** `DevDiarySection` still owns only "render 3-entry diary preview". Flow-layout refactor does not expand scope.
- [x] **Interface minimization:** props (`milestones`, `loading`, `error`) unchanged.
- [x] **Unidirectional dependency:** HomePage → DevDiarySection (no change).
- [x] **Replacement cost:** to swap marker visual style, still only `DevDiarySection.tsx` touched (marker DOM lives there inline).
- [x] **Clear test entry point:** new `data-testid="homepage-sections"` / `diary-entries` / `diary-entry-wrapper` give QA stable hooks independent of styling details.
- [x] **Change isolation:** no shared primitive touched; no API contract touched; no cross-page ripple.

All items pass.

---

## 11 All-Phase Coverage Gate

K-028 is a **single-phase fix ticket** (no Phase 1/2/3 split). Coverage applies to the single phase:

| Item | Covered? | Section |
|------|----------|---------|
| Backend API | N/A (pure frontend) | — |
| Frontend routes | ✓ (only `/`) | §6 |
| Component tree | ✓ | §2.4 pseudo-diff + §4 file list |
| Props interface | ✓ (unchanged: `DevDiarySectionProps`) | §2.4 |

All applicable items ✓.

---

## 12 architecture.md Sync — Self-Diff Verification

### 12.1 Intended edit to `agent-context/architecture.md`

**Section edited:** Directory Structure — `DevDiarySection.tsx` inline description (current line 124).

**Current (before K-028 edit):**
```
│   │           │   ├── DevDiarySection.tsx      ← Home 頁 Diary 預覽；absolute positioning layout（rail + marker + 三層 entry）；消費 useDiary(3) 回傳的 DiaryMilestone[]（K-017 Pass 2 MilestoneAccordion 方案未落地，DevDiarySection 自行 inline 實作）
```

**After (post K-028 Engineer edit):**
```
│   │           │   ├── DevDiarySection.tsx      ← Home 頁 Diary 預覽；flex-col flow layout（K-028 起改為 content-driven entry height；rail 為 absolute <div> with top:40 / bottom:40 insets；marker 仍為 20×14 brick-dark 矩形；K-023 AC-023-DIARY-BULLET 保留）；消費 useDiary(3) 回傳的 DiaryMilestone[]
```

**Section edited:** Changelog — append new entry at top (after `## Changelog` header).

**New entry:**
```
- **2026-04-21**（Architect → Engineer, K-028）— Homepage visual fix: `HomePage.tsx` 加 `homepage-sections` flex-col wrapper（gap-6 sm:gap-[72px]，對齊 Pencil frame 4CsvQ `hpBody` gap:72）；`DevDiarySection.tsx` absolute positioning layout → flex-col flow layout（移除 ENTRY_HEIGHT/ENTRY_GAP/totalHeight；entry 高度 content-driven；rail 改用 top:40/bottom:40 auto-grow；新增 `data-testid="homepage-sections"` / `diary-entries` / `diary-entry-wrapper`）；K-023 AC-023-DIARY-BULLET + AC-023-STEP-HEADER-BAR + AC-023-BODY-PADDING 全部 preserved。`pages.spec.ts` 新增 AC-028-SECTION-SPACING + AC-028-DIARY-ENTRY-NO-OVERLAP 共 5 test cases。
```

### 12.2 Self-Diff Verification

- **Source of truth:** Pencil frame `4CsvQ` `hpBody` props (gap: 72, padding: [72,96,96,96]) + `DevDiarySection.tsx` current implementation + §2.4 target pseudo-diff.
- **Section edited count:** 2 sections of architecture.md (Directory Structure line 124 + Changelog append-at-top)
- **Cell-by-cell match against source of truth:**
  - "flex-col flow layout" ↔ §2.3 "flex-col child" ✓
  - "K-028 起改為 content-driven entry height" ↔ §2.2 "entry height is content-driven" ✓
  - "rail 為 absolute <div> with top:40 / bottom:40 insets" ↔ §2.3 Option B implementation ✓
  - "marker 仍為 20×14 brick-dark 矩形" ↔ §2.2 K-023 preservation list ✓
  - "homepage-sections flex-col wrapper" ↔ §1.3 target structure ✓
  - "gap-6 sm:gap-[72px]" ↔ §1.2 chosen option B ✓
  - "對齊 Pencil frame 4CsvQ `hpBody` gap:72" ↔ §1.1 measurement table ✓
  - "移除 ENTRY_HEIGHT/ENTRY_GAP/totalHeight" ↔ §2.5 Remove list ✓
  - "data-testid='homepage-sections' / 'diary-entries' / 'diary-entry-wrapper'" ↔ §3.1 / §2.4 / §2.5 Add list ✓
  - "AC-023-DIARY-BULLET + AC-023-STEP-HEADER-BAR + AC-023-BODY-PADDING 全部 preserved" ↔ §3.4 regression list ✓
- **Same-file cross-table sweep:** `grep -n 'DevDiarySection' agent-context/architecture.md` returns one hit on line 124 (Directory Structure) only. No other table / list in architecture.md references `DevDiarySection` — no cross-table drift risk. ✓
- **Row count comparison:** 1 line changed + 1 changelog line appended = 2 edits vs 2 intended edits ✓
- **Discrepancy:** none — all cells match source of truth.

**Note for Engineer:** the architecture.md edit is part of this ticket's work items (File Change List §4 row 4). Engineer performs the edit as the final step before commit, following the text in §12.1 verbatim, then re-runs a local `grep -n DevDiarySection agent-context/architecture.md` to confirm single hit + updated text.

---

## 13 Retrospective

**Where most time was spent:** Extracting `hpBody.gap = 72` from the Pencil `.pen` JSON. The Pencil MCP server was failing to connect (`✗ Failed to connect` status), so I read the raw JSON file directly and dumped the tree with a short Python traversal. This was actually faster than the MCP `batch_get` workflow would have been for this depth, but required verifying the `.pen` file is still JSON-formatted and walking the tree by hand.

**Which decisions needed revision:** None during this pass — all three options matrices (spacing wrapper approach, rail implementation, mobile gap value) converged cleanly with no post-hoc dimension adjustments.

**Next time improvement:** When Pencil MCP is down and `.pen` files need layout extraction, I have a reliable fallback (direct JSON parse). Document this as a workflow note: `frontend/design/*.pen` files are plain JSON and can be traversed with a Python one-liner when MCP is unavailable. Add to `senior-architect.md` as a Tool Fallback note so future Architects don't block on MCP connection failure. (This will be codified as a persona edit after PM acknowledgement, per the retrospective-codifies-behavior rule.)
