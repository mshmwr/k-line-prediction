# K-049 Deploy-Smoke Cookbook

**Purpose:** post-deploy curl-probe checklist for the 8 deploy-time ACs in K-049 (PROBE / PWA / BODONI / ROBOTS / SITEMAP / CSP-REPORT / DEPLOY-ORDER / DEPLOY-ENVGUARD / CACHE) plus the two in-tree ACs (SUSPENSE / GA-LAZY) that are already covered by the in-tree Playwright run.

**Production URL:** `https://k-line-prediction-app.web.app`

**Usage:** after `firebase deploy --only hosting` completes for each Phase, run the Phase's probe block. All probes must return "Pass: y" before moving to next Phase. Any "Pass: n" → halt deploy, file bug back to PM with captured output.

**Auth-to-run:** user runs these probes manually on deploy day — QA does not auto-execute production HTTP against live URL from a ticket-scoped session. These are deterministic curl commands: pass/fail booleans derivable from exit code + string match.

---

## Phase 1 Probes (after Phase 1 deploy — head-block plumbing landed)

### AC-049-PROBE-1 — OG / meta / author / JSON-LD

**Command A (meta tags):**
```
curl -s https://k-line-prediction-app.web.app | grep -oE '<meta (property|name)="(og:title|og:description|og:url|og:type|twitter:card)"'
```
**Expected:** 5 distinct lines (one per: og:title / og:description / og:url / og:type / twitter:card).
**Pass condition:** exit 0 AND `wc -l` of output == 5.

**Command B (author handle-only):**
```
curl -s https://k-line-prediction-app.web.app | grep -oE 'name="author" content="[^"]+"'
```
**Expected:** `name="author" content="mshmwr"` (handle-only, no real name).
**Pass condition:** exit 0 AND output contains `content="mshmwr"` AND NOT containing user's real name.

**Command C (JSON-LD parses, @type is SoftwareApplication or WebSite):**
```
curl -s https://k-line-prediction-app.web.app | python3 -c "import sys,json,re; m=re.search(r'<script type=\"application/ld\\+json\">(.+?)</script>', sys.stdin.read(), re.S); obj=json.loads(m.group(1)); graph=obj.get('@graph',[obj]); types={t for n in graph for t in ([n.get('@type')] if isinstance(n.get('@type'),str) else n.get('@type') or [])}; print('types:', types); assert 'Person' not in types, 'Person schema leaked'; assert any(t in types for t in ['SoftwareApplication','WebSite']), 'neither SoftwareApplication nor WebSite found'; print('OK')"
```
**Pass condition:** exit 0 AND stdout ends with `OK`.

**Command D (real-name grep — must be empty):**
```
curl -s https://k-line-prediction-app.web.app | grep -c -i '<USER_REAL_NAME>' || echo 0
```
Replace `<USER_REAL_NAME>` locally at runtime — not committed to repo per `feedback_no_real_name_in_portfolio.md`.
**Pass condition:** output `0`.

---

### AC-049-PWA-1 — manifest.json standalone + Lighthouse PWA

**Command A (manifest served as JSON):**
```
curl -sI https://k-line-prediction-app.web.app/manifest.json | grep -i '^content-type'
```
**Expected:** `Content-Type: application/manifest+json` (defensive MIME per architect §7.2) OR `application/json` (Firebase default).
**Pass condition:** exit 0 AND contains `application/manifest+json` OR `application/json`.

**Command B (display = standalone):**
```
curl -s https://k-line-prediction-app.web.app/manifest.json | python3 -c "import sys,json; m=json.load(sys.stdin); print('display:', m['display']); assert m['display']=='standalone'; assert 'icons' in m; assert len(m['icons'])>=2; print('OK')"
```
**Pass condition:** exit 0 AND stdout ends with `OK`.

