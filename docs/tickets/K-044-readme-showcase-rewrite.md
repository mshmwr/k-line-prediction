---
ticket: K-044
title: README showcase rewrite — agent team primary identity + v2 before/after screenshots
type: docs
priority: medium
status: closed
created: 2026-04-24
closed: 2026-04-24
closed-commit: 837b037
closed-merge-datetime: 2026-04-24T19:26:04+08:00
owner: PM
visual-delta: none
content-delta: yes
design-locked: N/A
qa-early-consultation: docs/retrospectives/pm.md 2026-04-24 K-044 (QA proxy by PM, 4 challenges)
visual-spec: N/A — reason: docs-only README rewrite, no Pencil surface
worktree: .claude/worktrees/K-044-readme-showcase-rewrite
branch: K-044-readme-showcase-rewrite
---

# K-044 — README showcase rewrite: agent team primary identity + v2 before/after screenshots

## 1. Context

Current top-level `README.md` (`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/README.md`) frames the project as a K-line prediction tool, with the AI collaboration flow positioned as a supporting artifact. Portfolio positioning is inverted from reality:

- **The 6-role agent pipeline** (PM → Architect → Engineer → Reviewer → QA + Designer) is the actual product of this repo's end-to-end showcase. It has been codified across K-017 → K-040 and produces a verifiable artifact trail for every ticket.
- **The K-line prediction feature** is a personal, unfinished mini product that serves as the vehicle/demo surface for the pipeline.
- **The v2 sitewide redesign arc** (K-017 → K-040: `/about` portfolio, homepage v2, sitewide design system, Bodoni → Geist Mono typography) is the most visually tangible before/after evidence of the collaboration flow's output, and the current README does not surface it.

This ticket rewrites README to lead with the agent team identity, insert a before/after homepage screenshot pair (small size, side by side, plain `<img>`), demote the prediction feature to a short "demo product" paragraph, and add one sentence on the K-line backtesting future enhancement.

## 2. Source of Truth Handoff

**Pre-v2 homepage screenshot source commit:** `80e12d7` ("feat: K-001~K-007 closed + Firebase deploy infra + K-002 unified UI", 2026-04-18) — parent of `2318e67` ("wip(K-017): Homepage v2 實作進行中"). At `80e12d7` the homepage is the pre-v2 (v1) state.

**Post-v2 homepage screenshot source:** `058699b` (current main HEAD after full v2 arc K-017 → K-042).

**v2 arc span for narrative:** K-017 (about portfolio + homepage v2 pivot) → K-040 (sitewide Bodoni → Geist Mono + 8 UI polish items). Cites K-017, K-021 (sitewide design system), K-024 (`/diary` structure + schema), K-034 (`/about` spec audit + workflow codification), K-040 (typography + polish batch).

**Display rule (user explicit):** plain `<img width="...">` side-by-side pair. **No `<details>` collapsible**. Image size "不用太大" (small).

## 3. Acceptance Criteria

### AC-044-AGENT-TEAM-PRIMARY
- **Given** a reader lands on the repo README
- **When** they read the first screen (title + tagline + first section)
- **Then** the first section after the title must be the 6-role agent team framing (flow diagram + role table), not the prediction-feature framing
- **And** the current AI Collaboration Flow content (6-role table + audit-ticket.sh + Bug Found Protocol + Per-Role Retrospective Logs) must be preserved verbatim in the rewritten section (content-delta limited to section ordering and headline wording; the ROLES table marker block `<!-- ROLES:start -->…<!-- ROLES:end -->` must remain intact for the K-039 generator contract)

### AC-044-BEFORE-AFTER-SCREENSHOTS
- **Given** a reader reaches the "v2 redesign" / showcase section
- **When** the page renders on GitHub
- **Then** two homepage screenshots (pre-v2 `v1` and post-v2 `v2`) must render side-by-side using plain `<img>` tags with an explicit `width` attribute (recommended ≤ 360px each, user directive "圖片size不用太大")
- **And** no `<details>` / collapsible element wraps the images
- **And** both images must be committed into the repo under a documented path (Architect decides between `docs/images/readme/` new dir vs `frontend/design/screenshots/` reuse — see BQ-044-Q1)
- **And** both images must carry an `alt` attribute describing the homepage state (e.g., `alt="Homepage v1 (pre-redesign)"`, `alt="Homepage v2 (current)"`)

