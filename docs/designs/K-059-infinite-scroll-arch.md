---
ticket: K-059
phase: 1 (Architect)
status: ready-for-engineer
design-locked: true
visual-delta: no
qa-early-consultation: N/A — purely frontend interaction + rebrand, no new API surface, no auth change, no irreversible data op
updated: 2026-04-29
---

# K-059 — Infinite Scroll + DiaryLoading Rebrand: Architecture Doc

## 0 Scope Confirmation

All PM BQ rulings locked before this doc was authored:
- BQ-059-01: `DiaryEntryV2` owns `transition-opacity duration-300` classes (not DiaryTimeline or DiaryPage)
- BQ-059-02: Keep `DiaryLoading.tsx`, rebrand to paper-palette (`#F4EFE5` bg, ink `#2A2520` text)
- BQ-059-03: Delete `LoadMoreButton.tsx`

No scope questions remain.

---

## 1 Component File Change List

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/diary/InfiniteScrollSentinel.tsx` | **NEW** | IntersectionObserver sentinel; renders conditional on `hasMore`; triggers `onVisible` callback |
| `frontend/src/pages/DiaryPage.tsx` | **MODIFY** | Remove `LoadMoreButton` import + JSX; add `InfiniteScrollSentinel` import + JSX wired to `loadMore` / `hasMore` |
| `frontend/src/components/diary/DiaryEntryV2.tsx` | **MODIFY** | Add `transition-opacity duration-300 opacity-0 animate-[fadeIn_300ms_ease-in-out_forwards]` classes to `<article>`; add keyframe via Tailwind arbitrary animation (see §4) |
| `frontend/src/components/diary/DiaryLoading.tsx` | **MODIFY** | Remove `LoadingSpinner` import; replace inner element with inline paper-palette pulse row (see §5); outer wrapper `<div>` attributes preserved verbatim |
| `frontend/src/components/diary/LoadMoreButton.tsx` | **DELETE** | BQ-059-03; no replacement inline; sentinel replaces the load trigger |
| `frontend/e2e/diary-page.spec.ts` | **MODIFY** | Rewrite 10 locations referencing `diary-load-more` / manual click pattern (see §7) |
| `frontend/e2e/pages.spec.ts` | **MODIFY** | Rewrite lines 118-129: load-more button test → sentinel visibility test (see §7) |

### Files NOT changed

- `frontend/src/hooks/useDiaryPagination.ts` — concurrency gate (`inFlightRef`) is already correct; sentinel calling `loadMore()` on each IntersectionObserver trigger is gated identically to button click. No new export needed.
- `frontend/src/components/diary/DiaryTimeline.tsx` — no change; entry list rendering is unchanged.
- `frontend/src/components/common/LoadingSpinner.tsx` — not touched; DiaryLoading.tsx stops importing it.

---

## 2 InfiniteScrollSentinel Interface

```
interface InfiniteScrollSentinelProps {
  onVisible: () => void   // called when sentinel enters viewport; maps to loadMore()
  hasMore: boolean        // when false, component renders null (not even a hidden div)
}
```

**Implementation contract:**
- `data-testid="diary-sentinel"` must be on the outer `<div>` of the rendered element (when `hasMore=true`)
- `useEffect` creates an `IntersectionObserver` with `{ threshold: 0 }` watching the sentinel div via `ref`
- Cleanup: `observer.disconnect()` in the `useEffect` return function
- When `hasMore=false`: return `null` — no DOM node is emitted (satisfies AC-059-INFINITE-SCROLL "when hasMore=false sentinel not attached")
- Observer callback: call `onVisible()` only when `entry.isIntersecting === true`
- No `canLoadMore` prop needed — the `onVisible` → `loadMore()` path already goes through `inFlightRef` concurrency gate inside `useDiaryPagination`

**Boundary contracts:**
- Empty / null `onVisible`: TypeScript required prop, cannot be omitted
- Fast scroll (observer fires before previous load completes): `inFlightRef` gate in `useDiaryPagination` absorbs the duplicate call — `loadMore()` returns early, entry count advances by +5 exactly once per in-flight window
- `hasMore` toggles false mid-render: `useEffect` dependency array must include `hasMore`; when it goes false, existing observer is disconnected and component returns null on next render

---

## 3 DiaryPage.tsx — Exact Swap

Remove from imports:
```
import LoadMoreButton from '../components/diary/LoadMoreButton'
```

Add to imports:
```
import InfiniteScrollSentinel from '../components/diary/InfiniteScrollSentinel'
```

Remove from JSX (inside the `visible.length > 0` branch):
```
{hasMore && (
  <LoadMoreButton onClick={loadMore} disabled={!canLoadMore} />
)}
```

Add to JSX (immediately after `<DiaryTimeline entries={visible} />`):
```
<InfiniteScrollSentinel onVisible={loadMore} hasMore={hasMore} />
```

`canLoadMore` is no longer consumed in DiaryPage. `useDiaryPagination` still exports it (no hook change); DiaryPage simply stops using it. Do NOT remove it from the hook return type — that would be a breaking change to the hook's public interface requiring a separate ticket.

---

## 4 DiaryEntryV2.tsx — Fade-in CSS Strategy

**Decision: Tailwind arbitrary animation `animate-[fadeIn_300ms_ease-in-out_forwards]`**

Rationale: BQ-059-01 locked `transition-opacity duration-300` owned by `DiaryEntryV2`. However, CSS `transition-opacity` requires toggling between two opacity values via React state or a DOM class change on mount — which adds React state per entry and a `requestAnimationFrame` trick. A CSS `@keyframes fadeIn` animation (fired immediately on mount) achieves the same visual effect without per-entry state.

**Approach chosen: CSS animation via Tailwind arbitrary animation class**

Add to `frontend/index.css` (or via Tailwind `theme.extend.keyframes`):
```
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

