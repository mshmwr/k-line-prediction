---
id: K-059
title: /diary — Infinite Scroll + CSS opacity fade (replace LoadMoreButton; style-consistent loading animation)
status: open
created: 2026-04-28
type: feat + refactor
priority: medium
size: medium
visual-delta: yes
content-delta: no
design-locked: false
qa-early-consultation: docs/retrospectives/qa.md 2026-04-29 K-059
dependencies: [K-024]
worktree: .claude/worktrees/K-059-diary-infinite-scroll
branch: K-059-diary-infinite-scroll
base-commit: (to be filled at branch creation)
---

## Summary

`/diary` currently uses a manual "Load more ↓" button (`LoadMoreButton.tsx`) and an off-palette full-page spinner (`DiaryLoading.tsx`, tracked as TD-K024-01). Two user-reported issues:

1. **Load-more button is non-standard UX** for a timeline page; Infinite Scroll is the expected pattern.
2. **Loading components do not match site aesthetic** (dark spinner on paper palette background).

This ticket replaces the button with Infinite Scroll and brings all diary loading states to paper-palette aesthetic using CSS opacity fade. No backend change needed — `/diary` already fetches the full flat array from `diary.json`; pagination is client-side slicing via `useDiaryPagination`.

**Pattern selected: C (CSS opacity fade).** Each batch of newly-revealed entries fades in from `opacity: 0` to `opacity: 1` via CSS transition (300ms). Non-blocking — already-visible entries remain stable; new entries appear incrementally as viewport scroll triggers the sentinel.

## Phases

### Phase 1 — Architect

- Design IntersectionObserver sentinel integration into `DiaryPage.tsx` + `useDiaryPagination` hook
- Confirm CSS opacity fade strategy: `DiaryEntryV2` or a wrapper `div` gets `opacity-0 animate-fadeIn` class, implemented via Tailwind `@keyframes` in `tailwind.config.ts` or inline `transition-opacity duration-300`
- Verify no Sacred violations: K-024 `data-testid="diary-loading"` + `role="status"` preservation required if initial loading state is touched
- Define which component owns the sentinel (new `InfiniteScrollSentinel.tsx` or inline in `DiaryPage.tsx`)
- Write architecture doc `docs/designs/K-059-infinite-scroll-arch.md`

### Phase 2 — Engineer

Source targets:
- `frontend/src/components/diary/LoadMoreButton.tsx` — remove (keep file as empty deprecated stub or delete; Architect decides)
- `frontend/src/components/diary/InfiniteScrollSentinel.tsx` — new file: invisible `div ref` at timeline bottom; `IntersectionObserver` fires `onVisible` callback
- `frontend/src/hooks/useDiaryPagination.ts` — expose `loadMore` compatible with both button (deprecated) and observer patterns
- `frontend/src/pages/DiaryPage.tsx` — replace `<LoadMoreButton>` with `<InfiniteScrollSentinel onVisible={loadMore} hasMore={hasMore} />`
- `frontend/src/components/diary/DiaryLoading.tsx` — replace dark `LoadingSpinner` with paper-palette inline pulse or remove entirely (TD-K024-01 resolution)
- `frontend/src/components/diary/DiaryEntryV2.tsx` — add CSS fade-in class for newly-added entries (`transition-opacity duration-300 opacity-0` → `opacity-100` after mount)

Sacred (K-024):
- `data-testid="diary-loading"` + `role="status"` + `aria-label="Loading diary entries"` must remain if initial loading state component is kept (AC-024-LOADING-ERROR-PRESERVED)
- `data-testid="diary-load-more"` — this testid will be removed with `LoadMoreButton`; update all E2E specs referencing it

