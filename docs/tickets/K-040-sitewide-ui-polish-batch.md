---
id: K-040
title: Sitewide UI polish batch — Sitewide font reset (Bodoni→Geist Mono), padding, footer spacing, mobile rail, /about protocol links
status: closed
phase: 0
type: polish
priority: medium
visual-delta: yes
content-delta: no
design-locked: true
qa-early-consultation: docs/retrospectives/qa.md 2026-04-23 K-040-early-consultation
created: 2026-04-23
closed: 2026-04-23
depends-on: []
related-to: [K-017, K-022, K-024, K-030, K-034]
worktree: .claude/worktrees/K-040-sitewide-ui-polish-batch
closed-commit: 76915d2
sacred-clauses: [AC-040-SITEWIDE-FONT-MONO]
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
- **And:** `frontend/src/components/diary/timelinePrimitives.ts:30` DOM token literal is rewritten from `'Bodoni Moda, serif'` to `'Geist Mono, ui-monospace, monospace'`, edited **ATOMICALLY** in the same commit with `docs/designs/K-024-visual-spec.json` — the JSON spec is the SSOT consumed by `frontend/e2e/diary-page.spec.ts:419-464` (T-E6 Playwright assertions on `heroTitle.font.family`, `entryTitle.font.family`, `entryDate.font.family`, `entryBody.font.family`). The token is NOT Konva canvas font shorthand (prior AC wording was factually wrong per QA-040-Q2); it is a DOM-consumed string literal sourced into React components via the visual-spec pipeline. The 4 JSON fields flip from `"Bodoni Moda"` / `"Newsreader"` → `"Geist Mono"`, and each field's `.style` flips to `"normal"`. Atomic-edit means: a single commit's diff touches both `timelinePrimitives.ts:30` + `docs/designs/K-024-visual-spec.json`, never one without the other — otherwise `diary-page.spec.ts:419` fails.
- **And:** grep raw-count sanity (per `feedback_refactor_ac_grep_raw_count_sanity.md`, pre-count is non-trivial so post=0 is meaningful):
    - `grep -rnE "\bfont-display\b" frontend/src/ --include='*.tsx'` — pre-count = **13** (PM grep 2026-04-23), post-count = **0**
    - `grep -rnE "font-\[.Bodoni_Moda.\]|fontFamily.*Bodoni" frontend/src/ --include='*.tsx' --include='*.ts'` — pre-count = **4** (PM grep 2026-04-23), post-count = **0**
    - `grep -rnE "'Bodoni Moda'|\"Bodoni Moda\"" frontend/src/ --include='*.ts' --include='*.tsx'` — pre-count = **1** (DOM token literal at `timelinePrimitives.ts:30`, PM grep 2026-04-23), post-count = **0**
    - `grep -nE "display:|italic:" frontend/tailwind.config.js` — pre-count = **2**, post-count = **0** (both keys removed)
    - `grep -nE '"Bodoni Moda"|"Newsreader"' docs/designs/K-024-visual-spec.json` — pre-count ≈ **8** (4 font.family fields + 4 adjacent style-metadata fields per QA-040-Q2 audit), post-count = **0**. This gate pairs with the `timelinePrimitives.ts:30` edit — JSON is the SSOT, TS literal mirrors it; both zero-out together.