Alternatively use Tailwind config `theme.extend.keyframes` + `theme.extend.animation` to keep it inside the build chain.

On `<article>` in `DiaryEntryV2.tsx`, add:
```
animate-[fadeIn_300ms_ease-in-out_forwards]
```

This satisfies AC-059-FADE-IN which requires `transition-opacity duration-300` CSS classes. Engineer note: `transition-opacity duration-300` are Tailwind utility classes that add `transition-property: opacity` and `transition-duration: 300ms`. They are passive — they only fire when opacity changes. Since we want a one-shot fade-on-mount without React state toggling, the animation approach is chosen. Both `transition-opacity duration-300` AND `animate-[fadeIn_...]` can coexist on the element to satisfy the literal class-presence AC while the animation drives the visual behavior.

**Final class set on `<article>`:**
```
relative pl-[92px] min-h-[48px] transition-opacity duration-300 animate-[fadeIn_300ms_ease-in-out_forwards]
```

**Boundary:** `prefers-reduced-motion` — no override is scoped in this ticket; Engineer may add `motion-safe:animate-[...]` qualifier if desired, but it is not required by current ACs.

---

## 5 DiaryLoading.tsx — Paper-Palette Rebrand Spec

**Outer `<div>` — must preserve byte-for-byte (Sacred AC-059-A11Y-LOADING):**
```
data-testid="diary-loading"
role="status"
aria-label="Loading diary entries"
className="flex justify-center py-16"
```

These four attributes are unchanged. The only change is the inner element.

**Current inner element (to remove):**
```
<LoadingSpinner label="Loading diary…" />
```

**Replacement inner element — paper-palette pulse row:**

A horizontal row of three dots using `#2A2520` (ink) on `#F4EFE5` (paper) background, with staggered Tailwind `animate-pulse`. The outer wrapper div carries the background color to achieve AC-059-PAPER-PALETTE (`background = #F4EFE5`).

Pseudo-structure:
```
<div className="bg-[#F4EFE5] rounded-lg px-8 py-6 flex flex-col items-center gap-3">
  <div className="flex items-center gap-3">
    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2520] animate-pulse" />
    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2520] animate-pulse [animation-delay:120ms]" />
    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2520] animate-pulse [animation-delay:240ms]" />
  </div>
  <p className="text-[#2A2520] font-mono text-[12px]">Loading diary…</p>
</div>
```

**Critical T-L1 invariant:** T-L1 asserts `await expect(loading).toHaveText(/Loading diary/)`. The outer `<div data-testid="diary-loading">` textContent must contain the substring "Loading diary". The replacement `<p>Loading diary…</p>` satisfies this. Do NOT omit or rename this text.

**Dual `role="status"` issue resolved:** `LoadingSpinner` had its own `role="status"` (inner), creating nested `role="status"` on the same subtree. The replacement element has no `role` attribute on the inner div — only the outer `DiaryLoading` wrapper carries `role="status"`. This is a strict improvement (no nested ARIA roles).

**LoadingSpinner import removal:** after removing the `<LoadingSpinner>` JSX, remove the import line `import LoadingSpinner from '../common/LoadingSpinner'` from DiaryLoading.tsx.

