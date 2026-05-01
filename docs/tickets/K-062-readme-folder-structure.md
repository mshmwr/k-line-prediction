---
id: K-062
title: README Folder Structure section — SSOT generator emits from content/site-content.json
status: in-progress
phase-1-status: closed
phase-1-commit: 415f08a
created: 2026-04-29
type: feat
priority: medium
size: small
visual-delta: no
content-delta: yes
design-locked: N/A
qa-early-consultation: N/A — docs/script-only, no runtime UI path
dependencies: [K-052]
worktree: .claude/worktrees/K-062-readme-folder-structure
branch: K-062-readme-folder-structure
base-commit: 8ba42c2
---

## Summary

Add a Folder Structure section to README.md, driven by a new `folderStructure.tree` key in `content/site-content.json`. The generator `scripts/build-ticket-derived-ssot.mjs` emits the tree into a `<!-- FOLDER-STRUCTURE:start/end -->` marker block, following the same SSOT-marker pattern as STACK and NAMED-ARTEFACTS.

## Design Doc

[docs/designs/K-062-readme-folder-structure.md](../designs/K-062-readme-folder-structure.md)

## Acceptance Criteria

- **AC-062-CONTENT:** `content/site-content.json` contains `folderStructure.tree` string array matching the directory tree in design doc
- **AC-062-MARKER:** `README.md` contains `<!-- FOLDER-STRUCTURE:start -->` and `<!-- FOLDER-STRUCTURE:end -->` marker block inserted after `<!-- NAMED-ARTEFACTS:end -->`
- **AC-062-GENERATOR:** `scripts/build-ticket-derived-ssot.mjs` renders tree into fenced code block (no language tag) inside the marker block on each generator run
- **AC-062-CHECK:** `node scripts/build-ticket-derived-ssot.mjs --check` detects drift when FOLDER-STRUCTURE block is manually edited
- **AC-062-ABSENT:** When `folderStructure` key absent from site-content.json, generator emits empty block with inline comment, no exit-2
- **AC-062-NO-TOUCH:** No other README section modified (Hero / STACK / NAMED-ARTEFACTS / role pipeline / K-line tool / Setup / Deploy / Testing all untouched)

## Phases

### Phase 1 — Engineer Implementation
Files: `content/site-content.json`, `scripts/build-ticket-derived-ssot.mjs`, `README.md`

### Phase 2 — Code Review + QA + Close

## Release Status

- `site-content.json review: no-change — SSOT generator extension adds new folderStructure output artefact; not a process/governance rule for processRules[] showcase (retroactive backfill 2026-05-01)`