### AC-044-PREDICTION-DEMOTED
- **Given** a reader scrolls past the agent team section and the showcase pair
- **When** they reach the product description
- **Then** the K-line prediction feature must be framed in one short paragraph (≤ 5 sentences) explicitly labeled as a **personal, unfinished demo product** or equivalent language ("vehicle", "demo surface", "illustrative product")
- **And** the detailed 5-step prediction walk-through (current README L84–89), Frontend Routes table, API Endpoints table, Data Flow block, and Stats split paragraph must not appear in the top-level README; they either (a) move to `docs/product.md` or similar, or (b) are deleted outright — Architect decides in design doc
- **And** the new short paragraph must NOT claim production readiness, completion, or commercial intent for the prediction feature

### AC-044-FUTURE-BACKTESTING
- **Given** a reader reaches the Future Enhancements section
- **When** they read its contents
- **Then** at least one sentence must describe **K-line app backtesting** (historical strategy backtest) as a planned enhancement
- **And** the sentence must be specific enough that a reader unfamiliar with the product understands "backtesting" means running the prediction strategy over historical OHLC windows and measuring hit rate / drawdown / equivalent historical-performance metric

### AC-044-V2-ARC-NARRATIVE
- **Given** a reader reads the showcase section surrounding the before/after images
- **When** they look for the attribution of the redesign
- **Then** a one-paragraph narrative must identify the v2 arc as **K-017 → K-040** and link at least 3 ticket files by relative path (e.g. `docs/tickets/K-017-about-portfolio-enhancement.md`, `docs/tickets/K-021-sitewide-design-system.md`, `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md`, `docs/tickets/K-040-sitewide-ui-polish-batch.md`)
- **And** the narrative must explicitly attribute the redesign output to the agent pipeline (not to a single author), reinforcing AC-044-AGENT-TEAM-PRIMARY

### AC-044-REGRESSION-SACRED
- **Given** the K-039 split-SSOT generator contract exists
- **When** the rewritten README is committed
- **Then** the `<!-- ROLES:start --> … <!-- ROLES:end -->` marker block must remain present and match the `content/roles.json` → Markdown output exactly (re-run `scripts/sync-role-docs.mjs --check` exits 0)
- **And** the pre-commit hook (K-039 Phase 2) must pass on the rewritten README without manual bypass
- **And** `audit-ticket.sh K-XXX` invocation instructions must remain discoverable in the agent-team section (path `./scripts/audit-ticket.sh K-XXX`)

## 4. Blocking Questions

### BQ-044-Q1 — Image commit directory
- **Question:** Where do the two homepage screenshots live?
  - (a) New dir `docs/images/readme/` (scoped to README assets; signals "this file belongs to the top-level README")
  - (b) Reuse `frontend/design/screenshots/` (aggregates with existing Pencil screenshots; potentially confusing because Pencil screenshots are design artifacts, not live-app captures)
- **PM ruling (priority 2 — ticket text authority):** **Option (a) `docs/images/readme/`**. Rationale: Pencil screenshots in `frontend/design/screenshots/` are design-spec artifacts exported from `.pen` files (K-034 Designer SSOT) and semantically distinct from live-app captures. Mixing live app screenshots into the design-spec dir would break the SSOT contract. Architect should create `docs/images/readme/` and place `homepage-v1-pre-redesign.png` + `homepage-v2-current.png` there.

### BQ-044-Q2 — Screenshot capture method
- **Question:** How do we capture the pre-v2 and post-v2 homepage screenshots?
  - (a) One-shot manual Playwright run — Architect/Engineer checks out `80e12d7`, runs `npm install && npm run dev`, captures homepage at a fixed viewport; then returns to main HEAD, captures v2 homepage. Screenshots are committed; capture script is throwaway.
  - (b) Committed reproducible script — write a `scripts/capture-readme-screenshots.mjs` that does the two checkouts + captures programmatically, committed alongside the screenshots for future re-runs.
- **PM ruling (priority 3 — memory: portfolio showcase is a one-shot snapshot, not a live dashboard):** **Option (a) one-shot manual capture**. Rationale: the before/after is a frozen portfolio artifact; the v1 state will never come back (no reason to re-capture). Committing a reproducible script adds long-term maintenance surface for a one-time operation. Architect/Engineer captures once, commits the two PNG files, notes the source SHAs in the README so future readers can verify provenance. **Viewport:** use **1440×900** (same as Designer screenshot default for `/about` showcase exports) for visual parity with existing design screenshots.

