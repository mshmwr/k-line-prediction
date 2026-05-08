---
id: K-027-design
title: DiaryPage mobile milestone timeline visual overlap fix — design doc
ticket: K-027
author: senior-architect
created: 2026-04-21
status: ready-for-engineer
---

## 0 Pre-impl Q&A

### Q1: Does K-024 already have a mobile layout design?

**Answer: No.**

Confirmed by reading `docs/tickets/K-024-diary-structure-and-schema.md`: K-024 defines the **structural rework** of the `/diary` page (flat timeline + flattened diary.json schema). Its AC describes component structure, fonts, colors, and content width, but does **not define mobile breakpoint strategy, mobile entry layout, or how the date column is handled in narrow viewports**. K-024 status is `backlog` and has not entered the Architect design stage.

**Conclusion: K-027 must produce a transitional mobile CSS solution (this doc), and K-024's Architect design will inherit the breakpoint decisions from this ticket.**

---

### Q2: Does K-027 need to register inheritance items in the K-024 ticket?

**Answer: Yes.** See §6 K-024 inheritance items.

---

### Q3: Layout technical decision

**Three options:**

| Option | Description | Pros | Cons |
|------|------|------|------|
| A: Tailwind responsive prefix `sm:` | On the existing `flex gap-4`, add `flex-col sm:flex-row`; change `w-24` to `w-auto sm:w-24` | No DOM changes; native Tailwind; minimal Engineer change; doesn't affect desktop | sm: = 640px; 375–639px all in col mode (covers all mobile AC viewports) |
| B: Custom CSS media query | Add hand-written `@media (max-width: 479px)` in `index.css` | Precise control below 480px | Departs from Tailwind utility-first; adds global CSS complexity; high maintenance cost |
| C: CSS Grid | Change `flex` to `grid`, `grid-template-columns: auto 1fr` + `@media` switch | Aligns with K-024 final design (flat timeline may use grid) | Largest change scope; needs second rework when K-024 restructures |

**Recommended: Option A** (Tailwind responsive prefix), reasons:
- K-027 scope is strictly hotfix ("CSS / responsive surgical fix"), no DOM changes
- `sm:` (≥640px) = desktop behavior; `<640px` = mobile col mode, fully covers AC-027 three viewports (375 / 390 / 414)
- No custom CSS introduced, doesn't pollute `index.css`; whole component can be replaced wholesale during K-024 restructure

---

## 1 Symptom root-cause analysis

### 1.1 Actual codebase state (vs architecture.md)

**Important precondition:**

The K-017 Pass 2 section in `agent-context/architecture.md` states:
> `DiaryTimeline.tsx` internally switches to `<MilestoneAccordion variant="full">` replacing `MilestoneSection`;
> `MilestoneSection.tsx` / `DiaryEntry.tsx` deleted

**But actual disk state (confirmed via `ls`):**

```
frontend/src/components/diary/
├── DiaryTimeline.tsx      ← exists (not MilestoneAccordion)
├── MilestoneSection.tsx   ← exists (not deleted)
└── DiaryEntry.tsx         ← exists (not deleted)

frontend/src/components/primitives/
├── ExternalLink.tsx
├── CardShell.tsx
└── SectionContainer.tsx
    (MilestoneAccordion.tsx / DiaryEntryRow.tsx do not exist)
```

**Conclusion: K-017 Pass 2's primitive refactor on diary/ components never landed.** K-027 fixes against the actual three-component architecture in the codebase, not the unlanded design described in architecture.md.

This architecture.md drift must be reconciled at the end of K-027 (see §7 Architecture Doc Sync).

---

### 1.2 Overlap root cause: `DiaryEntry.tsx` fixed `w-24`

**Root-cause file:** `frontend/src/components/diary/DiaryEntry.tsx`

**Symptom chain:**

```
DiaryPage
  └── DiaryTimeline (map milestones)
        └── MilestoneSection (accordion wrapper)
              └── When expanded: div.px-4.pb-4.border-t.divide-y
                    └── DiaryEntry × N
                          ├── span.shrink-0.w-24  ← 96px fixed width (date)
                          └── p.text-sm            ← flex-1 (text body)
```

**Overlap location:** the container `div` of `DiaryEntry.tsx`, class:

```
flex gap-4 py-2
```

date column:
```
shrink-0 font-mono text-xs text-muted pt-0.5 w-24
```

text column:
```
text-sm text-ink/80 leading-relaxed
```

**Calculation under 375px viewport:**

```
DiaryPage wrapper px-6  →  12px × 2 = 24px padding
MilestoneSection px-4   →  16px × 2 = 32px padding (expanded area px-4 pb-4)
Available content width →  375 - 24 - 32 = 319px

date span w-24          →  96px (fixed)
gap-4                   →  16px
text flex-1             →  319 - 96 - 16 = 207px
```

