---
ticket: K-037
role: engineer
status: engineer-released
handoff-from: pm
handoff-date: 2026-04-23
upstream-brief: docs/architecture/K-037-architect-brief.md
upstream-ticket: docs/tickets/K-037-favicon-wiring.md
branch: K-036-favicon (squashed with K-036 — same branch, no new worktree)
---

# K-037 Engineer Release Brief — Favicon Wiring

Concise Engineer-facing release. Implement against the 5 binding contracts in §3 and the frozen File Change Scope in §2. Any ambiguity or scope drift → return to PM as BQ before editing.

## §1 Ticket Summary + AC IDs

**Ticket:** [docs/tickets/K-037-favicon-wiring.md](../tickets/K-037-favicon-wiring.md)

**What:** K-036 rasterized `frontend/design/favicon.pen` into 7 web-standard PNG/ICO files under `frontend/public/`. K-037 wires those files into `index.html` via 6 `<link>` tags + adds `<meta name="theme-color">`, creates a minimal W3C Web App Manifest (`frontend/public/manifest.json`), and adds a Playwright regression spec asserting all 8 asset paths return HTTP 200 from a `vite preview` built bundle.

**AC IDs (5 total, all Given/When/Then/And format — see ticket for verbatim clauses):**

| AC ID | Subject | Asserts |
|-------|---------|---------|
| AC-037-LINK-TAGS-PRESENT | `<head>` HTML content | 6 independent `<link>` tag assertions — exact `href` + `rel` match per tag |
| AC-037-ASSETS-200-OK | Asset HTTP availability | 8 independent `page.request.get(path)` test cases — one per asset; status === 200 + body length > 0 |
| AC-037-MANIFEST-VALID | `manifest.json` schema | JSON parse success + `name` string + `icons[]` array with 192×192 + 512×512 entries matching K-036 filenames |
| AC-037-MANIFEST-MIME-ACCEPTABLE | `Content-Type` header | Accepts `application/manifest+json` OR `application/json` OR `application/json; charset=utf-8` |
| AC-037-TAB-ICON-VISIBLE | Browser tab visual (manual) | Chrome / Firefox / Safari macOS tab displays K-036 favicon artwork; PM side-by-side vs `frontend/design/favicon.pen` `get_screenshot` at close time. Mobile Safari iOS / Android Chrome = Known Gap (not AC) |

**Parallel Given quantification (binding):**
- AC-037-ASSETS-200-OK = **N=8 independent Playwright test cases** (one per asset path: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `manifest.json`). **Cannot be merged into a loop-based single case** — a broken single asset must name itself in the failure report.
- AC-037-LINK-TAGS-PRESENT = **6 independent `<link>` tag assertions** (one per tag per the fixed order in §3 Q1). Use `page.locator('link[rel="icon"][href="/favicon.ico"]')` exact-match patterns per tag, not a count-based assertion.

## §2 Frozen File Change Scope

Frozen by PM. Do **not** expand without raising a BQ.

| # | File | Operation | LOC budget | Notes |
|---|------|-----------|-----------|-------|
| 1 | `frontend/index.html` | Edit — inject `<meta name="theme-color">` + 6 `<link>` tags into existing `<head>` | ~+7 lines HTML | Insertion points per §3 Q1/Q5 — `meta theme-color` goes between existing `<meta name="viewport">` and the first Google Font `<link rel="preconnect">`; the 6 favicon `<link>` tags go **after** the Google Font `<link>` block and **before** `</head>` in the fixed order in §3 Q1 |
| 2 | `frontend/public/manifest.json` | New file | ~15 lines JSON | Exact schema in §3 Q3 — `name`, `short_name`, `icons[]` (2 entries), `theme_color`, `background_color`, `display`, `start_url` |
| 3 | `frontend/e2e/favicon-assets.spec.ts` | New file | ~60 lines TS | Architect-named filename. Playwright spec with `vite preview` webServer, 8 independent status-200 test cases, 6 independent `<link>` tag test cases, manifest schema test case, MIME-type test case |
| 4 | `frontend/public/diary.json` | Append — 1 new entry under existing K-036 favicon milestone | +1 JSON item | English text summarizing "favicon wiring + manifest + E2E regression"; see §6 |

**Total:** ~110 LOC across 4 files. Zero backend changes. Zero React component changes. Zero route changes. Zero shared-component propagation. Zero `firebase.json` changes (per §3 Q4). Single-file diffs only.

