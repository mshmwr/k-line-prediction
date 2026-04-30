# Agents Ruleset Highlights

> Ten representative rules from the K-Line Prediction harness, each tagged with its owning agent (PM / Architect / Engineer / Reviewer / QA / Designer) and the originating ticket (K-XXX). Full personas (~130 KB combined) live in private Claude Code config at `~/.claude/agents/*.md`; the excerpt below is selected for harness-design insight, not exhaustive coverage.
>
> Each rule names the specific bug that made it exist. Two pairs defend the same bug at different roles — #3 + #7 on K-013 (design-time + review-time), #5 + #9 on K-035 (implementation-time + sign-off-time). Two-role coverage is why the same bug has not recurred.
>
> Acronyms used below: **AC** = acceptance criteria (the ticket's testable requirements). **BQ** = blocking question (a structured escalation from a downstream role to PM, which halts further handoffs until PM rules).
>
> Last synced: 2026-04-24.

## 1. Content-Alignment Gate (PM, K-044)

**Rule:** For tickets with `content-delta: yes` on a user-voice file (README, portfolio copy, CV, roadmap text), PM inserts an explicit alignment gate between Architect return and Engineer release. PM surfaces verbatim to the user — not summaries — proposed section order, every rewritten paragraph ≥2 sentences, image/embed HTML, and any list add/remove/reorder. Engineer is not dispatched until the user responds. Internal dev docs (`persona-overrides/*.md, ssot/*.md`, retrospectives, tickets, architecture specs) are exempt.

**Bug it prevents:** K-044 — this README. PM was about to dispatch Engineer after Architect returned a good design doc. The user paused and said content framing (which paragraph opens, tagline tone, paragraph length) is user voice — not derivable from code or Pencil design. The rule was written after this pause, and this commit passed through it.

---

## 2. AC Sole-Authorship (PM, K-022)

**Rule:** Only PM may edit ticket AC text. Architect / Engineer / Reviewer / QA discovering an AC↔design or AC↔code mismatch file a BQ; PM rules and personally edits the ticket. If another role is detected editing AC text, the edit is reverted, the BQ is restated in PM voice, and PM edits in-turn.

**Bug it prevents:** K-022 — Architect edited the ticket AC (tagline font, section count) in good faith. Once AC editing was permitted from non-PM roles, accountability fragmented and the cross-role Sacred checks lost their referent. The result was a three-way drift: ticket AC → E2E spec → implementation all encoded different truths.

---

## 3. Pre-Design Dry-Run Proof (Architect, K-013)

**Rule:** When the design doc references any pre-existing / legacy / API-invariance assertion, or rewrites any frontend computation (useMemo / useCallback / derived state / event handler branching), three gates must all pass before delivery:

- **Gate 1** — files-inspected truth table: every row attaches a `git show <base>:<path>` log plus an input × output truth table enumerating all relevant branch combinations.
- **Gate 2** — any use of "pre-existing" / "legacy behavior preserved" halts design until `git show <base-commit>:<file>` is run and dry-run'd against all input cases, with `git show <commit>:<path>:L<start>-<end>` cited inline.
- **Gate 3** — API-invariance dual-axis: (a) wire-level schema `git diff main -- <schema-file>` = 0 lines or explicit PM Known Gap, AND (b) frontend-observable behavior diff table for every useMemo / useCallback / event handler output key, minimum four rows: full-set / subset / empty / boundary.

**Bug it prevents:** K-013 — Consensus chart disappeared silently after a refactor claiming "API unchanged". Architect's narrative survived review; tsc and tests were both green. The OLD `displayStats` branch (full-set / subset / empty × bars<2 / bars≥2) was never dry-run'd, and the API-invariance section covered backend schema only.

---

## 4. Global Style Route Impact Table (Architect, K-021)

**Rule:** When the ticket's File Change List includes `index.css`, `tailwind.config.js`, or any sitewide CSS variable / token file, the design doc lists every route from `ssot/system-overview.md` and marks each **affected** / **must-be-isolated** / **unaffected**. For every must-be-isolated route, the design doc includes an explicit override spec. "Engineer decides" = design incomplete.

| Route | Status | Notes |
|-------|--------|-------|
| /     | affected / must-be-isolated / unaffected | ... |

**Bug it prevents:** K-021 — the ticket added `body { bg-paper }` globally but did not list `/app` as "must be isolated." Engineer had no spec to preserve `/app`'s standalone dark-themed background; the `sitewide-body-paper.spec.ts` test even validated the wrong state as correct, so the regression was invisible to tests.

---

## 5. Step 0a Shared-Component Inventory (Engineer, K-035)

**Rule:** Before creating or editing `*Section.tsx` / `*Bar.tsx` / `*Footer.tsx` / `*Header.tsx` / `*Hero.tsx` under `frontend/src/components/<page>/`, grep peer page directories for same-role components. Any hit = STOP + BQ to Architect (is this a shared primitive? do we extract, import, or justify divergence?). Zero hits = proceed, with a `Used on:` docstring mandatory.

**Bug it prevents:** K-035 — `HomeFooterBar` (on `/`) and `FooterCtaSection` (on `/about`) coexisted with neither importing the other. The drift slipped past K-017, K-021, and K-022 because no role ran a reverse-scan against existing shared chrome at implementation time.

---

## 6. Step 0c Frame Spec JSON Read (Engineer, K-024)

**Rule:** Ticket frontmatter `visual-delta: yes` → Engineer reads `frontend/design/specs/<frame-id>.json` and `frontend/design/screenshots/<frame-id>.png` before writing code. Implementation mirrors the JSON layout / typography / color / card structure verbatim — no creative extension. Missing artifact → blocker to PM. Engineer does not call `mcp__pencil__*` directly; Pencil access is centralized via Designer. The commit cites the JSON SHA.

**Bug it prevents:** K-024 — implementation and tests both used `·` (middle-dot) from the AC text while the Pencil design used em-dash `—`. Green Playwright plus an eyeballed Pencil screenshot both missed it because assertions matched the wrong literal. Reading JSON and importing assertions from it eliminates the eyeball-vs-literal drift.

---

## 7. Pure-Refactor Behavior Diff (Reviewer, K-013)

**Rule:** When `ticket.type === 'refactor'` OR the change is a source-of-truth migration / util extraction / hook relocation, the Behavior Diff table is Step 1 — enumerate every input path, list OLD return key/value set vs NEW; any unproven difference = Critical. "Pre-existing" claims in the design doc require code-level verification: Reviewer MUST run `git show <base-commit>:<file>` and dry-run the OLD code. Skipping this = INCOMPLETE review, not PASS. Behavioral equivalence is the only passing criterion — tsc green + tests green + AC literal match + design-doc claim are insufficient without it.

**Bug it prevents:** K-013 — paired with rule #3. The Consensus chart disappearance slipped past two layers: Architect's "API unchanged" narrative was accepted without dry-run, and Reviewer's breadth scan passed on tsc + tests alone. Behavior-diff-as-Step-1 catches the class at review time, not at user-report time.

---

## 8. Git Status Commit-Block Gate (Reviewer, K-037)

**Rule:** Before issuing any `PASS` / `APPROVED FOR MERGE` verdict, Reviewer runs `git status --short` and inspects for uncommitted runtime files (`frontend/src/**`, `frontend/e2e/**`, `frontend/public/**`, `frontend/index.html`, `*.config.ts`, `backend/**`). Zero modified / untracked in runtime scope → standard verdict applies. Any `M` or `??` in runtime scope → verdict is downgraded to **`CODE-PASS, COMMIT-BLOCKED`** with an explicit file list. Doc-only / retrospective `.md` uncommitted → observational only, not a blocker.

**Bug it prevents:** K-037 — the Step 1 breadth scan issued "APPROVED FOR MERGE" while `git status` showed five uncommitted runtime files (`index.html`, `playwright.config.ts`, `manifest.json`, a favicon spec, `diary.json`). A merge-ready claim on an uncommitted branch is a false signal — a fast-forward merge would fast-forward to a commit that doesn't contain the reviewed changes.

---

## 9. Cross-Page Shared-Component Consistency (QA, K-035)

**Rule:** Every shared chrome component (Footer, NavBar, Hero, PageHeader, CTA block, banner) rendering on ≥2 routes MUST have a `frontend/e2e/shared-components.spec.ts` asserting DOM / innerText equivalence across ALL consuming routes. Per-route presence assertions ("NavBar visible on /about") are insufficient — they pass even when a route renders duplicate inline copy with matching text. Required: capture a reference route's `outerHTML` / `innerText`, compare every other consuming route against the reference. Route-specific variations (`aria-current`, active-link highlight) are allowed as explicit modulo exceptions with a spec comment. An existing spec containing `"route X renders <LocalComponent>, NOT <SharedComponent>"` is a red flag, not an AC — flag to PM immediately.

**Bug it prevents:** K-035 — paired with rule #5. The `/about` Footer drift slipped past K-017, K-021, K-022 because every footer assertion was route-local. K-021's `sitewide-footer.spec.ts` actively codified the drift as "intentional" with the assertion `/about keep FooterCtaSection, do not render HomeFooterBar`. The spec itself was enforcing the bug.

---

## 10. AC↔Pencil Conflict — No Silent Ruling (Designer, K-040)

**Rule:** When Designer is invoked to triage an AC↔design conflict, Designer classifies the conflict type: PRD-vs-Pencil / PRD-vs-code (return to Engineer via PM) / Pencil-vs-code (Designer rulable — implementation drift from signed design). **PRD-vs-Pencil → forbidden to rule.** Designer outputs plain BQ format: verbatim PRD AC text, verbatim Pencil passage with frame-id, observed behavior evidence, and an explicit "cannot-rule reason: user is the only authority to resolve PRD-authored intent vs design-committed intent." Forbidden output patterns (automatic violation): Designer verdict "(b) design-removed per K-024 §6.8"; scoring / rating / weighting alternatives; option A / option B ballot for PM to pass through; three-source evidence table supporting one side.

**Bug it prevents:** K-040 BQ-040-03 — post-close, the `/diary` mobile timeline was missing. Designer returned the verdict "(b) design-removed" plus a three-source evidence ballot instead of a plain BQ. User ruled restore. Evidence framing from a non-ruling role is itself a tacit ruling.

---

## Not listed

The production personas carry ~15–20 rules each (~100 rules across six roles). The ten above were selected for harness-design insight — cross-role pairing, sharp bug stories, distinct classes of failure. Rules not surfaced here include concurrency-gate fail-dry-run testing, sanitize-by-sink-not-source input handling, migration content-preservation enumeration, shared-component inventory at review, sitewide token audit, JSDoc stale-token sweep, and the Bug Found Protocol four-step sequence (retro → PM confirm → memory → persona codify before any fix). Full ruleset lives in private Claude Code config at `~/.claude/agents/*.md` for IP reasons.
