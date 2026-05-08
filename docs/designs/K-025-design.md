---
title: K-025 — UnifiedNavBar hex → token migration + navbar.spec.ts dual-rail assertion upgrade
type: design
ticket: K-025
created: 2026-04-22
owner: Architect
visual-spec: N/A — zero-visual-change pure refactor; computed-color equivalence guarded by dist CSS declaration grep. Ticket frontmatter L9 already states `visual-spec: N/A — reason: zero-visual-change refactor` + QA Q1 correction note.
depends-on: K-021 (tokens `paper` / `ink` / `brick-dark` registered in `frontend/tailwind.config.js` L6–L9, verified; NavBar active-color decision adopts `brick-dark`)
---

## 0. Scope Questions / Blockers

**No SQ / BQ requires PM arbitration.** Common ambiguity points below are all closed by ticket AC or existing code / design doc; Architect does not decide on PM's behalf:

| Possible doubt | Source confirmation | Conclusion |
|---------|---------|------|
| NavBar active color is `brick` or `brick-dark`? | K-021 design doc §Q2 PM ruled B (brick-dark retained); ticket K-025 §Scope L26 lists `text-[#9C4A3B]` → `text-brick-dark` | `text-brick-dark` |
| Which token does `text-[#1A1814]/60` map to? | `tailwind.config.js` has `ink: '#1A1814'`; Tailwind `/60` opacity modifier applies directly to named color | `text-ink/60` (computed `rgba(26, 24, 20, 0.6)`) |
| Need new props? | K-021 §5.3 Before/After lists NavBar maintains zero props | Maintain zero props (pure internal className refactor) |
| How to verify QA Q1 "compiled CSS identical"? | Ticket frontmatter L9 + AC-025-REGRESSION L78 specify "`dist/assets/*.css` 4 declaration counts pre == post" | Run `npm run build` pre and post, grep 4 hex declaration counts to compare |
| Does `[aria-current="page"]` already exist in current spec? | AC-021-NAVBAR has 3 existing aria-current assertions (spec L217 / L227 / L235); this ticket adds `toHaveCSS` as second rail, drops 5 class-name regex | Existing aria-current assertions retained, no rewrite |

---

## 1. Scope Summary

K-025 is a pure-refactor (type=refactor, frontmatter L6). Goal: in `frontend/src/components/UnifiedNavBar.tsx` rewrite the last 7 hex literals to K-021 registered Tailwind tokens (`paper` / `ink` / `brick-dark`); in `frontend/e2e/navbar.spec.ts` replace 5 class-name regex assertions (K-021 Reviewer W-3 flagged as weakest middle-layer pattern) with "attribute + computed color dual-rail assertions"; in one shot fill in TD-K021-09's `/` route inactive color 3 assertions and QA Q3's `/business-logic` hidden-route active-link no-op assertion.

Rendered-color equivalence is guarded by 4 hex declarations in `dist/assets/*.css` (`color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`) where occurrence counts must be pre == post before/after refactor. Selector names (`text-[#9C4A3B]` → `text-brick-dark`) change, computed value does not. This is "behavior equivalent at rendered-color level, NOT at CSS-selector level" (aligned with QA Early Consultation Q1 correction).

---

## 2. OLD → NEW className Mapping (7 locations, grouped by color)

### 2.1 grep result (source of truth)

`grep -nE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` returns 5 lines, expanded contains 7 className hex literals (L18 / L19 hex in comments need not change; they are K-017 decision narrative text):

| Line | OLD className with hex | hex value | distinct color |
|------|----------------------|-----------|----------------|
| L36 | `text-[#9C4A3B]` | `#9C4A3B` | brick-dark (active) |
| L38 | `text-[#1A1814]/60` | `#1A1814` | ink (inactive primary @ 60% opacity) |
| L38 | `hover:text-[#1A1814]` | `#1A1814` | ink (hover target @ 100%) |
| L75 | `bg-[#F4EFE5]` | `#F4EFE5` | paper (nav background) |
| L75 | `border-[#1A1814]` | `#1A1814` | ink (bottom border) |
| L82 | `text-[#1A1814]` | `#1A1814` | ink (HomeIcon idle) |
| L82 | `hover:text-[#9C4A3B]` | `#9C4A3B` | brick-dark (HomeIcon hover) |

