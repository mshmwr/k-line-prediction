# K-062 — README Folder Structure Section (Architect Design)

Generated: 2026-04-29 | Status: pending Engineer

---

## SSOT Source

**File:** `content/site-content.json`
**New key:** `folderStructure`

Reason for choosing `site-content.json` over `ssot/system-overview.md`: system-overview.md is verbose and agent-facing; README needs a curated public-facing subset. Keeps SSOT authoring model consistent — one JSON file, one generator, one README write path.

**Content to add to `site-content.json`:**

```json
"folderStructure": {
  "comment": "Hand-authored. Edit here; generator emits to README FOLDER-STRUCTURE marker block.",
  "tree": [
    "K-Line-Prediction/",
    "├── backend/              # FastAPI app, Pydantic models, predictor, auth, pytest suite",
    "├── content/              # Hand-edited SSOT JSON (stack, process rules, folder structure)",
    "├── docs/",
    "│   ├── designs/          # Per-ticket architecture design docs",
    "│   ├── tickets/          # K-001 … K-06x ticket files (AC + retrospective)",
    "│   ├── retrospectives/   # Per-role cumulative retrospective logs",
    "│   └── agents-ruleset-highlights.md",
    "├── frontend/",
    "│   ├── e2e/              # Playwright end-to-end specs",
    "│   ├── public/           # Static assets served by Firebase Hosting",
    "│   └── src/",
    "│       ├── components/   # React components (shared, page-specific, primitives)",
    "│       ├── hooks/        # Custom React hooks",
    "│       ├── pages/        # Route-level page components",
    "│       └── utils/        # Pure utilities (stats, API, analytics, diary sort)",
    "├── history_database/     # Binance ETHUSDT 1h + daily OHLC CSVs",
    "├── scripts/              # Generator + audit tooling",
    "│   └── build-ticket-derived-ssot.mjs",
    "└── ssot/                 # Project SSOT (system-overview, PRD, conventions, workflow)"
  ]
}
```

---

## README Marker Position

**Insert after:** `<!-- NAMED-ARTEFACTS:end -->`

**Block to insert (one-time manual insert by Engineer):**

```markdown
## Folder structure

<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json folderStructure.tree instead. -->
<!-- FOLDER-STRUCTURE:start -->
<!-- FOLDER-STRUCTURE:end -->
```

**Scope rule:** Only this marker shell is added to README. No other section touched.

---

## Generator Changes (`scripts/build-ticket-derived-ssot.mjs`)

1. **New regex constant** — `folderStructureMarkerRe` alongside existing `stackMarkerRe` / `namedArtefactsRe`
2. **New pure function** — `renderFolderStructure(tree: string[]): string` — joins array with `\n`, wraps in fenced code block (no language tag)
3. **Extend `emitReadmeMarkers`** — read `siteContent.folderStructure?.tree`, call `renderFolderStructure`, apply `.replace(folderStructureMarkerRe, ...)` to README
4. **Marker-absent guard** — if marker pair missing from README, `process.stderr` warning + skip (no `exit(2)`)
5. **`--check` drift branch** — same format as existing STACK/NAMED-ARTEFACTS drift reporting

---

## Scope Boundary

**Files touched (exactly 3):**

| File | Change |
|------|--------|
| `content/site-content.json` | Add `folderStructure` key |
| `scripts/build-ticket-derived-ssot.mjs` | New regex, new pure function, extend emitter, extend `--check` |
| `README.md` | Insert empty `<!-- FOLDER-STRUCTURE:start/end -->` marker shell only |

**README sections NOT touched:**
- Hero / STACK badges / intro prose
- Before & After images
- Role pipeline + ROLES marker block
- Named artefacts + NAMED-ARTEFACTS marker block
- The K-line prediction tool / Future enhancements / Further reading
- Setup / Local dev / Deploy / Testing

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| `folderStructure` key absent from `site-content.json` | Emit empty block with inline comment; no exit-2 |
| `folderStructure.tree` is empty array | Emit empty fenced block; no crash |
| Marker pair absent from README | `process.stderr` warning + skip |
| `--check` with drifted block | stderr + exit-1 (same as STACK/NAMED-ARTEFACTS) |
