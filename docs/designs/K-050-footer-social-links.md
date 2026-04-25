---
ticket: K-050
title: Footer 社群連結 — 可點擊 icon + Email 明文 — Architect design doc
updated: 2026-04-25
pencil-frames-cited:
  - homepage-v2.pen#1BGtd (hpFooterBar, home consumer)
  - homepage-v2.pen#86psQ (abFooterBar, /about consumer)
  - homepage-v2.pen#ei7cl (dpFooterBar, /diary consumer)
  - homepage-v2.pen#2ASmw (bpFooterBar, /business-logic consumer)
supersedes: K-034 Phase 1 (plain-text inline one-liner)
visual-delta: yes
design-locked: false
---

## 1. Goal

Restore clickable Footer UX (K-017/K-018 baselines) via runtime brand-asset SVGs + click-to-copy email `<button>`, while keeping Pencil SSOT flat-text frames as layout-placeholder only (exemption-backed runtime divergence).

## 2. Pencil ground truth (pre-change)

All 4 route footer frames share `padding:[20,72]`, `stroke.top: 1px #1A1814`, `justifyContent:"space_between"`, `alignItems:"center"`. Each frame currently emits 2 flat text nodes:

| Frame | Pen role | Top-level schema | Text node 1 | Text node 2 (gaDisclosure) |
|---|---|---|---|---|
| `1BGtd` | `hpFooterBar` (/) | `pen-file` + `frame-id` kebab | `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` | `This site uses Google Analytics to collect anonymous usage data.` |
| `86psQ` | `abFooterBar` (/about) | same kebab | same | same |
| `ei7cl` | `dpFooterBar` (/diary) | `frameId` + `spec` camel | same | same |
| `2ASmw` | `bpFooterBar` (/business-logic) | same camel | same | same |

**Schema-hazard flag:** kebab-case (`1BGtd` / `86psQ`) vs camel-case (`ei7cl` / `2ASmw`) top-level JSON shape is pre-existing (traced back to K-040 Designer exports). K-050 does NOT unify the schema — Engineer adds new top-level fields per existing file convention (see §5 per-file operations).

## 3. Post-change behavior (runtime-side, authoritative)

Pencil flat text becomes layout-placeholder. Runtime `Footer.tsx` emits this DOM on all 4 consuming routes:

```
<footer class="…mono 11px tracking-1px text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">
  <div class="flex justify-between items-center">
    <span class="inline-flex items-center gap-4">
      <span class="inline-flex items-center gap-2">
        <a href="mailto:yichen.lee.20@gmail.com" aria-label="Email" data-testid="cta-email" …>
          <MailIcon class="w-3.5 h-3.5 fill-current" />
        </a>
        <button type="button" data-testid="cta-email-copy" onClick={handleCopy} …>
          {copied ? 'Copied!' : 'yichen.lee.20@gmail.com'}
        </button>
      </span>
      <a href="https://github.com/mshmwr/k-line-prediction" target="_blank" rel="noopener noreferrer" aria-label="GitHub" data-testid="cta-github" …>
        <GithubIcon class="w-3.5 h-3.5 fill-current" />
      </a>
      <a href="https://linkedin.com/in/yichenlee-career" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-testid="cta-linkedin" …>
        <LinkedinIcon class="w-3.5 h-3.5 fill-current" />
      </a>
    </span>
  </div>
  <span class="sr-only" role="status" aria-live="polite">{copied ? 'Email address copied to clipboard' : ''}</span>
  <p class="text-center mt-3">This site uses Google Analytics to collect anonymous usage data.</p>
</footer>
```

## 4. Pre-Design Audit — API invariance + pre-existing state (dry-run)

Wire-level schema (backend contract): **0 diff.** No FastAPI endpoint touched. `python -m py_compile` N/A.

Frontend observable behavior — truth table (Footer-consuming route × user-event × trigger):

| Route | Event | Pre (K-034 P1 plain text) | Post (K-050) |
|---|---|---|---|
| / /about /business-logic /diary | render | Single `<span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>` + `<p>` GA disclosure | 3 SVG-anchor triad + `<button>` copy + sr-only aria-live + `<p>` GA disclosure |
| (same) | click on any text | no-op (no anchor) | per-sub-element handlers (mailto / copy / GitHub repo / LinkedIn profile) |
| (same) | GA dataLayer | 0 `cta_click` events from Footer | 3 click labels: `contact_email` (mail icon + email button share), `github_link`, `linkedin_link` |
| /app | render | no Footer (K-030 isolation) | no Footer (K-030 isolation, unchanged) |