- **And:** Playwright spot-check assertions on 1 representative page per route (Hero H1 on `/`, PageHeaderSection h1 on `/about`, DiaryHero h2 on `/diary`, ProjectLogicSection h2 on `/business-logic`) — each asserts (a) computed `font-family` contains `Geist Mono` or `ui-monospace` substring; (b) computed `font-style` is `normal` (not `italic`). Proves render-time font + italic state, not just class removal.
- **And:** Engineer rewrites the 4 stale Sacred E2E spec blocks enumerated in QA-040-Q1 **as part of this AC implementation** (NOT as regression): `about-v2.spec.ts:66-83` (AC-022-HERO-TWO-LINE — Bodoni Moda + italic assertions inverted to Geist Mono + style=normal, retaining text-content + two-line visual contract); `about-v2.spec.ts:114-131` (AC-022-SUBTITLE — 3 Newsreader italic × 5-section assertions inverted to Geist Mono + style=normal, retaining subtitle text-content contract); `about.spec.ts:43-56` (AC-017-HEADER — comment references removed, assertions inverted); `sitewide-fonts.spec.ts:18-33` (AC-021-FONTS — entire describe block premise inverted; `font-display` class no longer exists so assertions rewrite to `font-mono` default + body-level computed font family). Source Sacred AC blocks in K-017/K-021/K-022 have been retired-in-place 2026-04-23 by PM; see each ticket for retirement note.
- **And:** Engineer visually verifies a **4-viewport × 4-route matrix = 16 combinations** pre-handoff: viewports (375px iPhone / 640px sm-boundary / 1280px default desktop / 1920px wide desktop) × routes (`/`, `/about`, `/business-logic`, `/diary`). Each combination captured as a Playwright screenshot or dev-server walk note, documented in commit message body or ticket §8 release status (per QA-040-Q3 supplementation, closes the sm-boundary gap left by a 1920+375 only sweep).
- **And:** post-Engineer, `frontend/e2e/shared-components.spec.ts` snapshot suite re-runs; the 4 baseline snapshots (`footer-home-chromium-darwin.png` / `footer-about-chromium-darwin.png` / `footer-business-logic-chromium-darwin.png` / `footer-diary-chromium-darwin.png`) are checked for diff. Any route's snapshot diff requires per-route PM rationale recorded in §8 (no blanket `--update-snapshots`; per K-034 Phase 2 Challenge #8 snapshot-policy precedent). Snapshot regeneration, if approved, lands in a commit **separate** from the typography code change (per QA-040-Q4 supplementation).
- **And:** Playwright asserts every `<code>` tag rendered inside `frontend/src/components/about/ReliabilityPillarsSection.tsx` Pillar body (3 sites per page render) has computed `font-style: normal` post-strip — defensive regression guard for any future italic ancestor drift re-cascading italic onto mono code tags (per QA-040-Q6 supplementation, closes the regression window opened by the `not-italic` strip in BQ-040-06 Option A).
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

### PM close summary (2026-04-23)

**Outcome:** All 8 scope items + sitewide AC landed. Engineer BFP fix commit `a092598` (W-1 + W-2 + W-3 token semantic cleanup — zero runtime behavior change). Reviewer Step 2 depth re-verify: PASS (0 Critical / 0 Warning). QA regression: 114 passed / 1 skipped / 0 failed. Sacred invariants preserved: `AC-034-P1-ROUTE-DOM-PARITY` Footer byte-identity GREEN, `AC-038` NavBar consistency GREEN, `AC-040-SITEWIDE-FONT-MONO` GREEN.

**Role retrospectives (detail):** see `docs/retrospectives/pm.md`, `engineer.md`, `architect.md`, `reviewer.md`, `qa.md`, `designer.md` entries dated 2026-04-23.

**QA-flagged pre-existing flake (NOT a K-040 regression):** `frontend/e2e/ga-spa-pageview.spec.ts` — 9 test failures (SPA-NAV ×2, BEACON ×4, NEG ×3). QA verified pristine reproduction via `git checkout 66d9573` baseline → pre-existing. Provisional root cause: spec assumes Playwright isolated `webServer` but breaks when run against shared `npm run dev`. Engineer under-reported scale at BFP (claimed 1 flake; actual 9-test describe() collapse). **Filed as TD-001** (see `docs/tickets/TD-001-ga-spa-pageview-isolation.md`) — scope = isolated webServer config fix; NOT a K-040 blocker.

### 2026-04-23 — Post-close BQ-040-03 resolution + TD filing

**Trigger:** BQ-040-03 (`/diary` mobile rail drift vs intentional removal) was deferred to Designer Phase 1 at K-040 release time; Designer verdict landed after K-040 had already been marked `closed` + deployed at SHA `a092598`. Post-close BQ — not a reopen trigger.

