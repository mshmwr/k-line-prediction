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
qa-early-consultation: pending
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

E2E updates:
- `frontend/e2e/DiaryPage.spec.ts` — remove `diary-load-more` button assertions; add Infinite Scroll trigger test (scroll to bottom → new entries appear)
- Any other spec referencing `data-testid="diary-load-more"` — update or remove

New E2E:
- Scroll to bottom of diary → assert entry count increases (Playwright `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`)
- New entries visible after scroll with no button click required

### Phase 3 — QA + Deploy

QA: full E2E pass + visual regression on `/diary` (paper-palette loading state, fade animation visible in slow-scroll test)
Deploy: Firebase Hosting only

## Acceptance Criteria

- AC-059-INFINITE-SCROLL: visiting `/diary` + scrolling to bottom without clicking any button triggers additional entries to appear (Playwright scroll + count assertion)
- AC-059-NO-LOAD-MORE-BUTTON: `data-testid="diary-load-more"` does not exist in rendered `/diary` DOM (Playwright `expect(locator).not.toBeAttached()`)
- AC-059-FADE-IN: new diary entries appear with opacity transition; no hard-pop (visual: Playwright slow-scroll screenshot or CSS class assertion)
- AC-059-PAPER-PALETTE: initial loading state (if visible) uses paper palette colors, not dark spinner (Playwright screenshot comparison)
- AC-059-A11Y-LOADING: if initial loading state retained, `data-testid="diary-loading"` + `role="status"` + `aria-label` preserved (Playwright ARIA assertion)
- AC-059-DESIGN-LOCKED: `design-locked: true` set before Phase A PR merge

## Open BQs for Architect

- **BQ-059-01** — Entry fade-in ownership: (A) `DiaryEntryV2` owns `transition-opacity` class, (B) wrapper `div` in `DiaryTimeline` applies the class to each new batch, (C) `InfiniteScrollSentinel` callback applies class to sentinel's next siblings. Default: A (simplest; entry owns its entrance animation).
- **BQ-059-02** — Initial loading state: (A) keep `DiaryLoading.tsx` with paper-palette rebrand (resolves TD-K024-01), (B) remove entirely and rely on Suspense boundary. Default: A (preserve AC-024-LOADING-ERROR-PRESERVED testid/ARIA contract).
- **BQ-059-03** — `LoadMoreButton.tsx` fate: (A) delete file, (B) keep as empty deprecated export. Default: A (unused code, Sacred clause is the testid on the button which we intentionally retire).

## Tech Debt Resolved

- TD-K024-01 — DiaryLoading paper-palette migration (filed K-024, resolved here if BQ-059-02 = A).