### BQ-044-Q3 — Fate of current prediction detail content
- **Question:** What happens to the detailed prediction content currently in README L80–156 (5-step walk-through, Frontend Routes table, API endpoints, Data Flow, Stats split, Deployment Architecture)?
  - (a) Move to a new `docs/product.md` (preserves content, provides deep-link for curious readers)
  - (b) Delete outright (portfolio focus; anyone technical can read the code)
  - (c) Move to `agent-context/architecture.md` (already the canonical architecture doc)
- **PM ruling (priority 2 — ticket text + priority 4 — codebase):** **Option (c) move to `agent-context/architecture.md`**. Rationale: (1) `agent-context/architecture.md` is the existing canonical source for system architecture, API endpoints, data flow, deployment — these are already its responsibility per its own scope statement. (2) Creating a parallel `docs/product.md` duplicates ownership and invites drift (K-034/K-039 lessons on SSOT). (3) Deleting outright loses content that backfills the "demo product" short paragraph for recruiter deep-reads. Architect should verify `agent-context/architecture.md` already covers each item; any gap → patch `architecture.md`, not create new doc. README's new "demo product" short paragraph links to `agent-context/architecture.md` for depth.

### BQ-044-Q4 — Local Development / Deployment / Testing sections
- **Question:** Keep or remove the Local Development (L160–177), Deployment (L181–194), Testing (L198–213) sections?
- **PM ruling (priority 4 — codebase convention):** **Keep all three, but compress each to ~5 lines max**. Rationale: these are standard README sections expected by any engineer cloning the repo; removing them breaks the "clone and run" contract. However, current versions are verbose for a portfolio README. Architect should propose tight versions (command block only, minimal prose) in the design doc.

### BQ-044-Q5 — Freshness policy when main advances post-K-044
- **Question:** What happens to the v2 screenshot when main advances with further UI work (e.g. K-043 hero mobile backfill, future tickets)?
- **PM ruling (priority 3 — memory + codebase policy):** **Document as "captured at SHA `058699b`, 2026-04-24"** inline in the README (e.g., alt text or caption). Future UI tickets do NOT automatically trigger re-capture; re-capture is a new ticket when visual drift is material. Rationale: (1) Portfolio screenshots are timestamped artifacts, not live dashboards. (2) Chasing every UI tweak with a README re-capture is unsustainable. (3) Explicit SHA pinning in README gives honest provenance. Architect should codify this in the Future Enhancements / Provenance note.

## 5. Scope

### 5.1 Required files touched
- `README.md` — full rewrite (section reorder, content demotion, image embed, v2 arc narrative, backtesting sentence)
- `docs/images/readme/homepage-v1-pre-redesign.png` — new (captured from `80e12d7`)
- `docs/images/readme/homepage-v2-current.png` — new (captured from `058699b`)
- `agent-context/architecture.md` — verify coverage of routes / API / data flow / deployment; patch any gap (see BQ-044-Q3)

### 5.2 Out of scope
- No Pencil design changes (`visual-delta: none`)
- No code changes under `frontend/src/` or `backend/`
- No schema / AC changes to prior closed tickets
- No E2E / Vitest / pytest additions (docs-only runtime; K-039 pre-commit hook on `content/roles.json` is the only mechanical gate)
- K-043 (parallel Hero mobile spec backfill) — do NOT touch; worktree isolated separately

### 5.3 Shared components expected on this route
N/A — README is top-level repo doc, not a frontend route. Shared-component inventory rule applies to `frontend/src/routes/*` only.

## 6. QA Early Consultation (PM proxy, docs-only tier)

**Tier decision:** `visual-delta: none` + `content-delta: yes` + no runtime code touched + no schema / API / migration → docs-only tier per `feedback_qa_early_proxy_tier.md`. PM proxy allowed with 3 hard rules satisfied:

1. Retrospective log tag: `QA Early Consultation — QA proxy by PM` (written into `docs/retrospectives/pm.md` entry for K-044)
2. Adversarial self-check ≥3 items (4 below, exceeds minimum)
3. Fail-once escalation: if Reviewer or user finds an edge case missed by this proxy → next same-class ticket forces real qa spawn

### 6.1 Adversarial challenges (4)

