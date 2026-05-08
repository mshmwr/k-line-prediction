# Release Versioning & CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each git tag push automatically triggers CI to perform Firebase + Cloud Run deploy, Playwright screenshots, and create a GitHub Release with the version doc and screenshots.

**Architecture:** Local `create-release.js` script handles version doc generation, tag, push; GitHub Actions then handles build/deploy/screenshot/release creation, with no commit-back loop risk. Screenshots are taken against the production URL (after deploy), ensuring the "time machine" records the real live screen.

**Tech Stack:** Node.js (release script), GitHub Actions, Firebase Hosting, Google Cloud Run + Artifact Registry, Playwright (screenshot), GitHub CLI (`gh`)

---

## File Map

| File | Action | Description |
|------|------|------|
| `scripts/create-release.js` | New | Local release script |
| `frontend/e2e/screenshot.spec.ts` | New | CI-only screenshot spec |
| `frontend/playwright.screenshot.config.ts` | New | Dedicated config for screenshot spec (no webServer) |
| `.github/workflows/release.yml` | New | CI/CD workflow |
| `.gitignore` | Modify | Add `release-screenshots/` |
| `docs/releases/` | New directory | Stores release docs (auto-created by script) |

---

## Task 1: Local Release Script

**Files:**
- Create: `scripts/create-release.js`

### Subtask 1-A: dry-run mode logic verification

- [ ] **Step 1: Create skeleton of `scripts/create-release.js` (dry-run only)**

```javascript
#!/usr/bin/env node
// Usage:
//   node scripts/create-release.js [version] [--dry-run]
//   node scripts/create-release.js v1.1.0
//   node scripts/create-release.js           # auto-infer version
//   node scripts/create-release.js --dry-run # preview without git ops

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const VERSION_ARG = process.argv.find(a => /^v\d+\.\d+\.\d+$/.test(a)) || null;

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, ...opts }).toString().trim();
}

function getLastTag() {
  try { return run('git describe --tags --abbrev=0'); } catch { return null; }
}

function getCommitRange(lastTag) {
  return lastTag ? `${lastTag}..HEAD` : run('git rev-list --max-parents=0 HEAD') + '..HEAD';
}

function extractTicketIds(lastTag) {
  const range = getCommitRange(lastTag);
  const log = run(`git log ${range} --oneline`);
  const ids = new Set();
  for (const line of log.split('\n')) {
    (line.match(/K-\d+/g) || []).forEach(id => ids.add(id));
  }
  return [...ids].sort();
}

function readTicketInfo(id) {
  const files = fs.readdirSync(path.join(ROOT, 'docs/tickets'))
    .filter(f => f.startsWith(id + '-'));
  if (!files.length) return { title: id, type: 'fix' };
  const content = fs.readFileSync(path.join(ROOT, 'docs/tickets', files[0]), 'utf8');
  const title = (content.match(/^title:\s*(.+)$/m) || [])[1]?.trim() || id;
  const type  = (content.match(/^type:\s*(.+)$/m)  || [])[1]?.trim() || 'fix';
  return { title, type };
}

function inferVersion(lastTag, ticketIds) {
  if (VERSION_ARG) return VERSION_ARG;
  const [major, minor, patch] = (lastTag || 'v0.0.0').replace('v','').split('.').map(Number);
  const types = ticketIds.map(id => readTicketInfo(id).type);
  if (types.includes('feat')) return `v${major}.${minor + 1}.0`;
  return `v${major}.${minor}.${patch + 1}`;
}

function buildReleaseDoc(version, ticketIds, sha) {
  const date = new Date().toISOString().split('T')[0];
  const lines = ticketIds.map(id => {
    const { title } = readTicketInfo(id);
    return `- [${id}] ${title}`;
  });
  const firebaseSite = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8')
  ).hosting.site;
  return `---
version: ${version}
date: ${date}
tickets: [${ticketIds.join(', ')}]
---

## ${version} — ${date}

### Changes
${lines.join('\n')}

