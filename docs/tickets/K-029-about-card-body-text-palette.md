---
id: K-029
title: /about Architecture + Ticket Anatomy cards — migrate dark-theme gray text to paper palette
status: closed
type: fix
priority: high
created: 2026-04-21
closed: 2026-04-22
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-029
---

## Background

K-022 A-12 (shared primitives migration to paper palette) scope only covered five primitive/common components (CardShell / SectionContainer / SectionHeader / SectionLabel / CtaButton). However, two leaf-level components inside `/about` still retain dark-theme gray classes, rendering as low-contrast gray text on the paper background with poor readability:

1. **`components/about/ArchPillarBlock.tsx`** (S6 Project Architecture section)
   - `text-gray-300` (body div)
   - `text-gray-400` (testing pyramid list item)
   - `text-gray-300` (testing pyramid layer label span)

2. **`components/about/TicketAnatomyCard.tsx`** (S5 Anatomy of a Ticket section)
   - `text-gray-400` (body space-y-2 div)
   - `text-gray-500` (Outcome / Learning label spans)
   - `text-purple-400` (ticket ID badge span — dark-theme accent, insufficient contrast on paper bg)

This is K-022 A-12's incomplete migration leftover, not a regression introduced after K-022.

## Root cause

K-022 A-12's scope list only enumerated shared primitives and did not scan all leaf components under `/about`. The two affected components (`ArchPillarBlock.tsx` / `TicketAnatomyCard.tsx`) were written with dark-theme during K-017 and not covered by K-022.

## Clarification on the Footer question

This ticket **does not handle** footer — the architecture doc "Footer placement strategy" table explicitly specifies that `/about` uses `<FooterCtaSection />` (containing "Let's talk →" + email + GitHub + LinkedIn + GA notice) rather than `HomeFooterBar`. This is intentional design, confirmed by K-021 / K-022 AC-022-FOOTER-REGRESSION. `FooterCtaSection` is `/about`'s about-specific CTA, with GA tracking and Newsreader italic link styling; the functional difference from `HomeFooterBar` is design-semantic, not a bug.

## Scope

Modify only the following two files:

- `frontend/src/components/about/ArchPillarBlock.tsx`
- `frontend/src/components/about/TicketAnatomyCard.tsx`

Migration principle: target K-021 paper palette tokens (`text-ink` / `text-muted` / `text-charcoal`); reference similar components (`PillarCard.tsx` uses `text-muted` for body text). Ticket ID badge changes to `text-charcoal` or `text-ink` (semantic color to be confirmed by Architect).

**Not included:**
- CardShell / SectionContainer / SectionLabel etc. already handled in K-022
- PillarCard.tsx (already uses `text-muted`, no problem)
- RoleCard.tsx / MetricCard.tsx (depending on Architect scan results; if any gray remains, fix in this same ticket)
- FooterCtaSection (correct design semantics, no change)
- HomeFooterBar (not in /about scope)

## Architect Pre-check decisions (PM ruling 2026-04-22)

PM, based on architecture.md §Design System Tokens (L442-L463) + similar-component reference (`PillarCard.tsx` / `RoleCard.tsx` / `MetricCard.tsx`) + WCAG AA contrast computation, directly rules on three BQs:

### C-body: ArchPillarBlock / TicketAnatomyCard primary body text token
**Decision: `text-muted` (`#6B5F4E`)**
- **Rationale:**
  - Aligns semantically with `PillarCard.tsx` L29 `<div className="text-muted text-sm leading-relaxed mb-4 flex-1">{body}</div>` — PillarCard itself is the K-022 A-12 paper palette standard; copy directly.
  - WCAG AA contrast `#F4EFE5` vs `#6B5F4E` ≈ 4.84:1; body text (12px `text-xs` / 14px `text-sm`) passes the AA 4.5:1 threshold.
  - `text-muted` is defined in architecture.md L453 as "Footer / meta / NavBar non-active"; extending to card body prose is a reasonable expansion (PillarCard already established the precedent).