**Command C (Lighthouse PWA audit — manual):**
```
# Run in Chrome DevTools → Lighthouse → PWA category
# OR via CLI: npx lighthouse https://k-line-prediction-app.web.app --only-categories=pwa --quiet
```
**Pass condition:** PWA category score 0 warnings/errors on manifest + installability rows.

---

### AC-049-BODONI-1 — Bodoni Moda URL cleanup

**Command:**
```
curl -s https://k-line-prediction-app.web.app | grep -c 'Bodoni'
```
**Expected:** `0`.
**Pass condition:** exit 0 AND output `0`.

---

## Phase 2a Probes (after Phase 2a deploy — Firebase config landed, CORS still present)

### AC-049-ROBOTS-1 — robots.txt + sitemap.xml as real files

**Command A (robots.txt Content-Type):**
```
curl -sI https://k-line-prediction-app.web.app/robots.txt | grep -i '^content-type'
```
**Expected:** `Content-Type: text/plain` (charset variant OK).
**Pass condition:** exit 0 AND contains `text/plain`.

**Command B (robots.txt body is NOT SPA HTML shell):**
```
curl -s https://k-line-prediction-app.web.app/robots.txt | grep -c '<!DOCTYPE html>'
```
**Expected:** `0`.
**Pass condition:** exit 0 AND output `0`.

**Command C (robots.txt body has User-agent directive):**
```
curl -s https://k-line-prediction-app.web.app/robots.txt | head -1
```
**Expected:** `User-agent: *` or equivalent directive line.
**Pass condition:** output contains `User-agent:`.

**Command D (sitemap.xml Content-Type):**
```
curl -sI https://k-line-prediction-app.web.app/sitemap.xml | grep -i '^content-type'
```
**Expected:** `Content-Type: application/xml` OR `text/xml`.
**Pass condition:** exit 0 AND contains `application/xml` OR `text/xml`.

**Command E (sitemap.xml well-formed):**
```
curl -s https://k-line-prediction-app.web.app/sitemap.xml | xmllint --noout -
```
**Pass condition:** exit 0.

---

### AC-049-SITEMAP-1 — per-URL lastmod + 5 routes

**Command:**
```
curl -s https://k-line-prediction-app.web.app/sitemap.xml | python3 -c "
import sys,re
body=sys.stdin.read()
urls=re.findall(r'<loc>([^<]+)</loc>',body)
lastmods=re.findall(r'<lastmod>([^<]+)</lastmod>',body)
expected={'https://k-line-prediction-app.web.app/','https://k-line-prediction-app.web.app/app','https://k-line-prediction-app.web.app/about','https://k-line-prediction-app.web.app/diary','https://k-line-prediction-app.web.app/business-logic'}
assert set(urls)==expected, f'urls mismatch: {set(urls)^expected}'
assert len(lastmods)==5, f'lastmod count {len(lastmods)}, expected 5'
for lm in lastmods:
    assert re.match(r'^\d{4}-\d{2}-\d{2}$',lm), f'lastmod malformed: {lm}'
print('OK 5 urls + 5 lastmod entries all YYYY-MM-DD')
"
```
**Pass condition:** exit 0 AND stdout ends with `OK ...`.

---

### AC-049-CSP-REPORT-1 — 4 security headers + CSP-Report-Only

**Command A (5 response headers present on `/`):**
```
curl -sI https://k-line-prediction-app.web.app/ | grep -iE '^(x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy-report-only)'
```
**Expected:** 5 header lines:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy-Report-Only: <full policy string>
```
**Pass condition:** exit 0 AND `wc -l` of output == 5 AND contains literal `nosniff`, `DENY`, `strict-origin-when-cross-origin`, `camera=()`, `Report-Only`.

**Command B (same headers on all 5 routes):**
```
for r in / /app /about /diary /business-logic; do
  echo "=== $r ==="
  curl -sI "https://k-line-prediction-app.web.app${r}" | grep -ciE '^(x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy-report-only)'