### Deployment
- Commit: ${sha}
- Firebase: https://${firebaseSite}.web.app
- Cloud Run: https://k-line-prediction-<hash>-uc.a.run.app
`;
}

// --- Main ---
const lastTag  = getLastTag();
const tickets  = extractTicketIds(lastTag);
const version  = inferVersion(lastTag, tickets);
const sha      = run('git rev-parse --short HEAD');
const docPath  = path.join(ROOT, 'docs/releases', `${version}.md`);
const docBody  = buildReleaseDoc(version, tickets, sha);

console.log(`\n=== Release Preview ===`);
console.log(`Version : ${version}`);
console.log(`Tickets : ${tickets.join(', ') || '(none detected)'}`);
console.log(`DocPath : docs/releases/${version}.md`);
console.log(`DryRun  : ${DRY_RUN}\n`);

if (DRY_RUN) {
  console.log('--- Release Doc Preview ---\n' + docBody);
  console.log('--- Dry run complete. No changes made. ---');
  process.exit(0);
}

// Write doc
fs.mkdirSync(path.join(ROOT, 'docs/releases'), { recursive: true });
fs.writeFileSync(docPath, docBody, 'utf8');
console.log(`✓ Written ${docPath}`);

// Git commit + tag + push
run(`git add docs/releases/${version}.md`);
run(`git commit -m "release: ${version}"`);
run(`git tag ${version}`);
run('git push origin main --follow-tags');
console.log(`✓ Tagged ${version} and pushed.`);
```

- [ ] **Step 2: dry-run test — run from K-Line project root**

```bash
cd ClaudeCodeProject/K-Line-Prediction
node scripts/create-release.js --dry-run
```

Expected output:
```
=== Release Preview ===
Version : v1.0.0       ← MINOR increment from v0.0.0 when no last tag
Tickets : K-017, K-018  ← extracted from git log (varies by actual commits)
DocPath : docs/releases/v1.0.0.md
DryRun  : true

--- Release Doc Preview ---
---
version: v1.0.0
...
```

Verify: no files created; `git status` shows no dirty changes.

- [ ] **Step 3: Test version-arg path**

```bash
node scripts/create-release.js v1.2.3 --dry-run
```

Expected: `Version : v1.2.3` (ignores inference logic)

- [ ] **Step 4: Commit script**

```bash
git add scripts/create-release.js
git commit -m "feat(K-019): local release script with dry-run support"
```

---

## Task 2: Playwright Screenshot Spec

**Files:**
- Create: `frontend/e2e/screenshot.spec.ts`
- Create: `frontend/playwright.screenshot.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Add `release-screenshots/` to `.gitignore`**

Append to `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.gitignore`:

```
# Release screenshots (CI artifact only, not committed)
release-screenshots/
```

- [ ] **Step 2: Create `frontend/playwright.screenshot.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

// Separate config for CI release screenshots.
// Targets PROD_URL directly — no local webServer needed.
export default defineConfig({
  testDir: './e2e',
  testMatch: /screenshot\.spec\.ts$/,
  timeout: 60_000,
  use: {
    baseURL: process.env.PROD_URL || 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'release-screenshot',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer: targets live PROD_URL in CI
})
```

- [ ] **Step 3: Create `frontend/e2e/screenshot.spec.ts`**

```typescript
import { test } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const PROD_URL = process.env.PROD_URL!
const OUT_DIR = path.resolve('release-screenshots')

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
})

test('screenshot: home', async ({ page }) => {
  await page.goto(PROD_URL)
  await page.waitForLoadState('networkidle')
  await page.screenshot({
    path: path.join(OUT_DIR, 'home.png'),
    fullPage: true,
  })
})

