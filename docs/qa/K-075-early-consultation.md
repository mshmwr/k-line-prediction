---
ticket: K-075
phase: 2 (QA Early Consultation)
status: complete
created: 2026-05-02
---

# QA Early Consultation — K-075 AppPage.tsx Decomposition

Pre-implementation review. Engineer release gate: all Challenges below must be resolved by PM before Phase 3 begins.

---

## §1 AC Verifiability Review

### AC-075-APPPAGE-LINE-COUNT
**Testable** — automatable via `wc -l frontend/src/AppPage.tsx` in the Phase 5 gate. Threshold is concrete (≤ 100). No edge state missing.

**Gap:** AC states "all logic resides in extracted hooks or utils" — this is unverifiable by line count alone. A 95-line AppPage that still contains an inline `useState` inside the JSX passes the line-count check but violates the AC intent.

> **QA Challenge #1 — AC-075-APPPAGE-LINE-COUNT**
> Issue: "all logic resides in extracted hooks or utils" has no automatable verification proxy other than line count. A file with 99 lines can still contain inline logic (e.g., a `useCallback` defined in the render body).
> Needs supplementation: PM to add one of: (a) "no `useState`, `useMemo`, `useEffect`, `useCallback` calls appear in AppPage.tsx body except for the four named useMemos listed in §3" OR (b) "`tsc --noEmit` + grep assertion added to CI gate". Without this, QA will verify by manual inspection, which is not repeatable.
> If not supplemented: QA will accept `wc -l ≤ 100` as the sole gate at sign-off (manual review noted as a Known Gap).

### AC-075-HOOK-FILES-EXIST
**Testable** — automatable: `ls` + `grep exports` against all three paths. No ambiguity.

No challenge.

### AC-075-K030-ISOLATION
**Testable** — the existing `app-bg-isolation.spec.ts` (6 test cases) covers this completely: no UnifiedNavBar testids, no footer role/text, root `bg-gray-950` computed style. These specs pass without live backend (they use `mockApis`).

No challenge. Confirmed: this AC is self-verifying via existing spec.

### AC-075-K013-CONTRACT
**Testable** — `statsComputation.test.ts` imports directly from `utils/statsComputation`, not from AppPage. Import path is already decoupled. Post-refactor: verify `import { computeStatsFromMatches } from './utils/statsComputation'` is still present in AppPage residual via grep.

No challenge. AC is verifiable by grep + Vitest green.

### AC-075-TD004-CHART-STABLE
**Partially testable** — the AC has two sub-clauses:

1. "No `eslint-disable-next-line react-hooks/exhaustive-deps` remains on the PredictorChart effect" — **fully automatable** via `grep -n "eslint-disable-next-line react-hooks/exhaustive-deps" frontend/src/MatchList.tsx` (must return empty).
2. "Two consecutive matches with identical length but different candle values render distinct charts" — **not covered by existing specs**. `ma99-chart.spec.ts` only asserts `data-testid="match-chart"` presence, not candle data distinctness. All `ma99-chart.spec.ts` tests are already known-red (live backend required). See §2 for coverage gap analysis.

> **QA Challenge #2 — AC-075-TD004-CHART-STABLE**
> Issue: The "distinct charts" clause cannot be verified by the existing Playwright suite. The eslint-disable grep check is automatable; the behavioral clause is not.
> Needs supplementation: PM to rule on one of: (a) new Playwright spec required before sign-off (QA proposes scope in §2), OR (b) "verified by eslint-disable removal only; behavioral correctness is accepted on trust of key-prop mechanism" — explicitly declared Known Gap.
> If not supplemented: QA will accept eslint-disable grep as the sole automatable gate, and mark behavioral correctness as a Known Gap with PM-explicit declaration required at sign-off.

### AC-075-NO-BEHAVIOR-CHANGE
**Testable** — two parts:
1. `npx tsc --noEmit` zero errors: automatable, run in Phase 5.
2. Full Playwright E2E suite passes (existing spec count, no new known-reds): automatable against `known-reds.md` manifest.

**Gap:** "existing spec count" is ambiguous when known-reds are counted. The actual gate should be "no new failures outside the known-reds manifest." This is already the Step 3a protocol — no PM action needed, just noting the interpretation.

No challenge.

---

## §2 Coverage Gap Analysis — Design Doc §6

### AC-075-TD004-CHART-STABLE: New Playwright Spec Decision

Design doc §6 flags this as a "recommended (not blocking)" coverage gap. QA position:

**Recommended scope (if PM rules that a new spec IS required):**

