---
title: K-023 Homepage Structure Detail Alignment v2 — Design Document
ticket: K-023
author: Senior Architect
date: 2026-04-21
status: RELEASED TO ENGINEER — PM ruled on all SQ-023-01 through SQ-023-04 (2026-04-21)
---

## 0 Scope Questions — PM Rulings (2026-04-21)

All four scope questions have been ruled by PM. Design is released to Engineer.

---

### SQ-023-01: A-3 Step Header Bar — RULED: DONE, Playwright spec only

**PM ruling:** A-3 is complete. `ProjectLogicSection.tsx:55–62` already implements the full header bar matching AC spec exactly (bg-[#2A2520], white text, Geist Mono 10px, STEP 01/02/03 labels). Engineer adds 3 Playwright test cases only. No component modification.

---

### SQ-023-02: A-4 Hero Subtitle Second Brick Line — RULED: REMOVED from scope

**PM ruling:** Option A selected. Pencil design is source of truth. Frame `4CsvQ` hpHero heroCol has no second-line brick Bodoni italic element. AC-023-HERO-SUBTITLE-TWO-LINE removed from ticket. No implementation or Playwright spec required.

---

### SQ-023-03: A-5 Hairline Position — RULED: REMOVED from scope

**PM ruling:** Option A selected. Current hairline position (after H1 heading, before subtitle) already matches Pencil design exactly. A-5 was predicated on A-4 (second subtitle line) which is now removed. AC-023-HERO-HAIRLINE removed from ticket. No changes to HeroSection.tsx.

---

### SQ-023-04: C-4 Body Padding — RULED: bottom=96px, remove per-section padding

**PM ruling Q1:** Option B selected. Use Pencil design value: `paddingBottom: 96px`. Correct container padding: `pt-[72px] pr-[96px] pb-[96px] pl-[96px]`.

**PM ruling Q2:** Option A selected. Remove per-section `py-XX px-6 max-w-5xl mx-auto` from HeroSection, ProjectLogicSection, and DevDiarySection in the same commit as body padding addition. Prevents double-stacking.

**Mobile breakpoint (KG-023-03 resolved):** Tailwind `sm:` (640px) — standard breakpoint, no custom config needed. Mobile padding: `pt-8 pb-8 px-6` (32px top/bottom, 24px left/right).

---

**Design status: RELEASED TO ENGINEER.** Remaining scope: A-2 (marker fix), A-3 (Playwright spec only), C-4 (body padding + section padding removal). A-4 and A-5 are removed.

The items below (§1 through §9) are updated to reflect these rulings.

---

## KG Resolution

### KG-023-01: STEP Card Labels — RESOLVED

Labels confirmed from `ProjectLogicSection.tsx` lines 3–16: `STEP 01 · INGEST`, `STEP 02 · MATCH`, `STEP 03 · PROJECT`. Match Pencil design exactly.

**SQ-023-01 ruling:** A-3 is complete. Engineer adds 3 Playwright test cases only.

### KG-023-02: Hero Subtitle Second Line — CLOSED (A-4 removed)

AC-023-HERO-SUBTITLE-TWO-LINE removed from scope per PM ruling SQ-023-02. No action.

### KG-023-03: Mobile Padding Value — RESOLVED

Mobile padding: `pt-8 pb-8 px-6` (32px top/bottom, 24px left/right) at Tailwind `sm:` breakpoint (640px). No custom `tailwind.config.js` change needed. The 767px boundary mentioned in earlier Known Gap is superseded.

---

## 1 File Change List

Files to be modified (post PM ruling, A-4 and A-5 removed from scope):

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/home/DevDiarySection.tsx` | **Modify** line 69: remove `rounded-[6px]`, replace `bg-[#9C4A3B]` with `bg-brick-dark` | A-2: marker border-radius fix + token migration |
| `frontend/src/pages/HomePage.tsx` | **Modify**: add `pt-[72px] pr-[96px] pb-[96px] pl-[96px] sm:pt-8 sm:pb-8 sm:px-6` to container div; add `data-testid="homepage-root"` | C-4: body padding |
| `frontend/src/components/home/HeroSection.tsx` | **Modify**: remove `py-24 px-6 max-w-5xl mx-auto` (or equivalent section padding classes) | C-4: section padding removal |
| `frontend/src/components/home/ProjectLogicSection.tsx` | **Modify**: remove `py-16 px-6 max-w-5xl mx-auto`; replace inline hex with K-021 tokens (`charcoal`, `paper`) | C-4: section padding removal + token migration |
| `frontend/src/components/home/DevDiarySection.tsx` | **Modify**: remove `py-16 px-6 max-w-5xl mx-auto` (in same edit pass as A-2) | C-4: section padding removal |
| `frontend/e2e/pages.spec.ts` | **Modify or create**: add AC-023-DIARY-BULLET (3 assertions), AC-023-STEP-HEADER-BAR (3 independent test cases), AC-023-BODY-PADDING (desktop + mobile), AC-023-REGRESSION specs | New Playwright tests |

**No new components required.**

**Files NOT changing:**
- `frontend/src/components/home/HeroSection.tsx` — A-4 and A-5 removed; hairline and subtitle DOM unchanged
- `frontend/tailwind.config.js` — Tailwind `sm:` (640px) standard breakpoint used, no custom config needed
- Any backend files — this ticket is frontend-only

---

## 2 Five Changes — Detail Contracts

### Change A-2: Diary Bullet Rectangular Brick Marker

**Current code state** (`DevDiarySection.tsx` line 69):
```
className="absolute w-5 h-3.5 bg-[#9C4A3B] rounded-[6px]"
```
The `w-5` = 20px, `h-3.5` = 14px are already correct. The `bg-[#9C4A3B]` is already correct. Only `rounded-[6px]` must be removed.

**Target state:**
```
className="absolute w-5 h-3.5 bg-[#9C4A3B]"
```
No border-radius class → computed `borderRadius` = `0px`. Also replace `bg-[#9C4A3B]` with `bg-brick-dark` (K-021 token, same value `#9C4A3B`).

**Note on Pencil design discrepancy:** The Pencil design shows `cornerRadius: 6` on markers hE1m/hE2m/hE3m. The ticket AC-023-DIARY-BULLET (updated per QA Early Consultation Option A ruling) explicitly requires `borderRadius: 0px`. **PM's QA ruling takes precedence over the Pencil design file.** Engineer must implement `borderRadius: 0px` as AC specifies.

**Implementation approach:** Single inline Tailwind class removal. No new component, no CSS module needed.

**Risk — shared code:** `DevDiarySection.tsx` is used ONLY on the `/` route (imported by `HomePage.tsx`). No other page uses this component. Safe to modify.

**Token migration (K-021 consistency):** Replace inline `[#9C4A3B]` with `brick-dark` token at the same time, as per K-021 design system.

---

### Change A-3: Step Card Header Bar

**Current code state** (`ProjectLogicSection.tsx` lines 55–62):
```
<div className="bg-[#2A2520] px-[10px] py-[6px]">
  <span
    className="text-[10px] tracking-widest text-[#F4EFE5]"
    style={{ fontFamily: '"Geist Mono", monospace' }}
  >
    {s.label}
  </span>
</div>
```
Labels in STEPS array (lines 3–16): `STEP 01 · INGEST`, `STEP 02 · MATCH`, `STEP 03 · PROJECT`.

**Target state:** Same as current — the header bar already exists and matches the AC specification exactly.

**Implementation approach:** **NONE required** pending SQ-023-01 PM confirmation. Only Playwright specs need to be added.

**Token migration (K-021 consistency):** Replace inline `[#2A2520]` with `charcoal`, `[#F4EFE5]` with `paper`. Engineer should apply during Playwright spec work pass.

**Risk — shared code:** `ProjectLogicSection.tsx` is used ONLY on the `/` route. Safe.

---

### Change A-4: Hero Subtitle Second Line — REMOVED (PM ruling SQ-023-02, 2026-04-21)

No implementation. No Playwright spec. `HeroSection.tsx` subtitle DOM is unchanged.

---

### Change A-5: Hero Hairline Position — REMOVED (PM ruling SQ-023-03, 2026-04-21)

No implementation. No Playwright spec. `HeroSection.tsx` hairline position is unchanged. Current position already matches Pencil design.

---

### Change C-4: Body Padding — FULLY SPECIFIED (PM ruling SQ-023-04, 2026-04-21)

**Current code state** (`HomePage.tsx` line 13): Container div has only `className="min-h-screen"`. Each section has its own padding:
- `HeroSection.tsx`: `py-24 px-6 max-w-5xl mx-auto`
- `ProjectLogicSection.tsx`: `py-16 px-6 max-w-5xl mx-auto`
- `DevDiarySection.tsx`: `py-16 px-6 max-w-5xl mx-auto`

**Target state (post PM ruling):**

`HomePage.tsx` container:
```
className="min-h-screen pt-8 pb-8 px-6 sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]"
data-testid="homepage-root"
```

Per-section padding removal: remove `py-XX px-6 max-w-5xl mx-auto` from all three section components. Apply in same commit as body padding addition — do not split these changes.

**Responsive breakpoint contract (resolved):**
- Mobile (< 640px, Tailwind `sm:` prefix): `pt-8 pb-8 px-6` = 32px top/bottom, 24px left/right
- Desktop (>= 640px): `pt-[72px] pr-[96px] pb-[96px] pl-[96px]`

**Risk — shared code:**
- `HomePage.tsx`: Only `/` route. Safe.
- `HeroSection.tsx`: Only `/`. Safe.
- `ProjectLogicSection.tsx`: Only `/`. Safe.
- `DevDiarySection.tsx`: Only `/`. Safe.

---

## 3 QA-Flagged Fixes (from QA Early Consultation)

### DevDiarySection Marker `rounded-[6px]` Fix

**File:** `frontend/src/components/home/DevDiarySection.tsx`
**Line:** 69
**Current:** `className="absolute w-5 h-3.5 bg-[#9C4A3B] rounded-[6px]"`
**Required:** `className="absolute w-5 h-3.5 bg-brick-dark"`

Remove `rounded-[6px]`. Replace `bg-[#9C4A3B]` with `bg-brick-dark` (same color via K-021 token). This change is fully defined regardless of scope questions — no blocking dependency.

---

### HeroSection — NO CHANGES REQUIRED (A-4 and A-5 removed, PM ruling 2026-04-21)

`HeroSection.tsx` DOM structure is unchanged. Hairline position already matches Pencil design. No implementation work for Engineer on this file except removing `py-24 px-6 max-w-5xl mx-auto` per C-4 section padding removal ruling.

---

## 4 Shared Component Check

All components modified in this ticket are **page-specific to `/`** (Homepage):

| Component | Used on pages | Flag |
|-----------|--------------|------|
| `components/home/DevDiarySection.tsx` | `/` only | No flag |
| `components/home/HeroSection.tsx` | `/` only | No flag |
| `components/home/ProjectLogicSection.tsx` | `/` only | No flag |
| `pages/HomePage.tsx` | `/` only | No flag |

**No shared components are affected.** Changes are isolated to Homepage. No cross-page regression risk from component modification.

---

## 5 Playwright Spec Contracts

### AC-023-DIARY-BULLET: Three independent assertions

Each assertion targets a different marker element. Recommended approach: use `page.locator('[aria-hidden="true"]')` within the diary section, or add a `data-testid="diary-marker"` to each marker div.

**Architect recommendation:** Add `data-testid="diary-marker"` to the marker div in `DevDiarySection.tsx` for reliable selection. This is a testability improvement, not scope expansion.

**Assertions per marker (× 3 minimum):**
- `width` = 20px (computed style)
- `height` = 14px (computed style)
- `backgroundColor` = `rgb(156, 74, 59)` (computed style for `#9C4A3B`)
- `borderRadius` = `0px` (computed style — all four corners)

### AC-023-STEP-HEADER-BAR: Three independent test cases

**Test Case 1 (STEP 01):**
- Locate header bar containing text matching `STEP 01 · INGEST` (exact match, `{ exact: true }`)
- Assert `backgroundColor` = `rgb(42, 37, 32)` (`#2A2520`)
- Assert text color = `rgb(255, 255, 255)`
- Assert `fontSize` = `10px`

**Test Case 2 (STEP 02):**
- Same assertions for `STEP 02 · MATCH`

**Test Case 3 (STEP 03):**
- Same assertions for `STEP 03 · PROJECT`

**Note:** These three must be separate `test()` blocks per AC requirement ("3 independent test cases, not merged").

### AC-023-BODY-PADDING

- Target: the `min-h-screen` container in `HomePage.tsx` (add `data-testid="homepage-root"` for reliable targeting — Architect recommends adding this)
- Assert `paddingTop` = `72px`
- Assert `paddingLeft` = `96px` (and right = `96px`)
- Assert `paddingBottom` = [value from PM ruling on SQ-023-04]

Mobile assertion: use `page.setViewportSize({ width: 375, height: 812 })`, assert padding values differ from desktop and are greater than 0.

---

## 6 Implementation Order

Assuming PM resolves SQ-023-01 through SQ-023-04, execute in this order:

**Phase 1 — Independent (no dependency):**
1. A-2: Remove `rounded-[6px]` from `DevDiarySection.tsx:69`, replace with `bg-brick-dark`. Run `tsc --noEmit` to verify.
2. A-3 (if SQ-023-01 confirms no code change): Add 3 Playwright test cases for AC-023-STEP-HEADER-BAR.

**Phase 2 — Dependent on PM ruling on SQ-023-02/03:**
3. A-4/A-5: Modify `HeroSection.tsx` — add second subtitle line (if ruled), reposition hairline (if ruled). Run `tsc --noEmit`.
4. Add Playwright spec for AC-023-HERO-SUBTITLE-TWO-LINE and AC-023-HERO-HAIRLINE.

**Phase 3 — Dependent on PM ruling on SQ-023-04:**
5. C-4: Modify `HomePage.tsx` container padding. If SQ-023-04 Q2 Option A, also remove per-section padding from HeroSection, ProjectLogicSection, DevDiarySection simultaneously (single commit, not staggered). Run `tsc --noEmit`.
6. Add Playwright spec for AC-023-BODY-PADDING (desktop + mobile).

**Phase 4 — Regression:**
7. Add AC-023-REGRESSION test cases to confirm K-017 ACs still pass.
8. Run full Playwright suite (`npx playwright test --project=chromium`). All tests must pass before commit.

**Parallelization:** Phase 1 items 1 and 2 can proceed immediately without PM ruling. All other phases blocked until SQ responses received.

---

## 7 Risks and Notes

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Pencil design vs AC contradiction on marker border-radius | Medium | PM's QA ruling (Option A, add `borderRadius: 0px` assertion) explicitly takes precedence. Engineer follows AC. |
| Pencil design vs AC contradiction on hairline position | High | Blocked on SQ-023-03. Do not implement until PM rules. |
| No second subtitle line in Pencil design | High | Blocked on SQ-023-02. Architect cannot fabricate design content. |
| Section padding stacking (C-4) | High | Architect recommends removing per-section padding (SQ-023-04 Q2 Option A). Stacking will visually break the layout. |
| `DevDiarySection.tsx` absolute positioning | Low | K-027 established that the `layout:none` absolute positioning mechanism must not be broken. The marker change (border-radius only) does not affect layout. |
| `data-testid` additions | Low | Adding `data-testid="diary-marker"` and `data-testid="homepage-root"` are testability improvements with no visual impact. |
| K-021 token migration | Low | Replacing inline hex colors with token names (`brick-dark`, `charcoal`, `paper`) in same pass reduces future debt. No visual change. |

**Security:** No auth changes, no API changes, no env vars involved. Frontend-only CSS changes.

**Type safety:** All changes are Tailwind className modifications and DOM structure changes. `tsc --noEmit` must pass after each phase.

---

## 8 Boundary Pre-emption Checklist

| Boundary scenario | A-2 | A-3 | A-4/A-5 | C-4 |
|------------------|-----|-----|---------|-----|
| Empty/null input | N/A (static render) | N/A | N/A | N/A |
| Max/min value | marker is fixed 20×14px | fixed step count | N/A | responsive breakpoint defined in KG-023-03 |
| API error / timeout | N/A (no API call) | N/A | N/A | N/A |
| Concurrency / race | N/A (static) | N/A | N/A | N/A |
| Empty list | `DevDiarySection` has `milestones.length > 0` guard (line 48) — no markers rendered if empty. AC requires "≥ 3 markers" so milestones must have data. | N/A | N/A | N/A |

---

## 9 Refactorability Checklist

- [x] **Single responsibility:** Each modified component retains its single role. DevDiarySection = diary preview, HeroSection = hero display, ProjectLogicSection = step logic display.
- [x] **Interface minimization:** No new props added. All changes are internal implementation changes.
- [x] **Unidirectional dependency:** Data flows top-down (HomePage → section components). No circular dependencies introduced.
- [x] **Replacement cost:** No third-party libraries involved in these changes.
- [x] **Clear test entry point:** AC-023-* assertions are all computed-style checks via Playwright — QA can write specs without reading component internals.
- [x] **Change isolation:** These are pure UI/CSS changes. No API contract change. No impact on other pages.

---

## 10 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| Single-phase ticket | N/A (no backend) | `/` only, no route change | HeroSection / ProjectLogicSection / DevDiarySection / HomePage | No props changes |

Gate: PASS on all N/A and covered items.

---

## 11 Architecture Doc Sync

After PM ruling and Engineer completion, `agent-context/architecture.md` changes required:

1. Add `data-testid` notes to `home/DevDiarySection.tsx` and `pages/HomePage.tsx` directory entries if added
2. Update `## Changelog` with K-023 delivery summary

No structural table changes needed. The component names and paths are already correct in `architecture.md`.

**Pre-Design Path Audit (K-022 retrospective hard step):**
- Ticket references `StepCard.tsx` and `TechTag.tsx` in architecture.md directory listing — these files do NOT exist on disk. Step cards are inline in `ProjectLogicSection.tsx`. Architecture.md directory structure has these as ghost entries. This must be corrected in architecture.md at K-023 close.

---

## Retrospective

**Where most time was spent:** Reading Pencil design file to extract text content and structure, then discovering multiple contradictions between the design file and ticket ACs (A-3 already implemented, A-4/A-5 contradict the Pencil design, C-4 padding-bottom discrepancy).

**Which decisions needed revision:** Initial assumption that all 5 changes would require implementation. After design file analysis, A-3 is already complete and A-4/A-5 are contradicted by the design.

**Next time improvement:** When a ticket says "Architect extracts text from design", check the design file BEFORE reading the ticket ACs in detail — this would have immediately surfaced the A-3/A-4/A-5 contradictions earlier and reduced total investigation time.

---

## K-057 New Components (2026-04-29 Backfill)

Shipped in K-057 without Designer pass; SSOT backfilled in K-060 (2026-04-29).

| Component | Location | Background | Text color | Font size | Copy |
|---|---|---|---|---|---|
| DisclaimerBanner | Top of every page, above Hero | `#2A2520` | `#F4EFE5` | 12px center Geist Mono | "Lookup tool for K-line shape similarity — for learning and exploration. Outputs are not predictions and not financial advice." |
| DisclaimerSection | Bottom of page, below footer bar | paper `#F4EFE5` | ink `#2A2520` | 14px IBM Plex Mono heading / 13px Geist Mono body lh-1.6 | "This tool is for educational exploration of K-line pattern similarity only. It does not constitute financial advice…" (see `FooterDisclaimer.tsx`) |

**Pencil nodes (frame `4CsvQ` Homepage):**
- DisclaimerBanner: node `yYnSS`, height 36, `justifyContent: center`, child text node `iWZWh`
- DisclaimerSection: node `qz7Po`, layout vertical, padding `[48, 96]`, gap 12, child nodes `wd7SP` (heading) + `Y2tTQR` (body)

**Same components present across all page frames:**
- `35VCj` (About): DisclaimerBanner `qnQHQ`, DisclaimerSection `QwyrN`
- `4CsvQ` (Homepage): DisclaimerBanner `yYnSS`, DisclaimerSection `qz7Po`
- `wiDSi` (Diary): DisclaimerBanner `ZqmEW`, DisclaimerSection `Us4NB`
- `VSwW9` (Business Logic): DisclaimerBanner and DisclaimerSection absent (page has no footer section)
