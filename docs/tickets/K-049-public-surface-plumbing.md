---
id: K-049
title: Public-surface plumbing — SEO meta / security headers / deploy env-var guard / perf polish (10-item batch from interviewer-reviewer 2026-04-24 audit)
status: closed
created: 2026-04-24
closed: 2026-04-25
closed-commit: ebfaa16
closed-merge-datetime: 2026-04-25T06:43:53Z
type: refactor + ops
priority: high
size: large
visual-delta: none
content-delta: yes
design-locked: N/A
qa-early-consultation: docs/retrospectives/qa.md 2026-04-24 K-049
dependencies: []
sacred-regression: [K-037 favicon link tags, K-034-P1 Footer byte-identity, K-030 /app isolation, K-024 diary.json flat schema]
worktree: .claude/worktrees/K-049-public-surface-plumbing
branch: K-049-public-surface-plumbing
base-commit: 1090e63
phase-1-deploy-sha256: pending-record
phase-2a-deploy-sha256: pending-record
phase-2b-deploy-revision: k-line-backend-00005-zn4
phase-2b-deployed-at: 2026-04-25T06:43:53Z
---

## Summary

Consolidated public-surface plumbing pass triggered by 2026-04-24 interviewer-reviewer red team of production (`https://k-line-prediction-app.web.app`). 10 findings across SEO / security / deploy-robustness / perf. Zero visual delta — all changes are in `<head>`, HTTP response headers, static files (`robots.txt` / `sitemap.xml`), `firebase.json` config, and route-splitting.

**Why batched:** every item shares the same production surface (deployed `index.html` + Firebase Hosting config). Splitting into 10 tickets would compound 10× the `npm run build` + `firebase deploy` cycles without isolating any behavior. One PRD + one Architect design + one Engineer pass + one QA regression amortizes overhead.

**User constraints locked earlier this session:**

- **No real name anywhere on public surface.** Handle `mshmwr` OK. See `feedback_no_real_name_in_portfolio.md`.
- `<title>` stays literal `K-Line Prediction` (no "— Frontend Engineer" descriptor, no author suffix).
- `<meta name="author">` = `mshmwr` (handle-only).
- JSON-LD uses `SoftwareApplication` / `WebSite`, NOT `Person` schema.

**Content-Alignment Gate required:** OG description text, og-image caption, JSON-LD description — all user-voice, so PM must run Content-Alignment Gate before releasing Architect (per `feedback_pm_content_alignment_before_engineer.md`).

## Scope (10 items consolidated from review)

All quotes below are preliminary — final AC wording pending PRD pass after Content-Alignment Gate.