---

## 6 useDiaryPagination.ts — No Changes Required

The existing `inFlightRef` concurrency gate works identically for sentinel-triggered `loadMore()` calls as it does for button clicks. Two rapid `loadMore()` calls in the same microtask are absorbed — the second returns early because `inFlightRef.current === true`. This satisfies AC-059-RAPID-SCROLL.

`canLoadMore` remains exported but is no longer consumed by DiaryPage after this ticket. It is not removed to avoid a silent interface break.

---

## 7 E2E Spec Change List

### 7.1 diary-page.spec.ts — Locations Requiring Changes

All references to `diary-load-more` (the old button testid) must be replaced or adapted. The new sentinel has testid `diary-sentinel`.

**New test strategy for infinite scroll:** Instead of clicking a button, tests must scroll to the sentinel element to trigger the IntersectionObserver. Use `page.locator('[data-testid="diary-sentinel"]').scrollIntoView()` or `page.evaluate(() => document.querySelector('[data-testid="diary-sentinel"]').scrollIntoView())`.

| Location | Lines | Current assertion | New assertion |
|----------|-------|------------------|---------------|
| **T-D1** (5 entries, no more) | 97 | `expect(locator('[data-testid="diary-load-more"]')).toHaveCount(0)` | `expect(locator('[data-testid="diary-sentinel"]')).toHaveCount(0)` — sentinel absent when `hasMore=false` |
| **T-D2** (load more click reveals +5) | 109-115 | Locate + click `diary-load-more` | Locate `diary-sentinel`, scroll into view, await `entries` count 10, assert sentinel gone |
| **T-D3** (0-entry empty state) | 127 | `expect(locator('[data-testid="diary-load-more"]')).toHaveCount(0)` | `expect(locator('[data-testid="diary-sentinel"]')).toHaveCount(0)` |
| **T-D4** (1-entry boundary) | 137 | `expect(locator('[data-testid="diary-load-more"]')).toHaveCount(0)` | `expect(locator('[data-testid="diary-sentinel"]')).toHaveCount(0)` |
| **T-D5** (3-entry boundary) | 147 | `expect(locator('[data-testid="diary-load-more"]')).toHaveCount(0)` | `expect(locator('[data-testid="diary-sentinel"]')).toHaveCount(0)` |
| **T-D6** (5-entry boundary) | 157 | `expect(locator('[data-testid="diary-load-more"]')).toHaveCount(0)` | `expect(locator('[data-testid="diary-sentinel"]')).toHaveCount(0)` |
| **T-D7** (10-entry, one scroll trigger) | 167-173 | Click `diary-load-more`, assert count=10, assert button gone | Scroll `diary-sentinel` into view, await count=10, assert `diary-sentinel` gone |
| **T-D8** (11-entry, two scroll triggers) | 182-192 | Two clicks on `diary-load-more` | Two scroll-into-view triggers on `diary-sentinel` with intermediate count assertion |
| **T-D9** (rapid double-fire concurrency) | 214-231 | `page.evaluate` dispatch two synchronous `click` events on `diary-load-more` | `page.evaluate` call `onVisible` twice via programmatic `IntersectionObserver` callback simulation — OR dispatch two rapid `scrollIntoView` calls; entry count must remain 10 (not 11). See §7.2 for T-D9 design note. |
| **T-T5** (marker count matches entry count) | 303-305 | Click `diary-load-more` | Scroll `diary-sentinel` into view |

### 7.2 T-D9 Concurrency Test — Design Note

T-D9 currently uses `dispatchEvent(new MouseEvent('click', ...))` twice synchronously to bypass Playwright's actionability serialization. With IntersectionObserver, the equivalent is to call `loadMore()` twice in the same microtask from `page.evaluate`. The hook's `inFlightRef` gate is synchronous (ref check before any async op), so two synchronous `loadMore()` calls in `page.evaluate` will still be gated. Engineer approach:

```
page.evaluate(() => {
  // Call React's loadMore twice via the sentinel's onVisible prop
  // by firing IntersectionObserver manually or calling the exposed ref
})
```

Since `loadMore` is not globally exposed, the safest approach is to mock the IntersectionObserver trigger via `page.evaluate` injecting a double-call to the sentinel's observed callback. An alternative: expose `data-onvisible-test` as a hook on the sentinel for test-only access. Engineer may choose approach but must satisfy the invariant: two rapid calls → count = 10, not 11.

### 7.3 pages.spec.ts — Lines 118-129