**Non-invariance deltas:** (a) `<footer>` outerHTML changes — shared-components T1 byte-identity preserved cross-route (same DOM 4 routes) but baseline diffs vs K-034 P1; (b) Playwright snapshot baselines invalidated — Phase 4 regenerates; (c) GA `cta_click` event surface re-introduced on 4 routes (K-018 AC-018-CLICK restoration).

**`git show HEAD:frontend/src/components/shared/Footer.tsx`** verified: current zero-prop plain-text `<footer>` unchanged since K-034 P1 (JSDoc timestamp 2026-04-23; last content modifier was K-034 P1 Engineer commit). No surprise intermediate state.

## 5. File change list (22 items)

| # | Path | Action | Phase 3 step |
|---|---|---|---|
| 1 | `frontend/package.json` | Modify — add `vite-plugin-svgr` to `devDependencies` | 3-a |
| 2 | `frontend/vite.config.ts` | Modify — `plugins: [svgr({ svgrOptions: { icon: true } }), react(), ...]`; new import line | 3-a |
| 3 | `frontend/design/brand-assets/github.svg` | Create — raw Simple Icons mirror (WebFetch) | 3-b |
| 4 | `frontend/design/brand-assets/linkedin.svg` | Create — raw Simple Icons mirror (WebFetch) | 3-b |
| 5 | `frontend/design/brand-assets/mail.svg` | Create — Heroicons 24 solid envelope (WebFetch) | 3-b |
| 6 | `frontend/design/brand-assets/SOURCES.md` | Create — provenance (source URL + license + fetch date) | 3-b |
| 7 | `frontend/design/brand-assets/README.md` | Create — folder purpose + Designer + Engineer workflow | 3-c |
| 8 | `frontend/src/components/icons/GithubIcon.tsx` | Create — `?react` SVGR wrapper, `aria-hidden=true`, `className` pass-through | 3-d |
| 9 | `frontend/src/components/icons/LinkedinIcon.tsx` | Create — same pattern | 3-d |
| 10 | `frontend/src/components/icons/MailIcon.tsx` | Create — same pattern | 3-d |
| 11 | `frontend/src/components/shared/Footer.tsx` | Rewrite — see §3 authoritative DOM; state + `useRef` timer cleanup + `useEffect` unmount; `handleCopy` clipboard + auto-select fallback; `trackCtaClick` calls | 3-e |
| 12 | `frontend/design/specs/homepage-v2.frame-1BGtd.json` | Modify — `ticket: "K-050"`, update `visual-delta`, add `_design-divergence` top-level (kebab schema per existing file) | 3-f |
| 13 | `frontend/design/specs/homepage-v2.frame-86psQ.json` | Modify — same kebab | 3-f |
| 14 | `frontend/design/specs/homepage-v2.frame-ei7cl.json` | Modify — `ticket: "K-050"`, update `visualDelta`, add `_design-divergence` top-level (camel schema per existing file) | 3-f |
| 15 | `frontend/design/specs/homepage-v2.frame-2ASmw.json` | Modify — same camel | 3-f |
| 16 | `docs/designs/design-exemptions.md` | Modify — add BRAND-ASSET category definition (after INHERITED-editorial block); add §2 row listing all 4 frame IDs; Governance clause mentions BRAND-ASSET | 3-g |
| 17 | `frontend/e2e/shared-components.spec.ts` | Modify — T2 replace plain-text with `[data-testid]` visibility + GA disclosure preserved; T3 INVERT (`cta-email` / `cta-email-copy` / `cta-github` / `cta-linkedin` counts=1; mailto/github/linkedin anchors present on /about); add new `describe('AC-050-EMAIL-COPY-BEHAVIOR')` block (clipboard permission grant + click + text swap + 1.5s revert + aria-live); update L144-146 (AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE) plain-text expectation to aria-label+testid assertion | 3-h |
| 18 | `frontend/e2e/ga-tracking.spec.ts` | Modify — restore AC-018-CLICK 3 tests (mock dataLayer spy; click each of `[data-testid="cta-email"]` / `[data-testid="cta-email-copy"]` / `[data-testid="cta-github"]` / `[data-testid="cta-linkedin"]` on /about; assert label `contact_email` / `contact_email` / `github_link` / `linkedin_link`); add 1 cross-route sanity test (click cta-github on all 4 routes, assert `page_location` matches route) | 3-i |
| 19 | `frontend/e2e/shared-components.spec.ts-snapshots/footer-{home,about,business-logic,diary}-chromium-darwin.png` | Regenerate (`--update-snapshots`) | Phase 4 |
| 20 | `agent-context/architecture.md` | Modify — Path Y minimal: Footer placement table 4 cells (§L524-528) + Shared Components Footer row (§L535) + `updated:` line append one-line K-050 note (no narrative chain expansion) | 3-j |
| 21 | `docs/tech-debt.md` | Modify (if exists) / Create — append TD-K050-01 (designer.md persona supplement), TD-K050-02 (Design System Handbook), TD-K050-03 (architecture.md narrative bloat cleanup) | 3-j |
| 22 | `frontend/public/diary.json` | Modify — prepend K-050 entry (English text) | 3-j |

