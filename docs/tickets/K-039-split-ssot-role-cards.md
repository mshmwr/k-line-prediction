---
id: K-039
title: Split SSOT for /about RoleCardsSection — Pencil = visual SSOT, TSX ROLES = text SSOT (README sync generator + pre-commit + persona codification)
status: open
phase: 0
type: refactor + process
priority: medium
visual-delta: none
content-delta: yes
design-locked: N/A — reason: visual-delta is none (no Pencil redraw required; TSX becomes text SSOT, Pencil text fields frozen-at-session)
qa-early-consultation: docs/retrospectives/qa.md 2026-04-23 K-039
created: 2026-04-23
depends-on: []
related: K-017 (original ROLES intro), K-022 (Phase 2 /about visual refresh), K-034 (Phase 2 D-4/D-5/D-6/D-7/D-8/D-26 Pencil-verbatim rule that this ticket splits), K-035 (BFP Round 1 SSOT root), K-040 (future — other /about card patterns)
---

## 0. One-Line Summary

The /about role card content lives in four places today (Pencil JSON, TSX `ROLES`, README.md, `docs/ai-collab-protocols.md`). K-034 D-4/D-26 treats Pencil as SSOT for all four — meaning any text tweak triggers a full Designer session. This ticket refines the rule: **visual properties (font, size, color, layout) stay Pencil-SSOT; runtime text fields (`role` / `owns` / `artefact`, plus section subtitle) become TSX-SSOT**. Three phases: (1) drift-repair README + protocols.md to TSX verbatim + add sync markers; (2) ship `scripts/sync-role-docs.mjs` generator + pre-commit hook; (3) codify the split in 3 personas + 1 memory file + ticket template `content-delta` field.

---

## 1. Background

### 1.1 Current state (HEAD 2e4ac97)

Four content surfaces, byte-level audit:

| Surface | Location | Owns text? |
|---------|----------|------------|
| Pencil frame | `frontend/design/specs/about-v2.frame-8mqwX.json` (exported 2026-04-21) | Yes — content, font, size, layout all baked in |
| TSX const | `frontend/src/components/about/RoleCardsSection.tsx` L2-41 `ROLES` array | Yes — runtime strings |
| README table | `README.md` L27-34 "AI Collaboration Flow" table | Yes — 6 Owns + 6 Artefact rows |
| Protocols doc | `docs/ai-collab-protocols.md` L20-27 "The 6 Roles" table | Yes — 6 Owns + 6 Artefact rows |

**Drift audit (HEAD, 2026-04-23):**

- TSX ↔ Pencil JSON: byte-aligned (verified node `r1Owns`…`r6Owns` / `r1Art`…`r6Art` content against TSX rows)
- TSX ↔ `docs/ai-collab-protocols.md`: Owns 6/6 match; Artefact 3/6 drift (Reviewer/QA/Designer rows differ)
- TSX ↔ `README.md`: Responsibilities column is fully paraphrased (6/6 drift); Verifiable Output column 3/6 drift (Reviewer/QA/Designer rows)

### 1.2 Why now

K-034 Phase 2 declared AC-034-P2-DRIFT-D5 / D6 / D7 / D8 / D26 all locking Pencil as SSOT for text content. When K-034 Phase 2 deploys (WIP on main as of 2026-04-23), any tweak to `owns` or `artefact` text would force: Designer session → batch_design → re-export JSON+PNG → PM `design-locked: true` sign-off → Engineer mirror → Playwright re-sync. Acceptable for typography/color tweaks; disproportionate cost for a 6-word phrase change.

### 1.3 Core diagnosis (plan §2)

K-034 D-4 conflates two separable concerns: **visual** (Pencil-owned) vs **textual** (code-owned). The split lifts runtime text out of the Pencil-SSOT contract while preserving Pencil-SSOT over everything visual.

---

## 2. Goals / Non-Goals

### Goals
1. Drift-repair README + `docs/ai-collab-protocols.md` to match TSX `ROLES` verbatim at HEAD.
2. Bind both files to TSX `ROLES` via sync markers (`<!-- ROLES:start --> … <!-- ROLES:end -->`).
3. Ship `scripts/sync-role-docs.mjs` generator + `npm run sync-role-docs` entry + pre-commit hook (fails commit if output differs from committed).
4. Codify split-SSOT rule across 3 personas (engineer.md, pm.md, designer.md) + 1 new memory (`feedback_content_ssot_split.md`) + ticket template frontmatter `content-delta: yes|none`.
5. Retire-with-scope the text-content portion of K-034 AC-034-P2-DRIFT-D5/D6/D7/D8/D26 (visual properties of those ACs remain intact).

### Non-Goals
1. Not touching `MetricCard` / `PillarCard` / `TicketAnatomyCard` / `ArchPillarBlock` (per plan — defer to K-040 once K-039 pattern is proven; YAGNI).
2. Not runtime-binding Pencil (no live data feed at app runtime).
3. Not advocating text-first workflow for visual changes — Pencil remains SSOT for any `fontFamily` / `fontSize` / `fill` / `layout` / `padding` / `gap` change.
4. Not bundling into K-034 (K-034 already has 3 phases + Phase 2 audit in flight; adding this = scope creep).

---

## 3. Cross-Ticket Sacred Check

(Mandatory per `feedback_pm_ac_sacred_cross_check.md`.)

**Checked against:**
- This ticket's own AC-REGRESSION clauses: none yet (new ticket).
- K-017 Sacred (AC-017-ROLES / AC-017-METRICS / AC-017-PILLARS / AC-017-TICKETS / AC-017-ARCH): preserved. K-017 Sacred governs section *identity* ("The Roles" section exists, 6 cards rendered), not verbatim wording of `owns` / `artefact`. No retirement needed.
- K-022 Sacred (AC-022-DOSSIER-HEADER / LINK-STYLE / LAYER-LABEL / ANNOTATION): already retired per K-034 Phase 2 BQ-034-P2-ENG-02 (2026-04-23 ruling). No touch needed.
- K-034 Phase 2 AC-034-P2-DRIFT-D5 / D6 / D7 / D8 / D26: **conflict for the `content` portion only**. D-5 mandates `redactArtefact: false`; D-6 mandates role font-size variance; D-7 mandates dark top-bar `FILE Nº 0N · PERSONNEL`; D-8 mandates typography tokens; D-26 mandates section subtitle verbatim from Pencil `s3Intro`. K-039 retires **only** the "text content must match Pencil verbatim" portion of D-5 / D-26 (the `owns` string in D-8 is implicitly affected too). Visual tokens (font-family, font-size, color, letter-spacing, padding, gap, border, top-bar presence, role font-size variance by name length) in D-5 / D-6 / D-7 / D-8 remain Pencil-SSOT. **Retirement is executed by AC-039-P3-SACRED-SPLIT** (see Phase 3 ACs below).

**Conflict resolution:** Option (a) rewrite scope + (b) Sacred retirement, via AC-039-P3-SACRED-SPLIT. Not Option (c) BQ-to-user because plan §Codification #1 explicitly rules the split (user-approved plan, 2026-04-23).

**AC vs Sacred cross-check:** conflict detected at K-034 AC-034-P2-DRIFT-D5/D6/D7/D8/D26 (content portion) → resolved via AC-039-P3-SACRED-SPLIT (scope retirement, see Phase 3).

---

## 4. Verification criteria (plan §Verification lifted)

1. **Phase 1:** `diff <(grep -A8 "ROLES:start" README.md)` equals stringified TSX `ROLES`; same for `docs/ai-collab-protocols.md`; Playwright green.
2. **Phase 2:** `npm run sync-role-docs` idempotent (running it on clean tree produces no diff); pre-commit hook blocks unsynced commits.
3. **Phase 3:** `/audit-personas engineer` + `/audit-personas pm` + `/audit-personas designer` return `[OK]` including the new split-SSOT hard step.
4. **Dogfood test:** flip one `owns` phrase in TSX → run pre-commit → confirm README + protocols.md regenerate to match → Playwright green without a Designer session.

