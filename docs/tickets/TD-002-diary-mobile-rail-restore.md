---
id: TD-002
title: /diary mobile rail + marker restoration — user override of K-024 §6.8 design-removed intent
status: open
type: TD
priority: medium
source: K-040 BQ-040-03 user override (post-close resolution 2026-04-23)
created: 2026-04-23
related-to: [K-024, K-027, K-040]
supersedes-designs:
  - docs/designs/K-024-diary-structure.md §6.8 L784–786 (mobile rail hidden)
  - docs/designs/K-024-visual-spec.json rail.mobileRail "design-removed" + marker.mobileMarker "design-removed"
  - docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md (Designer (b) verdict)
---

## 1. Context

During K-040 close (2026-04-23), Designer Phase 1 ruling on **BQ-040-03 — /diary mobile rail: drift vs intentional removal** concluded **(b) design-removed** on four converging evidence sources: Pencil `.pen` contains no mobile frame, K-024 design doc §6.8 L784–786 explicitly locks `hidden sm:block` on rail + marker, E2E `diary-page.spec.ts` T-C6 asserts `display:none` at 390px, runtime `DiaryRail.tsx:15` and `DiaryMarker` match. Designer annotated SSOT `docs/designs/K-024-visual-spec.json` with `"mobileRail": "design-removed"` + rationale, filed `docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md` decision memo, and K-040 Item 6 closed as no-op (AC-040-DIARY-MOBILE-RAIL satisfied on path (b)).

**Post-close user directive (2026-04-23):** user **overrides** Designer (b) verdict — mobile rail + marker must be restored on `/diary`. K-024 §6.8 original rationale ("1px rail in 24px left padding clashes with marker visually; marker becomes orphan dot") is a real visual problem that design did not solve — Designer must solve it this time (reduce rail width, shift x position, change color, or alternative layout). Feature, not regression revert.

**Not immediately actioned:** logged as Tech Debt for later scheduling per user directive (K-040 stays closed, not reopened).

## 2. Scope

**In scope:**
- Designer opens `frontend/design/homepage-v2.pen` (or forks a mobile variant) and produces a `<640px` mobile Diary frame with explicit rail + marker layout that resolves the K-024 §6.8 visual clash (not just a copy of desktop spec).
- Designer delivers `docs/designs/TD-002/*.json` (Pencil SSOT snapshot) + `docs/designs/TD-002/screenshots/*.png` per `feedback_designer_json_sync_hard_gate.md` — touched-frames only.
- Engineer removes `hidden sm:block` from `DiaryRail.tsx:15` and `DiaryMarker` (make visibility unconditional or mobile-specific visibility spec per Designer output).
- Engineer updates `frontend/e2e/diary-page.spec.ts` T-C6: reverse `display:none` assertion at 390px → `display:block` + per-Designer-spec numeric checks (rail width, marker x offset, etc.).
- PM edits `docs/designs/K-024-visual-spec.json`: flip `"mobileRail": "design-removed"` → concrete layout object (width, color, x, top/bottom insets) per Designer output; same for `marker.mobileMarker`.
- PM edits (or new override memo under `docs/designs/TD-002/`) superseding `docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md` — mark as "superseded by TD-002 user override" without deleting the original memo (preserves audit trail).
- PM edits K-024 design doc §6.8 L784–786: mark original design-removed rationale as "REVISED per TD-002 user override 2026-04-XX" + insert new mobile layout specs.

**Out of scope:**
- Desktop `/diary` rail + marker — unchanged.
- K-024 Phase 3 shared Footer adoption — landed, unrelated.
- Sacred `AC-034-P1-ROUTE-DOM-PARITY` Footer byte-identity — preserved (rail + marker live inside DiaryTimeline, not Footer).

## 3. Constraints

### K-024 §6.8 visual-clash problem — must be solved (not just ignored)

The original design-removed verdict was not arbitrary. K-024 §6.8 L784–786 recorded two concrete visual problems:

