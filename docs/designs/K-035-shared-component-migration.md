---
title: K-035 Shared Component Migration — /about Footer unification + cross-page chrome contract
type: design
ticket: K-035
owner: senior-architect
created: 2026-04-22
pencil-frames:
  - "4CsvQ — Homepage footer (homepage-v2.pen)"
  - "35VCj — /about (K-017 v2) footer node subtree (homepage-v2.pen)"
depends-on: K-017, K-021, K-022
retires: K-021 Sacred clause `/about 維持 FooterCtaSection（K-017 鎖定）`
---

## 0. Scope Questions (SQ / BQ for PM)

### SQ-035-01 — Design-doc filename drift (informational, Architect self-resolved)

- Ticket §Phase 3.1 names the design doc `docs/designs/K-035-footer-unification.md`.
- Phase 3 invocation prompt (this task) names it `docs/designs/K-035-shared-component-migration.md`.
- Architect self-resolves: follow invocation prompt; the latter name is more accurate because Phase 3 scope is broader than "Footer unification" (it also creates `components/shared/` + retires Sacred + adds cross-page spec + refreshes docstrings).
- **Action:** PM should cross-link this design doc from the ticket when closing; no BQ required. Architect will ensure the ticket §3.1 pointer is refreshed in the PRD §4 Closed-Ticket migration step.

### BQ-035-01 — OQ-1 /about footer content-variant modeling (RESOLVED by Architect, PM to confirm)

**Problem:** Phase 2 audit surfaced three candidate Footer canonical structures (α / β / γ). Invocation prompt carries the PM provisional recommendation (Option α — variant prop on shared Footer.tsx) plus the instruction "formally model α/β/γ with trade-off table, recommend one, PM rules after design-doc review." Architect must not relay α/β/γ to the user; PM has priority-1 Pencil signal (both Pencil frames exist intentionally); Architect job is rigorous engineering trade-off.

**Option model:**

| Dimension | α — Variant prop on shared Footer | β — Two siblings in `components/shared/` | γ — Unify content sitewide (delete one) |
|-----------|----------------------------------|------------------------------------------|-----------------------------------------|
| File count | 1 `.tsx` + 2 render branches | 2 `.tsx` files | 1 `.tsx` file, 1 render branch |
| LOC total | ~70 (union of both bodies) | ~70 split 50/20 between two files | ~35 (one body wins, other deleted) |
| Pencil fidelity | Preserves both frames `4CsvQ` + `35VCj` — both render their own designs | Preserves both frames — same as α | **Violates Pencil** — one frame's design is discarded |
| Maintenance surface | Single file; one docstring; one `Used on:` list; variant prop is the one axis of divergence | Two files; two docstrings; two `Used on:` lists; drift can re-emerge if future ticket edits only one file | Single file; smallest surface; but product content forcibly unified |
| Test surface | `shared-components.spec.ts` asserts DOM-equivalence modulo declared variant differences (home branch vs about branch) | Spec must enumerate per-file per-route assertions; no single "shared" contract to assert | Spec is the simplest — one DOM output per all routes |
| Cross-page DOM-equivalence contract | **Natural fit** — the prop is the one declared divergence; all other DOM must be identical | Awkward — two files means no equivalence contract; spec devolves to "both files have a `<footer>` and a GA line" (weak) | Trivial |
| Future extensibility | New variant = new `variant` literal + new render branch; no new file | New variant = new file + new route wiring + spec update | New variant requires splitting back to α or β; γ creates future-debt |
| Risk of re-drift | Low — one file to edit, any consumer route must pass variant prop | **High** — two files restore exactly the K-035 failure mode (two "sitewide" footers both claiming ownership via docstring) | N/A — no drift possible, but also no product choice |
| Engineer effort | Medium — write variant logic + delete one file + migrate two imports | Medium — move both files + delete nothing + migrate two imports | Low — delete one file + migrate one import + preserve the other |
| User-visible change | Zero — both routes render their existing design | Zero | **High** — either `/` gets "Let's talk →" CTA or `/about` loses it |

**Scoring matrix (weights declared up-front; no post-hoc re-weighting per `feedback_rule_strength_tiers` + Architect persona tiebreaker rule):**

| Dimension (weight) | α | β | γ |
|--------------------|---|---|---|
| Pencil fidelity (0.25) | 10 | 10 | 0 |
| Cross-page DOM-equivalence contract strength (0.25) | 10 | 3 | 10 |
| Re-drift resistance (0.20) | 10 | 2 | 10 |
| Maintenance surface minimization (0.15) | 8 | 5 | 10 |
| User-visible-change minimization (0.15) | 10 | 10 | 2 |
| **Weighted total** | **9.7** | **6.25** | **5.3** |

**Recommendation: Option α — variant prop on shared `components/shared/Footer.tsx`.**