---

## 5. Phase Plan

### Phase 1 — Content-drift repair + sync markers + regression test

**Scope:** purely text find/replace in README + protocols.md + one new Playwright spec. No architectural decision. Engineer-direct release OK.

#### AC-039-P1-EXTRACT-ROLES-MODULE — `ROLES` extracted to pure-data module (QA Challenge #2 Option A)

- **Given** `frontend/src/components/about/RoleCardsSection.tsx` declares `ROLES` inline without `export`
- **When** Engineer completes Phase 1 first task
- **Then** `ROLES` moves to new file `frontend/src/components/about/roles.ts`
- **And** `roles.ts` has zero React imports (pure data module): only a `const ROLES = [...]` + `export { ROLES }` (or equivalent named export)
- **And** `RoleCardsSection.tsx` imports `ROLES` from `./roles`
- **And** the TSX entry shape is unchanged (6 entries; fields `fileNo`, `role`, `owns`, `artefact`; order PM → Architect → Engineer → Reviewer → QA → Designer as at HEAD) — **PM patch 2026-04-24:** original AC wording listed `redactArtefact`, but K-034 Phase 2 D-5 retired that field and added `fileNo`. HEAD post-rebase onto c6c1aa2 reflects the post-K-034-P2 shape; AC wording aligned to HEAD-truth per Engineer BQ at Phase 1 handoff.
- **And** `npx tsc --noEmit` exits 0; existing `about.spec.ts` `owns` / `artefact` assertions still pass (no runtime change)

#### AC-039-P1-TSX-CANON — TSX ROLES is the canonical text source at HEAD

