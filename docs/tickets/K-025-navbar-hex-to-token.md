---
id: K-025
title: UnifiedNavBar hex → token migration + navbar.spec.ts regex sync update
status: done
closed: 2026-04-22
type: refactor
priority: medium
created: 2026-04-20
source: K-021 Reviewer merged report W-3 (TD-K021-02)
visual-spec: "N/A — reason: zero-visual-change refactor (hex→token equivalence at rendered-color level; values sourced from K-021 homepage-v2.pen NavBar frame). Note: the K-021 Q2 ruling stated 'compiled CSS identical', QA corrected this to 'computed color identical, selector name differs' (arbitrary-value vs named class); therefore this ticket's AC uses `toHaveCSS('color', ...)` + dist/assets CSS declaration grep as equivalence evidence."
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-025 — 4 recommendations integrated into AC (Q1 CSS declaration grep in AC-025-REGRESSION / Q2 aria-current + toHaveCSS dual condition drops the class-name regex / Q3 /business-logic no-active-link assertion / inactive blocker uses `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` instead of a loose regex)
---

## Background

At K-021 delivery, `UnifiedNavBar.tsx` retained 7 hex literals (3 distinct colors: `#9C4A3B` / `#1A1814` / `#F4EFE5`), and `navbar.spec.ts` had 5 class-name regex assertions (`/text-\[#9C4A3B\]/` × 2 + `/text-\[#1A1814\]/` × 3) locking that form. The PM 2026-04-20 Q2 ruling allowed retention, on the grounds that "`text-[#9C4A3B]` and `text-brick-dark` produce identical compiled CSS, so leaving them untouched avoids regressing the 5 regex sites in K-005 navbar.spec".

However, K-021 Reviewer merged report W-3 noted: this retention conflicts with the user's directive prohibiting hardcoded hex, leaving a gap in the centralized-token principle. PM opens this ticket independently to migrate NavBar + spec in one shot, avoiding contamination of the K-021 fix-now batch.

**Dependency:** start once K-021 fix-now is done (K-021 reviewer fix batch covers C-1~C-4 + W-2 + S-3).

## Scope

**In:**

1. **Migrate all hex → token in `UnifiedNavBar.tsx`** (all tokens are already registered in the K-021 Tailwind config; before edits, Engineer runs `grep -E '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` to produce the full mapping):
   - `text-[#9C4A3B]` → `text-brick-dark` (active state)
   - `text-[#1A1814]` → `text-ink` (primary text + hover target)
   - `bg-[#F4EFE5]` → `bg-paper` (nav background)
   - `border-[#1A1814]` → `border-ink` (nav bottom border)

2. **Replace the 5 class-name regex assertions in `navbar.spec.ts` with dual-rail assertions** (QA Early Consultation Q2 adopted):
   - **drop** the existing class-name regex (`/text-\[#9C4A3B\]/` × 2 + `/text-\[#1A1814\]/` × 3) — class-name assertions are the weakest middle layer; they cannot verify the React state is correct nor that Tailwind tokens resolve correctly
   - **add dual-rail:**
     - Active: `[aria-current="page"]` attribute assertion (verifies React state) + `toHaveCSS('color', 'rgb(156, 74, 59)')` (verifies rendered color)
     - Inactive: `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` (replaces the loose `/text-\[#1A1814\]/` regex, which post-refactor would still match `text-ink/60` and miss state-swap bugs)

3. **Add 3 inactive-color assertions on the `/` route** (folds in TD-K021-09; uses the Q2 dual-rail form):
   - On the `/` route, App / Diary / About each get a `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')`

4. **Add an active-state assertion on the `/business-logic` route** (QA Q3 adopted + PM ruling):
   - Expected behavior: `/business-logic` is the Prediction hidden route; no NavBar link should have `aria-current="page"` (Home included, because `pathname !== '/'`; App/Diary/About included because `pathname` does not match)
   - Assertion: `await expect(page.locator('[aria-current="page"]')).toHaveCount(0)`
   - PM rationale: this is a coverage gap that has existed since K-021; gather it here in one go to avoid opening another ticket