**Distinct colors = 3** (`#9C4A3B` / `#1A1814` / `#F4EFE5`), total hex occurrences = 7, consistent with ticket §Background L15 description.

### 2.2 OLD → NEW className correspondence (1:1 token replacement)

| # | Line | OLD | NEW | Tailwind compiled output (per tailwind.config.js) |
|---|------|-----|-----|-------------------------------------------|
| 1 | L36 | `text-[#9C4A3B]` | `text-brick-dark` | `.text-brick-dark { color: rgb(156 74 59); }` |
| 2 | L38 | `text-[#1A1814]/60` | `text-ink/60` | `.text-ink\/60 { color: rgb(26 24 20 / 0.6); }` |
| 3 | L38 | `hover:text-[#1A1814]` | `hover:text-ink` | `.hover\:text-ink:hover { color: rgb(26 24 20); }` |
| 4 | L75 | `bg-[#F4EFE5]` | `bg-paper` | `.bg-paper { background-color: rgb(244 239 229); }` |
| 5 | L75 | `border-[#1A1814]` | `border-ink` | `.border-ink { border-color: rgb(26 24 20); }` |
| 6 | L82 | `text-[#1A1814]` | `text-ink` | `.text-ink { color: rgb(26 24 20); }` |
| 7 | L82 | `hover:text-[#9C4A3B]` | `hover:text-brick-dark` | `.hover\:text-brick-dark:hover { color: rgb(156 74 59); }` |

**Verification:** After Engineer's edit, run `grep -nE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx`; result line count = 2 (only L18 / L19 K-017 decision narrative comments remain), 0 hex within className scope.

**Comment handling:** L18–L20 JSDoc mentions `#9C4A3B` / `#B43A2C` as "historical color decision narrative" (preserves K-017 visual acceptance, brick vs brick-dark semantic distinction). These are documentary hex, not className. Leave unchanged; AC-025-NAVBAR-TOKEN's grep target is "className scope 0 hex" (Then clause: "all color/border/background classes are K-021 tokens"), not whole-file 0 hex. Engineer renaming comment hex (e.g. `brick-dark (#9C4A3B)` → `brick-dark`) is a stylistic choice, not a hard requirement; recommended to retain for K-017 decision traceability.

---

## 3. OLD → NEW E2E Assertion Mapping (5 drop + 4 new-add = 9 rows)

### 3.1 Drop existing class-name regex (5 rows)

| # | Spec line | OLD assertion | Why drop | Replacement assertion location |
|---|-----------|----------|-----------|-------------|
| 1 | L177 | `nav.getByRole('link', { name: 'About' }).toHaveClass(/text-\[#9C4A3B\]/)` | class-name regex hardcodes pre-refactor selector; post-refactor class becomes `text-brick-dark`, regex fails and cannot verify rendered color | §3.2 row #1 + row #2 (/about About aria-current + toHaveCSS) |
| 2 | L178 | `nav.getByRole('link', { name: 'App' }).toHaveClass(/text-\[#1A1814\]/)` | post-refactor still matches `text-ink/60` (loose substring); cannot detect state-swap bug (passes even when active/inactive swapped) | §3.2 row #3 (/about App toHaveCSS inactive) |
| 3 | L186 | `nav.getByRole('link', { name: 'Diary' }).toHaveClass(/text-\[#9C4A3B\]/)` | Same as #1 | §3.2 row #4 + row #5 (/diary Diary aria-current + toHaveCSS) |
| 4 | L187 | `nav.getByRole('link', { name: 'About' }).toHaveClass(/text-\[#1A1814\]/)` | Same as #2 | §3.2 row #6 (/diary About toHaveCSS inactive) |
| 5 | L204 | `nav.getByRole('link', { name: 'About' }).toHaveClass(/text-\[#1A1814\]/)` (mobile / page) | Same as #2; mobile viewport | §3.2 row #7 (/ mobile About toHaveCSS inactive) |

