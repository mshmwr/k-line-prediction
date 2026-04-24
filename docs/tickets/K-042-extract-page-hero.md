---
id: K-042
title: PageHero shared h1 + responsive mobile type scale (retroactive backfill)
status: closed
closed: 2026-04-24
deploy: 2026-04-24
type: refactor + bug-fix
priority: medium
size: S
created: 2026-04-24
qa-early-consultation: N/A — retroactive backfill, no QA consultation ran before shipping
retroactive: true
retroactive-reason: |
  Runtime commit 058699b landed on main 2026-04-24 12:09 +0800 before any
  docs/tickets/K-042-*.md ticket file was created; the K-042 ID was asserted
  in the commit message without PM reserving the ID via a ticket file first,
  and the full K-Line role pipeline (PM → Architect → Engineer → Reviewer →
  QA) was bypassed. This ticket file is audit-only; it does not change runtime
  code — it reconstructs AC from the diff and records the process gap so the
  public "every feature leaves a doc trail" claim holds.
triggered-by: K-040 Item 14 residual (user reported /about mobile Hero overflow on word "orchestrating" under Geist Mono reset)
related:
  - K-024  # DiaryHero already used text-[36px] sm:text-[52px] pattern pre-K-042
  - K-040  # Geist Mono sitewide reset; mono widened glyph metrics on mobile surfaced the overflow
  - K-043  # follow-up Designer spec backfill for mobile 36px token (visual-delta: yes, design-locked: false)
worktree: .claude/worktrees/K-042-extract-page-hero  # audit-backfill only; runtime worktree never existed
visual-delta: yes  # new mobile breakpoint scale shipped (36px) without Designer sign-off
content-delta: none
design-locked: false  # Designer sign-off deferred to K-043 spec backfill ticket
runtime-commit: 058699b
runtime-commit-date: 2026-04-24T04:09:31Z  # Fri Apr 24 12:09:31 2026 +0800
---

## Summary

Retroactive audit ticket for runtime commit `058699b` (on `main`, shipped + deployed 2026-04-24). That commit extracted a new shared `PageHero` component (`frontend/src/components/shared/PageHero.tsx`) and migrated the three site-wide h1 callers — `HeroSection` (`/`), `PageHeaderSection` (`/about`), `DiaryHero` (`/diary`) — onto it. It also introduced a responsive mobile type scale (36px mobile / 52px or 56px desktop) to fix `/about` mobile Hero overflow where the monospace word "orchestrating" exceeded the 327px usable width at 375px viewport after the K-040 Bodoni→Geist Mono reset.

The commit bypassed the full K-Line role pipeline. This file reconstructs AC from the diff, records the evidence trail, and surfaces the process gap.

## Background

**Why the fix was needed:**
1. K-040 sitewide `font-display` retire + `font-mono` reset widened mono glyph metrics on mobile.
2. `HeroSection.tsx` used `text-[56px]` fixed (no `sm:` ramp); `PageHeaderSection.tsx` used `text-[52px]` fixed (no `sm:` ramp); both rendered without responsive downshift at 375px viewport.
3. `DiaryHero.tsx` (K-024) already carried the correct responsive pattern `text-[36px] sm:text-[52px]` — so the "right answer" was already in-repo, just not propagated to the other two hero sites.
4. User reported `/about` mobile width overflow on word `orchestrating` during session interaction; fix shipped inline without PM opening a ticket first.

**Why retroactive rather than a new ticket:**
- Runtime is already on `main` via `058699b` and live on Firebase Hosting.
- Rewriting history (reverting + reshipping under proper flow) would invalidate the deployed bundle asset hashes without changing user-visible behavior.
- Audit trail requires the ID to be resolvable from `docs/tickets/K-042-*.md`; this file fills that hole.

## Scope (runtime — already landed)

**Includes (all already on `main` via `058699b`):**
- New shared component: `frontend/src/components/shared/PageHero.tsx` — single `<h1>` + per-line `<span className="block">` children, props `{ lines: { text, color: 'ink' | 'brick' | 'brick-dark' }[], desktopSize: 52 | 56 }`, Tailwind literal classes `text-[36px] sm:text-[52px]` or `text-[36px] sm:text-[56px]` + `font-bold leading-[1.05]`.
- Refactored callers (all 3 h1 sites):
  - `frontend/src/components/home/HeroSection.tsx` — `desktopSize={56}`, 2 lines (ink + brick-dark).
  - `frontend/src/components/about/PageHeaderSection.tsx` — `desktopSize={52}`, 2 lines (ink + brick).
  - `frontend/src/components/diary/DiaryHero.tsx` — `desktopSize={52}`, 1 line (ink).