New file: `frontend/e2e/predictor-chart-remount.spec.ts`

Required test cases:
1. Upload fixture where match-1 and match-2 share `historical_ohlc.length` and `future_ohlc.length` but differ in `close[0]` values
2. Open match-1 accordion → assert `data-testid="match-chart"` visible; capture key attribute of `<PredictorChart>`
3. Close match-1, open match-2 accordion → assert `data-testid="match-chart"` visible; assert key attribute differs from match-1
4. Verify: `eslint-disable` line absent in MatchList.tsx (can be a non-Playwright grep assert in the test)

**Why key-attribute capture works:** the design doc's `key` prop is `${m.id}_${m.startDate}_${hist.length}_${fut.length}_${String(hist[0]?.close ?? '')}_${String(fut[0]?.close ?? '')}` — a PW `getAttribute('key')` on the PredictorChart root div (if it receives the key) would confirm remount. However: React `key` is not exposed as a DOM attribute. The viable alternative is:
- Assert `[data-testid="match-chart"]` is detached then re-attached between match switches (DOM replacement, not mutation)
- Use `page.waitForSelector('[data-testid="match-chart"]', { state: 'detached' })` between accordion closes/opens

**Blocker:** all existing `ma99-chart.spec.ts` tests are known-red because they require live backend. A new spec that also requires live backend will immediately become a known-red on merge. If the new spec is added, it must be designed with mocked routes (`page.route('/api/predict', ...)`) using the existing pattern from `ma99-chart.spec.ts`'s `setupAndPredict` helper, which already mocks `/api/history-info`, `/api/merge-and-compute-ma99`, and `/api/predict`.

**QA ruling on new spec requirement:**

This is NOT a blocker for Engineer release. It IS a condition for QA sign-off in Phase 5 unless PM explicitly declares Known Gap. See §5 for Phase 5 sign-off conditions.

### New Vitest Tests: useOfficialInput.test.ts and statsByDay.test.ts

Design doc §6 specifies:

**useOfficialInput.test.ts** — target: `utils/officialCsvParsing.ts` pure functions (not the hook itself).

| Required test case | Coverage adequate? |
|---|---|
| 24-row parse roundtrip (`parseOfficialCsvFile`) | Covered by existing `parseOfficialCsvFile.test.ts` after import path update |
| Timestamp conversion (`parseExchangeTimestamp`) | NOT covered — no existing test for this function |
| Empty row detection (`isRowComplete`) | NOT covered — no existing test |
| `emptyRows` factory output | NOT covered |

**Gap:** Three of four functions in `utils/officialCsvParsing.ts` have zero test coverage. The design doc says "test key behaviors" but does not specify: what timestamp inputs? What timezone edge cases? `parseExchangeTimestamp` is described as converting unix-seconds → display string. QA expects:
- At least: epoch 0 test, DST boundary if timezone conversion is involved, negative timestamp guard

> **QA Challenge #3 — useOfficialInput.test.ts scope**
> Issue: Design doc lists "timestamp conversion" and "empty row detection" as test targets but does not quantify boundary cases. `parseExchangeTimestamp` may have timezone-sensitive behavior (UTC vs local).
> Needs supplementation: Architect or PM to confirm (a) whether `parseExchangeTimestamp` converts to UTC+8 display or local timezone, and (b) minimum boundary cases expected (epoch 0, known timestamp roundtrip). Without this, Engineer may write under-specified tests that pass in CI (UTC server) but fail in local dev (UTC+8).
> If not supplemented: QA will accept any test that covers a known timestamp roundtrip as passing; timezone edge case is Known Gap.

**statsByDay.test.ts** — target: `computeStatsByDay` in `utils/statsByDay.ts`.

| Required test case | Coverage adequate? |
|---|---|
| 3-day grouping | Adequate |
| Single-day input | Adequate |
| Empty input | Adequate |

Gap check: design doc says "UTC+8 date grouping logic." QA expects a test that explicitly provides a UTC timestamp that falls on a date boundary (e.g., UTC 23:59 on day N = UTC+8 00:59 on day N+1). Without a day-boundary test, the grouping logic is not verified at its critical edge.

> **QA Challenge #4 — statsByDay.test.ts UTC+8 boundary**
> Issue: "3-day grouping" and "single-day input" tests do not verify UTC→UTC+8 date rollover behavior. A bug in the UTC offset (+8h) would pass all three listed test cases if the fixture data does not straddle a day boundary in UTC.
> Needs supplementation: Add one test case: input contains bars whose UTC timestamps straddle a UTC midnight (e.g., 2024-01-01 23:30 UTC and 2024-01-02 00:30 UTC), assert they group to 2024-01-02 and 2024-01-03 in UTC+8 respectively.
> If not supplemented: QA marks UTC+8 boundary as Known Gap at sign-off.