## §3 Architect-Ruled Technical Contracts (BINDING — verbatim from brief §Architect Ruling)

These 5 answers are **binding contracts**. Engineer implements exactly as specified. Deviating requires BQ to PM before editing.

### Q1 — Link tag order in `<head>` (BINDING)

Place the favicon block **after** Google Font `<link>` tags and **before** `</head>`, in this **fixed 6-tag order** (verbatim):

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
```

- **Attribute order within each tag:** `rel → type → sizes → href` (MDN recommendation; matches the schema above).
- **Rationale (binding for Playwright assertion):** browsers walk the `rel="icon"` list front-to-back picking the first acceptable size; ascending sizes means <48px tabs match the 16/32/48 line exactly instead of downscaling the ICO. `apple-touch-icon` and `manifest` are single-consumer and order-independent among each other but must be **after** the generic icon block so non-Apple browsers skip them cleanly.
- **AC coupling:** AC-037-LINK-TAGS-PRESENT asserts exact `href` per tag; no room to reorder silently.

### Q2 — No SVG favicon placeholder (BINDING)

**Omit** — do **NOT** add `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. Do **NOT** add a `TODO` HTML comment either.

- **Rationale:** K-036 produced no SVG. An orphan tag pointing to a non-existent `/favicon.svg` would 404 on every page load (browsers probe icons proactively) and pollute Network tab noise. `TODO` comments in HTML are invisible once parsed and belong in a Tech Debt entry, not in shipped HTML.

### Q3 — `manifest.json` `display` value (BINDING)

`"display": "browser"` — verbatim.

**Full frozen schema:**

```json
{
  "name": "K-Line Prediction",
  "short_name": "K-Line",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#F4EFE5",
  "background_color": "#F4EFE5",
  "display": "browser",
  "start_url": "/"
}
```

- **Rationale:** `"standalone"` / `"minimal-ui"` / `"fullscreen"` all trigger the mobile-browser "Install this app" banner / Add-to-Home-Screen affordance, which expands K-037's AC surface to include PWA install experience, offline shell / service worker expectations, and `start_url` routing semantics once installed. None of that is in scope. `"browser"` declares "this is a website, not an installable app" — minimum-risk choice that still satisfies Android Chrome's icon-pickup path (192/512 PNGs).
- **Overriding requires PM AC re-scope** per ticket §Override Rationale discipline.

### Q4 — No Firebase Hosting MIME header override (BINDING)

**Do NOT add** a `firebase.json` `headers` rule in K-037. Ship with Firebase/Vite default (`application/json` or `application/json; charset=utf-8`).

- **Rationale:** AC-037-MANIFEST-MIME-ACCEPTABLE already accepts both `application/manifest+json` and `application/json`. Adding a `firebase.json` `headers` rule (a) touches a file **outside** the frozen File Change Scope in §2, (b) creates a second source-of-truth for MIME besides Vite's default, (c) introduces Firebase-specific config that must be maintained if host ever changes.
- **Implementation note requirement:** Engineer must record "accepted default MIME, no `firebase.json` change" as an implementation note in the commit message — per AC-037-MANIFEST-MIME-ACCEPTABLE's explicit-acceptance clause.
- **Future trigger:** if a real W3C-strict Safari build (or future Chromium policy) rejects `application/json` for manifest, file a **new** ticket to add the Firebase `headers` block — do **not** retroactively tighten K-037.

### Q5 — Add `<meta name="theme-color">` in `index.html` (BINDING)

**Add** `<meta name="theme-color" content="#F4EFE5" />` in `<head>`, placed **between** `<meta name="viewport" ...>` and the first Google Font `<link rel="preconnect" ...>`.

- **Color value:** `#F4EFE5` — the project's paper token (see `agent-context/architecture.md` §Design System / Tokens + K-021 Changelog). **Must match `manifest.json`'s `theme_color` byte-for-byte.**
- **Rationale:** `<meta name="theme-color">` is honored by Android Chrome / Samsung Internet / iOS Safari 15+ to tint the browser chrome **before** the manifest is parsed; manifest's `theme_color` only kicks in once the manifest request resolves. Both paths exist on purpose (defensive).
- **Do NOT introduce a `media="(prefers-color-scheme: dark)"` variant** — the site has no dark theme (K-021 closed the dark-mode question; `/app` isolation is background-level, not theme-color-level).