**Related describe structure adjustments after drop:**
- L169 `test.describe('AC-NAV-4 — Active link highlighted #9C4A3B, others #1A1814/60', ...)` → rename to `'AC-NAV-4 — Active link highlighted (brick-dark), inactive ink/60 — dual-rail'` (description no longer implies hex regex)
- L169–L189 two test bodies rewritten (see §3.2)
- L193 `test.describe('AC-NAV-4 — Active link highlighted (mobile)', ...)` title retained; test body (L199–L205) switched to dual-rail (see §3.2 row #7)

### 3.2 New-add (integrate old test + supplement coverage)

The 4 rows below are **new assertions**; rows #7 / #8 fill in TD-K021-09 `/` route 3 assertions + QA Q3 `/business-logic` assertion in one go.

| # | Route / Viewport | Link | Assertion 1 (attribute) | Assertion 2 (computed color) | Covers AC |
|---|-----------|------|-------------------|------------------------|---------|
| 1 | `/about` desktop | About (active) | `toHaveAttribute('aria-current', 'page')` | `toHaveCSS('color', 'rgb(156, 74, 59)')` | AC-025-NAVBAR-SPEC (active dual-rail) |
| 2 | `/about` desktop | App (inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` | AC-025-NAVBAR-SPEC (inactive replaces loose regex) |
| 3 | `/diary` desktop | Diary (active) | `toHaveAttribute('aria-current', 'page')` | `toHaveCSS('color', 'rgb(156, 74, 59)')` | AC-025-NAVBAR-SPEC |
| 4 | `/diary` desktop | About (inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` | AC-025-NAVBAR-SPEC |
| 5 | `/` desktop | App / Diary / About (3 inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` × 3 | AC-025-NAVBAR-SPEC + TD-K021-09 |
| 6 | `/` mobile | About (inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` | AC-025-NAVBAR-SPEC (replaces L204 loose regex) |
| 7 | `/business-logic` desktop | — | `page.locator('[aria-current="page"]').toHaveCount(0)` | — | AC-025-NAVBAR-SPEC + QA Q3 |
| 8 | `/about` desktop | Home (inactive) | — | *optional*, non-blocking | — (optional supplement; see note below) |

**Test case total change (in Playwright test() units):**
- Under `AC-NAV-4 — Active link highlighted #9C4A3B, others #1A1814/60` describe, 2 tests → rewritten as dual-rail 2 tests (/about 1 + /diary 1, each test contains 2 links × dual-rail; rows #1–#4 merged into these 2 tests)
- Under `AC-NAV-4 — Active link highlighted (mobile)` describe, 1 test → rewritten as 1 test (row #6)
- New describe `AC-025 — Inactive color on / route (desktop)` adds 1 test (row #5, 3 links merged into same test)
- New describe `AC-025 — /business-logic has no active link` adds 1 test (row #7)
- Prediction hidden existing 2 tests (L252 / L258) retained unchanged (AC-025-NAVBAR-SPEC `And` 5th clause explicitly states no duplicate add)

**Net delta on spec file:** drop 5 regex assertions, rewrite 3 tests (/about 1 / /diary 1 / mobile 1), add 2 tests (`/` inactive × 1 + `/business-logic` no-active × 1).

**AC cross-check (aligned with persona "AC ↔ Test Case Count Cross-Check" hard gate):**
- Ticket §Acceptance Criteria AC-025-NAVBAR-SPEC `And` clauses (L65 / L66 / L67 / L68 / L69) total 5 testable assertion families:
  - And #1 (L65 active dual condition) → maps to §3.2 row #1 + row #3 (2 tests)
  - And #2 (L66 inactive computed color) → maps to §3.2 row #2 + row #4 + row #5 + row #6 (assertions merged into the prior 2 dual-rail tests + 2 new tests, 4 tests total)
  - And #3 (L67 `/` desktop inactive 3 assertions) → maps to §3.2 row #5 (1 test, 3 assertions in same test)
  - And #4 (L68 `/business-logic` aria-current count 0) → maps to §3.2 row #7 (1 test)
  - And #5 (L69 Prediction hidden no duplicate add) → N/A (non-add)
- Design doc total new / rewritten tests = 5 (/about dual-rail 1 + /diary dual-rail 1 + mobile 1 rewrite + `/` inactive 1 new + `/business-logic` 1 new)
- 5 tests >= 5 AC `And` clause coverage ✓

---

## 4. Route Impact Table (4 routes × {visual, behavior, test-coverage-delta})

`UnifiedNavBar` mounts on 4 marketing routes (since K-030 `/app` no longer mounts NavBar, so excluded):

| Route | Visual | Behavior | Test coverage delta | Note |
|-------|--------|----------|---------------------|------|
| `/` | `unchanged` — background paper / inactive ink/60 / hover ink / active brick-dark four colors computed values unchanged (guarded by dist CSS declaration grep) | `unchanged` — aria-current logic, external new-tab, filter hidden all unchanged | +1 test (row #5 desktop 3 links inactive); +0 test (mobile already covers Home) | Engineer needs no extra visual verification; tsc + Playwright + dist CSS grep pre==post triple gate suffices |
| `/about` | `unchanged` | `unchanged` | Rewrite 1 test (dual-rail: About active + App inactive) | About active → `brick-dark`; App inactive → `ink/60` |
| `/diary` | `unchanged` | `unchanged` | Rewrite 1 test (dual-rail: Diary active + About inactive) | Diary active → `brick-dark`; About inactive → `ink/60` |
| `/business-logic` | `unchanged` | `unchanged` — existing behavior: `pathname !== '/'` and matches no visible link.path, so no `[aria-current="page"]` | +1 test (row #7 aria-current count 0) | Fills QA Q3 hidden-route coverage gap (no such assertion pre-K-025) |

**Visual verification conclusion:** All four routes are `unchanged`; Engineer does not need to start dev server and visually inspect each route (per feedback_shared_component_all_routes_visual_check, visual unchanged → visual verification can be waived; but dist CSS declaration count pre == post is a hard gate).

---

## 5. Behavior-diff Statement (3 bullets per protocol)

- **Rendered-color level: equivalent.** Run `npm run build` pre and post, grep `dist/assets/*.css` for the four declarations `color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`; occurrence counts must be pre == post (AC-025-REGRESSION L78 enforced). Tailwind JIT compiles `text-[#9C4A3B]` and `text-brick-dark` to the same color value declaration (former is arbitrary-value utility, latter is named-color utility; selector class name differs but declared color value is identical). QA Q1 correction explains this.
- **CSS-selector level: NOT equivalent.** Selectors like `.text-\[\#9C4A3B\]` **will disappear** from the compiled output (if no other arbitrary-value consumers in codebase); named selectors like `.text-brick-dark` will appear. The original 5 class-name regex assertions in `navbar.spec.ts`, if not replaced, will fail post-refactor (OLD regex match fails) or false-pass (`/text-\[#1A1814\]/` still loosely matches `text-[#1A1814]/60` substring). Dual-rail assertions (aria-current + toHaveCSS) detach from selector name dependency, directly verifying React state + rendered computed color, refactor-proof.
- **Component props / internal logic: equivalent.** `UnifiedNavBar` maintains zero props (K-021 §5.3 narrative), `TEXT_LINKS` constant shape unchanged, `navLinkClass()` logic branches (isActive → active / else → inactive) unchanged, `renderLink()` external / SPA branch unchanged, `useLocation` + `pathname === path` check unchanged. `git show main:frontend/src/components/UnifiedNavBar.tsx` truth table (next section) confirms line by line.

### 5.1 git-show baseline truth table (per persona Pre-Design Dry-Run Proof)

`git show main:frontend/src/components/UnifiedNavBar.tsx` (already executed, see Architect session Bash log) — behavior branches enumerated cell by cell:

| Path | `pathname === path`? | `link.external`? | render | className output |
|------|---------------------|-------------------|--------|----------------|
| `/app` on `/` | false | true | `<a target=_blank rel=noopener>` | `text-[13px] font-mono text-[#1A1814]/60 hover:text-[#1A1814] transition-colors` (desktop) / `text-[11px]` (mobile) |
| `/app` on `/app` | N/A — `/app` does not mount NavBar (K-030) | — | — | — |
| `/diary` on `/diary` | true | undefined | `<Link aria-current="page">` | `text-[13px] font-mono text-[#9C4A3B] transition-colors` (active) |
| `/diary` on `/about` | false | undefined | `<Link aria-current={undefined}>` | inactive className |
| `/about` on `/about` | true | undefined | active className (`text-[#9C4A3B]`) | |
| `/about` on `/diary` | false | undefined | inactive className | |
| `/business-logic` on any | hidden: true → filter excludes → not rendered | — | — | — |
| Home icon on `/` | `pathname === '/'` → active | — | `<Link aria-current="page">` | `text-[#1A1814] hover:text-[#9C4A3B]` |
| Home icon on `/about` | `pathname === '/about'` → false → aria-current={undefined} | — | `<Link aria-current={undefined}>` | `text-[#1A1814] hover:text-[#9C4A3B]` |

**Post-refactor truth table: each cell's className hex-literal portion is replaced with token name, everything else unchanged.** No logic branch changes. Engineer must not introduce any filter / sort / layout changes (if so → scope creep, report to PM).

### 5.2 §API invariance dual-axis (per Gate 3)

- **(a) wire-level schema diff:** This ticket involves no API schema (pure frontend className / test assertion changes); `git diff main -- backend/` expected empty. AC-025-REGRESSION L76–L77 K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR + other page E2E no-regression guard.
- **(b) frontend observable behavior diff table:**

| Observation point | OLD render (base `main`) | NEW render (post-K-025) | Equivalent |
|--------|--------------------------|-------------------------|---------|
| `/about` About active link computed `color` | `rgb(156, 74, 59)` (`#9C4A3B` arbitrary-value class) | `rgb(156, 74, 59)` (`brick-dark` named class) | ✓ |
| `/` App inactive link computed `color` | `rgba(26, 24, 20, 0.6)` | `rgba(26, 24, 20, 0.6)` | ✓ |
| `/diary` nav `<nav>` computed `background-color` | `rgb(244, 239, 229)` | `rgb(244, 239, 229)` | ✓ |
| `/business-logic` any link `aria-current` count | 0 (pre-existing behavior, existing spec did not assert) | 0 (unchanged; new assertion guards) | ✓ |
| Empty / hidden Prediction link DOM occurrence count | 0 (filter) | 0 (filter, unchanged) | ✓ |
| Boundary: `pathname === '/'` Home icon `aria-current` | `"page"` | `"page"` | ✓ |
| Boundary: external App link clicked → new tab | `target=_blank` behavior | `target=_blank` behavior | ✓ |

All four routes × {active / inactive / background / border / hover} combinations are `unchanged` at rendered-color level.

---

## 6. File Change List (3 files cap)

| # | File | Action | Responsibility |
|---|------|------|----------|
| 1 | `frontend/src/components/UnifiedNavBar.tsx` | modify | Replace 7 hex classNames per §2.2 table 1:1 with tokens; logic / props / JSX structure unchanged; L18–L20 comment hex retained (documentary traceability, not className) |
| 2 | `frontend/e2e/navbar.spec.ts` | modify | Per §3.1 drop 5 class-name regex; per §3.2 rewrite 3 tests (/about / /diary desktop dual-rail + mobile inactive) + add 2 tests (`/` desktop 3-inactive + `/business-logic` no-active) |
| 3 | `agent-context/architecture.md` | append-only | Prepend to Changelog: `**2026-04-22** (Engineer, K-025 implementation) — UnifiedNavBar 7 hex→token (paper/ink/brick-dark) + navbar.spec.ts 5 regex drop / dual-rail toHaveCSS assertions + TD-K021-09 closed; no structural change`; §Frontend Routing / §Design System / §Shared Components boundary tables unchanged (zero structural change) |

**Explicitly not modified:**
- `frontend/tailwind.config.js` — tokens registered in K-021, unchanged
- `frontend/src/index.css` — body paper CSS is K-021 entry, unchanged
- `frontend/src/components/NavBar.tsx` (legacy) — K-021 design previously suggested deletion, but this ticket §Scope L46 explicitly states "NavBar structural change — out of scope", do not delete (open separate TD ticket for dead-file cleanup)
- Other pages' hex — ticket L47 states "K-022/K-023/K-024 self-managed"

---

## 7. Implementation Order (sequential)

| Step | Action | Verification | Expected result |
|------|------|---------|---------|
| 0 | `cd` into worktree; confirm base is main HEAD; `git show main:frontend/src/components/UnifiedNavBar.tsx` vs working tree diff should be empty | `git diff main -- frontend/src/components/UnifiedNavBar.tsx` | empty |
| 1 | `npm ls tailwindcss` + `grep -nE "'paper'\|'ink'\|'brick-dark'" frontend/tailwind.config.js` | Confirm 3 tokens registered (already verified in §0) | 3 row match |
| 2 | **Pre-refactor CSS baseline sample:** `cd frontend && npm run build && grep -oEc "(color:#9c4a3b\|color:#1a1814\|background-color:#f4efe5\|border-color:#1a1814)" dist/assets/*.css > /tmp/k025-pre.txt` | Stash count as post-comparison baseline | Record 4 declaration occurrence counts |
| 3 | Edit `UnifiedNavBar.tsx`: per §2.2 7 rows in one shot | `grep -nE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` | Only L18–L20 comment hex remains, className scope 0 hex |
| 4 | `npx tsc --noEmit` | exit code | 0 |
| 5 | **Post-refactor CSS count comparison:** `cd frontend && npm run build && grep -oEc "(color:#9c4a3b\|color:#1a1814\|background-color:#f4efe5\|border-color:#1a1814)" dist/assets/*.css > /tmp/k025-post.txt && diff /tmp/k025-pre.txt /tmp/k025-post.txt` | diff exit code | 0 (pre == post 4 declarations same count) |
| 6 | Edit `navbar.spec.ts`: per §3.1 drop 5 regex; per §3.2 rewrite 3 tests + add 2 tests | Read file confirm | spec text syntax correct |
| 7 | `npx playwright test navbar.spec.ts` | exit code + new tests pass | 0, and rewritten / new tests green |
| 8 | `npx playwright test` full suite regression | exit code | 0 (no new failures) |
| 9 | `grep -rnE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` final confirm | grep result | Comments only, no className |
| 10 | Append architecture.md Changelog (§6 row #3) | Read file | New entry at top |
| 11 | Commit with message `refactor(K-025): migrate UnifiedNavBar hex literals to K-021 tokens + dual-rail navbar assertions` | `git log -1` | Commit created |

**Blocker conditions (any of these → block):**
- Step 5 diff != 0 (pre != post declaration count) → refactor not rendered-color-equivalent, blocker back to Architect (Engineer may have missed or over-changed className)
- Step 7 new spec fails → dual-rail assertion implementation error (computed color rgb() format wrong, or aria-current attribute wrong)
- Step 8 old spec fails → regression, blocker investigates whether scope creep

---

## 8. Shared Component Boundary (per persona)

- `UnifiedNavBar` confirmed as **shared component** (consumers: `/` / `/about` / `/diary` / `/business-logic` 4 marketing routes; since K-030 `/app` removed)
- **No new props interface; zero props maintained** (K-021 §5.3 + this ticket L46 no structural change)
- Blast radius: 4 routes × {rendered-color, aria-current behavior} = 8 cells; §4 Route Impact Table all `unchanged`
- Target-route consumer scan (per persona §Target-Route Consumer Scan): this ticket does not change route navigation behavior (new-tab / SPA / redirect), does not trigger scan rule

---

## 9. Boundary Pre-emption

| Boundary scenario | Is behavior defined? | Mitigation |
|------------------|----------------------|------|
| Empty / null input | N/A — component has no input (zero props) | — |
| Max / min value boundary | N/A — no numeric logic | — |
| API error response | N/A — no API involved | — |
| Concurrency / race condition | N/A — no side effects | — |
| Empty list / single item / large dataset | N/A — `TEXT_LINKS` static constant | — |
| Hidden route active-link (K-025 new) | ✅ Added AC-025-NAVBAR-SPEC `And #4` + §3.2 row #7 | — |
| Comment hex incorrectly grep-killed | ✅ §2.2 explained className scope 0 hex vs whole-file; AC-025-NAVBAR-TOKEN Given/When/Then focuses on className | — |
| Mobile viewport inactive color assertion | ✅ §3.2 row #6 retained | — |
| dist/assets CSS filename may contain hash | ✅ glob `dist/assets/*.css`; this directory produced by Vite as unique CSS bundle, no need to handle multiple files | — |

---

## 10. Refactorability Checklist

- [x] Single responsibility — UnifiedNavBar single responsibility (render nav bar), refactor introduces no new responsibility
- [x] Interface minimization — zero props maintained
- [x] Unidirectional dependency — `useLocation` → `pathname` → className, no side effect or upward call
- [x] Replacement cost — Tailwind tokens centralized in `tailwind.config.js`, future replacement focused on single point
- [x] Clear test entry point — dual-rail assertions explicitly separate "React state (aria-current)" and "render output (computed color)" two test perspectives
- [x] Change isolation — API contract unchanged (§5.2a); UI className change does not propagate to backend / hooks

---

## 11. All-Phase Coverage Gate

This ticket is single-phase (refactor), no cross-Phase scope. Confirm four cells ✅:

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|-----------------|----------------|----------------|
| Single ticket | N/A (no API involved) | §4 Route Impact Table 4 routes | §2–§5 UnifiedNavBar single component, no add / move / delete | §8 zero props maintained |

---

## 12. Known Risks

- **Risk R-1:** Engineer misses one hex literal (e.g. one of the two L82 Home icon classNames) → Step 5 dist CSS declaration count still pre == post (because both Tailwind notations compile to same declaration value), grep result will fail and expose. Step 9 grep is the safety net.
- **Risk R-2:** Tailwind config accidentally modified (e.g. `brick-dark` color changed) → Step 5 diff fails. Pinned in pipeline exposure.
- **Risk R-3:** `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` may stringify differently across Chromium versions (e.g. `rgb(26 24 20 / 0.6)` vs `rgba(26, 24, 20, 0.6)`) → if Engineer hits format difference at Step 7, first confirm Playwright runtime actual stringify form and pin; this spec follows ticket AC L35 / L66 wording (Playwright codebase convention uses rgba, verifiable)
- **Risk R-4:** `/business-logic` hidden-route behavior depends on `Prediction` having `hidden: true` in `TEXT_LINKS` and being filtered out. If hidden key removed in future and re-rendered, row #7 assertion will fail (because `pathname === '/business-logic'` matches Prediction.path); but K-025 does not modify TEXT_LINKS, this is cross-ticket risk, not in scope. Disclosed in §4 note "no such assertion pre-K-025".

---

## Retrospective

**Where most time was spent:** §3 spec diff table — mapping "5 drop" to actual spec line numbers (L177 / L178 / L186 / L187 / L204, all 5 regex in old describe `AC-NAV-4`'s 3 tests). Required simultaneously expanding §3.2 new assertions into how many tests to wrap (AC cross-check capped at 5 AC `And` ≤ 5 tests). Did one full spec line scan first then built table to avoid test count vs AC count drift.

**Which decisions needed revision:** Initial draft considered splitting §3.2 row #5 (`/` desktop 3 inactive) into 3 independent tests (one link per test), but ticket AC-025-NAVBAR-SPEC `And #3` only requires "add 3 inactive assertions for `/` route desktop", not 3 tests. Splitting into 3 tests would inflate "AC 3 clauses = 3 tests" (violating persona "test count = AC family count" alignment principle). Changed to 1 test with 3 `expect`, consistent with §3.2 row #5 description.

**Next time improvement:** For pure-refactor type tickets, before writing §3 E2E diff table, fix "spec file line scan" as a shared source-of-truth block for design doc §2/§3 (cite `grep -n` result as appendix), saving subsequent manual cross-check rework on spec line numbers. This time §2.1 grep result already served as appendix; when extending to §3.1 spec old line numbers, another batch of new numbers (L177/L178/...) appeared; consider unifying a "source of truth scan" section at the start of design doc going forward.