**Out:**
- NavBar structural changes (order / new items / icon swaps) — out of scope
- Hex migration on other pages (handled within K-022/K-023/K-024)

## Acceptance Criteria

### AC-025-NAVBAR-TOKEN: NavBar zero-hex `[K-025]`

**Given** the developer greps `UnifiedNavBar.tsx`
**When** searching for the `#[0-9A-Fa-f]{6}` pattern
**Then** the result count = 0
**And** every color / border / background class is a K-021 token (`text-ink` / `text-brick-dark` / `bg-paper` etc.)
**And** `npx tsc --noEmit` exits 0
**And** `npm run build` succeeds

### AC-025-NAVBAR-SPEC: assertions upgraded to dual-rail (attribute + computed color) `[K-025]`

**Given** the 5 existing class-name regex assertions in `navbar.spec.ts` (`/text-\[#9C4A3B\]/` × 2 + `/text-\[#1A1814\]/` × 3) are replaced by attribute + computed color dual-rail assertions
**When** running `npx playwright test navbar.spec.ts`
**Then** all existing test cases pass (K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR)
**And** the active-state assertion is dual-condition: `toHaveAttribute('aria-current', 'page')` + `toHaveCSS('color', 'rgb(156, 74, 59)')` (no class-name regex retained)
**And** the inactive-state assertion is `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` (the loose `/text-\[#1A1814\]/` regex is gone)
**And** 3 new desktop inactive assertions on the `/` route (App / Diary / About computed color each), backfilling TD-K021-09
**And** a new `/business-logic` route active assertion: `page.locator('[aria-current="page"]').toHaveCount(0)` (verifies hidden-route behavior)
**And** the existing Prediction-hidden assertions (AC-021-NAVBAR, 2 sites) are not duplicated; the original `toHaveCount(0)` form is kept

### AC-025-REGRESSION: existing features have no regression + CSS output equivalence `[K-025]`

**Given** all K-021 ACs (AC-021-*) are PASS
**When** this ticket's implementation is done
**Then** all K-021 Playwright assertions still PASS
**And** K-005 AC-NAV-1~5 still PASS
**And** other-page E2E does not regress
**And** the compiled CSS color-declaration counts are equivalent (QA Q1 adopted): run `npm run build` once before and once after the refactor, then compare the count of `color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814` declarations in `dist/assets/*.css` — pre == post (proves only the selector name changed, computed value did not)

## Related links

