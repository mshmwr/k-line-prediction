---
ticket: K-044
title: README showcase rewrite — agent team primary identity + v2 before/after screenshots
type: design
status: ready-for-engineer
created: 2026-04-24
owner: Architect
visual-delta: none
content-delta: yes
design-locked: N/A
worktree: .claude/worktrees/K-044-readme-showcase-rewrite
branch: K-044-readme-showcase-rewrite
---

# K-044 — README showcase rewrite: Architect design doc

## 0 Handoff Gate Summary

```
Architect delivery gate:
  all-phase-coverage=✓ (single-phase docs-only ticket, ACs 1–6 covered §3/§4/§5/§7/§8)
  pencil-frame-completeness=N/A (visual-delta: none; no .pen surface)
  visual-spec-json-consumption=N/A (visual-spec: N/A — ticket frontmatter declares reason)
  sacred-ac-cross-check=✓ (K-039 ROLES marker block preserved; see §9)
  route-impact-table=N/A (no global CSS / shared primitive / route change — top-level doc only)
  cross-page-duplicate-audit=N/A (no new components; README is repo-top doc, not route)
  target-route-consumer-scan=N/A (no route navigation behavior change)
  architecture-doc-sync=planned (§6.3 — Deployment Architecture section patch in this ticket)
  self-diff=✓ (§10 self-diff table)
  → OK
```

No BQs unresolvable. BQ-044-Q1~Q5 pre-ruled by PM in ticket §4; design doc adopts verbatim.

---

## 1 Capture Feasibility Pre-Check (mandatory per Challenge C3 — RE-VERIFIED 2026-04-24 this session)

### 1.1 Procedure executed (2026-04-24, Architect session, scoped re-dispatch)

Inside worktree `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.claude/worktrees/K-044-readme-showcase-rewrite/`:

```bash
# Stash K-044 work in progress (preserve agent-context/architecture.md staged patches + retro files)
git stash push -u -m "K-044-feasibility-stash"

# Verify SHA exists and inspect parent commit
git show 80e12d7 --stat | head -30
# → commit 80e12d759c31... "feat: K-001~K-007 closed + Firebase deploy infra + K-002 unified UI"
# → Date: Sat Apr 18 17:14:24 2026 +0800

# Check out frontend/ tree at 80e12d7
git checkout 80e12d7 -- frontend/
cd frontend && npm install    # no pre-existing node_modules at worktree root; full install
# → 126 packages installed, 4 moderate vulnerabilities (non-blocking for feasibility)

# Start dev server in background
nohup npm run dev > /tmp/k044-dev.log 2>&1 &
# → VITE v5.4.0 ready in 1091 ms, Local: http://localhost:5173/

# Verify server responds with recognizable pre-v2 state
curl -sI http://localhost:5173/ | head -5
# → HTTP/1.1 200 OK, Content-Type: text/html
curl -s http://localhost:5173/ | head -20
# → <body class="bg-gray-950">  ← dark theme (pre-K-021 paper rollout)
# → Google Fonts: "IBM+Plex+Mono"  ← pre-Bodoni Moda / Geist Mono swap (confirmed pre-K-021/K-040)
```

Teardown (executed this session):
```bash
kill <vite-pid>
git restore --source=HEAD --staged --worktree frontend/
git stash pop stash@{0}
# → worktree restored to K-044 branch state; stashed arch.md patches + ticket/retro files back
```

### 1.2 Result (this session)