## §4 Override Note — K-034 Q3 Block Lifted / K-036 Pencil is Visual SSOT

**K-034 Q3 ordering rule block (K-036 and later blocked until K-034 closes)** was **lifted** by user on 2026-04-23 (see ticket §Override Rationale for 4-point rationale). K-037 is grandfathered as K-036's wiring sibling. K-034 Q1/Q5/Q6 new workflow (JSON spec export, `visual-delta` gates, design-locked hard gate) applies **only to K-034 Phase 1+ truly-new UI tickets** — NOT to K-036/K-037.

**Visual SSOT for AC-037-TAB-ICON-VISIBLE:**
- **Canonical design source:** `frontend/design/favicon.pen` (K-036, committed `891fcfb` on this branch).
- **Rasterized outputs:** already shipped by K-036 (commit `ea973c9`) — 7 PNG/ICO files under `frontend/public/`.
- **No Designer JSON snapshot / PNG export required for K-037** — the K-036 favicon is non-page iconographic artwork, explicitly exempted from the `feedback_designer_json_sync_hard_gate` rule (ticket §Release Readiness checkbox + §Design artifacts document this exemption).
- **Close-time acceptance:** PM + user will perform side-by-side review of dev-server tab icon vs `mcp__pencil__get_screenshot` of `frontend/design/favicon.pen` at close time. Engineer's visual responsibility ends at "tab icon renders in Chrome + Firefox + Safari macOS dev server."

## §5 Test Gate

### Playwright spec (Architect-named)

**File:** `frontend/e2e/favicon-assets.spec.ts` (new; ~60 LOC budget).

**Spec structure (binding shape):**

1. **`webServer` config:** spec must run against `vite preview` of a built bundle, **not** `vite dev`. Either add a per-spec `test.use({ baseURL: ... })` + `playwright.config.ts` `webServer.command` runs `npm run build && vite preview --port 4173`, or use existing config pattern if `playwright.config.ts` already handles build + preview. Verify dev-vs-build distinction per QA Challenge #4 (see §7 Known Gotchas).
2. **AC-037-ASSETS-200-OK — 8 independent test cases** (one per asset path). Each test:
   - `const response = await page.request.get(path);`
   - `expect(response.status()).toBe(200);`
   - `expect((await response.body()).length).toBeGreaterThan(0);`
   - Test title must name the asset: e.g. `'favicon.ico returns 200 with non-empty body'`.
3. **AC-037-LINK-TAGS-PRESENT — 6 independent test cases** (one per tag). Each test:
   - Navigate to `/`.
   - `const tag = page.locator('link[rel="icon"][href="/favicon.ico"]');` (use exact attribute selectors matching the §3 Q1 table).
   - `await expect(tag).toHaveCount(1);`
4. **AC-037-MANIFEST-VALID — 1 test case:** fetch `/manifest.json`, parse JSON, assert `name` is string, `icons[]` has ≥2 items with the exact 192/512 `src` + `sizes` from §3 Q3 schema.
5. **AC-037-MANIFEST-MIME-ACCEPTABLE — 1 test case:** fetch `/manifest.json`, inspect `response.headers()['content-type']`, assert value is in the accept-list `['application/manifest+json', 'application/json', 'application/json; charset=utf-8']`.

**Total test cases: 8 + 6 + 1 + 1 = 16.** AC-037-TAB-ICON-VISIBLE is **not** in the Playwright spec (manual visual + PM Pencil side-by-side).

### Commit gate (per `~/.claude/CLAUDE.md §Commit Test Gate by File Class`)

File classes touched by K-037:
- `frontend/public/**` (manifest.json, diary.json append) → Playwright subset minimum
- `frontend/index.html` → falls under vite config group (listed in the table as "Full")
- `frontend/e2e/**` (new spec) → Full
- **Strictest gate wins:** **Full gate**.

**Required before commit:**
1. `npx tsc --noEmit` — exit 0 (run from `frontend/`). Index.html + JSON edits don't surface TSC errors, but the new `.spec.ts` must type-check.
2. `npm run build` — exit 0 (confirms Vite copies `public/*` into `dist/` correctly; required for Playwright `vite preview` webServer).
3. Playwright E2E — minimum `favicon-assets.spec.ts` all 16 test cases green. Run full suite if time permits to catch any regression from `index.html` `<head>` changes on existing page specs.
4. Vitest — run if any `src/` code gets accidentally touched; otherwise N/A (no `src/` changes in scope).