- [K-021 ticket](./K-021-sitewide-design-system.md) (upstream dependency)
- [K-021 Reviewer W-3 findings](../reports/) (pending Reviewer report archival)
- [tech-debt TD-K021-02](../tech-debt.md#td-k021-02--unifiednavbar-hardcode-hex-k-025)
- [tech-debt TD-K021-09](../tech-debt.md#td-k021-09--route-navbar-inactive-color-未斷言)

## Retrospective

### Engineer (2026-04-22)

**AC judgments that were wrong:** None — all 3 ACs (NAVBAR-TOKEN / NAVBAR-SPEC / REGRESSION) matched implementation behavior exactly.

**Edge cases not anticipated:** The AC-025-REGRESSION grep pattern (`color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`) is a narrow proxy for equivalence, not a comprehensive check. Tailwind emits `rgb(R G B / var(--tw-*-opacity, 1))` for most utilities (both arbitrary-value and named) — the lowercase `prop:#hex` form only appears for opacity-modified variants like `/60` which produce `#1a181499`-style alpha bytes. The pre==post invariant happens to hold because opacity-modifier usage is 1:1 mapped (NavBar had one `/60` consumer, still has one `/60` consumer). Did not invalidate outcome but is under-documented; see retrospective log improvement.

**Next time improvement:** On Tailwind-refactor tickets, do the pre-baseline grep + inspect 2–3 matched/unmatched declarations BEFORE running the refactor (not after), so any gap between "what grep captures" vs "what the equivalence claim requires" surfaces before edits land. Widen the grep to also cover `rgb(R G B ` forms (the actual SSOT for non-opacity utilities) when needed.

### PM Final Summary (2026-04-22)

**Flow:** PM releases (post-QA Early Consultation 4 recommendations integrated into AC) → Architect design doc + pre-existing L433 drift fix → Engineer implementation (3 Edit hunks on UnifiedNavBar + 5 hunks on navbar.spec) → Reviewer Step 1 (breadth) 0C/0W/2S + Step 2 (depth) 0C/1W/2S → QA final sign-off PASS-with-Known-Gap.

**Rulings made:**
- W-1 (AC grep-pattern degeneracy for 2 of 4 patterns) → **Accept as TD-K025-01**; behavior-diff truth table + dual-rail assertions independently prove equivalence, grep is only auxiliary monitoring. Codified into `reviewer.md` §Pure-Refactor Behavior Diff + `qa.md` §Early Consultation to prevent repeat; memory `feedback_refactor_ac_grep_raw_count_sanity.md` added.
- S-1 (optional Home aria-current positive on `/` inactive test) → **Skip**; AC-021-NAVBAR L271 already covers Home active on `/`.
- S-2 (Engineer retrospective AC judgment revision) → **Skip**; Engineer retrospective already honestly disclosed the proxy-degeneracy under "Edge cases not anticipated" + "Next time improvement".

**Final gate result:** 192 passed / 1 skipped / 0 failed full suite; tsc exit 0; `npm run build` exit 0; 4 marketing routes visual check SKIPPED per `visual-spec: N/A` exemption (zero rendered-color change).

**Persona edits this ticket:** `~/.claude/agents/reviewer.md` (grep raw-count sanity hard gate), `~/.claude/agents/qa.md` (Early Consultation grep baseline sanity hard step).

---

## Deploy Record

**Date:** 2026-04-22
**Merge commit:** `37b8e18` (main)
**Firebase Hosting:** https://k-line-prediction-app.web.app (release complete)
**Bundle:**
- `dist/assets/index-Ck55VN8m.js` — 114.71 kB (gzip 38.51 kB)
- `dist/assets/index-Ds_VjIoB.css` — 44.21 kB (gzip 7.80 kB)
- Vendor chunks: react / charts / markdown unchanged
- CSS bundle delta: -210 bytes vs pre-K-025 (arbitrary-value selector dedup)

**Production CSS declaration probe (post-deploy, `curl … | grep -oE … | wc -l`):**

| Pattern | Expected (design §5.2) | Observed (prod) | Gate |
|---|---|---|---|
| `color:#9c4a3b` | 0 (arbitrary-value form absent) | 0 | ✅ |
| `color:#1a1814[0-9a-f]{0,2}` | 7 (opacity-modifier `/60` alpha-byte form) | 7 | ✅ |
| `background-color:#f4efe5` | 0 (arbitrary-value form absent) | 0 | ✅ |
| `border-color:#1a1814` | 3 | 3 | ✅ |
| `.text-brick-dark` named selector | ≥ 1 | 1 | ✅ |
| `.bg-paper` named selector | ≥ 1 | 1 | ✅ |
| `.border-ink` named selector | 3 | 3 | ✅ |

**Gates:** HTTP 200 from prod root; etag `25af1516…` 2026-04-22 06:00:19 GMT; all 7 probes match design doc prediction. Rendered-color equivalence with pre-refactor main branch confirmed via named-selector-vs-arbitrary-value parity + identical declaration counts for opacity variants.

**Out of scope (deferred):** TD-K025-01 grep pattern sanity (future Tailwind refactor tickets inherit codified reviewer/qa hard gates); hover/focus pseudo-state visual coverage (future NavBar ticket with active-state scope).
