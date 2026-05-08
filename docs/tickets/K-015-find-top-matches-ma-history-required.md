---
id: K-015
title: find_top_matches() ma_history silent fallback removal (make required or add assert/warning)
status: backlog
type: refactor
priority: medium
created: 2026-04-18
source: docs/tickets/K-009-1h-ma-history-fix.md#suggestion-s1
td: TD-010
---

## Background

K-009 fixed the bug in `backend/main.py` where the `predict()` 1H path did not pass `ma_history`, causing `find_top_matches()` to fall back to `ma_history = history` (incorrectly using 1H data for 30-day MA computation).

However, the **root cause was not addressed**: `backend/predictor.py` `find_top_matches()` still contains:

```python
if ma_history is None:
    ma_history = history
```

This is a silent fallback — any future caller of `find_top_matches()` who forgets to pass `ma_history` will repeat the K-009 mistake, and neither the compiler, linter, nor test suite can intercept it. The K-009 regression test only locks **the current 1H call site**, providing no protection for future new callers.

The Code Review (senior-engineer agent, 2026-04-18) raised this as Suggestion S1 and recommended opening a follow-up ticket for Architect to evaluate the options (see Open Questions below).

## Scope

**Included:**
- Signature / entry-guard refactoring of `backend/predictor.py` `find_top_matches()`
- Synchronously update all callers (currently one each in the `backend/main.py` 1D / 1H branches)
- Strengthen tests: when a new caller omits `ma_history`, the test stage or mypy/pyright layer must intercept it (no production silent failure)

**Not included:**
- Other internal predictor refactoring (belongs to TD-007)
- stats / consensus payload changes (belongs to TD-008 / K-013)
- 1D / 1H prediction behavior changes — only protection mechanism strengthening

## Proposed Options (pending Architect RFC ruling)

**Option A — Make `ma_history` a required keyword-only parameter**
```python
def find_top_matches(*, history, ma_history, timeframe, history_1d=None):
```
- Pros: caught at compile time (type checker + runtime `TypeError`), zero silent fallback
- Cost: all callers must update synchronously; the 1D path must explicitly pass `ma_history=_history_1d` (currently it happens to work via fallback)

**Option B — Keep optional but add entry-point assert / warning**
```python
if ma_history is None:
    if os.getenv("PYTEST_CURRENT_TEST"):
        raise ValueError("ma_history must be provided in test mode")
    logger.warning("find_top_matches called without ma_history, falling back to history")
    ma_history = history
```
- Pros: backward compatible, can be rolled out incrementally; test stage raises to block omissions
- Cost: still post-hoc detection; production warning requires log monitoring to be visible

**Architect's preliminary preference:** Option A (the K-009 Engineer retrospective noted "log warning has no blocking force, raise would falsely break the existing 1D call" — but if the 1D branch synchronously passes `ma_history=_history_1d` explicitly, Option A has zero false-break risk and the highest payoff).

The final decision will be made by PM after Architect's RFC is delivered.

## Acceptance Criteria

### AC-015-NO-FALLBACK: no silent fallback

**Given** `backend/predictor.py` `find_top_matches()` implementation
**When** the caller does not pass `ma_history`
**Then** the behavior is one of the following (per RFC ruling):
- Option A: `TypeError` raised (required keyword)
- Option B: test environment raises / production environment logs warning, never silent

**And** in either case, no `if ma_history is None: ma_history = history` silent fallback exists

### AC-015-CALLERS: all existing callers pass explicitly

**Given** all `find_top_matches()` calls in `backend/main.py`
**When** grep `find_top_matches(` against that file
**Then** every call explicitly passes `ma_history=<value>`, with no reliance on default value or fallback

### AC-015-TEST-GUARD: caller omission is intercepted at the test stage

**Given** the backend test suite
**When** `ma_history` is intentionally removed from a caller
**Then** at least one test must fail (not silent pass)
**And** the failure reason must directly point to "missing `ma_history`"

### AC-015-REGRESSION: 1D / 1H prediction behavior unchanged

**Given** the 63 existing backend tests + K-009 regression test
**When** `python3 -m pytest backend/tests/` is executed
**Then** all pass
**And** the 1D branch test `test_merge_and_compute_ma99_1d_branch` passes
**And** the K-009 regression `test_predict_1h_passes_history_1d_as_ma_history` passes

## Priority Rationale

**medium** — not an active bug (the K-009 regression test already locks the current call site), but a structural defense-in-depth gap. Scheduling considerations:

1. Changing the signature is a public API change and should be batched with TD-007 (`predictor.py` split) to avoid touching the same file twice in quick succession
2. Once K-013 (TD-008 Option C) lands, the predictor-layer contract test infrastructure will be more complete, making Option A implementation cheapest at that point
3. The current scheduled cycles #2~#6 are fixed; this ticket goes to backlog and will be scheduled after K-013 completes

## Next Step

Backlog — Architect will jointly evaluate Option A/B when the TD-007 RFC kicks off (after K-013 completes); PM rules after the RFC is delivered. If a new `find_top_matches()` caller is added in the meantime, escalate to P1 for immediate handling.

## Related Links

- [K-009 Reviewer S1](./K-009-1h-ma-history-fix.md#retrospective) (original Suggestion text)
- [TD-010](../tech-debt.md#td-010--predictor-find_top_matches-ma_history-silent-fallback)
- [K-013 TD-008 Option C](./K-013-consensus-stats-contract.md) (preceding cycle)
- [TD-007 predictor.py split](../tech-debt.md#td-007--predictorpy-split) (same-cycle recommendation)
