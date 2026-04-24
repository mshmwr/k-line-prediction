# K-050 Planning Session Handoff

**Status**: planning complete, ready for execution
**Ticket**: K-050 — Footer 社群連結 — 可點擊 icon + Email 明文
**Base branch**: `main`
**Worktree**: `.claude/worktrees/K-050-footer-social-links/` (not yet created)
**Branch**: `K-050-footer-social-links` (not yet created)
**Handoff written**: 2026-04-24 by main-agent in cloud sandbox planning session
**PM**: Yichen Lee (user)

---

## How to use this document

Read entire file before any action. Execute phases in order. Halt points are marked 🛑 — when reached, ask PM (user) for decision, do not self-resolve. All decisions here were locked by PM during planning session; do not re-ask unless ambiguous.

---

## Critical facts new agent must know

1. **Persona files do NOT exist in sandbox**. `~/.claude/agents/*.md` are on user's local machine. You cannot read them. Phase 5 Reviewer + QA spawn as `general-purpose` sub-agents briefed from project docs (`docs/ai-collab-protocols.md` + `docs/retrospectives/*.md`) only.

2. **MEMORY.md / feedback_* files also user-local**. If Bug Found Protocol triggers, Step 3 "write memory entry" produces draft patch for user to apply manually; halt for PM decision first.

3. **Harness branch abandon**: current `claude/fix-footer-linkedin-kdY9Q` has no commits, DELETE locally after worktree created: `git branch -D claude/fix-footer-linkedin-kdY9Q`.

4. **Firebase deploy cannot run in sandbox** (no auth). Phase 7-f onward is user's local work. Sandbox agent halts at Phase 7-c (push main after FF-merge).

5. **vite-plugin-svgr is a NEW dev dependency**. Install required in Phase 3-a. Update `vite.config.ts`.

6. **Pencil JSON schema limits**: only `type: "text"` and `type: "frame"` supported. K-050 does NOT add image nodes to Pencil. Instead uses `_design-divergence` custom field + `design-exemptions.md §BRAND-ASSET` category (option C, not B).

7. **URLs / paths (PM-verified)**:
   - Email: `mailto:yichen.lee.20@gmail.com`
   - GitHub: `https://github.com/mshmwr/k-line-prediction` (repo link, NOT profile)
   - LinkedIn: `https://linkedin.com/in/yichenlee-career`

8. **architecture.md has historical bloat** (754 lines, YAML `updated:` is 200+ word changelog). K-050 uses **Path Y minimal**: current-state only, no K-034 narrative chain. TD-K050-03 tracks full cleanup as future ticket.

9. **Manual browser QA is explicitly SKIPPED** per PM decision. Report must state: "Manual browser QA not performed — sandbox constraint per PM decision 2026-04-24". Do NOT silently skip.

10. **PR creation IS requested** (user explicitly asked Phase 6-d). Override the default "don't create PR" rule.

11. **No `Co-Authored-By: Claude` trailer on every commit** — only on `feat`, `design`, `close` types per project convention.

12. **No session URL in commits** (system prompt conflicts with project convention; follow project).

13. **Language**: sub-agent briefs in English; user-facing dialogue in Traditional Chinese.

---

## Execution overview table

| Phase | Sub-steps | Commit count |
|---|---|---|
| 0 Setup | CLAUDE.md commit + main sync + worktree creation | 1 (on main) |
| 1 PM PRD | Write K-050 ticket PRD | 1 |
| 2 Architect | Write K-050 design doc | 1 |
| 3 Engineer | 10 steps across 5 logical commits | 5 |
| 4 Validation | tsc + Playwright + Vitest (no commit unless fixes) | 0–1 |
| 5 Reviewer + QA | Sub-agent review + regression + retros (retros DEFERRED) | 2–3 |
| 6 Push + PR | Delete harness branch + push K-050 + open PR + HALT | 0 |
| 7 Deploy + Close | Sandbox: rebase+FF+push main. User local: build+firebase+verify+close commit | 1 (user) |

Total ~11–12 commits.

---

## Deferred items (halt triggers)

| # | Deferred topic | Surfaces at | Action |
|---|---|---|---|
| D1 | Retrospective authorship (who writes 5 role retros + Role Sub-Agent Isolation Gate rule) | Phase 5-e, before Commit #10 | 🛑 Halt. Ask PM for option A–F |
| D2 | Role Sub-Agent Isolation Gate (CLAUDE.md rule) | Part of D1 discussion | Part of D1 |
| D3 | Bug Found Protocol in sandbox variant (memory entry draft + user manual apply) | Phase 5-a or 5-c if sub-agent finds bug | 🛑 Halt. Describe bug, ask PM for protocol decision |

---

## Halt points

1. 🛑 **Phase 0-c**: complex rebase conflict
2. 🛑 **Phase 4**: non-K-050 spec red in Pass 2
3. 🛑 **Phase 5-a or 5-c**: Reviewer/QA sub-agent finds bug (D3)
4. 🛑 **Phase 5-e**: retrospective authorship (D1)
5. 🛑 **Phase 6-e**: await PM deploy approval after PR created
6. 🛑 **Phase 7-c done**: handoff to user for local deploy

---

## Phase 0 — Setup

### 0-a: Commit Pre-Worktree Sync Gate to main (direct meta edit)

Location: main repo on branch `main`. No active K-XXX worktree yet → meta commit allowed per CLAUDE.md §Main direct-commit exception.

Edit CLAUDE.md: add new subsection after `### Worktree Isolation (mandatory for every ticket, 2026-04-23)`:

