---
id: K-050
title: Footer 社群連結 — 可點擊 icon + Email 明文
status: closed
type: feat
priority: medium
created: 2026-04-25
closed: 2026-04-25
closed-commit: c9e9e40
closed-merge-datetime: 2026-04-25T15:02:55+08:00
supersedes: K-034
visual-delta: yes
design-locked: false
qa-early-consultation: N/A — layout/behavior swap, no new edge-case AC class (8 ACs scoped to concrete DOM/event assertions; QA consulted via Phase 5 sub-agent per handoff Phase 5-c)
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

(Deferred — see D1 in planning handoff; decision point at Phase 5-e.)