- E2E specs adjusted for semantic change (2 `<h1>` on `/` → 1 `<h1>` + 2 span blocks):
  - `frontend/e2e/pages.spec.ts` (AC-HOME-1) — replaced two `getByRole('heading', { name: ... })` with one `getByRole('heading', { level: 1 })` + two `toContainText`.
  - `frontend/e2e/sitewide-fonts.spec.ts` (AC-021-FONTS + AC-040-SITEWIDE-FONT-MONO T-AC040-H1-HOME) — replaced 2 name-based heading locators with `level: 1` lookups.
- `frontend/public/diary.json` — K-042 entry prepended.
- `docs/retrospectives/engineer.md` — engineer entry prepended.

**Excludes (out of K-042 runtime scope — tracked elsewhere):**
- Pencil frame updates + `docs/designs/*-visual-spec.json` mobile token backfill → **K-043** (Designer-owned, `visual-delta: yes`, `design-locked: false`).
- Any CSS / palette / component-tree change outside the three h1 sites.

## Sacred Invariant Cross-Check (post-hoc verification)

| Sacred | Source | K-042 Status |
|--------|--------|--------------|
| Sitewide `font-mono` (Geist Mono) on body + `font-style: normal` | K-040 | Preserved — PageHero renders no font-family override; inherits body mono. `sitewide-fonts.spec.ts` AC-040-H1-HOME + H1-ABOUT + H1-DIARY all green. |
| K-021 body paper palette + ink/brick/brick-dark tokens | K-021 | Preserved — PageHero `COLOR_CLASS` map uses `text-ink` / `text-brick` / `text-brick-dark` only (no ad-hoc hex). |
| `/about` hero 2-span line split (K-034 Phase 2 §7 Step 8 D-19/D-20/D-21) | K-034 | Preserved — PageHero reproduces span-block structure, just behind a prop contract. |
| `/diary` hero single-line title (K-024 §6.1) | K-024 | Preserved — PageHero renders one span when `lines.length === 1`. |
| AC-HOME-1 headings visible (Hero, HOW IT WORKS, Dev Diary) | K-017 | Preserved via `level: 1` + `toContainText` — `/` still has exactly one `<h1>` (was two), still carries both text fragments. |
| AC-034-P1 Footer byte-identity across 4 routes | K-034 Phase 1 | Untouched — K-042 does not edit Footer. Footer snapshot regression (Footer on `/diary`) present on both `main` pre-K-042 and post-K-042 — documented pre-existing, not K-042 introduced. |

**Semantic change logged (not a regression, but a contract change):** Homepage `/` went from **two** `<h1>` elements to **one** `<h1>` with two `<span className="block">` children. This is a strict accessibility win (one h1 per page) and matches `/about` + `/diary` pattern. Specs updated in same commit.

## File Change List (from `git show 058699b --stat`)

| # | File | Change | Class | Gate (reconstructed) |
|---|------|--------|-------|----------------------|
| 1 | `frontend/src/components/shared/PageHero.tsx` | **new** (36 lines) | frontend/src | full gate |
| 2 | `frontend/src/components/home/HeroSection.tsx` | inline 2× `<h1>` → `<PageHero desktopSize={56} lines=... />` | frontend/src | full gate |
| 3 | `frontend/src/components/about/PageHeaderSection.tsx` | inline `<h1>` → `<PageHero desktopSize={52} lines=... />` | frontend/src | full gate |
| 4 | `frontend/src/components/diary/DiaryHero.tsx` | inline `<h1>` → `<PageHero desktopSize={52} lines=... />` | frontend/src | full gate |
| 5 | `frontend/e2e/pages.spec.ts` | AC-HOME-1 heading locator: 2 name-based → 1 level+contain | frontend/e2e | full gate |
| 6 | `frontend/e2e/sitewide-fonts.spec.ts` | AC-021-FONTS + AC-040-H1-HOME: name-based → level-based | frontend/e2e | full gate |
| 7 | `frontend/public/diary.json` | prepend K-042 entry (6 lines) | frontend/public | Playwright subset |
| 8 | `docs/retrospectives/engineer.md` | prepend K-042 retro (10 lines) | docs | no gate (`docs-only`) |