E2E updates (8 locations — QA C-7 enumeration):
- `diary-page.spec.ts` T-D1 (line ~97) — negative count assertion → update to sentinel-based
- `diary-page.spec.ts` T-D2 (lines ~100–116) — click-to-load → replace with scroll-to-load + sentinel scrollIntoView
- `diary-page.spec.ts` T-D4 (lines ~130–138) — negative button presence → keep (no-button still valid)
- `diary-page.spec.ts` T-D7 (lines ~160–174) — click trigger → replace with scroll trigger
- `diary-page.spec.ts` T-D8 (lines ~176–192) — two-click → replace with two-scroll
- `diary-page.spec.ts` T-D9 (lines ~194–232) — double-click gate → replace with double-observer-fire via `page.evaluate`
- `diary-page.spec.ts` T-T5 (lines ~291–306) — marker count after load-more click → replace with scroll trigger
- `pages.spec.ts` lines ~126–128 — load-more visible check → remove or replace with sentinel check

New E2E:
- Scroll to sentinel → assert entry count increases (AC-059-INFINITE-SCROLL)
- `hasMore=false` after exhaustion → sentinel not attached (AC-059-NO-SENTINEL-WHEN-EXHAUSTED)
- Double-observer-fire via `page.evaluate` → entry count +5 only (AC-059-RAPID-SCROLL)

### Phase 3 — QA + Deploy

QA: full E2E pass + visual regression on `/diary` (paper-palette loading state, fade animation visible in slow-scroll test)
Deploy: Firebase Hosting only

## Acceptance Criteria

- **AC-059-INFINITE-SCROLL**: (a) Sentinel exposed as `data-testid="diary-sentinel"`. (b) Playwright: load diary with ≥6 fixture entries (first batch=5); `scrollIntoViewIfNeeded('[data-testid="diary-sentinel"]')`; assert entry count ≥6. (c) When `hasMore=false`, `expect(page.locator('[data-testid="diary-sentinel"]')).not.toBeAttached()`.
- **AC-059-NO-LOAD-MORE-BUTTON**: `data-testid="diary-load-more"` not attached to rendered `/diary` DOM.
- **AC-059-NO-SENTINEL-WHEN-EXHAUSTED**: After all entries loaded from a ≤10-entry fixture, `data-testid="diary-sentinel"` not attached to DOM. *(QA C-8)*
- **AC-059-FADE-IN**: Newly-revealed entries have CSS classes `transition-opacity` and `duration-300` (class-presence assertion). Animation timing = KG-059-01. *(QA C-3 KG adjudication)*
- **AC-059-RAPID-SCROLL**: Calling `loadMore()` twice synchronously (via `page.evaluate`) → entry count advances by exactly one batch (5), not two. *(QA C-5)*
- **AC-059-PAPER-PALETTE**: `DiaryLoading.tsx` background is paper palette (`#F4EFE5`) and spinner is ink-colored; computed `background-color` ≠ dark values. Exact tokens defined by BQ-059-02 Option A rebrand.
- **AC-059-A11Y-LOADING**: `data-testid="diary-loading"` + `role="status"` + `aria-label="Loading diary entries"` (byte-equal, no paraphrase). *(QA C-6)*
- **AC-059-DESIGN-LOCKED**: `design-locked: true` set before Phase A PR merge.

## Known Gaps (QA EC 2026-04-29)

- **KG-059-01**: CSS opacity transition timing (300ms) is not machine-verifiable in headless Playwright CI. AC-059-FADE-IN uses CSS class presence as approved proxy; visual timing verified in Phase 3 manual smoke-test only.
- **KG-059-02**: IntersectionObserver concurrent-fire during in-flight state verified at Vitest hook level only (`useDiaryPagination.test.ts`). E2E-level concurrency test deferred.

## BQ Rulings (PM 2026-04-29 QA EC)

- **BQ-059-01** ✅ **Option A** — `DiaryEntryV2` owns `transition-opacity duration-300` class. Entry controls its own entrance animation.
- **BQ-059-02** ✅ **Option A** — Keep `DiaryLoading.tsx`, rebrand to paper-palette (`#F4EFE5` bg, ink text). Resolves TD-K024-01. Sacred AC-024-LOADING-ERROR-PRESERVED testid/ARIA preserved.
- **BQ-059-03** ✅ **Option A** — Delete `LoadMoreButton.tsx`. No deprecated stub.

## Tech Debt Resolved

- TD-K024-01 — DiaryLoading paper-palette migration (filed K-024, resolved here if BQ-059-02 = A).
