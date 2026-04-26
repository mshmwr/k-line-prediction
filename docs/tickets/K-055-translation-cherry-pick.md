---
id: K-055
title: K-Line docs translation cherry-pick from outer codex branch
status: open
type: docs
priority: low
created: 2026-04-26
visual-delta: none
content-delta: yes
qa-early-consultation: pending — real qa required pre-execution (translation correctness + frontmatter integrity + heading structure preservation across ~150 docs files; PM proxy not authorized for content/portfolio category per `feedback_qa_early_proxy_tier.md`)
parent-plan: ~/.claude/plans/pm-ux-ux-wild-shore.md
predecessor: K-054 — translation cherry-pick was originally bundled into K-054 §Scope but split out 2026-04-26 because outer Diary `codex/translate-k-line-docs-en` branch had 4 files with residual Chinese blocking the pre-cherry-pick sweep. K-054 shipped README cleanup + 3-file CJK violation fix without translation; K-055 owns the deferred ~150-file cherry-pick.
external-dependency: outer Diary repo branch `codex/translate-k-line-docs-en` must reach completion — zero residual Chinese characters in `ClaudeCodeProject/K-Line-Prediction/docs/**/*.md` + `Dockerfile` per `grep -rPn "[\x{4e00}-\x{9fff}]" docs/ Dockerfile` returning empty — BEFORE K-055 enters Architect dispatch. Operator triggers outer-AI top-up if completeness check fails; K-055 worktree halts at the Chinese-sweep gate and resumes when fresh branch lands.
blocked: yes — until outer-AI translation of remaining 4 files lands. Status flips to `in-progress` only after pre-execution Chinese sweep on outer branch returns empty.
---

## Goal

Cherry-pick the ~150-file English translation of K-Line documentation from outer Diary repo `codex/translate-k-line-docs-en` branch into inner K-Line `main`, so every README-reachable retrospective / design doc / ticket is in English per global CLAUDE.md §Language rule "all `.md` files write in English".

## Background

K-054 plan §Ticket Split originally bundled the translation cherry-pick into K-054 because operator does not review translation accuracy line-by-line, so single-PR ship had no review-burden cost. During K-054 execution (2026-04-26), pre-cherry-pick sweep on outer Diary `codex/translate-k-line-docs-en` branch confirmed 4 files still carried residual Chinese — outer-AI translation incomplete. Operator approved scope split: ship K-054 README cleanup + 3-file CJK violation fix immediately (zero coupling to translation completeness), defer translation cherry-pick to K-055 placeholder.

The outer translation work is owned by an external AI service (Codex), not this PM/Architect/Engineer chain. K-055 waits for the external dependency, then runs the mechanical cherry-pick + Chinese-sweep gate.

## Scope

### In-scope (Phase 1 — execution)

- Extract content from outer Diary `codex/translate-k-line-docs-en` branch for paths matching `ClaudeCodeProject/K-Line-Prediction/docs/**/*.md` + `ClaudeCodeProject/K-Line-Prediction/Dockerfile`
- Write extracted content into inner K-Line worktree (preserves outer-branch checkout from polluting inner working tree)
- Pre-commit Chinese sweep gate: `grep -rPn "[\x{4e00}-\x{9fff}]" docs/ Dockerfile` returns empty before merging
- Spot-check sample (5 random translated files): YAML frontmatter integrity + heading structure preserved + no markdown corruption from translation pass

### Out-of-scope

- Translation accuracy review — operator does not line-by-line audit translation quality (per K-054 plan §BQ 3); K-055 trusts outer-AI output as long as Chinese-sweep gate returns empty
- Translation top-up if final completeness check fails — that is an external dependency, not a K-055 deliverable. K-055 worktree halts at the Chinese-sweep gate; operator triggers outer-AI re-run; K-055 resumes when fresh branch lands
- Files outside `ClaudeCodeProject/K-Line-Prediction/docs/**` or `ClaudeCodeProject/K-Line-Prediction/Dockerfile` — outer codex branch may translate Career / CV docs / superpowers specs; those are not README-reachable from inner K-Line and stay outside K-055 scope (handled by separate outer-Diary tickets)

## Acceptance Criteria

### AC-K055-01 — Outer translation completeness pre-gate

**Given** outer Diary `codex/translate-k-line-docs-en` branch is the source of translated content
**When** pre-execution sweep runs `git -C /Users/yclee/Diary diff --name-only main..codex/translate-k-line-docs-en -- 'ClaudeCodeProject/K-Line-Prediction/**'` and per-file `grep -P "[\x{4e00}-\x{9fff}]"` on each diff'd file
**Then** every diff'd file in K-Line scope returns zero CJK matches
**And** if any file fails the sweep, K-055 halts before Architect dispatch with `external-dep-block` PM ruling — operator triggers outer-AI top-up

### AC-K055-02 — Cherry-pick mechanism (no outer-branch checkout)