**Designer verdict (2026-04-23):** **(b) design-removed** per 4 converging evidence sources — Pencil `.pen` has no mobile frame, K-024 §6.8 L784–786 explicitly locks `hidden sm:block`, E2E T-C6 asserts `display:none` at 390px, runtime `DiaryRail.tsx:15` + `DiaryMarker` match. Designer annotated SSOT `docs/designs/K-024-visual-spec.json` with `"mobileRail": "design-removed"` + rationale and filed `docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md` decision memo. Item 6 closed as no-op on path (b) of AC-040-DIARY-MOBILE-RAIL.

**User ruling (2026-04-23):** **Override Designer (b).** Mobile rail + marker must be restored on `/diary`. K-024 §6.8 original rationale ("1px rail clashes with marker in 24px padding; marker becomes orphan dot") is a real visual problem that Designer is now required to solve (reduce rail width, shift x, change color, or alternative primitive) — not silently revert to desktop spec which would recreate the clash.

**Not actioned immediately per user directive:** logged as **TD-002** (`docs/tickets/TD-002-diary-mobile-rail-restore.md`) — priority medium, status open. K-040 remains `closed` — not reopened. Designer decision memo preserved for audit trail; TD-002 will prepend it with "SUPERSEDED by TD-002" header when scheduled.

**Artifacts of this resolution turn (staged in K-040 worktree at close time, committed in this docs-only commit):**
- `docs/designs/K-024-visual-spec.json` — Designer annotations on `rail` + `marker` roles (`mobileRail: "design-removed"` + rationale, `mobileMarker: "design-removed"` + rationale). Flip target for TD-002.
- `docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md` — Designer's (b) verdict memo. Marked for TD-002 supersession at schedule time.
- `docs/retrospectives/designer.md` — Designer 2026-04-23 BQ-040-03 retro entry (triangulated evidence ruling + "post-close retro BQ" workflow improvement proposal).
- `docs/tickets/TD-002-diary-mobile-rail-restore.md` — TD file with 5 draft AC blocks, user override context, K-024 §6.8 visual-clash constraint.

**What went wrong (PM):** K-040 was marked `closed` at SHA `4d978c8` (then `a092598` after BFP) with AC-040-DIARY-MOBILE-RAIL accepted on BQ-deferred-to-Designer grounds, but Designer had not yet ruled when close happened. Close checklist did not require per-AC `resolved / deferred-to-TD / open` annotation. Designer BQ verdict arrived post-close, and required a post-close docs-only resolution + TD filing turn (this one) to reconcile. Structural gap: PM Phase Gate had no "all BQs ruled before close" hard check. Codify: PM close checklist must iterate every open BQ at close time and require each to be ruled + marked before flipping ticket to `closed` — see PM retro entry for codification target.

**Why not reopen K-040:** reopening would re-trigger QA regression (114 tests), deploy pipeline, PM-dashboard migration, and invite scope creep (user override for mobile rail + Designer visual-clash redesign = multi-role effort best held as its own TD). User directive was explicit: not immediate, TD track, K-040 stays closed. TD-002 carries the override cleanly without disturbing K-040's deployed artifact.

### Engineer

**AC judgments that were wrong:**

- `AC-040-SITEWIDE-FONT-MONO` T-E6 assertion in `diary-page.spec.ts:419-464` used `.toFixed(1)` on computed lineHeight (unitless-lineHeight × fontSize pattern per `feedback_numeric_tohavecss_traps.md`). Body font size 18→15 shift changed expected `1.55 × 15 = 23.25` but `.toFixed(1)` → `"23.3"` while browser emits literal `"23.25px"`. Persona guidance flagged the exact pattern; I missed it on first pass. Fix: swap to `parseFloat` + `Math.abs(diff) < 0.01` tolerance.

**Edge cases not anticipated:**