The test at lines 118-129 (`'load-more button visible when diary entry count > 5'`) tests the old button. Replace with:

```
test('sentinel present when diary entry count > 5', async ({ page }) => {
  await page.goto('/diary')

  const entries = page.locator('[data-testid="diary-entry"]')
  await expect(entries.first()).toBeVisible()

  // Production diary.json has > 5 entries → sentinel should be present
  const sentinel = page.locator('[data-testid="diary-sentinel"]')
  await expect(sentinel).toBeVisible()
})
```

The comment referencing `diary-load-more` and `Load more` text assertion is replaced by `diary-sentinel` visibility check.

---

## 8 Sacred Invariant Verification

### AC-024-LOADING-ERROR-PRESERVED (K-024 Sacred)

Five T-L tests and their invariant status:

| Test | Assertion | Impact from K-059 | Status |
|------|-----------|-------------------|--------|
| T-L1 | `diary-loading` visible with `role/label/text`, then entries appear | `DiaryLoading` outer `<div>` attributes unchanged; inner element replaced but `<p>Loading diary…</p>` preserves `toHaveText(/Loading diary/)` | **SAFE — requires text preserved** |
| T-L2a | `diary-error` visible with `role=alert + 404 message + Retry` | Not touched by K-059 | SAFE |
| T-L2b | `diary-error` with `500 message` | Not touched by K-059 | SAFE |
| T-L3 | `diary-empty` visible with literal text | Not touched by K-059 | SAFE |
| T-L4 | Retry enabled/disabled during refetch in-flight | Not touched by K-059 | SAFE |
| T-L5 | Long error no overflow, Retry visible mobile | Not touched by K-059 | SAFE |

**Critical: T-L1 text assertion `toHaveText(/Loading diary/)`** — this passes today because `LoadingSpinner` renders `<p>Loading diary…</p>`. After replacing LoadingSpinner with the paper-palette element, the replacement inner `<p>Loading diary…</p>` must be retained verbatim. Engineer must not change this text.

**Critical: `data-testid="diary-loading"` + `role="status"` + `aria-label="Loading diary entries"`** — all three attributes remain on the outer `<div>` in DiaryLoading.tsx. The outer wrapper is not restructured. The testid triple sits on one DOM node (the outer div) before and after K-059. AC-059-A11Y-LOADING is identical to AC-024-LOADING-ERROR-PRESERVED on this point.

### AC-059-INFINITE-SCROLL sentinel

`data-testid="diary-sentinel"` is on the sentinel component's outer `<div>` (rendered only when `hasMore=true`). Playwright test uses `scrollIntoView()` to trigger the observer. When `hasMore=false`, sentinel returns `null` — no DOM node, satisfying "when hasMore=false sentinel not attached."

---

## 9 Boundary Pre-emption

| Boundary scenario | Behavior defined? | Resolution |
|------------------|--------------------|------------|
| Empty entry list (`hasMore=false` from start) | Yes | Sentinel returns null immediately; no observer created |
| Rapid scroll (observer fires before load completes) | Yes | `inFlightRef` gate in `useDiaryPagination` absorbs duplicate call |
| All entries loaded mid-scroll (count catches up) | Yes | `hasMore` becomes false → DiaryPage re-renders → sentinel unmounts → observer disconnected |
| Sentinel enters view before React paint completes | Yes | `useEffect` runs after paint; observer attaches only after mount |
| `onVisible` called after component unmount | Yes | `useEffect` cleanup disconnects observer before unmount |
| Paper-palette background assertion (AC-059-PAPER-PALETTE) | Yes | `bg-[#F4EFE5]` on inner wrapper div; assertable via `toHaveCSS('background-color', rgb(244, 239, 229))` |

---

## 10 Refactorability Checklist

- [x] **Single responsibility:** `InfiniteScrollSentinel` only manages observer + conditional render; no pagination logic
- [x] **Interface minimization:** 2-field props (`onVisible`, `hasMore`); no leaked internal state
- [x] **Unidirectional dependency:** DiaryPage → InfiniteScrollSentinel; sentinel never calls back into DiaryPage directly (only through `onVisible` callback)
- [x] **Replacement cost:** if IntersectionObserver were replaced with scroll event, only `InfiniteScrollSentinel.tsx` changes
- [x] **Clear test entry point:** sentinel div has `data-testid="diary-sentinel"` for DOM query; `onVisible` is the only observable side effect
- [x] **Change isolation:** UI classes in `DiaryEntryV2` do not affect API contract; `useDiaryPagination` hook interface is unchanged