---

## §3 Runtime Hook Extraction Risk Flags

### React Hook Ordering Violations

The design assigns three hooks to `useOfficialInput`, `useHistoryUpload`, `usePredictionWorkspace` in AppPage — called unconditionally at the component top level. Design doc §1 shows AppPage residual calls all four hooks sequentially before any conditional logic. No conditional hook calls are introduced.

**Risk:** LOW. The injection pattern (passing `resetPredictionState` and `setQueryMa99`/`setQueryMa99Gap` as function params) does NOT call hooks inside callbacks — the injected values are plain function references, not hook calls. Hook ordering is fixed at four unconditional calls.

**Verification needed at Phase 5:** `npx tsc --noEmit` catches hook misuse at type-level. React DevTools / runtime "hooks changed order" error will surface if any conditional hook call is introduced. QA will confirm by running the full E2E suite (React strict mode violations surface as runtime errors in Playwright console).

### useSearchParams Moved into useOfficialInput

The design doc risk table (§Risks) notes: "`const [searchParams] = useSearchParams()` moves into `useOfficialInput`."

**Risk:** MEDIUM. `useSearchParams` requires `RouterContext`. If `useOfficialInput` is ever tested in isolation (e.g., `renderHook` without a `MemoryRouter` wrapper), tests will throw. The existing `parseOfficialCsvFile.test.ts` does NOT render the hook — it tests a pure function — so no immediate test breakage. Future hook-level unit tests MUST wrap with `MemoryRouter`.

**Design flag:** `useHistoryUpload` contains a `fetch` side effect for `/api/history-info`. If this hook is ever used outside `AppPage`, it will make a real network call. Not a regression risk for this ticket, but noted for future testability.

**Verification at Phase 5:** No `useSearchParams` import should appear in AppPage residual after Phase C (it moves to `useOfficialInput`). QA will verify: `grep -n "useSearchParams" frontend/src/AppPage.tsx` returns empty post-refactor.

### Analytics Calls (trackCsvUploaded) Moving into useOfficialInput

Design doc §5 sacred testid inventory confirms: `trackCsvUploaded(` moves to `useOfficialInput.ts`. Design doc security notes: "Analytics calls (`trackDemoStarted`, `trackCsvUploaded`, etc.) must move with their trigger handlers."

**Risk:** MEDIUM — two failure modes:

1. **Duplicate call risk:** If `handleOfficialFilesUpload` is accidentally called twice (e.g., React StrictMode double-invoke in development), `trackCsvUploaded` fires twice. This is existing behavior (it fires in AppPage today) — the move does not change the call count. Risk is UNCHANGED, not introduced.