Mixed commit → strictest gate was applied in-session: `tsc` + full Playwright chromium suite.

## Acceptance Criteria (reconstructed from diff)

### AC-042-PAGEHERO-EXISTS

**Given** `frontend/src/components/shared/PageHero.tsx`
**When** imported in TypeScript build
**Then** default export is a React component
**And** props shape is `{ lines: { text: ReactNode; color?: 'ink' | 'brick' | 'brick-dark' }[]; desktopSize: 52 | 56 }`
**And** renders exactly one `<h1>` element with `className` containing `font-bold`, `leading-[1.05]`, and `text-[36px]` plus either `sm:text-[52px]` or `sm:text-[56px]`

### AC-042-HERO-RESPONSIVE-SCALE

**Given** user visits `/`, `/about`, or `/diary` at viewport width 375px
**When** page renders
**Then** the sole `<h1>` element uses computed `font-size: 36px`
**And** `document.body.scrollWidth === window.innerWidth` (no horizontal overflow) — verified 2026-04-24 session: bodyScrollW=375 on all 3 routes

### AC-042-HERO-DESKTOP-SCALE

**Given** user visits the 3 hero routes at viewport width 1280px
**When** page renders
**Then** `/` h1 computed `font-size: 56px`
**And** `/about` h1 computed `font-size: 52px`
**And** `/diary` h1 computed `font-size: 52px`

### AC-042-SINGLE-H1-PER-HERO

**Given** any of the 3 hero routes at any viewport
**When** DOM queried for `[role="heading"][aria-level="1"]` or `<h1>` tag
**Then** exactly one `<h1>` element exists per page inside the hero region
**And** for `/` the single `<h1>` contains both `"Predict the next move"` and `"before it happens —"` text
**And** for `/about` the single `<h1>` contains both `"One operator, orchestrating AI"` and `"agents end-to-end —"` text

### AC-042-E2E-CONTRACT-UPDATED

**Given** `frontend/e2e/pages.spec.ts` + `frontend/e2e/sitewide-fonts.spec.ts`
**When** grep for `getByRole('heading', { name: 'Predict the next move'` or `getByRole('heading', { name: 'before it happens`
**Then** no match (replaced by `level: 1` + `toContainText`)
**And** `getByRole('heading', { level: 1 })` lookups compile and pass on current `main`

### AC-042-SACRED-PRESERVED

**Given** full Playwright chromium suite on current `main`
**When** run at session close 2026-04-24
**Then** 241 tests pass
**And** only 2 failures, both pre-existing on `main` before `058699b` (verified by re-running on `main` at `e8cb6ca`): `shared-components.spec.ts:182` Footer snapshot on `/diary` + `ga-spa-pageview.spec.ts:142` GA SPA beacon

## Behavior-Diff Truth Table (OLD pre-058699b vs NEW post-058699b)

| Viewport | Route | Element | OLD | NEW | Change? |
|----------|-------|---------|-----|-----|---------|
| 375px | `/` | h1 count | 2 (separate "Predict..." + "before...") | 1 (with 2 span children) | **STRUCTURAL** (desired — a11y win) |
| 375px | `/` | h1 font-size | 56px (no `sm:` ramp) | 36px (new mobile breakpoint) | **CHANGE** (desired — fix overflow) |
| 1280px | `/` | h1 font-size | 56px | 56px | same |
| 375px | `/about` | h1 font-size | 52px (no `sm:` ramp) | 36px | **CHANGE** (desired — fix overflow on "orchestrating") |
| 1280px | `/about` | h1 font-size | 52px | 52px | same |
| 375px | `/diary` | h1 font-size | 36px (K-024 already responsive) | 36px | same |
| 1280px | `/diary` | h1 font-size | 52px | 52px | same |
| all | all | h1 font-family | Geist Mono (K-040) | Geist Mono (inherited) | same |
| all | all | h1 font-style | normal (K-040 italic OFF) | normal | same |
| all | all | color tokens | `text-ink` / `text-brick` / hex `#9C4A3B` (= brick-dark) | `text-ink` / `text-brick` / `text-brick-dark` (tokenized) | equivalent (color token rename only) |

## Implementation Evidence