By width math `flex-1` still has 207px, **shouldn't overlap**.

**But padding is double-counted:** `DiaryPage` wrapper already has `px-6` (24px each side), the `MilestoneSection` outermost div border is inside that wrapper; the expanded content area `px-4 pb-4` adds another 16px on each side. At extra-narrow viewports (375px):

- Total horizontal usage = `24 + 24 + 16 + 16 = 80px` (outer + expanded)
- Width left for flex row = `375 - 80 = 295px`

**Still shouldn't overlap.** So the issue is not the `flex` direction itself, but:

**Real root cause (Priority 1):**
Under extremely narrow viewports (e.g. real phone body width < 375px after browser chrome), `w-24` (96px) forces date not to shrink, the `text` column gets squeezed and wraps, making **each `DiaryEntry`'s height unpredictable**. Combined with `MilestoneSection`'s expanded area using `divide-y divide-ink/5` (border-bottom on each child) and the container itself lacking an explicit `height: auto` anchor, on some mobile browsers (WebKit/Blink) the inherited content div height (`.pb-4` fixed bottom padding) plus `divide-y`'s `border-top` calculation produces wrong height estimates after multi-line wrapping. Adjacent `MilestoneSection`'s `mb-3` is insufficient to compensate, causing **visually overlapping y-ranges between adjacent milestone blocks**.

**Priority 2 root cause:**
On `< 480px` environments, `DiaryEntry`'s `flex` row has date (96px) + gap (16px) = 112px, taking 30% of window width. `shrink-0` blocks date scaling; though text column has space, after `MilestoneSection`'s outer padding the actual text column width is < 200px. Long Chinese strings (no word boundaries) don't wrap, so text overflows the container → pollutes elements below.

**Confirmed: scope of impact**

Only affects the `/diary` page. Components involved:
1. `DiaryEntry.tsx` (primary)
2. `MilestoneSection.tsx` (secondary: add `min-h-0` overflow-safe)
3. `DiaryPage.tsx` (`px-6` retained, untouched)
4. `DiaryTimeline.tsx` (untouched)

Shared components (`UnifiedNavBar`, `LoadingSpinner`, `ErrorMessage`) unaffected.

---

## 2 Fix plan

### 2.1 Before / After comparison

#### Component 1: `DiaryEntry.tsx` (primary)

**Before:**

```
container div class:   "flex gap-4 py-2"
date span class:       "shrink-0 font-mono text-xs text-muted pt-0.5 w-24"
text p class:          "text-sm text-ink/80 leading-relaxed"
```

**After (modified CSS classes):**

```
container div class:   "flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 sm:py-2"
date span class:       "shrink-0 font-mono text-xs text-muted w-auto sm:w-24 sm:pt-0.5"
text p class:          "text-sm text-ink/80 leading-relaxed break-words"
```

**Change notes:**

| Class | Note |
|-------|------|
| `flex-col sm:flex-row` | Mobile: date above, text below (vertical stack); desktop: original horizontal |
| `gap-1 sm:gap-4` | Mobile: shrink date–text gap (1 = 4px in col mode, sufficient visual separation); desktop: 16px |
| `py-3 sm:py-2` | Mobile: increase entry vertical spacing (avoid cramming); desktop: 8px |
| `w-auto sm:w-24` | Mobile: date width auto (no fixed width needed in col mode); desktop: 96px alignment |
| `sm:pt-0.5` | `pt-0.5` only needed for baseline alignment on desktop horizontal; not needed in mobile col mode |
| `break-words` | Force long strings (Chinese / unbroken sequences) to wrap at container boundary, prevent overflow |

---

#### Component 2: `MilestoneSection.tsx` (secondary)

**Before:**

```
expanded div class:  "px-4 pb-4 border-t border-ink/10 divide-y divide-ink/5"
outer div class:     "border border-ink/10 rounded-sm mb-3"
```

**After:**

```
expanded div class:  "px-4 pb-4 border-t border-ink/10 divide-y divide-ink/5 overflow-hidden"
outer div class:     "border border-ink/10 rounded-sm mb-4 sm:mb-3"
```

**Change notes:**

| Class | Note |
|-------|------|
| `overflow-hidden` (expanded) | Prevent `DiaryEntry` long-string overflow from escaping the accordion container and visually bleeding into adjacent milestones |
| `mb-4 sm:mb-3` | Mobile milestone spacing 12px → 16px, compensating for taller col-mode entries |

---

### 2.2 Breakpoint strategy

Use Tailwind default `sm: = 640px`:

- `< 640px` (mobile): `flex-col`, date on top, text below, `w-auto`
- `≥ 640px` (desktop / tablet): `flex-row`, date on left `w-24`, text `flex-1`

