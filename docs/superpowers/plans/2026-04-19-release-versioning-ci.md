# Release Versioning & CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每次 git tag push 自動觸發 CI，完成 Firebase + Cloud Run 部署、Playwright 截圖，並建立含版本文件和截圖的 GitHub Release。

**Architecture:** 本機 `create-release.js` script 負責產版本文件、tag、push；GitHub Actions 接手 build/deploy/截圖/release 建立，無 commit-back loop 風險。截圖對 production URL 拍攝（deploy 後才跑），確保「時光機」記錄的是真實上線畫面。

**Tech Stack:** Node.js (release script), GitHub Actions, Firebase Hosting, Google Cloud Run + Artifact Registry, Playwright (screenshot), GitHub CLI (`gh`)

---

## File Map

| 檔案 | 動作 | 說明 |
|------|------|------|
| `scripts/create-release.js` | 新建 | 本機 release script |
| `frontend/e2e/screenshot.spec.ts` | 新建 | CI-only 截圖 spec |
| `frontend/playwright.screenshot.config.ts` | 新建 | 截圖 spec 專用 config（無 webServer） |
| `.github/workflows/release.yml` | 新建 | CI/CD workflow |
| `.gitignore` | 修改 | 加 `release-screenshots/` |
| `docs/releases/` | 新建目錄 | release 文件存放（script 自動建立） |

---

## Task 1: 本機 Release Script

**Files:**
- Create: `scripts/create-release.js`

### Subtask 1-A: dry-run 模式驗證邏輯

- [ ] **Step 1: 建立 `scripts/create-release.js` 骨架（dry-run only）**

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

### 變更內容
${lines.join('\n')}

### 部署
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

- [ ] **Step 2: dry-run テスト — 在 K-Line 專案根目錄執行**

```bash
cd ClaudeCodeProject/K-Line-Prediction
node scripts/create-release.js --dry-run
```

Expected output:
```
=== Release Preview ===
Version : v1.0.0       ← 無 last tag 時從 v0.0.0 MINOR increment
Tickets : K-017, K-018  ← 從 git log 抓出（依實際 commits 而定）
DocPath : docs/releases/v1.0.0.md
DryRun  : true

--- Release Doc Preview ---
---
version: v1.0.0
...
```

Verify: 無檔案被建立，`git status` 無 dirty changes。

- [ ] **Step 3: 測試帶版本號參數**

```bash
node scripts/create-release.js v1.2.3 --dry-run
```

Expected: `Version : v1.2.3`（無視推論邏輯）

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

- [ ] **Step 1: 加 `release-screenshots/` 到 `.gitignore`**

在 `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.gitignore` 末尾加：

```
# Release screenshots (CI artifact only, not committed)
release-screenshots/
```

- [ ] **Step 2: 建立 `frontend/playwright.screenshot.config.ts`**

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

- [ ] **Step 3: 建立 `frontend/e2e/screenshot.spec.ts`**

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

- [ ] **Step 4: 驗證 screenshot spec 不影響一般測試 suite**

```bash
cd frontend
npx playwright test --config playwright.config.ts --list
```

Expected: `screenshot.spec.ts` 不出現在清單（`playwright.config.ts` 的 `testMatch: /.*\.spec\.ts$/` 會匹配到它，需確認）

> **注意：** `screenshot.spec.ts` 的 `testMatch` 為 `.*\.spec\.ts`，一般 config 也會匹配到它。因此在一般 config 中排除它：

修改 `frontend/playwright.config.ts`，在 `chromium` project 加：

```typescript
{
  name: 'chromium',
  testMatch: /(?<!screenshot)\.spec\.ts$/,   // exclude screenshot.spec.ts
  use: { ...devices['Desktop Chrome'] },
},
```

- [ ] **Step 5: 再次驗證一般 suite 不含 screenshot spec**

```bash
npx playwright test --config playwright.config.ts --list 2>&1 | grep screenshot
```

Expected: 無輸出（screenshot spec 不在清單）

- [ ] **Step 6: 驗證現有 E2E tests 仍全部通過**

```bash
npx playwright test --config playwright.config.ts
```

Expected: all existing specs pass, screenshot.spec.ts not included.

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

- [ ] **Step 1: 建立 `.github/workflows/` 目錄並建 workflow 檔**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: 寫 `.github/workflows/release.yml`**

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
        run: echo "SCREENSHOT_NOTE=⚠️ 截圖不可用：Playwright 執行失敗（詳見 CI logs）" >> $GITHUB_ENV

      - name: Set screenshot note (success)
        if: steps.screenshots.outcome == 'success'
        run: echo "SCREENSHOT_NOTE=截圖見下方 Assets" >> $GITHUB_ENV

      # ── Generate Release Body ────────────────────────────────────────
      - name: Build release body from docs/releases
        run: |
          DOC="docs/releases/${{ github.ref_name }}.md"
          if [ -f "$DOC" ]; then
            # Strip frontmatter (lines between --- markers) and use body
            BODY=$(awk '/^---/{if(++n==2){found=1;next}} found{print}' "$DOC")
          else
            BODY="## ${{ github.ref_name }}\n\n（release doc not found）"
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

