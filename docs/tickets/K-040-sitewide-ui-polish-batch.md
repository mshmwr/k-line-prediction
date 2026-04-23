---
id: K-040
title: Sitewide UI polish batch — Sitewide font reset (Bodoni→Geist Mono), padding, footer spacing, mobile rail, /about protocol links
status: open
phase: 0
type: polish
priority: medium
visual-delta: yes
content-delta: no
design-locked: true
qa-early-consultation: docs/retrospectives/qa.md 2026-04-23 K-040-early-consultation
created: 2026-04-23
depends-on: []
related-to: [K-017, K-022, K-024, K-030, K-034]
worktree: .claude/worktrees/K-040-sitewide-ui-polish-batch
---

## 0. One-line summary

Eight-item UI polish batch collected from PM live observation: **sitewide font family reset Bodoni Moda → Geist Mono with italic OFF (Item 1, scope-expanded 2026-04-23 from Hero-only to all routes + all components)**, padding + gap fine-tuning (Items 2/3/4/14), Diary mobile timeline rail restoration (Item 6), Pencil spec backfill (Item 5), and `/about` Pillar protocol links open-in-new-tab (Item 11). Designer-led for 7 items; Engineer-only for Item 11.

---

## 1. Scope

### In scope (8 items)

| # | Page | Change | Designer | Engineer | Notes |
|---|------|--------|----------|----------|-------|
| 1 | **sitewide** (all routes, all components) | **Sitewide font reset to Geist Mono (Bodoni Moda retired; italic OFF)** | yes | yes | scope-expanded 2026-04-23; 13 `font-display` sites + 4 inline `Bodoni Moda` sites + 1 Konva `timelinePrimitives.ts:30` literal + `tailwind.config.js` keys — all converted; per-site size + line-height calibration delegated to Designer via `K-040-designer-decision-memo.md` |
| 2 | `/diary` | Footer-adjacent bottom whitespace reduced | yes | yes | **Sacred-bound** — see §3 Constraints |
| 3 | `/` | Desktop left/right padding narrowed to match `/diary` / `/about` rhythm | yes | yes | reference: `/diary` `sm:px-24` (96px) |
| 4 | `/diary` | Vertical gap between `— View full log →` CTA and footer contact row opened up | yes | yes | Designer calibrates in .pen |
| 5 | `/diary` (design only) | `.pen` + JSON spec backfill of `This site uses Google Analytics to collect anonymous usage data.` | yes | no | design-file-only; impl already correct |
| 6 | `/diary` (mobile) | Timeline vertical rail + candle marker blocks restored (or design intent recorded if removal was intentional) | yes | yes | Designer confirms mobile .pen first |
| 11 | `/about` | 3× `Read the protocol →` links open in new tab | no | yes | `PillarCard.tsx:34` anchor needs `target="_blank" rel="noopener noreferrer"` |
| 14 | `/` (mobile) | Hero vertical spacing opened between BuiltByAIBanner, H1 block, and subtitle | yes | yes | cross-check `homepage-v2.pen` mobile Hero frame |

### Out of scope (deferred or other tickets)

- Items 7, 8, 9, 10, 12, 13 from `abstract-gathering-bird.md` — absorbed into K-034 (closed 2026-04-23) or queued as separate tickets.
- Backend / API changes.
- Navbar / Banner restructure.
- Font file additions — uses existing Geist Mono family already loaded via Tailwind `font-mono`.
- `/app` page (K-030 Pencil-exempt per `design-exemptions.md` §1) — not audited for Bodoni usage in this ticket; its canvas/plot label fonts may use different rule sets and are covered by K-030 SSOT, not here.

### Shared-component inventory check (per `feedback_shared_component_inventory_check.md`)

- **Footer** (shared, `frontend/src/components/shared/Footer.tsx`) — appears in Items 2, 4 context. **Prop-less per K-034 Phase 1**; any change to Footer itself propagates to `/`, `/about`, `/business-logic`, `/diary` and must preserve `AC-034-P1-ROUTE-DOM-PARITY` byte-identity contract. See §3 Constraints.
- **HeroSection** (page-specific, `frontend/src/components/home/HeroSection.tsx`) — Item 14. Not shared; scope contained to `/`.
- **Sitewide typography token (Item 1)** — `tailwind.config.js` `fontFamily` keys `display` + `italic` + `mono`, plus `font-display` class consumers across About + Home + Diary pages (13 tsx sites), plus inline `font-['Bodoni_Moda']` / `style={{ fontFamily: '"Bodoni Moda"' }}` consumers (4 sites: `DevDiarySection.tsx`, `DiaryEntryV2.tsx`, `DiaryHero.tsx`, `ProjectLogicSection.tsx`), plus Konva string literal in `timelinePrimitives.ts:30`. Crosses all routes — Designer must audit typography in every touched .pen frame; Engineer must edit every call site.
- **PillarCard** (page-specific, `frontend/src/components/about/PillarCard.tsx`) — Item 11. Not shared; scope contained to `/about`.
- **DiaryTimeline / DiaryEntry components** — Item 6. Scope contained to `/diary`.
- **HomePage.tsx root container** — Item 3. Page-specific padding; reference `/diary` / `/about` for target spacing, no shared container primitive.

No new shared components created. No inline-to-shared migration triggered.

---

## 2. Acceptance criteria

All AC use **visual intent wording**, not CSS property/value (per `feedback_pm_ac_visual_intent.md`).

### AC-040-SITEWIDE-FONT-MONO (Item 1 — **scope-expanded 2026-04-23**, supersedes retired `AC-040-HERO-FONT-MONO`)