Plus already-written:
- `docs/tickets/K-050-footer-social-links.md` (Phase 1, this commit series)
- `docs/designs/K-050-footer-social-links.md` (this doc)
- `CLAUDE.md` §Pre-Worktree Sync Gate (Phase 0-a, already on main)

## 6. Engineer implementation order (10 steps → 5 commits)

| Step | Subject | Files |
|---|---|---|
| 3-a | Install vite-plugin-svgr + vite.config plug | 1, 2 |
| 3-b | WebFetch 3 SVG + write SOURCES.md | 3, 4, 5, 6 |
| 3-c | Write brand-assets/README.md | 7 |
| **Commit #3** | `chore(K-050): vite-plugin-svgr + brand-assets/ infrastructure [Phase 3]` | files 1–7 |
| 3-d | Create 3 icon wrapper components | 8, 9, 10 |
| 3-e | Rewrite Footer.tsx (click-to-copy + aria-live + GA + icon imports) | 11 |
| **Commit #4** | `feat(K-050): icon wrappers + Footer click-to-copy + GA click restore [Phase 3]` (`Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`) | files 8–11 |
| 3-f | Update 4 Pencil JSON specs (preserve per-file schema; add `_design-divergence`) | 12, 13, 14, 15 |
| 3-g | design-exemptions.md — BRAND-ASSET category + row | 16 |
| **Commit #5** | `docs(K-050): Pencil SSOT — _design-divergence + BRAND-ASSET exemption [Phase 3]` | files 12–16 |
| 3-h | shared-components.spec.ts T2/T3/T4 + new AC-050-EMAIL-COPY-BEHAVIOR block | 17 |
| 3-i | ga-tracking.spec.ts AC-018-CLICK + cross-route sanity | 18 |
| **Commit #6** | `test(K-050): shared-components T2/T3/T4 + ga-tracking AC-018-CLICK [Phase 3]` | files 17, 18 |
| 3-j | architecture.md Path Y + tech-debt.md + diary.json | 20, 21, 22 |
| **Commit #7** | `chore(K-050): architecture.md + tech-debt + diary.json sync [Phase 3]` | files 20–22 |
| Phase 4 | `npx tsc --noEmit` + Playwright + Vitest; snapshot regen | file 19 |
| **Commit (optional)** | `chore(K-050): regenerate footer snapshots after Phase 3 DOM change` | file 19 |

**Alias resolution for SVG imports:** `tsconfig.json` has no `paths` entry; imports use relative paths (`import GithubSvg from '../../design/brand-assets/github.svg?react'` from `frontend/src/components/icons/`). Engineer MUST NOT assume `@/` alias — validate path at Step 3-d build time.

## 7. Test cascade matrix

| Test ID | File | Change | Pass condition |
|---|---|---|---|
| T1 AC-034-P1-ROUTE-DOM-PARITY | shared-components.spec.ts L31-56 | No content change; new Footer DOM still byte-identical cross-route | 4 routes outerHTML equal |
| T2 (renamed target) | shared-components.spec.ts L58-73 | Rewrite: `[data-testid="cta-email"]` / `[data-testid="cta-github"]` / `[data-testid="cta-linkedin"]` visible on /; GA disclosure `<p>` text preserved | visibility + text exact match |
| T3 (INVERT target) | shared-components.spec.ts L79-96 | On /about: `cta-email` count=1, `cta-email-copy` count=1, `cta-github` count=1, `cta-linkedin` count=1, mailto/github/linkedin anchors count=1 each | counts match |
| new AC-050-EMAIL-COPY-BEHAVIOR | shared-components.spec.ts (new block) | `context.grantPermissions(['clipboard-read'])` → click `cta-email-copy` → assert clipboard contents + button text swap + sr-only aria-live text | 4 assertions green |
| AC-045-FOOTER-WIDTH-PARITY T18/T19 | shared-components.spec.ts L193-244 | No change — still apply to new Footer (full-bleed + pairwise diff ≤2px) | unchanged, must still pass |
| AC-034-P1 snapshot baselines | shared-components.spec.ts L166-179 | Regenerate 4 PNGs (DOM changes) | new baseline committed alongside impl |
| AC-018-CLICK restored | ga-tracking.spec.ts (L107-143 extend) | 3 tests on /about: click cta-email → label=`contact_email`; click cta-github → `github_link`; click cta-linkedin → `linkedin_link`. Plus cross-route sanity: click cta-github on /, /about, /business-logic, /diary → `page_location` matches | 4 new assertions green |
| AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE L144 | shared-components.spec.ts L105-158 | Update plain-text `getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn')` assertion → `locator('[data-testid="cta-email-copy"]')` visible | stays green |

