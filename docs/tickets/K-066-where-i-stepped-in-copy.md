---
id: K-066
title: WhereISteppedIn narrative + bottom bar SSOT + homepage .pen sync
status: open
phase-1-status: open
created: 2026-04-29
type: content
priority: medium
size: medium
visual-delta: yes
content-delta: yes
design-locked: false
qa-early-consultation: N/A — copy sync on existing elements + design-only screenshot placeholder (code already ships hero-shot.png); no new UI path
dependencies: []
worktree: .claude/worktrees/K-066-where-i-stepped-in-copy
branch: K-066-where-i-stepped-in-copy
base-commit: c73cc2d
closed-commit:
---

## Summary

Three related design-sync tasks discovered in the same session:

1. **WhereISteppedIn narrative + SSOT** — revise narrative to accurately reflect the operator's role; make bottom bar stat text SSOT-driven from `site-content.json`. *(Engineer done: commit 8e65b46)*
2. **GMEdT frame Designer sync** — update `.pen` frame GMEdT to match shipped copy: narrative, bottom bar, delete stale THE ROLES pill row.
3. **4CsvQ frame Designer sync** — homepage hero frame in `.pen` has three stale items vs live code: (a) hero subtext not updated since K-057, (b) stack row order not matching SSOT, (c) hero product screenshot placeholder missing entirely.

## Motivation

- Narrative "The agents execute; I decide" overstates mid-pipeline authority. Actual role: define requirements, let agents run, review and merge at boundary.
- Bottom bar "60 tickets" was misleading (60 = AC count); "Every decision logged" factually wrong.
- Interviewer-reviewer (2026-04-29) recommended: encode requirements→execution→boundary arc, surface pipeline depth as third stat.
- `.pen` frame GMEdT never updated after Engineer shipped copy changes — design SSOT drifted from code.
- `.pen` frame 4CsvQ hero subtext still shows K-057-era copy. Stack row order diverges from `site-content.json` SSOT. Hero product shot (`hero-shot.png`, data-testid `hero-product-shot`) shipped in K-017 but was never added to the design spec.

## Acceptance Criteria

### Code (Engineer — ✅ done in commit 8e65b46)

- **AC-066-NARRATIVE:** `data-testid="where-i-narrative"` renders: "I am the single operator. I define requirements and the rules agents run by; they handle design through QA. I review at the boundary — correcting output when needed, and deciding what ships."
- **AC-066-BOTTOM-BAR:** Bottom bar `data-testid="where-i-outcome"` reads `{N} features shipped. 100% AC coverage. 6-agent pipeline.` where N = `metrics.featuresShipped.value` from `site-content.json`.
- **AC-066-SSOT:** `featuresShipped` and `acCoverage` sourced from `site-content.json`; `PIPELINE_DEPTH = 6` is a module-level constant (build script overwrites `metrics` block; architectural constant belongs here, not in JSON).
- **AC-066-TSC:** `npx tsc --noEmit` passes.
- **AC-066-E2E:** Playwright passes; no regression on `data-testid="where-i-narrative"` and `data-testid="where-i-outcome"`.

### Design — frame GMEdT (WhereISteppedIn section)

- **AC-066-PEN-NARRATIVE:** Narrative text node in frame GMEdT matches AC-066-NARRATIVE verbatim.
- **AC-066-PEN-BOTTOM-BAR:** Bottom bar text node in frame GMEdT reads `"44 features shipped. 100% AC coverage. 6-agent pipeline."` (N=44 = current `featuresShipped.value`; update when metrics change).
- **AC-066-PEN-ROLES-DEL:** The stale "THE ROLES" pill row node is deleted from frame GMEdT; no such node remains.

### Design — frame 4CsvQ (Homepage hero)

- **AC-066-PEN-SUBTEXT:** Node `PrI8l` text reads `"Search past ETH/USDT formations that resemble any candlestick window. Inspect what came after — for learning, not for trading signals."`
- **AC-066-PEN-STACK:** Node `MdNRn` stack text reads `"TypeScript · React · Vite · Python · FastAPI · Playwright"` (SSOT order from `site-content.json`).
- **AC-066-PEN-HERO-SHOT:** A screenshot placeholder node exists in frame 4CsvQ below the hero headline / above the CTA, sized ~16:9 (reference: max-w-960px), with `rounded-[8px]` corner radius, border `#2A2520`, drop-shadow `0 2px 0 #2A2520`.

### Gate

- **AC-066-JSON-EXPORT:** After Designer edits, `homepage-v2.frame-GMEdT.json` and `homepage-v2.frame-4CsvQ.json` exported; grep confirms all AC values present in JSON.

## PRD

### Scope

| File | Change | Phase |
|------|--------|-------|
| `frontend/src/components/about/WhereISteppedInSection.tsx` | Narrative + SSOT bottom bar + `PIPELINE_DEPTH` constant | Engineer ✅ done |
| `content/site-content.json` | `featuresShipped` value corrected | Engineer ✅ done |
| `frontend/design/homepage-v2.pen` | Frame GMEdT: narrative, bottom bar, delete ROLES row | Designer |
| `frontend/design/homepage-v2.pen` | Frame 4CsvQ: subtext, stack order, add hero screenshot placeholder | Designer |
| `frontend/design/specs/homepage-v2.frame-GMEdT.json` | Re-export after .pen changes | Designer |
| `frontend/design/specs/homepage-v2.frame-4CsvQ.json` | Re-export after .pen changes | Designer |

### Frame GMEdT — node changes

| Node | From | To |
|------|------|----|
| Narrative text | old copy | "I am the single operator. I define requirements and the rules agents run by; they handle design through QA. I review at the boundary — correcting output when needed, and deciding what ships." |
| Bottom bar text | "60 tickets. 100% AC coverage. Every decision logged." | "44 features shipped. 100% AC coverage. 6-agent pipeline." |
| THE ROLES pill row | exists | delete |

### Frame 4CsvQ — node changes

| Node ID | From | To |
|---------|------|----|
| `PrI8l` | "Pattern-matching engine for K-line candlestick charts..." | "Search past ETH/USDT formations that resemble any candlestick window. Inspect what came after — for learning, not for trading signals." |
| `MdNRn` | "React · TypeScript · Vite · FastAPI · Python · Playwright" | "TypeScript · React · Vite · Python · FastAPI · Playwright" |
| (new) | — | Hero screenshot placeholder, below headline / above CTA; 16:9 ratio (~960px wide), `cornerRadius: 8`, `stroke: #2A2520`, `shadow: 0 2px 0 #2A2520` |

## Tech Debt

None anticipated.