- Commit SHA: `058699b7f86af6642a7e3b942c85de5cdf97615c`
- Commit date: Fri Apr 24 12:09:31 2026 +0800
- Diff: `git -C /Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction show 058699b --stat` → 8 files changed, 83 insertions(+), 33 deletions(-)
- New file: `frontend/src/components/shared/PageHero.tsx` (36 lines)
- Build verification (session log): `npx tsc --noEmit` exit 0; Playwright chromium 241 pass / 2 pre-existing fail / 1 skipped
- Deploy: Firebase Hosting release 2026-04-24; live asset hashes `index-DekqN0dA.js` + `index-DziWHpXj.css` match local `frontend/dist/assets/` build output; HTTP 200 on `https://k-line-prediction-app.web.app/`

## Retrospective

**What went wrong:**

1. **K-XXX ID reserved by commit, not by ticket file.** The string `K-042` was asserted in the commit message of `058699b` before any `docs/tickets/K-042-*.md` file existed to reserve it. If another parallel session had used `K-042` for a different scope, the project would have had two `K-042`s with divergent histories. The "every feature leaves a doc trail" claim on the public README was strictly untrue for ~hours until this backfill.

2. **Full role pipeline skipped.** PM did not open a ticket, Architect did not design a component contract, Reviewer did not gate, QA did not run a formal regression sign-off. Engineer work happened inside the main interactive session under direct user steering (user Q1/Q2/Q3 rulings on desktop-size retention + mobile unification + scope-to-h1). This is not formally authorized by `~/.claude/agents/pm.md` — the persona does not grant an "urgent hotfix skip-flow" exception.

3. **Visual delta shipped without Designer.** A new mobile breakpoint scale (36px) for 3 hero sites is a design-system change. Designer never touched the Pencil frames or the `docs/designs/*-visual-spec.json` exports, so the deployed app now disagrees with the design SSOT. `K-043` is filed to close this gap, but the disagreement period started at `058699b` deploy time.

4. **No pre-close deploy evidence gate firing.** The PM persona gate "pre-close deploy evidence required for `status: closed`" (added to `pm.md` this week per `feedback_deploy_after_release.md`) did not fire because no PM close ever happened — the ticket file did not exist.

**Process gap → codification:**

The controlling rule gap is "Engineer / main-session work asserted a K-XXX ID before PM reserved it via ticket file". Codifying as:

- Memory `feedback_pm_reserve_k_id_before_commit.md` (to be written): PM must `touch docs/tickets/K-XXX-<slug>.md` with at minimum the frontmatter block BEFORE any git commit message (or in-session main commit) references `K-XXX`. The worktree + branch + frontmatter reservation happens first; the runtime commit is the second step.
- Update `~/.claude/agents/pm.md` §Session Handoff Verification §Worktree isolation pre-flight to add this as an explicit item: "K-XXX string must not appear in any commit message on any branch until `docs/tickets/K-XXX-<slug>.md` exists and is staged in its worktree."
- Update `~/.claude/agents/engineer.md` to add a hard precondition: "Before `git commit` with a subject containing `K-XXX`, Read `docs/tickets/K-XXX-*.md` and confirm it exists and is non-empty. File missing → halt, request PM to reserve first."

**What went well:** (omitted — per `feedback_retrospective_honesty.md`, do not fabricate. The fix is technically sound but the process path was wrong; celebrating the technical fix here would incentivize continued flow-bypass.)

---

### Deploy Record

**Deploy status:** Deployed 2026-04-24 (session window, post-commit `058699b`) to `https://k-line-prediction-app.web.app`. Build ran from `frontend/` via `npm run build` (vite 5.4.0, 2.41s). Asset hash parity verified end-to-end: local `frontend/dist/assets/index-DekqN0dA.js` + `index-DziWHpXj.css` → Firebase Hosting live edge same hashes.

**Merge status at close:** Runtime code was merged to `main` at commit `058699b` before this ticket file existed (the gap this backfill documents). Audit-only doc commit for this ticket file will land on `main` via `.claude/worktrees/K-042-extract-page-hero` FF-merge separately (see session log for SHA).

**Trigger condition for next deploy:** no K-042-specific follow-up deploy required. K-043 (Designer spec backfill) is `visual-delta: yes` but documentation/spec-only — no runtime redeploy expected. If K-043 surfaces a spec/runtime divergence that requires code change, that is a K-043 runtime concern not K-042.