test('screenshot: about', async ({ page }) => {
  await page.goto(`${PROD_URL}/about`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({
    path: path.join(OUT_DIR, 'about.png'),
    fullPage: true,
  })
})

test('screenshot: app-login', async ({ page }) => {
  await page.goto(`${PROD_URL}/app`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({
    path: path.join(OUT_DIR, 'app-login.png'),
    fullPage: true,
  })
})
```

- [ ] **Step 4: Verify screenshot spec does not affect general test suite**

```bash
cd frontend
npx playwright test --config playwright.config.ts --list
```

Expected: `screenshot.spec.ts` is not listed (`playwright.config.ts`'s `testMatch: /.*\.spec\.ts$/` would match it; need to confirm)

> **Note:** `screenshot.spec.ts`'s `testMatch` is `.*\.spec\.ts`; the general config also matches. Exclude it in general config:

Modify `frontend/playwright.config.ts`, in the `chromium` project add:

```typescript
{
  name: 'chromium',
  testMatch: /(?<!screenshot)\.spec\.ts$/,   // exclude screenshot.spec.ts
  use: { ...devices['Desktop Chrome'] },
},
```

- [ ] **Step 5: Re-verify general suite excludes screenshot spec**

```bash
npx playwright test --config playwright.config.ts --list 2>&1 | grep screenshot
```

Expected: no output (screenshot spec not in list)

- [ ] **Step 6: Verify existing E2E tests all still pass**

```bash
npx playwright test --config playwright.config.ts
```

Expected: all existing specs pass; screenshot.spec.ts not included.

- [ ] **Step 7: Commit**

```bash
cd ..  # back to K-Line-Prediction root
git add .gitignore frontend/e2e/screenshot.spec.ts frontend/playwright.screenshot.config.ts frontend/playwright.config.ts
git commit -m "feat(K-019): Playwright screenshot spec + CI-only config"
```

---

## Task 3: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create `.github/workflows/` directory and workflow file**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  CLOUD_RUN_SERVICE: ${{ secrets.CLOUD_RUN_SERVICE }}
  CLOUD_RUN_REGION: ${{ secrets.CLOUD_RUN_REGION }}
  FIREBASE_SITE: k-line-prediction-app
  PROD_URL: https://k-line-prediction-app.web.app

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write   # gh release create

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Setup Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      # ── Frontend Build ──────────────────────────────────────────────
      - name: Install frontend deps
        run: npm ci
        working-directory: frontend

      - name: Build frontend
        run: npm run build
        working-directory: frontend
        env:
          VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}

      # ── Firebase Hosting Deploy ──────────────────────────────────────
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.GCP_PROJECT_ID }}

      # ── Cloud Run Deploy ─────────────────────────────────────────────
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker gcr.io --quiet

      - name: Build Docker image
        run: |
          docker build -t gcr.io/$GCP_PROJECT_ID/k-line-prediction:${{ github.ref_name }} .

      - name: Push Docker image
        run: |
          docker push gcr.io/$GCP_PROJECT_ID/k-line-prediction:${{ github.ref_name }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $CLOUD_RUN_SERVICE \
            --image gcr.io/$GCP_PROJECT_ID/k-line-prediction:${{ github.ref_name }} \
            --region $CLOUD_RUN_REGION \
            --platform managed \
            --allow-unauthenticated \
            --quiet

      # ── Health Check ─────────────────────────────────────────────────
      - name: Wait for Cloud Run health check
        run: |
          CLOUD_RUN_URL=$(gcloud run services describe $CLOUD_RUN_SERVICE \
            --region $CLOUD_RUN_REGION \
            --format 'value(status.url)')
          echo "CLOUD_RUN_URL=$CLOUD_RUN_URL" >> $GITHUB_ENV
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD_RUN_URL/api/health" || echo "000")
            echo "Attempt $i: HTTP $STATUS"
            if [ "$STATUS" = "200" ]; then echo "Health check passed"; exit 0; fi
            sleep 10
          done
          echo "Health check failed after 10 attempts" && exit 1

      # ── Playwright Screenshots ───────────────────────────────────────
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
        working-directory: frontend

      - name: Run screenshot spec
        id: screenshots
        continue-on-error: true
        run: |
          npx playwright test \
            --config playwright.screenshot.config.ts
        working-directory: frontend
        env:
          PROD_URL: ${{ env.PROD_URL }}

      - name: Record screenshot failure reason
        if: steps.screenshots.outcome == 'failure'
        run: echo "SCREENSHOT_NOTE=⚠️ Screenshots unavailable: Playwright execution failed (see CI logs)" >> $GITHUB_ENV

      - name: Set screenshot note (success)
        if: steps.screenshots.outcome == 'success'
        run: echo "SCREENSHOT_NOTE=Screenshots are attached as Assets below" >> $GITHUB_ENV

      # ── Generate Release Body ────────────────────────────────────────
      - name: Build release body from docs/releases
        run: |
          DOC="docs/releases/${{ github.ref_name }}.md"
          if [ -f "$DOC" ]; then
            # Strip frontmatter (lines between --- markers) and use body
            BODY=$(awk '/^---/{if(++n==2){found=1;next}} found{print}' "$DOC")
          else
            BODY="## ${{ github.ref_name }}\n\n(release doc not found)"
          fi
          echo "$BODY" > /tmp/release-body.md
          echo "$SCREENSHOT_NOTE" >> /tmp/release-body.md

      # ── Create GitHub Release ────────────────────────────────────────
      - name: Create GitHub Release
        run: |
          ASSETS=""
          if [ -d "frontend/release-screenshots" ] && ls frontend/release-screenshots/*.png 1>/dev/null 2>&1; then
            ASSETS=$(ls frontend/release-screenshots/*.png)
          fi
          gh release create ${{ github.ref_name }} \
            --title "${{ github.ref_name }} — $(date +%Y-%m-%d)" \
            --notes-file /tmp/release-body.md \
            $ASSETS
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"
```

Expected: no output (syntax OK)

- [ ] **Step 4: Commit workflow**

```bash
git add .github/workflows/release.yml
git commit -m "feat(K-019): GitHub Actions release workflow"
```

---

## Task 4: GitHub Secrets Setup Notes

> This task is configuration notes, not code. In GitHub repo Settings → Secrets and variables → Actions, configure the following secrets.

| Secret Name | How to obtain |
|-------------|---------|
| `GCP_PROJECT_ID` | Google Cloud Console → project ID (format: `my-project-123`) |
| `CLOUD_RUN_SERVICE` | Cloud Run service name (current name; query via `gcloud run services list`) |
| `CLOUD_RUN_REGION` | Cloud Run deploy region (e.g. `us-central1`, `asia-east1`) |
| `GCP_SA_KEY` | Create Service Account JSON; needs Cloud Run Admin + Artifact Registry Writer + Storage Admin; base64 or paste JSON |
| `FIREBASE_SERVICE_ACCOUNT` | For Firebase Hosting → GitHub Actions deploy, Firebase console auto-generates a service account JSON (Project Settings → Service accounts → Generate new private key) |
| `VITE_GA_MEASUREMENT_ID` | GA4 Measurement ID (`G-XXXXXXXXXX`); already configured in K-018 |

- [ ] **Step 1: Query current Cloud Run service name**

```bash
gcloud run services list --format="table(metadata.name,status.url,metadata.namespace)"
```

Note `SERVICE_NAME` and `REGION`.

- [ ] **Step 2: Configure the secrets in GitHub**

Go to `https://github.com/<your-username>/k-line-prediction/settings/secrets/actions` and add each.

- [ ] **Step 3: Confirm `firebase.json`'s `site` field matches `FIREBASE_SITE` env**

```bash
cat firebase.json | python3 -c "import json,sys; print(json.load(sys.stdin)['hosting']['site'])"
```

Expected: `k-line-prediction-app` (matches `FIREBASE_SITE: k-line-prediction-app` in workflow)

---

## Task 5: First Release v1.0.0

- [ ] **Step 1: Confirm main is clean**

```bash
git status
git log --oneline -5
```

Expected: working tree clean

- [ ] **Step 2: dry-run preview**

```bash
node scripts/create-release.js v1.0.0 --dry-run
```

Verify: version v1.0.0; ticket list correct; release doc format matches spec.

- [ ] **Step 3: Run release (real)**

```bash
node scripts/create-release.js v1.0.0
```

Expected:
```
✓ Written docs/releases/v1.0.0.md
✓ Tagged v1.0.0 and pushed.
```

- [ ] **Step 4: Confirm GitHub Actions has triggered**

Go to `https://github.com/<your-username>/k-line-prediction/actions`, confirm `Release` workflow appears and is running.

- [ ] **Step 5: Confirm GitHub Release created**

After CI completes, go to `https://github.com/<your-username>/k-line-prediction/releases`, confirm:
- Release `v1.0.0` exists
- Release body contains ticket list
- Assets include `home.png`, `about.png`, `app-login.png`

---

## Self-Review

### Spec Coverage

| AC | Task coverage |
|----|----------|
| AC-K019-1: local script creates doc + tag + push | Task 1 ✓ |
| AC-K019-2: CI pipeline full execution | Task 3 ✓ |
| AC-K019-3: release document format | Task 1 (buildReleaseDoc) ✓ |
| AC-K019-4: deploy failure protection (fail-fast) | Task 3 (workflow has no `continue-on-error` on deploy steps) ✓ |
| AC-K019-5: screenshot failure annotated | Task 3 (`continue-on-error: true` + SCREENSHOT_NOTE) ✓ |

### Placeholder Scan

- No TBD / TODO
- `CLOUD_RUN_URL` line dynamically obtained via `gcloud run services describe` ✓
- release body awk script clear (skips frontmatter) ✓

### Type Consistency

- `readTicketInfo()` returns `{ title, type }` — used consistently in Task 1 ✓
- `screenshot.spec.ts` uses `PROD_URL!` — workflow injects `PROD_URL: ${{ env.PROD_URL }}` ✓
- `playwright.screenshot.config.ts` testMatch `/screenshot\.spec\.ts$/` — matches filename ✓
- playwright.config.ts excludes screenshot.spec: `(?<!screenshot)\.spec\.ts$` ✓