**Challenge C1 — K-039 ROLES marker block drift:**
Risk: rewriting README reorders or re-wraps the `<!-- ROLES:start -->…<!-- ROLES:end -->` block, breaking `scripts/sync-role-docs.mjs --check` pre-commit hook. PM response: AC-044-REGRESSION-SACRED mandates the block stays byte-identical to generator output, and the pre-commit hook must pass. Engineer instruction: edit README around the block, not inside it; if reordering sections requires moving the block, move the entire block as a unit then re-run generator to verify.

**Challenge C2 — Before/after image asymmetry (different viewports, different zoom, different scroll position):**
Risk: v1 captured at 1440×900 and v2 at 1920×1080 makes the before/after unfair — reader compares apples to oranges. PM response: BQ-044-Q2 ruling pins both to **1440×900**, both captured at **scroll position 0 (top of page)**, both in **full-viewport screenshot mode** (not full-page — portfolio comparison is the fold, not the depth). Architect must codify these capture params in design doc.

**Challenge C3 — Pre-v2 commit `80e12d7` might not actually render (dep drift, build breakage at old SHA):**
Risk: Engineer checks out `80e12d7`, runs `npm install`, hits dependency resolution errors or TypeScript errors that make `npm run dev` fail. Capture becomes impossible. PM response: (1) Architect must pre-verify the capture attempt in design doc (checkout + install + dev server smoke test) BEFORE final ticket release to Engineer. (2) If `80e12d7` fails to render, fallback to next-later commit that renders the pre-v2 homepage (e.g., `5e11ccc` "docs(README): add Future Enhancements section" or any commit before `2318e67` K-017 WIP) — document fallback SHA in README provenance. (3) If no pre-K-017 commit renders, blocker: report back to PM; v1 screenshot may need to be re-created by reverting K-017 in a dedicated throwaway branch. Architect owns the capture feasibility gate.

**Challenge C4 — Prediction section demotion loses recruiter-relevant depth:**
Risk: a recruiter reading the new README sees a 5-sentence prediction blurb, doesn't click through to `agent-context/architecture.md`, misses the quantitative substance of the product. PM response: AC-044-PREDICTION-DEMOTED mandates a link to `agent-context/architecture.md` (or equivalent) from the short paragraph, explicitly phrased as "see [architecture.md] for the 5-step prediction pipeline, API endpoints, and data flow." Architect writes the exact link-phrasing proposal in design doc.

### 6.2 PM rulings summary
- C1 → AC-044-REGRESSION-SACRED (supplemented)
- C2 → BQ-044-Q2 ruling (viewport + scroll + screenshot-mode pinned)
- C3 → Architect feasibility pre-check gate (added to §7 Pre-Design items)
- C4 → AC-044-PREDICTION-DEMOTED enhanced with mandatory link-out (in place)

**0 challenges declared Known Gap.** All 4 patched into AC / BQ ruling / pre-design item.

## 7. Pre-Design items for Architect

1. **Capture feasibility pre-check (mandatory per Challenge C3):** before writing the design doc final version, attempt `git checkout 80e12d7 && cd frontend && npm install && npm run dev`. Confirm the homepage renders a recognizably pre-v2 state. If fails, identify working fallback SHA and record in design doc §1.
2. **Section ordering proposal:** design doc must propose the exact new section order with 1-line rationale per section. Must place agent-team framing first (after title + badges), before any product/demo content.
3. **Prediction content migration plan:** design doc §N must show exact content moves — which L-ranges from current README go to `agent-context/architecture.md`, which are deleted, what the new "short paragraph" says verbatim.
4. **Image embed snippet:** design doc must provide the exact HTML snippet for the side-by-side images (widths, alt text, wrapper markup, captions/provenance line if any).
5. **Future Enhancements rewrite:** design doc must propose new Future Enhancements section text including the backtesting sentence. Current text (L217–223) has two items (Design System Completion, Architecture Refinement); backtesting is a third item OR replaces the first (Design System Completion is largely achieved via K-021/K-034/K-040 — Architect decides).

## 8. Release Status

- **2026-04-24 — ticket opened by PM.** Worktree created at `.claude/worktrees/K-044-readme-showcase-rewrite/` on branch `K-044-readme-showcase-rewrite` from main HEAD `058699b`. QA Early Consultation proxy-completed by PM (4 challenges raised, 4 patched to AC/BQ/pre-design; 0 Known Gap). BQ-044-Q1 through BQ-044-Q5 ruled by PM per 4-source priority. **Next gate:** Architect release for design doc (capture feasibility pre-check + section-order proposal + content-migration plan + image-embed snippet + Future Enhancements rewrite).

## 9. Retrospective

(to be filled at close)