### C-pyramid: ArchPillarBlock testing pyramid layer span (`Unit` / `Integration` / `E2E`)
**Decision: `text-ink` (`#1A1814`)**
- **Rationale:**
  - The original design used `text-gray-300` paired with `font-mono`, sitting above sibling `text-gray-400` `<li>` — the intent was for the layer label to stand out more than the detail text; in the paper environment, the corresponding semantic is "raise contrast strength".
  - `text-ink` AAA (≈ 13.5:1) is one step above the body's `text-muted`, preserving the original "label more prominent than detail" visual hierarchy.
  - Avoid `text-charcoal` — reserve charcoal for badge / CardShell LAYER header and other identity roles (see C-badge below).

### C-badge: TicketAnatomyCard ticket ID badge (`K-002` / `K-008` / `K-009`)
**Decision: `text-charcoal` (`#2A2520`)**
- **Rationale:**
  - The badge in the original design is `text-purple-400 font-bold` with the semantic of "identifier / metadata flag" rather than body prose — architecture.md L452's `charcoal` token definition is "secondary text / auxiliary element", semantically aligned.
  - AAA contrast (≈ 11.9:1), preserving the original "outweighing body in visual weight" intent (font-bold + higher contrast).
  - Not `text-ink` because ink is primary text (card title `h3` already uses `text-ink`); avoids confusion with title at same level.
  - Not `text-muted` because muted is for body / meta; not strong enough to replace the original "accent pop" role.

### C-scope: scan of `components/about/` for remaining dark-theme leftovers
**Conclusion: no scope expansion needed.**
- grep `text-gray-* / text-purple-* / text-blue-* / text-slate-* / text-zinc-*` on `frontend/src/components/about/` → only `ArchPillarBlock.tsx` (3 sites) + `TicketAnatomyCard.tsx` (4 sites) match.
- RoleCard / MetricCard / PillarCard / FooterCtaSection / PageHeaderSection / SectionHeader / SectionContainer / DossierHeader / RedactionBar are all clean (all `text-ink` / `text-muted`).
- Ticket §scope does not expand; K-022 A-12 + K-029 fully cover the /about paper palette migration.

## QA Early Consultation (completed 2026-04-22)

Recorded in `docs/retrospectives/qa.md 2026-04-22 K-029`. **PM subagent session has no Agent tool, so per persona §PM session capability pre-flight, simulated consultation is performed with explicit disclosure**; QA sign-off is re-verified by the formal qa subagent.

**Challenges raised — 7 total, dispositions:**
- C1 AC wording "readably dark / or darker" subjective → **AC patched**: change to RGB allow-list (text-ink / text-charcoal / text-muted) + disallow-list (gray-300/400/500 / purple-400).
- C2 Ticket ID badge semantic color → **PM rules `text-charcoal`** (see Architect Pre-check decisions below).
- C3 Playwright selector stability → **KG-029-01 Known Gap**: Engineer may add testid or use a structural anchor; not AC-mandatory.
- C4 New spec placement → Architect design doc specifies file; not AC-blocking.
- C5 Cross-component completeness → grep confirms only 2 files have leftovers; scope is complete.
- C6 Testing pyramid layer span color → **PM rules `text-ink`** (same level as body, avoiding contrast confusion with bold sibling li).
- C7 CardShell inheritance → verified no inheritance risk.

**Known Gap:**
- **KG-029-01** — Playwright selector path: Architect design doc prescribes data-testid names for 4 assertion targets (`arch-pillar-body` / `arch-pillar-layer` / `ticket-anatomy-body` / `ticket-anatomy-id-badge`). Engineer implements per design doc. QA sign-off verifies compliance with prescribed testids.

### Verified by qa subagent 2026-04-22

qa subagent re-ran adversarial review. Upgrades to previous simulated consultation:
- C3 → KG reframed: testid naming is Architect mandate, not Engineer discretion (about/ DossierHeader + FooterCtaSection precedent)
- C6 → AC tightened: pyramid `<li>` detail fixed to text-muted (prevents hierarchy inversion if Engineer chose text-ink for both li and span)
- AC allow-list assertion tightened from "at least one" to "all three" (previous wording allowed Engineer to pick a color outside both allow AND disallow lists and still pass "at least one" on 1/3 cards)
- Borderline observation: text-muted on paper at 12px = 4.84:1 (passes AA 4.5:1 but close to floor) — recorded, no action
- K-022 about-v2.spec.ts L195 color-assertion style confirmed as the canonical pattern to follow