1. **Rail-marker overlap at tight mobile width:** 1px rail lives in 24px left padding; marker (20×14) absolute-positioned inside entry wrapper at `x=20 y=10` visually overlaps the rail line.
2. **Orphan-marker risk:** if rail is present but color-washes out at mobile contrast, marker reads as disconnected dots.

Designer must produce a mobile layout that demonstrably resolves both. Plausible approaches Designer may explore (not prescriptive):
- Reduce rail width below 1px (sub-pixel) or use dashed/dotted rail for visual lightness.
- Shift rail x position outside marker bounding box (e.g., left of 24px padding vs inside it).
- Increase left padding on mobile entry wrapper to give rail+marker room.
- Use a different visual primitive on mobile (e.g., left border on entry card instead of standalone rail).

Whichever approach lands, Designer must document the decision in a new `docs/designs/TD-002/mobile-rail-restore-decision.md` memo explaining why the chosen approach solves the clash (not just "user said restore, so restored").

### Sacred preservation

- `AC-034-P1-ROUTE-DOM-PARITY` Footer byte-identity (`shared-components.spec.ts:31-60`): unchanged — rail + marker live in DiaryTimeline, not Footer.
- `AC-038` NavBar consistency: unchanged — rail + marker do not touch NavBar.
- K-024 `AC-024-CONTENT-WIDTH` / other T-Cx assertions: re-audit T-C6 only; remaining T-Cx unchanged.
- Desktop `/diary` behavior at ≥640px: unchanged. Regression test: desktop rail+marker render identically pre/post TD-002.

## 4. Acceptance criteria (draft — to be refined when scheduled)

### AC-TD002-MOBILE-RAIL-VISIBLE

- **Given:** `/diary` at mobile viewport (< 640px).
- **When:** diary entries render.
- **Then:** the vertical rail line and per-entry candle markers are visible on screen (computed `display:block` on both `DiaryRail` and `DiaryMarker`).
- **And:** layout matches Designer's new mobile `.pen` frame + exported `docs/designs/TD-002/*.json` — specifically `rail.width` / `rail.x` / `rail.color` / `marker.x` / `marker.width` / `marker.height` as machine-readable spec.
- **And:** no visual overlap between rail line and marker glyph (QA visual inspection + side-by-side screenshot comparison at 375 / 390 / 430 / 480 / 600 / 639px viewports).

### AC-TD002-E2E-REVERSED

- **Given:** `frontend/e2e/diary-page.spec.ts` T-C6.
- **When:** E2E regression runs at 390px viewport.
- **Then:** `DiaryRail` + `DiaryMarker` computed style `display` asserts `block` (not `none`).
- **And:** numeric assertions added for rail width + marker position per Designer JSON spec — if Designer specifies rail width = 0.5px, assertion `toMatchComputedStyle({ width: /0\.5(px)?/ })` equivalent.
- **And:** desktop 1440px T-C5 or equivalent `display:block` assertion unchanged (pre-existing desktop behavior preserved).

### AC-TD002-DESIGN-SSOT-FLIPPED

- **Given:** `docs/designs/K-024-visual-spec.json`.
- **When:** Designer completes mobile frame export.
- **Then:** `rail.mobileRail` and `marker.mobileMarker` fields are no longer `"design-removed"` strings — replaced with concrete object (width, x, color, visibility, viewport-range).
- **And:** `rail.mobileRailRationale` and `marker.mobileMarkerRationale` fields updated to reference TD-002 override (or removed with TD-002 note).
- **And:** `docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md` prepended with top-of-file note: `**SUPERSEDED by TD-002 on YYYY-MM-DD** — user override restored mobile rail; see \`docs/designs/TD-002/mobile-rail-restore-decision.md\`.` (preserves the original memo for audit).

### AC-TD002-K024-DOC-REVISED

