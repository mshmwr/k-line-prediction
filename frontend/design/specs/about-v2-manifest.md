# /about Pencil Frame Manifest (K-034 Phase 2)

**Source `.pen` file:** `frontend/design/homepage-v2.pen`
**Parent frame:** `35VCj` — "About /about (K-017 v2)" (1440px wide, 8 sections)
**Export date:** 2026-04-23
**Pencil mtime at export:** 2026-04-21T19:52:16+0800

> Note: invocation prompt referenced `about-v2.pen`, but no such file exists. All /about content lives in `homepage-v2.pen` under top-level frame `35VCj` (per active-editor inventory verified via `mcp__pencil__get_editor_state`). Filename convention `about-v2.frame-<id>.json` preserved as instructed.

## Frame Inventory

| Frame ID | Section Name (Pencil) | AboutPage.tsx Component | JSON File | PNG Screenshot |
|----------|----------------------|-------------------------|-----------|----------------|
| `voSTK` | abNav (NavBar) | `<UnifiedNavBar />` | `about-v2.frame-voSTK.json` | `about-v2-voSTK.png` |
| `wwa0m` | S1_PageHeaderSection | `<PageHeaderSection />` (S1) | `about-v2.frame-wwa0m.json` | `about-v2-wwa0m.png` |
| `BF4Xe` | S2_MetricsStripSection (Nº 01 — DELIVERY METRICS, 4 metric cards) | `<MetricsStripSection />` (S2) | `about-v2.frame-BF4Xe.json` | `about-v2-BF4Xe.png` |
| `8mqwX` | S3_RoleCardsSection (Nº 02 — THE ROLES, 6 role cards: PM / Architect / Engineer / Reviewer / QA / Designer) | `<RoleCardsSection />` (S3) | `about-v2.frame-8mqwX.json` | `about-v2-8mqwX.png` |
| `UXy2o` | S4_ReliabilityPillarsSection (Nº 03 — RELIABILITY, 3 pillar cards: Persistent Memory / Structured Reflection / Role Agents) | `<ReliabilityPillarsSection />` (S4) | `about-v2.frame-UXy2o.json` | `about-v2-UXy2o.png` |
| `EBC1e` | S5_TicketAnatomySection (Nº 04 — ANATOMY OF A TICKET, 3 ticket case files: K-002 / K-008 / K-009) | `<TicketAnatomySection />` (S5) | `about-v2.frame-EBC1e.json` | `about-v2-EBC1e.png` |
| `JFizO` | S6_ProjectArchitectureSection (Nº 05 — PROJECT ARCHITECTURE, 3 layer cards: Monorepo / Docs-driven / Testing pyramid) | `<ProjectArchitectureSection />` (S6) | `about-v2.frame-JFizO.json` | `about-v2-JFizO.png` |
| `86psQ` | abFooterBar | `<Footer />` (shared/Footer, S7) | `homepage-v2.frame-86psQ.json` (preserved from K-034 Phase 1) | `about-v2-86psQ.png` + `homepage-v2-86psQ.png` |
| `QwyrN` | DisclaimerSection (K-060) | `<DisclaimerSection />` (below footer) | `about-v2.frame-QwyrN.json` | (PNG pending — Pencil screenshot transport not available from CLI) |
| `35VCj` (full page) | About /about (K-017 v2) — complete frame | entire `AboutPage.tsx` | (not re-exported; parent of all above) | `about-v2-35VCj-full.png` |

## K-060 Addendum (2026-04-28)

K-057 shipped `DisclaimerBanner` + `DisclaimerSection` to all three pages (`/`, `/about`, `/diary`) without Pencil SSOT. K-060 backfills the spec:

| New Frame | Node ID | Position in 35VCj | Spec File |
|---|---|---|---|
| DisclaimerBanner | `qnQHQ` | index 0, above `voSTK` (abNav) | `about-v2.frame-qnQHQ.json` |
| DisclaimerSection | `QwyrN` | last position, below `86psQ` (abFooterBar) | `about-v2.frame-QwyrN.json` |

