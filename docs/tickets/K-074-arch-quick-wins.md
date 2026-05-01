---
id: K-074
title: arch quick wins — remove dead NavBar, selected_ids default, PasswordForm contrast
status: closed
closed: 2026-05-02
closed-commit: 7f82e25
created: 2026-05-02
type: refactor
priority: medium
size: small
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: PM proxy tier — zero runtime behavior change; dead-code removal (grep-confirmed zero consumers) + API contract widening with backward-compat default + CSS-only accessibility fix; Playwright gate covers regression surface
dependencies: []
base-commit: 4e7cfa5
---

## Summary

Three arch quick wins from 2026-05-02 senior-architect review session. All changes
are structural/cosmetic with zero behavior change; Playwright + tsc gate sufficient.

1. **NavBar.tsx deletion** — `frontend/src/components/NavBar.tsx` is a legacy component
   with zero import consumers (superseded by UnifiedNavBar). Dead code confirmed by
   `grep -rn "from.*NavBar" src/ --include="*.tsx" --include="*.ts" | grep -v UnifiedNavBar`
   returning empty.

2. **selected_ids default `= []`** — `PredictRequest.selected_ids` was a required field
   with no default; all callers send `[]`. Adding `= []` makes the field optional while
   preserving behavior: the handler guard is `if req.selected_ids:` (truthy check),
   so empty-list and absent-field are identical paths.

3. **PasswordForm contrast** — `expiredMessage` paragraph uses `text-yellow-400` (~2.4:1
   contrast on paper background). Changed to `text-amber-700` (~5.8:1) to meet WCAG AA
   4.5:1 minimum for normal text. Border token updated to match (`border-yellow-400/30`
   → `border-amber-700/30`).

---

## Acceptance Criteria

**AC-074-NAVBAR-DELETED:** `frontend/src/components/NavBar.tsx` does not exist in the
repo. No import in any `.ts` / `.tsx` file under `frontend/src/` references this component
(UnifiedNavBar references are excluded).

**AC-074-SELECTED-IDS-OPTIONAL:** `PredictRequest` in `backend/models.py` declares
`selected_ids: List[str] = []`. A `POST /api/predict` request body omitting `selected_ids`
returns HTTP 200 (not 422). A request with `selected_ids: []` returns the same result.

**AC-074-CONTRAST:** `PasswordForm.tsx` expiredMessage paragraph uses `text-amber-700`
(not `text-yellow-400`). Border token is `border-amber-700/30`.

---

## Non-Goals

- No changes to `UnifiedNavBar.tsx` or any other nav component.
- No changes to `main.py` handler logic — `if req.selected_ids:` guard is preserved.
- No Playwright visual-snapshot update (color change is accessibility, not design delta;
  `visual-delta: no` confirmed).
- No changes to ssot/ or docs/ files (docs ticket K-070 absorbs any system-overview.md
  edits, including the QW4 PyJWT→python-jose fix which is stashed for K-070 pickup).

---

## §8 Sacred Clauses

None.