**Given** the cherry-pick must not pollute outer Diary working tree (outer is on `main`)
**When** K-055 Engineer runs the extraction loop
**Then** the loop uses `git -C /Users/yclee/Diary show codex/translate-k-line-docs-en:<path>` per file (read-only ref access, no checkout)
**And** writes extracted content to inner K-Line worktree paths matching `ClaudeCodeProject/K-Line-Prediction/<path>` stripped prefix
**And** outer Diary repo `git status` is unchanged after the loop completes

### AC-K055-03 — Inner Chinese-sweep gate (post-cherry-pick)

**Given** the cherry-pick loop has finished writing into inner K-Line worktree
**When** `grep -rPn "[\x{4e00}-\x{9fff}]" docs/ Dockerfile` runs from inner worktree root
**Then** the grep returns zero matches (excluding any explicit allow-list paths declared in worktree's `.gitattributes` or scope override)
**And** any non-empty result halts the commit — fresh outer-branch top-up required

### AC-K055-04 — Frontmatter + heading integrity sample check

**Given** translated files may corrupt YAML frontmatter or markdown heading hierarchy during translation
**When** Phase 2 spot-check picks 5 random translated files via `git diff --name-only HEAD origin/main -- 'docs/**/*.md' | shuf -n 5`
**Then** each sample passes YAML lint (frontmatter parses without error) AND heading-level continuity is preserved (no `##` → `####` jumps not present in original)
**And** any corruption flags fresh outer-AI top-up required

### AC-K055-05 — Two-commit split for review legibility

**Given** the translation cherry-pick is bulk (~150 files) and has zero per-file review burden
**When** the K-055 PR is created
**Then** commits split into: (1) `docs(K-055): integrate K-Line documentation English translation` (bulk file content from outer branch), (2) optional follow-up if any helper script (`scripts/integrate-translation.sh`) lands in repo
**And** PR description ties both commits to one motivation: "K-054 translation deferral close — bring all README-reachable retrospectives into English coherence"

## Phase plan

### Phase 0 — External dependency wait

K-055 stays `status: open` + `blocked: yes` until outer Diary `codex/translate-k-line-docs-en` branch reaches zero residual Chinese in K-Line scope. PM polls weekly OR operator pushes notification when outer-AI completes top-up.

### Phase 1 — Pre-execution sweep + Architect design

Run AC-K055-01 sweep. Pass → Architect Pre-Design Audit produces `docs/designs/K-055-translation-cherry-pick.md` (likely 200-300 LOC: extraction loop spec, allow-list enumeration, sweep regex spec, error handling for partial failures).

### Phase 2 — Engineer cherry-pick + sweep + commit

Run AC-K055-02 extraction loop. Run AC-K055-03 Chinese sweep. Run AC-K055-04 sample integrity check. Commit. Push. PR.

### Phase 3 — Reviewer + QA

Reviewer: spot-check 5 random files for translation completeness + frontmatter + heading. QA: GitHub render preview + retrospective-meta.md anchor preservation + README link integrity.

### Phase 4 — Deploy + close

Docs-only per Commit Test Gate (no `frontend/src` / `backend` / `public/` runtime changes), so single-phase wrap-up (Phase A only, no deploy gate). PM ticket closure bookkeeping.

## Phase Gate Checklist

| Gate | Required at | Evidence |
|---|---|---|
| External dependency completeness | Phase 1 entry | AC-K055-01 sweep returns empty on outer branch |
| Engineer challenge sheet resolved? ✓/N/A | Phase 2 close | Sheet appended to §BQs with each item verdict'd |
| QA Early Consultation | Phase 1 close | Real qa retro entry at `docs/retrospectives/qa.md`; PRD §QA Challenge Rulings populated |
| AC ↔ Sacred cross-check | Phase 2 dispatch | PM evidence line `AC vs Sacred cross-check: ✓ no conflict` (translation does not touch DOM/visual/runtime; semantic preservation only) |
| Visual Spec JSON gate | N/A | `visual-delta: none` |
| Worktree isolation pre-flight | Architect dispatch | `git worktree list` shows `.claude/worktrees/K-055-translation-cherry-pick` |
| Engineer-made visual change scan | Pre-CLOSED | Expected: `no literals found` (docs-only, no `frontend/src` touch) |
| Deploy evidence gate | Pre-CLOSED | `Runtime-scope triggered: NO (docs-only, deploy-exempt)` |
| BQ closure iteration | Pre-CLOSED | `BQ closure: [N resolved] [M deferred→TD] [K=0 open]` |
| Outer dependency completeness (K-055 unique) | Phase 0 + Phase 2 | Outer Diary `codex/translate-k-line-docs-en` branch zero residual Chinese in K-Line scope; gate runs at Phase 0 (fail-fast) AND Phase 2 (final guard via AC-K055-03) |

## Open BQs

(Populated as Phases progress. Phase 1 QA consultation expected to surface: deletion handling in cherry-pick mechanism — outer branch may have removed files inner main still has; allow-list policy if any inner doc legitimately needs CJK preserved; outer-branch top-up SLA if multiple rounds needed.)

## Retrospective

(Populated at close.)