### Verification checklist (mandatory before declaring Phase done)

Per QA Challenge #4 (dev-vs-build discrepancy):
- [ ] Stop dev server (kill any running `vite dev`).
- [ ] Run `npm run build` (from `frontend/`).
- [ ] Run `vite preview --port 4173` (or let Playwright webServer handle it).
- [ ] Run `favicon-assets.spec.ts` against the preview — NOT dev.
- [ ] Manually open `http://localhost:4173/` in Chrome + Firefox + Safari macOS; confirm tab icon visible in all three.

## §6 Diary Sync Reminder

Per `CLAUDE.md §Diary Sync Rule` — **mandatory before commit:**

Append one English item to the existing K-036 favicon milestone in `frontend/public/diary.json`. Suggested text skeleton (Engineer finalizes):

```json
{
  "date": "2026-04-23",
  "text": "Wired 7 favicon/ICO assets into index.html with 6 link tags + meta theme-color, added minimal W3C Web App Manifest, and added Playwright regression spec asserting 200-status + body length + link tag presence + manifest schema across 16 test cases on vite preview."
}
```

After diary.json append:
- Run `/playwright` to confirm DiaryPage E2E still passes (per `Diary Sync Rule` step 2).

## §7 Known Gotchas (from ticket QA Early Consultation)

These are QA Challenge items worth re-reading before writing the spec:

1. **Vite preview vs dev server (QA Challenge #1 + #4):** the authoritative asset host for AC-037-ASSETS-200-OK is `vite preview` serving the built `dist/` bundle — **not** `vite dev`. Dev server auto-serves `public/` with different resolution semantics that can hide production-specific failures (MIME misconfigurations, rewrite rules, build-step copy omissions). If the Playwright webServer command runs `vite dev`, the spec passes in dev but silently fails on Firebase prod. Configure webServer to run build + preview.
2. **MIME type accept-list (QA Challenge #2):** Vite default for `.json` is `application/json` (or `application/json; charset=utf-8`), **not** the W3C-canonical `application/manifest+json`. AC-037-MANIFEST-MIME-ACCEPTABLE accepts all three. Do NOT hard-code `'application/manifest+json'` as the only acceptable value — spec must assert against the 3-item accept-list.
3. **Safari mobile / Android Chrome real-device = Known Gap (QA Challenge #3):** iOS Safari ignores `<link rel="icon">` entirely and uses only `<link rel="apple-touch-icon">`. If `apple-touch-icon.png` has a typo or 404s on Firebase prod, iOS users silently get a generic screenshot thumbnail on Add-to-Home-Screen. Engineer responsibility ends at link tag correctness + 200 status; real-device verification is NOT in scope.
4. **Vite HMR cache in `public/` (QA Challenge #4):** if dev server was running before adding `manifest.json`, HMR metadata may cache an earlier `public/` state and the dev manual check may not even request the new manifest. Always stop dev server + build + preview for verification — do not rely on a long-running dev server session.
5. **Content Security Policy future-proofing (QA Challenge #5) = declared Known Gap:** no CSP currently exists in `index.html` or Firebase config (verified 2026-04-23). If/when a future CSP ticket lands, `img-src 'self'` + `manifest-src 'self'` directives must be included. Not K-037's concern — flagged for the future CSP ticket Architect.

## §Handoff Status

- **Prepared:** 2026-04-23 by PM (capability disclosed in upstream brief — Agent tool unavailable this session; main-session PM prepared both Architect brief + this Engineer brief)
- **Upstream:** `docs/architecture/K-037-architect-brief.md` §Architect Ruling (5 Qs resolved, no design doc needed)
- **Ticket:** `docs/tickets/K-037-favicon-wiring.md` §Release Log — "Architect ruled no design doc; Engineer released 2026-04-23"
- **Next gate:** Engineer delivers 4-file change → Code Reviewer (two-layer: superpowers breadth → Agent(reviewer) depth) → QA → PM close with PM+user Pencil `get_screenshot` side-by-side review
- **Engineer scope discipline:** anything outside the frozen File Change Scope in §2 (e.g., editing `firebase.json`, adding `components/`, modifying existing `.spec.ts` files, touching `agent-context/`, changing the 5 Q contracts in §3) requires BQ to PM **before** editing