- HomePage.tsx container shape — before Item 3, `/` was the only route with Footer nested inside `max-w-[1248px]` wrapper; the 3 other routes have Footer outside max-w. Item 3 AC (desktop padding parity) was interpreted as a padding-only change, but achieving `/diary`-style padding parity at 1248px max-w while keeping Footer nested meant Footer width continued to lag the other routes. Only caught when `shared-components.spec.ts:182` Footer-home snapshot failed with 1088×87 vs 1280×87; root-cause analysis surfaced that Item 3 carried an implicit structural refactor, not just a padding tweak. Lesson: page-level container restructures have cascading effects on Footer width; Architect Route Impact Table should have flagged "`/` Footer width drift" as a secondary consequence alongside the primary padding change.
- Designer memo late-discovered BL `DYAX8` (48→36) + `AvEbq` (22→18 bold). My first-pass implementation missed these because the initial ticket-scope enumeration focused on Home/About/Diary; Designer's 36-row table included BL which I under-weighted because BL is pre-auth gate (low traffic). Lesson: memo row count > perceived page importance when planning site-crawl order.

**Next time improvement:**

- For any page-level container restructure (even when framed as "padding tweak"): capture Footer bounding-box width at each breakpoint before + after + compare all routes' Footer widths pairwise; flag divergence > 32px (1 Tailwind `sm:px-*` unit) as an Architect BQ before committing. This would have forced the HomePage full-bleed refactor to be a consciously-designed change, not a post-hoc snapshot-failure fix. Codified into `feedback_engineer_page_container_footer_width_parity.md` (to be authored same delivery round).

---

## 7. Deploy Record

**Deploy date:** 2026-04-24 02:48:48 (Asia/Taipei)
**Git SHA at deploy:** `a092598056a88803476c44eb323a954c70fab5c3`
**Hosting URL:** https://k-line-prediction-app.web.app
**Bundle hash:** `assets/index-B9AD9I7t.js` (live etag `142d1b3c73e2088b647aabffcb1749907a636d753eb08ff7aba27c3f90d49ae3`, Content-Length 176235)
**Firebase site:** `k-line-prediction-app` (16 files in frontend/dist, 4 new uploaded, release complete)

**Verification probes (executed at close time, layer = `frontend/src/**` add+remove):**

| Probe | Command | Expected | Actual |
|-------|---------|----------|--------|
| Positive — K-040 added `Geist Mono` sitewide | `curl -s <bundle> \| grep -oE "Geist Mono" \| wc -l` | ≥1 | **5** ✓ |
| Negative — K-040 removed `Bodoni Moda` | `curl -s <bundle> \| grep -oE "Bodoni Moda" \| wc -l` | 0 | **0** ✓ |
| Negative — K-040 removed `Newsreader` | `curl -s <bundle> \| grep -oE "Newsreader" \| wc -l` | 0 | **0** ✓ |
| Negative — K-040 removed `font-display` class | `curl -s <bundle> \| grep -oE '"font-display"' \| wc -l` | 0 | **0** ✓ |
| Sacred — K-034 AC-034-P1 Footer byte-identity (email preserved) | `curl -s <bundle> \| grep -oE "yichen\.lee\.20@gmail\.com" \| wc -l` | 1 | **1** ✓ |
| HTTP status | `curl -s -o /dev/null -w "%{http_code}" <bundle>` | 200 | **200** ✓ |

**Status:** Live. All 6 probes pass. Sitewide Bodoni→Geist Mono token reset verified against live CDN bundle; Sacred Footer signature preserved.

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

### 2026-04-23 — QA Early Consultation (K-040)

QA consulted 2026-04-23 per `feedback_qa_early_mandatory.md`. Log: `docs/retrospectives/qa.md` 2026-04-23 entry (`K-040-early-consultation`). QA verdict: CONDITIONAL PROCEED — PM must resolve Q1/Q2/Q4 before Engineer release; Q3/Q5/Q6 become Engineer-phase hard gates carried into AC.

**QA-040-Q1 resolution** — 4 stale Sacred AC blocks retired in source tickets (all currently `status: closed`, retired-in-place pattern per K-022 K-034-P2 precedent):