2. **Missing call risk:** If the analytics import (`import { trackCsvUploaded } from '...'`) is not moved to `useOfficialInput.ts`, the call silently disappears. No TypeScript error (it's a side effect call). No Playwright spec asserts analytics calls except `ga-tracking.spec.ts` (which tests GA consent / dataLayer pushes for page events, not CSV upload events).

> **QA Interception #1 — trackCsvUploaded missing-call risk**
> Boundary scenario: `trackCsvUploaded` call is dropped during migration (import not moved); no TypeScript error; no existing Playwright assertion catches it.
> Covered by existing AC: No — AC-075-NO-BEHAVIOR-CHANGE covers Playwright E2E pass but no spec asserts `trackCsvUploaded` fires on upload.
> Requesting PM: Option A — add an AC or test case that asserts analytics call fires on CSV upload (requires `page.on('console', ...)` or `window.dataLayer` intercept). Option B — explicitly declare "analytics call correctness not tested; Known Gap." QA can proceed with Option B if PM confirms, but will require it to be documented in sign-off.

---

## §4 Known-Red Step for Phase 5 (Step 3a)

This refactor only modifies `/app` route behavior (AppPage.tsx) and MatchList.tsx. No route other than `/app` is affected.

**Routes NOT affected:**
- `/` (homepage) — no AppPage or MatchList dependency
- `/about` — no AppPage or MatchList dependency
- `/diary` — no AppPage or MatchList dependency
- `/business-logic` — no AppPage or MatchList dependency

**Known-red sibling route ruling:** Step 3a (sibling route enumeration) does NOT apply to this refactor — the changed components are page-specific to `/app`. No new sibling-route known-red entries are expected.

**Expected known-red count at Phase 5:** The 26 existing entries in `docs/qa/known-reds.md` remain unchanged. K-075 must produce zero new known-red entries. Any new failure not in the manifest = hard block.

**Exception to monitor:** if TD-004 fix (PredictorChart key prop) causes existing `ma99-chart.spec.ts` tests to change their failure mode (e.g., from timeout to assertion error), the manifest entries may need title updates. Test titles are byte-equal matched. QA will check manifest identity, not just count, at Phase 5.

---

## §5 QA Phase 5 Sign-Off Conditions

Explicit checklist. All items must be green before sign-off. Items marked `[PM-ruling]` require PM response to the Challenge above before they resolve.

| # | Condition | Verification method |
|---|---|---|
| 1 | `wc -l frontend/src/AppPage.tsx` ≤ 100 | Shell command |
| 2 | No `useState`/`useEffect`/`useCallback` defined inline in AppPage body (outside the four named useMemos) | `grep -n "useState\|useEffect\|useCallback" frontend/src/AppPage.tsx` — must return empty or only residual useMemo calls |
| 3 | `frontend/src/hooks/useOfficialInput.ts` exists + exports `useOfficialInput` | `grep -n "export.*useOfficialInput" frontend/src/hooks/useOfficialInput.ts` |
| 4 | `frontend/src/hooks/useHistoryUpload.ts` exists + exports `useHistoryUpload` | `grep -n "export.*useHistoryUpload" frontend/src/hooks/useHistoryUpload.ts` |
| 5 | `frontend/src/hooks/usePredictionWorkspace.ts` exists + exports `usePredictionWorkspace` | `grep -n "export.*usePredictionWorkspace" frontend/src/hooks/usePredictionWorkspace.ts` |
| 6 | All 6 K-030 Playwright tests pass | `TICKET_ID=K-075 npx playwright test app-bg-isolation.spec.ts` — all 6 green |
| 7 | `computeStatsFromMatches` import from `'./utils/statsComputation'` present in AppPage | `grep -n "computeStatsFromMatches" frontend/src/AppPage.tsx` — must show import line |
| 8 | `parseOfficialCsvFile.test.ts` import updated to `../utils/officialCsvParsing` | `grep -n "from" frontend/src/__tests__/parseOfficialCsvFile.test.ts` |
| 9 | No `eslint-disable-next-line react-hooks/exhaustive-deps` on PredictorChart effect in MatchList | `grep -n "eslint-disable-next-line react-hooks/exhaustive-deps" frontend/src/MatchList.tsx` — must return empty |
| 10 | `npx tsc --noEmit` exits 0 | Shell command |
| 11 | Full Playwright suite: no new failures outside known-reds manifest (byte-equal identity check) | `TICKET_ID=K-075 npx playwright test` + manifest comparison |
| 12 | New Vitest files exist + pass: `useOfficialInput.test.ts`, `statsByDay.test.ts` | `npx vitest run frontend/src/__tests__/useOfficialInput.test.ts frontend/src/__tests__/statsByDay.test.ts` |
| 13 | `useSearchParams` import absent from AppPage residual | `grep -n "useSearchParams" frontend/src/AppPage.tsx` — must return empty |
| 14 | `trackCsvUploaded` import present in `useOfficialInput.ts` | `grep -n "trackCsvUploaded" frontend/src/hooks/useOfficialInput.ts` |
| 15 | AC-075-TD004 behavioral clause | `[PM-ruling]` — either new Playwright spec green, or Known Gap declared by PM (QA Challenge #2) |
| 16 | `statsByDay.test.ts` includes UTC+8 day-boundary case | `[PM-ruling]` — or Known Gap declared (QA Challenge #4) |

**Sign-off is withheld until:** (a) all 14 non-PM-ruling conditions are green, (b) PM has ruled on Challenges #1–#4, and (c) any newly introduced known-red is explicitly added to the manifest before PR merge.

---

## §6 Summary of PM Actions Required Before Engineer Release

| Item | Required action |
|---|---|
| QA Challenge #1 | PM supplements AC-075-APPPAGE-LINE-COUNT with inline-logic prohibition OR accepts manual-inspection Known Gap |
| QA Challenge #2 | PM rules: new Playwright spec for TD-004 behavioral clause required, OR Known Gap declared |
| QA Challenge #3 | PM/Architect confirms `parseExchangeTimestamp` timezone behavior + minimum boundary cases |
| QA Challenge #4 | PM confirms UTC+8 day-boundary test case required OR Known Gap declared |
| QA Interception #1 | PM rules: analytics call assertion added to test scope OR Known Gap declared |