- [ ] **Step 3: 驗證 YAML 語法**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"
```

Expected: 無輸出（syntax OK）

- [ ] **Step 4: Commit workflow**

```bash
git add .github/workflows/release.yml
git commit -m "feat(K-019): GitHub Actions release workflow"
```

---

## Task 4: GitHub Secrets 設定說明

> 這個 task 是設定說明，不是 code。在 GitHub repo Settings → Secrets and variables → Actions 設定以下 secrets。

| Secret Name | 如何取得 |
|-------------|---------|
| `GCP_PROJECT_ID` | Google Cloud Console → 專案 ID（格式：`my-project-123`） |
| `CLOUD_RUN_SERVICE` | Cloud Run 服務名稱（目前的服務名稱，`gcloud run services list` 查詢） |
| `CLOUD_RUN_REGION` | Cloud Run 部署 region（例：`us-central1`、`asia-east1`） |
| `GCP_SA_KEY` | 建立 Service Account JSON，需有 Cloud Run Admin + Artifact Registry Writer + Storage Admin 權限，base64 或直接貼 JSON |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Hosting → GitHub Actions 部署時，Firebase console 自動產生 service account JSON（在 Project Settings → Service accounts → Generate new private key） |
| `VITE_GA_MEASUREMENT_ID` | GA4 Measurement ID（`G-XXXXXXXXXX`），已在 K-018 設定 |

- [ ] **Step 1: 查詢目前 Cloud Run 服務名稱**

```bash
gcloud run services list --format="table(metadata.name,status.url,metadata.namespace)"
```

記下 `SERVICE_NAME` 和 `REGION`。

- [ ] **Step 2: 在 GitHub 設定上述 secrets**

前往 `https://github.com/<your-username>/k-line-prediction/settings/secrets/actions` 逐一新增。

- [ ] **Step 3: 確認 `firebase.json` 的 `site` 欄位與 `FIREBASE_SITE` env 一致**

```bash
cat firebase.json | python3 -c "import json,sys; print(json.load(sys.stdin)['hosting']['site'])"
```

Expected: `k-line-prediction-app`（與 workflow 中 `FIREBASE_SITE: k-line-prediction-app` 一致）

---

## Task 5: 第一次 Release v1.0.0

- [ ] **Step 1: 確認 main 是乾淨的**

```bash
git status
git log --oneline -5
```

Expected: working tree clean

- [ ] **Step 2: dry-run 預覽**

```bash
node scripts/create-release.js v1.0.0 --dry-run
```

驗證：版本號 v1.0.0，tickets 清單正確，release doc 格式符合 spec。

- [ ] **Step 3: 執行 release（真實）**

```bash
node scripts/create-release.js v1.0.0
```

Expected:
```
✓ Written docs/releases/v1.0.0.md
✓ Tagged v1.0.0 and pushed.
```

- [ ] **Step 4: 確認 GitHub Actions 已觸發**

前往 `https://github.com/<your-username>/k-line-prediction/actions`，確認 `Release` workflow 出現且 running。

- [ ] **Step 5: 確認 GitHub Release 建立**

CI 完成後，前往 `https://github.com/<your-username>/k-line-prediction/releases`，確認：
- Release `v1.0.0` 存在
- Release body 含 tickets 清單
- Assets 含 `home.png`, `about.png`, `app-login.png`

---

## Self-Review

### Spec Coverage

| AC | Task 覆蓋 |
|----|----------|
| AC-K019-1: 本機 script 建 doc + tag + push | Task 1 ✓ |
| AC-K019-2: CI pipeline 完整執行 | Task 3 ✓ |
| AC-K019-3: Release 文件格式 | Task 1 (buildReleaseDoc) ✓ |
| AC-K019-4: Deploy 失敗保護（fail-fast） | Task 3（workflow 無 `continue-on-error` on deploy steps）✓ |
| AC-K019-5: 截圖失敗標注原因 | Task 3（`continue-on-error: true` + SCREENSHOT_NOTE）✓ |

### Placeholder Scan

- 無 TBD / TODO
- `CLOUD_RUN_URL` 一行用 `gcloud run services describe` 動態取得 ✓
- release body awk script 明確（跳過 frontmatter）✓

### Type Consistency

- `readTicketInfo()` returns `{ title, type }` — Task 1 全程使用 ✓
- `screenshot.spec.ts` uses `PROD_URL!` — workflow 注入 `PROD_URL: ${{ env.PROD_URL }}` ✓
- `playwright.screenshot.config.ts` testMatch `/screenshot\.spec\.ts$/` — 與檔名一致 ✓
- playwright.config.ts 排除 screenshot.spec: `(?<!screenshot)\.spec\.ts$` ✓