## 8. Sacred invariants cross-check

| Sacred AC | Defined in | Pre-K-050 state | K-050 impact | Decision |
|---|---|---|---|---|
| K-017 AC-017-FOOTER (email/GitHub/LinkedIn anchors + href) | about.spec.ts L311-346 | Retired at K-034 P1 | Partial-restore (anchors yes; "Let's talk →" copy NOT) | Re-introduce anchor hrefs + testids via Footer.tsx; "Let's talk →" remains retired (Pencil has no such label) |
| K-018 AC-018-CLICK 3 /about events | ga-tracking.spec.ts L118-159 (deleted in K-034 P1) | 0 tests remain (only BuiltByAIBanner) | Full restore + 1 cross-route sanity = 4 tests | Engineer Step 3-i |
| K-022 A-7 italic + underline anchor style | about.spec.ts | Retired at K-034 P1 | K-050 icons carry no text → italic/underline N/A | NOT restored |
| K-024 /diary no-Footer | pages.spec.ts L158 (deleted in K-034 P3) | Already retired | No K-050 change | N/A (K-034 P3 retired) |
| K-030 /app no-Footer | app-bg-isolation.spec.ts | Alive | K-050 does not touch /app | Preserved |
| K-034 P1 T1 byte-identical cross-route | shared-components.spec.ts L31-56 | Alive | New Footer DOM must also be byte-identical cross 4 routes | Preserved (Engineer Step 3-e: single `<Footer />` zero-prop, no per-route branch) |
| K-045 AC-045-FOOTER-WIDTH-PARITY T18 | shared-components.spec.ts L193-222 | Alive | Footer full-bleed invariant must hold | Preserved (no ancestor changes) |
| K-045 AC-045-FOOTER-WIDTH-PARITY T19 | shared-components.spec.ts L224-244 | Alive | Pairwise cross-route width diff ≤2px must hold | Preserved (single DOM 4 routes → diff=0) |

## 9. Self-Diff (architecture.md sync — Path Y minimal)

**Edit targets** (line refs from HEAD `8f4ad75:agent-context/architecture.md`):

**A. Footer placement table** (§"Footer 放置策略", around L524-528) — update 4 cells from K-034 P1 plain-text framing to K-050:

| 頁面 | Footer |
|---|---|
| `/` | `<Footer />` (K-050 2026-04-25 — brand-asset SVG anchors + click-to-copy email `<button>`; supersedes K-034 P1 plain-text) |
| `/about` | `<Footer />` (K-050 — same shared DOM; K-017 anchor hrefs partial-restored) |
| `/diary` | `<Footer />` (K-050 — same shared DOM; /diary inherits via K-034 P3 adoption) |
| `/app` | 無 footer (K-030 isolation preserved) |
| `/business-logic` | `<Footer />` (K-050 — same shared DOM) |

**B. Shared Components table** (around L535) — Footer row rewrite:

> `Footer` | `components/shared/Footer.tsx` | 4 路由 render zero-prop `<Footer />` with 3 brand-asset SVG anchors + click-to-copy email `<button>` + sr-only aria-live. Pencil SSOT = frames `86psQ` + `1BGtd` + `ei7cl` + `2ASmw` (text-placeholder-only per `design-exemptions.md §BRAND-ASSET`). K-050 2026-04-25 supersedes K-034 Phase 1. /app K-030 isolation preserved.

**C. `updated:` frontmatter line** — append single K-050 note (NOT expand narrative chain; per Path Y):

