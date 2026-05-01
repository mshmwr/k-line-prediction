---
id: K-075
title: AppPage.tsx decomposition RFC — TD-004 + TD-005
status: open
created: 2026-05-02
type: refactor
priority: medium
size: large
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: "✗ — required before Engineer release (runtime hook extraction, state wiring change)"
dependencies: [K-013]
resolves-td: [TD-004, TD-005]
sacred-regression:
  - K-030  # AppPage isolation: no UnifiedNavBar / no Footer; bg-gray-950 text-gray-100 root
  - K-013  # statsComputation.ts contract; computeStatsFromMatches boundary unchanged
base-commit: cb4284cc5a22fad8ccb2b7c91787209a89e3d1d4
---

## Summary

AppPage.tsx is 517 lines with 8 `useState`, 7 `useMemo`, 2 `useEffect`, and 6 event handlers
spanning three distinct responsibility domains: official CSV ingestion, prediction orchestration,
and MA99 history loading. TD-004 (MatchList PredictorChart stale chart bug) is batched into the
same delivery per SSOT RFC ordering.

Trigger condition satisfied: K-013 closed 2026-04-21; TD-008 closed. RFC ordering position 1.

---

## Problem

**TD-005 — AppPage.tsx over-responsibility (517 lines)**

Three unrelated concern groups live in one component:

| Domain | State / handlers |
|--------|-----------------|
| Official CSV ingestion | `ohlcData`, `sourcePath`, `loadError`, `maLoading`, `queryMa99`, `queryMa99Gap` + `handleOfficialFilesUpload`, `handleCellChange`, `handleTimeframeChange`, `parseOfficialCsvFile`, `parseExchangeTimestamp` |
| Prediction workspace | `matches`, `tempSelection`, `appliedSelection`, `appliedData` + `resetPredictionState`, `handleToggle`, `handlePredict` |
| History info | `historyInfo` + fetch `useEffect` |

**TD-004 — MatchList PredictorChart stale chart (companion, same batch)**

`PredictorChart` effect deps exclude actual candle values. When two matches share the same
length but differ in content, the chart renders stale data. Fix: memoized chart input or
data identity hash; remove `exhaustive-deps` suppression.

---

## Architect RFC — Required Output

Architect must produce a design doc (or augment this ticket's §Design section) covering:

1. **Hook boundaries:** exact state/handler assignments for each proposed hook
2. **File plan:** new filenames under `frontend/src/hooks/`
3. **AppPage residual:** confirm render function lands at ≤ 100 lines post-split
4. **TD-004 fix approach:** memoized input object vs. data identity hash — pick one, justify
5. **Sacred preservation plan:** how K-030 isolation invariants are maintained through refactor
6. **Test impact:** which Vitest / Playwright specs need update; whether new unit tests are required

---

## Proposed Architecture (from Architect session 2026-05-02)

```
hooks/useOfficialInput.ts      ← ohlcData / sourcePath / loadError / maLoading /
                                  queryMa99 / queryMa99Gap
                                  handleOfficialFilesUpload / handleCellChange /
                                  handleTimeframeChange
                                  parseOfficialCsvFile / parseExchangeTimestamp (move to utils/)

hooks/useHistoryUpload.ts      ← historyInfo + fetch useEffect

hooks/usePredictionWorkspace.ts ← matches / tempSelection / appliedSelection / appliedData
                                   resetPredictionState / handleToggle / handlePredict
                                   (usePrediction.ts boundary preserved)

AppPage.tsx (residual)         ← ≤ 100 lines: import hooks, layout JSX only

utils/ (pure functions moved)  ← parseOfficialCsvFile, parseExchangeTimestamp,
                                  isRowComplete, computeStatsByDay, emptyRows
```

---

## Acceptance Criteria

> ACs will be finalized by PM after Architect RFC sign-off. Placeholder ACs below.

**AC-075-APPPAGE-LINE-COUNT:** `frontend/src/AppPage.tsx` is ≤ 100 lines after decomposition
(measured by `wc -l`). All logic resides in extracted hooks or utils.

**AC-075-HOOK-FILES-EXIST:** All three files exist and export their named hooks:
- `frontend/src/hooks/useOfficialInput.ts` exports `useOfficialInput`
- `frontend/src/hooks/useHistoryUpload.ts` exports `useHistoryUpload`
- `frontend/src/hooks/usePredictionWorkspace.ts` exports `usePredictionWorkspace`

**AC-075-K030-ISOLATION:** AppPage renders no `UnifiedNavBar` and no `Footer`.
Root div retains `bg-gray-950 text-gray-100`. Verified by existing K-030 Playwright spec
passing without modification.

**AC-075-K013-CONTRACT:** `computeStatsFromMatches` import source is unchanged
(`utils/statsComputation`). K-013 contract fixture passes without modification.

**AC-075-TD004-CHART-STABLE:** In MatchList, two consecutive matches with identical length
but different candle values render distinct charts. No `// eslint-disable-next-line react-hooks/exhaustive-deps`
suppression remains on the PredictorChart effect.

**AC-075-NO-BEHAVIOR-CHANGE:** Full Playwright E2E suite passes (existing spec count, no new
known-reds introduced). `npx tsc --noEmit` reports zero errors.

---

## Regression Invariants

- **K-030:** AppPage renders as isolated tool viewport — no shared nav/footer
- **K-013:** `statsComputation.ts` boundary; `computeStatsFromMatches` signature unchanged

---

## Phase Plan

| Phase | Role | Gate |
|-------|------|------|
| 1 — Architect RFC | Senior Architect | Design doc §Design complete + PM sign-off |
| 2 — QA Early Consultation | QA | Before Engineer release |
| 3 — Implementation | Engineer | tsc + Vitest + Playwright E2E |
| 4 — Code Review | Reviewer (breadth + depth) | 0 Critical / 0 Warning |
| 5 — QA | QA | Full regression pass |
| 6 — Close | PM | All ACs verified |