Screenshots blocked: `get_screenshot` requires VS Code Pencil app transport (not available from Claude Code CLI). Screenshots to be exported manually via Pencil app or in next Designer session with VS Code active.

## Drift Flags

### DRIFT-P2-MISSING-FRAME — `DossierHeader` (A-2)

- **Component in code:** `frontend/src/components/about/DossierHeader.tsx` (A-2 — AC-022-DOSSIER-HEADER)
- **Rendered at:** `AboutPage.tsx` line 33, between `<UnifiedNavBar />` and `<SectionContainer id="header">`
- **Default props:** `fileNo="K-017 / ABOUT"`, renders "FILE Nº · K-017 / ABOUT" bar in charcoal background
- **Pencil status:** NO matching frame in `35VCj`; searched patterns `[Dd]ossier`, `[Hh]eader[Bb]ar`, `[Aa]bHeader`, `A-2` — zero results
- **35VCj children actually present:** `voSTK` (abNav), `Y80Iv` (abBody — contains S1-S6), `86psQ` (abFooterBar); no dossier-header sibling
- **Implication:** React component rendered on /about has no visual source-of-truth in Pencil design — Engineer / Reviewer / QA have nothing to diff JSX against
- **Recommendation:** Architect/PM decide — either (a) retire `DossierHeader` component from AboutPage.tsx if the visual was superseded by per-card `FILE Nº` bars, or (b) Designer backfill a `DossierHeader` frame into `35VCj` between `voSTK` and `Y80Iv` with the exact spec (bg `#2A2520`, text `#F4EFE5`, Geist Mono 10px, letter-spacing 2, padding `[6, 72]`)

## Counts

- **Total /about frames found in `homepage-v2.pen`:** 8 (7 dumped this session + 1 re-used from Phase 1: `86psQ`)
- **AboutPage.tsx top-level components expected:** 9 (`UnifiedNavBar`, `DossierHeader`, `PageHeaderSection`, `MetricsStripSection`, `RoleCardsSection`, `ReliabilityPillarsSection`, `TicketAnatomySection`, `ProjectArchitectureSection`, `Footer`)
- **DRIFT count:** 1 (`DossierHeader`)

## JSON files created (absolute paths)

- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-voSTK.json`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-wwa0m.json`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-BF4Xe.json`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-8mqwX.json`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-UXy2o.json`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-EBC1e.json`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/about-v2.frame-JFizO.json`

Preserved from K-034 Phase 1 (footer, same `.pen` frame ID shared across /about and /home at Phase 1):

- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/homepage-v2.frame-86psQ.json` — /about footer
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/specs/homepage-v2.frame-1BGtd.json` — /home footer

## PNG files created (absolute paths)

- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-voSTK.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-wwa0m.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-BF4Xe.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-8mqwX.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-UXy2o.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-EBC1e.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-JFizO.png`
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-35VCj-full.png` (full-page overview)
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/screenshots/about-v2-86psQ.png` (footer copy for /about naming consistency)

## K-058 Phase 1.5 Addendum (2026-04-28)

### omyb7 (SY_RolePipelineSection) — Table removed, SVG placeholder added

**Change:** PM decision to remove role-owns-artefact table (node `qRYhe` / rpRolesTable) from `omyb7`.

**Rationale:** Table duplicated compact role cards already present in `8mqwX` below.

**omyb7 children after K-058 Phase 1.5:**
| Node ID | Name | Type | Notes |
|---------|------|------|-------|
| `c9Cc2` | rpHead | frame | Section header — unchanged |
| `g0IvrE` | rpDesc | text | Description — unchanged |
| `xu3l7` | rpPillsRow | frame | Pills row — unchanged |
| `ZIExb` | rpSvgPlaceholder | frame | **NEW** — 200px tall, fill `#EDE8DE`, dashed border `#8B7A6B`; marks SVG inject point |

**Deleted:** `qRYhe` (rpRolesTable) — cross-frame scan confirmed single occurrence only.

