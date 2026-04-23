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
| `35VCj` (full page) | About /about (K-017 v2) — complete frame | entire `AboutPage.tsx` | (not re-exported; parent of all above) | `about-v2-35VCj-full.png` |

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

## Confirmation

- `batch_design` NOT used — this is a pure read/export task
- `.pen` file NOT modified
- All JSON files validated via `python3 -c "import json; json.load(...)"`
- All PNG exports succeeded via `mcp__pencil__export_nodes`

## Post-Phase-2 drift resolution (2026-04-23)

Appended per K-034 Phase 2 §4.8 M-2 PM ruling (Engineer-as-proxy edit authorized — append-only, no frame content change).

- **DRIFT-P2-MISSING-FRAME (D-1 `DossierHeader`): RESOLVED via code-side retire** — `DossierHeader.tsx` component deleted in Phase 2 Step 1 (AC-034-P2-DRIFT-D1); K-022 `AC-022-DOSSIER-HEADER` Sacred retired per §Phase 2 BQ-034-P2-ENG-02. No Pencil frame needed.
- **D-4 / D-5 / D-6 (RoleCard POSITION/BEHAVIOUR marginalia / Reviewer redaction / 7-char role font-size): RESOLVED via `FileNoBar` primitive + RoleCard prop-interface rewrite** (Phase 2 Step 4). Pencil `8mqwX.role_*` nodes remain authoritative; no new Pencil frame needed. Inline dark bar JSX deduplicated across 5 card types (MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarBlock) through single `<FileNoBar>` instance per card.