1. **robots.txt + sitemap.xml served as real text files, not SPA HTML shell** — create `frontend/public/robots.txt` + `frontend/public/sitemap.xml`; add `firebase.json` rewrite exclusion so these two paths bypass catch-all.
2. **Open Graph / Twitter Card / canonical meta** — add full set to static `index.html` `<head>`; crawlers don't execute JS so must be in initial HTML, not JS-injected.
3. **Security headers (5 adds)** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy` (report-only → enforce 3-step deployment).
4. **Cache-Control for hashed assets** — `/assets/**` → `public, max-age=31536000, immutable`; `index.html` implicit default (no-cache).
5. **Bodoni Moda Google Fonts URL cleanup** — `frontend/index.html` line 10 still imports unused Bodoni font family; remove to save 50-200KB LCP.
6. **Route code splitting (React.lazy + Suspense)** — `frontend/src/main.tsx` statically imports 5 page components; switch to `React.lazy` with Suspense fallback, let Vite manualChunks route-gate vendor chunks.
7. **Deploy env-var guard (root cause of GA+API prod outage)** — `.env.production` gitignored + worktree isolation mandate = each worktree build misses env vars. Fix direction: Firebase `/api/**` → Cloud Run rewrite so `VITE_API_BASE_URL` is no longer required (same-origin); keep `VITE_GA_MEASUREMENT_ID` but add a build-time guard (`npm run build` fails if not set). Detail Phase 2.
8. **`<meta name="author" content="mshmwr" />`** — add handle-only author meta. Title stays `K-Line Prediction` per user lock.
9. **JSON-LD schema (`SoftwareApplication` / `WebSite`, NOT `Person`)** — add structured data in `<head>`; no real-name fields.
10. **`manifest.json` display = `standalone`** — currently `browser`; elevate to PWA-installable UX per user pick.

## Phases (preliminary — Architect owns final structure)

- **Phase 1 — static head-block plumbing** (items 2, 3 non-CSP, 5, 8, 9, 10): purely `index.html` + `manifest.json` edits; zero runtime risk; deploy incrementally.
- **Phase 2 — Firebase config** (items 1, 3-CSP-report-only, 4, 7-rewrite): `firebase.json` edits. CSP lands as `-Report-Only` for a soak window; 7's `/api/**` Cloud Run rewrite removes the env-var coupling.
- **Phase 3 — runtime perf** (item 6 React.lazy): `main.tsx` + any page-specific loading skeletons; requires E2E regression for route transitions + GA pageview fire timing.
- **Phase 4 — CSP enforce** (item 3-CSP): flip `-Report-Only` header key to `Content-Security-Policy` after 1-week soak; separate deploy.

## Out of Scope

- Font weight / font stack changes (item 5 is URL-param cleanup only, not redesign).
- New routes or page content.
- Any backend (`backend/main.py`) changes.
- Real-name exposure anywhere (permanently out of scope per `feedback_no_real_name_in_portfolio.md`).

## Blocking Questions (to be resolved during PRD authoring + Content-Alignment Gate)

- BQ-049-01 (content): OG `description` copy text — **RESOLVED 2026-04-24 Option C**: `Built by a 6-role AI agent team — PM / Architect / Engineer / Designer / Reviewer / QA. ETH/USDT pattern-prediction demo.` Aligns with K-044 README agent-team-primary framing (merged to main `837b037`).
- BQ-049-02 (content): og-image — **RESOLVED 2026-04-24 Option A**: omit og-image, accept text-only preview cards. Portfolio inbound traffic primarily LinkedIn direct-share where text description dominates; revisit after baseline telemetry if click-through proves insufficient.
- BQ-049-03 (scope): CSP Phase 4 enforce — **RESOLVED 2026-04-24 PM self-ruling**: spin off as follow-up K-050 after 1-week soak. K-049 closes when CSP-Report-Only is live + zero-violation evidence from 5-route × 3-browser probe. Enforce flip is separate deploy, separate review cycle.
- BQ-049-04 (scope): Item 7 Cloud Run rewrite — **RESOLVED 2026-04-24 PM self-ruling**: same-origin + remove CORS middleware. `VITE_API_BASE_URL` retires entirely; `backend/main.py` CORSMiddleware block deleted. Deploy-order guard (AC-049-DEPLOY-ORDER-1) sequences rewrite-first / CORS-removal-last.
- BQ-049-05 (sitemap): list routes — **RESOLVED 2026-04-24 PM self-ruling**: include all 5 routes (`/`, `/app`, `/about`, `/diary`, `/business-logic`). `/app` upload-poisoning concern retired after K-046 Phase 2 hardening; portfolio demo value outweighs sitemap inclusion risk.

## Acceptance Criteria

Derived from QA Early Consultation (`docs/retrospectives/qa.md` 2026-04-24 K-049). 10 ACs grouped by Phase for Architect sequencing.

### Phase 1 — static head-block plumbing

**AC-049-PROBE-1** (items 2, 8, 9 — meta / author / JSON-LD):
- **Given** production bundle deployed from `frontend/dist/index.html`
- **When** `curl -s https://k-line-prediction-app.web.app | grep -oE '<meta (property|name)="[^"]+"'` runs
- **Then** output MUST include all 5 lines: `og:title`, `og:description`, `og:url`, `og:type`, `twitter:card`
- **And** `curl -s ... | grep -oE 'name="author" content="[^"]+"'` returns exactly `content="mshmwr"` (handle-only, zero real-name matches)
- **And** `curl -s ... | python3 -c "import sys,json,re; m=re.search(r'<script type=\"application/ld\\+json\">(.+?)</script>', sys.stdin.read(), re.S); json.loads(m.group(1))"` exits 0 AND parsed object has `@type` in `["SoftwareApplication", "WebSite"]` (NOT `Person`)
- **And** full-page grep against user's real name returns zero matches (constraint from `feedback_no_real_name_in_portfolio.md`)

**AC-049-PWA-1** (item 10 — manifest.json standalone):
- **Given** `frontend/public/manifest.json` updated to `"display": "standalone"`
- **When** Lighthouse PWA audit runs against `https://k-line-prediction-app.web.app`
- **Then** PWA category MUST pass (installability + manifest validity)
- **And** manifest MUST include all required fields: `name`, `short_name`, `icons` (192 + 512), `start_url`, `display`, `background_color`, `theme_color`
- **And** Chrome DevTools Application → Manifest tab shows zero error/warning rows

**AC-049-BODONI-1** (item 5 — remove unused font):
- **Given** `frontend/index.html` line 10 previously imported Bodoni Moda from Google Fonts
- **When** `grep -c "Bodoni" frontend/index.html` runs against HEAD
- **Then** result MUST be 0
- **And** Lighthouse LCP on home route MUST NOT regress vs pre-ticket baseline (record baseline before removal, compare after)

### Phase 2 — Firebase config

**AC-049-ROBOTS-1** (item 1 — robots.txt + sitemap.xml):
- **Given** `frontend/public/robots.txt` + `frontend/public/sitemap.xml` exist; `firebase.json` rewrites list these 2 paths BEFORE the SPA catch-all
- **When** `curl -sI https://k-line-prediction-app.web.app/robots.txt` + `curl -sI .../sitemap.xml`
- **Then** `Content-Type` headers MUST be `text/plain; charset=utf-8` (robots) and `application/xml` OR `text/xml` (sitemap)
- **And** `curl -s .../robots.txt | grep -c "<!DOCTYPE html>"` MUST be 0 (not the SPA shell)
- **And** `xmllint --noout sitemap.xml` exits 0 (well-formed XML)

**AC-049-SITEMAP-1** (item 1 — per-URL lastmod):
- **Given** 5 public routes (`/`, `/app`, `/about`, `/diary`, `/business-logic`) each backed by a page component under `frontend/src/pages/`
- **When** prebuild script `scripts/generate-sitemap.mjs` runs (`npm run build` dependency)
- **Then** each `<url>` MUST carry a `<lastmod>` sourced from `git log -1 --format=%cs <page-component-path>`
- **And** sitemap `xmllint --noout` passes
- **And** all 5 route URLs appear with absolute `https://k-line-prediction-app.web.app/...` loc

**AC-049-CSP-REPORT-1** (item 3 — security headers + CSP Report-Only):
- **Given** `firebase.json` headers block adds 4 non-CSP security headers + `Content-Security-Policy-Report-Only`
- **When** `curl -sI https://k-line-prediction-app.web.app/` on each of 5 routes
- **Then** response MUST contain: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy-Report-Only: <policy>`
- **And** browser probe (Chromium + Firefox + WebKit) visiting all 5 routes + triggering GA + `/api/predict` call produces ZERO CSP `securitypolicyviolation` events (captured via `page.on('console')`)
- **And** if no report endpoint is configured, `## Known Gaps` section of ticket documents this explicitly (violations caught only via browser probe, not server-side)

**AC-049-DEPLOY-ORDER-1** (item 7 — Cloud Run rewrite + remove CORS):
- **Given** current prod uses `VITE_API_BASE_URL` + backend `CORSMiddleware(allow_origins=["https://k-line-prediction-app.web.app"])`
- **When** deploy sequence executes (Architect defines exact order)
- **Then** deploy MUST follow 4 steps: (1) deploy `firebase.json` with `/api/**` → Cloud Run rewrite, (2) `curl https://k-line-prediction-app.web.app/api/health` returns 200 JSON without CORS header dependency, (3) wait ≥24h for Firebase edge cache roll, (4) deploy backend with CORSMiddleware removed
- **And** post-step-4 probe: `curl -H "Origin: https://example.com" https://k-line-prediction-app.web.app/api/health` returns 200 (same-origin now, CORS no longer gates)
- **And** `VITE_API_BASE_URL` removed from `.env.production.example` + build-time guard no longer checks for it

**AC-049-DEPLOY-ENVGUARD-1** (item 7 — GA env-var guard):
- **Given** `frontend/scripts/validate-env.mjs` runs as `prebuild` script
- **When** `npm run build` runs with `VITE_GA_MEASUREMENT_ID` unset OR empty OR pattern-mismatch (not `G-[A-Z0-9]{10,}`)
- **Then** build MUST exit non-zero with explicit error: `VITE_GA_MEASUREMENT_ID must match G-[A-Z0-9]{10,}`
- **And** when set to a valid `G-XXXXXXXXXX` ID, build succeeds
- **And** post-deploy: `curl -s https://k-line-prediction-app.web.app/ | grep -oE "G-[A-Z0-9]{10,}"` returns exactly 1 match equal to the prod GA ID

**AC-049-CACHE-1** (item 4 — Cache-Control):
- **Given** `firebase.json` headers block adds `/assets/**` → `Cache-Control: public, max-age=31536000, immutable`
- **When** `curl -sI https://k-line-prediction-app.web.app/assets/index-<hash>.js`
- **Then** response MUST contain `Cache-Control: public, max-age=31536000, immutable`
- **And** `curl -sI https://k-line-prediction-app.web.app/index.html` MUST NOT have immutable (Firebase default `no-cache` retained)
- **And** pre-deploy guard: `test ! -d frontend/public/assets/` (fails build if dev mistakenly added assets to public/ which would shadow `/assets/**` hashed paths)

### Phase 3 — runtime perf

**AC-049-SUSPENSE-1** (item 6 — React.lazy + Suspense):
- **Given** `frontend/src/main.tsx` switched to `React.lazy(() => import('./pages/X'))` for all 5 page components with `<Suspense fallback={<RouteSuspense />}>`
- **When** Playwright E2E runs against all 5 routes
- **Then** all existing assertions MUST pass with `{ timeout: 10000 }` OR `waitForLoadState('networkidle')` (tolerant of chunk-load latency)
- **And** `<RouteSuspense>` component MUST have `data-testid="route-suspense"` for targeted timing probes
- **And** Vite build output shows 5 separate route chunks (not one mono-bundle) — verify via `ls -la frontend/dist/assets/*.js | wc -l` ≥ 6 (5 routes + vendor)

**AC-049-GA-LAZY-1** (item 6 — GA pageview fire timing under lazy routes):
- **Given** existing `frontend/e2e/ga-spa-pageview.spec.ts` (currently blocked by TD-001 shared-server isolation)
- **When** user navigates `/` → `/about` → `/diary` with lazy-loaded chunks
- **Then** GA MUST fire exactly 1 `page_view` per navigation (not 0, not 2; count via dataLayer probe or fetch interception)
- **And** `page_view` event's `page_title` field MUST match a static `PAGE_TITLES` map (defined in `main.tsx` alongside lazy imports; NOT `document.title` which race-loads after Suspense resolves)
- **And** `ga-spa-pageview.spec.ts` baseline (9 currently-failing assertions) MUST be green after Engineer fixes TD-001 isolation as part of this ticket OR explicit TD-001-unblock sub-ticket spawned in Phase 3

### Phase 4 — CSP enforce (split to K-050)

*Per BQ-049-03 resolution, CSP enforce flip is K-050 follow-up; no K-049 AC for Phase 4.*

## Dependencies & Sacred Regression

- **K-037 favicon** — `<link rel="icon">` tags in `<head>` MUST remain byte-identical after head-block rewrite
- **K-034-P1 Footer** — Footer component byte-identity across all 5 routes (Playwright `Footer.getBBox().width` cross-route pairwise diff ≤32px)
- **K-030 /app isolation** — lazy-loading `/app` page MUST NOT leak state to non-/app routes; upload state persistence unchanged
- **K-024 diary.json flat schema** — diary.json fetch path unchanged after rewrite rules (no `/api/**` rewrite false-match)
- **K-046 Phase 2 CORS hardening** — CORS middleware removal (AC-049-DEPLOY-ORDER-1 step 4) MUST happen AFTER `/api/**` rewrite is edge-cached ≥24h

---

## Deploy Record

| Phase | Target | Commit | Deployed | Probe verdict |
|-------|--------|--------|---------:|---------------|
| Phase 1 | Firebase Hosting (head-block plumbing) | `6e57b44` (PR #1) | 2026-04-24 | PROBE-1A/B/C ✓ · PWA-1A/B ✓ · BODONI-1 ✓ |
| Phase 2a | Firebase Hosting (config + Cloud Run rewrite) | `6e57b44` (same PR) | 2026-04-24 | ROBOTS-1A-E ✓ · SITEMAP-1 ✓ · CSP-REPORT-1A/B ✓ · CACHE-1A/B ✓ |
| Phase 2b | Cloud Run (CORSMiddleware removal) | `ebfaa16` (PR #5 final) | 2026-04-25 06:43:53Z | DEPLOY-ORDER-1A-alt/B/C ✓ · ENVGUARD-1E ✓ (chunk-located, see TD note) |
| Phase 3 | in-tree (SUSPENSE / GA-LAZY) | `6e57b44` | n/a | covered by Playwright (269 chromium specs green per qa.md) |

**Cloud Run revision:** `k-line-backend-00005-zn4` serving 100% traffic in `asia-east1`.

**Phase 2b fix-forward chain (4 follow-up PRs after PR #1 deploy hit Cloud Build):**

| PR | Slug | Fix | Reason |
|----|------|-----|--------|
| #2 | `K-049-fix-validate-env-loader` | `validate-env.mjs` loads `.env*` files via dotenv | Vite auto-loads `.env.<mode>` but Node prebuild scripts don't — `process.env.VITE_GA_MEASUREMENT_ID` was empty |
| #3 | `ops-npm-lockfile-v3-upgrade` | `package-lock.json` upgraded to lockfileVersion 3 | Cloud Build npm 10 rejects v1 lockfiles |
| #4 | `K-049-fix-gcloudignore` | new `.gcloudignore` with `!.env.production` exception | gcloud auto-derives ignore from `.gitignore` which strips `.env.*` — `validate-env.mjs` couldn't read GA ID |
| #5 | `K-049-fix-sitemap-git-fallback` | `generate-sitemap.mjs` falls back to today's UTC date when git missing | `node:20-alpine` ships without git AND `.gcloudignore` strips `.git/` for upload-size — sitemap prebuild crashed |

Each fix exposed the next blocker. Local `docker build` dry-run after PR #4 caught the sitemap layer before merge — pattern codified in retrospective.

## Retrospective

**What went well:**
- 10-item batch held together — 1 PRD + 1 Architect + 1 Engineer + 1 QA + 1 Reviewer instead of 10× cycles. Phase split (1 head-block / 2a config-only / 2b runtime CORS) enabled atomic same-origin migration without 24h CSP soak interlock.
- Phase 2b deploy used Firebase rewrite + CORSMiddleware removal in one revision — cross-origin `Origin: https://example.com` probe to direct `run.app` returns no `Access-Control-Allow-Origin`, confirming CORS path is gone, while same-origin `/api/history-info` via Firebase rewrite returns 200 JSON.
- Local `docker build` dry-run before PR #5 merge caught the alpine-no-git failure layer one step before production. New methodology candidate for any deploy-affecting PR.
- 8 deploy-smoke probes ran in parallel batches against deployed surface; all functional ACs green.

**What went wrong:**
- 5-PR fix-forward chain (PR #1 → #2 → #3 → #4 → #5) cost ~2 hours of Cloud Build cycles. Each fix exposed the next blocker rather than batched as one PR:
  1. `validate-env.mjs` ran at build-time but didn't load `.env*` files — Node prebuild assumption gap (Vite auto-loads, Node doesn't).
  2. `package-lock.json` was lockfileVersion 1 — Cloud Build npm 10 fails immediately.
  3. gcloud auto-derives `.gcloudignore` from `.gitignore` — `.env.*` stripped without warning.
  4. `node:20-alpine` ships without git AND `.git/` was stripped for upload size — sitemap prebuild crashed in container.
- Two of these (#3 `.gcloudignore` and #5 alpine missing git) could only be caught by local `docker build` simulating the Cloud Build path. Established the dry-run methodology mid-deploy, not before.
- Cookbook `AC-049-DEPLOY-ENVGUARD-1` Command E (`curl /index.html | grep G-`) is wrong — Vite emits the GA ID into a lazy chunk (`page-homepage-*.js`), not the static HTML head. Probe author wrote the spec from intuition rather than verifying against actual build output. Functionally the GA ID is shipped, so the AC passes; the probe spec needs an in-tree fix (TD candidate).

**Next time improvement:**
- **Local `docker build` dry-run before merging any deploy-affecting PR** — propose adding to `CLAUDE.md` Deploy Checklist as step 0. Cost: 5-10 min local build vs. 10-15 min Cloud Build round-trip per fail-forward. ~99% of Cloud Build failures (missing tools / files stripped by `.gcloudignore` / lockfile version) reproduce locally. Script: see TD-K049-01 for `npm run dryrun:cloud-build`.
- **Cookbook ENVGUARD-1E fix** — change probe from HTML grep to chunk grep loop. TD-K049-02 candidate (or fold into K-050 if soak window allows).
- **Codify "alpine has no git" gotcha** — any prebuild script using `git`/`bash`/`make` must declare a `--missing-fallback` or document base-image dependency in `package.json`. Memory candidate: `feedback_cloud_build_alpine_minimal.md`.

**Tech debt opened:**
- TD-K049-01 (low) — automate deploy-smoke probes (currently 8 manual curl batches, source of probe-spec drift like ENVGUARD-1E).
- TD-K049-02 (low) — fix ENVGUARD-1E cookbook spec (HTML grep → chunk grep).

---

**Next action (PM):** Phase B docs PR (this ticket close + retrospectives + outer Diary mirror) → user merge → cleanup worktree.