| Sacred AC | Source ticket | File line | Retirement note |
|---|---|---|---|
| `AC-021-FONTS` | `docs/tickets/K-021-sitewide-design-system.md` L115 | PM-edited 2026-04-23 | Three-font taxonomy inverted; entire `sitewide-fonts.spec.ts` premise rewrites |
| `AC-022-HERO-TWO-LINE` | `docs/tickets/K-022-about-structure-v2.md` L116 | PM-edited 2026-04-23 | Bodoni display + italic → Geist Mono + style=normal; text-content + 2-line layout preserved |
| `AC-022-SUBTITLE` | `docs/tickets/K-022-about-structure-v2.md` L127 | PM-edited 2026-04-23 | Newsreader italic subtitle → Geist Mono + style=normal; text-content preserved (K-034-P2 `DRIFT-D26-SUBTITLE-VERBATIM` still in force) |
| `AC-017-HEADER` | `docs/tickets/K-017-about-portfolio-enhancement.md` L169 | PM-edited 2026-04-23 | Hero display+italic voice → Geist Mono 52px style=normal; text-content + `{ exact: true }` preserved |

Engineer rewrites the 4 corresponding E2E spec blocks (`about-v2.spec.ts:66-83`, `about-v2.spec.ts:114-131`, `about.spec.ts:43-56`, `sitewide-fonts.spec.ts:18-33`) as part of AC-040-SITEWIDE-FONT-MONO — NOT as regression. Rewrite is scheduled inside Engineer phase 3 commit, before the full-route visual sweep gate.

**QA-040-Q2 resolution** — AC-040-SITEWIDE-FONT-MONO And-clause corrected: `timelinePrimitives.ts:30` is a **DOM token** consumed via `docs/designs/K-024-visual-spec.json` by `diary-page.spec.ts:419-464` T-E6, **not Konva canvas font shorthand** (prior AC wording was factually wrong). Atomic-edit gate added: `.ts` literal + `K-024-visual-spec.json` must flip together in a single commit, else T-E6 fails. Raw-count post=0 gate added for `docs/designs/K-024-visual-spec.json` (pre≈8 per QA audit — 4 `font.family` fields + 4 adjacent style fields).

**QA-040-Q3 resolution** — viewport matrix expanded from implicit 1920+375 to explicit `{375, 640, 1280, 1920} × {/, /about, /business-logic, /diary}` = 16 combinations (closes sm-boundary gap). Engineer documents sweep result in commit body or §8.

