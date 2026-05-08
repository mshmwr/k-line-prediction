---
id: K-009
title: 1H prediction path uses wrong MA history source
status: closed
type: bug
priority: high
created: 2026-04-18
closed: 2026-04-18
source: docs/reviews/2026-04-18-code-review.md#p1-1h-prediction-path-uses-the-wrong-ma-history-source
---

## Background

Codex code review 2026-04-18 found that `predict()` in `backend/main.py` calls `find_top_matches()` with:

- `history=history`
- `timeframe=req.timeframe`
- `history_1d=_history_1d`

but **does not pass `ma_history`**.

`find_top_matches()` in `backend/predictor.py` falls back to `ma_history = history` when `ma_history is None`, so the 1H path mistakenly uses `_history_1h` as the input for the "30-day MA99" filter and MA correlation. The semantics of `_fetch_30d_ma_series()` helper assume a daily-history basis; computing it from 1H data causes:

- Incorrect candidate filtering
- Incorrect ranking
- 1H prediction results may be inconsistent with the intended strategy behavior

## Scope

**In:**
- In `backend/main.py`, pass `ma_history=_history_1d` when `predict()` calls `find_top_matches()`
- Add a regression test for the 1H prediction path (locks down this behavior)

**Out:**
- Refactoring `find_top_matches()` signature or internals
- Logic changes to the 1D path

## Expected file changes

- `backend/main.py` (fix `find_top_matches()` call arguments)
- `backend/tests/test_main.py` or `backend/tests/test_predictor.py` (add regression test)

## Acceptance Criteria

### AC-009-FIX: predict() 1H path passes correct ma_history

**Given** the backend has loaded both `_history_1h` and `_history_1d`
**When** `/api/predict` is called with `timeframe="1H"`
**Then** `find_top_matches()` receives `ma_history=_history_1d` (not the fallback `history`)
**And** the 1H prediction's MA99 filter and correlation are computed against daily history

### AC-009-TEST: 1H regression test locks down behavior

**Given** the backend test suite
**When** `python3 -m pytest backend/tests/` is run
**Then** there exists a test case that explicitly verifies `ma_history` equals `_history_1d` on the 1H path
**And** if the old behavior is reintroduced (no `ma_history` passed), this test must fail

### AC-009-REGRESSION: 1D path and other API behaviors unchanged

**Given** the existing backend test suite (18 + 44 tests)
**When** the full backend test suite is run
**Then** all tests pass with no new failures

## Priority rationale

**high** — this is a correctness issue affecting prediction quality; users get results but ranking may diverge from strategy intent, eroding trust. Should be handled before UI / refactor work.

## Next handoff

Hand directly to Engineer (focused change, no architectural decisions). If Engineer finds that the `find_top_matches()` parameter design itself needs adjustment (e.g. making `ma_history` required), pause and report to PM to decide whether to escalate to Architect.

## Related links