- **Given:** every route served from `frontend/src/` (`/`, `/about`, `/business-logic`, `/diary`) at desktop and mobile viewports.
- **When:** any page renders any heading, display text, or decorative typography that previously used Bodoni Moda (via `font-display` Tailwind class, inline `font-['Bodoni_Moda']` class, inline `style={{ fontFamily: '"Bodoni Moda"' }}`, or Konva `font: 'Bodoni Moda, serif'` literal in canvas rendering).
- **Then:** the typography renders in monospace voice (Geist Mono family), italic OFF, matching BuiltByAIBanner's existing voice token sitewide. No Bodoni Moda glyphs appear anywhere in the rendered app.
- **And:** `tailwind.config.js` `fontFamily.display` and `fontFamily.italic` keys are removed (PM ruling, technical — future `font-display` class usage becomes an unknown-Tailwind-class, blocked at config layer per `feedback_refactor_ac_grep_raw_count_sanity.md` double-gate principle); only `fontFamily.mono` remains.
- **And:** `frontend/src/index.css` `@layer base` adds an explicit `body { @apply font-mono ... }` rule so default page typography defaults to Geist Mono rather than browser default serif (closes the gap where removing `font-display` from a component previously cascaded to browser default, not to mono).
- **And:** per-site font-size + line-height values (Hero H1 + PageHeader h1 64px, MetricCard 76/22/28, RoleCard 32/36, PillarCard 26px, TicketAnatomyCard 26px, ArchPillarBlock 24/22, ReliabilityPillarsSection 30px, and any Bodoni inline size) are **re-calibrated by Designer** because Geist Mono renders visually heavier per px than Bodoni Moda italic (reference: Hero H1 already stepped 64→56px in prior BQ-040-01 round). Designer authoritative values land in `docs/designs/K-040-designer-decision-memo.md` as a per-site table; Engineer mirrors memo values 1-to-1, no creative extension (per `feedback_engineer_design_spec_read_gate.md`).
- **And:** editorial `italic` Tailwind class is stripped from every site where it co-occurs with the retired `font-display` class (60 such occurrences baseline, PM grep 2026-04-23). Defensive `<code class="not-italic">` overrides (3 sites in `ReliabilityPillarsSection.tsx`) have the `not-italic` class stripped as part of same edit because sitewide default is no longer italic — `not-italic` becomes a no-op under the new token layer (PM ruling, technical).
- **And:** Konva canvas timeline font literal `frontend/src/components/diary/timelinePrimitives.ts:30` is rewritten from `font: 'Bodoni Moda, serif'` to `font: 'Geist Mono, ui-monospace, monospace'` (Konva consumes raw CSS font shorthand, not Tailwind class — must be literal-string edited alongside className sites).
- **And:** grep raw-count sanity (per `feedback_refactor_ac_grep_raw_count_sanity.md`, pre-count is non-trivial so post=0 is meaningful):
    - `grep -rnE "\bfont-display\b" frontend/src/ --include='*.tsx'` — pre-count = **13** (PM grep 2026-04-23), post-count = **0**
    - `grep -rnE "font-\[.Bodoni_Moda.\]|fontFamily.*Bodoni" frontend/src/ --include='*.tsx' --include='*.ts'` — pre-count = **4** (PM grep 2026-04-23), post-count = **0**
    - `grep -rnE "'Bodoni Moda'|\"Bodoni Moda\"" frontend/src/ --include='*.ts' --include='*.tsx'` — pre-count = **1** (Konva literal at `timelinePrimitives.ts:30`, PM grep 2026-04-23), post-count = **0**
    - `grep -nE "display:|italic:" frontend/tailwind.config.js` — pre-count = **2**, post-count = **0** (both keys removed)
- **And:** Playwright spot-check assertions on 1 representative page per route (Hero H1 on `/`, PageHeaderSection h1 on `/about`, DiaryHero h2 on `/diary`, ProjectLogicSection h2 on `/business-logic`) — each asserts (a) computed `font-family` contains `Geist Mono` or `ui-monospace` substring; (b) computed `font-style` is `normal` (not `italic`). Proves render-time font + italic state, not just class removal.
- **And:** after Engineer phase, a full-route visual sweep via `/playwright` dev server walk (`/`, `/about`, `/business-logic`, `/diary` at both desktop 1920px and mobile 375px) — PM inspects each route, confirms no residual Bodoni glyphs or serif rendering anywhere, per `feedback_shared_component_all_routes_visual_check.md`.

### AC-040-HERO-FONT-MONO — **RETIRED 2026-04-23**

Superseded by `AC-040-SITEWIDE-FONT-MONO` above. Retirement reason: user scope-expansion ruling 2026-04-23 ("所有頁面的所有字體都換成 Geist Mono, italic OFF") — sitewide token reset is the correct frame, not H1-only. Original AC text preserved in git history (prior commit to this session). BQ-040-01 user ruling (Option B, italic OFF) carries forward into the new AC.

### AC-040-DIARY-FOOTER-BOTTOM-GAP (Item 2) — **Sacred-interacting**