~~~markdown
### Pre-Worktree Sync Gate (mandatory for every new worktree)

Before `git worktree add` for any new ticket:

1. `git fetch origin main`
2. `git push origin main` — probe for divergence / protection issues
3. If push fails → `git branch backup/main-before-<ticket>-<timestamp> main && git pull --rebase origin main && git push origin main` (resolve simple conflicts in place; halt for complex)
4. Only after local main == remote main: `git worktree add .claude/worktrees/K-XXX-<slug> -b K-XXX-<slug> main`
~~~

Commit: `docs(claude): Pre-Worktree Sync Gate rule [docs-only]`
No body, no Co-Authored-By trailer.

### 0-b through 0-d: Apply gate and create worktree

~~~bash
git fetch origin main
git log origin/main..main --oneline   # expect ≥1 (0-a commit)
git push origin main
# On push fail (non-fast-forward):
#   git branch backup/main-before-K050-$(date +%Y%m%d-%H%M%S) main
#   git pull --rebase origin main     # self-resolve simple conflicts, halt for complex
#   git push origin main

git worktree add .claude/worktrees/K-050-footer-social-links -b K-050-footer-social-links main
cd .claude/worktrees/K-050-footer-social-links
git status  # confirm clean
~~~

All subsequent commands run inside this worktree.

---

## Phase 1 — PM PRD

Write `docs/tickets/K-050-footer-social-links.md`:

~~~markdown
---
id: K-050
title: Footer 社群連結 — 可點擊 icon + Email 明文
status: in-progress
type: feat
priority: medium
created: 2026-04-24
supersedes: K-034
---

## Background

K-034 Phase 1 (2026-04-23) 依 Pencil SSOT 將 footer 收歸為純文字單行 `email · github · LinkedIn`。實際使用後發現 LinkedIn / GitHub / Email 皆不可點擊 —— 明顯 UX 缺口。本 ticket 以新 Pencil 設計迭代取代 K-034 Phase 1，導入官方 brand-mark SVG + mailto icon + 可選取 email 明文 + click-to-copy，並恢復 K-018 GA click tracking。

## Scope

**In-scope:**
- Footer DOM (4 footer-consuming 路由共用)
- 3 brand-asset SVG git-tracked (`frontend/design/brand-assets/`)
- 4 Pencil JSON spec updates (`_design-divergence` field)
- `design-exemptions.md` new BRAND-ASSET category + row
- `shared-components.spec.ts` T2/T3/T4 rewrite + snapshot baselines regenerate
- `ga-tracking.spec.ts` AC-018-CLICK restore + 1 cross-route sanity
- Footer.tsx click-to-copy email + aria-live
- architecture.md Footer section (Path Y minimal)
- CLAUDE.md §Pre-Worktree Sync Gate (committed in Phase 0)

**Out-of-scope:**
- /app route (K-030 no-footer preserved)
- Footer 外元件
- Pencil .pen file re-export (.json update only)

## Acceptance Criteria