## Acceptance Criteria

### AC-029-ARCH-BODY-TEXT: Architecture section card body text uses paper palette token `[K-029]`

**Given** the user visits `/about`
**When** the page scrolls to the Project Architecture section (Nº 05)
**Then** the body text (description paragraph) of all three ArchPillarBlock instances must have computed `color` equal to one of the following three paper palette values (**all three ArchPillarBlock instances must hit; assert each individually, must not pass via "at least one"**):
  - `rgb(26, 24, 20)` (text-ink `#1A1814`)
  - `rgb(42, 37, 32)` (text-charcoal `#2A2520`)
  - `rgb(107, 95, 78)` (text-muted `#6B5F4E`)
**And** the above body-text element's computed `color` **must not** equal any of the following dark-theme leftover values:
  - `rgb(209, 213, 219)` (gray-300)
  - `rgb(156, 163, 175)` (gray-400)
  - `rgb(107, 114, 128)` (gray-500)
**And** testing pyramid `<li>` detail (the description text in the three `<li>` items under the pyramid `<ul>`) must have computed `color` **fixed at** `rgb(107, 95, 78)` (text-muted) — not allow-list; this prevents hierarchy collapse if same color as the layer span below (child == parent)
**And** testing pyramid layer label span (`Unit` / `Integration` / `E2E` mono span, nested within `<li>`) must have computed `color` equal to `rgb(26, 24, 20)` (text-ink; PM ruled at BQ, aligns at body level and brightens above muted `<li>` detail; see §Architect Pre-check C-pyramid)
**And** Playwright assertions: iterate **all three** ArchPillarBlock instances and verify each body paragraph's computed `color` hits the allow-list set; iterate the three pyramid `<li>` details and verify each = `rgb(107, 95, 78)`; iterate the three layer spans and verify each = `rgb(26, 24, 20)`. This AC corresponds to 3 (pillar) + 3 (pyramid li) + 3 (layer span) = **9 independent Playwright assertions**, must not be merged

---

### AC-029-TICKET-BODY-TEXT: Ticket Anatomy section card body text uses paper palette token `[K-029]`

**Given** the user visits `/about`
**When** the page scrolls to the Anatomy of a Ticket section (Nº 04)
**Then** the Outcome / Learning content text of all three TicketAnatomyCard instances must have computed `color` equal to one of the following three paper palette values (**all three TicketAnatomyCard instances must hit; assert each individually, must not pass via "at least one"**):
  - `rgb(26, 24, 20)` (text-ink `#1A1814`)
  - `rgb(42, 37, 32)` (text-charcoal `#2A2520`)
  - `rgb(107, 95, 78)` (text-muted `#6B5F4E`)
**And** the above body element's computed `color` **must not** equal any of the following dark-theme leftover values:
  - `rgb(156, 163, 175)` (gray-400)
  - `rgb(107, 114, 128)` (gray-500)
**And** Outcome / Learning label (`Outcome` / `Learning` mono span) computed `color` must fall in the above allow-list, **all three TicketAnatomyCard's Outcome label + Learning label must each individually hit**, and **must not** be `rgb(107, 114, 128)` (gray-500)
**And** ticket ID badge (`K-002` / `K-008` / `K-009`) computed `color` for **all three TicketAnatomyCard instances must** equal `rgb(42, 37, 32)` (text-charcoal; PM ruled at BQ, see §Architect Pre-check C-badge), **must not** be `rgb(196, 181, 253)` (purple-400)
**And** Playwright assertions: iterate **all three** TicketAnatomyCard instances and verify each body paragraph's computed `color` hits the allow-list; iterate the three badges and verify each = `rgb(42, 37, 32)`. This AC corresponds to 3 (body) + 3 (badge) + 6 (Outcome + Learning labels × 3) = **12 independent Playwright assertions**, must not be merged

---

### AC-029-REGRESSION: K-022 existing assertions do not regress `[K-029]`