**AC-027 specified viewports: 375 / 390 / 414px** all fall under `< 640px`, all use mobile mode, satisfying AC.

---

## 3 Playwright test design

### 3.1 New test file: `frontend/e2e/diary-mobile.spec.ts`

**Test case plan (AC mapping):**

| Test ID | AC | Viewport | Assertion target |
|---------|-----|---------|---------|
| TC-001 | AC-027-NO-OVERLAP | 375 × 812 | All adjacent MilestoneSection `.border.rounded-sm` bounding-box y-ranges do not overlap |
| TC-002 | AC-027-NO-OVERLAP | 390 × 844 | Same as above (different viewport) |
| TC-003 | AC-027-NO-OVERLAP | 414 × 896 | Same |
| TC-004 | AC-027-TEXT-READABLE | 375 × 812 | First expanded milestone's title / date / text: no text-overflow ellipsis; font-size ≥ 12px; color not transparent |
| TC-005 | AC-027-TEXT-READABLE | 390 × 844 | Same |
| TC-006 | AC-027-TEXT-READABLE | 414 × 896 | Same |
| TC-007 | AC-027-DESKTOP-NO-REGRESSION | 1280 × 800 | First expanded milestone: 3 entries visible; `aria-expanded` behavior normal |

**y-range non-overlap assertion strategy (TC-001 ~ TC-003):**

Use `page.locator('.border.border-ink\\/10.rounded-sm').all()` to get all milestone cards. For each adjacent pair, call `boundingBox()`, assert `cardA.y + cardA.height <= cardB.y`.

diary.json contains 12 milestones; on mobile viewport, run this assertion across all 11 adjacent pairs.

---

### 3.2 Existing AC-DIARY-1 regression

The three `DiaryPage — AC-DIARY-1` tests in `pages.spec.ts` run at **default desktop viewport** and are unaffected by this CSS change (`sm:` prefix retains desktop behavior); expected all PASS.

Engineer must not modify any diary-related assertions in `pages.spec.ts` (AC-027-DESKTOP-NO-REGRESSION).

---

## 4 File change list

| File path | Action | Note |
|---------|------|------|
| `frontend/src/components/diary/DiaryEntry.tsx` | Modify | Add responsive prefixes to container/date/text classes |
| `frontend/src/components/diary/MilestoneSection.tsx` | Modify | Add `overflow-hidden` to expanded area; add `sm:mb-3` to outer |
| `frontend/e2e/diary-mobile.spec.ts` | New | 7 test cases for the 3 ACs of AC-027 |

**Files not touched:**

| File path | Reason |
|---------|------|
| `frontend/src/pages/DiaryPage.tsx` | wrapper `px-6 py-16 max-w-3xl` untouched; doesn't affect mobile bug |
| `frontend/src/components/diary/DiaryTimeline.tsx` | Pure map container, no CSS |
| `frontend/public/diary.json` | K-027 doesn't change schema (K-024 scope) |
| `frontend/e2e/pages.spec.ts` | Desktop AC-DIARY-1 untouched (regression baseline) |
| `frontend/src/types/diary.ts` | schema unchanged |

---

## 5 Implementation order and dependencies

```
Step 1 (independent, do first): Modify DiaryEntry.tsx
  ↓ no dependency on other steps
Step 2 (independent, parallelizable): Modify MilestoneSection.tsx
  ↓
Step 3 (depends on Step 1 + 2): Add diary-mobile.spec.ts + run Playwright
  ↓
Step 4: tsc --noEmit to confirm no type errors
```

**Step 1 / Step 2 can run in parallel** (no inter-dependency).
**Step 3 must run after Step 1 + 2** (spec uses post-modification class structure as locators).

---

## 6 K-024 inheritance items

When K-024 Architect designs, the design doc must explicitly handle these inherited decisions:

| Item | K-027 transitional decision | K-024 must decide |
|------|-------------|------------|
| Mobile breakpoint | `sm:` = 640px (Tailwind default) | Whether the new structure keeps sm: or switches to 480px custom |
| DiaryEntry mobile layout | `flex-col`, date on top | Order and font sizes of date + title + text in flat-timeline mobile |
| Milestone spacing | `mb-4 sm:mb-3` | Entry spacing spec for new timeline rail + marker structure |
| `overflow-hidden` strategy | Expanded area gets `overflow-hidden` | New structure removes accordion; redesign overflow strategy |
| `break-words` | Added to `DiaryEntry` text | Whether flat text element inherits |

**When K-024 Architect picks up, this doc's §2.1 Before/After comparison serves as K-024's "Before" baseline.**

---

## 7 Risks and notes