- **Given:** `/diary` desktop and mobile after entries rendered.
- **When:** user scrolls to page bottom.
- **Then:** the whitespace below the GA disclosure line is visually tight (no large empty band).
- **And:** **K-034 Phase 1 Sacred `AC-034-P1-ROUTE-DOM-PARITY`** is preserved — `<footer>` outerHTML remains byte-identical across `/`, `/about`, `/business-logic`, `/diary`. Any adjustment that modifies `<Footer>` itself must apply sitewide; any adjustment scoped to `/diary` must operate on the `<main>` / page container (not the Footer) to avoid Sacred violation.
- **And:** adjustment must operate on the `<main>` container `pb-*` only — `<Footer>` component internals MUST NOT change (per BQ-040-02 PM ruling Option A + QA Interception #1).
- **And:** Designer JSON spec provides numeric target value (e.g., `main pb = 48px`); Playwright asserts measured gap (CTA bottom edge → Footer top edge) matches spec ±2px (per QA Challenge #2 supplementation).

### AC-040-HOME-DESKTOP-PADDING (Item 3)

- **Given:** `/` desktop viewport ≥ 640px (sm breakpoint).
- **When:** page renders.
- **Then:** left and right padding visually match the rhythm of `/diary` and `/about` (narrower than the prior 96px-each symmetric inset).
- **And:** mobile (< 640px) padding unchanged from prior `px-6`.
- **And:** target numeric value AND target `max-width` (content-cap) both calibrated by Designer in `homepage-v2.pen`; reference: `/diary` currently uses `sm:px-24` (96px) within `max-w-[1248px]` content cap, `/about` uses SectionContainer `width="wide"` with inner padding — Designer chooses aligned target for both padding AND max-width.
- **And:** Designer JSON spec explicitly documents both values (`desktopPaddingPx`, `maxWidthPx`); Playwright asserts both match spec ±2px on wide viewport (1920px) (per QA Challenge #3 supplementation — clarifies whether complaint was padding width vs missing max-width cap).

### AC-040-DIARY-CTA-FOOTER-GAP (Item 4)

- **Given:** `/diary` at the bottom of the timeline content.
- **When:** `— View full log →` CTA and the shared Footer row both visible.
- **Then:** vertical gap between the CTA and the first Footer text node is visually open (not cramped).
- **And:** gap value calibrated by Designer in .pen and recorded as numeric value in `homepage-v2.frame-*.json` spec; Footer internals (Sacred per K-034 P1) untouched; Playwright asserts measured CTA→Footer-top-edge distance matches spec ±2px (per QA Challenge #4 supplementation).

### AC-040-DIARY-PEN-GA-BACKFILL (Item 5)

- **Given:** `frontend/design/homepage-v2.pen` Diary-consumer footer frame.
- **When:** Designer opens the frame in Pencil.
- **Then:** the frame contains a text node `This site uses Google Analytics to collect anonymous usage data.` matching live implementation wording exactly.
- **And:** `frontend/design/specs/homepage-v2.frame-*.json` mirror is regenerated same-session (per `feedback_designer_json_sync_hard_gate.md`).
- **And:** `frontend/design/screenshots/homepage-v2-*.png` regenerated.
- **And:** no `frontend/src/**` change required (pure design-file backfill; Engineer no-op).

### AC-040-DIARY-MOBILE-RAIL (Item 6)

- **Given:** `/diary` at mobile viewport (< 640px).
- **When:** entries render.
- **Then:** the left-hand timeline decoration (vertical rail line + candle marker blocks) is visible and aligned with entry rows, matching Designer's mobile .pen frame.
- **And:** Designer first confirms in `.pen`: (a) rail is intended for mobile and current impl drift; or (b) rail was intentionally removed for mobile (in which case Designer records decision in .pen comment + JSON spec, and Engineer is no-op).
- **And:** Designer JSON spec for Diary mobile frame carries explicit machine-readable annotation `"mobileRail": "restored"` or `"mobileRail": "design-removed"` as source of truth for test oracle (per QA Challenge #5 supplementation).
- **And:** if path (a): Engineer restores rail per Designer spec; desktop rail unchanged.

### AC-040-ABOUT-PROTOCOL-LINK-NEW-TAB (Item 11) — Engineer-only

- **Given:** `/about` Nº 03 — Reliability section with 3× PillarCard components (`Persistent Memory`, `Structured Reflection`, `Role Agents`).
- **When:** user clicks any `Read the protocol →` link.
- **Then (1):** all 3 links open in a new browser tab with `rel="noopener noreferrer"`, preserving the current `/about` tab; each of the 3 anchors has `target="_blank"` and `rel="noopener noreferrer"` attributes.
- **Then (2):** all 3 destinations are reachable GitHub blob URLs (HTTP 200 when fetched) pointing at the canonical `docs/ai-collab-protocols.md` source of truth in the `mshmwr/k-line-prediction` repository with correct anchors — no 404, no raw-MD-served-as-static-asset, no broken site-relative path.
- **And:** the 3 `docsHref` values in `frontend/src/components/about/ReliabilityPillarsSection.tsx` are replaced from site-relative (`/docs/ai-collab-protocols.md#<anchor>`) to GitHub blob URLs per BQ-040-04 PM ruling = Option A (2026-04-23). Canonical mapping (PM-verified this session):
    - Pillar 1 (`Persistent Memory`) → `https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#per-role-retrospective-log`
    - Pillar 2 (`Structured Reflection`) → `https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#bug-found-protocol`
    - Pillar 3 (`Role Agents`) → `https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#role-flow`
- **And:** anchor targets verified present in `docs/ai-collab-protocols.md` at lines 73 / 49 / 16 respectively (PM grep this session — `{#role-flow}` / `{#bug-found-protocol}` / `{#per-role-retrospective-log}` explicit anchors match GitHub's auto-generated slug for `## Role Flow` / `## Bug Found Protocol` / `## Per-role Retrospective Log` headings).
- **And:** each of the 3 anchors has `target="_blank"` and `rel="noopener noreferrer"` attributes.
- **And:** grep `target="_blank"` in `frontend/src/components/about/PillarCard.tsx` returns exactly 1 match (single shared anchor in the reusable card component; renders 3× at runtime). Raw-count sanity per `feedback_refactor_ac_grep_raw_count_sanity.md`: pre-count = 0 (confirmed by PM this session), post-count = 1. Test assertion: Playwright counts 3 rendered anchors on `/about` all with `target="_blank"` attribute.
- **And:** grep `docsHref=\"/docs/` in `frontend/src/components/about/ReliabilityPillarsSection.tsx` returns 0 matches after implementation (raw-count sanity: pre = 3, post = 0); grep `docsHref=\"https://github.com/mshmwr/k-line-prediction/blob/main/docs/` returns exactly 3 matches.
- **And:** Playwright asserts all 3 rendered `<a>` anchors on `/about` Nº 03 section have `href` starting with `https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#` (protocol-link integration test; catches regression to site-relative paths).

### AC-040-HOME-MOBILE-HERO-SPACING (Item 14)

- **Given:** `/` mobile viewport (< 640px).
- **When:** HeroSection renders below BuiltByAIBanner.
- **Then:** vertical spacing above H1 block (below BuiltByAIBanner) and below H1 block (above subtitle `Pattern-matching engine for K-line...`) is visually open, not cramped.
- **And:** spacing calibrated by Designer in `homepage-v2.pen` mobile Hero frame; if current impl drifts from .pen, Engineer aligns; if .pen itself is cramped, Designer re-calibrates .pen first.

---

## 3. Constraints (Sacred invariants & cross-references)

### K-034 Phase 1 Sacred: `AC-034-P1-ROUTE-DOM-PARITY`

- File: `frontend/e2e/shared-components.spec.ts:31-60`
- Contract: `<footer>` outerHTML byte-identical across `/`, `/about`, `/business-logic`, `/diary`.
- Impact on Items 2 + 4: any modification to `Footer.tsx` itself propagates sitewide; Diary-only footer-area adjustments must modify the `<main>` container (not `<Footer>`).

### K-034 Phase 1 Footer prop-less contract

- File: `frontend/src/components/shared/Footer.tsx:33`
- Contract: Footer accepts zero props; single unified implementation.
- Impact: Items 2/4 cannot reintroduce per-route variants.

### K-030 `/app` isolation

- `/app` does NOT render shared Footer (Pencil-exempt per `design-exemptions.md` §1). K-040 scope does not touch `/app`.

### Raw-count sanity (`feedback_refactor_ac_grep_raw_count_sanity.md`)

- Item 1 (sitewide, scope-expanded 2026-04-23):
    - `font-display` repo-wide in `frontend/src/**/*.tsx` pre=**13** post=**0**
    - `font-['Bodoni_Moda']` / `fontFamily.*Bodoni` inline repo-wide pre=**4** post=**0**
    - `'Bodoni Moda'` / `"Bodoni Moda"` string literal repo-wide in `.ts` + `.tsx` (covers Konva) pre=**1** post=**0**
    - `tailwind.config.js` `display:` + `italic:` keys pre=**2** post=**0**
- Item 11: `target="_blank"` in `PillarCard.tsx` pre-count = 0, post-count = 1. Monitored.
- Item 11: `docsHref="/docs/` in `ReliabilityPillarsSection.tsx` pre=**3** post=**0**; `docsHref="https://github.com/mshmwr/...` pre=**0** post=**3**. Monitored.

---

## 4. Role sequencing

1. **Phase 0 — QA Early Consultation** (current phase; PM gate before Phase 1)
2. **Phase 1 — Designer** — updates `homepage-v2.pen` frames for Items 1, 2, 3, 4, 5, 6, 14; exports JSON specs (`frontend/design/specs/homepage-v2.frame-*.json`) + screenshots (`frontend/design/screenshots/homepage-v2-*.png`) + side-by-side PNG where needed. Flips frontmatter `design-locked: true` after PM visual sign-off.
3. **Phase 2 — Architect** — only if cross-cutting concerns surface from Designer (e.g., Item 3 padding affecting SectionContainer primitive); otherwise skipped.
4. **Phase 3 — Engineer** — implements all 7 impl-needing items against Designer JSON + Item 11 (no Designer dependency).
5. **Phase 4 — Code Reviewer** — superpowers breadth + reviewer.md depth.
6. **Phase 5 — QA** — regression + Pencil parity gate per `feedback_reviewer_pencil_parity_gate.md`.
7. **Phase 6 — PM close + deploy + Deploy Record.**

Designer is first because `visual-delta: yes` on 7 of 8 items. Engineer may be dispatched in parallel for Item 11 (no Designer dependency) once QA consultation passes.

---

## 5. Blocking questions (to be ruled before Designer release)

### BQ-040-01 — Hero italic retention (Item 1) — **RESOLVED 2026-04-23**

- **Context:** Prior Hero H1 uses `font-display italic font-bold` (Bodoni Moda serif italic). User instruction says "match BuiltByAIBanner `One operator. Six AI agents.` typographic voice" (non-italic, non-bold, `font-mono text-sm`).
- **Options:**
  - (A) Keep italic + bold at new font → mono italic bold 64px (stylistically unusual for monospace).
  - (B) Drop italic, keep bold → mono regular bold 64px (closer to banner voice, more legible).
  - (C) Match banner exactly → mono regular (non-bold, non-italic), Designer chooses size.
- **User ruling (2026-04-23):** **Option B — Drop italic.** Final spec: `font-mono text-[64px] font-bold` (no `italic` class). Italic is locked OFF; Designer may propose 48px or 56px as alternative to 64px in Phase 1 via .pen + JSON spec, but italic is non-negotiable. Landed in AC-040-HERO-FONT-MONO.

### BQ-040-02 — Diary footer bottom-gap location (Item 2)

- **Context:** Whitespace below GA disclosure can be reduced via either (a) `<main>` container `pb-24` reduction (Diary-only, Sacred-safe) or (b) `<Footer>` internal `py-5` reduction (sitewide, requires K-034 P1 Sacred re-approval).
- **Options:**
  - (A) Reduce `<main>` `pb-*` on `/diary` only — Sacred-safe, no cross-route impact.
  - (B) Reduce `<Footer>` `py-*` sitewide — all 4 consuming routes affected.
- **PM ruling:** **Option A** (Diary-only `<main>` adjustment). Reasoning: (1) K-034 P1 Sacred byte-identity is only 1 day old and critical to the new SSOT workflow; (2) user's observation was on `/diary` specifically; (3) no evidence from user that other routes have the same complaint. Designer calibrates target `pb-*` value in .pen. **No user escalation needed.**

### BQ-040-03 — Item 6 mobile rail: drift vs intentional removal

- **Context:** Current impl: mobile `/diary` shows no rail; Designer needs to confirm whether .pen mobile Hero+Timeline frame has rail.
- **PM ruling:** Deferred to Designer Phase 1 — Designer opens mobile .pen frame, reports. If .pen has rail → impl drift (Engineer restores). If .pen has no rail → intentional (record decision in .pen + JSON spec, Engineer no-op). **No user escalation needed at PM gate; Designer provides answer.**

### BQ-040-04 — Item 11 `Read the protocol →` broken-destination UX (raised by QA Challenge #6) — **RESOLVED 2026-04-23**

- **Context:** `PillarCard.tsx` anchors use `docsHref` values set by `ReliabilityPillarsSection.tsx` pointing at site-relative markdown paths (`/docs/ai-collab-protocols.md#role-flow` and similar). `grep /docs/ frontend/src/App.tsx` confirms **no route handles `/docs/*`**. Adding `target="_blank"` makes the broken destination more visible (new tab → 404 or raw MD file), not less.
- **Options:**
  - (A) **Fix `docsHref` values** to working URLs (e.g., GitHub blob URLs). Low cost; real working UX; scope creep = 3 string values only.
  - (B) **Known Gap** — Item 11 ships `target="_blank"` only; destination handled in a follow-up ticket (e.g., "K-0XX: docs markdown renderer route"). AC passes; UX still broken until follow-up lands.
  - (C) **Scope expansion** — K-040 also builds `/docs/*` MD renderer route. High cost; derails polish batch into infra ticket.
- **User ruling (2026-04-23):** **Option A — Fix the 3 `docsHref` strings in `ReliabilityPillarsSection.tsx` to working GitHub blob URLs before shipping.**
- **PM verification this session (pre-Designer release):**
  - Current 3 `docsHref` values in `frontend/src/components/about/ReliabilityPillarsSection.tsx` (lines 47, 65, 83): all 3 point at `/docs/ai-collab-protocols.md` with anchors `#per-role-retrospective-log`, `#bug-found-protocol`, `#role-flow`.
  - Source doc exists at `docs/ai-collab-protocols.md` (and mirrored to `frontend/public/docs/` + `frontend/dist/docs/` by build).
  - All 3 anchors resolve in-file: `#role-flow` (line 16 `{#role-flow}`), `#bug-found-protocol` (line 49), `#per-role-retrospective-log` (line 73). GitHub's auto-anchor slug for those `##` headings matches the explicit `{#...}` anchors byte-for-byte, so the GitHub blob URL will navigate to the correct section without modification.
  - Git remote = `git@github.com:mshmwr/k-line-prediction.git`; canonical blob URL form is `https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#<anchor>`.
  - **No BQ-040-05 raised** — all 3 docs resolve. Proceeding to Designer release.
- Landed in AC-040-ABOUT-PROTOCOL-LINK-NEW-TAB (split into Then(1) target/rel + Then(2) destination reachability, plus explicit URL mapping table, plus raw-count pre=3/post=0 sanity grep).

### BQ-040-05 — Sitewide font-size calibration after mono swap (Item 1 scope-expansion) — **RESOLVED 2026-04-23**

- **Context:** Geist Mono renders visually heavier per px than Bodoni Moda italic (confirmed via prior BQ-040-01 Hero H1 which stepped 64px → 56px Designer recalibration). Scope-expansion to 10+ additional Bodoni sites (PageHeader h1 64px / RoleCard 32+36 / PillarCard 26 / TicketAnatomy 26 / MetricCard 76+22+28 / ArchPillar 24+22 / Reliability 30 / plus 4 inline Bodoni sites) each need per-site re-calibration. PM cannot enumerate target pixel values without visual judgment in Pencil.
- **Options:**
  - (A) PM dictates uniform size rule (e.g., "reduce every Bodoni size by 12%") — no visual judgment, risk of uneven hierarchy.
  - (B) Delegate per-site size + line-height calibration to Designer fully; Designer records values in `docs/designs/K-040-designer-decision-memo.md` per-site table; Engineer mirrors.
  - (C) Leave sizes as-is; accept visual weight increase as design signal.
- **PM ruling (technical, no user escalation per `feedback_pm_self_decide_bq.md`):** **Option B.** Priority-order source check: (1) Pencil `.pen` is SSOT for visual → Designer owns pixel values; (2) memo rule `feedback_pencil_ssot_json_snapshot.md` — Designer is the only role with Pencil MCP authority, PM cannot author pixel values; (3) `feedback_engineer_design_spec_read_gate.md` — Engineer implements `specs/*.json` values 1-to-1, no creative extension. All three sources point at B. AC locked accordingly.

### BQ-040-06 — `not-italic` override handling under mono-sitewide (Item 1 scope-expansion) — **RESOLVED 2026-04-23**

- **Context:** `ReliabilityPillarsSection.tsx` has 3× `<code class="not-italic">` defensive overrides, put in place when the parent was an `italic font-display` block (mono-token ancestor didn't yet exist). Under new sitewide mono + italic OFF, `not-italic` becomes a no-op — but leaving it in is harmless dead code.
- **Options:**
  - (A) Strip the 3 `not-italic` classes in Engineer phase alongside the italic scrub (cleaner token layer).
  - (B) Leave `not-italic` in place as future-proof in case an ancestor italic override appears again.
- **PM ruling (technical, no user escalation):** **Option A** — strip. Reasoning: (1) dead code accumulates drift; (2) sitewide italic removal is the forcing function — `not-italic` defensive overrides are only meaningful when italic cascades from ancestors; (3) if future italic use-case emerges, re-adding is 1 line. Engineer strips as part of Item 1 implementation.

---

## 6. Retrospective

(Populated post-close.)

---

## 7. Deploy Record

(Populated post-deploy.)

---

## 8. Release Status

### 2026-04-23 — PM turn (BQ rulings landed, Designer release pending)

- **BQ-040-01** ruled by user = **Option B** (drop italic, `font-mono text-[64px] font-bold` final spec). Landed in AC-040-HERO-FONT-MONO (`And` clause added: italic locked OFF; `font-bold` retained; 64px retained pending Designer .pen review; italic is non-negotiable). Playwright assertion added: computed `font-style` = `normal`.
- **BQ-040-04** ruled by user = **Option A** (fix the 3 `docsHref` to working GitHub blob URLs). Landed in AC-040-ABOUT-PROTOCOL-LINK-NEW-TAB (split into Then(1) target/rel + Then(2) destination reachability). All 3 target anchors verified by PM this session (grep `ai-collab-protocols.md` `## Role Flow {#role-flow}` / `## Bug Found Protocol {#bug-found-protocol}` / `## Per-role Retrospective Log {#per-role-retrospective-log}` at lines 16 / 49 / 73; GitHub auto-slug for those headings matches the explicit `{#...}` anchors exactly). Canonical blob URL shape = `https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#<anchor>`. **BQ-040-05 not raised** — no unresolved href.
- **Handoff check:** `qa-early-consultation = docs/retrospectives/qa.md 2026-04-23 K-040-early-consultation, visual-delta = yes, design-locked = false → OK for Designer release` (design-locked sign-off follows Designer return).

### PM session capability gap (disclosed per `feedback_pm_session_capability_preflight`)

- Current session tool allowlist: `Read`, `Edit`, `Write`, `Bash` only. **No `Agent` tool** available to spawn Designer sub-agent via persona file; **no `mcp__pencil__*`** tools available for Pencil capture / screenshot. Designer phase requires both (`~/.claude/agents/designer.md` invocation + `mcp__pencil__batch_get` / `batch_design` / `get_screenshot` for .pen editing + `frontend/design/specs/*.json` regeneration + `frontend/design/screenshots/*.png` regeneration).
- **Resolution:** PM cannot release Designer in-session. Control returns to caller (main session with full tool allowlist) to either (a) spawn Designer directly via `Agent` with persona `~/.claude/agents/designer.md` or (b) call a PM agent turn in a session that has both `Agent` and Pencil MCP tools attached. Simulating Designer work in this PM persona without Pencil MCP would silently violate `feedback_pencil_ssot_json_snapshot.md` (Designer is the only role authorized to touch Pencil MCP directly; other roles consume `specs/*.json` + `screenshots/*.png`).
- **Designer inbound brief (ready for caller to hand off):**
    - Scope items requiring Designer work: 1, 2, 3, 4, 5, 6, 14 (7 items). Item 11 is Engineer-only, no Designer dependency.
    - **Item 1 constraints:** italic locked OFF (BQ-040-01 user ruling Option B). Designer may propose 48px or 56px as alternative to 64px but italic is non-negotiable; `font-bold` retained. Designer must produce `frontend/design/specs/homepage-v2.frame-<heroId>.json` for the Hero frame — **current specs/ only contains `86psQ` + `1BGtd` (footer frames), Designer must `mcp__pencil__batch_get` the full homepage-v2 frame list first to locate the Hero frame ID before modifying.**
    - **Item 6 constraints:** Designer first confirms mobile .pen intent — (a) rail intended / current impl drift → annotate JSON `"mobileRail": "restored"` with numeric spec for engineer; (b) rail intentionally removed → annotate JSON `"mobileRail": "design-removed"` per QA Challenge #5 disposition; Engineer becomes no-op on Item 6.
    - **Per `feedback_pencil_ssot_json_snapshot.md` + `feedback_designer_json_sync_hard_gate.md`:** every touched frame → same-session export of `.pen` + `frontend/design/specs/homepage-v2.frame-<id>.json` + `frontend/design/screenshots/homepage-v2-<id>.png`. Side-by-side PNG for any theme shared across multiple frames (e.g., Footer padding numeric target used for Items 2 + 4 reference).
    - **Designer MUST NOT touch:** `Footer.tsx` internals (K-034 Phase 1 Sacred `AC-034-P1-ROUTE-DOM-PARITY` byte-identity contract); all Items 2 + 4 footer-area adjustments operate on `<main>` container `pb-*` only (BQ-040-02 PM ruling Option A).
    - **Designer return handoff:** flips frontmatter `design-locked: true` only **after PM side-by-side PNG + JSON review** per `feedback_pm_design_lock_sign_off.md` (Designer does not self-flip; PM signs).

### 2026-04-23 — Scope-expansion (user directive)

- **User verbatim ruling:** "我看到幾乎所有頁面的字體都還是原本的 Bodoni Moda，沒有換成 Geist Mono。需求是所有頁面的所有字體都換成 Geist Mono，PM 更新一下，設計師也更新一下。"
- **Effect:** `AC-040-HERO-FONT-MONO` retired; `AC-040-SITEWIDE-FONT-MONO` authored — scope now covers all routes, all components, all Bodoni touchpoints (13 `font-display` tsx sites + 4 inline `Bodoni Moda` sites + 1 Konva `timelinePrimitives.ts:30` literal + `tailwind.config.js` `display`/`italic` keys + `index.css` body default).
- **Items 2/3/4/5/6/11/14 unchanged** (their AC blocks intact above).
- **BQ-040-05** (sitewide font-size calibration) resolved by PM = Option B (Designer authoritative values in memo; Engineer mirrors).
- **BQ-040-06** (`not-italic` defensive overrides) resolved by PM = Option A (strip 3× `not-italic` in `ReliabilityPillarsSection.tsx` during Engineer phase).
- **Frontmatter flip:** `design-locked: true` → **`design-locked: false`** (reset — prior Designer pass only covered Hero; new scope requires re-design of 7+ frames covering About + Diary + Home + Business-Logic typography).
- **Handoff check:** `qa-early-consultation = docs/retrospectives/qa.md 2026-04-23 K-040-early-consultation`, `visual-delta = yes`, `design-locked = false` → **OK for Designer re-dispatch**.

## Designer Brief (2026-04-23 scope expansion)

Dispatched by main session (PM session lacks `Agent` + `mcp__pencil__*` tools — capability gap per `feedback_pm_session_capability_preflight`). Designer works in worktree `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.claude/worktrees/K-040-sitewide-ui-polish-batch/`.

### Task summary

Convert every Bodoni-Moda-using .pen frame to Geist Mono (italic OFF) and re-calibrate per-site font-size + line-height. Designer authoritative values land in `docs/designs/K-040-designer-decision-memo.md`. Export touched frames' `.pen` + `frontend/design/specs/<id>.json` + `frontend/design/screenshots/<id>.png` same session per `feedback_designer_json_sync_hard_gate.md`.

### Frame rework table

PM anchor note: existing specs/ folder contains frames listed below. Frame IDs (`8mqwX` etc.) match `frontend/design/specs/<family>.frame-<id>.json` filenames; use `mcp__pencil__batch_get` first to enumerate family `about-v2` + `homepage-v2` full frame list and verify no missed frame.

| Frame file (existing spec) | Page/area | Old family | Old size(s) | Italic currently? | Geist-Mono new size @mono (Designer fills) | Notes |
|---|---|---|---|---|---|---|
| `about-v2.frame-8mqwX.json` | /about — PageHeaderSection h1 region | Bodoni Moda | 64px + 36px sub | yes (`italic` class) | _____ | Largest About heading; expect heaviest reduction |
| `about-v2.frame-BF4Xe.json` | /about — ReliabilityPillarsSection | Bodoni Moda | 30px + 26px (PillarCard inner) | yes | _____ | 3× PillarCard uses 26px; `<code class="not-italic">` 3× → strip (BQ-040-06) |
| `about-v2.frame-EBC1e.json` | /about — RoleCards region | Bodoni Moda | 32px + 36px | yes | _____ | RoleCard title + subtitle |
| `about-v2.frame-JFizO.json` | /about — MetricCards section | Bodoni Moda | 76px / 22px / 28px | yes | _____ | MetricCard hero number is widest-glyph; expect significant px reduction |
| `about-v2.frame-UXy2o.json` | /about — ArchPillarBlock | Bodoni Moda | 24px + 22px | yes | _____ | ArchPillarBlock heading + body |
| `about-v2.frame-voSTK.json` | /about — TicketAnatomyCard | Bodoni Moda | 26px | yes | _____ | Single size token |
| `about-v2.frame-wwa0m.json` | /about — full-page composite | (aggregate) | (mixed above) | (mixed) | (N/A — per-sub-frame) | Re-render after each sub-frame done to verify composite hierarchy |
| `homepage-v2.frame-<HeroId>` | / — HeroSection H1 block (**not yet in specs/**; Designer `mcp__pencil__batch_get` first to locate) | Bodoni Moda | 64px (BQ-040-01 permitted 48 or 56 alt) | yes → locked OFF per BQ-040-01 | _____ | Carries BQ-040-01 resolved constraints: italic OFF non-negotiable, `font-bold` retained |
| `homepage-v2.frame-2ASmw.json` | / — DevDiarySection | Bodoni Moda (inline `font-['Bodoni_Moda']`) | (inline — Designer reads) | yes | _____ | Inline className site; Engineer converts to `font-mono` + new size |
| `homepage-v2.frame-ei7cl.json` | / — ProjectLogicSection h2 | Bodoni Moda (inline `style fontFamily`) | (inline — Designer reads) | likely | _____ | Inline `style` prop site |
| `homepage-v2.frame-wtC03.json` | / — homepage full composite | (aggregate) | (mixed above) | (mixed) | (N/A — per-sub-frame) | Re-render after sub-frames |
| `homepage-v2.frame-yg0qF.json` / `zyttw.json` | / — additional Home frames (PM could not infer purpose without reading) | (Designer audits) | (Designer fills) | (Designer fills) | _____ | Designer audits whether typography touched |
| `homepage-v2.frame-86psQ.json` | Footer frame A | **already Geist Mono** | (unchanged) | no | NO-CHANGE | K-034 Phase 1 Sacred byte-identity — do not touch |
| `homepage-v2.frame-1BGtd.json` | Footer frame B | **already Geist Mono** | (unchanged) | no | NO-CHANGE | K-034 Phase 1 Sacred byte-identity — do not touch |
| NavBar frames (existing in .pen — Designer confirms ID via `mcp__pencil__batch_get`) | sitewide NavBar | **already Geist Mono in impl** | (unchanged) | no | Expected NO-CHANGE (audit-only) | If .pen shows Bodoni-era NavBar, re-align to impl (`font-mono`) |
| Diary frames — `diary-v2.pen` (per K-034 Phase 3 BQ-040-02 Footer-area is `<main>` padding, not Footer) | /diary — DiaryHero h2, DiaryEntryV2 title, Konva timeline label font | Bodoni Moda (inline + Konva literal) | (Designer reads per frame) | likely | _____ | Konva `timelinePrimitives.ts:30` literal `'Bodoni Moda, serif'` → `'Geist Mono, ui-monospace, monospace'`; Designer confirms Pencil frame typography matches |

**Frame count summary:** ~13 frames touched (7 About sub-frames + ~5 Home sub-frames + Diary frames per `diary-v2.pen`); 2+ Footer frames NO-CHANGE; NavBar audit-only (expected NO-CHANGE).

### Deliverables (Designer must produce all)

1. **Updated .pen files** — `homepage-v2.pen`, `about-v2.pen`, `diary-v2.pen` (and any other family touched) — every Bodoni frame rewritten to Geist Mono, italic OFF.
2. **Regenerated JSON specs** — for every touched frame, `frontend/design/specs/<family>.frame-<id>.json` refreshed same session (hard gate per `feedback_designer_json_sync_hard_gate.md`). Untouched frames (Footer `86psQ` / `1BGtd`) MUST NOT be re-exported (drift-safety).
3. **Regenerated PNG screenshots** — for every touched frame, `frontend/design/screenshots/<family>-<id>.png` refreshed same session.
4. **Side-by-side PNG (mandatory when theme shared across frames)** — per `feedback_pencil_ssot_json_snapshot.md`: for each shared typography theme (e.g., "h1 64→X mono" applied to Hero + PageHeader), produce a side-by-side `frontend/design/screenshots/side-by-side-<theme>-K040.png` so PM can verify intent parity in single artifact.
5. **Updated `K-040-designer-decision-memo.md`** — add a per-site font-size + line-height table with columns [Site, Old size, Old line-height, New size @mono, New line-height, Reasoning]. This table is Engineer's 1-to-1 reference.
6. **Designer retrospective entry** — prepend `## 2026-04-23 — K-040 sitewide font reset` to `docs/retrospectives/designer.md` per project per-role retrospective rule.

### Constraints (must preserve)

- `homepage-v2.frame-86psQ` + `homepage-v2.frame-1BGtd` (Footer frames): **NO CHANGE** — K-034 Phase 1 Sacred `AC-034-P1-ROUTE-DOM-PARITY` byte-identity contract.
- NavBar frames: audit only — if impl already `font-mono` and .pen matches, no edit; if .pen shows Bodoni, align .pen to impl (not impl to .pen).
- `italic` OFF is non-negotiable sitewide (BQ-040-01 Option B carries forward sitewide).
- Do not merge BQ-040-05 calibration work into BQ-040-01 prior Hero decision — Hero size constraint (48/56/64 alternatives, italic OFF, `font-bold` retained) still applies; Designer picks one of those three for Hero.

### Designer return handoff

Flips frontmatter `design-locked: true` **only after** PM side-by-side PNG + JSON review per `feedback_pm_design_lock_sign_off.md`. Designer does not self-flip.

### 2026-04-23 — PM design-locked sign-off (Gate 1–4 PASS)

PM sign-off executed per `feedback_pm_design_lock_sign_off.md` on Designer's scope-expansion delivery (42 typography sites across 4 route frames + 6 About sub-frames).

**Gate 1 — Artifact completeness: PASS**
- `frontend/design/homepage-v2.pen` — modified, 197,425 bytes, mtime 2026-04-23 19:13 (flush confirmed by user).
- `frontend/design/specs/K-040-designer-decision-memo.md` — present, contains `## Sitewide Typography Reset` section (line 119) with 36-row per-site calibration table + NavBar + Footer audit summaries + italic suppression verification.
- 13 JSON specs under `frontend/design/specs/` — all mtime 2026-04-23 (18:23–19:07); 9 new homepage-v2 frame files added, 6 about-v2 frame files modified.
- 11 PNG screenshots under `frontend/design/screenshots/` — all mtime 2026-04-23; `side-by-side-typography-K040.png` (1.48MB 4-route composite) + `side-by-side-footer-4routes-K040.png` present.
- `docs/retrospectives/designer.md` — entry prepended (line 17) for 2026-04-23 K-040 sitewide scope expansion; root cause "applied BQ-Hero literal to scope narrowing" codified.
- `~/.claude/projects/-Users-yclee-Diary/memory/feedback_designer_font_token_audit.md` — new memory file (2.85 KB, 41 lines), enforces sitewide token-audit pre-batch_design.
- `~/.claude/projects/-Users-yclee-Diary/memory/MEMORY.md` — index updated at line 99 pointer to new feedback file.

**Gate 2 — Side-by-side + JSON spec parity: PASS (9/9 spot-checks)**

Cross-checked decision-memo §Per-site font-size calibration table against JSON spec nested `font.family` / `font.style` / `font.size` values:

| Site | Expected (memo) | JSON actual | Result |
|------|-----------------|-------------|--------|
| Home Hero H1 line1 (`rXURl`, 4CsvQ) | Mono 56 normal | family=Geist Mono, style=absent, size=56 | ✓ |
| Home Hero H1 line2 (`2bQtY`, 4CsvQ) | Mono 56 normal | family=Geist Mono, style=absent, size=56 | ✓ |
| About PageHeader H1 line1 (`nolk3`, wwa0m) | Mono 52 normal | family=Geist Mono, style=normal, size=52 | ✓ |
| About PageHeader H1 line2 (`02p72`, wwa0m) | Mono 52 normal | family=Geist Mono, style=normal, size=52 | ✓ |
| About MetricCard m2 big number (`pArmD`, BF4Xe) | Mono 64 normal | family=Geist Mono, style=normal, size=64 | ✓ |
| About MetricCard title (`iRhDo`, BF4Xe) | Mono 22 normal | family=Geist Mono, style=normal, size=22 | ✓ |
| About PillarCard title (`BTiRG`, UXy2o) | Mono 20 normal | family=Geist Mono, style=normal, size=20 | ✓ |
| Diary Hero H1 (`g2RUM`, wtC03) | Mono 52 normal | family=Geist Mono, style=normal, size=52 | ✓ |
| Diary Hero subtitle (`PKZXk`, wtC03) | Mono 15 normal | family=Geist Mono, style=normal, size=15 | ✓ |
| BL gate H1 (`DYAX8`, VSwW9) | Mono 36 normal | family=Geist Mono, style=normal, size=36 | ✓ |
| BL form field title (`AvEbq`, VSwW9) | Mono 18 normal | family=Geist Mono, style=normal, size=18 | ✓ |

Full-JSON Bodoni/Newsreader/italic audit across 4 route frames + 4 footer frames: all remaining occurrences confined to `generatorNote` + `previousFontFamily` history-tracking fields — **zero live font-value residue**. Side-by-side `side-by-side-typography-K040.png` (1440×approx canvas per route, 4-up composite) visually confirms sans-serif monospace voice on Hero / About PageHeader / Dev Diary section / Business Logic gate — no italic serif glyphs visible anywhere in the composite.

**Gate 3 — Footer byte-identity + NavBar: PASS**

Footer content-parity audit across `1BGtd` / `86psQ` / `ei7cl` / `2ASmw`:
- All 4 frames render text `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` + `This site uses Google Analytics to collect anonymous usage data.` verbatim.
- All 4 frames use `fontFamily: Geist Mono` size 11 weight normal letterSpacing 1.
- JSON-schema wrappers differ cosmetically (`cross-frame-parity` vs `crossFrameParity`; `exporter-version: 1.0` vs `parentPage`+`role`+`spec` wrapper; nodeId random strings differ) — **not Sacred violation**; K-034 `AC-034-P1-ROUTE-DOM-PARITY` applies to runtime `<footer>` outerHTML byte-identity which depends on prop-less `Footer.tsx` + identical text+font JSON values, both preserved.

NavBar audit across 4 route frames (`OSgI0` / `voSTK` / `vdJVv` / `B5PEH`):
- All 4 families = `Geist Mono` exclusively.
- Only Bodoni hits (2 in VSwW9) are `previousFontFamily` historical-tracking fields on non-NavBar sibling nodes — **zero live NavBar regression**.

**Gate 4 — AC-040-SITEWIDE-FONT-MONO coverage: PASS (with Engineer-phase carryover notes)**

AC sub-clause verification against Designer artifacts:
- Bodoni → Geist Mono sitewide: memo §Scope executed enumerates 42 sites across 4 frames. ✓
- Italic OFF sitewide: memo §Italic suppression verification documents post-`batch_get` spot-check on 7 nodes — no `fontStyle` key present (schema emits normal as absence). ✓
- Per-site size calibration table: memo §Per-site font-size calibration table has 36 rows with (Context, Previous, New (Mono), Ratio) — Engineer 1-to-1 reference. ✓
- Konva `timelinePrimitives.ts:30` literal — memo §Item 1 scope confirms Engineer responsibility; Designer correctly did not touch source code, only noted as handoff item. ✓
- `<code class="not-italic">` `ReliabilityPillarsSection` (BQ-040-06) — memo references `not-italic` strip as Engineer Phase-3 scope; Designer correctly flagged the 3 defensive overrides become no-op under new sitewide mono. ✓
- `tailwind.config.js` `display` + `italic` key removal + `index.css` body `@apply font-mono` — Engineer-phase concerns (outside Designer scope); memo implicitly defers to Engineer.
- Grep raw-count sanity (pre=13/4/1/2, post=0/0/0/0) — Engineer-phase gate; Designer artifact does not contain source grep data by design.

**Carryover to Engineer phase (not a Designer BLOCK):**
- Engineer must apply 36-row memo table 1-to-1 to tailwind classes in `.tsx` sites (no creative extension per `feedback_engineer_design_spec_read_gate.md`).
- Engineer must retire `tailwind.config.js` `fontFamily.display` + `fontFamily.italic` keys.
- Engineer must add `body { @apply font-mono ... }` rule to `frontend/src/index.css` `@layer base`.
- Engineer must rewrite Konva `frontend/src/components/diary/timelinePrimitives.ts:30` font literal.
- Engineer must strip 3× `not-italic` in `ReliabilityPillarsSection.tsx`.
- Engineer must strip 60 `italic` class occurrences co-located with retired `font-display`.

**Gate 5 — Frontmatter flip: DONE**

`design-locked: false → true`. Gates 1–4 all pass; releasing to Architect next phase per §4 role sequencing (Phase 2 Architect decision: cross-cutting needed vs skip to Phase 3 Engineer).

**Gate 6 — Commit staging sanity: see PM report.**