**SVG spec:** see `docs/designs/K-058-about-framing-designer.md §SVG Flow Diagram Spec (Role Pipeline)` for all coordinates, colors, and arrowhead marker definitions.

**Updated artifacts:**
- `frontend/design/specs/about-v2.frame-omyb7.json` — overwritten with post-deletion node tree
- `frontend/design/screenshots/about-v2-omyb7.png` — re-exported at 1x

---

## K-058 Phase 1 Addendum (2026-04-28)

Two new sections added, one section compact-updated, one section annotated with dynamic markers.

### New frames added to 35VCj > Y80Iv

| Frame ID | Section Name | Position in Y80Iv | Spec File | Screenshot |
|----------|-------------|-------------------|-----------|------------|
| `GMEdT` | SX_WhereISteppedIn | index 2 (after BF4Xe, before omyb7) | `about-v2.frame-GMEdT.json` | `about-v2-GMEdT.png` |
| `omyb7` | SY_RolePipelineSection | index 3 (after GMEdT, before 8mqwX) | `about-v2.frame-omyb7.json` | `about-v2-omyb7.png` |

### Updated frames

| Frame ID | Change | Updated Spec | Updated Screenshot |
|----------|--------|--------------|-------------------|
| `8mqwX` | Compact format α: fit_content height, padding 12, gap 8; label → Nº 04 | `about-v2.frame-8mqwX.json` | `about-v2-8mqwX.png` |
| `EBC1e` | Dynamic placeholder annotations on ticket case title/outcome/learning nodes | `about-v2.frame-EBC1e.json` | `about-v2-EBC1e.png` |

### Known limitation (BQ-058-D1)

Pencil `M()` re-orders `batch_get` JSON children array but NOT the rendering engine layout. New sections appear visually at bottom of Y80Iv in screenshots. Section order in `batch_get` JSON (index 0–7) is authoritative for Engineer implementation. See `docs/designs/K-058-about-framing-designer.md §BQ-058-D1`.

### Y80Iv children order (authoritative, from batch_get)

| Index | Frame ID | Section |
|-------|----------|---------|
| 0 | `wwa0m` | S1_PageHeaderSection |
| 1 | `BF4Xe` | S2_MetricsStripSection |
| 2 | `GMEdT` | SX_WhereISteppedIn |
| 3 | `omyb7` | SY_RolePipelineSection |
| 4 | `8mqwX` | S3_RoleCardsSection (compact) |
| 5 | `UXy2o` | S4_ReliabilityPillarsSection |
| 6 | `EBC1e` | S5_TicketAnatomySection |
| 7 | `JFizO` | S6_ProjectArchitectureSection |

## Confirmation

- `batch_design` NOT used — this is a pure read/export task
- `.pen` file NOT modified
- All JSON files validated via `python3 -c "import json; json.load(...)"`
- All PNG exports succeeded via `mcp__pencil__export_nodes`

## Post-Phase-2 drift resolution (2026-04-23)

Appended per K-034 Phase 2 §4.8 M-2 PM ruling (Engineer-as-proxy edit authorized — append-only, no frame content change).

- **DRIFT-P2-MISSING-FRAME (D-1 `DossierHeader`): RESOLVED via code-side retire** — `DossierHeader.tsx` component deleted in Phase 2 Step 1 (AC-034-P2-DRIFT-D1); K-022 `AC-022-DOSSIER-HEADER` Sacred retired per §Phase 2 BQ-034-P2-ENG-02. No Pencil frame needed.
- **D-4 / D-5 / D-6 (RoleCard POSITION/BEHAVIOUR marginalia / Reviewer redaction / 7-char role font-size): RESOLVED via `FileNoBar` primitive + RoleCard prop-interface rewrite** (Phase 2 Step 4). Pencil `8mqwX.role_*` nodes remain authoritative; no new Pencil frame needed. Inline dark bar JSX deduplicated across 5 card types (MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarBlock) through single `<FileNoBar>` instance per card.