**Given** all K-022 ACs (AC-022-*) were PASS at K-022 close
**When** this ticket's implementation is complete
**Then** all K-022 + K-017 Playwright assertions still PASS (especially AC-022-FOOTER-REGRESSION, AC-022-SECTION-LABEL, AC-022-DOSSIER-HEADER)
**And** `npx tsc --noEmit` exit 0

---

## Release status

**PM 2026-04-22 releasing to Architect.**

- [x] QA Early Consultation 2026-04-22 completed (simulated with disclosure; qa subagent re-verifies at sign-off)
- [x] AC wording upgraded to RGB allow/disallow-list (C1)
- [x] All Architect Pre-check BQs ruled directly by PM (C-body=`text-muted`, C-pyramid=`text-ink`, C-badge=`text-charcoal`, C-scope=2 files complete)
- [x] Architect release: design doc must cover
  - Route Impact Table (/about single page; other routes marked unaffected — /, /diary, /app, /business-logic do not include ArchPillarBlock / TicketAnatomyCard)
  - Engineer implementation checklist (2 files / 7 substitutions / Playwright spec placement decisions)
  - **Must prescribe 4 data-testid names in design doc**: `arch-pillar-body` / `arch-pillar-layer` / `ticket-anatomy-body` / `ticket-anatomy-id-badge`, aligning with about/'s existing testid convention (DossierHeader / FooterCtaSection both use `data-testid`). Engineer implements per design doc, no freedom on selector strategy; QA sign-off verifies compliance.
  - No backend / API / route / props interface changes (visual token replacement)
- [x] Engineer release: Architect design doc complete and PM cross-check passes (PM sign-off 2026-04-22: checklist A/B/C/D/E/F all green; Route Impact Table §3, 11-row implementation checklist §6, 21-assertion Playwright strategy §7, §8 API Invariance, §9 Pencil Parity, §13 DOM count clarification all present; architecture.md changelog L605 + `updated:` 2026-04-22 updated; architect.md retro 2026-04-22 K-029 prepended; AC↔design §15 cross-check 21 assertions bijective; KG-029-01 wording aligned with ticket)

## Related links

- [K-022 ticket (A-12 migration prerequisite)](./K-022-about-structure-v2.md)
- [K-021 ticket (paper palette token definition)](./K-021-sitewide-design-system.md)
- [architecture.md Design System tokens](../../agent-context/architecture.md)

---

## Deploy Record

- **Deploy date:** 2026-04-22
- **Merge SHA:** `ed27780` (merge commit on main, merges k029-about-card-text-palette)
- **Live URL:** https://k-line-prediction-app.web.app (Firebase Hosting)
- **Build size:** index 114.74 kB (gzip 38.52 kB) + CSS 44.42 kB (gzip 7.81 kB); vendor chunks react 179.29 kB / charts 163.59 kB / markdown 117.40 kB
- **Bundle hash:** `index-CFg8uiWX.js` (+ `index-DWmEMmel.css`)
- **Verification probe:** `curl -s https://k-line-prediction-app.web.app/assets/index-CFg8uiWX.js | grep -o 'arch-pillar-body'` → match ✓; `grep -o 'ticket-anatomy-id-badge'` → match ✓ (both K-029-specific testids live)
- **Live HTTP status:** HTTP/2 200 on /about (curl -sI)
- **Deploy executor:** main session (auto-mode A authorization)
- **Status:** Live

---

## Retrospective

### What went well
- **[PM]**: Architect design doc cross-check checklist A–F all pass (§3 Route Impact Table covers 5 routes / §6 11-row implementation table / §7 21 independent assertions split into allow + disallow RGB / §8 API Invariance / §9 Pencil parity / §13 DOM count Boundary Pre-emption catching `arch-pillar-layer=3` rather than 9); AC↔assertion bijective cross-check is directly traceable.
- **[Architect]**: Pre-Design Audit confirmed 7 sites with no omissions via per-file `git show main:<file>`; §13 self-check caught that `testingPyramid` is optional, making `arch-pillar-layer`'s actual count = 3 (3 layers within Pillar 3) rather than the assumed 9, preventing Engineer from miswriting toHaveCount.
- **[Engineer]**: 11-row checklist run through in one pass (7 class + 4 testid), no BQ to report (Architect had pre-ruled all in §0); E2E spec logic self-check caught the `arch-pillar-layer` assertion shape issue (originally wanted per-pillar toHaveCount(3) which would resolve to 0 on Pillar 1/2), re-read §13 and switched to flat `toHaveCount(3)` in one shot; 197 passed / 1 skipped / 0 failed first-run green.
- **[QA]**: Independent full-suite re-run (197 pass / 1 skip / 0 fail) matches Engineer report; pre-run scanned and cleaned stale `K-UNKNOWN-visual-report.html` (continuity from K-028 memory); 4 K-029 testids individually re-verified present + exclusive; KG-029-01 closed cleanly; qa subagent re-verified PM-simulated Early Consultation, with 3 of 7 challenges corrected (C3 upgrade to Architect mandate / C6 pyramid `<li>` pin text-muted / AC "at least one" → "all three").