done
```
**Expected:** each route reports `5`.
**Pass condition:** every `=== $r ===` line followed by `5`.

**Command C (browser probe — 3-browser × 5-route CSP violations):**
Manual browser DevTools session — load each of `/` `/app` `/about` `/diary` `/business-logic` in Chromium + Firefox + WebKit, trigger normal app use (GA pageview + /api/predict if applicable), capture `securitypolicyviolation` events via DevTools Console.
**Pass condition:** 0 violations across 3 browsers × 5 routes = 15 sessions.

**Known Gap:** no CSP report endpoint configured in this ticket (per `BQ-049-03` PM ruling, enforce flip + report endpoint is K-050 follow-up). Current probe relies on browser DevTools observation only; this limitation is documented.

---

### AC-049-CACHE-1 — Cache-Control on hashed assets vs index.html

**Command A (hashed asset has immutable):**
```
# Find a hashed JS asset from a current index.html response
ASSET=$(curl -s https://k-line-prediction-app.web.app | grep -oE '/assets/[a-z0-9-]+-[A-Za-z0-9]+\.js' | head -1)
curl -sI "https://k-line-prediction-app.web.app${ASSET}" | grep -i '^cache-control'
```
**Expected:** `Cache-Control: public, max-age=31536000, immutable`.
**Pass condition:** exit 0 AND output contains `immutable` AND `max-age=31536000`.

**Command B (index.html does NOT have immutable):**
```
curl -sI https://k-line-prediction-app.web.app/ | grep -i '^cache-control'
```
**Expected:** any directive except `immutable` (Firebase default `no-cache` or similar).
**Pass condition:** exit 0 AND output does NOT contain the literal `immutable`.

---

## Phase 2b Probes (after Phase 2b backend deploy — CORSMiddleware removed)

### AC-049-DEPLOY-ORDER-1 — Cloud Run rewrite + CORS gone

**Command A (step 1-2: same-origin API call succeeds):**
```
curl -s https://k-line-prediction-app.web.app/api/health 2>&1 | head -10
# Assuming /api/health exists or any /api/* GET endpoint
```
**Expected:** 200 JSON response body OR the endpoint's normal shape.
**Pass condition:** exit 0 AND HTTP status 200 AND body is JSON (not Firebase 404 HTML).

**Command A-alt (if /api/health doesn't exist, probe /api/history-info):**
```
curl -sI https://k-line-prediction-app.web.app/api/history-info
```
**Pass condition:** status 200 (or 405 if GET not allowed — proves rewrite routed, didn't fall to SPA catch-all).

**Command B (step 4: CORS no longer required):**
```
curl -sH "Origin: https://example.com" -I https://k-line-prediction-app.web.app/api/history-info
```
**Expected:** 200/405 with NO `Access-Control-Allow-Origin` header (same-origin, CORS not needed).
**Pass condition:** exit 0 AND status ∈ {200, 405} AND output does NOT contain `Access-Control-Allow-Origin: https://example.com`.

**Command C (VITE_API_BASE_URL retired — no absolute Cloud Run URL in bundle):**
```
curl -s https://k-line-prediction-app.web.app | grep -c 'run\.app'
# Inspect one JS chunk too
ASSET=$(curl -s https://k-line-prediction-app.web.app | grep -oE '/assets/page-apppage-[A-Za-z0-9]+\.js' | head -1)
curl -s "https://k-line-prediction-app.web.app${ASSET}" | grep -c 'run\.app'
```
**Expected:** both commands output `0`.
**Pass condition:** each grep returns `0`.

---

### AC-049-DEPLOY-ENVGUARD-1 — GA env-var build-time guard (LOCAL — runs before deploy, not after)

**This is a build-time guard, verified at `npm run build` BEFORE deploy. Local-machine probe, not production curl.**

**Command A (GA id unset — build fails):**
```
cd /Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.claude/worktrees/K-049-public-surface-plumbing/frontend
unset VITE_GA_MEASUREMENT_ID
node scripts/validate-env.mjs
```
**Expected:** exit 1 with message `VITE_GA_MEASUREMENT_ID must match G-[A-Z0-9]{10,}`.
**Pass condition:** `$?` == `1` AND stderr contains `G-[A-Z0-9]`.

**Command B (malformed GA id — build fails):**
```
VITE_GA_MEASUREMENT_ID="not-a-ga-id" node scripts/validate-env.mjs
```
**Expected:** exit 1 with same message.
**Pass condition:** `$?` == `1`.

**Command C (valid GA id — build succeeds):**
```
VITE_GA_MEASUREMENT_ID="G-ABCDEFGHIJ" node scripts/validate-env.mjs
```
**Expected:** exit 0 with message `VITE_GA_MEASUREMENT_ID=G-ABCDEFGHIJ OK`.
**Pass condition:** `$?` == `0`.

**Command D (prod build with VITE_API_BASE_URL non-empty — fails, per Reviewer I-1 fix):**
```
NODE_ENV=production VITE_GA_MEASUREMENT_ID="G-ABCDEFGHIJ" VITE_API_BASE_URL="https://fake.run.app" node scripts/validate-env.mjs
```
**Expected:** exit 1 with message containing `VITE_API_BASE_URL must be empty or unset for production builds`.
**Pass condition:** `$?` == `1` AND stderr contains `Post-K-049 Phase 2b CORSMiddleware removal`.

**Command E (post-deploy: GA id in shipped bundle):**
```
curl -s https://k-line-prediction-app.web.app/ | grep -oE 'G-[A-Z0-9]{10,}' | sort -u | wc -l
```
**Expected:** `1` (exactly one unique GA ID in the shipped HTML).
**Pass condition:** exit 0 AND output `1`.

---

## Summary Coverage Table

| AC | Type | Probe kind | Coverage |
|----|------|------------|----------|
| AC-049-PROBE-1 | Phase 1 | curl + grep + python json-ld parse | Commands A–D |
| AC-049-PWA-1 | Phase 1 | curl + python + Lighthouse manual | Commands A–C |
| AC-049-BODONI-1 | Phase 1 | curl + grep | Command |
| AC-049-ROBOTS-1 | Phase 2a | curl -sI + xmllint | Commands A–E |
| AC-049-SITEMAP-1 | Phase 2a | curl + python parse | Command |
| AC-049-CSP-REPORT-1 | Phase 2a | curl + browser probe | Commands A–C + Known Gap |
| AC-049-CACHE-1 | Phase 2a | curl -sI on hashed asset + index.html | Commands A–B |
| AC-049-DEPLOY-ORDER-1 | Phase 2b | curl to /api/** + origin header | Commands A–C |
| AC-049-DEPLOY-ENVGUARD-1 | Build-time + post-deploy | local validate-env.mjs + curl post-deploy | Commands A–E |

**In-tree ACs (NOT deploy-probes; already verified by Playwright + Vitest in `docs/retrospectives/qa.md` K-049 regression-pass entry):**
- AC-049-SUSPENSE-1 — lazy chunks + Suspense fallback, verified by all 269 green chromium specs
- AC-049-GA-LAZY-1 — PAGE_TITLES map drives page_view event under lazy boundary, verified by `ga-spa-pageview.spec.ts` green

---

**Deploy-order reminder (per architect §2):**
1. Phase 1 deploy + run Phase 1 probe block → all pass → gate
2. Phase 2a deploy + run Phase 2a probe block → all pass → **≥24h soak** → gate
3. Phase 2b backend deploy + run Phase 2b probe block → all pass → gate
4. Phase 3 is in-tree (no separate deploy; SUSPENSE/GA-LAZY verified by Playwright)
5. Phase 4 CSP enforce → split to K-050 per BQ-049-03

**Rollback path:** any probe fails → `firebase hosting:rollback` (Phase 1 / 2a) OR `gcloud run services update-traffic` (Phase 2b). Do NOT progress to next Phase with any "Pass: n" in the current Phase's table.