> `updated: 2026-04-25 (K-050 Architect — Footer brand-asset SVG anchors + click-to-copy email button design landed; Pencil SSOT exemption §BRAND-ASSET category added; supersedes K-034 P1 plain-text. Route Impact: /, /about, /business-logic, /diary — /app K-030 isolation unchanged. 0 backend / 0 schema / 0 API changes. Pre-existing K-040 bloat cleanup DEFERRED to TD-K050-03.)`

**No edits** to existing 2026-04-22/23/24 changelog entries (those are historical; TD-K050-03 tracks their future compression).

## 10. Consolidated Delivery Gate (§X.2 checklist)

| Gate | Status |
|---|---|
| all-phase-coverage | ✓ (single logical phase; 10 steps / 5 commits) |
| pencil-frame-completeness | ✓ (all 4 consumer frames listed + SSOT-exemption-documented) |
| visual-spec-json-consumption | ✓ (4 JSON edited; exemption category new) |
| sacred-ac-cross-check | ✓ (§8 above, 8 Sacred lines) |
| route-impact-table | ✓ (§4 truth table, 5 routes) |
| cross-page-duplicate-audit | ✓ (single Footer component consumed 4 routes — zero-duplicate) |
| target-route-consumer-scan | ✓ (grep `<Footer />` 4 consumer pages unchanged) |
| architecture-doc-sync | ✓ (§9 Path Y minimal) |
| self-diff | ✓ (§9 edits listed pre-commit) |

## 11. Wrap-up flow (Phase 5 → Phase 7) — NEW PR-merge protocol

Per `~/.claude/CLAUDE.md` §Branch + PR Workflow (added 2026-04-25): **`main` never receives direct commits** for ticket work. K-050 follows the new merge protocol — supersedes the old `rebase + FF-merge + push main` plan from the handoff doc.

| Phase | Step | Actor | Action |
|---|---|---|---|
| 5 | Reviewer (Step 1 + Step 2) + QA full E2E suite | sub-agents | green-light required before Phase 6 |
| 6-a | `git push origin K-050-footer-social-links` | PM | branch lands on origin |
| 6-b | `gh pr create --base main --head K-050-footer-social-links` | PM | open PR with body summarizing 8 ACs + Sacred cross-check + 22-file change list |
| 6-c | **PAUSE for user review** | — | user inspects PR + approves locally |
| 7-a | `gh pr merge --squash --delete-branch <PR#>` | PM | squash-merge to main + delete remote branch |
| 7-b | `git checkout main && git pull origin main` (worktree main) | PM | local main = squashed origin |
| 7-c | `git worktree remove .claude/worktrees/K-050-footer-social-links` | PM | clean worktree (branch already deleted by step 7-a) |
| 7-d | Deploy: `npm run build` + `firebase deploy --only hosting` per `CLAUDE.md §Deploy Checklist` | user runs locally | live footer matches K-050 spec on 4 routes |

**Key differences vs old flow:**
- No FF-merge, no linear-history preservation; main gets one squash commit per ticket
- Local main never receives direct commit (except CLAUDE.md/persona/memory meta edits per §Worktree Isolation §Main direct-commit exception)
- 48689a7 (Phase 0-a CLAUDE.md Pre-Worktree Sync Gate) was committed direct-to-main BEFORE this rule landed; falls under meta-edit exception retroactively — no rebase needed

**halt point**: Phase 6-c PAUSE is mandatory — auto mode does NOT auto-merge.

## 12. Known risks / BQ to PM

- **BQ-050-01 (flagged for PM)**: `visual-delta: yes` ticket normally triggers Designer Pre-design gate + `design-locked: true` sign-off. K-050 plan layers-2-only (exemption + JSON divergence); 3rd layer (Designer persona gate at `~/.claude/agents/designer.md`) deferred per handoff D-TD-K050-01. **PM to decide** whether K-050 exemption-backed divergence substitutes for design-locked sign-off in Phase 5 (recommendation: yes — exemption row + JSON `_design-divergence` is the contract, per layer-1+2 approach).
- Snapshot baseline regeneration: K-050 legitimately invalidates 4 footer-*.png baselines. Phase 4 regen + Phase 6 commit treats new baselines as new SSOT (K-034 P1 precedent, K-045 precedent).
- `vite-plugin-svgr` version pin: Engineer latest stable from npm (no specific version mandated). Flag if major-version mismatch vs vite 5.x.
- Schema hazard (pre-existing): 4 Pencil JSON files use 2 different top-level key shapes. K-050 does NOT unify; Engineer preserves per-file shape. Future ticket (Designer-driven) may unify — out of K-050 scope.

End of design doc.