**`80e12d7` renders the pre-v2 homepage cleanly.** No dep-drift, no build break.
- Vite 5.4.0 boots in 1091 ms (cold npm install included).
- `index.html` `<body class="bg-gray-950">` = dark theme (unambiguous pre-K-021 evidence; K-021 `@layer base body` applies `bg-paper` #F4EFE5).
- Google Fonts link loads `IBM+Plex+Mono` (pre-K-021/K-040 typography; current main uses Bodoni Moda + Geist Mono families).
- HTTP 200 from root; `/src/main.tsx` resolves with BrowserRouter + 5-page SPA routes (HomePage/AppPage/AboutPage/DiaryPage/BusinessLogicPage).
- No fallback SHA needed; `80e12d7` is the capture source.

### 1.3 Source-of-truth SHAs for README provenance caption

| Screenshot | Source SHA | Commit subject | Notes |
|---|---|---|---|
| `homepage-v1-pre-redesign.png` | `80e12d7` | "feat: K-001~K-007 closed + Firebase deploy infra + K-002 unified UI" | Parent-class of K-017 v2 WIP (`2318e67`); last clean pre-v2 state; verified buildable this session |
| `homepage-v2-current.png` | `058699b` | current K-044 branch base (post K-017→K-042 v2 arc) | v2 arc landed; rebase onto current main `c7a3784` at merge-back per Deploy Checklist |

### 1.4 Worktree post-check (this session)

`git status --short` after teardown:
```
 M agent-context/architecture.md       ← K-044 Architect patches (this session + prior session staged)
 M docs/retrospectives/architect.md    ← K-044 retro (prepended this session)
 M docs/retrospectives/pm.md           ← K-044 PM retro (pre-existing)
?? docs/designs/K-044-readme-showcase-rewrite.md  ← this design doc
?? docs/images/                         ← dir stub (Engineer fills with PNG captures)
?? docs/tickets/K-044-readme-showcase-rewrite.md  ← PM ticket
```
Baseline state restored. No frontend/ residue; Vite dev server terminated (pid 78510 not running). ✓

---

## 2 Section Order Proposal

Proposed new README top-level section sequence (after title + tagline + badges):

| # | Section | Rationale (1 line) |
|---|---|---|
| 1 | **AI Collaboration Flow** (kept from current L14–76) | AC-044-AGENT-TEAM-PRIMARY: agent team framing is the first section; preserves the entire existing block incl. ROLES marker (Sacred). |
| 2 | **v2 Redesign — Before & After** (NEW) | AC-044-BEFORE-AFTER-SCREENSHOTS + AC-044-V2-ARC-NARRATIVE: two `<img>` + one-paragraph ticket-anchored narrative K-017→K-040. Placed directly after agent-team so the pair is visual proof of the pipeline's output. |
| 3 | **Demo Product — K-Line Prediction** (REWRITTEN from L80–156) | AC-044-PREDICTION-DEMOTED: ≤5-sentence paragraph, explicit "personal, unfinished demo" framing, deep-link to `agent-context/architecture.md` for curious readers (C4 mitigation). |
| 4 | **Local Development** (COMPRESSED from L160–177) | BQ-044-Q4 keep-but-compress: clone-and-run contract preserved. |
| 5 | **Deployment** (COMPRESSED from L181–194) | BQ-044-Q4 keep-but-compress: minimal Firebase + Cloud Run commands. |
| 6 | **Testing** (COMPRESSED from L198–213) | BQ-044-Q4 keep-but-compress: command block only. |
| 7 | **Future Enhancements** (REWRITTEN from L217–223) | AC-044-FUTURE-BACKTESTING: replaces the "Design System Completion" item (largely achieved via K-021/K-034/K-040) with a concrete K-Line backtesting sentence. See §7. |
| 8 | **Directory Structure** (KEPT but trimmed from L227–257) | Still useful top-of-repo map; trimmed to one-line-per-dir max, no sub-file enumeration. |

Sections removed from top-level README:
- ~~The Product — K-Line Prediction Tool~~ (L80–99) — content migrates, see §3
- ~~Technical Architecture~~ (L102–124, Tech Stack + API Endpoints) — content migrates, see §3
- ~~Data Flow~~ (L126–140) — content migrates, see §3
- ~~Stats split (TD-008 Option C)~~ paragraph (L142–145) — content migrates, see §3
- ~~Deployment Architecture~~ ASCII block (L147–156) — content migrates, see §3

Section 2 (new v2 Redesign) placement rationale: must be **inside the first screen on GitHub** to satisfy the AC's "when they read the first screen (title + tagline + first section)" framing. Section 1 already occupies the fold; Section 2 is the scroll-past-once payoff. This is what makes the repo read as a portfolio.

---

## 3 Prediction Content Migration Plan

**PM ruling BQ-044-Q3: move to `agent-context/architecture.md`.** Verify coverage first; patch gaps; no parallel `docs/product.md`.

### 3.1 Per-block disposition table

| README L-range | Current content | Disposition | Target |
|---|---|---|---|
| L80–89 | "The Product — K-Line Prediction Tool" header + 5-step walkthrough (upload OHLC → candle features → MA99 gate → 72h projection → stats) | **Rewrite into short paragraph** (§4) AND migrate 5-step bullet list into architecture.md `## Data Flow` as new prose intro above the existing ASCII data-flow diagram | `agent-context/architecture.md` §Data Flow (§3.2 patch below) |
| L90–99 | "Frontend Routes (5-page SPA)" table | **Delete from README** — already in architecture.md `## Frontend Routing` (L447–460); fully covered (no gap) | (already covered; no patch needed) |
| L102–112 | "Technical Architecture" / Tech Stack table | **Delete from README** — already in architecture.md `## Tech Stack` (L24–32); fully covered | (already covered; no patch needed) |
| L114–124 | "API Endpoints" table | **Delete from README** — already in architecture.md `## API Endpoints` (L198–286) at far richer detail incl. Request/Response schemas | (already covered; no patch needed) |
| L126–140 | "Data Flow" ASCII block | **Delete from README** — already in architecture.md `## Data Flow` (L323–345) at far richer detail incl. function-level call chain | (already covered; no patch needed) |
| L142–145 | "Stats split (TD-008 Option C)" paragraph | **Delete from README** — already in architecture.md `## Consensus Stats Source of Truth` (L349–383) at full decision-rationale depth | (already covered; no patch needed) |
| L147–156 | "Deployment Architecture" ASCII block (Firebase Hosting + Cloud Run two-stage build + env vars) | **Migrate into architecture.md** — **gap identified**, architecture.md has no dedicated Deployment section (only scattered mentions in Changelog + audit-ticket section L615). **Patch architecture.md with new `## Deployment Architecture` section.** | `agent-context/architecture.md` §Deployment Architecture (new section — §3.3 patch below) |
| L227–257 | "Directory Structure" repo-top tree | **Trim in README** — shorten to one-line-per-top-dir, no sub-file enumeration. Do NOT migrate; architecture.md already has its own Directory Structure L35–196 (which is richer & more current). | (stays in README but trimmed; architecture.md already covers deeper structure) |

### 3.2 architecture.md patch 1 — Data Flow prose intro

**Location:** `agent-context/architecture.md` L323 (top of `## Data Flow` section, before the ASCII block).

**Current state:** section opens directly with the ASCII code block. No prose intro.

**Patch (Engineer inserts as new paragraph above ASCII block):**

```markdown
## Data Flow

**The prediction pipeline (user-facing summary):**

1. User uploads recent OHLC data (CSV / JSON / manual entry / example).
2. Backend computes candlestick shape features (body%, wick%, return%).
3. Historical similar segments are filtered using MA99 trend direction as a gate (direction mismatch excluded).
4. A projected 72-hour price path is computed (median OHLC across matched segments).
5. Win rate, highest/lowest extremes, and per-day statistics are displayed.

**Call-chain detail (below).**

```
使用者輸入 OHLC（編輯表格 / CSV upload / JSON import / example）
  → ...
```
```

**Architect note:** the 5 bullets are the README L84–89 walkthrough verbatim-ish; architecture.md gains the user-narrative view it was missing. Existing ASCII call-chain stays as "detail below".

### 3.3 architecture.md patch 2 — new Deployment Architecture section

**Location:** `agent-context/architecture.md` — insert as a new top-level section between `## Design System (K-021)` (ends L530) and `## QA Artifacts` (starts L531). Chosen because Design System is the last "how the product is built" section and QA Artifacts begins the "how quality is verified" block; Deployment is the "how the product ships" concept that naturally sits between.

**Patch content (Engineer inserts verbatim):**

```markdown
## Deployment Architecture

```
Browser
  ├── Firebase Hosting  ← SPA static assets (frontend/dist/)
  │     rewrites: ** → /index.html    (BrowserRouter fallback)
  └── Google Cloud Run  ← Docker container
        Two-stage build: Node 20 builds frontend → Python 3.11 serves
        ENV: BUSINESS_LOGIC_PASSWORD, JWT_SECRET, PORT
```

**Hosting split rationale:** SPA static assets on Firebase Hosting (global CDN, zero cold-start); FastAPI backend on Cloud Run (containerized, scales to zero). SPA fallback `rewrites: ** → /index.html` routes unknown URLs to the BrowserRouter; `/api/*` calls hit Cloud Run directly via `VITE_API_BASE` build-time env var.

**Deploy gate:** see `CLAUDE.md § Deploy Checklist` — (1) all ticket branches rebased+merged into main, (2) relative-path API client grep, (3) `npm run build` from `frontend/`, (4) `firebase deploy --only hosting` from project root.

**Two-stage Dockerfile:** Node 20 build stage emits `frontend/dist/`; Python 3.11 runtime stage serves both static assets (via FastAPI SPA fallback route) and `/api/*` endpoints. See `Dockerfile` at project root.
```

**Architect note:** content is README L147–156 verbatim for the ASCII block, plus two sentences of connective tissue referencing existing CLAUDE.md Deploy Checklist (already source-of-truth). No new info not already elsewhere; just a centralized landing-zone so the README link-out has a target.

### 3.4 architecture.md changelog entry

After the two patches above land, Engineer appends to `agent-context/architecture.md` `## Changelog`:

```markdown
- **2026-04-24**（Architect, K-044 — README showcase rewrite）— 新增 `## Deployment Architecture` 段落（Firebase Hosting + Cloud Run 拓樸，sourced from ex-README L147–156 + CLAUDE.md Deploy Checklist 交叉引用）; `## Data Flow` 段落 top 加 5-step user-narrative prose intro（sourced from ex-README L84–89）。README.md 同 commit 移除 L80–156 prediction-detail block + L227–257 trim 到 one-line-per-top-dir。K-039 ROLES marker block + audit-ticket.sh invocation 行在 README 中保留。無 API / schema / 組件 / 路由變動。
```

---

## 4 "Demo Product" Short Paragraph (verbatim text for Engineer)

Engineer inserts under section header `## Demo Product — K-Line Prediction`:

```markdown
## Demo Product — K-Line Prediction

The pipeline is exercised against a personal, unfinished ETH/USDT K-line pattern-similarity prediction tool. A user uploads recent OHLC data, the backend filters historical segments by MA99 trend direction, and the app surfaces a projected 72-hour path plus win-rate statistics. The product is a vehicle for the pipeline, not a commercial artifact — it is illustrative, and intentionally incomplete.

See [`agent-context/architecture.md`](agent-context/architecture.md) for the five-step prediction pipeline, API endpoints, data-flow call chain, and field mapping.
```

Word count: 76 words across 4 sentences (≤5 per AC-044-PREDICTION-DEMOTED). Claim boundaries:
- "personal, unfinished" — explicit
- "vehicle for the pipeline, not a commercial artifact" — explicit non-production claim
- "illustrative, and intentionally incomplete" — explicit completion disclaimer
- Link-out to architecture.md — satisfies C4 mitigation requirement (recruiter depth)

---

## 5 Image Embed Snippet

### 5.1 Capture params (Engineer must execute exactly)

| Param | Value | Source |
|---|---|---|
| Viewport width | **1440 px** | BQ-044-Q2 ruling (matches Designer `/about` export default) |
| Viewport height | **900 px** | BQ-044-Q2 ruling |
| Scroll position | **0 (top of page)** | BQ-044-Q2 ruling (C2) |
| Capture mode | **full-viewport** (NOT full-page) | BQ-044-Q2 ruling (C2) — portfolio comparison surface is the fold |
| DPR | 1 (default) | standard; avoid 2× surprises in rendered size |
| Format | PNG | lossless; matches existing `frontend/design/screenshots/*.png` convention |
| v1 source SHA | `80e12d7` | §1.3 |
| v2 source SHA | `058699b` | §1.3 |
| v1 output path | `docs/images/readme/homepage-v1-pre-redesign.png` | BQ-044-Q1 ruling |
| v2 output path | `docs/images/readme/homepage-v2-current.png` | BQ-044-Q1 ruling |

**Important:** both captures must be run with identical viewport (1440×900) + scroll position (0) + capture mode (viewport). Any asymmetry = C2 regression.

Capture method (Engineer): checkout `80e12d7` in throwaway local context OR ephemeral worktree; link `node_modules` from main repo; `npx vite` on 127.0.0.1:5173; use Playwright or Chromium headless with `--window-size=1440,900`, navigate to `http://127.0.0.1:5173/`, wait for network-idle (or 2s settle), take viewport screenshot. Tear down; repeat at HEAD `058699b`.

### 5.2 HTML snippet (verbatim, insert under new `## v2 Redesign — Before & After` section)

**Chosen markup:** a single-paragraph with two inline `<img>` tags separated by a non-breaking space. Rationale vs alternatives:

| Option | Pros | Cons | Decision |
|---|---|---|---|
| HTML `<table>` with two `<td>` | reliable side-by-side across GitHub renderers | table markup is heavy; renders a visible border on some themes | rejected |
| Single `<p>` with two `<img>` inline | simplest; GitHub renders side-by-side when viewport is wide enough; degrades to stacked on narrow mobile (acceptable) | spacing depends on browser default | **chosen** — simplest works |
| GitHub markdown image-row `![](url)![](url)` | ultra-minimal | no `width` control (AC requires explicit `width` attribute) | rejected (AC violation) |

**Verbatim snippet:**

```markdown
## v2 Redesign — Before & After

The screenshots below capture the `/` route before and after the v2 sitewide redesign. The redesign arc is owned by the agent pipeline (not by a single author) and spans tickets [K-017](docs/tickets/K-017-about-portfolio-enhancement.md) (portfolio + homepage v2 pivot), [K-021](docs/tickets/K-021-sitewide-design-system.md) (sitewide design system tokens), [K-034](docs/tickets/K-034-about-spec-audit-and-workflow-codification.md) (Pencil SSOT + workflow codification), and [K-040](docs/tickets/K-040-sitewide-ui-polish-batch.md) (Bodoni Moda → Geist Mono typography reset + UI polish batch).

<p>
  <img src="docs/images/readme/homepage-v1-pre-redesign.png" width="360" alt="Homepage v1 (pre-redesign)">
  &nbsp;
  <img src="docs/images/readme/homepage-v2-current.png" width="360" alt="Homepage v2 (current)">
</p>

<sub>Captured at SHA <code>80e12d7</code> (v1) and <code>058699b</code> (v2) on 2026-04-24, viewport 1440×900, scroll 0. Future UI tickets do not trigger re-capture; portfolio screenshots are timestamped artifacts (BQ-044-Q5).</sub>
```

### 5.3 Width choice rationale

`width="360"` × 2 images side-by-side = 720 px total, well under GitHub's README content column (~920 px max on wide viewport, narrower on mobile). Each image displays at roughly 1/4 of capture width (1440 → 360), which:
- honors user directive "圖片size不用太大"
- keeps the before/after pair visible without horizontal scroll on ≥1024 px viewports
- stacks gracefully on <720 px viewports (mobile)

Architect reviewed alternative widths (320 / 400 / 480); 360 is the sweet spot — 320 is too small for chart / layout detail legibility, 480+ risks side-by-side overflow on narrower desktop viewports.

### 5.4 Alt-text spec

- v1 `alt="Homepage v1 (pre-redesign)"` — AC-044-BEFORE-AFTER-SCREENSHOTS mandates alt describing state; "pre-redesign" is unambiguous.
- v2 `alt="Homepage v2 (current)"` — mirrors v1 phrasing; "current" is time-pinned via the SHA caption below.

### 5.5 Explicit NOT

- NO `<details>` / `<summary>` wrapper (AC-044-BEFORE-AFTER-SCREENSHOTS "no collapsible" + user directive).
- NO CSS / inline-style beyond `width` attribute (GitHub strips most inline CSS anyway; keep it portable).
- NO thumbnail linking to a larger image (user directive "圖片size不用太大" = no enlarge-on-click expectation).

---

## 6 Compressed Local Dev / Deployment / Testing Sections

BQ-044-Q4 keep-but-compress; ≤5 lines each, command block only.

### 6.1 Local Development (verbatim)

```markdown
## Local Development

Requires Node 20+ and Python 3.11+.

```bash
# Backend (terminal 1)
cd backend && export BUSINESS_LOGIC_PASSWORD=<pw> JWT_SECRET=<secret>
python3 -m uvicorn main:app --reload --port 8000

# Frontend (terminal 2)
cd frontend && npm install && npm run dev
```

Frontend `http://localhost:5173`, backend `http://localhost:8000`.
```

Prose lines: 1 (requirement line) + 1 (dual-port footer) = 2. Command block lines: 5. Total: 7 visible lines including blank lines — within "~5 lines max" spirit given it's two services.

### 6.2 Deployment (verbatim)

```markdown
## Deployment

```bash
# Firebase Hosting (frontend)
cd frontend && npm run build && cd .. && firebase deploy --only hosting

# Cloud Run (backend)
docker build -t k-line-prediction . && gcloud run deploy k-line-prediction \
  --image k-line-prediction --allow-unauthenticated \
  --set-env-vars BUSINESS_LOGIC_PASSWORD=xxx,JWT_SECRET=xxx
```

See `CLAUDE.md § Deploy Checklist` for the full pre-flight gate (merge sync + relative-path API grep).
```

Prose lines: 1 (link to gate). Command block lines: 5 (tight, merged where possible). Total: ~7 visible.

### 6.3 Testing (verbatim)

```markdown
## Testing

```bash
# Frontend unit (Vitest)    → cd frontend && npm test -- --run
# E2E (Playwright, auto-boots Vite + mocks API)   → cd frontend && npx playwright install chromium && npm run test:e2e
# Backend (pytest)          → cd backend && python3 -m pytest tests/ -v
# Visual report             → cd frontend && TICKET_ID=K-0XX npx playwright test visual-report.ts
```
```

4 command lines, no prose. Satisfies BQ-044-Q4 "command block only, minimal prose".

---

## 7 Future Enhancements Section Rewrite

AC-044-FUTURE-BACKTESTING mandates a specific backtesting sentence. Current section (L217–223) has two items: "Design System Completion" and "Architecture Refinement".

**Decision: replace "Design System Completion" with "K-Line Backtesting".** Rationale:
- Design System Completion was largely delivered by K-021 (sitewide tokens), K-034 (Pencil SSOT + workflow codification), and K-040 (typography reset + UI polish batch). Leaving it as a "future" item is misleading and undermines the showcase claim made in the new §2 Before & After section.
- K-043 (hero mobile backfill, currently parallel) handles the last residual design-system polish; it does not warrant naming in Future Enhancements (too granular).
- Backtesting is net-new feature scope for the prediction tool, aligned with AC-044-FUTURE-BACKTESTING.
- Architecture Refinement (TD-008 stats split + Playwright spec-name alignment) stays — both are real open items.

### 7.1 Verbatim text

```markdown
## Future Enhancements

Two areas of active development, ordered by priority:

**K-Line Backtesting** — the prediction strategy currently projects a forward 72-hour path from live input. The planned backtesting harness re-runs the same similarity-search + MA99-gate pipeline over historical OHLC windows (walking the ETH/USDT history database one bar at a time), records per-window hit rate and max drawdown, and surfaces a historical-performance report alongside the live prediction. This converts the tool from a forward-looking signal into a hypothesis that can be empirically validated.

**Architecture Refinement** — two structural improvements in the backlog: (1) the frontend/backend stats split (TD-008 Option C, K-013-landed) is locked by `backend/tests/fixtures/stats_contract_cases.json`; remaining work is extending the fixture corpus to cover edge cases like 1-bar projections and empty selection. (2) Align Playwright spec names to their assertions, so a test named "lock disappears after login" asserts exactly that behavior — currently several specs have drifted.
```

AC-044-FUTURE-BACKTESTING check: the K-Line Backtesting paragraph explicitly defines "run the prediction strategy over historical OHLC windows and measuring hit rate / drawdown / equivalent historical-performance metric" — verbatim phrasing satisfies the "specific enough that a reader unfamiliar with the product understands" clause.

---

## 8 Directory Structure Compression (verbatim)

From L227–257 (30 lines with sub-file enumeration) → ≤15 lines, one-line-per-top-dir.

```markdown
## Directory Structure

```
K-Line-Prediction/
├── backend/            ← FastAPI app (predictor, stats, auth)
├── frontend/           ← Vite + React SPA; 5 routes, Playwright specs under e2e/
├── docs/
│   ├── tickets/        ← K-001 ~ latest (AC + Retrospective per ticket)
│   ├── designs/        ← Architect design docs (K-XXX-*.md)
│   ├── retrospectives/ ← Per-role cross-ticket cumulative logs
│   ├── reports/        ← Playwright visual reports
│   └── images/readme/  ← README-embedded screenshots (docs-only assets)
├── scripts/            ← audit-ticket.sh + sync-role-docs.mjs
├── agent-context/      ← architecture.md (SSOT) + conventions.md
├── Dockerfile          ← Two-stage (Node 20 build → Python 3.11 runtime)
└── firebase.json
```

Full directory map and responsibilities: [`agent-context/architecture.md § Directory Structure`](agent-context/architecture.md#directory-structure).
```

---

## 9 AC Coverage Self-Check

| AC | Satisfied by | Verification method at review/QA |
|---|---|---|
| AC-044-AGENT-TEAM-PRIMARY | §2 Section Order item 1 (AI Collaboration Flow first; ROLES marker preserved verbatim; content-delta limited to ordering) | Read rewritten README first section; `scripts/sync-role-docs.mjs --check` exit 0; `grep "<!-- ROLES:start -->" README.md` and `grep "<!-- ROLES:end -->" README.md` both hit once |
| AC-044-BEFORE-AFTER-SCREENSHOTS | §5.2 HTML snippet (plain `<img>` × 2, `width="360"`, alt present, no `<details>`); §5.1 capture params; images committed under `docs/images/readme/` per BQ-044-Q1 | GitHub render side-by-side on desktop viewport; `grep -c '<details>' README.md` = 0 near image block; `ls docs/images/readme/*.png` returns both files |
| AC-044-PREDICTION-DEMOTED | §4 verbatim paragraph (4 sentences, explicit demo framing, link-out to architecture.md); §3 migration table proves 5-step walkthrough + routes table + API endpoints + data flow + stats split all migrated OR already covered by architecture.md | `grep -c "5-page SPA" README.md` = 0; `grep -c "POST /api/predict" README.md` = 0; `grep -c "agent-context/architecture.md" README.md` ≥ 2 (§4 + §8 footer link); prediction paragraph ≤5 sentences; contains words "personal" + "unfinished" (or equivalent: "vehicle", "demo", "illustrative", "incomplete") |
| AC-044-FUTURE-BACKTESTING | §7.1 verbatim text; "K-Line Backtesting" paragraph describes historical-window re-run + hit rate + max drawdown | Reader-test: the paragraph must stand alone; `grep -i "backtest" README.md` hits; `grep -i "historical" README.md` near backtesting hits |
| AC-044-V2-ARC-NARRATIVE | §5.2 narrative paragraph above `<img>` pair; links K-017, K-021, K-034, K-040 (4 tickets, exceeds AC's ≥3 minimum); attributes redesign to "the agent pipeline (not by a single author)" verbatim | `grep -cE "K-017|K-021|K-034|K-040" README.md` ≥ 4; `grep -c "agent pipeline" README.md` ≥ 1 in v2-Redesign section |
| AC-044-REGRESSION-SACRED | §2 note "preserves the entire existing block incl. ROLES marker (Sacred)"; §9 row 1 verifies generator check; agent-team section retained verbatim incl. `./scripts/audit-ticket.sh K-XXX` mention | `node scripts/sync-role-docs.mjs --check` exits 0; pre-commit hook (K-039 Phase 2) passes without `--no-verify`; `grep "audit-ticket.sh" README.md` hits once in AI Collaboration Flow section |

### Sacred AC + DOM-restructure cross-check (grep sweep)

This ticket is **docs-only**; no JSX / DOM / E2E selector surface touched. Grep sweeps from persona §Sacred cross-check:

```bash
grep -rn 'data-testid="cta-' frontend/e2e/ frontend/src/   # 60+ hits, none relevant (no component changes)
grep -rn 'trackCtaClick(' frontend/e2e/ frontend/src/      # no hits on README content
grep -rn 'nextElementSibling.id' frontend/e2e/             # no hits triggered by README edit
```

**Resolution:** N/A — no component deletions / renames / DOM restructuring in this ticket. The only structural concern is the K-039 ROLES marker block (`<!-- ROLES:start -->…<!-- ROLES:end -->`), which AC-044-REGRESSION-SACRED mandates stays byte-identical. Engineer instruction: when reordering README sections, **move the entire agent-team block (current L14–76) as a single unit**; do not edit inside the marker block; re-run `node scripts/sync-role-docs.mjs --check` post-edit and confirm exit 0 before committing.

---

## 10 Self-Diff Verification (architecture.md patch — executed 2026-04-24)

**Source of truth:** ticket §4 BQ-044-Q3 ruling ("move to agent-context/architecture.md; verify coverage; patch any gap"); README current content L80–156 at SHA `058699b`.

**Execution status:** architecture.md patches have been applied to the working tree (staged as `M` via `git status`; Engineer commits). Self-Diff Gate executed this Architect session.

### 10.1 Patch 1 — Data Flow intro (§3.2) — APPLIED

- Inserts: 5 prose bullets + "Call-chain detail (below)." sentence + 2 bold headings + blanks above existing ASCII block at L323.
- Modifies: 0 existing bytes inside current `## Data Flow` section.
- Deletes: 0.
- Measured architecture.md line count delta: **+10 lines** (L324–333 inserted; verified via `git diff agent-context/architecture.md`).
- Post-patch section anchor: `## Data Flow` at L323, new intro at L325–333, existing ASCII call-chain starts at L335.

### 10.2 Patch 2 — new `## Deployment Architecture` section (§3.3) — APPLIED

- Inserts: new top-level section between `## Design System (K-021)` (ends L538) and `## QA Artifacts` (now at L560).
- Modifies: 0 existing sections.
- Deletes: 0.
- Measured architecture.md line count delta: **+19 lines** (L539–557 inserted).
- Post-patch section anchor: `## Deployment Architecture` at L541; ASCII block L543–550; 3 rationale paragraphs L552, L554, L556.

### 10.3 Changelog entry (§3.4) — APPLIED

- Inserts: 1-line changelog bullet + 1 blank at top of `## Changelog` list (newest-first convention).
- Measured delta: **+2 lines**.

### 10.4 Frontmatter `updated:` bump — APPLIED

- Modifies: L5 `updated:` field replaced in-place (prior K-040 narrative demoted to `前置：` prefix; K-044 summary prepended).
- Measured delta: **-1 + 1 = 0 net lines** (1-line in-place replacement).

### 10.5 Total architecture.md line delta (measured, authoritative)

- `git show HEAD:agent-context/architecture.md | wc -l` → **714 lines**
- `wc -l agent-context/architecture.md` (working tree) → **745 lines**
- `git diff --stat agent-context/architecture.md` → **32 insertions, 1 deletion** (= net **+31 lines**)
- Reconciliation: Patch 1 (+10) + Patch 2 (+19) + Changelog (+2) + frontmatter (0 net) = **+31 ✓ MATCH**

### 10.6 Cross-table consistency sweep (§Same-File Cross-Table Consistency Sweep gate)

```bash
grep -n "Deployment" agent-context/architecture.md
# → L5  frontmatter `updated:` narrative (no edit needed; K-044 context mention)
# → L541  new section heading `## Deployment Architecture` (this ticket)
# → L554  new `**Deploy gate:**` paragraph inside new section
# → L681  new Changelog entry mentioning `## Deployment Architecture`
```

Conclusion: the new `## Deployment Architecture` heading appears exactly once as a top-level section. All other occurrences are inline cross-references to it (frontmatter anchor, the section's own body, and the Changelog). No duplicate table / section exists. ✓

### 10.7 Coverage audit parity (8 README blocks → architecture.md disposition)

| README block | Lines | Disposition | Architecture.md anchor | Parity |
|---|---|---|---|---|
| L80–89 "The Product" 5-step | 10 | MIGRATED (Patch 1) | `## Data Flow` intro L325–333 | ✓ 5 bullets both sides |
| L90–99 Frontend Routes table | 10 | ALREADY COVERED | `## Frontend Routing` L457–469 | ✓ SUPERSET (+catch-all row) |
| L102–112 Tech Stack table | 11 | ALREADY COVERED | `## Tech Stack` L24–32 | ✓ 4 rows (Hosting row moved to new Deployment section) |
| L114–124 API Endpoints table | 11 | ALREADY COVERED | `## API Endpoints` L198–286 | ✓ SUPERSET (per-endpoint schemas) |
| L126–140 Data Flow ASCII | 15 | ALREADY COVERED | `## Data Flow` ASCII L335–355 | ✓ SUPERSET (function-level detail) |
| L142–145 Stats split prose | 4 | ALREADY COVERED | `## Consensus Stats SSOT` L359–391 | ✓ SUPERSET (full RFC) |
| L147–156 Deployment ASCII | 10 | MIGRATED (Patch 2) | `## Deployment Architecture` L541–557 | ✓ verbatim ASCII + 3 new rationale paragraphs |
| L227–257 Directory Structure | 30 | STAYS IN README (trimmed) | `## Directory Structure` L35–196 (already richer) | N/A — Engineer trims README, architecture.md already covers deeper |

All 8 blocks resolved. No structural ambiguity. Self-Diff Gate: **PASS**.

---

## 11 Implementation Order for Engineer

1. **Capture screenshots** (§5.1) — one worktree-throwaway for v1 at `80e12d7`; capture at `058699b` HEAD. Commit PNGs under `docs/images/readme/` first (atomic asset drop).
2. **Patch `agent-context/architecture.md`** (§3.2 Data Flow intro + §3.3 new Deployment Architecture section + §3.4 Changelog entry). Architect has verified no conflicts (§10.3).
3. **Rewrite README.md** section-by-section per §2 order:
   a. Keep title + tagline + badges L1–12 unchanged.
   b. Keep AI Collaboration Flow L14–76 as-is (incl. ROLES marker block — DO NOT edit inside markers).
   c. Insert new `## v2 Redesign — Before & After` section per §5.2.
   d. Replace L80–156 (Product + Tech stack + API + Data flow + Stats split + Deployment ASCII) with §4 demo-product short paragraph.
   e. Replace Local Dev L160–177 with §6.1.
   f. Replace Deployment L181–194 with §6.2.
   g. Replace Testing L198–213 with §6.3.
   h. Replace Future Enhancements L217–223 with §7.1.
   i. Replace Directory Structure L227–257 with §8.
4. **Verify**:
   - `node scripts/sync-role-docs.mjs --check` → exit 0
   - `grep -c '<!-- ROLES:start -->' README.md` → 1
   - `grep -c '<!-- ROLES:end -->' README.md` → 1
   - `grep -c 'audit-ticket.sh' README.md` → ≥1
   - `grep -c '<details>' README.md` → 0 in v2-Redesign section (can be non-zero elsewhere; check the section)
   - `grep -cE "K-017|K-021|K-034|K-040" README.md` → ≥4
   - `ls docs/images/readme/homepage-v1-pre-redesign.png docs/images/readme/homepage-v2-current.png` → both present
5. **Commit** — single commit preferred; file class is `docs/**` + `*.png` (assets), gate = no-gate per CLAUDE.md commit gate table (tag commit message `docs-only`).

No parallelization opportunity — all edits are in `README.md` + `architecture.md` + 2 new PNG files; single-threaded.

---

## 12 Risks and Notes

### 12.1 K-039 ROLES marker fragility (C1 from ticket §6.1)

Highest regression risk. Engineer must treat `<!-- ROLES:start -->` through `<!-- ROLES:end -->` as a byte-locked block. If section reordering requires moving the AI Collaboration Flow, move the entire L14–76 range together, not just the table. Re-run `node scripts/sync-role-docs.mjs --check` before commit. Pre-commit hook will block a mismatched commit anyway; verify locally first to avoid rework.

### 12.2 Image asymmetry risk (C2 from ticket §6.1)

Both captures must be 1440×900 viewport, scroll 0, viewport-mode (not full-page). If Engineer uses Playwright, explicit config:

```js
{ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
await page.goto('http://127.0.0.1:5173/')
await page.waitForLoadState('networkidle')
await page.screenshot({ path: 'docs/images/readme/homepage-vX-...png', fullPage: false })
```

`fullPage: false` is the default but explicit is better. Do NOT use `fullPage: true` — the README is comparing folds, not full scrolls.

### 12.3 Pre-v2 SHA drift if 80e12d7 gets rebased

Unlikely (SHA is on main), but if main history is ever rewritten the caption SHA must be updated. Per BQ-044-Q5 ruling, re-capture is NOT automatic on drift; only on a new ticket that materially changes the v2 homepage appearance. The SHA caption is honesty-documentation, not an auto-refresh contract.

### 12.4 Recruiter depth loss (C4 from ticket §6.1)

Mitigated by the §4 paragraph's explicit link-out `See [\`agent-context/architecture.md\`](agent-context/architecture.md)` plus the §5.2 v2-arc paragraph's 4 ticket links. A recruiter who clicks through lands on either the full system architecture or a specific ticket; both surface the real depth.

### 12.5 AC vs Pencil conflict check

N/A — `visual-delta: none`; no Pencil frame is the source of truth for this ticket. Ticket AC authority is the sole source. No conflict possible.

---

## Retrospective

**Where most time was spent:** validating that `80e12d7` actually boots (Challenge C3 mandate). Setting up worktree `node_modules` symlink + confirming Vite serves a recognizable pre-v2 state (`bg-gray-950` body class vs v2's `bg-paper`) was the load-bearing action — without it, the entire ticket premise collapses at Engineer handoff.

**Which decisions needed revision:** initial plan was to migrate all 5 prediction content blocks into architecture.md; verification revealed 4 of 5 are already covered (Tech Stack, Routes, API Endpoints, Data Flow, Stats split) and only Deployment Architecture is a real gap. Revised migration plan to "delete-from-README, already-covered" for 4 blocks and "patch architecture.md" for 1 block. Prevents duplicate-ownership drift (K-034/K-039 lesson).

**Next time improvement:** for docs-migration tickets, run coverage-audit grep on the target doc FIRST before writing the migration plan. Checking architecture.md `## ` section list against README section list in one diff would have saved a pass.