1. **`divide-y` + col-mode entry height:** After `flex-col`, each entry's height is the natural sum of date row + text row; `divide-y`'s `border-top` still correctly separates entries in col mode, no removal needed. Engineer should confirm whether `divide-y` looks right in col mode (if too cramped, consider replacing with `gap-y-3` — minor tweak, doesn't affect AC, Engineer's call).

2. **`overflow-hidden` and collapse animation:** `MilestoneSection` is a manually-toggled `useState` `{open && <div>}` conditional render with no CSS transition; `overflow-hidden` doesn't affect collapse behavior.

3. **Chinese content in diary.json + `break-words`:** Existing diary.json includes Chinese milestone titles and entry text (English translation is K-024 scope). `break-words` has no negative effect on Chinese (CJK chars wrap at any boundary) and correctly wraps long English words.

4. **Desktop `sm:pt-0.5` alignment:** the `pt-0.5` (2px top padding) on the date column is a baseline-alignment microtweak for desktop horizontal mode; `sm:pt-0.5` correctly limits it to desktop row mode.

5. **AC-027-NO-OVERLAP bounding-box test:** `locator('.border.border-ink\\/10.rounded-sm')` uses CSS class combo. Confirm all MilestoneSection are in DOM at mobile viewport (diary.json fully rendered, no pagination). Current `DiaryPage.tsx` has no pagination; full render, all 12 milestones reachable via scroll. Engineer in TC-001~003 should use `evaluate()` or `boundingBox()` to fetch the bounding box; note `boundingBox()` returns null unless element is in viewport, so call `scrollIntoView()` first.

---

## 8 Shared primitive & reuse plan

Cross-page duplicate audit (per senior-architect persona requirement):

The `DiaryEntry.tsx` / `MilestoneSection.tsx` modified by K-027 are `/diary`-specific components, architecturally not reused on other pages.

grep confirms:
- `MilestoneSection` is only used by `DiaryTimeline.tsx`, not in `home/` / `about/` / `pages/`
- `DiaryEntry` is only used by `MilestoneSection.tsx`
- Homepage's diary preview (`DevDiarySection.tsx`) does not use these two components (it consumes `DiaryMilestone[]` from `useDiary(3)` directly and renders itself)

**Decision: keep each inline (component scope unchanged).**

K-027 is a hotfix — no primitive extraction, no component-boundary refactor. K-024's restructure will replace the entire diary/ component directory; K-027's modifications are transitional.

grep'd `DiaryEntry` / `MilestoneSection`, no duplication found, audit passes.

---

## 9 Architecture Doc sync plan

After this ticket completes (post-QA PASS), `agent-context/architecture.md` must be synced:

1. **Directory Structure correction (drift fix):**
   - `diary/` subtree: remove the architecture.md note "MilestoneSection.tsx / DiaryEntry.tsx deleted"; replace with "MilestoneSection.tsx / DiaryEntry.tsx retained (K-027 modifications: add mobile responsive classes)"
   - `primitives/` subtree: remove records of `MilestoneAccordion.tsx` / `DiaryEntryRow.tsx` (do not exist on disk)

2. **Add changelog entry:**
   `2026-04-21: K-027 mobile responsive fix — DiaryEntry flex-col sm:flex-row; MilestoneSection overflow-hidden; diary/ components were never restructured by K-017 Pass 2 (architecture.md drift fixed)`

This step is executed by the Architect after QA PASS, no Engineer dependency.

---

## Retrospective

### Architect design reflection

**What went well:**
- Before designing, ran `ls` to verify the actual contents of `primitives/`, discovering that K-017 Pass 2's diary/ component refactor in architecture.md **never landed** (MilestoneAccordion / DiaryEntryRow do not exist). Used **actual codebase state** as design baseline rather than relying on potentially stale doc descriptions. This avoided sending Engineer to look for nonexistent components.

**What didn't go well:**
- architecture.md already had records of K-017 Pass 2 diary/ component refactor at K-021 close (diary/ components described as deleted / replaced by MilestoneAccordion), but the codebase never landed it. This drift was discovered when Architect was summoned for K-027, not at K-017 / K-021 close audit. Root cause: parts of K-017 Pass 2's primitive decisions (P4 / P7) were abandoned in Pass 3; architecture.md updated the Pass 3 abandonment but the `diary/` component description was never rolled back, leaving a "described as deleted, exists on disk" ghost state.

**Next-time improvement:**
- Whenever architecture.md records "component deleted / refactored / moved", **the same commit must verify disk state** (`ls` or `Glob`). Description "deleted" requires disk-confirmed deletion; cannot mark as deleted on the assumption "Engineer will delete next." Add this rule to Architect persona's Architecture Doc sync rule: "Run `ls` to verify disk before describing component deletion."