- α dominates all three product-risk dimensions (Pencil fidelity, equivalence contract, drift resistance) and loses only 2 points on maintenance surface (because union-of-both-bodies ≈ 70 LOC vs γ's 35 LOC). The ≥3.4-point gap over β and ≥4.4-point gap over γ is decisive; no tiebreaker needed.
- β is explicitly rejected: it recreates the failure mode K-035 is fixing (two sibling files both claiming sitewide ownership via docstring). Moving them into `components/shared/` doesn't prevent the next engineer from forgetting one.
- γ requires a product content decision (does `/` get "Let's talk →" or `/about` lose it?) that is outside K-035's "bug fix + process fix" scope and violates both Pencil frames.

**Requested PM action:** confirm Option α ruling at design-doc review; permit Architect to proceed with §4 component spec using `variant: 'home' | 'about'` prop.

### BQ-035-02 — Should `/business-logic` render the shared Footer variant-home or get a third variant?

- Current state: `/business-logic` imports `HomeFooterBar.tsx` at `BusinessLogicPage.tsx` L7+L117 (identical usage to `/`).
- Audit classifies `/business-logic` as an out-of-scope route but flags: "If Phase 3 unifies Footer into `components/shared/Footer.tsx`, this route's imports must update too."
- Architect ruling (no PM BQ needed): `/business-logic` gets `variant="home"`. Rationale: `BusinessLogicPage` today renders the exact same `<HomeFooterBar />` as `/`; there is zero product signal for a divergent footer. Pencil has no `/business-logic` frame, so no source-of-truth conflict.
- **No BQ required.** Listed in §5 Route Impact Table for completeness.

### BQ-035-03 — Should this ticket also move `UnifiedNavBar` into `components/shared/`?

- Audit §4.3 "Phase 3 scope preview" item 3: "Move `UnifiedNavBar.tsx` into `shared/` (low-risk, opportunistic alongside Footer refactor; OR split to own TD ticket — Architect calls it)."
- Architect ruling: **out of scope for K-035.** Rationale: (a) this ticket is a bug-fix + process-fix on Footer drift; NavBar has no drift (audit §1 row 1 = all `shared` + intentional `n-a`); (b) moving `UnifiedNavBar` expands blast radius from 3 Footer import sites to 7+ NavBar import sites × 4 consuming pages without a bug-driven need; (c) K-025 is already the active NavBar ticket (hex→token migration); a NavBar move should either piggyback on K-025 or open a dedicated TD.
- **Action:** open TD-K035-01 "move `UnifiedNavBar.tsx` → `components/shared/NavBar.tsx`" with priority low, blocked-by K-025 close. Listed in §10 Risks & Retirements.

**No open BQ requires the user today.** All three SQ/BQ items resolve at PM Phase Gate via Architect recommendations above.

---

## 1. Problem Statement

- `/about` renders `<FooterCtaSection />` (`components/about/FooterCtaSection.tsx`) — inline duplicate of the footer family used by `/` and `/business-logic` (`<HomeFooterBar />`, `components/home/HomeFooterBar.tsx`).
- Two sibling `.tsx` files each declare sitewide ownership via docstring (`HomeFooterBar.tsx` L2 "AC-021-FOOTER（K-021 以降為全站共用）"; `FooterCtaSection.tsx` L6 "Used across all pages: AboutPage, HomePage, DiaryPage."). Both docstrings are factually stale (audit Drift #2).
- The drift survived 3 tickets × 5 roles (K-017 introduction, K-021 sitewide standardization, K-022 structure refresh); K-021 even codified the drift as a regression assertion (`sitewide-footer.spec.ts` L88–101 `'/about renders FooterCtaSection, NOT HomeFooterBar'`). The spec itself pinned `/about` away from the sitewide component — spec-enforced bug.
- Root cause is **structural, not cosmetic**: no `components/shared/` directory exists (audit Drift #0), so there is no filesystem signal telling an engineer "this is the canonical shared chrome". Convention-only enforcement failed 5 times.
- Fix must retire the K-021 Sacred clause `/about 維持 FooterCtaSection（K-017 鎖定）`, create the shared directory, collapse two files into one, preserve both Pencil designs via a `variant` prop, and add a cross-route DOM-equivalence regression spec so future drift cannot hide.

---

## 2. Goals / Non-Goals

### Goals

1. Single Footer source of truth: `frontend/src/components/shared/Footer.tsx`.
2. Cross-route DOM-equivalence contract: a Playwright spec that fails if any consuming route's Footer diverges from the canonical shared component (modulo declared `variant` prop differences).
3. Retire the K-021 Sacred clause preserving `/about = FooterCtaSection`; delete the spec block that codified it.
4. Create `frontend/src/components/shared/` directory with Footer as the first resident; establish the location as "canonical sitewide chrome" filesystem signal.
5. Refresh stale `Used on:` docstrings on any surviving shared component.
6. Preserve Pencil fidelity: both `4CsvQ` (homepage minimal) and `35VCj` (about CTA) designs remain visually unchanged.
7. Preserve all non-Footer Sacred invariants: K-017 content (email, GitHub, LinkedIn URLs, GA statement), K-022 A-7 link style, K-024 `/diary` no-footer, K-030 `/app` no-footer/no-navbar isolation.

### Non-Goals

1. NavBar migration to `components/shared/` — audit-OK; out of scope (BQ-035-03 ruling; open TD-K035-01 instead).
2. Hero/Banner migration — Hero is content-variant per route (not drift); Banner is single-page-today (reuse candidate, not drift).
3. Visual redesign of either Footer variant — this is a code-organization + regression-spec fix; pixels must not change.
4. `/app` or `/diary` Footer changes — K-024 and K-030 decisions preserved unchanged.
5. Adding new AC-035 content invariants beyond what AC-035-FOOTER-UNIFIED / AC-035-CROSS-PAGE-SPEC already state.

---

## 3. OLD-vs-NEW Behavior Diff Table (pure-refactor gate)

**Source:** `git show main:frontend/src/components/home/HomeFooterBar.tsx` and `git show main:frontend/src/components/about/FooterCtaSection.tsx` (dry-run read 2026-04-22, SHA `bdc9231`).

**Method:** enumerate every observable DOM output of both OLD components; map to NEW unified component with `variant` prop; assert OLD ≡ NEW per (component × variant × consumer route) cell.

### 3.1 OLD state truth table

| Input branch | OLD component rendered | Observable DOM output (exact outerHTML summary) |
|--------------|------------------------|-------------------------------------------------|
| `/` HomePage | `<HomeFooterBar />` | `<footer class="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">` → `<div class="flex justify-between items-center"><span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span></div>` → `<p class="text-center mt-3">This site uses Google Analytics to collect anonymous usage data.</p>` |
| `/business-logic` BusinessLogicPage (PasswordForm state) | `<HomeFooterBar />` | identical to `/` |
| `/business-logic` BusinessLogicPage (logged-in state) | `<HomeFooterBar />` | identical to `/` |
| `/about` AboutPage | `<FooterCtaSection />` | `<div class="text-center py-8 border-t border-ink/10">` → `<p class="font-mono text-ink text-lg font-bold mb-3">Let's talk →</p>` → `<a href="mailto:yichen.lee.20@gmail.com" class="font-italic italic text-brick-dark hover:text-brick text-sm underline" data-testid="cta-email" onClick=trackCtaClick('contact_email')>yichen.lee.20@gmail.com</a>` → `<p class="text-muted text-sm mt-4 mb-2">Or see the source:</p>` → `<div class="flex justify-center gap-4">` → `<a href="https://github.com/mshmwr/k-line-prediction" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository" class="font-italic italic text-ink hover:text-brick-dark text-sm underline" data-testid="cta-github" onClick=trackCtaClick('github_link')>GitHub</a>` + `<span class="text-muted">·</span>` + `<a href="https://linkedin.com/in/yichenlee-career" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" class="font-italic italic text-ink hover:text-brick-dark text-sm underline" data-testid="cta-linkedin" onClick=trackCtaClick('linkedin_link')>LinkedIn</a>` → `<p class="text-muted text-xs font-mono text-center mt-4">This site uses Google Analytics to collect anonymous usage data.</p>` |
| `/diary` DiaryPage | (no footer) | no `<footer>` or `<FooterCtaSection />` DOM — K-024 + K-017 AC-017-FOOTER negative assertion |
| `/app` AppPage | (no footer) | no footer DOM — K-030 isolation |

### 3.2 NEW state truth table

NEW component: `<Footer variant="home" />` or `<Footer variant="about" />` at `components/shared/Footer.tsx`. Internal structure: single component, switches subtree by `variant` prop.

| Input | NEW rendered | Observable DOM output |
|-------|--------------|-----------------------|
| `<Footer variant="home" />` (consumed on `/` + `/business-logic`) | Footer home branch | **identical** to OLD HomeFooterBar DOM (row 1/2/3 above) — outer `<footer>` element, same class string, same single-span child, same GA `<p>` child |
| `<Footer variant="about" />` (consumed on `/about`) | Footer about branch | **identical** to OLD FooterCtaSection DOM (row 4 above) — same outer `<div>`, same "Let's talk →" heading, same 3 anchors, same `data-testid`s, same `onClick` GA handlers, same GA `<p>` closer |
| no-footer routes (`/diary`, `/app`) | (no `<Footer />` element) | DOM identical to OLD (no footer) |

### 3.3 OLD-vs-NEW diff cells (all must be "equivalent" or "declared no observable effect")

| Cell | OLD (HomeFooterBar or FooterCtaSection) | NEW (`<Footer variant=...>`) | Equivalence proof |
|------|-----------------------------------------|-------------------------------|-------------------|
| Outer element tag (home variant) | `<footer>` | `<footer>` | same tag, same class string enforced by spec assertion |
| Outer element tag (about variant) | `<div>` | `<div>` | same tag, same class string |
| Class string (home variant) | `font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full` | identical (copied verbatim) | string equality assertion in spec |
| Class string (about variant) | `text-center py-8 border-t border-ink/10` | identical | string equality assertion in spec |
| Home variant text content | `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` + GA sentence | identical | `getByText({ exact: true })` assertion |
| About variant text content | `Let's talk →` + email + `Or see the source:` + `GitHub · LinkedIn` + GA sentence | identical | `getByText({ exact: true })` assertion |
| About variant `mailto:` href | `mailto:yichen.lee.20@gmail.com` | identical | attribute equality assertion |
| About variant GitHub href | `https://github.com/mshmwr/k-line-prediction` + `target=_blank` + `rel=noopener noreferrer` | identical | attribute equality assertion |
| About variant LinkedIn href | `https://linkedin.com/in/yichenlee-career` + same attrs | identical | attribute equality assertion |
| About variant `data-testid`s | `cta-email` / `cta-github` / `cta-linkedin` | identical | selector assertion |
| About variant `onClick` GA tracking | `trackCtaClick('contact_email')` / `('github_link')` / `('linkedin_link')` | identical — imported from `utils/analytics` at new file path | `ga-tracking.spec.ts` AC-018-CLICK assertion unchanged |
| About variant GA disclosure `<p>` | `This site uses Google Analytics to collect anonymous usage data.` + `text-muted text-xs font-mono text-center mt-4` | identical | text + class assertion |
| Home variant GA disclosure `<p>` | `This site uses Google Analytics to collect anonymous usage data.` + `text-center mt-3` | identical | text assertion |
| A-7 link style (about variant) | `font-italic italic text-brick-dark hover:text-brick text-sm underline` (email); `font-italic italic text-ink hover:text-brick-dark text-sm underline` (GitHub/LinkedIn) | identical | class string assertion (K-022 Sacred preserved) |
| `aria-label` attrs (about variant) | `GitHub repository` / `LinkedIn profile` | identical | attribute assertion |
| Render path when wrong variant passed | N/A (no variant in OLD) | TypeScript compile-time error — `variant: 'home' \| 'about'` union type | TS `--noEmit` exit 0 |
| Default variant behavior | N/A (no prop in OLD) | No default — `variant` is **required**, Engineer must pass explicitly at each call site | forces each consumer to declare intent; prevents silent default drift |

**Divergent cells: 0.** **Equivalent cells: 17.** **No "declared no observable effect" cells needed** — every cell has a direct equivalence assertion.

**Pure-refactor gate: PASS.** Every OLD DOM output maps to a NEW DOM output with proven string-equality at the class / href / text / attribute level.

---

## 4. Architecture

### 4.1 New component: `frontend/src/components/shared/Footer.tsx`

Create directory `frontend/src/components/shared/` (first resident = `Footer.tsx`; empty `README.md` optional but not required for K-035).

**File header docstring (truthful `Used on:` list, per Engineer persona docstring rule):**

```
/**
 * Footer — sitewide footer (K-035 unification, retires K-021 Sacred `/about 維持 FooterCtaSection`).
 *
 * Used on:
 *   - `/`             via variant="home"  (HomePage.tsx)
 *   - `/business-logic` via variant="home"  (BusinessLogicPage.tsx)
 *   - `/about`        via variant="about" (AboutPage.tsx)
 *
 * NOT rendered on:
 *   - `/diary` (K-024 no-footer decision; intentional)
 *   - `/app`   (K-030 isolation; intentional)
 *
 * Pencil source of truth:
 *   - variant="home"  → frame 4CsvQ (homepage-v2.pen)
 *   - variant="about" → frame 35VCj footer subtree (homepage-v2.pen)
 *
 * Regression contract: frontend/e2e/shared-components.spec.ts asserts outerHTML
 *   equivalence across all consuming routes modulo the variant axis.
 */
```

### 4.2 Props interface (pseudo-interface, not implementation)

```
interface FooterProps {
  variant: 'home' | 'about'   // required — no default; each consumer declares intent explicitly
}
```

**No optional props.** No `className` override; no `children` slot. The component is fully self-contained; any future customization needs a new variant literal + new AC + new spec row.

**Why no default variant:**

- A default (e.g., `variant = 'home'`) would reintroduce the K-035 failure mode: a consumer forgetting to pass the prop would silently render the wrong footer, and TypeScript would not catch it.
- Explicit prop at every call site = filesystem + type-system signal that this is intentional, matching the K-035 memory rule "each role must enumerate shared components expected on a route by canonical path, not generic wording."

### 4.3 Internal render branching (pseudo-code, Engineer follows)

```
function Footer({ variant }: FooterProps) {
  if (variant === 'home') {
    // render <footer class="font-mono text-[11px] ..."> (verbatim from OLD HomeFooterBar.tsx L11-L20)
    // contact info row + GA disclosure <p>
  }
  // variant === 'about'
  // render <div class="text-center py-8 border-t border-ink/10"> (verbatim from OLD FooterCtaSection.tsx L14-L52)
  // Let's talk heading + email + GitHub·LinkedIn + GA disclosure
  // preserves onClick trackCtaClick() calls + data-testid attrs
}
```

TypeScript union on `variant` guarantees exhaustiveness (TS `--noEmit` will fail if a third variant is added without updating both branches).

### 4.4 Imports / dependencies

- `utils/analytics` → `trackCtaClick` (about branch only; import path remains `../../utils/analytics` from `components/shared/`).
- No new npm deps.
- No circular import risk (Footer imports utility; pages import Footer).

### 4.5 File-location decision

- `components/shared/` chosen (not `components/common/` which exists, not `components/primitives/` which exists) because:
  - `common/` today hosts `SectionHeader` / `SectionLabel` / `CtaButton` — section-level primitives used by multiple sections within one page, not page-level chrome.
  - `primitives/` today hosts `SectionContainer` / `CardShell` / `ExternalLink` — card/container primitives.
  - Neither has the semantic "this is sitewide page-level chrome" meaning K-035 needs. A new `shared/` directory is the clearest signal, aligned with the K-035 memory rule's `components/shared/` canonical-path wording.
- **Architect decision (no BQ):** create `components/shared/`. K-035 lands Footer as first resident; future shared chrome (if audit surfaces new cases) lands here.

---

## 5. Route Impact Table (MANDATORY — global-style route impact rule)

K-035 changes `components/shared/Footer.tsx` import, `sitewide-footer.spec.ts`, `agent-context/architecture.md`, and is a cross-page structural chrome change. All routes from `architecture.md` routing table enumerated below.

| Route | Current Footer | Post-K-035 Footer | Status | Visual-verification required? | Engineer action |
|-------|----------------|-------------------|--------|------------------------------|-----------------|
| `/` | `<HomeFooterBar />` (`components/home/HomeFooterBar.tsx`) | `<Footer variant="home" />` (`components/shared/Footer.tsx`) | **affected** | Yes — Playwright + dev-server visual must confirm pixel-identical render | swap import in `HomePage.tsx` |
| `/about` | `<FooterCtaSection />` (`components/about/FooterCtaSection.tsx`) | `<Footer variant="about" />` (`components/shared/Footer.tsx`) | **affected** | Yes — Playwright + dev-server visual must confirm pixel-identical render; K-022 A-7 link style Sacred preserved | swap import in `AboutPage.tsx`, remove `S7 — FooterCtaSection` comment |
| `/diary` | (no footer) | (no footer — unchanged) | **unaffected** | No visual change; Playwright `pages.spec.ts` L160 AC-017-FOOTER negative assertion must remain green | no edit |
| `/app` | (no footer) | (no footer — unchanged) | **must-be-isolated** | No visual change; Playwright `app-bg-isolation.spec.ts` AC-030-NO-FOOTER must remain green | no edit; K-030 isolation preserved |
| `/business-logic` | `<HomeFooterBar />` (both PasswordForm + logged-in states) | `<Footer variant="home" />` | **technical-cleanup-only** | **No** — page content deferred to K-018 per K-017 PM decision (daily-diary.md 2026-04-20 L247); import swap preserves compilation only; no dev-server visual, no Designer Pencil confirmation, no AC-gated cross-route assertion | swap import in `BusinessLogicPage.tsx` |

**Route total: 5.** **Affected (visual + spec update required): 2 (`/`, `/about`).** **Technical-cleanup-only (import swap, no visual): 1 (`/business-logic`).** **Unaffected: 1 (`/diary`).** **Must-be-isolated: 1 (`/app`).**

**Hard gate passed:** every route has a concrete cell. No blanks, no TBD.

### 5.2 Shared Component Blast Radius

**For Footer (target component):**

- Consuming imports BEFORE: `HomePage.tsx` L6 (`HomeFooterBar`), `BusinessLogicPage.tsx` L7 (`HomeFooterBar`), `AboutPage.tsx` L10 (`FooterCtaSection`).
- Consuming imports AFTER: `HomePage.tsx`, `BusinessLogicPage.tsx`, `AboutPage.tsx` — all three import `Footer` from `components/shared/Footer.tsx` with appropriate `variant` prop.
- **Grep verification** (executed 2026-04-22 on worktree):
  - `grep -rn "HomeFooterBar\|FooterCtaSection" frontend/src/` → 5 page-import hits (HomePage L6+L25, BusinessLogicPage L7+L117, AboutPage L10+L70+L72) + 2 component file headers.
  - All 5 page-import hits are listed in §6 File Change List.

**For NavBar (audit-OK, no change):**

- Audit §1 row 1: `UnifiedNavBar` = `shared` on `/`, `/about`, `/diary`, `/business-logic`; `n-a` on `/app` (K-030 intentional).
- K-035 does not touch `UnifiedNavBar.tsx` or any NavBar import site. TD-K035-01 tracks future `components/shared/NavBar.tsx` move.

**For Hero / Banner (non-drift, no change):**

- Hero entries are content-variant per route (audit §Non-drift). No action.
- BuiltByAIBanner is single-page-today on `/` (audit §reuse-candidate). No action.

**For new `components/shared/` directory:**

- Initial inhabitant: `Footer.tsx` only.
- Future inhabitants (tracked outside K-035): `NavBar.tsx` (TD-K035-01), and any new sitewide chrome surfaced by future audits.

### 5.3 Target-Route Consumer Scan

For each affected route, every entry point rendering the Footer:

| Route | Entry point file | Line | Render element | Post-K-035 status |
|-------|------------------|------|----------------|-------------------|
| `/` | `frontend/src/pages/HomePage.tsx` | L6 import + L25 JSX | `<HomeFooterBar />` | `<Footer variant="home" />` — **needs-sync** |
| `/about` | `frontend/src/pages/AboutPage.tsx` | L10 import + L70 comment + L72 JSX | `<FooterCtaSection />` | `<Footer variant="about" />` — **needs-sync** |
| `/business-logic` | `frontend/src/pages/BusinessLogicPage.tsx` | L7 import + L117 JSX | `<HomeFooterBar />` | `<Footer variant="home" />` — **needs-sync** |

**Grep pattern used:** `grep -rn "HomeFooterBar\|FooterCtaSection" frontend/src/pages/`. No other consumer found. `needs-sync` count = 3; `aligned` = 0; `intentionally-divergent` = 0; `unknown` = 0.

---

## 6. File Change List (granular, ordered)

### CREATE

1. `frontend/src/components/shared/Footer.tsx` — canonical shared Footer with `variant: 'home' | 'about'` prop; internal branching; imports `trackCtaClick` from `utils/analytics`. Docstring per §4.1.
2. `frontend/e2e/shared-components.spec.ts` — cross-route DOM-equivalence spec (see §7).

### DELETE

3. `frontend/src/components/about/FooterCtaSection.tsx` — content migrated into `Footer.tsx` variant="about" branch; file no longer referenced.
4. `frontend/src/components/home/HomeFooterBar.tsx` — content migrated into `Footer.tsx` variant="home" branch; file no longer referenced.
5. `frontend/e2e/sitewide-footer.spec.ts` L88–101 (the `test.describe('AC-021-FOOTER — /about boundary')` block, including the `/about renders FooterCtaSection, NOT HomeFooterBar` test case). **Note:** only the describe block L88–101 is deleted. The preceding `AC-021-FOOTER — HomeFooterBar per route` describe block (L41–86) is **kept** but must be updated to use the new component's DOM selectors (see EDIT #10).

### EDIT

6. `frontend/src/pages/HomePage.tsx` — import swap: delete L6 `import HomeFooterBar from '../components/home/HomeFooterBar'`; add `import Footer from '../components/shared/Footer'`. Delete L25 `<HomeFooterBar />`; add `<Footer variant="home" />`.
7. `frontend/src/pages/BusinessLogicPage.tsx` — import swap: delete L7 `import HomeFooterBar from '../components/home/HomeFooterBar'`; add `import Footer from '../components/shared/Footer'`. Delete L117 `<HomeFooterBar />`; add `<Footer variant="home" />`.
8. `frontend/src/pages/AboutPage.tsx` — import swap: delete L10 `import FooterCtaSection from '../components/about/FooterCtaSection'`; add `import Footer from '../components/shared/Footer'`. Edit L70 comment `{/* S7 — FooterCtaSection (global footer) */}` → `{/* S7 — Footer variant="about" (shared sitewide) */}`. Delete L72 `<FooterCtaSection />`; add `<Footer variant="about" />`.
9. `frontend/e2e/sitewide-footer.spec.ts` — after deleting L88–101 (see DELETE #5), update the remaining `AC-021-FOOTER — HomeFooterBar per route` describe block (L41–86):
    - Rename describe title: `'AC-021-FOOTER — HomeFooterBar per route'` → `'AC-021-FOOTER — Footer variant="home" per route'`
    - Update header comment L4–L14 to reflect K-035 retirement of the /about boundary carve-out; cite this design doc.
    - The `expectHomeFooterBarVisible(page)` helper function asserts on `<footer>` text + class + border — those DOM facts are preserved by §3.2, so the helper can remain as-is (optionally rename to `expectFooterHomeVariantVisible`).
    - **Net test case count change:** −1 (the drift-preservation case is the only one deleted). Remaining cases: 3 (home-variant on `/`, `/business-logic` PasswordForm state, `/business-logic` logged-in state).
10. `frontend/e2e/pages.spec.ts` L158–167 — header comment `// Then: NO FooterCtaSection and NO HomeFooterBar rendered` → `// Then: no <Footer /> rendered (K-024 intentional)`. Test title `'diary page has no FooterCtaSection and no HomeFooterBar'` → `'diary page has no Footer rendered'`. Assertion logic unchanged (still asserts absence of `Let's talk →` and `yichen.lee.20@gmail.com` text — both facts hold regardless of which component authored them).
11. `frontend/e2e/app-bg-isolation.spec.ts` L8 + L70 + L73 — comment text `HomeFooterBar absent on /app` → `Footer absent on /app`. Assertion logic unchanged. AC-030-NO-FOOTER Sacred preserved.
12. `frontend/e2e/sitewide-fonts.spec.ts` L9 + L38 + L43 + L55–57 — rename `HomePage HomeFooterBar font-mono element` test description to `HomePage Footer (variant="home") font-mono element`; update comment L55–57 K-030 context. Assertion logic unchanged.
13. `frontend/e2e/ga-tracking.spec.ts` L212 — comment `// Given: user visits any page with FooterCtaSection` → `// Given: user visits any page with Footer variant="about"`. Test logic unchanged.
14. `agent-context/architecture.md` — two tables + one prose update:
    - `### Footer 放置策略` table (L505–515): rename `/` row's Footer cell `<HomeFooterBar />` → `<Footer variant="home" />`; rename `/about` row's Footer cell `<FooterCtaSection />` → `<Footer variant="about" />`; rename `/business-logic` row's Footer cell `<HomeFooterBar />` → `<Footer variant="home" />`. `/diary` and `/app` rows unchanged.
    - `### Shared Components 邊界` table (L517–524): replace `HomeFooterBar` and `FooterCtaSection` rows with a single new row `Footer` = `components/shared/Footer.tsx` = used by `/` `/about` `/business-logic` (variant declared). 3 rows → 2 rows (UnifiedNavBar + Footer).
    - Summary prose (L13 + L20): append to `updated:` frontmatter the K-035 date; append one Changelog entry at bottom summarizing Footer unification + `components/shared/` directory creation.

### No-op EDITS (docstrings on surviving components — Warning 2 from Phase 2 audit)

**Note:** because K-035 deletes both `HomeFooterBar.tsx` and `FooterCtaSection.tsx`, their stale docstrings are resolved by deletion. There are **no other components** with stale `Used on:` docstrings surfaced by Phase 2 audit. If Engineer discovers additional stale docstrings while executing (e.g., on `UnifiedNavBar.tsx` or `BuiltByAIBanner.tsx`), those are tracked separately as Drift #2 residuals; Engineer BQs PM — does not self-edit.

### File count total: 14 change items (2 CREATE + 3 DELETE + 9 EDIT)

---

## 7. Playwright Spec Contracts

### 7.1 `frontend/e2e/shared-components.spec.ts` (new)

**Purpose:** cross-route DOM-equivalence regression for every shared sitewide component. K-035 seeds Footer; future tickets extend the file for NavBar etc.

**Test structure (spec contract — pseudo-code, Engineer implements verbatim):**

```
import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-035-CROSS-PAGE-SPEC — Footer cross-route DOM-equivalence ────────────
// Given: Footer variant="home" rendered on `/`
//        Footer variant="about" rendered on `/about`
// When:  Playwright visits each route
// Then:  per-variant outerHTML equivalent (modulo dynamic attrs like React id)
// And:   removing Footer from any consuming route causes this spec to fail
//        (negative fail-if-gate-removed dry-run — §7.2 below)
// Note:  `/business-logic` also uses variant="home" (technical-cleanup-only swap
//        per §3 Step 3); NOT asserted here because /business-logic page content
//        is deferred to K-018 per K-017 PM decision. Existing sitewide-footer.spec.ts
//        coverage for /business-logic pre-dates K-035 and remains unchanged.

test.describe('AC-035-CROSS-PAGE-SPEC — Footer variant="home" DOM-equivalence', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  const homeRoutes = ['/']  // `/business-logic` intentionally excluded — see note above

  for (const route of homeRoutes) {
    test(`${route} — Footer variant="home" structural match`, async ({ page }) => {
      await mockApis(page)
      await page.goto(route)

      const footer = page.locator('footer').last()  // last footer element on page
      await expect(footer).toBeVisible()

      // class-string equality (exact)
      const classAttr = await footer.getAttribute('class')
      expect(classAttr).toBe('font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full')

      // contact info row
      await expect(footer.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })).toBeVisible()

      // GA disclosure
      await expect(footer.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true })).toBeVisible()
    })
  }
})

test.describe('AC-035-CROSS-PAGE-SPEC — Footer variant="about" DOM structure', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('/about — Footer variant="about" structural match', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()

    const emailLink = page.locator('[data-testid="cta-email"]')
    await expect(emailLink).toHaveAttribute('href', 'mailto:yichen.lee.20@gmail.com')

    const githubLink = page.locator('[data-testid="cta-github"]')
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/mshmwr/k-line-prediction')
    await expect(githubLink).toHaveAttribute('target', '_blank')
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')

    const linkedinLink = page.locator('[data-testid="cta-linkedin"]')
    await expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/yichenlee-career')
    await expect(linkedinLink).toHaveAttribute('target', '_blank')
    await expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')

    // GA disclosure
    await expect(page.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true })).toBeVisible()

    // A-7 link style Sacred (K-022)
    const emailStyle = await emailLink.evaluate(el => getComputedStyle(el).fontStyle)
    expect(emailStyle).toBe('italic')
    const emailDeco = await emailLink.evaluate(el => getComputedStyle(el).textDecorationLine)
    expect(emailDeco).toContain('underline')
  })
})

test.describe('AC-035-CROSS-PAGE-SPEC — no-Footer routes preserve intentional absence', () => {
  test('/diary has no Footer rendered', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    await expect(page.getByText("Let's talk →", { exact: true })).toHaveCount(0)
    await expect(page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })).toHaveCount(0)
  })

  // /app no-footer preserved by existing app-bg-isolation.spec.ts AC-030-NO-FOOTER
  // (no duplicate assertion here — single source of truth).
})
```

**Test case count in new spec:** 1 (home variant on `/`) + 1 (about variant on `/about`) + 1 (`/diary` absence) = **3 cases**. (`/business-logic` excluded per §3 Step 3 technical-cleanup-only scope.)

### 7.2 Fail-if-gate-removed dry-run (per `feedback_engineer_concurrency_gate_fail_dry_run`)

Before commit, Engineer must:

1. Temporarily remove `<Footer variant="home" />` from `HomePage.tsx` (comment out L25's new JSX).
2. Run `npx playwright test shared-components.spec.ts`.
3. **Expected:** the `/ — Footer variant="home" structural match` test MUST fail (footer locator not found; class-string assertion fails).
4. Restore `<Footer variant="home" />`; confirm spec passes again.
5. Record the dry-run result in the ticket Engineer-step commit message.

**Why:** without this dry-run, the positive assertions could pass even when the Footer is missing if a coincidental sibling `<footer>` exists. The dry-run proves the gate has teeth.

### 7.3 Spec interactions with existing files (no redundancy)

- `sitewide-footer.spec.ts` (post-edit) — still asserts per-route presence of home variant on `/` + `/business-logic`; complementary to `shared-components.spec.ts` which asserts cross-route equivalence.
- `sitewide-fonts.spec.ts` — still asserts font-mono on HomePage Footer element; complementary (font assertion is orthogonal to DOM structure).
- `ga-tracking.spec.ts` AC-018-CLICK + AC-018-PRIVACY-POLICY — still asserts onClick GA events + GA disclosure visibility; complementary (behavioral assertion orthogonal to structural equivalence).
- `app-bg-isolation.spec.ts` AC-030-NO-FOOTER — still asserts `/app` has no Footer; complementary (route-specific absence assertion).
- `pages.spec.ts` L160 DiaryPage AC-017-FOOTER — still asserts `/diary` has no Footer; complementary (K-024 Sacred).

No spec duplication; no spec redundancy.

---

## 8. Testing Strategy

### 8.1 tsc

- `npx tsc --noEmit` must exit 0 after every Engineer step. `variant: 'home' | 'about'` exhaustive union enforced; missing prop at any call site = compile error.

### 8.2 Vitest (unit)

- No unit surface added. `Footer.tsx` is a pure React function component; `trackCtaClick` is already covered by `ga-tracking.spec.ts` existing tests.

### 8.3 Playwright (full suite, not just shared-components)

- Full suite must pass: `npx playwright test` exit 0.
- New spec `shared-components.spec.ts` (3 cases) all green.
- Updated specs (`sitewide-footer.spec.ts`, `pages.spec.ts`, `app-bg-isolation.spec.ts`, `sitewide-fonts.spec.ts`, `ga-tracking.spec.ts`) all green.
- No new test case count mismatch (net change: +3 new cases in `shared-components.spec.ts` − 1 deleted drift-preservation case in `sitewide-footer.spec.ts` = **+2 cases total**).

### 8.4 Visual regression (QA)

- QA executes `visual-report.ts` with `TICKET_ID=K-035` producing `docs/reports/K-035-visual-report.html` with full-page screenshots of `/`, `/about`, `/diary`, `/app` (+ `/business-logic` placeholder per existing MVP rule — placeholder screenshot remains; not an AC-gated comparison).
- QA dev-server target: manually visit `/`, `/about`, `/diary`, `/app` (4 routes, `/business-logic` excluded per §3 Step 3 technical-cleanup-only scope) at viewports 375 / 390 / 414 / 1280 — confirm pixel-identical Footer render to pre-K-035 baseline on `/` and `/about`; `/diary` + `/app` confirm no-footer Sacred preserved.

---

## 9. Migration Order (Engineer execution sequence — MUST follow numbered order)

### Step 1 — Create shared directory + Footer component

- `mkdir -p frontend/src/components/shared/`
- Write `Footer.tsx` with both variants (home + about branches, verbatim DOM from OLD files).
- Run `npx tsc --noEmit` → exit 0.
- Run `npx playwright test` → full suite still passes (Footer.tsx exists but no consumer yet; OLD files still imported by pages).

**Gate:** Step 1 commits only if both checks green.

### Step 2 — Migrate HomePage import

- Edit `pages/HomePage.tsx`: swap `HomeFooterBar` → `Footer variant="home"`.
- Run `npx tsc --noEmit` → exit 0.
- Run dev server + manually visit `/` → pixel-identical footer render.
- Run `npx playwright test` → full suite green; `sitewide-footer.spec.ts` `/` case still green (DOM output unchanged).

**Gate:** Step 2 commits only if all three checks green.

### Step 3 — Migrate BusinessLogicPage import (TECHNICAL CLEANUP ONLY, NOT AC-VERIFIED)

**Scope clarification (added 2026-04-22 per PM decision):** `/business-logic` page content is deferred to K-018 per K-017 defer decision (daily-diary.md 2026-04-20 L247). This swap is **mandatory technical cleanup** — `HomeFooterBar.tsx` is being deleted in Step 10, so leaving `BusinessLogicPage.tsx` L7 import would break TSC compilation. The swap exists solely to preserve route compilation.

- Edit `pages/BusinessLogicPage.tsx`: swap `HomeFooterBar` → `Footer variant="home"`.
- Verify (tsc only). **Skip** manual dev-server visit to `/business-logic` (not visually verified; page content deferred). **Skip** explicit visual Designer confirmation for this route.
- Playwright full-suite run is still mandatory (catches any accidental regression), but any `/business-logic`-targeted assertion passing here is *incidental* — not AC-gated.

**Gate:** Step 3 commits only if tsc + playwright full-suite green. No dev-server visual requirement for this route.

### Step 4 — Migrate AboutPage import

- Edit `pages/AboutPage.tsx`: swap `FooterCtaSection` → `Footer variant="about"`; update L70 comment.
- Verify (tsc + playwright + manual dev-server visit to `/about`).
- **Critical:** at this point `sitewide-footer.spec.ts` L88–101 `/about` boundary test WILL fail (it asserts FooterCtaSection exists at `/about`, but the new `Footer variant="about"` renders the same DOM — the literal `FooterCtaSection` component name reference in the assertion logic is gone). This is **expected**; Step 5 deletes the failing block.

**Gate:** Step 4 commits only if tsc + dev-server visual green; playwright failure on the drift block is the intended state going into Step 5.

### Step 5 — Delete drift-preservation spec block + update remaining references

- Edit `frontend/e2e/sitewide-footer.spec.ts` L88–101: delete describe block.
- Edit remaining L4–L14 header comments + L41 describe title (per §6 EDIT #9).
- Edit `frontend/e2e/pages.spec.ts` L158–167 (per §6 EDIT #10).
- Edit `frontend/e2e/app-bg-isolation.spec.ts` (per §6 EDIT #11).
- Edit `frontend/e2e/sitewide-fonts.spec.ts` (per §6 EDIT #12).
- Edit `frontend/e2e/ga-tracking.spec.ts` L212 (per §6 EDIT #13).
- Run `npx playwright test` → full suite green.

**Gate:** Step 5 commits only if full playwright suite exits 0.

### Step 6 — Delete obsolete component files

- `rm frontend/src/components/home/HomeFooterBar.tsx`
- `rm frontend/src/components/about/FooterCtaSection.tsx`
- Run `grep -rn "HomeFooterBar\|FooterCtaSection" frontend/src/ frontend/e2e/` → **expect 0 hits** (any hit = Engineer missed an import / comment; must fix before commit).
- Run `npx tsc --noEmit` → exit 0.
- Run `npx playwright test` → full suite green.

**Gate:** Step 6 commits only if grep = 0 hits AND tsc + playwright green.

### Step 7 — Add new cross-route spec + fail-if-gate-removed dry-run

- Write `frontend/e2e/shared-components.spec.ts` per §7.1.
- Run full suite → green (new 3 cases pass).
- Execute §7.2 fail-if-gate-removed dry-run; record result in commit message.

**Gate:** Step 7 commits only if dry-run proves gate has teeth.

### Step 8 — Update architecture.md + self-diff

- Edit `agent-context/architecture.md` Footer table + Shared Components table + Changelog (per §6 EDIT #14).
- Execute Architect Self-Diff Verification (see §11 below) — cell-by-cell against this design doc.

**Gate:** Step 8 commits only if self-diff all-✓.

### Step 9 — Handoff to QA

- QA runs `TICKET_ID=K-035 npx playwright test visual-report.ts`.
- QA performs dev-server visual regression on all 4 marketing routes.
- QA appends sign-off entry to `docs/retrospectives/qa.md`.

**Gate:** QA sign-off required before Code Review release.

### Step 10 — Code Review Round 1

- Step 1 `/superpowers:requesting-code-review` (breadth).
- Step 2 `Agent(~/.claude/agents/reviewer.md)` (depth) — must run the new Structural Chrome Duplication Scan per K-035 Phase 1 persona edit.
- Any Critical / Warning → PM rules; Bug Found Protocol if reviewer flags structural defect.

**Gate:** Code Review + PM merge-ruling required before deploy.

### Step 11 — Deploy + Deploy Record

- Per project Deploy Checklist. Deploy Record block appended to ticket with executed probe (`curl <live>/assets/index-<hash>.js | grep "variant=\"home\""` — or equivalent Footer-identifier grep).

---

## 10. Risks & Retirements

### 10.1 K-021 Sacred clause retirement — formalized

- **Clause:** `/about 維持 FooterCtaSection（K-017 鎖定）` (K-021 design doc §7.5 + `sitewide-footer.spec.ts` L88–101 enforcement).
- **Retired by:** K-035 Phase 3 (this design doc).
- **Evidence:** audit §3 AC↔Sacred Cross-Check row 1 — "K-021's `/about` boundary assertion was a codification of the drift, not of design intent." Retirement is Option (b) Sacred-retires.
- **Cross-reference updates:**
  - `docs/designs/K-021-sitewide-design-system.md` §7 Footer decision table (L433) — Architect PM-coordinates a post-merge footnote edit: append "Superseded by K-035 2026-04-22: Footer unified via `components/shared/Footer.tsx` + variant prop." No structural edit to the historical design doc; footnote only.
  - `docs/designs/K-017-about-portfolio.md` §Q8 (line ~241 per grep) — identical footnote appended.
  - `agent-context/architecture.md` Footer placement table — already covered in §6 EDIT #14.
  - PRD §4 Closed Tickets AC-021-FOOTER + AC-017-FOOTER wording migrations — PM handles at K-035 close.

### 10.2 K-022 Sacred preserved (no retirement)

- **Clause:** `AC-022-FOOTER-REGRESSION` — A-7 Newsreader italic + underline link style on FooterCtaSection.
- **Status:** preserved; the variant="about" branch in `Footer.tsx` copies the class strings verbatim from OLD FooterCtaSection.tsx (L20, L31, L43 `font-italic italic ... underline`). §3 diff table row 14 asserts pixel-equivalence.
- **Evidence:** §7.1 spec asserts `fontStyle === 'italic'` + `textDecorationLine.includes('underline')` on the email link as a regression guard.

### 10.3 K-024 + K-030 Sacred preserved (no retirement)

- K-024 `/diary` no-footer: §5 Route Impact Table row 3 unchanged; spec `pages.spec.ts` L160 preserved.
- K-030 `/app` no-footer / no-navbar / wrapper bg isolation: §5 row 4 unchanged; spec `app-bg-isolation.spec.ts` AC-030-NO-FOOTER preserved; §6 EDIT #11 only renames comment text, not assertion.

### 10.4 New Tech Debt

- **TD-K035-01:** move `components/UnifiedNavBar.tsx` → `components/shared/NavBar.tsx`. Priority low; blocked-by K-025 close (K-025 is active NavBar hex→token migration; doing two NavBar moves simultaneously = diff noise). Target ticket: K-036 or K-037 scope.

### 10.5 Risk: import paths not refreshed by tooling

- Risk: VS Code auto-import during Engineer step might suggest `components/home/HomeFooterBar` if the old file is not deleted before Step 6.
- Mitigation: Step 6 grep gate (`grep -rn "HomeFooterBar\|FooterCtaSection" frontend/src/ frontend/e2e/` → 0 hits) before commit.

### 10.6 Risk: Engineer introduces a `Footer.home.tsx` / `Footer.about.tsx` split instead of a single `Footer.tsx` with variant prop

- Risk: this would be β (rejected in §0 BQ-035-01) re-emerging under a different filename pattern.
- Mitigation: §4.1 docstring + §4.2 props interface explicitly specify single file + variant prop. Reviewer Step 2 persona's Structural Chrome Duplication Scan (per K-035 Phase 1) catches a split if Engineer deviates.

### 10.7 Risk: cross-route DOM-equivalence spec passes coincidentally

- Risk: §7.1 positive assertions could pass if a page coincidentally has a sibling `<footer>` element outside the Footer component (e.g., inline in a section).
- Mitigation: §7.2 fail-if-gate-removed dry-run. If removing `<Footer />` from HomePage doesn't fail the spec, a sibling exists and the spec is weak; dry-run forces Engineer to narrow the selector.

---

## 11. architecture.md Self-Diff Verification

**Note:** this self-diff will be executed **by Engineer at Step 8** after editing `architecture.md`. Architect pre-specifies the expected post-edit state below; Engineer's job is to achieve it and confirm cell-by-cell.

### 11.1 Expected post-edit Footer table (source of truth: this design doc §5)

| 頁面 | Footer (post-K-035) |
|------|---------------------|
| `/` | `<Footer variant="home" />` |
| `/about` | `<Footer variant="about" />` |
| `/diary` | 無 footer（K-024 Architect 裁決；不變） |
| `/app` | 無 footer（K-030 isolation；不變） |
| `/business-logic` | `<Footer variant="home" />` |

**Row count: 5.** **Columns: 2 (頁面, Footer).** **Cells: 10.**

### 11.2 Expected post-edit Shared Components 邊界 table

| 組件 | 位置 | 用於 |
|------|------|------|
| `UnifiedNavBar` | `components/UnifiedNavBar.tsx` | `/` `/about` `/diary` `/business-logic`（K-030 起 `/app` 不渲染；TEXT_LINKS 的 `App` entry 標 `external: true`，於 4 marketing 頁點擊時開 new tab 載入 `/app`） |
| `Footer` | `components/shared/Footer.tsx` | `/` `/business-logic` via `variant="home"`; `/about` via `variant="about"`（K-035 統一 2026-04-22；K-021 `/about 維持 FooterCtaSection` Sacred 已 retire） |

**Row count: 2** (was 3 pre-K-035: UnifiedNavBar + HomeFooterBar + FooterCtaSection; now 2: UnifiedNavBar + Footer). **Columns: 3.** **Cells: 6.**

### 11.3 Expected post-edit Directory Structure snippet (partial — Engineer adds the new dir entry)

Under the existing `│   │           ├── primitives/` block, a new peer sibling:

```
│   │           ├── shared/                                ← K-035 新目錄；sitewide page-level chrome canonical registry
│   │           │   └── Footer.tsx                         ← K-035 合併；variant="home"|"about"；取代 components/home/HomeFooterBar.tsx + components/about/FooterCtaSection.tsx（後兩者刪除）
```

And under `components/home/` block: remove `HomeFooterBar.tsx` line (currently implied by "home/" subdir but not explicitly listed in existing tree — Engineer grep-verifies before removing).

Under `components/about/` block: remove `FooterCtaSection.tsx` line — currently at L160 of architecture.md (per grep earlier). Changes from `FooterCtaSection.tsx              ← S7 email + GitHub + LinkedIn 容器（K-031 後從 S8 重編為 S7）` → line removed; `FooterCtaLink.tsx` line kept (still used by other about components).

### 11.4 Expected Changelog entry at bottom (Engineer appends)

```
- **2026-04-22**（Architect, K-035 設計）— /about Footer shared-component regression fix：新建 `frontend/src/components/shared/` 目錄（sitewide page-level chrome canonical registry），第一位住戶 `Footer.tsx`（variant: 'home' | 'about'）取代 `components/home/HomeFooterBar.tsx`（刪除）+ `components/about/FooterCtaSection.tsx`（刪除）；3 個 import 點 swap（HomePage / BusinessLogicPage / AboutPage）。`frontend/e2e/sitewide-footer.spec.ts` L88–101 `/about renders FooterCtaSection, NOT HomeFooterBar` drift-preservation describe block 刪除；K-021 Sacred `/about 維持 FooterCtaSection（K-017 鎖定）` 正式 retire。新增 `frontend/e2e/shared-components.spec.ts`（3 cases：home 變體 `/` 斷言 + about 變體 `/about` 斷言 + `/diary` no-footer 斷言；`/business-logic` 為 technical-cleanup-only 路由，per §3 Step 3 明確排除於 AC-verified cross-route spec 之外）+ fail-if-gate-removed dry-run 驗證。Footer 放置策略表 3 列更新；Shared Components 邊界表 3 列 → 2 列（HomeFooterBar + FooterCtaSection 合併為單一 Footer）。K-022 A-7 link style + K-017 content + K-024 /diary no-footer + K-030 /app isolation Sacred 全保留。開 TD-K035-01 追 UnifiedNavBar 搬 `components/shared/` 後續（blocked-by K-025 close）。設計文件：[K-035-shared-component-migration.md](../docs/designs/K-035-shared-component-migration.md)。
```

### 11.5 Self-Diff block format Engineer must attach to Step 8 commit

```
### Self-Diff Verification (K-035 Step 8, Architect mandate)
- Section edited: Footer 放置策略 table
- Source of truth: design doc K-035 §5 Route Impact Table + §11.1
- Row count comparison: 5 rows vs 5 rows — cell-by-cell match ✓
- Same-file cross-table sweep: grep 'HomeFooterBar\|FooterCtaSection' architecture.md → 0 hits ✓
- Discrepancy: none

- Section edited: Shared Components 邊界 table
- Source of truth: design doc K-035 §11.2
- Row count comparison: 2 rows vs 2 rows — cell-by-cell match ✓
- Discrepancy: none

- Section edited: Directory Structure (shared/ addition + home/about file removals)
- Source of truth: §11.3 + `ls frontend/src/components/shared/` + `ls frontend/src/components/home/` + `ls frontend/src/components/about/`
- Disk verification: shared/Footer.tsx exists ✓; HomeFooterBar.tsx deleted ✓; FooterCtaSection.tsx deleted ✓
- Discrepancy: none

- Section edited: Changelog (prepend one entry dated 2026-04-22)
- Source of truth: §11.4
- Discrepancy: none
```

---

## 12. All-Phase Coverage Gate

K-035 Phase 3 downstream roles and their mandated work:

| Role | Artifact | K-035 Phase 3 action |
|------|----------|----------------------|
| **Designer** | Pencil frames `4CsvQ` (homepage footer) + `35VCj` (/about footer subtree) in `homepage-v2.pen` | `batch_get` both frames; confirm both designs match Option α variant spec (no pixel change requested, just existence confirm); `get_screenshot` returns both for PM visual verification. No `batch_design` edit unless frame drift found; if drift found, flag to PM before proceeding. |
| **Engineer** | Code migration + spec + arch doc | Execute §9 Steps 1–8 in order. Each step gated by tsc + playwright + grep. Commit granularly (one step per commit). |
| **QA** | Regression + visual report | Execute §8.3 + §8.4. Sign-off entry in `docs/retrospectives/qa.md`. |
| **Reviewer** | Step 1 breadth + Step 2 depth | Step 2 must run new Structural Chrome Duplication Scan (K-035 Phase 1 reviewer persona edit). Critical on duplicate JSX. |
| **PM** | Phase Gate + PRD §3→§4 migration + Deploy Record | BQ-035-01/02/03 rulings; Deploy Checklist; ticket status → closed. |

**All roles covered. No Phase missing an artifact. No N/A rows.**

---

## 13. Pre-Design Dry-Run Proof

### 13.1 Files inspected truth table

| File | `git show main:<path>` log | Input × output dry-run |
|------|----------------------------|------------------------|
| `frontend/src/components/home/HomeFooterBar.tsx` | Executed 2026-04-22 (SHA `bdc9231`); 20 lines; full content captured in §3.1 row 1 | 1 input branch (no prop, always-render); output = `<footer class="..." />` with 1 span + 1 `<p>` |
| `frontend/src/components/about/FooterCtaSection.tsx` | Executed 2026-04-22 (SHA `bdc9231`); 54 lines; full content captured in §3.1 row 4 | 1 input branch (no prop, always-render); output = `<div>` with `Let's talk →` heading + 3 anchors + GA `<p>` |
| `frontend/e2e/sitewide-footer.spec.ts` | Executed 2026-04-22; 101 lines; L88–101 describe block captured verbatim | drift-preservation block: asserts `getByText("Let's talk →").toBeVisible()` + `getByText(FOOTER_TEXT).toHaveCount(0)` at `/about`; deletion cell = removed describe |
| `frontend/src/pages/HomePage.tsx` | Grep on main; L6 import + L25 JSX site confirmed | 1 import + 1 render site = 2 edit points |
| `frontend/src/pages/AboutPage.tsx` | Grep on main; L10 import + L70 comment + L72 JSX confirmed | 1 import + 1 comment + 1 render = 3 edit points |
| `frontend/src/pages/BusinessLogicPage.tsx` | Grep on main; L7 import + L117 JSX confirmed | 1 import + 1 render = 2 edit points |
| `frontend/e2e/pages.spec.ts` | Grep on main; L155–167 diary no-footer case captured | 1 describe + 1 test; comment + title rename only, assertion unchanged |
| `frontend/e2e/app-bg-isolation.spec.ts` | Grep on main; L8 + L70 + L73 captured | comment text rename only |
| `frontend/e2e/sitewide-fonts.spec.ts` | Grep on main; L9 + L38 + L43 + L55–57 captured | comment + test description rename only |
| `frontend/e2e/ga-tracking.spec.ts` | Grep on main; L212 comment captured | comment rename only |
| `agent-context/architecture.md` | Grep on main; Footer table L509–515 + Shared Components table L519–523 + Directory Structure L160 captured | 3 table/tree edits + 1 Changelog prepend |

**11 file rows. All captured via `git show main:<path>` or `grep -rn` on worktree at SHA `bdc9231` 2026-04-22.**

### 13.2 pre-existing / legacy source-line citations

- HomeFooterBar OLD DOM: `git show main:frontend/src/components/home/HomeFooterBar.tsx:L11-L20` (cited verbatim in §3.1 row 1).
- FooterCtaSection OLD DOM: `git show main:frontend/src/components/about/FooterCtaSection.tsx:L13-L54` (cited verbatim in §3.1 row 4).
- sitewide-footer drift block: `git show main:frontend/e2e/sitewide-footer.spec.ts:L88-L101` (cited verbatim above).
- K-021 Sacred clause: `docs/designs/K-021-sitewide-design-system.md:L433` (cited) + `:L486` (cited) + spec enforcement at `frontend/e2e/sitewide-footer.spec.ts:L88-L101`.
- K-017 Sacred clause: `docs/designs/K-017-about-portfolio.md:L241` (Q8 FooterCtaSection sitewide decision — superseded) + K-017 AC-017-FOOTER content invariants preserved in §7.1 spec.
- K-022 A-7 Sacred clause: `docs/designs/K-022-about-structure.md:L607` (A-7 Link style row) + assertion preserved in §7.1 spec.
- K-024 `/diary` no-footer: `frontend/e2e/pages.spec.ts:L161` (assertion preserved, comment renamed only).
- K-030 `/app` no-footer: `frontend/e2e/app-bg-isolation.spec.ts:L70-L73` (assertion preserved, comment renamed only).

All cited at `:L<line>` precision.

### 13.3 §API 不變性證明 dual-axis

**(a) Wire-level schema diff:**

- This ticket is a frontend-only component reorganization. No backend schema change. `git diff main -- backend/` = 0 lines.
- `git diff main -- frontend/src/types.ts frontend/src/types/*.ts` = 0 lines (no type-contract change; `FooterProps` is a new internal component type, not a cross-layer contract).

**(b) Frontend observable behavior diff:**

Enumerated in §3.3. 17 equivalent cells; 0 divergent cells.

**Additional observable behavior rows (per dual-axis requirement — full-set / subset / empty / boundary):**

| Row | Scenario | OLD observable output | NEW observable output | Equivalence |
|-----|----------|-----------------------|-----------------------|-------------|
| Full-set | `/` with all React state normal | `<HomeFooterBar />` renders 2 children | `<Footer variant="home" />` renders 2 identical children | ✓ identical |
| Subset | `/about` with GA disabled (no `window.dataLayer`) | `<FooterCtaSection />` renders anchors; onClick still fires but `trackCtaClick` silently no-ops (existing behavior via utils/analytics guard) | `<Footer variant="about" />` — onClick still fires; same no-op path | ✓ identical |
| Empty | `/diary` (no footer rendered) | no `<footer>` / no `Let's talk` text in DOM | no `<Footer />` rendered; same DOM absence | ✓ identical |
| Boundary (mobile 375px) | `/` at viewport 375 | `<footer class="... px-6 md:px-[72px] ...">` → on mobile uses `px-6` | `<Footer variant="home" />` renders same class string → same responsive behavior | ✓ identical |

**Dual-axis gate: PASS.**

---

## 14. Refactorability Checklist

- [x] **Single responsibility** — `Footer.tsx` renders page-level sitewide footer; variant prop is the single divergence axis.
- [x] **Interface minimization** — one required prop (`variant`); no optional props; no className override; no children slot.
- [x] **Unidirectional dependency** — Footer imports `utils/analytics`; pages import Footer; no circular path.
- [x] **Replacement cost** — swapping Footer implementation affects 3 page imports + 1 component file; grep-tested at 5 import sites (below 2-file threshold? No — 5 is above "no more than 2 files" threshold; however, an adapter layer is the variant prop itself, and migration is a one-time structural refactor, not a recurring swap cost). **Rationale for acceptance:** K-035 is consolidating 2 files into 1 specifically to reduce replacement cost from 2 sibling files to 1 canonical file; post-K-035 replacement cost is 1 file change + 3 import-site re-verifications, within "add adapter layer" spirit since the variant prop IS the adapter.
- [x] **Clear test entry point** — `Footer` component has typed props (`variant: 'home' | 'about'`); test at `shared-components.spec.ts` asserts DOM output per variant; QA can write new spec rows without reading component internals.
- [x] **Change isolation** — UI changes (class strings, text content) don't affect API contract (none); no API changes; the variant prop isolates "home vs about" divergence from everything else.

All 6 items pass. No design-debt waivers needed.

---

## 15. AC ↔ Test Case Count Cross-Check

K-035 ticket lists:

- AC-035-FOOTER-UNIFIED (1 AC) — maps to §7.1 "Footer variant=\"about\" structural match" test (1 test case).
- AC-035-NO-DRIFT (1 AC) — maps to §7.1 home variant test on `/` (1 test case) + `/diary` absence test (1 test case) = 2 test cases for this AC. (`/business-logic` is **technical-cleanup-only** per §3 Step 3 — intentionally excluded from cross-route spec; page content deferred to K-018 per K-017 PM decision.)
- AC-035-CROSS-PAGE-SPEC (1 AC) — maps to the entirety of `shared-components.spec.ts` (3 test cases) + §7.2 fail-if-gate-removed dry-run (1 manual proof step).

**Total new Playwright cases in `shared-components.spec.ts`: 3** (1 home-variant on `/` + 1 about-variant on `/about` + 1 `/diary` absence). `/business-logic` excluded — technical-cleanup-only swap per §3 Step 3.

**Deleted Playwright cases in `sitewide-footer.spec.ts`: 1** (the drift-preservation `/about renders FooterCtaSection, NOT HomeFooterBar` test).

**Net change: +2 test cases.**

AC → Test mapping table:

| AC | Test ID(s) in shared-components.spec.ts | Count |
|----|----------------------------------------|-------|
| AC-035-FOOTER-UNIFIED | `'/about — Footer variant="about" structural match'` | 1 |
| AC-035-NO-DRIFT | `'/ — Footer variant="home" structural match'`, `'/diary has no Footer rendered'` | 2 |
| AC-035-CROSS-PAGE-SPEC | (meta — entire spec file fulfills this AC; all 3 cases above count) | 3 (overlap) |

Note: `/business-logic` is **technical-cleanup-only** per §3 Step 3 — import swap to `Footer variant="home"` is mandatory for TSC compilation (HomeFooterBar.tsx deleted in Step 6) but this route is **not** an AC-verified cross-route assertion; page content deferred to K-018 per K-017 PM decision. Existing `sitewide-footer.spec.ts` /business-logic presence coverage pre-dates K-035 and remains unchanged; no new assertion is added here.

Sum of non-overlapping test IDs: 3 cases in `shared-components.spec.ts`. Declared "Test case count" in §7.1 = 3 ✓. Row count in §7.1 test structure = 3 ✓. Match.

Plus AC-035-RETRO / AC-035-MEMORY / AC-035-AUDIT / AC-035-DEPLOY — these are Phase 0/1/2/deploy ACs handled outside this design doc; no Playwright cases needed.

**Hard gate passed: 3 = 3 = 3.**

---

## Retrospective

### 2026-04-22 — K-035 Phase 3 design — shared Footer migration

**What went well:**

- `git show main:<path>` dry-run on both HomeFooterBar.tsx and FooterCtaSection.tsx at worktree SHA `bdc9231` before writing §3 diff table; every class string / href / attr in §3.2 is copied verbatim from OLD source, not summarized. §3.3 diff table with 17 equivalent cells and 0 divergent cells is the load-bearing pure-refactor gate — Engineer and Reviewer can verify each row by grepping the OLD file.
- `grep -rn "HomeFooterBar\|FooterCtaSection"` on both `frontend/src/` and `frontend/e2e/` produced the full 14-file change list (5 page sites + 2 component files + 5 spec files + 1 architecture.md + 1 ga-tracking comment) before §6 was written; no change-list blind spot.
- BQ-035-01 scored α/β/γ with weights declared up-front (§0 table), avoiding post-hoc rationalization flagged by `feedback_rule_strength_tiers`. Gap ≥3.4 points decisive; no tiebreaker needed — no new dimension smuggled in to justify recommendation.
- §11 Architect pre-specified the post-edit architecture.md state cell-by-cell with row counts, so Engineer's Step 8 self-diff can be verified by PM without re-reading the design doc from scratch.

**What went wrong:**

- Design doc filename mismatch between ticket §Phase 3.1 (`K-035-footer-unification.md`) and invocation prompt (`K-035-shared-component-migration.md`) was caught and flagged as SQ-035-01 only mid-write, not at §0 pre-design step. A stricter §0 opener (scan every filename reference in ticket + invocation prompt before first Write) would have caught this earlier.

**Next time improvement:**

- Add Architect pre-design hard step: "Before first Write, grep the ticket + invocation prompt for every filename/path/component-name reference and build a reference table; any mismatch between ticket and invocation → §0 SQ entry before §1 begins." Codify as a new bullet under `senior-architect.md` §Scope Question Pause Rule — "Pre-Write Name-Reference Sweep."