- [Code Review](../reviews/2026-04-18-code-review.md#p1-1h-prediction-path-uses-the-wrong-ma-history-source)
- [PM Summary](../reviews/2026-04-18-pm-summary.md#2-1h-prediction-quality-may-be-affected)

---

## Architecture Review

**Ruling: Architecture not required** — reviewed by senior-architect on 2026-04-18.

**Rationale:**
- Change scope: a single call site in `backend/main.py` adds `ma_history=_history_1d` plus a regression test
- No cross-layer impact: API schema, frontend, and field mapping all unchanged
- No interface change: `find_top_matches()` signature retains existing default-parameter form (`ma_history: Optional = None`)

**Judgment on whether `ma_history` should be enforced at the predictor layer (rather than left to the caller):**

The Codex review original text already conditionally surfaced this in the ticket's next-handoff section ("if Engineer finds the parameter design itself needs adjustment… pause and report to PM"). Architect's evaluation:

- "Caller decides which history to pass" is a reasonable design (1D path, 1H path, and test paths can each pass a different history for the MA filter)
- However, the current `if ma_history is None: ma_history = history` fallback is a **silent retreat** that makes K-009-class bugs hard for tests to catch
- Reasonable compromise: **keep the signature optional, but add an assert / log warning at the entry of `find_top_matches()`** that emits a warning (or raises in test mode) when `timeframe == "1H"` and `ma_history is history`
- This compromise is outside K-009's AC scope and is filed as a **defense-in-depth suggestion** to Engineer's discretion. If Engineer chooses not to do it, the regression test still locks the current correct behavior.

**Releasing to Engineer.** Once implementation is complete, run Code Review (senior-engineer agent) per the original flow; no return to Architect required.

— senior-architect, 2026-04-18

---

## Retrospective

### Engineer

**2026-04-18**

**What went well:** Followed TDD order (failing test first, confirmed `captured['ma_history']` was `None`, then changed production code). The test uses monkeypatch to intercept `find_top_matches`, asserting only "argument identity" (`is main._history_1d` + `is not captured['history']`), avoiding any MA99 / correlation business-value assertions, and so dodging the Test Escalation Rule. The fix splits the implementation into 1H/1D branches (if is_1d / else); the 1D call is left untouched, minimizing blast radius.
**What went wrong:** Chose not to add the defense-in-depth warning — the rationale being that a predictor-layer log warning cannot prevent future new callers from making the same mistake (only post-hoc notification), while raising would falsely trip the existing 1D path (where `_history_1d` legitimately serves as both history and ma_history). This tech debt (silent fallback in the signature) was not resolved within this ticket and needs Architect to decide whether to make it a required keyword.
**Next time improvement:** When future K-xxx tickets add new `find_top_matches()` callers, the PR description must list "is ma_history passed or not"; or open a ticket for Architect to evaluate making `ma_history` required, eliminating this class of bug at the source.

### Reviewer

**2026-04-18**

**Correctness (AC-009-FIX): PASS.** `backend/main.py` L280-299 1H branch explicitly passes `ma_history=_history_1d`; the 1D branch keeps the original call (under 1D, the fallback `ma_history = history = _history_1d` was already correct). Diff stays inside the `predict()` try block, no side effects.

**Test quality (AC-009-TEST): PASS (verified empirically).** Ran `git stash push backend/main.py` → `pytest tests/test_main.py::test_predict_1h_passes_history_1d_as_ma_history` → confirmed fail (`captured['ma_history']` = None, `is main._history_1d` assertion fails) → `git stash pop` to restore. Engineer's claim that "removing the fix makes the test fail" is accurate. The additional `captured['ma_history'] is not captured['history']` provides extra protection: even if `ma_history=history` (a merged list) were mistakenly passed in, that assertion would catch it.

**Test Escalation Rule: PASS.** The test only asserts argument identity (`is` / `is not`), no PRD business value (no MA99 threshold, no correlation score, no future_ohlc numbers), so escalation to a business-rule ruling is not required.

**Regression (AC-009-REGRESSION): PASS.** Full `python3 -m pytest` = 63 passed (baseline 62 + 1 new). 1D-branch test `test_merge_and_compute_ma99_1d_branch` passes; auth / upload / parse and other endpoints unchanged.

**Scope-rejection reasonableness: accepted with tech-debt note.** Engineer skipped the Architect's "defense-in-depth warning" suggestion; the rationale (log lacks blocking power + raise would falsely trip existing 1D callers) is reasonable, and the tech debt (silent fallback in `ma_history`) is documented in the Engineer Retrospective above. Architect already marked it optional in design review and authorized Engineer's discretion. **Reviewer recommends PM file a follow-up ticket to track this tech debt** (see PM-pending list below) so it's not forgotten just from a Retrospective record.

**Diff hygiene: PASS.** Changes across the four files are all in-scope (main.py, test_main.py, engineer retrospective log, single-ticket Retrospective). No unrelated file changes, no debug prints, no formatting drift; comments label the K-009 reason.

---

**Critical: none**
**Warning: none**
**Suggestion (optional):**
- S1. The `if ma_history is None: ma_history = history` silent fallback in `find_top_matches()` is the root cause of this bug; the regression test locks the current caller's behavior, but a future caller forgetting to pass it could still hit the trap. Recommend opening a follow-up ticket where Architect evaluates two paths: (a) make `ma_history` a required keyword-only argument; (b) inside `find_top_matches()` add an assert/warning for `timeframe == '1H' and ma_history is history`.

**PM-pending list:**
| Item | Type | Reviewer recommendation |
|------|------|--------------|
| S1 — silent fallback of ma_history at predictor layer | tech debt | Open follow-up ticket (not in this ticket scope); Architect evaluates option (a)/(b) |

**Ruling: release to QA (no Critical / no Warning).** PM rules whether to file S1 and when to schedule it after receiving the review; this ruling does not block K-009 from going to QA.

— senior-engineer, 2026-04-18

### QA

**2026-04-18**

**Scope confirmation:** K-009 is a pure backend fix (`backend/main.py` 1H branch adds `ma_history=_history_1d` + adds regression test); no changes to any `frontend/src/` or `frontend/e2e/` files. Per QA agent invocation timing + K-Line CLAUDE.md Frontend Changes rule, Playwright E2E is not required; this round uses "full-suite backend pytest + py_compile" as dual gates.

**Test results:**
- `cd backend && python3 -m pytest` — **63 passed, 1 warning in 35.57s** (AC-009-REGRESSION baseline: 62 original + 1 new = 63, aligned)
  - `tests/test_auth.py` 5/5 pass
  - `tests/test_main.py` 14/14 pass (including the new `test_predict_1h_passes_history_1d_as_ma_history`)
  - `tests/test_predictor.py` 44/44 pass
  - The only warning is a starlette `python_multipart` PendingDeprecationWarning, unrelated to this change
- `python3 -m py_compile backend/main.py backend/tests/test_main.py` — **exit 0** (no indentation / syntax errors)

**Reason for skipping Playwright:** This ticket's git diff has no `frontend/` file changes; UI behavior and presentation layer are untouched. Running Playwright would only re-verify K-008 / K-010 baselines, providing no incremental signal for K-009 correctness. Decision: **skip Playwright E2E + visual report script**, per QA task description "may skip when no UI change."

**Visual report:** Skipped `docs/reports/K-009-visual-report.html` output, same reason (no UI change).

**Go/No-go recommendation: release PM to enter Retrospective summary stage.** Full backend regression passes, no new failures, AC-009-FIX / AC-009-TEST / AC-009-REGRESSION all PASS in both Reviewer and QA rounds. S1 tech debt has been ruled by PM to file as K-015 / TD-010 in the backlog, not blocking this ticket's closure.

**Boundary reminder (for PM):** When K-015 is fixed, the test point "future new `find_top_matches()` caller forgets `ma_history`" must be specifically covered; the 1H-caller-specific test in this ticket (`test_predict_1h_passes_history_1d_as_ma_history`) cannot intercept the "new timeframe caller" class of silent-fallback bugs. Recommend K-015 AC explicitly mandate predictor-layer assert / change to required keyword.

— qa, 2026-04-18

### PM Summary

**2026-04-18**

**Cross-role recurring issue:** Engineer / Reviewer / QA all point to the same root cause — `find_top_matches()`'s `if ma_history is None: ma_history = history` silent fallback is a systemic risk source whenever a caller forgets to pass the argument:
- Engineer Retrospective explicitly records this as unresolved tech debt and recommends "future K-xxx adding callers must list ma_history pass-or-not in PR description, or file a ticket to make it required"
- Reviewer S1 recommends opening a follow-up ticket to evaluate (a) required keyword-only or (b) `timeframe == '1H' and ma_history is history` assert/warning
- QA boundary reminder: the K-015 fix needs to cover regression tests for "new timeframe caller" silent-fallback class

The three roles independently raised the same risk → confirms this isn't an isolated observation but a predictor-layer API design defect.

**Process improvement decisions:**

| Issue | Owner | Action | Update location |
|------|---------|------|---------|
| `ma_history` silent fallback tech debt | Architect | Evaluate Option A (required keyword-only) / Option B (1H-specific assert) → Architect rules on the option before K-015 implementation | `docs/tickets/K-015-find-top-matches-ma-history-required.md` + `docs/tech-debt.md` TD-010 |
| Architect's conditional suggestions ("recommend X but defer to Engineer") have no closure node | PM | Whenever Architect issues a conditional suggestion, before releasing Engineer, PM must add a line: "Whatever Engineer's choice is, Reviewer must close it as one of S/W/Critical at review time, no skipping"; pm.md auto-trigger table adds an entry "Architect issued conditional suggestion → PM tracks until Reviewer explicitly closes" | `~/.claude/agents/pm.md` (next session) + this entry in `docs/retrospectives/pm.md` |
| Silent-fallback API design bugs need predictor-layer interception, can't rely solely on caller-side regression tests | Architect (at K-015 implementation) | K-015 AC explicitly mandates predictor-layer assert / required keyword; regression tests must cover "new caller forgets ma_history" scenario, not just lock the current 1H call site | K-015 ticket AC section (already in backlog with the trigger condition documented) |

**Ruling: K-009 closed.** All three ACs PASS, 63 backend tests green, S1 tech debt converted to K-015 + TD-010 in backlog without blocking this ticket's closure. The next handoff is for the main flow to decide whether to start cycle #3 (K-011 LoadingSpinner a11y label, medium).

— pm, 2026-04-18