### AC-050-FOOTER-LAYOUT
**Given:** user visits /, /about, /business-logic, or /diary
**When:** footer renders
**Then:** footer shows `[Mail icon]  yichen.lee.20@gmail.com  [GitHub icon]  [LinkedIn icon]` left-to-right
**And:** icons are 14px filled monochrome, fill inherits `text-muted` (#6B5F4E)
**And:** hover on any icon or email text transitions to `text-ink`
**And:** email group uses `gap-2`, footer group uses `gap-4`
**And:** GA disclosure paragraph preserved below

### AC-050-EMAIL-ICON-CLICKABLE
**Given:** footer rendered
**When:** user clicks mail icon (`aria-label="Email"`, `data-testid="cta-email"`)
**Then:** `<a href="mailto:yichen.lee.20@gmail.com">` hands off to mail handler
**And:** NO `target` / `rel` attributes on mailto anchor

### AC-050-EMAIL-COPY
**Given:** footer rendered with `yichen.lee.20@gmail.com` as `<button data-testid="cta-email-copy">`
**When:** user clicks email text button
**Then:** `navigator.clipboard.writeText(...)` called; clipboard contains address
**And:** button text swaps to `Copied!` for 1.5s then reverts
**And:** sr-only `aria-live="polite" role="status"` region announces "Email address copied to clipboard"
**And:** on clipboard failure, button text auto-selects (range selection) as fallback
**And:** rapid clicks cancel previous reset timer (useRef cleanup)

### AC-050-BRAND-ICONS-CLICKABLE
**Given:** footer rendered
**When:** user clicks GitHub icon or LinkedIn icon
**Then:** `<a target="_blank" rel="noopener noreferrer">` opens new tab
**And:** GitHub href = `https://github.com/mshmwr/k-line-prediction`
**And:** LinkedIn href = `https://linkedin.com/in/yichenlee-career`
**And:** `aria-label` = `"GitHub"` / `"LinkedIn"`
**And:** `data-testid` = `cta-github` / `cta-linkedin`

### AC-050-GA-CLICK
**Given:** user on any footer-consuming route
**When:** user clicks mail icon, email text, GitHub icon, or LinkedIn icon
**Then:** `trackCtaClick` fires with label `'contact_email'` / `'contact_email'` / `'github_link'` / `'linkedin_link'`
**And:** mail icon and email text share `contact_email` label
**And:** `page_location` reflects current route

### AC-050-PENCIL-UPDATED
**Given:** K-050 delivers
**Then:** 4 frame JSON specs (`1BGtd` / `86psQ` / `ei7cl` / `2ASmw`) add top-level `_design-divergence` field
**And:** top-level `ticket` = `"K-050"`, `visual-delta` describes the brand-asset + click-to-copy delta
**And:** frame content unchanged (placeholder text preserved)
**And:** `design-exemptions.md` §2 gains BRAND-ASSET row listing all 4 frame IDs

### AC-050-BYTE-IDENTICAL
**Given:** K-050 delivers
**Then:** `shared-components.spec.ts` T1 (byte-identical `<footer>.outerHTML` across 4 routes) PASSES
**And:** 4 snapshot baselines regenerated and committed

### AC-050-DEPLOY
**Given:** Phase 4 + Phase 5 green
**When:** PM approves
**Then:** Firebase hosting deployed per CLAUDE.md §Deploy Checklist (user runs locally)
**And:** live footer matches K-050 spec on all 4 routes

## Sacred cross-check

| Sacred | 檔案 | 原 test 數 | K-050 狀態 |
|---|---|---|---|
| K-017 AC-017-FOOTER | about.spec.ts L311–346 | 5 | Partial restore (anchors yes, "Let's talk →" no) |
| K-018 AC-018-CLICK | ga-tracking.spec.ts L118–159 | 3 | Full restore + 1 cross-route sanity = 4 |
| K-022 A-7 italic+underline | about.spec.ts | 2 | Not restored (icons carry no text) |
| K-024 /diary no-Footer | pages.spec.ts L158 | 1 | N/A (K-034 P3 already overrode) |
| K-030 /app no-Footer | app-bg-isolation.spec.ts | 1 | Preserved |
| K-034 P1 T1 byte-identity | shared-components.spec.ts L36 | 1 | Preserved |

## Deferred

Per PM decision 2026-04-24:
- 3rd-layer Designer awareness (persona gate at `~/.claude/agents/designer.md`) — deferred; supplement from user local machine. K-050 ships with layers 1 & 2 only (exemption + JSON divergence).

## Retrospective

(Deferred — see handoff doc D1)
~~~

Commit: `docs(K-050): open ticket + PRD AC block + YAML frontmatter`

Body (short):
~~~
8 ACs covering footer layout, email copy behavior, brand icon anchors,
GA click tracking restore, Pencil SSOT update, byte-identity, deploy.
Supersedes K-034 Phase 1 plain-text footer. Restores K-018 AC-018-CLICK.
TD-K050-01 tracks deferred designer.md persona supplement.
~~~

---

## Phase 2 — Architect design doc

Write `docs/designs/K-050-footer-social-links.md`. Structure (9 chapters, simplified from K-034 P1):

1. Front matter YAML (pencil-frames-cited, supersedes, etc.)
2. One-line goal
3. Pencil ground truth (current 4-frame schema + K-050 target with `_design-divergence`)
4. Behavior-diff table (OLD K-034 P1 plain text vs NEW K-050 icons+copy)
5. File change list (22 items, see below)
6. Implementation order (10 Engineer steps, see below)
7. Test cascade matrix
8. Sacred invariants cross-check (5-col detailed)
9. Self-Diff (architecture.md sync — Path Y minimal)

### File change list (22 items)

| # | Path | Action |
|---|---|---|
| 1 | `frontend/package.json` | Modify (add vite-plugin-svgr devDep) |
| 2 | `frontend/vite.config.ts` | Modify (plug svgr) |
| 3 | `frontend/design/brand-assets/github.svg` | Create |
| 4 | `frontend/design/brand-assets/linkedin.svg` | Create |
| 5 | `frontend/design/brand-assets/mail.svg` | Create |
| 6 | `frontend/design/brand-assets/SOURCES.md` | Create |
| 7 | `frontend/design/brand-assets/README.md` | Create |
| 8 | `frontend/src/components/icons/GithubIcon.tsx` | Create |
| 9 | `frontend/src/components/icons/LinkedinIcon.tsx` | Create |
| 10 | `frontend/src/components/icons/MailIcon.tsx` | Create |
| 11 | `frontend/src/components/shared/Footer.tsx` | Modify |
| 12 | `frontend/design/specs/homepage-v2.frame-1BGtd.json` | Modify |
| 13 | `frontend/design/specs/homepage-v2.frame-86psQ.json` | Modify |
| 14 | `frontend/design/specs/homepage-v2.frame-ei7cl.json` | Modify |
| 15 | `frontend/design/specs/homepage-v2.frame-2ASmw.json` | Modify |
| 16 | `docs/designs/design-exemptions.md` | Modify (new category + row) |
| 17 | `frontend/e2e/shared-components.spec.ts` | Modify (T2/T3/T4 + AC-050-EMAIL-COPY-BEHAVIOR block) |
| 18 | `frontend/e2e/ga-tracking.spec.ts` | Modify (restore AC-018-CLICK + cross-route sanity) |
| 19 | `frontend/e2e/shared-components.spec.ts-snapshots/footer-{home,about,business-logic,diary}-chromium-darwin.png` | Regenerate via `--update-snapshots` |
| 20 | `agent-context/architecture.md` | Modify (Path Y minimal) |
| 21 | `docs/tech-debt.md` | Modify (TD-K050-01/02/03) |
| 22 | `frontend/public/diary.json` | Modify (prepend K-050 English entry) |

Plus K-050 ticket.md + K-050 design doc.md (created in Phase 1 & 2).

### 10 Engineer steps

1. Install `vite-plugin-svgr` + update `vite.config.ts`
2. WebFetch 3 SVGs to `brand-assets/` + write `SOURCES.md`
3. Write `brand-assets/README.md`
4. Create 3 icon wrapper components
5. Update 4 Pencil JSON specs + `design-exemptions.md`
6. Rewrite `Footer.tsx` (click-to-copy + aria-live + GA + icon wrappers)
7. Update `shared-components.spec.ts` T2/T3/T4 + new block
8. Restore `ga-tracking.spec.ts` AC-018-CLICK + cross-route sanity
9. Update `architecture.md` (Path Y) + `tech-debt.md` + `diary.json`
10. Phase 4 validation

Commit: `design(K-050): architect design doc + file change list + 10-step plan`

Body should include Sacred cross-check summary + Path Y rationale + 22-file list + Co-Authored-By trailer.

---

## Phase 3 — Engineer implementation

### 3-a: Infrastructure

~~~bash
cd frontend
npm install -D vite-plugin-svgr
~~~

Update `vite.config.ts`:

~~~ts
import svgr from 'vite-plugin-svgr'

// add to plugins array (before react()):
plugins: [
  svgr({ svgrOptions: { icon: true } }),
  react(),
  // ...existing plugins
],
~~~

### 3-b: WebFetch 3 SVGs

~~~bash
mkdir -p frontend/design/brand-assets
~~~

WebFetch URLs:

| File | URL |
|---|---|
| `github.svg` | `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/github.svg` |
| `linkedin.svg` | `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/linkedin.svg` |
| `mail.svg` | `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/envelope.svg` |

Prompt per fetch: "Return raw SVG content verbatim including opening `<svg>` attributes. No explanation."

Write `frontend/design/brand-assets/SOURCES.md`:

~~~markdown
# Brand Assets — Source & License Provenance

## github.svg
- **Source**: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/github.svg
- **Upstream authority**: https://github.com/logos (GitHub Mark, Simple Icons mirror)
- **License**: CC0 (Simple Icons)
- **Fetched**: 2026-04-24
- **Use in K-050**: Footer GitHub repo link icon

## linkedin.svg
- **Source**: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/linkedin.svg
- **Upstream authority**: https://brand.linkedin.com/ ("in" logo, Simple Icons mirror)
- **License**: CC0 (Simple Icons). LinkedIn Brand Guidelines allow personal profile linking.
- **Fetched**: 2026-04-24
- **Use in K-050**: Footer LinkedIn profile link icon

## mail.svg
- **Source**: https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/envelope.svg
- **License**: MIT (Heroicons)
- **Fetched**: 2026-04-24
- **Use in K-050**: Footer email mailto anchor icon
~~~

### 3-c: brand-assets README

Write `frontend/design/brand-assets/README.md`:

~~~markdown
# frontend/design/brand-assets/ — Third-party brand mark SSOT

## Purpose

Third-party brand-mark SVG logos (GitHub, LinkedIn, Gmail brand pages) and generic-use icons (Heroicons, etc.) for runtime React import. Pencil schema (`type: "text"` + `type: "frame"` only) cannot encode image nodes; this folder is **parallel SSOT** for brand-asset visuals.

## Naming

`<brand-name>.svg` or `<function-name>.svg`, lowercase kebab-case.

## License provenance

Every file must be registered in `SOURCES.md` with: upstream URL + authority + license + fetch date + use case.

## Designer workflow (adding new brand asset)

1. Obtain SVG from official brand page OR Simple Icons canonical mirror
2. Verify license
3. Drop SVG here
4. Update `SOURCES.md`
5. In consuming ticket's design doc, register `design-exemptions.md §2 BRAND-ASSET` row

## Engineer workflow (consuming an asset)

1. Ensure `vite-plugin-svgr` configured in `frontend/vite.config.ts`
2. Import: `import GithubIcon from '@/design/brand-assets/github.svg?react'`
3. Wrap in `frontend/src/components/icons/<Name>Icon.tsx` (set `aria-hidden="true"` default)
4. Render with Tailwind sizing class (`w-3.5 h-3.5`) + `fill-current` for `currentColor`

## Current assets (K-050)

- `github.svg` — GitHub Mark monochrome
- `linkedin.svg` — LinkedIn "in" monochrome
- `mail.svg` — Heroicons envelope solid

See `SOURCES.md` for provenance.
~~~

**Commit #3**: `chore(K-050): vite-plugin-svgr + brand-assets/ infrastructure [Phase 3]`

### 3-d: Icon wrappers

Create `frontend/src/components/icons/GithubIcon.tsx`:

~~~tsx
import GithubSvg from '@/design/brand-assets/github.svg?react'

export default function GithubIcon({ className }: { className?: string }) {
  return <GithubSvg className={className} aria-hidden="true" />
}
~~~

Same pattern for `LinkedinIcon.tsx` and `MailIcon.tsx`. `@/` prefix assumes Vite alias to `frontend/src/`; check `tsconfig.json` + `vite.config.ts` and adjust path if alias doesn't extend to `frontend/design/`.

### 3-e: Rewrite Footer.tsx

~~~tsx
import { useState, useRef, useEffect } from 'react'
import { trackCtaClick } from '../../utils/analytics'
import GithubIcon from '@/components/icons/GithubIcon'
import LinkedinIcon from '@/components/icons/LinkedinIcon'
import MailIcon from '@/components/icons/MailIcon'

/**
 * Footer — sitewide footer (K-050 2026-04-24 Pencil iteration; supersedes K-034 Phase 1 plain-text).
 *
 * Content split per design-exemptions.md §BRAND-ASSET:
 *   - Layout + typography: Pencil frames 86psQ + 1BGtd + ei7cl + 2ASmw (text nodes placeholder)
 *   - Brand logos: frontend/design/brand-assets/{github,linkedin,mail}.svg
 *   - Interactive behavior: this file (click-to-copy, aria-live, GA tracking)
 *
 * K-050 restores K-018 AC-018-CLICK GA click events (retired in K-034 Phase 1).
 * K-050 does NOT restore K-017 "Let's talk →" copy or K-022 A-7 italic/underline style.
 *
 * Regression contract: shared-components.spec.ts T1 asserts byte-identical
 * outerHTML across /, /about, /business-logic, /diary. Any divergence = FAIL.
 */
export default function Footer() {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  async function handleCopy() {
    const email = 'yichen.lee.20@gmail.com'
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      trackCtaClick('contact_email')
      clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      if (buttonRef.current) {
        const range = document.createRange()
        range.selectNodeContents(buttonRef.current)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }
  }

  return (
    <footer className="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">
      <div className="flex justify-between items-center">
        <span className="inline-flex items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <a
              href="mailto:yichen.lee.20@gmail.com"
              aria-label="Email"
              data-testid="cta-email"
              onClick={() => trackCtaClick('contact_email')}
              className="text-muted hover:text-ink transition-colors inline-flex"
            >
              <MailIcon className="w-3.5 h-3.5 fill-current" />
            </a>
            <button
              ref={buttonRef}
              type="button"
              data-testid="cta-email-copy"
              onClick={handleCopy}
              className="text-muted hover:text-ink transition-colors font-mono select-text cursor-pointer"
            >
              {copied ? 'Copied!' : 'yichen.lee.20@gmail.com'}
            </button>
          </span>
          <a
            href="https://github.com/mshmwr/k-line-prediction"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            data-testid="cta-github"
            onClick={() => trackCtaClick('github_link')}
            className="text-muted hover:text-ink transition-colors inline-flex"
          >
            <GithubIcon className="w-3.5 h-3.5 fill-current" />
          </a>
          <a
            href="https://linkedin.com/in/yichenlee-career"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            data-testid="cta-linkedin"
            onClick={() => trackCtaClick('linkedin_link')}
            className="text-muted hover:text-ink transition-colors inline-flex"
          >
            <LinkedinIcon className="w-3.5 h-3.5 fill-current" />
          </a>
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Email address copied to clipboard' : ''}
      </span>
      <p className="text-center mt-3">
        This site uses Google Analytics to collect anonymous usage data.
      </p>
    </footer>
  )
}
~~~

**Commit #4**: `feat(K-050): icon wrappers + Footer click-to-copy + GA click restore [Phase 3]`

Body: file list + AC coverage + Sacred status + Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

### 3-f/g: Pencil JSON + design-exemptions.md

For each of 4 Pencil JSON files, update top-level fields:

~~~json
{
  "pen-file": "frontend/design/homepage-v2.pen",
  "pen-mtime-at-export": "2026-04-24T<timestamp>",
  "exporter-version": "1.0",
  "frame-id": "<same>",
  "ticket": "K-050",
  "visual-delta": "K-050 — Footer contact row: 3 brand-asset SVG anchors (mail.svg / github.svg / linkedin.svg) + click-to-copy email <button> replace K-034 P1 plain-text one-liner. Pencil text node retained as layout-placeholder per design-exemptions.md §BRAND-ASSET.",
  "_design-divergence": "Runtime inserts 3 brand-asset SVGs (from frontend/design/brand-assets/{github,linkedin,mail}.svg) replacing the text tokens. Email token is rendered as a click-to-copy <button> with sr-only aria-live feedback announcing 'Email address copied to clipboard'. Pencil text content serves as layout-placeholder only. See docs/designs/design-exemptions.md §BRAND-ASSET for the authoritative runtime-vs-Pencil contract.",
  "cross-frame-parity": ["ei7cl", "1BGtd", "86psQ", "2ASmw"],
  "frame": { /* unchanged */ }
}
~~~

Update `docs/designs/design-exemptions.md`:

Add category definition:

~~~markdown
- **BRAND-ASSET** — third-party brand mark SVGs (official logos from GitHub, LinkedIn, corporate brand pages, or curated libraries like Heroicons) that Pencil's flat text encoding cannot represent. Pencil SSOT encodes layout and typography; brand SVG assets live in `frontend/design/brand-assets/` with provenance in SOURCES.md as parallel git-tracked SSOT. Runtime rendering inserts these SVGs at positions documented by the corresponding Pencil text-placeholder tokens.
~~~

Add §2 table row:

~~~markdown
| `Footer.tsx` | `homepage-v2.pen` `1BGtd` + `86psQ` + `ei7cl` + `2ASmw` | Runtime inserts 3 brand-asset SVGs (`github.svg` / `linkedin.svg` / `mail.svg` from `frontend/design/brand-assets/`) replacing Pencil text tokens. Email token rendered as click-to-copy `<button>` with sr-only aria-live feedback. Pencil text retained as layout placeholder. | **BRAND-ASSET** | [K-050](../tickets/K-050-footer-social-links.md) | Pencil node schema (`type: "text"` + `type: "frame"` only) cannot encode image/SVG nodes. Third-party brand logos (GitHub Mark, LinkedIn "in") + Heroicons envelope committed to `frontend/design/brand-assets/` as parallel SSOT per SOURCES.md provenance. Click-to-copy email pattern + aria-live feedback are interactive behaviors Pencil does not model. | 2026-04-24 |
~~~

Update Governance clause: include `BRAND-ASSET` in allowed categories list.

**Commit #5**: `docs(K-050): Pencil SSOT — _design-divergence + BRAND-ASSET exemption [Phase 3]`

### 3-h/i: Tests

Update `frontend/e2e/shared-components.spec.ts`:
- **T2**: replace text assertion with `[data-testid]` visibility + GA disclosure preserved
- **T3**: INVERT — `a[href="mailto:..."]` count=1, same for github/linkedin
- **T4**: change L145 text to aria-label assertion
- **New block AC-050-EMAIL-COPY-BEHAVIOR**: `context.grantPermissions(['clipboard-read'])` + click button → verify clipboard content + text swap + 1.5s revert + aria-live region text

Update `frontend/e2e/ga-tracking.spec.ts`:
- Restore AC-018-CLICK 3 tests (mock `trackCtaClick`, click each selector, assert args) on /about
- Add 1 cross-route sanity: click GitHub on all 4 routes, assert page_location

**Commit #6**: `test(K-050): shared-components T2/T3/T4 + ga-tracking AC-018-CLICK [Phase 3]`

### 3-j: Docs sync

**`agent-context/architecture.md`** — Path Y minimal:

Footer route rows:

~~~markdown
| / | <Footer /> (zero-prop, shared sitewide — see docs/designs/K-050-footer-social-links.md) |
| /about | <Footer /> (zero-prop, shared sitewide) |
| /diary | <Footer /> (zero-prop, shared sitewide) |
| /app | 無 footer (K-030 isolation) |
| /business-logic | <Footer /> (zero-prop, shared sitewide) |
~~~

Shared Components Footer row:

~~~markdown
| `Footer` | components/shared/Footer.tsx | 4 路由 render zero-prop `<Footer />` with 3 brand-asset SVG anchors + click-to-copy email `<button>` + aria-live sr-only. Pencil SSOT = frames `86psQ` + `1BGtd` + `ei7cl` + `2ASmw` (text-placeholder-only per design-exemptions.md §BRAND-ASSET). K-050 2026-04-24 supersedes K-034 Phase 1. /app K-030 isolation preserved. |
~~~

(Do NOT preserve K-034 P1/P3 historical narrative chain — TD-K050-03 tracks cleanup.)

**`docs/tech-debt.md`** — append:

~~~markdown
## TD-K050-01 — `~/.claude/agents/designer.md` Pre-edit exemption check rule

Status: open
Ticket: K-050
Description: 3rd-layer Designer awareness (persona gate) deferred in K-050 because designer.md is user-local (not accessible in cloud sandbox). Rule content drafted in K-050 planning handoff; user to manually apply to local persona file.

## TD-K050-02 — Design System Handbook onboarding doc

Status: open (proposed new ticket)
Description: Project lacks single onboarding-friendly "design system overview" integrating K-021 tokens + VISUAL-SPEC-SCHEMA.md + brand-assets/README.md + design-exemptions.md. Propose K-050+ for entry-level doc.

## TD-K050-03 — architecture.md historical narrative bloat

Status: open (proposed new ticket)
Description: `agent-context/architecture.md` accumulates per-ticket narrative in YAML `updated:` field (200+ word changelog) and tables (500+ word Footer section). Anti-pattern for reference doc. K-050 adopted Path Y minimal but did not clean historical bloat. Propose K-050+ for full cleanup — move narrative to per-ticket retros + new `docs/CHANGELOG.md`.
~~~

**`frontend/public/diary.json`** — prepend:

~~~json
{
  "ticketId": "K-050",
  "title": "Footer social links — clickable icons + click-to-copy email",
  "date": "2026-04-24",
  "text": "Rebuilt the site footer with 3 brand-asset SVG icons (GitHub, LinkedIn, envelope), a click-to-copy email button with 'Copied!' feedback and screen-reader announcement, and restored Google Analytics click tracking for all three contact methods."
}
~~~

**Commit #7**: `chore(K-050): architecture.md + tech-debt + diary.json sync [Phase 3]`

---

## Phase 4 — Validation

~~~bash
cd frontend
npx tsc --noEmit
npx playwright test shared-components.spec.ts --update-snapshots
npx playwright test shared-components.spec.ts ga-tracking.spec.ts   # Pass 1 targeted
npx playwright test                                                  # Pass 2 full
npm test                                                             # Vitest
~~~

Strategy:
- Pass 2 non-K-050 red → 🛑 halt with analysis
- Pass 1 red → fix in place (K-050 bug)
- Pre-existing flaky (AC-020-BEACON-SPA) tolerated per C2
- Manual browser QA: SKIP, report explicitly notes sandbox constraint

Optional extra commit if baselines need separate commit:
`chore(K-050): regenerate footer snapshots after Phase 3 DOM change`

---

## Phase 5 — Reviewer + QA

### 5-a/b: Reviewer sub-agent

Spawn `general-purpose` (or `Explore`) sub-agent with this brief:

~~~
You are acting as Reviewer for K-050. Read:
- docs/tickets/K-050-footer-social-links.md
- docs/designs/K-050-footer-social-links.md
- frontend/src/components/shared/Footer.tsx
- frontend/src/components/icons/{Github,Linkedin,Mail}Icon.tsx
- frontend/design/brand-assets/ (all files)
- frontend/design/specs/homepage-v2.frame-{1BGtd,86psQ,ei7cl,2ASmw}.json
- docs/designs/design-exemptions.md
- frontend/e2e/shared-components.spec.ts + ga-tracking.spec.ts
- agent-context/architecture.md
- docs/tech-debt.md

Sacred to verify:
- K-017 partial (anchors restored; "Let's talk →" NOT)
- K-018 full restore (3 + 1 = 4 tests)
- K-022 NOT restored
- K-030 preserved
- K-034 P1 T1 byte-identical preserved

Checks:
1. Each AC has implementation + test
2. Selector stability (data-testid correct)
3. Sacred leak detection
4. Accessibility (aria-live, aria-label, role="status", sr-only)
5. Pencil SSOT parity
6. No undocumented divergence from §BRAND-ASSET

Report: PASS / ISSUES FOUND with severity + file:line + recommendation. Under 500 words.
~~~

Write `docs/reviews/K-050-review.md` with findings.
If ISSUES → 🛑 halt per D3.

**Commit #8**: `docs(K-050): code review findings [docs-only]`

### 5-c/d: QA sub-agent

Spawn `general-purpose` sub-agent:

~~~
You are QA for K-050. Execute:
1. cd frontend && npx tsc --noEmit
2. npm test (Vitest)
3. npx playwright test --reporter=html

Pass criteria (A2 + C2):
- K-050 touched specs: 100% green
- Other specs: pre-existing flaky tolerated
- 4 footer PNG regenerated, match baseline

Backend pytest: SKIP.

Report: docs/reviews/K-050-qa.md with:
- Vitest results
- Playwright per-spec counts
- New K-050 test IDs
- Pre-existing flaky list
- Visual verification note
- Manual browser QA: NOT PERFORMED per PM
- Release recommendation
~~~

If bug → 🛑 halt per D3.

**Commit #9**: `docs(K-050): QA full regression PASS [docs-only]`

### 5-e: Retrospectives

🛑 **HALT per D1**. Ask PM:

~~~
🛑 HALT — Phase 5-e retrospective authorship

Trigger: Retrospective authorship and Role Sub-Agent Isolation Gate rule were deferred during planning.

Options:
  A. I draft all 5 role retros as main-agent (PM/Arch/Eng/Reviewer/QA)
  B. Spawn per-role sub-agent for each, they write their own retro
  C. You write PM retro, I draft 4 others
  D. I write 5 drafts, PM retro marked "agent-drafted, PM did not edit"
  E. Single consolidated K-050 retro (違反 protocol, need CLAUDE.md update first)
  F. Skip Designer retro (no engagement) + others per A/B/C/D

Also pending: Role Sub-Agent Isolation Gate rule for CLAUDE.md.

Question: which option? And do you want to decide the isolation rule now or defer again?
~~~

After resolved → **Commit #10**: `docs(K-050): 5-role retrospective entries [docs-only]`

---

## Phase 6 — Push + PR

### 6-a/b: Abandon harness branch

~~~bash
git branch -D claude/fix-footer-linkedin-kdY9Q
if git ls-remote --heads origin claude/fix-footer-linkedin-kdY9Q | grep -q .; then
  git push origin --delete claude/fix-footer-linkedin-kdY9Q
fi
~~~

### 6-c: Push K-050 branch

~~~bash
git push -u origin K-050-footer-social-links
~~~

On network fail: retry up to 4 times with exponential backoff (2s / 4s / 8s / 16s).

### 6-d: Open PR via `mcp__github__create_pull_request`

Repository: `mshmwr/k-line-prediction`
Base: `main`
Head: `K-050-footer-social-links`
Title: `K-050: Footer 社群連結 — 可點擊 icon + Email 明文`

Body:

~~~markdown
## Summary
- Footer 改為 3 brand-asset SVG anchors (GitHub Mark / LinkedIn "in" / Heroicons envelope) + click-to-copy email <button> (aria-live feedback, 1.5s "Copied!" 切換)
- Pencil SSOT `_design-divergence` 欄位 + `design-exemptions.md §BRAND-ASSET` 新類別登記 runtime-vs-Pencil 差異
- 恢復 K-018 GA click tracking (contact_email / github_link / linkedin_link) + 跨路由 sanity test
- Retires K-034 Phase 1 plain-text one-liner design

## Test plan
- [ ] `shared-components.spec.ts` T1 byte-identical 跨 4 路由 PASS
- [ ] `shared-components.spec.ts` AC-050-EMAIL-COPY-BEHAVIOR block 全綠
- [ ] `ga-tracking.spec.ts` AC-018-CLICK 3 events + 1 cross-route sanity PASS
- [ ] 4 footer-*.png snapshot baselines 重建並 PASS
- [ ] `npx tsc --noEmit` 0 error
- [ ] Manual QA: deferred (Phase 4 decision — sandbox constraint)
- [ ] Deploy to Firebase Hosting + live URL 驗證 4 路由 footer 行為

Closes K-050.
~~~

### 6-e: Halt for deploy approval

🛑 **HALT**. Message user:

~~~
🛑 HALT — Phase 6-e deploy approval

K-050 ready for Phase 7 deploy. PR opened at <URL>.
Reminder: Phase 7-f onward runs on user's local machine (Firebase auth not in sandbox).

Awaiting explicit PM "deploy approved" to proceed.
~~~

---

## Phase 7 — Deploy + Close

### Sandbox portion (7-a to 7-c)

~~~bash
cd .claude/worktrees/K-050-footer-social-links
git rebase main
# Self-resolve simple conflicts; halt for complex.

cd /home/user/k-line-prediction
git checkout main
git merge --ff-only K-050-footer-social-links
git push origin main
# PR auto-closes when origin/main contains K-050 commits.
~~~

### 7-d onward: HANDOFF TO USER

Message user:

~~~
Sandbox portion done. Please run Phase 7-d onward on local machine:

~~~bash
# 7-d: grep API_BASE
cd frontend
grep -rn "'/api/" src/
grep -rn '"/api/' src/
# Any bare relative path → fix before build

# 7-e: build
npm run build

# 7-f: deploy
cd ..
firebase deploy --only hosting

# 7-g: verify live
# Open https://k-line-prediction-app.web.app and test 4 routes
# Verify: icon hover / click-to-copy / external links open new tab
~~~

After verify: close commit on main.
~~~

### 7-h: Close commit (user writes)

**Commit #11**: `close(K-050): Phase Gate close + Deploy Record [docs-only]`

Body template:

~~~
K-050 Phase Gate close + deploy verified.

Phase AC closure (8/8 PASS):
- AC-050-FOOTER-LAYOUT: 3 icons + email text, 14px monochrome
- AC-050-EMAIL-ICON-CLICKABLE: mailto anchor with aria-label + data-testid
- AC-050-EMAIL-COPY: click-to-copy + 1.5s Copied! + aria-live
- AC-050-BRAND-ICONS-CLICKABLE: GitHub repo + LinkedIn profile external anchors
- AC-050-GA-CLICK: 3 events restored + 1 cross-route sanity
- AC-050-PENCIL-UPDATED: 4 frames _design-divergence + BRAND-ASSET exemption
- AC-050-BYTE-IDENTICAL: T1 pass 4 routes
- AC-050-DEPLOY: Firebase live at <URL>

Deploy verification (4 routes × footer behavior): all PASS.

Sacred status:
- K-017 AC-017-FOOTER: partial restore
- K-018 AC-018-CLICK: fully restored + cross-route sanity
- K-022 A-7: not restored
- K-030 /app no-footer: preserved
- K-034 P1 T1 byte-identical: preserved

Deferred to TD:
- TD-K050-01: designer.md persona supplement
- TD-K050-02: Design System Handbook ticket
- TD-K050-03: architecture.md historical bloat cleanup ticket

Known gaps:
- Manual browser QA: not performed (sandbox, PM decision)
- Screen reader verification: deferred to user-side

Supersedes K-034 Phase 1 plain-text Footer (2026-04-23).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
~~~

~~~bash
git push origin main
~~~

---

## Tooling requirements

- `WebFetch` — pull 3 SVGs (Phase 3-b)
- `Bash` — git / npm / playwright
- `Read` / `Edit` / `Write` — file ops
- `mcp__github__create_pull_request` — Phase 6-d PR
- `AskUserQuestion` — halt points
- `TodoWrite` — phase progress
- `Agent` with `subagent_type=general-purpose` or `Explore` — Phase 5 Reviewer + QA

---

## Halt message format

~~~
🛑 HALT — <phase short ID>

Trigger: <what tripped>
Context: <1–2 lines of what just happened>
Options:
  A. <A with consequences>
  B. <B with consequences>
My recommendation: <A/B/ask more>
Question to PM: <single clear question>
~~~

Do not resume without explicit PM response.

---

## Commit order summary

| # | Phase | Subject |
|---|---|---|
| main-1 | 0 | `docs(claude): Pre-Worktree Sync Gate rule [docs-only]` |
| 1 | 1 | `docs(K-050): open ticket + PRD AC block + YAML frontmatter` |
| 2 | 2 | `design(K-050): architect design doc + file change list + 10-step plan` |
| 3 | 3 | `chore(K-050): vite-plugin-svgr + brand-assets/ infrastructure [Phase 3]` |
| 4 | 3 | `feat(K-050): icon wrappers + Footer click-to-copy + GA click restore [Phase 3]` |
| 5 | 3 | `docs(K-050): Pencil SSOT — _design-divergence + BRAND-ASSET exemption [Phase 3]` |
| 6 | 3 | `test(K-050): shared-components T2/T3/T4 + ga-tracking AC-018-CLICK [Phase 3]` |
| 7 | 3 | `chore(K-050): architecture.md + tech-debt + diary.json sync [Phase 3]` |
| 8 | 5 | `docs(K-050): code review findings [docs-only]` |
| 9 | 5 | `docs(K-050): QA full regression PASS [docs-only]` |
| 10 | 5 | `docs(K-050): 5-role retrospective entries [docs-only]` (after D1 resolved) |
| 11 | 7 (user) | `close(K-050): Phase Gate close + Deploy Record [docs-only]` |

Co-Authored-By: Claude Opus 4.7 trailer on commits 2 / 4 / 11 only.

---

## Planning session key decisions

- Brand icons: monochrome `currentColor`, filled silhouette style
- Email UX: plain-text readable + click-to-copy button (not mailto on text; mailto only on icon)
- Copy feedback: 1.5s text swap + aria-live (no toast, no tooltip)
- SVG source: Simple Icons (github, linkedin) + Heroicons (envelope)
- Pencil approach: option C (exemption, not schema extension)
- Designer awareness: 2 layers (exemption + JSON divergence); 3rd layer (persona gate) deferred
- architecture.md: Path Y minimal (no narrative bloat)
- Test scope: Vitest + Playwright (skip backend pytest)
- Manual QA: skipped per PM, reported explicitly
- PR: create (user asked despite agent default)
- Deploy: sandbox can't run firebase; user handles locally (Phase 7-d onward)
- Harness branch: delete local claude/fix-footer-linkedin-kdY9Q after worktree created

End of handoff.