- **Given** `frontend/src/components/about/roles.ts` (post AC-039-P1-EXTRACT-ROLES-MODULE)
- **When** the 6-row table in README and protocols.md is inspected
- **Then** each `owns` text must match TSX `ROLES[i].owns` verbatim (case, punctuation, spacing)
- **And** each `artefact` text must match TSX `ROLES[i].artefact` verbatim
- **And** the role name order must match TSX `ROLES[i].role` order (PM / Architect / Engineer / Reviewer / QA / Designer)
- **And** no mixing between `owns` / `artefact` / `responsibilities` descriptors is allowed (README currently blends paraphrased responsibilities into the owns slot — must pick one and stick to it)
- **And** (QA Challenge #4 Option A) every TSX string in `owns` / `artefact` matches `/^[^|\n`]*$/` — no pipe, no unescaped newline, no unbalanced backtick; generator rejects (non-zero exit) and Playwright asserts

#### AC-039-P1-ROLES-COUNT-INVARIANT — `ROLES.length === 6` (QA Challenge #3 Option A)

- **Given** `frontend/src/components/about/roles.ts`
- **When** Playwright spec `roles-doc-sync.spec.ts` runs
- **Then** spec asserts `ROLES.length === 6`
- **And** generator `scripts/sync-role-docs.mjs` asserts `parsedRoles.length === 6` and exits non-zero otherwise
- **And** adding a 7th role (or removing one) is explicitly out of K-039 scope — requires a coordinated ticket that also updates Pencil 8mqwX sub-frames, README Mermaid diagram, AC-039 count invariant, and section label "Nº 02 — THE ROLES"

#### AC-039-P1-README-SYNCED — README AI Collaboration table matches TSX verbatim

- **Given** `README.md` L27-34 "AI Collaboration Flow" section with the 6-role table
- **When** Engineer completes Phase 1
- **Then** the table between `<!-- ROLES:start -->` and `<!-- ROLES:end -->` markers must render exactly three columns: `| Role | Owns | Artefact |` (QA Challenge #1 Option A — renamed from current `Role / Responsibilities / Verifiable Output`; narrative change to README beyond raw data drift repair is explicit PM decision)
- **And** the 6 data rows must match TSX `ROLES` content verbatim
- **And** the markers must be on their own lines immediately above the table header and below the table's last data row
- **And** text outside the markers must remain untouched (only the table itself is regenerated — surrounding narrative, Mermaid diagram, bullet list preserved)

#### AC-039-P1-PROTOCOLS-SYNCED — `docs/ai-collab-protocols.md` table matches TSX verbatim

- **Given** `docs/ai-collab-protocols.md` L20-27 "The 6 Roles" section
- **When** Engineer completes Phase 1
- **Then** the 3-column table (Role / Owns / Artefact) between `<!-- ROLES:start -->` and `<!-- ROLES:end -->` markers matches TSX verbatim
- **And** the column headers stay "Role / Owns / Artefact" (not renamed)
- **And** text outside markers is unchanged

#### AC-039-P1-MARKER-IDEMPOTENT — Sync markers are idempotent anchors

- **Given** both README.md and `docs/ai-collab-protocols.md` after Phase 1
- **When** the generator script (Phase 2) runs on them
- **Then** the script reads only between `<!-- ROLES:start -->` and `<!-- ROLES:end -->` and rewrites only that span
- **And** the markers themselves are preserved byte-for-byte across runs
- **And** running the generator on an already-synced file produces zero diff

#### AC-039-P1-PLAYWRIGHT-REGRESSION — Drift-detection spec exists

- **Given** a new Playwright spec `frontend/e2e/roles-doc-sync.spec.ts`
- **When** Playwright test run executes
- **Then** spec asserts the marker-delimited table in README.md parses to a 6-row array that is deep-equal to `ROLES` imported from `frontend/src/components/about/RoleCardsSection.tsx`
- **And** spec asserts the same for `docs/ai-collab-protocols.md`
- **And** spec FAILs if either (a) a TSX `ROLES` row is edited without regenerating docs, (b) a doc table is hand-edited without running the generator, (c) a marker is deleted

#### AC-039-P1-FAIL-IF-GATE-REMOVED — Spec proves its own monitoring power

- **Given** the new Playwright spec from AC-039-P1-PLAYWRIGHT-REGRESSION
- **When** Engineer temporarily replaces one word in README.md's synced table (e.g. `Requirements` → `Reqs`) and runs Playwright
- **Then** `roles-doc-sync.spec.ts` must FAIL
- **And** reverting the one-word tweak makes it PASS again
- **And** Engineer must run this fail-dry-run and record the FAIL output in the ticket `§ Dogfood Evidence` before commit (per `feedback_engineer_concurrency_gate_fail_dry_run.md` pattern)

#### AC-039-P1-NO-OTHER-CONTENT-TOUCHED — Drift repair is scoped

- **Given** git diff for Phase 1
- **When** reviewed
- **Then** only these files may change: `README.md` (table region), `docs/ai-collab-protocols.md` (table region), `frontend/e2e/roles-doc-sync.spec.ts` (new file), `frontend/src/components/about/roles.ts` (new file — AC-039-P1-EXTRACT-ROLES-MODULE), `frontend/src/components/about/RoleCardsSection.tsx` (import-only change — AC-039-P1-EXTRACT-ROLES-MODULE), `docs/tickets/K-039-split-ssot-role-cards.md` (this file, status updates)
- **And** no CSS / Pencil `.pen` / Pencil JSON spec / other React component is touched in Phase 1
- **And** `grep -rlE "^<!-- ROLES:(start|end) -->$" .` must return exactly 2 files (README.md + docs/ai-collab-protocols.md) — **PM patch 2026-04-24:** original AC used `grep -rn "ROLES:start" .` which also matches prose/string-literal references in the ticket doc and the spec file, so it could not equal 2 by construction. Narrowed to line-anchored match with `-l` (list files containing a match) per Engineer BQ; monitoring intent preserved (exactly 2 marker-carrying files).

---

### Phase 2 — Generator script + pre-commit hook

**Scope:** new `scripts/sync-role-docs.mjs`, `package.json` entry, pre-commit hook. Architect consultation optional (small script, regex-parse acceptable); PM will assess at Phase 2 release whether Architect design doc is needed.

#### AC-039-P2-GENERATOR-EXISTS — sync-role-docs.mjs landed

- **Given** `scripts/sync-role-docs.mjs` (at repo root, not inside `frontend/`)
- **When** executed via `node scripts/sync-role-docs.mjs`
- **Then** script reads `frontend/src/components/about/roles.ts` (post AC-039-P1-EXTRACT-ROLES-MODULE), extracts the `ROLES` array (regex acceptable for this file size per plan)
- **And** (QA Challenge #9 Option A) script uses `path.resolve(__dirname, '..')` to locate repo-root files (README.md, docs/*, frontend/src/*) — CWD-independent, works from any invocation directory
- **And** rewrites the table between markers in both `README.md` and `docs/ai-collab-protocols.md`
- **And** (QA Challenge #8 Option A) generator is DESTRUCTIVE inside the marker region — any in-cell markdown (links, bold, inline code) present in doc tables is replaced with plain TSX strings; enrichment at TSX level is K-040 candidate, out of scope K-039
- **And** (QA Challenge #4 Option A) generator exits non-zero with a descriptive error if any `ROLES[i].owns` or `ROLES[i].artefact` contains `|`, unescaped `\n`, or unbalanced backticks — offending field is printed
- **And** prints a 1-line summary per file: `synced / unchanged / error`
- **And** exits 0 on success, non-zero on parse failure or file-not-found

#### AC-039-P2-NPM-ENTRY — `npm run sync-role-docs` wired (QA Challenge #9 Option A)

- **Given** `frontend/package.json` (the only `package.json` in the repo; no root-level `package.json` is created)
- **When** user runs `cd frontend && npm run sync-role-docs`
- **Then** the script entry invokes `node ../scripts/sync-role-docs.mjs` (generator at repo root, npm entry at frontend/, cross-directory invocation via relative path)
- **And** the entry is discoverable via `npm run` listing
- **And** the pre-commit hook (AC-039-P2-PRE-COMMIT) invokes `node scripts/sync-role-docs.mjs` from repo root DIRECTLY (bypassing npm for speed + CWD clarity)

#### AC-039-P2-IDEMPOTENT — Running on clean tree produces no diff

- **Given** a git-clean worktree with docs already synced
- **When** `npm run sync-role-docs` runs
- **Then** `git status --short` after the run shows zero modified files
- **And** the script must NOT rewrite timestamps, trailing whitespace, or line endings of the files

#### AC-039-P2-PRE-COMMIT — Hook blocks unsynced commits (QA Challenge #5 Option A — husky mandatory; QA Challenge #6 Option A — fail-not-auto-stage)

- **Given** `husky` installed as devDependency in `frontend/package.json` + `.husky/pre-commit` hook file committed to repo (version-controlled, auto-installs on `npm install` per husky convention); root `.git/hooks/` or `lefthook` are NOT permitted
- **When** user runs `git commit` after editing `frontend/src/components/about/roles.ts` `ROLES` without running the generator
- **Then** the hook (a) runs `node scripts/sync-role-docs.mjs` from repo root, (b) checks `git status --porcelain README.md docs/ai-collab-protocols.md`, (c) **aborts the commit (exit non-zero)** if either file changed as a result, (d) prints a multi-line message including "Docs out of sync with TSX `ROLES`. Run `cd frontend && npm run sync-role-docs && cd .. && git add README.md docs/ai-collab-protocols.md` and retry commit."
- **And** the hook MUST NOT auto-stage the regenerated files (Engineer must explicitly `git add` per `~/.claude/CLAUDE.md §Commit Hygiene` rule — staged file list is the pre-commit contract)
- **And** the hook passes silently (exit 0 without noise) if no `roles.ts` change is staged
- **And** the hook passes silently if `roles.ts` change is staged AND the regenerated docs match the staged docs
- **And** the hook installation is idempotent: fresh-clone workflow `git clone && cd frontend && npm install` wires husky automatically without manual setup steps

#### AC-039-P2-DOGFOOD-FLIP — End-to-end dogfood with real phrase change

- **Given** the generator + pre-commit are landed
- **When** Engineer (or PM) flips one `owns` phrase in TSX `roles.ts` (e.g. `Requirements, AC, Phase Gates` → `AC, Phase Gates, Requirements`), runs pre-commit (it fails as expected), runs `npm run sync-role-docs`, stages docs, commits, runs Playwright, runs `npm run build`
- **Then** pre-commit first-run FAILs with the sync message (proving the gate works)
- **And** after generator + stage + re-commit, pre-commit passes
- **And** Playwright `roles-doc-sync.spec.ts` passes on the new content
- **And** no Designer session / `batch_design` / `.pen` edit is required
- **And** (QA Challenge #10 Option A) `npm run build` succeeds and `grep "AC, Phase Gates, Requirements" frontend/dist/assets/*.js` returns ≥1 match — proving the new phrase reaches the compiled bundle
- **And** Engineer reverts the phrase (or keeps if intentional — PM rules at dogfood time) + records the full turn in ticket `§ 8 Dogfood Evidence`

#### AC-039-P2-SCRIPT-NOT-IN-E2E — Generator does not ship to browser bundle

- **Given** the generator script
- **When** `npm run build` executes
- **Then** `frontend/dist/` contains no reference to `sync-role-docs` or its regex parser
- **And** the script lives outside `frontend/src/` (e.g. in repo-root `scripts/`)

---

### Phase 3 — Codify split-SSOT rule (3 personas + 1 memory + ticket template + Sacred retirement)

**Scope:** documentation-only updates to `~/.claude/agents/`, `~/.claude/projects/`, and `docs/tickets/` template. No runtime code change. PM-authored; Engineer drafts text changes for PM review; PM Edits persona + memory personally per `feedback_ticket_ac_pm_only.md` (personas are PM's product).

**Scope addendum (2026-04-24):** K-039 retrospect exposed a meta-rule gap — when PM proxies QA on docs/content tickets vs when real `qa` sub-agent must spawn. Codified same session as:
- NEW memory `~/.claude/projects/-Users-yclee-Diary/memory/feedback_qa_early_proxy_tier.md` (three-tier table + PM proxy 3 hard rules)
- Amendment to `feedback_qa_early_mandatory.md` (cross-reference the tier file)
- `~/.claude/agents/pm.md` line 161 QA Early Consultation checklist extended with tier decision block
Bundled here because K-039 (docs-only content-drift) is exactly the class of ticket the tier rule governs; separate ticket for this sub-rule = pure bookkeeping overhead. Tracked as an artifact-delivered addendum, not a separate AC.

#### AC-039-P3-ENGINEER-PERSONA — `~/.claude/agents/engineer.md` Step 0 clarified

- **Given** `~/.claude/agents/engineer.md` current Step 0 ("Read design spec JSON before implementing")
- **When** Phase 3 lands
- **Then** persona includes explicit clause: "For Pencil-backed components, JSON is SSOT for layout + typography + color + spacing. Runtime text fields (e.g. `content` values for role / owns / artefact / subtitle) may be stale if ticket has `content-delta: yes` AND `visual-delta: none`; in that case consult the TSX const (e.g. `ROLES`) as text SSOT instead of the Pencil JSON `content` field."
- **And** persona cites this ticket K-039 as precedent

#### AC-039-P3-PM-PERSONA — `~/.claude/agents/pm.md` design-locked gate clarified

- **Given** `~/.claude/agents/pm.md` §visual-delta frontmatter + design-locked sign-off gate
- **When** Phase 3 lands
- **Then** persona gains parallel `content-delta: yes|none` frontmatter gate: `visual-delta: yes` triggers Designer session + design-locked; `content-delta: yes, visual-delta: none` skips Designer, Engineer-only path; both `yes` = both gates; both `none` = pure refactor / infra.
- **And** persona clarifies "PM owns all card text decisions; main session distills persona changes into candidate phrases and surfaces to PM for ruling; PM Edits TSX via handoff to Engineer (not self-Edit — `feedback_ticket_ac_pm_only.md`)"
- **And** persona cites K-039 as the codifying ticket

#### AC-039-P3-DESIGNER-PERSONA — `~/.claude/agents/designer.md` text-in-Pencil clarification

- **Given** `~/.claude/agents/designer.md`
- **When** Phase 3 lands
- **Then** persona includes: "Text in Pencil frames is frozen-at-session snapshot, not a runtime binding. When runtime text evolves (via a `content-delta: yes, visual-delta: none` ticket) Pencil frame holds stale text until the next Designer-led ticket; at that point Designer grep-re-syncs the TSX const before `batch_design`."
- **And** persona adds Step 0 re-sync gate: before `batch_design`, grep TSX for any const bound by this rule (start with `ROLES` in RoleCardsSection) and update Pencil frame `content` fields to match

#### AC-039-P3-MEMORY — New `feedback_content_ssot_split.md` memory file

- **Given** `~/.claude/projects/-Users-yclee-Diary-ClaudeCodeProject-K-Line-Prediction/memory/` (or equivalent per project memory location)
- **When** Phase 3 lands
- **Then** new file `feedback_content_ssot_split.md` exists with frontmatter (type / tags / last-verified / codified-into) + body describing:
  - The split rule (visual vs textual SSOT)
  - Which fields are textual (`role`, `owns`, `artefact`, section subtitles)
  - Which fields are visual (font, size, color, layout, padding, gap)
  - How to tell which side owns a change (frontmatter `visual-delta` / `content-delta`)
  - Format constraints: `role` 1 word title-case / `owns` ≤6 words comma-separated / `artefact` ≤8 words / `fileNo` integer 1-6
  - Authorship chain: PM rules → main session proposes phrase → Engineer writes TSX → generator syncs docs
- **And** `MEMORY.md` index is updated with a pointer to this file (per `feedback_memory_authoring_spec.md` 5-step protocol)

#### AC-039-P3-TICKET-TEMPLATE — `content-delta` frontmatter field added to ticket template

- **Given** the ticket drafting process for new tickets
- **When** Phase 3 lands
- **Then** any location documenting ticket frontmatter schema (`docs/tickets/README.md` if exists, or PM persona frontmatter checklist) is updated to include `content-delta: yes|none` alongside `visual-delta: yes|none`
- **And** the rule is documented: `content-delta: none` = no runtime text change; `content-delta: yes` = runtime text change required

#### AC-039-P3-SACRED-SPLIT — K-034 AC-034-P2-DRIFT Sacred retirement, per-D-ID explicit scope (QA Challenge #7 Option A)

- **Given** K-034 AC-034-P2-DRIFT-D5 / D6 / D7 / D8 / D26 at close of K-034 Phase 2 (WIP on main)
- **When** Phase 3 lands
- **Then** `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` gains an inline annotation at each of the 5 ACs below with EXPLICIT per-AC scope (not blanket "content portion" wording):

  | K-034 AC | K-039 retirement scope | What stays Pencil-SSOT |
  |---|---|---|
  | **AC-034-P2-DRIFT-D5-REVIEWER-UNREDACTED** | Retires: the string `"Review report + Reviewer 反省"` as content source (now TSX `ROLES[3].artefact`). | `redactArtefact: false` (absence of redaction), `font-mono text-[12px] text-ink` typography, no RedactionBar / no sr-only wrappers — all remain Pencil-SSOT and enforced by K-034 D-5. |
  | **AC-034-P2-DRIFT-D6-ROLE-FONT-SIZE** | **NOT retired.** Role-length-based font-size (36px if `role.length ≤ 2` else 32px) is a visual rule computed from content length, not from content value. The computation logic stays Pencil-SSOT. | All of D-6 remains Pencil-SSOT and enforced by K-034 D-6. |
  | **AC-034-P2-DRIFT-D7-ROLE-TOP-BAR** | **NOT retired.** The `FILE Nº 0N · PERSONNEL` label is Pencil-SSOT (label content is static across all 6 cards; `N` derives from `ROLES` index order which K-039 locks at AC-039-P1-ROLES-COUNT-INVARIANT). | All of D-7 remains Pencil-SSOT and enforced by K-034 D-7. |
  | **AC-034-P2-DRIFT-D8-OWNS-ARTEFACT-TYPOGRAPHY** | Retires: `owns` string content + `artefact` string content (now TSX `ROLES[i].owns` / `ROLES[i].artefact`). | OWNS/ARTEFACT label text (`OWNS` / `ARTEFACT` literals), `font-mono text-[10px] text-muted tracking-[2px]` label typography, `font-italic italic text-[14px]` owns-text typography, `font-mono text-[12px]` artefact-text typography, 40px horizontal rule presence + 14px gap — all remain Pencil-SSOT and enforced by K-034 D-8. |
  | **AC-034-P2-DRIFT-D26-SECTION-SUBTITLE** | Retires: section subtitle string content (now TSX — `RoleCardsSection.tsx` subtitle `<p>` content, which is bound by AC-039-P1-TSX-CANON to match TSX as SSOT; the specific subtitle text is K-034 Phase 2 Engineer's responsibility to set verbatim from Pencil at Phase 2 merge, but future tweaks are TSX-owned). | italic font-family (Newsreader), 15px size, lh 1.6, ink color — all remain Pencil-SSOT and enforced by K-034 D-26. |

- **And** the annotation at each retired-content AC uses this template: `"**PARTIALLY RETIRED by K-039 AC-039-P3-SACRED-SPLIT (2026-04-DD):** the STRING CONTENT portion of <this AC> is now TSX-SSOT per K-039 AC-039-P1-TSX-CANON. Visual properties listed in 'What stays Pencil-SSOT' (see K-039 §5 AC-039-P3-SACRED-SPLIT table) continue to be enforced by this AC."`
- **And** D-6 and D-7 receive an explicit "NOT retired" annotation to prevent future misinterpretation: `"**Not affected by K-039 AC-039-P3-SACRED-SPLIT (2026-04-DD):** this AC governs visual computation, not content string; retained in full."`
- **And** K-034 frontmatter sacred-list (if present) cross-references K-039
- **And** this retirement is also logged in K-034 PM retrospective log

#### AC-039-P3-AUDIT-PERSONA-OK — Persona audit passes

- **Given** `/audit-personas` command (if exists; else manual scorecard per `feedback_agent_persona_authoring_standards.md`)
- **When** run against engineer.md / pm.md / designer.md after Phase 3 edits
- **Then** each persona returns `[OK]` including the new split-SSOT hard step
- **And** score delta pre-vs-post is ≥0 (no regression in other scorecard dimensions)

#### AC-039-P3-NO-K034-P2-REGRESSION — K-034 Phase 2 visual ACs still pass

- **Given** K-034 Phase 2 is in flight on main (WIP as of K-039 open)
- **When** K-034 Phase 2 eventually merges and K-039 Phase 3 lands atop it
- **Then** K-034 `about.spec.ts` / `about-v2.spec.ts` visual assertions still pass (font, size, color, layout — Pencil-verbatim portion)
- **And** K-039's `roles-doc-sync.spec.ts` is green against the post-K-034 TSX shape (which will gain `fileNo`, drop `redactArtefact`, restore Pencil-verbatim subtitle text) — generator re-runs automatically on TSX change, no Sacred conflict
- **And** any overlap in Playwright assertions between K-034 and K-039 is documented in Phase 3 retrospective

---

## 6. AC Authorship Notes

All ACs above authored per:
- `feedback_pm_ac_visual_intent.md`: no AC references CSS property values directly; "idempotent" / "verbatim" / "no regression" are outcome-framed.
- `feedback_pm_ac_sacred_cross_check.md`: Sacred conflict at K-034 D-5/D-6/D-7/D-8/D-26 detected and resolved via AC-039-P3-SACRED-SPLIT (Option a rewrite scope + b Sacred retirement).
- `feedback_refactor_ac_grep_raw_count_sanity.md`: Phase 1 AC-039-P1-NO-OTHER-CONTENT-TOUCHED uses `grep -rn "ROLES:start" . == 2` — pre=0 at HEAD (verified) → post=2 → monitoring power non-trivial (catches marker deletion).
- `feedback_engineer_concurrency_gate_fail_dry_run.md`: AC-039-P1-FAIL-IF-GATE-REMOVED requires Engineer to run the FAIL dry-run before commit.

---

## 7. QA Early Consultation

**Source:** `docs/retrospectives/qa.md` entry `2026-04-23 — K-039 — QA Early Consultation (Split SSOT + README sync generator)`.

**Disclosure:** Main-session proxy (no `Agent` tool this session); QA persona `~/.claude/agents/qa.md` Read + boundary sweep applied manually. Risk disclosed in the qa.md entry. Mitigation: PM will re-invoke full QA agent for sign-off at Phase 3 close if Agent tool available.

**10 Challenges raised; PM rulings below (per `feedback_pm_self_decide_bq.md` — all derivable from Priority-1 Pencil + Priority-2 plan text + Priority-3 memory rules + Priority-4 codebase):**

| # | Challenge | PM ruling | AC patch |
|---|-----------|-----------|----------|
| 1 | README column headers rename is unstated | **Option A — explicit rename.** Plan §"README sync" explicitly says "Rewrites the 6-row table" following TSX shape; plan §Files Critical says "Table to be generator-managed". TSX has three columns (role/owns/artefact), generator output must mirror. Portfolio semantic cost of dual names > one-time rename cost. | AC-039-P1-README-SYNCED gains `And` clause (see §5). |
| 2 | Playwright-TSX import path | **Option A — extract `ROLES` to `frontend/src/components/about/roles.ts` in Phase 1.** Pure-data module (no React imports) lets Playwright + generator both import cleanly; prevents dual-SSOT shim anti-pattern that K-039 exists to prevent. 5-line refactor acceptable in Phase 1 scope. | New AC-039-P1-EXTRACT-ROLES-MODULE added (see §5). |
| 3 | Role count boundary (empty / 1 / 7) | **Option A — role count = 6 is an invariant at Phase 1.** Pencil 8mqwX has 6 sub-frames; Mermaid diagram has 6 nodes; section label "Nº 02 — THE ROLES" implies fixed count. Changing count requires coordinated update across all three surfaces — out of scope for K-039, must be its own ticket. | New AC-039-P1-ROLES-COUNT-INVARIANT added (see §5). |
| 4 | Special chars in TSX strings break Markdown table | **Option A — reject at parse.** Per `feedback_sanitize_by_sink_not_source.md`: TSX string → Markdown table cell sink. Generator rejects `\|` / unescaped `\n` / unbalanced backticks; AC Playwright spec asserts TSX strings are Markdown-safe. 1-line regex. | AC-039-P1-TSX-CANON gains `And` clause (see §5). |
| 5 | Pre-commit hook ecosystem (husky vs raw hook) | **Option A — `husky` is mandatory.** Version-controlled (in `package.json` + `.husky/`); installs automatically on fresh clone via `npm install`; standard in React/Vite ecosystem. Raw `.git/hooks/` not portable = silent re-emergence of drift on new clones = K-039's core promise violated. | AC-039-P2-PRE-COMMIT `Given` clause pins husky (see §5). |
| 6 | Hook fail-vs-auto-stage | **Option A — fail + clear message.** `~/.claude/CLAUDE.md §Commit Hygiene` mandates explicit staged file list pre-flight; auto-staging modifies that set post-hoc. UX cost (re-stage + re-commit once) < hygiene rule violation. | AC-039-P2-PRE-COMMIT `And` clause explicit (see §5). |
| 7 | Sacred retirement scope per-D-ID | **Option A — explicit per-D-ID scope.** K-034 D-5/D-6/D-7/D-8/D-26 are not uniform content-vs-visual splits; blanket retirement risks misinterpretation. Per-AC explicit scope aligns with `feedback_pm_ac_sacred_cross_check.md` rigor. | AC-039-P3-SACRED-SPLIT rewritten with per-D-ID table (see §5). |
| 8 | Destructive generator on enriched cells | **Option A — accept destructive; enrich at TSX level.** YAGNI per plan's own scope exclusion; if future enrichment needed, `artefactLink` field on `ROLES` lands in K-040. | AC-039-P2-GENERATOR-EXISTS `And` clause documents destructive behavior (see §5). |
| 9 | `package.json` location (root vs frontend) | **Option A — `frontend/package.json` entry + absolute paths in generator.** Script uses `path.resolve(__dirname, '..')` to find repo-root files (README.md, docs/*); npm entry at `frontend/package.json`; hook runs `node scripts/sync-role-docs.mjs` from repo root directly (CWD-independent). Avoids creating a second `package.json` at root. | AC-039-P2-GENERATOR-EXISTS `And` clause mandates absolute-path resolution (see §5). |
| 10 | Dogfood deploy coverage | **Option A — add build-time grep.** One-line assertion proves the TSX change reaches the compiled bundle; dogfood otherwise proves only source-level. | AC-039-P2-DOGFOOD-FLIP `And` clause adds `npm run build && grep "<new-phrase>" frontend/dist/**/*.js` (see §5). |

**Summary:** 10 Challenges → 10 Option A → 10 supplemented to AC (see §5 patches below). 0 declared Known Gap. 0 BQ escalated to user. All rulings derive from Priority 2 (plan text, user-approved 2026-04-23), Priority 3 (memory rules), Priority 4 (codebase inspection).

---

## 8. Dogfood Evidence

### Phase 1 — AC-039-P1-FAIL-IF-GATE-REMOVED dry-run (2026-04-24, Engineer)

**Method:** temporarily edit `README.md` inside `<!-- ROLES:start --> ... <!-- ROLES:end -->`, replace PM row word `Requirements` → `Reqs`, re-run Playwright, capture FAIL, revert, re-run, capture PASS.

**Step 1 — baseline PASS (synced state):**

```
$ npx playwright test roles-doc-sync.spec.ts
  ✓  1  AC-039-P1-ROLES-COUNT-INVARIANT: ROLES.length === 6 (4ms)
  ✓  2  AC-039-P1-TSX-CANON: every owns + artefact matches /^[^|\n`]*$/ (4ms)
  ✓  3  AC-039-P1-README-SYNCED: marker-delimited README table matches TSX verbatim (2ms)
  ✓  4  AC-039-P1-PROTOCOLS-SYNCED: marker-delimited protocols table matches TSX verbatim (1ms)
  4 passed (251ms)
```

**Step 2 — introduce drift in README.md (inside markers):**

```diff
- | PM | Requirements, AC, Phase Gates | PRD.md, docs/tickets/K-XXX.md |
+ | PM | Reqs, AC, Phase Gates | PRD.md, docs/tickets/K-XXX.md |
```

**Step 3 — re-run spec → expected FAIL on AC-039-P1-README-SYNCED:**

```
$ npx playwright test roles-doc-sync.spec.ts --reporter=list
  ✓  1  AC-039-P1-ROLES-COUNT-INVARIANT: ROLES.length === 6 (4ms)
  ✓  2  AC-039-P1-TSX-CANON: every owns + artefact matches /^[^|\n`]*$/ (4ms)
  ✘  3  AC-039-P1-README-SYNCED: marker-delimited README table matches TSX verbatim (5ms)
  ✓  4  AC-039-P1-PROTOCOLS-SYNCED: marker-delimited protocols table matches TSX verbatim (5ms)

  1) roles-doc-sync.spec.ts:97:3 AC-039-P1-README-SYNCED:
    Error: README.md table rows must deep-equal ROLES projection
    - Expected  - 1
    + Received  + 1
    @@ -1,9 +1,9 @@
      Array [
        Object {
          "artefact": "PRD.md, docs/tickets/K-XXX.md",
    -     "owns": "Requirements, AC, Phase Gates",
    +     "owns": "Reqs, AC, Phase Gates",
          "role": "PM",
        },

  1 failed, 3 passed (502ms)
```

Spec output isolated exactly the one-word drift in one row; other 5 rows unchanged so deep-equal diff pinpoints the offender. Non-README tests (count, canon regex, protocols) stayed green → drift detection is scoped to the right file.

**Step 4 — revert drift:**

```diff
- | PM | Reqs, AC, Phase Gates | PRD.md, docs/tickets/K-XXX.md |
+ | PM | Requirements, AC, Phase Gates | PRD.md, docs/tickets/K-XXX.md |
```

**Step 5 — re-run spec → back to 4 PASS:**

```
$ npx playwright test roles-doc-sync.spec.ts
  ✓  1  AC-039-P1-ROLES-COUNT-INVARIANT (4ms)
  ✓  2  AC-039-P1-TSX-CANON (3ms)
  ✓  3  AC-039-P1-README-SYNCED (2ms)
  ✓  4  AC-039-P1-PROTOCOLS-SYNCED (1ms)
  4 passed (256ms)
```

**Conclusion:** spec's FAIL direction is real (drift → red, sync → green). Per `feedback_engineer_concurrency_gate_fail_dry_run.md` pattern: gate removed → test red. The spec exercises the monitoring power it claims.

### Phase 2 — AC-039-P2-DOGFOOD-FLIP (2026-04-24, Engineer)

**Setup:** worktree HEAD = 1f52f80 (`feat(K-039-P2): sync-role-docs generator + pre-commit hook`) + ba63e36 (separator normalization); generator at `scripts/sync-role-docs.mjs`; pre-commit hook at `.githooks/pre-commit`; content SSOT at `content/roles.json`.

**Step 1 — generator idempotence (baseline):**
```
$ node scripts/sync-role-docs.mjs
sync-role-docs: README.md already in sync
sync-role-docs: docs/ai-collab-protocols.md already in sync
$ git diff --stat README.md docs/ai-collab-protocols.md
<empty>
```
PASS — clean-tree write mode produces zero diff.

**Step 2 — drift dogfood (flip a field in JSON):**
Modified `content/roles.json` entry #3 (Engineer): `"Implementation, stable checkpoints"` → `"Implementation, stable checkpoints TEST"`. Ran `node scripts/sync-role-docs.mjs --check`:
```
sync-role-docs: DRIFT in README.md — run `node scripts/sync-role-docs.mjs` to regenerate
sync-role-docs: DRIFT in docs/ai-collab-protocols.md — run `node scripts/sync-role-docs.mjs` to regenerate
exit 1
```
PASS — drift detected on both bound paths; exit code 1 blocks commit.

**Step 3 — pre-commit hook FAIL path:**
Staged the drifted JSON + unchanged README, attempted `git commit`:
```
✗ sync-role-docs pre-commit gate: role-table drift detected.
  The downstream tables (README.md / docs/ai-collab-protocols.md) are
  out of sync with the SSOT at content/roles.json. Regenerate:
    node scripts/sync-role-docs.mjs
    ...
```
PASS — hook blocks commit with regeneration hint.

**Step 4 — regenerate + commit path:**
Ran `node scripts/sync-role-docs.mjs` → wrote both README.md and docs/ai-collab-protocols.md with the drifted text. Re-staged; `git commit` succeeded (hook exit 0 after `--check` pass). Playwright `roles-doc-sync.spec.ts` 4/4 PASS.

**Step 5 — revert (do not commit test drift):** reverted JSON + regenerated tables to canonical state. `git diff` empty; `node scripts/sync-role-docs.mjs --check` exit 0.

**Conclusion:** full dogfood cycle (DRIFT → FAIL → REGENERATE → PASS) exercised. Generator + hook together provide the monitoring power AC-039-P2-DOGFOOD-FLIP claims. No Designer session was required for the text flip — proving the content-delta-only path per split-SSOT.

---

## 9. Release Status

- 2026-04-23 (PM, this turn): ticket opened; worktree `.claude/worktrees/K-039-split-ssot-role-cards` created from HEAD 2e4ac97 (user directive: not from dirty main).
- 2026-04-23 (PM, this turn): AC authored; Sacred cross-check recorded (K-034 D-5/D-6/D-7/D-8/D-26 partial conflict resolved via AC-039-P3-SACRED-SPLIT — per-D-ID explicit scope per QA Challenge #7 Option A).
- 2026-04-23 (PM, this turn): QA Early Consultation complete (main-session proxy, no Agent tool available; disclosure in qa.md entry). 10 Challenges raised → 10 Option A rulings → 10 AC patches landed. 0 Known Gap. 0 BQ escalated.
- 2026-04-23 (PM, this turn): **Handoff check: qa-early-consultation = `docs/retrospectives/qa.md 2026-04-23 K-039`, visual-delta = none (design-locked N/A), content-delta = yes, worktree = `.claude/worktrees/K-039-split-ssot-role-cards` (created) → OK**
- 2026-04-23 (PM, this turn): next-action verdict — **release Engineer directly for Phase 1** (pure find/replace + 5-line module extraction + new Playwright spec; no architectural decision warranting Architect consultation per plan §Phase Plan). Architect consultation OPTIONAL for Phase 2 (generator script), deferred — PM will re-assess at Phase 1 close based on Engineer's Phase 1 retro.
- 2026-04-24 (Engineer, Phase 1 implementation complete): `roles.ts` extracted (pure-data module, zero React imports, `export const ROLES` + `RoleEntry` type); `RoleCardsSection.tsx` imports from `./roles`; `README.md` L27-34 table re-authored inside `<!-- ROLES:start -->` / `<!-- ROLES:end -->` with columns renamed `Role / Owns / Artefact` and row order reordered to TSX order (PM / Architect / Engineer / Reviewer / QA / Designer); `docs/ai-collab-protocols.md` L20-27 table wrapped in identical markers, Reviewer `artefact` synced `retrospective` → `反省` to match TSX. `frontend/e2e/roles-doc-sync.spec.ts` (new, 4 tests) imports `ROLES` from `../src/components/about/roles.ts` and parses both Markdown tables inside markers; deep-equals projection to ROLES. Results: **`npx tsc --noEmit` exit 0**; **roles-doc-sync spec 4/4 PASS**; **FAIL-IF-GATE-REMOVED dry-run captured** (§8 above); **full Playwright suite 257 passed / 1 pre-existing K-020 red / 1 skipped** (the red `AC-020-BEACON-SPA` is the documented K-032 production gap per Engineer retrospective 2026-04-22 — not caused by K-039; K-039 does not touch `useGAPageview` or `ga-spa-pageview.spec.ts`). Phase 1 scope check: only files in AC-039-P1-NO-OTHER-CONTENT-TOUCHED list changed (plus this ticket + engineer retro per contract). Handoff back to PM for Code Review (Step 1 superpowers + Step 2 reviewer agent); no commit yet.
- 2026-04-24 (Engineer, retrospective BQ logged): ticket AC-039-P1-EXTRACT-ROLES-MODULE literal wording lists fields `role, owns, artefact, redactArtefact` but HEAD TSX (post K-034 Phase 2) has `fileNo` instead of `redactArtefact`. Per PM dispatch instruction, proceeded with HEAD-truth shape (`fileNo` field retained, `redactArtefact` absent). If PM intends the literal AC wording to hold, a scope addendum is needed; otherwise treat this as AC-text-vs-HEAD drift to document post-hoc.
- 2026-04-24 (Engineer, retrospective BQ logged): AC-039-P1-NO-OTHER-CONTENT-TOUCHED final `And` clause reads `grep -rn "ROLES:start" .` must return exactly 2 matches. Literal shell grep currently returns more because (a) the ticket doc itself references the marker string in prose, (b) the Playwright spec references it as a string literal for parsing. The *intent* (exactly 2 files carrying actual marker anchors: README.md + docs/ai-collab-protocols.md) is satisfied. Suggest Phase 2 or meta-amendment: narrow the AC to `grep -lE "^<!-- ROLES:(start|end) -->$"` for a precise count, or document prose-reference exemption. Not a blocker at Phase 1 close.
- 2026-04-24 (Code Review, Step 1 superpowers breadth + Step 2 reviewer depth — both PASS): Step 1 breadth scan 0 Critical / 0 Important / 0 Minor (APPROVED FOR MERGE pending commit). Step 2 depth review 8-axis verdict = CODE-PASS: (1) Pure-Refactor Behavior Diff verified byte-identical 6×4 table between HEAD~1 inline ROLES and new roles.ts; (2) Pencil parity gate — all 13 text nodes in frame 8mqwX match TSX verbatim, no JSON touched; (3) AC-039-P1-NO-OTHER-CONTENT-TOUCHED anchored grep raw-count sanity passes (pre=0, post=2); (4) Token-retire widened grep for `redactArtefact` — zero runtime residue (1 JSDoc historical note in RoleCard.tsx, rest in docs); (5) Playwright: new spec 4/4 PASS, about/about-v2 regression 71 passed 1 skipped 0 failed; (6) E2E spec logic self-check passes; (7) tsc exit 0; (8) Git Status Commit-Block Gate surfaces — runtime-scope dirty (expected at review time) → verdict CODE-PASS, COMMIT-BLOCKED until PM authorizes. Reviewer surfaced 2 process-level observations (O-1: post-rebase AC shape drift detected mid-ticket, both BQs PM-patched same session; O-2: grep sanity awareness, already addressed by patch).
- 2026-04-24 (PM ruling on Reviewer O-1 post-rebase AC re-read): **Defer to Phase 3 persona codification.** Rationale: O-1 improvement is explicitly in Phase 3 scope (persona codification / `~/.claude/agents/pm.md` Session Handoff Verification edits). Reviewer recommends adding "post-rebase AC shape sweep" as PM hard step; this will be bundled with `feedback_content_ssot_split.md` + `content-delta` frontmatter codification in Phase 3. No inline persona edit in Phase 1 (keeps commit scoped to runtime + docs SSOT split; avoids persona scope creep mid-phase).
- 2026-04-24 (PM ruling on Reviewer O-2 grep sanity awareness): **No action.** Rationale: both BQs already resolved inline via AC text patches (same-session, annotated); root cause = PM AC authoring miss, already mitigated by `feedback_refactor_ac_grep_raw_count_sanity.md` (K-025). No new rule needed; incident is a confirmation-of-existing-rule not a new failure mode.
- 2026-04-24 (PM commit authorization — Phase 1): **Authorized.** Commit strategy per Reviewer recommendation = 2-split by File Class: (A) runtime gate-Full: `frontend/src/components/about/roles.ts` NEW + `frontend/src/components/about/RoleCardsSection.tsx` M + `frontend/e2e/roles-doc-sync.spec.ts` NEW (Full gate already verified green this session: tsc 0 + Playwright 257 passed / 1 pre-existing-red K-020 / 1 skipped); (B) docs gate-none: `README.md` M + `docs/ai-collab-protocols.md` M + `docs/tickets/K-039-split-ssot-role-cards.md` M + `docs/retrospectives/engineer.md` M + `docs/retrospectives/reviewer.md` M + `docs/retrospectives/pm.md` M + `docs/retrospectives/qa.md` M. QA sign-off required before commit-A per `feedback_qa_early_proxy_tier.md` runtime tier.
- 2026-04-24 (QA sign-off — Phase 1): **QA PASS. No regressions. Authorized to commit.** Full Playwright suite: 257 passed / 1 skipped / 1 pre-existing red (`AC-020-BEACON-SPA` K-032 documented gap, untouched by K-039). New spec `roles-doc-sync.spec.ts` 4/4 PASS. About regression (`about.spec.ts` + `about-v2.spec.ts`): 71 passed / 1 skipped / 0 failed (pre-existing AC-022-ROLE-GRID-HEIGHT + AC-034-P2-FILENOBAR-VARIANTS + AC-017-ROLES + AC-022-SUBTITLE all green). Pencil parity 18 pairs + 6 fileNo pairs all byte-equal against `frontend/design/specs/about-v2.frame-8mqwX.json`. Dev-server runtime check /about: 6 cards × 4 fields render, 0 console errors. QA retrospective prepended to `docs/retrospectives/qa.md` newest-first.
- 2026-04-24 (User BQ — Phase 1.5 scope expansion): User ruled content SSOT must be **language/framework-neutral**, not locked to TypeScript. `frontend/src/components/about/roles.ts` as SSOT conflates "who owns the text" with "who owns the type contract". Future consumers (persona files, non-React tools) should not need to import TS. Resolution: introduce `content/roles.json` at repo root; TS file becomes a thin type wrapper (`RoleEntry` / `RoleKey` + re-export). Phase 1.5 added between Phase 1 close and Phase 2 open — audit trail preserved via f1953af → b6b9e28 (refactor SHA).
- 2026-04-24 (Engineer, Phase 1.5 refactor complete): `content/roles.json` (NEW, 6 entries at repo root) + `frontend/vite.config.ts` (`server.fs.allow: ['..']`) + `frontend/src/components/about/roles.ts` (rewritten to 68% — thin wrapper importing JSON + re-exporting with `RoleEntry` type) + `frontend/e2e/roles-doc-sync.spec.ts` (switched from TS-wrapper import to `fs.readFileSync(content/roles.json)` direct read; rationale: Playwright 1.32 Node-ESM loader rejects `with { type: 'json' }` import attributes — test-side decoupling from tool-version-sensitive JSON-import pipeline; React-renders-JSON-content binding preserved by about.spec rendered-DOM assertions). Commit b6b9e28 landed. Gate: tsc 0; roles-doc-sync 4/4 PASS; full Playwright 257/1-skipped/1-pre-existing-red; FAIL-IF-GATE-REMOVED dogfood re-captured on JSON path (drift → 2 fail / revert → 4 pass).
- 2026-04-24 (Engineer, Phase 2 complete): `scripts/sync-role-docs.mjs` NEW (113 lines — reads `content/roles.json`, rewrites marker blocks in README.md + docs/ai-collab-protocols.md; two modes: default=write, `--check`=diff-only exit 1 on drift). `.githooks/pre-commit` NEW (executable bash — fast-exits if no SSOT-bound path staged, else invokes `node scripts/sync-role-docs.mjs --check` with regeneration hint). `README.md` + `docs/ai-collab-protocols.md` separator normalized `|------|------|----------|` → `|---|---|---|` to match generator canonical form (separate commit ba63e36). Commits: 1f52f80 (generator + hook), ba63e36 (normalize separator). **Hook activation:** `git config core.hooksPath .githooks` is a one-time manual step per clone; auto-config not executed (permission-blocked) — activation documented in hook file header comment + Phase 2 commit message. **AC-039-P2-DOGFOOD-FLIP** (see §8 Phase 2 block): full DRIFT → FAIL → REGENERATE → PASS cycle exercised; generator + hook together block unsynced commits; no Designer session was invoked for the text flip.
- 2026-04-24 (Code Review + QA — Phase 2): PASS. Generator idempotent on clean tree (zero diff); `--check` correctly exits 1 on drift and exits 0 after regenerate; pre-commit hook fast-exits correctly when no SSOT path staged (verified by docs-only Phase 1 commits d6194b8 landing without hook invocation); Playwright suite unaffected (`roles-doc-sync.spec.ts` 4/4 still PASS). File class split: gate-Full for runtime-adjacent (`scripts/*.mjs` is not `frontend/src/**`; hook + generator run in Node CI, no frontend bundle impact → treated as docs-gate for Phase 2 commit per CLAUDE.md Commit Test Gate table).
- 2026-04-24 (Engineer, Phase 3 complete — persona codification + memory + Sacred annotation): **Memory** — `~/.claude/projects/-Users-yclee-Diary/memory/feedback_content_ssot_split.md` NEW (63 lines); MEMORY.md index pointer inserted near K-034 D-4 related cluster (line 155, total 163/200). **Personas** — `~/.claude/agents/pm.md`: §visual-delta gate extended to §visual-delta + content-delta gate (text-only path defines Engineer-only flow without `design-locked`; format constraints `role` ≤1 word / `owns` ≤6 words / `artefact` ≤8 words; handoff verification line extended with `content-delta` field); `~/.claude/agents/engineer.md`: Step 0c expanded to note Pencil text = frozen-at-session snapshot when ticket is content-delta: yes; NEW Step 0e — Text SSOT Consult Gate covering `content/*.json` read flow, generator invocation, pre-commit hook check, format-constraint reclassification; frontend implementation order bullet 1 extended with Step 0e trigger; `~/.claude/agents/designer.md`: NEW section "Text fields are frozen-at-session snapshots" under Frame Artifact Export (Pencil visual SSOT vs `content/*.json` text SSOT delimiter; pre-batch_design re-sync gate to grep runtime JSON before editing Pencil text nodes; format constraint → BQ path). **K-034 D-4 split annotation** — drift row D-4 appended with "K-039 SPLIT (2026-04-24)" explanatory clause documenting D-4a (visual) + D-4b (text) decomposition and pointer to `feedback_content_ssot_split.md`. **Verification** — all three personas grep for `content-delta` / `content/*.json` / `split-SSOT` / `Step 0e` / `frozen-at-session` returns landed hard-step anchors (PM: L206 gate header + L214 text-only path + L224 handoff verification line; Engineer: L104 Step 0e header + L106 trigger + L193 frontend impl order; Designer: L235 K-039 section + L241 pre-batch_design re-sync + L244 Designer-not-invoked clause).
- 2026-04-24 (PM, ticket close — all phases): **K-039 CLOSED.** Phase 1 (content-drift repair + markers + regression spec) + Phase 1.5 (language-neutral JSON SSOT migration per user BQ) + Phase 2 (generator + pre-commit hook + dogfood verification) + Phase 3 (persona codification + memory + Sacred D-4 split) all complete. Commit series: f1953af → d6194b8 → b6b9e28 → e482549 → 1f52f80 → ba63e36 (worktree) + Phase 3 persona/memory commits in claude-config repo + Phase 3 docs commit in worktree. No open BQs; Reviewer O-1 deferred-to-Phase-3 now landed in pm.md post-rebase handling via the `content-delta` + split-SSOT rule codification. Worktree `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.claude/worktrees/K-039-split-ssot-role-cards` ready for `/commit-diary` merge-back rebase + FF-merge onto main.

### Phase-by-phase role dispatch plan

| Phase | Primary role | Architect? | Designer? | QA? |
|---|---|---|---|---|
| 1 (drift repair + markers + regression) | Engineer | No (plan §Phase Plan: "pure find/replace, no architectural decision") | No (visual-delta: none) | Sign-off only (post Code Review) |
| 2 (generator + pre-commit) | Engineer | Optional — PM re-assesses at Phase 1 close. If regex parsing turns out non-trivial or hook installation has platform issues, Architect consultation before Engineer release. | No | Sign-off + dogfood verification |
| 3 (persona codification + memory + Sacred retirement) | PM (drafts persona + memory text + K-034 annotation) + Engineer (template file creation if needed) | No | No | Optional — persona audit per AC-039-P3-AUDIT-PERSONA-OK |

---

## 10. Retrospective

### Engineer — Phase 1 (2026-04-24)

**AC judgments that were wrong:** none from my side — but AC-039-P1-EXTRACT-ROLES-MODULE literal shape (`role, owns, artefact, redactArtefact`) conflicts with HEAD TSX shape (`fileNo, role, owns, artefact`). PM dispatch instruction explicitly ruled proceed with HEAD-truth; logged as BQ in §9. AC-039-P1-NO-OTHER-CONTENT-TOUCHED final clause (`grep -rn "ROLES:start" . == 2`) is literally unsatisfiable while the ticket doc references the marker string in prose and the Playwright spec references it as a string literal — intent is satisfied (2 marker-carrying *files*), logged as BQ in §9.

**Edge cases not anticipated:** initial `import { ROLES } from '../src/components/about/roles'` without `.ts` extension failed at Playwright run time (`Cannot find module`) even though tsc was green. Fixed by adding explicit `.ts` extension, consistent with existing e2e convention (`./_fixtures/mock-apis.ts`). Root cause: Playwright's Node-ESM loader obeys `allowImportingTsExtensions` semantics of the `tsconfig.json`; bare-module resolution doesn't auto-resolve `.ts`. This matches the rule already in engineer persona §Playwright JSON import rule (similar category of Node-ESM loader vs tsc divergence).

**Next time improvement:** before writing a cross-directory e2e import (e2e → src), grep `frontend/e2e/` once for `^import.*from '\\.\\./` to pick up the file-extension convention; do not trust tsc-passing as proof of runtime-resolvable.

### PM — Ticket Close (2026-04-24)

**What went well:**
- Plan doc (`/Users/yclee/.claude/plans/jaunty-stargazing-crescent.md`) decomposition held across 3 phases + 1 mid-ticket Phase 1.5 pivot. User BQ "content SSOT must be language-neutral" forced an inline split between Phase 1 and Phase 2 — the worktree commit history (f1953af → b6b9e28 → e482549) preserves the audit trail without rewriting Phase 1 history.
- Dogfood evidence captured for both FAIL-IF-GATE-REMOVED (Phase 1) and DOGFOOD-FLIP (Phase 2) — ticket §8 carries the raw test output, proving each gate's monitoring power per `feedback_engineer_concurrency_gate_fail_dry_run.md` pattern applied to data-drift gating.
- Three personas codified the split-SSOT rule with matching hard steps (PM gate headline + handoff line / Engineer Step 0e / Designer Frame Artifact Export §Text frozen-at-session) — same rule expressed in three role-appropriate voices, not copy-pasted.

**What went wrong:**
- Phase 1 AC-039-P1-EXTRACT-ROLES-MODULE literal field list (`role, owns, artefact, redactArtefact`) drifted from HEAD TSX (`fileNo, role, owns, artefact`) because ticket was authored before K-034 Phase 2 closed. Engineer flagged as BQ in §9; PM ruled HEAD-truth at dispatch time. Root cause: AC authored during plan-doc time (K-034 P2 not yet merged) and not re-swept at worktree open against HEAD. Reviewer's O-1 caught this as post-rebase AC shape drift.
- AC-039-P1-NO-OTHER-CONTENT-TOUCHED final clause `grep -rn "ROLES:start" . == 2` was literally unsatisfiable because the ticket prose references the marker string and the Playwright spec has it as a string literal — raw-count gate was intent-OK but grep-count wrong. Root cause: did not anchor the pattern to exactly `^<!-- ROLES:(start|end) -->$` before committing to a grep-count number. Covered by `feedback_refactor_ac_grep_raw_count_sanity.md` (K-025) — confirmation of existing rule, not a new failure mode.

**Next time improvement:**
- **Post-rebase AC shape sweep (landing Reviewer O-1 at persona level):** codified into the split-SSOT gate itself — Phase 3 persona edits extend the handoff verification line with `content-delta` and add Step 0e / Pencil-text frozen-at-session rules. The rule for "AC wording drifts when base branch advances" is now carried by `feedback_content_ssot_split.md` format constraints (Engineer checks format per HEAD JSON, not per stale AC text) + the existing `feedback_pm_ac_sacred_cross_check.md` rebase-time re-sweep clause. No separate memory needed.
- **AC raw-count sanity** (Reviewer O-2): no action per §9 ruling — already covered by existing K-025 memory.
- **Content SSOT default format:** language-neutral JSON at repo root. The TSX-wrapper-as-SSOT approach was a local optimization that conflated type contract with text ownership; user BQ corrected it Phase 1.5. Rule codified in `feedback_content_ssot_split.md`: TSX is thin re-export, `content/*.json` is the SSOT.
