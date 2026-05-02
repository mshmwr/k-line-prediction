# K-Line Prediction

<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->
<!-- METRICS:start -->
54+ tickets shipped · 73/73 AC covered · 37 post-mortems · 211 lessons codified
<!-- METRICS:end -->

<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->
<!-- STACK:start -->
[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://k-line-prediction-app.web.app)
[![Frontend](https://img.shields.io/badge/Frontend-TypeScript%20%2B%20React%20%2B%20Vite-3178C6?logo=typescript)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Python%20%2B%20FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Hosting](https://img.shields.io/badge/Hosting-Firebase%20Hosting%20%2B%20Cloud%20Run-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%2B%20Playwright%20%2B%20pytest-6E40C9)](https://playwright.dev/)
<!-- STACK:end -->

## Before & After

<table>
<tr>
<td width="360"><img src="./docs/images/readme/homepage-v1-80e12d7.png" width="360" alt="Homepage before the redesign (pre-K-017): basic single-column layout, no design system." /></td>
<td width="360"><img src="./docs/images/readme/homepage-v2-058699b.png" width="360" alt="Homepage after the redesign (K-017 v2): sitewide design system, typography tokens, polished hero." /></td>
</tr>
<tr>
<td width="360"><strong>Before</strong> — basic single-column layout, no design system.</td>
<td width="360"><strong>After</strong> — sitewide design system, typography tokens, polished hero.</td>
</tr>
</table>

*Captured at SHA [`80e12d7`](https://github.com/mshmwr/K-Line-Prediction/commit/80e12d7) (v1) and [`058699b`](https://github.com/mshmwr/K-Line-Prediction/commit/058699b) (v2) on 2026-04-24, viewport 1440×900, scroll position 0.*

One human operator redesigned and shipped a 5-page portfolio site using a team of six AI agents — Product Manager, Architect, Engineer, Reviewer, QA, Designer — coordinated by per-role personas whose rules were each written after a specific ticket incident. 40+ tickets — each with scoped AC, design doc, implementation, review, QA pass, and retrospective — were driven through the pipeline between 2026-04-18 and 2026-04-24. The output: a redesigned, deployed site; a ruleset where each rule names the bug it was written to prevent; and this README, which itself triggered a new rule before shipping. Ten representative rules with their originating bugs are listed in [`docs/agents-ruleset-highlights.md`](./docs/agents-ruleset-highlights.md); full personas live in private Claude Code config. The product under the harness is a K-line pattern-matching tool for short-term ETH/USDT direction — a deliberately narrow testbed for the agent workflow. The same harness will drive the next iteration of the model.

## Role pipeline

Automatic handoffs between roles; operator checkpoints are explicit and named (see Content-Alignment Gate below).

```mermaid
flowchart LR
    PM[PM] --> Architect[Architect]
    Architect --> Engineer[Engineer]
    Engineer --> Reviewer[Reviewer]
    Reviewer --> QA[QA]
    QA --> PM
    PM -.->|on-demand| Designer[Designer]
    Designer -.-> Architect
```

<!-- ROLES:start -->
| Role | Owns | Artefact |
|---|---|---|
| PM | Requirements, AC, phase gating | PRD + ticket + retrospective |
| Architect | Design, API contract, component tree | Design doc + retrospective |
| Engineer | Implementation | Code + retrospective |
| Reviewer | Code review, Bug Found Protocol | Review report + retrospective |
| QA | Regression, E2E, visual report | QA report + retrospective |
| Designer | Pencil design source of truth | .pen file + JSON/PNG spec + retrospective |
<!-- ROLES:end -->

## Named artefacts

Each rule was written after a specific failure was observed during the build. Five examples:

<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->
<!-- NAMED-ARTEFACTS:start -->
- **Real CSV integration test mandatory** — backend integration tests use the actual ETHUSDT-1h Binance CSV fixture, not fabricated data. mock data passes when the real format drifts; only a real-CSV integration test catches the exact failure mode (Sacred floor misalignment under real bar counts). See [docs/tickets/K-051-daily-db-backfill-rollup-fix.md](./docs/tickets/K-051-daily-db-backfill-rollup-fix.md).
- **Deploy local docker dry-run** — before opening any PR that touches Dockerfile, package*.json, .gcloudignore, or deploy scripts, run `docker build -f Dockerfile .` locally. catches build-time blockers (env injection, lockfile drift, missing binaries) before a Cloud Build round-trip. See [docs/tickets/K-049-public-surface-plumbing.md](./docs/tickets/K-049-public-surface-plumbing.md).
- **Bug Found Protocol** — when a code reviewer finds a bug, the responsible role writes a short retrospective naming the root cause before any fix begins. See [bug-found-protocol](#).
- **Ticket-derived SSOT pipeline** — `content/site-content.json` is the single hand-edited source for portfolio metrics, stack, processRules, and renderSlots. the generator `build-ticket-derived-ssot.mjs` auto-fills computed fields and writes README marker blocks from it — no ticket data lives in more than one hand-edited file. See [docs/tickets/K-052-content-ssot.md](./docs/tickets/K-052-content-ssot.md).
- **Pencil–code parity code review** — the code reviewer runs a line-by-line parity check between the Pencil design JSON (`specs/<frame>.json`) and the shipped component props, including typography, spacing, and color tokens. divergences not listed in `design-exemptions.md` are Critical findings that block merge. See [docs/tickets/K-034-about-spec-audit-and-workflow-codification.md](./docs/tickets/K-034-about-spec-audit-and-workflow-codification.md).
<!-- NAMED-ARTEFACTS:end -->

## Folder structure

<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json folderStructure.tree instead. -->
<!-- FOLDER-STRUCTURE:start -->
```
K-Line-Prediction/
├── backend/              # FastAPI app, Pydantic models, predictor, auth, pytest suite
├── content/              # Hand-edited SSOT JSON (stack, process rules, folder structure)
├── docs/
│   ├── designs/          # Per-ticket architecture design docs
│   ├── tickets/          # K-001 … K-06x ticket files (AC + retrospective)
│   ├── retrospectives/   # Per-role cumulative retrospective logs
│   └── agents-ruleset-highlights.md
├── frontend/
│   ├── e2e/              # Playwright end-to-end specs
│   ├── public/           # Static assets served by Firebase Hosting
│   └── src/
│       ├── components/   # React components (shared, page-specific, primitives)
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route-level page components
│       └── utils/        # Pure utilities (stats, API, analytics, diary sort)
├── history_database/     # Binance ETHUSDT 1h + daily OHLC CSVs
├── scripts/              # Generator + audit tooling
│   └── build-ticket-derived-ssot.mjs
└── ssot/                 # Project SSOT (system-overview, PRD, conventions, workflow)
```
<!-- FOLDER-STRUCTURE:end -->

## The K-line prediction tool

This is the testbed the harness operates on. The deployed site predicts short-term ETH/USDT price direction by matching the current K-line pattern against historical patterns and reporting the consensus of the top-N nearest neighbors.

## Future enhancements

- **Backtesting** — run the prediction engine across historical windows and report hit rate by market regime. Ticket open; not yet scheduled.
- **Architecture refinement** — further isolation of the `/app` mini-app from the portfolio chrome.

## Further reading

- [docs/agents-ruleset-highlights.md](./docs/agents-ruleset-highlights.md) — ten representative rules, each tagged with owning role and originating ticket
- [docs/ai-collab-protocols.md](./docs/ai-collab-protocols.md) — role pipeline, Bug Found Protocol, Content-Alignment Gate
- [docs/tickets/](./docs/tickets/) — 40+ tickets with PRD, AC, and retrospectives
- [docs/retrospectives/retrospective-meta.md](./docs/retrospectives/retrospective-meta.md) — meta-retrospectives: when an existing rule fails and triggers a structural upgrade. Mechanism active since 2026-04-23; entries are rare by design.

## Setup

```bash
git config core.hooksPath .githooks    # one-time after clone — enables role-doc drift gate
```

The pre-commit hook regenerates `README.md` and `docs/ai-collab-protocols.md` role tables from `content/roles.json` and rejects the commit on drift. Without this config, the gate is silently inactive.

## Local dev

```bash
cd frontend && npm install && npm run dev           # http://localhost:5173
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --reload  # http://localhost:8000
```

## Deploy

```bash
cd frontend && npm run build
firebase deploy --only hosting
```

## Testing

```bash
cd frontend && npx tsc --noEmit && npx vitest run && npx playwright test
cd backend && pytest
```