**QA-040-Q4 resolution** — `shared-components.spec.ts` snapshot gate + per-route rationale requirement + separate-commit rule added to AC. Blanket `--update-snapshots` prohibited (K-034 P2 Challenge #8 precedent carries).

**QA-040-Q5 resolution** — parallel risk accepted low (only K-039 role cards SSOT in flight; no overlap). Engineer re-greps pre-counts at implementation start and records in commit message per existing AC grep-sanity gate.

**QA-040-Q6 resolution** — `<code>` computed `font-style: normal` Playwright assertion added to AC-040-SITEWIDE-FONT-MONO for `ReliabilityPillarsSection` 3-site render (regression guard for future italic ancestor drift). Dark-mode / print-CSS non-issues accepted. Snapshot baseline regeneration policy = per-route PM rationale in §8 (same as Q4).

**Frontmatter verification:** `qa-early-consultation: docs/retrospectives/qa.md 2026-04-23 K-040-early-consultation` — confirmed present (line 11 at open of §0).

**Handoff check:** `qa-early-consultation = docs/retrospectives/qa.md 2026-04-23 K-040-early-consultation, visual-delta = yes, design-locked = true → OK for Architect release (or Phase-2-skip direct to Engineer per §4 role sequencing).`

### 2026-04-23 — Engineer delivery (2 commits landed, 1 open BQ)

**Commit 1:** `4bcaf84 feat(K-040): sitewide Bodoni → Geist Mono typography reset + polish Items 2/3/4/11/14` — 23 files. Covers Items 1/2/3/4/11/14 source edits (tailwind.config.js + index.css + 13 `font-display` strips + 4 inline Bodoni strips + timelinePrimitives.ts + K-024-visual-spec.json atomic + 36-row memo size calibration + DiaryPage `pb-24→pb-12` + DevDiarySection `mt-10` + HeroSection mobile `mt-6 sm:mt-0` + PillarCard `target="_blank"` + 3× GitHub blob URL rewrite + 3× `<code class="not-italic">` strip + diary-page.spec.ts T-E6 lineHeight rewrite).

**Commit 2:** `82d9bb9 feat(K-040): BL gate size calibration + HomePage full-bleed Footer refactor + E2E Sacred block rewrites` — 6 files. Covers Designer memo late-discovered BL/label sizes (`DYAX8` 48→36 + `AvEbq` 22→18 bold), HomePage.tsx container refactor (full-bleed Footer parity), and all 4 Sacred E2E spec block rewrites per QA-040-Q1 (about-v2.spec.ts AC-022 blocks + about.spec.ts AC-017 + sitewide-fonts.spec.ts full rewrite with 5 new T-AC040-H1-* / T-AC040-CODE-NOT-ITALIC IDs).

**Raw-count post-gates (all 5 = 0, re-verified post-Commit 2):**

| Gate | Pre | Post | Command |
|------|-----|------|---------|
| `font-display` class | 13 | 0 | `grep -rnE "\bfont-display\b" frontend/src/ --include='*.tsx'` |
| Bodoni inline style | 4 | 0 | `grep -rnE "font-\[.Bodoni_Moda.\]\|fontFamily.*Bodoni" frontend/src/` |
| Bodoni literal | 1 | 0 | `grep -rnE "'Bodoni Moda'\|\"Bodoni Moda\"" frontend/src/` |
| tailwind.config.js keys | 2 | 0 | `grep -nE "display:\|italic:" frontend/tailwind.config.js` |
| visual-spec.json Bodoni/Newsreader/italic | 8 | 0 | `grep -nE '"Bodoni Moda"\|"Newsreader"' docs/designs/K-024-visual-spec.json` |

**Full Playwright suite:** 258 passed / 1 skipped / 2 failed.

- **Failure 1 — K-040 Item 3 snapshot drift (expected, BQ-040-SNAPSHOT below):** `shared-components.spec.ts:182 Footer snapshot on /` baseline = 1088×87; post-refactor actual = 1280×87. Byte-identity T1 (`AC-034-P1-ROUTE-DOM-PARITY`) still PASS — Footer `outerHTML` preserved exactly; only Footer's rendered pixel width changed because HomePage container refactor moved Footer from inside the `max-w-[1248px]` wrapper to outside (matches /about /diary /business-logic pattern). Cross-route Footer pixel parity is now **stronger** than before (all 4 routes render Footer at viewport width instead of /home being uniquely clipped).
- **Failure 2 — Unrelated pre-existing:** `ga-spa-pageview.spec.ts:142 AC-020-BEACON-SPA` — K-020 partial delivery (see `docs/retrospectives/engineer.md` 2026-04-22 K-020 entry). Not a K-040 regression; `useGAPageview` manual `gtag('event','page_view')` under `send_page_view: false` does not emit `/g/collect` beacon on SPA navigation. Tracked in K-032 (not this ticket's scope).

**16-viewport visual sweep (QA-040-Q3 gate, all 16 PASS):**

| Viewport | `/` | `/about` | `/diary` | `/business-logic` |
|----------|-----|----------|----------|-------------------|
| 375×812 | body/h1/footer Geist Mono ✓, footer 375×119 (wrapped) ✓ | body/h1/footer Geist Mono ✓, footer 375×119 ✓ | body/h1/footer Geist Mono ✓, footer 375×119 ✓ | body/h1/footer Geist Mono ✓, footer 375×119 ✓ |
| 640×900 | body/h1/footer Geist Mono ✓, footer 640×86 (single-row) ✓ | body/h1/footer Geist Mono ✓, footer 640×86 ✓ | body/h1/footer Geist Mono ✓, footer 640×86 ✓ | body/h1/footer Geist Mono ✓, footer 640×86 ✓ |
| 1280×800 | body/h1/footer Geist Mono ✓, footer 1280×86 ✓ | body/h1/footer Geist Mono ✓, footer 1280×86 ✓ | body/h1/footer Geist Mono ✓, footer 1280×86 ✓ | body/h1/footer Geist Mono ✓, footer 1280×86 ✓ |
| 1920×1080 | body/h1/footer Geist Mono ✓, footer 1920×86 ✓ | body/h1/footer Geist Mono ✓, footer 1920×86 ✓ | body/h1/footer Geist Mono ✓, footer 1920×86 ✓ | body/h1/footer Geist Mono ✓, footer 1920×86 ✓ |

Every cell verified: `bodyFF` = `"Geist Mono", monospace`, `h1FF` = `"Geist Mono", monospace`, `h1Style` = `normal`, `footerFF` = `"Geist Mono", monospace`. PNG artifacts captured under `/tmp/K-040-sweep/<route>-<vp>.png` (16 PNGs; discarded locally post-verification — not committed). Mobile 375w footer wraps to 2-row layout yielding 119px height; all other breakpoints single-row at 86px. **Home footer width at 1280w/1920w now matches /about /diary /business-logic exactly** (validates Item 3 structural parity).

**BQ-040-SNAPSHOT (Engineer → PM, blocks ticket close):**

| Question | Detail |
|----------|--------|
| Context | K-040 Item 3 refactored `HomePage.tsx` container from `<div className="min-h-screen pt-8 pb-8 ... max-w-[1248px]">` (Footer nested inside) to full-bleed outer `<div className="min-h-screen">` hosting Footer at viewport width, with `max-w-[1248px]` scoped to inner content wrapper. Rationale: brings `/` into structural parity with /about /diary /business-logic (all of which render Footer outside max-w container). Before: `/` uniquely clipped Footer to 1088px inner width. After: `/` renders Footer at 1280px viewport width like all other routes. |
| Sacred integrity | `AC-034-P1-ROUTE-DOM-PARITY` T1 (byte-identity) PASS — Footer `outerHTML` character-for-character identical across all 4 routes (including `/`). Only the Footer's rendered pixel width changed; the DOM/text/font/class/structure is unchanged. |
| Consequence | `shared-components.spec.ts:182 Footer snapshot on /` baseline image `footer-home-chromium-darwin.png` (1088×87) no longer matches runtime (1280×87). Baseline is stale. |
| Option A — regenerate snapshot | Run `npx playwright test shared-components.spec.ts --update-snapshots --grep "Footer snapshot on /"` (scoped to the 1 failing snapshot, NOT blanket). Commit the new PNG in a separate "chore(K-040): regen /home Footer snapshot after Item 3 full-bleed refactor" commit. Rationale: the baseline captured pre-refactor clipped state that was itself the bug Item 3 fixed. New baseline captures the target design. **Engineer recommends Option A** — rationale: full-bleed Footer at 1280w is the design intent (matches other routes), K-034 Sacred byte-identity still holds, snapshot is a pixel proxy for byte-identity which remains green. |
| Option B — revert Item 3 structural refactor | Restore `HomePage.tsx` to prior nested-container shape so Footer re-clips to 1088px inner width. Preserves old snapshot baseline. **Not recommended** — reinstates the exact cross-route Footer pixel inconsistency that Item 3 was scoped to fix. Would require re-opening AC-040-HOME-DESKTOP-PADDING Item 3 because desktop padding alignment is now intertwined with Footer width. |
| Option C — keep snapshot red, accept partial | Mark K-040 `status: partial`, close Items 1/2/4/11/14, spin off Item 3 into a separate ticket with Footer baseline regen scheduled. **Not recommended** — Item 3 structural fix is landed and tested green (visual sweep 16/16 PASS); only the snapshot baseline lags. Partial-close would introduce unnecessary coordination overhead. |
| Engineer decision | None — PM rules Option A vs B vs C. If Option A: Engineer executes `--update-snapshots` (scoped) + separate commit + ticket §8 appends regen rationale. If Option B: Engineer reverts HomePage.tsx + re-runs grep gates + sweep. If Option C: Engineer marks ticket partial + spins off Item 3 sub-ticket. |
| PM ruling (2026-04-23) | **Option A — scoped snapshot regeneration.** Rationale: OLD baseline captured pre-Item-3 bug (home-unique 1088px Footer clip); NEW baseline captures design intent (all 4 routes identical 1280px viewport width). Sacred byte-identity PASS preserved. QA-040-Q4 per-route regen permitted with PM rationale (this block). Engineer executes `--update-snapshots` scoped to the 1 failing snapshot + separate commit. Do NOT blanket regen other snapshots. |

### 2026-04-23 — PM ruling BQ-040-SNAPSHOT: Option A

**Directive to Engineer:**
1. Run `npx playwright test frontend/e2e/shared-components.spec.ts --update-snapshots --grep "Footer snapshot on /"` (scoped to 1 snapshot)
2. Verify only `frontend/e2e/shared-components.spec.ts-snapshots/footer-home-chromium-darwin.png` was regenerated (git diff --stat)
3. Commit: `chore(K-040): regen /home Footer snapshot after Item 3 full-bleed refactor` with rationale citing this PM ruling
4. Run full Playwright suite — confirm now 259 passed / 1 skipped / 1 failed (remaining failure = pre-existing K-020, not K-040)
5. Report regen diff to main session

**Post-regen gates:**
- All K-040 AC hard gates green (raw-count, 16-viewport, sitewide font)
- Snapshot green
- Ticket status flips to ready for Code Review (Step 1 superpowers breadth + Step 2 reviewer.md depth)

**Open ticket status:** `status: open` (PM ruled Option A, awaiting Engineer scoped regen). All other ACs green. Engineer retrospective populated in §6 Retrospective + `docs/retrospectives/engineer.md` prepended.

### 2026-04-23 — Engineer executed BQ-040-SNAPSHOT Option A

**Scoped regen:**
- Grep pattern `"Footer snapshot on /$"` verified via `--list` → matches exactly 1 test (`Footer snapshot on /`, not /about//business-logic//diary).
- `npx playwright test shared-components.spec.ts --grep "Footer snapshot on /$" --update-snapshots` executed — 1 passed (new baseline written).
- `git diff --name-only` post-regen: only `frontend/e2e/shared-components.spec.ts-snapshots/footer-home-chromium-darwin.png` changed. Other 3 route baselines untouched.

**Full-suite verification:**
- Re-run `npx playwright test` → **259 passed / 1 skipped / 1 failed** matches PM-predicted target.
- Remaining failure: `ga-spa-pageview.spec.ts:142 AC-020-BEACON-SPA` — pre-existing K-020 regression tracked in K-032, not K-040 scope.
- T-L1 `diary-loading visible` flakiness observed on one run (passed on isolation + second full-suite run 259/1/1) — intermittent race, not K-040-induced.

**Commit:** `338e670 chore(K-040): regen /home Footer snapshot after Item 3 full-bleed refactor` (1 file, PNG rewrite 99%).

**Post-regen gates (all PASS):**
- Sacred `AC-034-P1-ROUTE-DOM-PARITY` T1 byte-identity: still green (Footer outerHTML char-for-char equal across 4 routes — snapshot regen only touches pixel-bounding-box, not DOM shape).
- Raw-count gates: all 0 (enforced since 82d9bb9).
- 16-viewport visual sweep: unchanged (not re-run, no code change since prior sweep).
- Sitewide font AC: enforced by earlier commits.

**Next step:** ticket ready for Code Review (Step 1 `superpowers:requesting-code-review` breadth + Step 2 `Agent(reviewer.md)` depth merge → PM rulings → QA regression → PM close).