- **Given:** `docs/designs/K-024-diary-structure.md` §6.8 L784–786.
- **When:** TD-002 lands.
- **Then:** §6.8 mobile spec table rows for Rail + Marker flip from `hidden sm:block` / design-removed rationale → new mobile spec rows mirroring Designer JSON + clash-resolution note.
- **And:** inline edit header: `**REVISED per TD-002 (YYYY-MM-DD)** — user override; original design-removed rationale retired per new mobile-rail-restore-decision.md`.

### AC-TD002-REGRESSION-SACRED

- **Given:** full `npx playwright test` after TD-002 implementation.
- **When:** regression sweep runs.
- **Then:** `shared-components.spec.ts` AC-034-P1 Footer byte-identity: GREEN (unchanged).
- **And:** `diary-page.spec.ts` all other T-Cx assertions: GREEN (desktop rail+marker, content width, entry structure, footer spacing).
- **And:** `diary-homepage.spec.ts` homepage-side diary section tests: GREEN (not affected by /diary-internal layout change).
- **And:** total test count does not decrease (TD-002 adds mobile rail assertion, does not silently drop existing ones).

## 5. Risk notes

- K-024 §6.8 original design reasoning ("rail + marker visual clash in 24px left padding") is a real visual problem. Designer must solve it, not ignore it. If Designer concludes after exploration that the clash is genuinely unresolvable at mobile widths < 640px, escalate back to user as BQ — do NOT silently revert to desktop spec values (will recreate the clash user originally saw and may not have liked).
- User override ≠ free lunch. The original design-removed decision was documented with 4 evidence sources. Flipping it without new design work = drift.
- Touched frames: Diary mobile frame (new). Existing desktop Diary frame `wiDSi` unchanged. Per `feedback_designer_json_sync_hard_gate.md` — only export touched frames.

## 6. Links

- **K-040 close** — `docs/tickets/K-040-sitewide-ui-polish-batch.md` §5 BQ-040-03 + §6 Retrospective 2026-04-23 post-close resolution entry.
- **Superseded Designer ruling memo** — `docs/designs/K-040-sitewide-ui-polish-batch/diary-mobile-rail-decision.md` (kept for audit trail; TD-002 overrides verdict).
- **K-024 Phase design source** — `docs/designs/K-024-diary-structure.md` §6.8 L784–786 (mobile rail spec to be revised).
- **K-024 visual spec SSOT** — `docs/designs/K-024-visual-spec.json` `rail` / `marker` roles (mobileRail / mobileMarker fields to flip).
- **K-027** — prior mobile /diary layout ticket; overlapping-marker fix context (rail was already removed on mobile then).
- **Runtime components to change** — `frontend/src/components/diary/DiaryRail.tsx:15` + `DiaryMarker` (`hidden sm:block` classes to remove or replace).
- **E2E to reverse** — `frontend/e2e/diary-page.spec.ts` T-C6.

## 7. Priority rationale

**Medium** — user explicitly requested restoration but explicitly scoped as Tech Debt (not a K-040 blocker, not hotfix). No production defect: `/diary` currently renders per documented design intent (rail+marker hidden on mobile, desktop rail+marker fully functional). Impact is visual polish / timeline decoration recovery on mobile, not a broken feature. Schedule with next /diary-scoped ticket or when Designer bandwidth allows. Must NOT leak ahead of higher-priority tickets (K-018 GA tracking, K-032/K-033 GA fixes).

## 8. Open questions for when this TD is scheduled

- **Designer:** can K-024 §6.8 visual clash be solved at 390px / 375px viewport, or is there a viewport threshold where rail must still hide? (If yes, AC-TD002-MOBILE-RAIL-VISIBLE needs a lower-bound viewport annotation.)
- **PM:** is TD-002 scope limited to `/diary` mobile, or does it imply similar mobile-timeline treatment on any homepage Diary section rendering? (Homepage uses different component set; check at schedule time.)
- **QA:** Playwright viewport matrix — which device presets should T-C6 reversed assertion run against? Current /diary mobile E2E runs at 390px only; adding 375 (iPhone SE) + 430 (iPhone 15 Pro Max) + 768-1 edge would widen coverage.