### What went wrong
- **[PM]**: PM subagent session had no Agent tool, forcing simulated QA Early Consultation; despite explicit disclosure per persona §PM session capability pre-flight, PM self-review of PM-authored AC has structural agreement bias — 3 of 7 challenges only got corrected by real qa subagent re-verification. Capability gap is the 2nd recurrence of the K-030-class issue.
- **[Architect]**: First draft §6.2 only listed 4 testid injections, did not in the same table also lay out the Outcome / Learning label sub-element selector path (from `ticket-anatomy-body` down `locator('span', { hasText })`); §15 AC↔Test Case check then prompted §6.2 Note section to fully document — without finding it, Engineer could have invented their own testids and violated Architect mandate.
- **[Engineer]**: No substantive failure — narrow scope, design doc clear, QA Early Consultation pre-flattened the C6 hierarchy inversion trap.
- **[QA]**: Pencil MCP tool was not granted to QA persona's tool surface → forced to verify Pencil parity via source-grep fallback rather than direct `.pen` visual diff. Parity confidence dropped to "source palette match spec" indirect proxy rather than "design canvas match render" direct verification.

### Next time improvements
- **[PM]**: (a) When PM subagent handoff happens, the main session prompt must explicitly list available tools for the subagent (Agent / MCP / Bash); if Agent is absent, per persona §PM session capability pre-flight, directly disclose + simulate, no more endless self-criticism; (b) For AC color/size/spacing assertions, always use **enum allow-list + enum disallow-list**, no ordinal comparison words ("darker", "larger"); already added to `~/.claude/agents/pm.md` §Phase Gate Checklist "AC CSS wording check" extension; (c) Badge semantic-color rulings adopt a "token semantic (architecture.md) → contrast eligibility → sibling element hierarchy avoidance" three-tier weighing paradigm, recorded as PM heuristic memo.
- **[Architect]**: When mandating testid design, lay out all selector paths for elements asserted under the same AC (including testid + non-testid-selected sub-elements) at once, not in two stages; "Assertion selector matrix: target-element × selector-path × toHaveCount" added as a required §6 sub-table; added to senior-architect.md.
- **[Engineer]**: When the design doc §6 has an N-row checklist with explicit numbers, when delivering back to PM, print the row-by-row DONE table (this ticket's 11 rows), so PM Phase Gate can audit at a glance without cross-referencing the design doc.
- **[QA]**: qa.md §0b extended: "if Pencil MCP tool is not granted to QA persona, BLOCK sign-off + request tool-grant from PM before proceeding"; current §0b only handles MCP-server-down, not MCP-tool-not-granted scenario.

### Cross-role insight
K-029 is K-Line's first ticket executed under "PM-simulated QA Early Consultation + real qa subagent re-verification" two-stage flow, capturing **PM self-review of self-written AC's structural agreement bias misses three pattern types: "at least one" vs "all three", selector strategy ownership (Engineer discretion vs Architect mandate), and sibling-element hierarchy inversion risk**. Direct lesson: PM subagent QA simulation when Agent tool is absent can only serve as a transparent disclosure fallback, not a primary path; when main session has Agent tool, summon real qa subagent first, feed consultation findings into PM handoff prompt, then hand to PM subagent to execute Phase Gate. This loop has been empirically validated effective in K-029 (3 corrections all landed before Engineer started, no rework); future UI visual tickets must follow this order.