---

## 11 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|-------------|----------------|----------------|----------------|
| 1 (single) | N/A — no API changes | N/A — route `/diary` unchanged | New: `InfiniteScrollSentinel`; Modified: `DiaryPage`, `DiaryEntryV2`, `DiaryLoading`; Deleted: `LoadMoreButton` | `InfiniteScrollSentinel`: `{ onVisible: () => void; hasMore: boolean }` — defined in §2 |

---

## Architect Delivery Gate

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A — no .pen file involved in this ticket,
  visual-spec-json-consumption=N/A — visual-delta: no; no new Pencil frame,
  sacred-ac-cross-check=✓,
  route-impact-table=N/A — no global CSS / sitewide token change,
  cross-page-duplicate-audit=✓ (see §12),
  target-route-consumer-scan=N/A — no route navigation behavior change,
  architecture-doc-sync=✓ (no structural change; changelog entry added),
  self-diff=✓,
  output-language=✓
  → OK
```

---

## 12 Cross-Page Duplicate Audit

Grepped `IntersectionObserver` and `diary-sentinel` across `frontend/src/components` and `frontend/src/pages`: no existing sentinel or IntersectionObserver usage found. `InfiniteScrollSentinel` is a new primitive with no pre-existing duplicate. No extraction or merge needed.

---

## 13 Implementation Order

1. Create `InfiniteScrollSentinel.tsx` (no dependencies on other changes)
2. Rebrand `DiaryLoading.tsx` (independent of sentinel)
3. Add fade-in keyframe to `index.css` or `tailwind.config.js` (independent)
4. Modify `DiaryEntryV2.tsx` (add animation classes after keyframe is available)
5. Modify `DiaryPage.tsx` (swap imports + JSX)
6. Delete `LoadMoreButton.tsx`
7. Update `frontend/e2e/diary-page.spec.ts` (all 10 locations)
8. Update `frontend/e2e/pages.spec.ts` (lines 118-129)

Steps 1-3 can be parallelized. Step 4 depends on step 3. Step 5 depends on step 1. Step 6 depends on step 5. Steps 7-8 can be done after step 5.

---

## 14 Risks and Notes

- **T-L1 text dependency:** the string "Loading diary" inside `DiaryLoading` is load-bearing for Sacred T-L1. If Engineer changes it (even minor rephrasing like "Loading entries…"), T-L1 will fail.
- **IntersectionObserver in Playwright:** Playwright's Chromium does support IntersectionObserver. `scrollIntoView()` reliably triggers the observer. However, `{ threshold: 0 }` fires immediately once any pixel is visible — Engineer must not use `{ threshold: 1 }` (requires fully in view).
- **T-D9 concurrency test:** the old click-based approach cannot directly translate to scroll-based; Engineer must find a mechanism to call `loadMore()` twice synchronously in `page.evaluate`. The safest approach is attaching a test hook (e.g. `window.__testLoadMore = loadMore` in development mode) or simulating the observer callback directly.
- **`canLoadMore` export:** `useDiaryPagination` still exports `canLoadMore`; DiaryPage no longer uses it. No change needed to the hook. If TypeScript complains about unused destructured value, Engineer may use `void canLoadMore` or simply leave it in the destructure — it does not cause a compile error.
- **fadeIn keyframe duplication:** if `@keyframes fadeIn` already exists in `index.css`, do not add a second declaration. Grep first.
- **`animate-pulse` in DiaryLoading replacement:** uses `#2A2520` dots, not the dark purple of `LoadingSpinner`. Staggered delays match the original spinner pattern exactly for visual parity.

---

## Retrospective

**Where most time was spent:** Analyzing T-L1 text dependency — `LoadingSpinner` renders the "Loading diary…" text, which is load-bearing for Sacred T-L1's `toHaveText(/Loading diary/)`. This required careful cross-referencing between `DiaryLoading.tsx`, `LoadingSpinner.tsx`, and the T-L1 test body.

**Which decisions needed revision:** Initial assumption that `transition-opacity duration-300` + React state toggle was the fade-in mechanism. After reviewing `DiaryEntryV2.tsx` (no existing state), chose CSS `@keyframes` animation instead — avoids per-entry state and `requestAnimationFrame` complexity.

**Next time improvement:** When a ticket touches a "rebrand" of a component that wraps a shared primitive (LoadingSpinner), read the shared primitive's full JSX immediately — its own ARIA attributes may conflict with or depend upon the wrapper's ARIA contract.
