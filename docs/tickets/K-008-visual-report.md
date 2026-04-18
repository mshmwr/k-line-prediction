---
id: K-008
title: 自動化視覺報告 script（Playwright 截圖 → HTML）
status: closed
closed: 2026-04-18
type: feat
priority: high
created: 2026-04-18
updated: 2026-04-18
---

## 背景

目前 QA 完成後沒有視覺化的驗收報告；Retrospective 流程要求 QA 執行截圖 script 並通知 PM「報告在 `docs/reports/K-XXX-visual-report.html`」，但此 script 尚未存在 — QA agent 定義的結尾動作目前懸空。

## 範圍（MVP）

**含：**
- 建立 `frontend/e2e/visual-report.ts` Playwright script
- 對「已知頁面路由全集」各截一張全頁截圖（full page screenshot）— 不做 ticket → 頁面 mapping
- 產出 `docs/reports/K-XXX-visual-report.html`（內嵌截圖的 HTML 報告，XXX 由 CLI 傳入）

**不含（MVP 不做）：**
- Ticket → 頁面 mapping（跑幾次後再依實際需求補，避免過早優化）
- 分 section 截圖（先整頁，之後再切）
- 截圖比對（pixel diff）
- CI 自動觸發（維持手動 `npx playwright test visual-report.ts`）

## 驗收條件

### AC-008-SCRIPT：Script 可執行

**Given** QA 完成，所有 Playwright E2E 已通過
**When** 在 `frontend/` 目錄執行 `npx playwright test visual-report.ts`（含傳入 ticket ID 的方式，由 Architect 決定 CLI arg / env var）
**Then** script 成功執行，退出碼 0
**And** 在 `docs/reports/` 下產出 `K-XXX-visual-report.html`

### AC-008-CONTENT：報告包含所有已知頁面全頁截圖

**Given** `K-XXX-visual-report.html` 已產出
**When** 在瀏覽器開啟
**Then** 報告包含「已知頁面路由全集」每條路由一張 full page 截圖
**And** 每張截圖有對應的 route path 標記（例如 `/`、`/app`、`/about`、`/diary`）
**And** 若某條路由需登入，報告標記「需登入」或使用 auth fixture 後截圖（由 Architect 定案）

## 裁決（PM triage 2026-04-18）

- **priority：low → medium → high**（2026-04-18 K-011 PM 彙整後再上調）
- **獨立 ticket，不併入 K-011** — script 跨頁執行，不綁任何單一 UI ticket；不降級為 K-011 的子任務
- **MVP 範圍縮減** — 全頁截圖 + 所有已知路由，不做 ticket→頁面 mapping（跑幾輪後再視需要補）
- **cycle 位置（2026-04-18 更新）：cycle #6 → cycle #4** — K-009/010/011 連續三張 ticket 無視覺驗證層（Engineer/Reviewer/QA/PM 皆無法確認 UI），為系統性缺口，不得再拖
- **連動：** K-012 → cycle #6、K-013 → cycle #7（各順延一個 cycle）
- **狀態：open (cycle #6) → open (cycle #4)**

## Blocking Questions（已釐清 2026-04-18）

| # | 問題 | 裁決 |
|---|------|------|
| 1 | 執行環境 | **本地 dev server** — script 假設 `http://localhost:5173`（Vite 預設）已起；與既有 Playwright E2E 一致，離線可跑 |
| 2 | 頁面範圍 | **4 條公開頁：`/` `/app` `/about` `/diary`**（`/app` 是預測主頁不需登入，PM 原推薦誤判已修正）；`/business-logic`（JWT）標「需登入，下期補」不做 auth fixture |
| 3 | Ticket ID 傳入 | **env var：`TICKET_ID=K-008 npx playwright test visual-report.ts`** — script 讀 `process.env.TICKET_ID`；若未設則預設字串 `UNKNOWN` 或退出碼 1（由 Architect 決定） |

## 相關連結

- [PM-dashboard.md](../../../PM-dashboard.md)
- [K-002 Retrospective — QA 反省段](K-002-ui-optimization.md#retrospective)
- QA agent 結尾動作定義：`~/.claude/agents/qa.md`
- Per-Role Retrospective Log 機制：`CLAUDE.md` 第 39~64 行

---

## Architecture（2026-04-18）

### 1. 技術方案選擇

#### 1.1 Runner：Playwright Test Runner vs 獨立 Node Script

**推薦：Playwright Test Runner（`npx playwright test visual-report.ts`）**

**理由（一句）：** 既有 `playwright.config.ts` 已定義 `webServer.command=npm run dev` + `baseURL=http://localhost:5173` + `reuseExistingServer`，沿用等於免費拿到「dev server 未起時自動啟、已起時重用、`baseURL` 統一」三件事；獨立 Node script 要自行 spawn `chromium.launch()` + 等 server ready + 設 baseURL，重造已有輪子。

**Trade-off：**
- Runner 路徑：`visual-report.ts` 必須寫成 `test(...)` 或 `test.describe(...)` block；產報告邏輯放在 `test.afterAll()` 聚合 → 語意稍繞。
- 獨立 script：語意單純（imperative），但放棄既有 webServer / baseURL / retries 設定。
- 備選（不選）：寫在既有 `pages.spec.ts` 內 → 違反 AC「獨立可執行 `visual-report.ts`」。

#### 1.2 HTML 模板：inline 生成 vs 獨立 template 檔

**推薦：inline 生成（script 內 template literal）**

**理由：** MVP 只渲染 `<h1>` + 4 個 section（route label + 截圖 + dimensions），模板體積 < 40 行；獨立 `.html` 模板會多一次 file I/O + 佔位符替換，且 K-008 沒有 template 重用需求。

**Trade-off：**
- inline：template 改動等於改 script，review 一處即可。
- 獨立檔（不選）：若日後新增「比對報告 / timeline 報告」等變體，再抽出 `frontend/e2e/visual-report/templates/` 即可，YAGNI。

#### 1.3 截圖 output：inline base64 單檔 vs 分檔目錄

**推薦：inline base64 單檔（`docs/reports/K-XXX-visual-report.html`）**

**理由：** AC-008-SCRIPT 明確規定產出 `docs/reports/K-XXX-visual-report.html` 單檔；QA agent 結尾動作是「通知 PM 報告在某單一檔案路徑」。單檔離線可開、方便 commit / attach / 傳給使用者檢視；4 張全頁截圖以 PNG base64 內嵌，K-Line 目前頁面複雜度下預估 2~5 MB（風險條款見 §6.3）。

**Trade-off：**
- 單檔 inline：移動 / 分享一個檔；缺點是 HTML 會較大，瀏覽器渲染略慢（但 MVP 4 張圖可接受）。
- 分檔目錄（不選）：`docs/reports/K-XXX/` 內 `index.html` + `*.png` — 檔小快開，但破壞「單一檔案交付」AC 語意、commit 多檔雜亂、`docs/reports/` 會膨脹。
- 若 §6.3 實測單檔 > 10 MB → 啟動 fallback：將圖壓 JPEG quality=85 再 base64；仍過大 → 改分檔（下一張 ticket 處理，不在 K-008 scope 調整 AC）。

---

### 2. Script 介面

#### 2.1 `TICKET_ID` 未設時的行為

**推薦：預設字串 `UNKNOWN`，不 exit 1。**

**理由：** script 的用途是「視覺產出工具」，不是驗證工具；QA 可能本地手跑查看當前 UI 狀態而不關心 ticket 編號，此時硬 fail 反而擾人。但為了防止忘記設 env var 後產出 `K-UNKNOWN-visual-report.html` 被誤提交，script 啟動時若偵測到 `UNKNOWN`，在 stdout 印黃色警告：
```
[visual-report] WARNING: TICKET_ID not set, output will be K-UNKNOWN-visual-report.html
```

**Trade-off：**
- `UNKNOWN` + warning：UX 友善，警告明確。
- exit 1（不選）：符合「嚴格 CI」風格，但 K-008 目前無 CI 觸發需求；且 AC-008-SCRIPT 只說 `TICKET_ID=K-008 npx playwright test visual-report.ts` 應成功，沒規定未設時要失敗。

#### 2.2 單頁失敗時的行為（timeout / 4xx / navigation error）

**推薦：partial report — 繼續跑剩下的頁，該頁 section 標記失敗，script 最後 exit 1。**

**理由：**
- QA 手跑情境：「給我看哪些頁壞了」比「第一個壞的就中斷」有用；partial report 讓一次跑就拿到全貌。
- 但最終 exit 1 確保 CI / QA 流程不會把「部分失敗」當成通過。

**實作：**
- 每條路由獨立 `try { goto + screenshot } catch (e) { push failureSection }`
- 失敗 section 渲染紅色邊框 + 錯誤訊息（`e.message` + stack 前 3 行）+ 無截圖占位
- 聚合階段若 `failures.length > 0` → `process.exitCode = 1`

**Trade-off：**
- partial + exit 1：QA / 人類看 HTML 立刻知道哪頁壞；CI 仍 fail。
- first-fail exit（不選）：CI 友善但 QA 要修第一個才知第二個也壞 → 多次迭代。

---

### 3. HTML 報告內容

**結構（按渲染順序）：**

```
<html>
  <head>
    <meta charset="utf-8">
    <title>{TICKET_ID} — Visual Report</title>
    <style>/* inline CSS：grid layout、sticky header、截圖 max-width:100%、failure 紅框 */</style>
  </head>
  <body>
    <header>
      <h1>{TICKET_ID} — Visual Report</h1>
      <p>Generated at {ISO-8601 local time} · Base URL: http://localhost:5173</p>
      <p>Pages: 4 captured, {failures} failed</p>
    </header>
    <main>
      <!-- 每頁一個 section，順序固定 -->
      <section class="page-section {status=success|failure|auth-required}">
        <h2>{label}</h2>
        <p class="route">{routePath}</p>
        <p class="meta">Dimensions: {width} × {height} · Status: {httpStatus}</p>
        <!-- success -->
        <img src="data:image/png;base64,..." alt="{label} screenshot">
        <!-- failure -->
        <pre class="error">{error.message}</pre>
        <!-- auth-required (/business-logic only) -->
        <div class="placeholder">需登入，下期補（K-008 MVP 不做 auth fixture）</div>
      </section>
      ...
    </main>
  </body>
</html>
```

**頁面清單（固定順序，MVP）：**

| Order | Label | Route | 備註 |
|-------|-------|-------|------|
| 1 | Home | `/` | 公開頁 |
| 2 | App (K-Line Prediction) | `/app` | 公開頁，主預測功能 |
| 3 | About | `/about` | 公開頁 |
| 4 | Dev Diary | `/diary` | 公開頁 |
| 5 | Business Logic | `/business-logic` | **標「需登入，下期補」placeholder，不截圖** |

**為何 `/business-logic` 也列入 section：** 報告語意為「此路由在 MVP 涵蓋狀態」，缺席會讓讀者以為路由不存在；明示 placeholder 才能讓下期票清楚接手。

---

### 4. 檔案異動清單

**新增：**

| 路徑 | 職責 |
|------|------|
| `frontend/e2e/visual-report.ts` | Playwright test runner script；逐頁截圖 + 聚合產 HTML 報告（單檔，約 150~200 行） |
| `docs/reports/.gitkeep` | 建立 `docs/reports/` 目錄（git 需要檔案才會保留空目錄；`.gitkeep` 是慣例 placeholder） |

**修改：**

| 路徑 | 修改內容 |
|------|---------|
| `frontend/playwright.config.ts` | `testMatch` 維持 default（`**/*.spec.ts`）→ 意味 `visual-report.ts` **不會**被 `npx playwright test`（不指檔）吃到；**需驗證這個行為**（見 §6.2）。若預設會被 e2e suite 全跑誤吃 → 在 config 加 `testIgnore: ['**/visual-report.ts']`。 |
| `.gitignore`（repo root） | 確認 `docs/reports/*.html` **不在** ignore 清單（產出物需 commit 給 PM / 使用者看）；若被廣域 rule 吃到則需 `!docs/reports/` 白名單。 |
| `K-Line-Prediction/agent-context/architecture.md` | 結構層新增「QA Artifacts」段 + `docs/reports/` 職責、Directory Structure 補 `e2e/visual-report.ts`（見 §8） |

**刪除：** 無。

**不改：**
- 既有 e2e spec（`pages.spec.ts` / `business-logic.spec.ts` / `ma99-chart.spec.ts` / `navbar.spec.ts`）零改動。
- 後端、前端 src/ 零改動。
- `package.json` 不加 script alias — 沿用 `npx playwright test visual-report.ts`（AC-008-SCRIPT 明定）。

---

### 5. 實作順序

**依賴圖：**
```
(A) 建 docs/reports/ 目錄 + .gitkeep
(B) visual-report.ts 骨架（routes 陣列 + test.describe）
    └─ 需 (A)
(C) 逐頁 goto + full page screenshot + buffer 收集
    └─ 需 (B)
(D) HTML template literal + base64 嵌入 + fs.writeFileSync
    └─ 需 (C)
(E) 失敗捕捉 + partial report + process.exitCode
    └─ 需 (D)
(F) architecture.md 同步
    └─ 可與 (A)~(E) 平行
(G) 驗證：本地 `TICKET_ID=K-008 npx playwright test visual-report.ts` → 開 HTML
    └─ 需 (A)~(E)
```

**建議分步 commit：**
1. (A) + (B) + (C)：單頁成功路徑跑通（驗 runner 選擇正確）
2. (D)：HTML 輸出成形（驗 inline base64 大小可接受）
3. (E)：失敗分支 + placeholder page
4. (F)：architecture.md 同步

每步完 `npx tsc --noEmit` + 手跑驗證再進下一步（符合專案 one-edit-one-verify 規範）。

---

### 6. 風險與注意事項

#### 6.1 Vite dev server 啟動檢查

**結論：不需自行 poll**。`playwright.config.ts` line 17~22 已配置 `webServer.command=npm run dev` + `webServer.url=http://localhost:5173` + `reuseExistingServer: !process.env.CI` + `timeout: 30_000`。Playwright runner 自己會 poll URL 直到 200 或 timeout，`visual-report.ts` 直接 `await page.goto(...)` 即可。

**注意：** `reuseExistingServer` 為 true（non-CI），若本地 dev server 已開則重用；CI 會強制重啟（本 ticket 維持手動觸發，暫無 CI 情境）。

#### 6.2 既有 Playwright config 的 testMatch 行為 —— **Engineer 必驗**

**問題：** `playwright.config.ts` 未顯式設 `testMatch`，Playwright default 是 `.*(test|spec)\.(js|ts|mjs)` → 以 `spec.ts` 為主的 glob，但實務上 default glob 涵蓋 `*.ts`（需實測確認）。

**Engineer 實作時必須驗證：**
1. 先寫空殼 `visual-report.ts` 後跑 `npx playwright test` （不指檔）
2. 若輸出列出 visual-report.ts → 會被 e2e suite 誤吃（平常跑測試就會產報告）→ 加 `testIgnore: ['**/visual-report.ts']`
3. 若未列出 → 沿用，但 `npx playwright test visual-report.ts`（指定檔）仍能跑
4. 驗證方式寫入 ticket Retrospective（Engineer 段）

**為什麼不直接改 config：** 未實測前改 config 可能改錯 default；Engineer 實測後再決策，避免 drift。

#### 6.3 HTML 單檔 base64 大小

**預估：** 4 條公開頁，每頁全頁截圖 PNG 預估 500 KB ~ 1.5 MB（視頁面內容長度）；base64 後膨脹 ~33% → 單檔 HTML 約 2~8 MB。

**驗證門檻：** Engineer 首次產出後，`ls -la docs/reports/K-008-visual-report.html` 檢查檔案大小：
- ≤ 10 MB：接受，commit。
- > 10 MB：Engineer 在 ticket Retrospective 登記，不立刻優化；由 PM 決定是否列 K-008 後續 debt / 下一輪 ticket。

**備案（不在 K-008 scope 實作）：**
- PNG → JPEG quality 85（彩色截圖可接受）
- 改為分檔目錄 + `index.html` + `*.png`（需改 AC，由 PM 裁決）

#### 6.4 Playwright full page screenshot 的 viewport 一致性

**問題：** Playwright default viewport 為 1280×720；`fullPage: true` 會往下滾，但橫向維持 1280。若 `/app` 頁面在不同寬度下 layout 有差（K-Line 主頁 responsive），截圖只反映 1280px 視窗的狀態。

**結論：MVP 接受 1280 固定寬度**。報告每 section meta 標明 `Dimensions: 1280 × <actual height>`，讓讀者清楚是哪個 breakpoint 的截圖。未來若要多 breakpoint → 另開 ticket。

#### 6.5 `docs/reports/` 目錄不存在時 fs.writeFileSync 會拋錯

**結論：** 先 `fs.mkdirSync(path, { recursive: true })` 再 write。`.gitkeep` 只是 commit 階段保留空目錄用，runtime 不依賴它存在。

#### 6.6 script 語意與 `test` 函式產生的報告衝突

**問題：** Playwright runner 預設會產 `playwright-report/` HTML（list reporter + html reporter 當 test 有 retry/fail 時）。我們自己也產 `docs/reports/K-XXX-visual-report.html`，名稱不同路徑不同，**不衝突**。但要注意：
- 我們的 script 若 throw → Playwright 會當成 test 失敗 → 本身 runner 會產 `playwright-report/` 報告遮蔽實際問題。
- 解法：script 內部的「頁面 goto / screenshot 失敗」不 rethrow，只記錄到 failures；最後在 `test.afterAll()` 裡聚合產 HTML 後才用 `expect(failures.length).toBe(0)` 斷言（確保 exit code 反映真實狀態）。

---

### 7. Triage Drift Check

對 K-008 將異動的名稱對 `agent-context/architecture.md` 執行 grep：

| 關鍵字 | 命中行 | 狀態 |
|--------|--------|------|
| `visual-report` | — | 未命中 |
| `docs/reports` | line 50「Playwright visual-report 產出」 | 文件預留未落地；K-008 會讓此預留成真，無需修 drift |
| `TICKET_ID` | — | 未命中 |
| `e2e/fixtures` | 既有，無變動 | n/a |

**結論：無 Engineer 待辦的 drift 修正。** `docs/reports/` 於 line 50 已以「將產出」語氣登記，K-008 實作會讓它落地；此次在 architecture.md 新增「QA Artifacts」段正式將此目錄升格為結構元素（見 §8）。

---

### 8. Architecture Doc 同步計畫

`agent-context/architecture.md` 存在 → K-008 會新增 `e2e/visual-report.ts` + `docs/reports/K-XXX-visual-report.html` artifacts + env var 約定（`TICKET_ID`）。屬於「新模組 + 新 artifacts 目錄」→ 必須 Edit。

**計畫（本次任務結束前由 Architect 執行）：**
1. `updated:` 由 2026-04-18 → 2026-04-18（同日多次，無需改）
2. Directory Structure 的 `e2e/` 區塊補一行：`│   │   │   ├── visual-report.ts     ← K-008 視覺報告 script`
3. 新增 `## QA Artifacts` section（在 `## Frontend Routing` 之後、`## Auth Flow` 之前）：
   - `docs/reports/` 目錄職責
   - `visual-report.ts` 執行方式（env var + CLI 範例）
   - 單檔 inline base64 的設計決策摘要
4. Changelog append：`2026-04-18（Architect）— K-008 新增 QA visual report script 與 docs/reports/ artifacts 段`

---

### 9. 放行狀態

**設計完成，Engineer 可接手。**

**無 blocking question 要 PM 確認** — ticket 中 3 項 blocking（local dev server / 4 公開頁 / env var TICKET_ID）PM 已 lock；本次 Architect 追加決策（預設 `UNKNOWN` + warning、partial report + exit 1、inline base64 單檔 ≤ 10 MB、`testIgnore` 由 Engineer 實測後決定）屬 Architect 職權內，不需再回 PM。

**Engineer 開工前須完成：**
- `git worktree list` + 比對 HEAD 在最新 main（K-Line 規範）
- 讀本段 §5 實作順序後再動手

---

## Engineer（2026-04-18）

### 實作摘要

按 Architect §5 依序落地，實際檔案異動：

| 檔案 | 狀態 | 內容 |
|------|------|------|
| `frontend/e2e/visual-report.ts` | 新增 | 255 行 Playwright test runner；routes 陣列 + 逐頁 goto+screenshot + `test.afterAll` 聚合產 HTML；失敗捕捉寫入 failure section 不 rethrow；最後用 `expect(failures).toHaveLength(0)` 決定 exit code。**ESM fix**：package.json `"type": "module"` → 用 `fileURLToPath(import.meta.url)` 取代 `__dirname`（Architect §5 未提及此 ESM 限制） |
| `frontend/playwright.config.ts` | 修改 | 拆成兩個 project（`chromium` + `visual-report`），各自 `testMatch` regex。理由見下方 §6.2 實測 |
| `docs/reports/.gitkeep` | 新增 | 空檔保留目錄 |
| `docs/reports/K-008-visual-report.html` | 新增（產出物） | 1,039,886 B ≈ 1.04 MB，遠低於 §6.3 的 10 MB 門檻；4 張 full-page base64 PNG + 1 個 auth-required placeholder |

### §6.2 testMatch 實測結果（Engineer 必驗項）

**實測步驟：**
1. 寫完 `visual-report.ts` 後 `npx playwright test --list`（不指檔）→ 只列既有 4 files 45 tests，**default 不吃** visual-report.ts（因 default testMatch 是 `**/*.@(spec|test).?(c|m)[jt]s?(x)`，filename 不符）。
2. 但 `TICKET_ID=K-008 npx playwright test visual-report.ts`（指定檔）也被同樣 default glob 擋掉 → `Error: No tests found`。
3. 若把 testMatch 改成 regex 聯集（`[/.*\.spec\.ts$/, /visual-report\.ts$/]`），default `npx playwright test` 就會**連帶**把 visual-report.ts 吃進去，每次正常 E2E run 都會產 HTML 報告，違反 Architect §6.6「不應衝突」的意圖。

**決策：per-project testMatch（Playwright 獨立 project 方案）**
- `chromium` project：`testMatch: /.*\.spec\.ts$/` — 既有 45 tests 乾淨
- `visual-report` project：`testMatch: /visual-report\.ts$/` — 獨立 5 tests
- 驗證：`npx playwright test --project=chromium` → 45 tests 全綠；`TICKET_ID=K-008 npx playwright test visual-report.ts` → 自動綁定 `visual-report` project，跑 5 tests
- **替代方案（未採用）**：單 project + `testIgnore` — 無法解決「CLI 指檔仍被 default 過濾」的核心問題

### §6.3 HTML 單檔大小

1.04 MB，通過 ≤ 10 MB 門檻，無需進 debt 清單。

### 本地驗證結果

| 項目 | 結果 |
|------|------|
| `npx tsc --noEmit` | exit 0 |
| `TICKET_ID=K-008 npx playwright test visual-report.ts` | 5 passed (4.5s)，exit 0 |
| `npx playwright test --project=chromium` | 45 passed (12.4s)，exit 0（regression 檢查） |
| HTML 產出路徑 | `docs/reports/K-008-visual-report.html` (1,039,886 B) |
| HTML 結構 | 1× h1 + 4× success section（含 route/dimensions/HTTP status/base64 PNG）+ 1× auth-required placeholder，HTML 閉合良好 |

### AC 達成確認

- **AC-008-SCRIPT** ✅ — `TICKET_ID=K-008 npx playwright test visual-report.ts` exit 0、`docs/reports/K-008-visual-report.html` 產出
- **AC-008-CONTENT** ✅ — 4 條公開頁各一張 full-page 截圖 + route path（`/` `/app` `/about` `/diary`）、`/business-logic` 明示「需登入，下期補（K-008 MVP 不做 auth fixture）」placeholder

### 未解決 / 後續 debt

無 blocking question。以下為非阻礙的觀察（供 PM / 後續 ticket 參考）：

1. **`/app` 截圖高度 720**（其他頁 1087~3502）— `/app` 載入時後端 `/api/history-info` proxy ECONNREFUSED（後端未跑），頁面停留在 loading 或空狀態。MVP 接受（報告目的是反映「當前本地跑出來的樣子」），若要「有資料的 /app 截圖」需另開 ticket 引入後端 fixture 或 mock。
2. **`waitUntil: 'networkidle'`** — 對 `/business-logic` 以外 4 頁用，在後端不可用的環境可能等到 5s 才 timeout 觸發（實測 `/app` 1.1s pass、`/` 1.2s pass）。若未來加入後端 mock 可改 `'load'`。

### 修復 W1/W3/W4/S2（2026-04-18）

承接 PM 裁決（本檔 `## Code Review` §PM 裁決）後的實作。反省在 `docs/retrospectives/engineer.md` 2026-04-18 Bug Found Protocol 條目。

| 項目 | 檔案 / 行 | 摘要 |
|------|-----------|------|
| W1 | `frontend/e2e/visual-report.ts` L72~93（`resolveTicketId()`）、L235~244（`test.describe` + `test.beforeAll`） | `resolveTicketId()` 不再在 module 頂層呼叫；改由 `test.beforeAll()` lazy 解析 `ticketId` / `outputPath`。module load 不再印 warning，`npx playwright test --list` stdout 乾淨 |
| W3 | `frontend/e2e/visual-report.ts` L237~244 | `results: SectionResult[]` 陣列移入 `test.describe` closure 並由 `beforeAll` 每次重置；原本模組頂層 `const results = []` 已移除。未來開 retries / `--repeat-each` 不會累積重複 section |
| W4 | `frontend/e2e/visual-report.ts` L79~93（`resolveTicketId()`） | 讀完 `process.env.TICKET_ID` 做 `replace(/^K-/i, '')` normalize 後，加 whitelist regex `/^[A-Za-z0-9_-]+$/`；不合法直接 `throw new Error('Invalid TICKET_ID: ...')`，阻止 HTML 寫出 |
| S2 | `.gitignore` L31~32（新增段落） | 新增 `docs/reports/*.html` 一行；`docs/reports/.gitkeep` 仍在且未受 ignore 影響，保留 PR 時目錄結構 |

**副作用：** `renderHtml()` 改為接受 `(ticketId, results)` 參數（原為讀 module-level 變數）；`renderSection()` 不動。Architect §3 的 HTML 章節仍成立。

**本地驗收（全 6 步通過）：**

| 步驟 | 指令 | 結果 |
|------|------|------|
| 1 | `cd frontend && npx tsc --noEmit` | exit 0 |
| 2 | `cd frontend && npx playwright test --list 2>&1 \| grep -i "TICKET_ID not set"` | 無輸出（W1 驗收通過） |
| 3 | `cd frontend && npx playwright test --project=chromium` | 45 passed (12.6s) |
| 4 | `cd frontend && TICKET_ID=K-008 npx playwright test visual-report.ts` | 5 passed (4.5s)，HTML 產出 1,039,886 B |
| 5 | `cd frontend && TICKET_ID=../../etc/passwd npx playwright test visual-report.ts` | `Error: Invalid TICKET_ID: ../../etc/passwd`；HTML 未產出（W4 驗收通過） |
| 6 | `git -C <inner repo> status --untracked-files=all` | `docs/reports/*.html` 不出現（`check-ignore -v` 回 `.gitignore:32`）；僅 `.gitkeep` 列 untracked |

---

## Retrospective

### Engineer（2026-04-18）

**AC 判斷：** AC-008-SCRIPT + AC-008-CONTENT 兩條都能在 MVP 範圍內直接落地，無歧義。

**testMatch 邊界沒預料到：** Architect §6.2 預期「default testMatch 不吃 → 不需改」或「吃到 → 加 testIgnore」兩種分支，實際踩到第三種：**default 不吃但 CLI 指檔也被擋**。原因是 Playwright default glob (`*.@(spec|test).?(c|m)[jt]s?(x)`) 對 CLI file-filter 也生效，不是 CLI 覆寫 testMatch。解法用 per-project testMatch（乾淨分離，不污染 default E2E run），但這個分支 Architect 沒列，我在實作時先踩錯兩次（先試 `testMatch: [regex1, regex2]` → default 被污染；才改 per-project）。

**ESM 沒預料到：** Architect §3 HTML template 示意 `fs.writeFileSync`，但沒提 `package.json "type": "module"` 會讓 `__dirname` 在 TS→ESM 編譯後不可用。第一次跑 `--list` 才遇到 `ReferenceError: __dirname is not defined in ES module scope`，改用 `fileURLToPath(import.meta.url)` 解掉。

**下次改善：**
1. **Engineer 實作前用 `--list` 試空殼** — 在骨架 (B) 階段就 `npx playwright test visual-report.ts --list` 驗證 runner 能看到檔，不要等到真的要跑才發現 filename filter 問題。
2. **ESM 環境先查 `package.json`** — 任何新增的 `.ts` 如果用到 Node runtime globals（`__dirname` / `__filename` / `require`），先 `grep '"type"' package.json`，`module` 就立刻用 `import.meta.url` 寫法。
3. **Architect §6 風險條款發現新分支要補回** — §6.2 的「default 不吃」結論沒涵蓋「CLI 指檔也被擋」，這次實測的 per-project 方案應補回 architecture.md 或 Architect retrospective，避免下次又踩（我會把這件事轉給 Architect）。

### QA 反省（2026-04-18）

**沒做好：**
- 回歸計畫由 PM prompt 預先列 6 步，QA 只是按表執行；未自行加碼邊界測試（e.g. `TICKET_ID` 為空字串、純空白、含 Unicode、`K-` 大小寫混用），W4 whitelist 的 negative path 只驗了 `../../etc/passwd` 一個 payload。若使用者誤傳 `TICKET_ID=" "` 或 `TICKET_ID="K-008 "` 帶尾空白，regex 會拒絕，但 QA 沒跑過、沒文件化此行為，未來 bug 溯源沒參考點。
- 未自行列出「所有共用檔案」的下游影響清單：本票修改 `.gitignore` / `playwright.config.ts` 均為跨 spec 影響面，QA 只跑 `--project=chromium` 驗 45 tests 回歸，沒對 `.gitignore` 做「其他 HTML 產物是否意外被 ignore」的獨立掃描（e.g. `frontend/dist/*.html`、`coverage/*.html`）。Reviewer 的 `check-ignore -v` 輸出顯示 rule 精確命中 `docs/reports/*.html`，未有 overreach，但 QA 這次是照 PM step 6 驗，不是自己主動查。
- HTML 產物的「內容層」驗證掛空：size 1,039,886 B 通過 >500KB/<10MB 門檻，但沒開啟 HTML 檢查 `/app` section 是否仍是空狀態（1.04 MB 合理是因為 3 張頁有內容，但若 `/app` 變 3500px 高、`/business-logic` 被誤當成 auth-required，size 也會落在正常區間）。AC-008-CONTENT 條文「每張截圖有對應的 route path 標記」QA 沒實際開 HTML 看，只靠 Engineer 自述。

**下次改善：**
1. **邊界 payload 自動擴展清單** — 凡涉及 env var / CLI 輸入的 ticket，QA 自備固定清單（空字串、純空白、尾空白、大小寫、Unicode、overflow 長度），不等 Reviewer 列 payload；跑完附回歸報告。
2. **跨檔案影響盤點** — 任何修改 `.gitignore` / 跨 spec config 的 ticket，QA 執行 `git check-ignore -v` 對 repo 內常見產物目錄（`dist/`、`coverage/`、`node_modules/`、`docs/`）各抽 1 個 sample 檔案，確認無 overreach。
3. **產物內容驗證** — HTML / JSON / 任何可 read 的 artifact，QA 至少做一次結構抽樣（e.g. HTML 用 `grep -c "<section"` 驗 section 數、`grep "data:image/png"` 驗 base64 張數），不僅看 size。本票可補 `grep -c 'class="page-section' docs/reports/K-008-visual-report.html` → 應為 5（4 success + 1 auth-required）。

---

## Code Review（2026-04-18）

Reviewer: senior-engineer agent
範圍：`frontend/e2e/visual-report.ts`（+255）、`frontend/playwright.config.ts`（拆 2 project）、`docs/reports/.gitkeep`、`docs/reports/K-008-visual-report.html`（產物 1.04 MB）、architecture.md §QA Artifacts

### Critical（必修）

**無。** 實作符合 AC-008-SCRIPT + AC-008-CONTENT；`npx tsc --noEmit` exit 0；`npx playwright test --project=chromium` 既有 45 tests 全綠，`TICKET_ID=K-008 npx playwright test visual-report.ts` 5 tests 全綠；XSS 面被 `escapeHtml` 完整覆蓋；exit code 經 `expect(failures).toHaveLength(0)` 正確反映實際狀態。

### Warning（建議修）

**W1 — `resolveTicketId()` warning 污染 default Playwright 工作流**（`visual-report.ts:88`）
模組頂層 `const TICKET_ID = resolveTicketId()` 在 Playwright collect tests 時被 import（即便 `--project=chromium` 不跑此檔），實測 `cd frontend && npx playwright test --list` stdout 就先印 `[visual-report] WARNING: TICKET_ID not set...`，混進既有 E2E 流程 log。建議：把 `resolveTicketId()` 移進 `test.beforeAll()` 或 `test.afterAll()` 內，或改為 `function` lazy 取得。模組載入階段不計算、不輸出 side effect。

**W2 — architecture.md §QA Artifacts line 425 stale（設計 vs 實作 drift）**
Architect §8 原寫：「若未來發現預設 glob 會把 visual-report.ts 拉進 e2e suite → 加 `testIgnore`」。Engineer 實測踩到「default 不吃但 CLI 指檔也被擋」第三分支，選擇 per-project testMatch 拆 2 project（非 testIgnore）。architecture.md line 425 仍保留 stale 說法。需要 Architect 更新 §QA Artifacts：
- final 決策：per-project testMatch（`chromium` / `visual-report` 兩 project）
- rationale：default testMatch + CLI file-filter 互動行為 + testIgnore 不解決 CLI 指檔問題
- 副作用說明：以後新增 spec 需確認歸 `chromium` project、新增其他 visual-report 類需新建 project 或擴 `visual-report` testMatch regex

**W3 — 模組級 `results: SectionResult[] = []` 非 test-scoped**（`visual-report.ts:72`）
若未來 `playwright.config.ts` 開啟 `retries`，或 dev 以 `--repeat-each=2` 跑，results 陣列不清空 → HTML 會出現重複 page section。目前 retries 未設，風險為潛在。建議：results 移進 `test.describe` callback 內用 `test.beforeAll()` 重置（每批 run 初始化一次）。

**W4 — `TICKET_ID` 未 whitelist，潛在 path traversal**（`visual-report.ts:85~92`）
`TICKET_ID=../../etc/passwd npx playwright test visual-report.ts` 會算出 `OUTPUT_PATH = docs/etc/passwd-visual-report.html`（已實測 `path.join` 結果）。使用者自設惡意 env var 才可觸發，threat model 低，但 2 行 validation 即可封掉：
```
const normalized = raw.replace(/^K-/i, '')
if (!/^[A-Za-z0-9_-]+$/.test(normalized)) throw new Error(`Invalid TICKET_ID: ${raw}`)
```

### Suggestion（登記技術債）

**S1 → TD-012 — `/app` 空狀態截圖報告價值低**
Engineer 已於 §「未解決 / 後續 debt」1 記錄：`/app` 因後端 ECONNREFUSED 停在 loading/空狀態，截圖高度 720。AC-008-CONTENT 技術達成（有 full-page 截圖 + route 標記），但「視覺驗收」價值為零。登記 TD-012；解法方向：啟動時 probe backend 可用性、不可用就降級為「auth-required」類 placeholder；或引入 backend fixture / mock。

**S2 — HTML 產物進版控策略（需 PM 裁決，不是 bug）**
現況：`docs/reports/K-008-visual-report.html` 1.04 MB 已 untracked，等 commit。每張 ticket 一份且含 binary-ish base64 → git diff 無意義、repo size 會線性膨脹。選項：
- (a) commit 進版控 — 方便 PR / GitHub 線上瀏覽、使用者離線看；代價 repo 膨脹
- (b) `.gitignore` 加 `docs/reports/*.html`，只保留 `.gitkeep` — repo 乾淨，需要時本地重產
- (c) 只 commit 「milestone 類」報告（PM/QA 通過 Phase 收尾時），其餘 gitignore

Reviewer 推薦 (b)，理由：`visual-report.ts` 可隨時本地重產、QA 流程已把報告路徑通知給 PM（使用者可本地開），binary 檔進 git 長期成本高於效益。需 PM 決議。

**S3 — architecture.md Pages 行與實作 drift（minor）**（`visual-report.ts:250` vs architecture.md §3）
Architect §3 HTML 設計 `Pages: 4 captured, {failures} failed`；Engineer 擴充為 `Pages: {successes} captured, {failures} failed, {authRequired} auth-required (not captured)`。擴充合理（多 auth-required 計數更準），但 architecture.md 未同步。建議 Architect 一併於 W2 修 §QA Artifacts 時補上。

**S4 — Pass items（確認通過）**
- TypeScript 型別完整（discriminated union `SectionResult`）
- XSS：`escapeHtml` 正確覆蓋 label / routePath / error message / error stack / TICKET_ID / generatedAt
- 錯誤處理：per-page try/catch + stack 前 3 行 + 不 rethrow + afterAll 聚合 exit code，正確依 Architect §6.6 設計
- `fs.mkdirSync(OUTPUT_DIR, { recursive: true })` 處理目錄不存在情境（Architect §6.5）
- 既有 4 支 spec（`pages` / `ma99-chart` / `business-logic` / `navbar`）未被污染（實測 `--project=chromium` 45 pass）
- `console.log/warn` 有 eslint-disable 註解並僅在 script / afterAll 使用，屬開發工具合理使用

### 技術債登記草案

| ID | 項目 | 優先級 | 備註 |
|----|------|--------|------|
| TD-012 | visual-report `/app` 空狀態截圖 — 後端不可用時 placeholder 降級 | 低 | 待 PM 裁決後登記 |

### PM 裁決表（Reviewer 待裁決事項）

| # | 發現 | 嚴重度 | Reviewer 建議 | 需 PM 決策 |
|---|------|--------|---------------|-----------|
| W1 | TICKET_ID warning 污染 default run | Warning | 本張 ticket 內修（移進 test scope） | 修 / 延後 |
| W2 | architecture.md §QA Artifacts stale | Warning | 召 Architect 補 per-project 決策與副作用 | 修 / 延後 |
| W3 | module-level `results` 非 scoped | Warning | 本張 ticket 內修（加 `test.beforeAll` 重置） | 修 / 延後 |
| W4 | TICKET_ID 缺 whitelist（path traversal） | Warning | 本張 ticket 內修（2 行 validation） | 修 / 延後 |
| S1 | `/app` 空狀態報告價值低 | Suggestion | 登記 TD-012 | 確認 TD-012 編號與優先級 |
| S2 | HTML 產物版控策略 | Suggestion | 推薦 (b) `.gitignore` + `.gitkeep` | 選 (a) / (b) / (c) |
| S3 | Pages 行 minor drift | Suggestion | 隨 W2 一併補 | — |

### PM 裁決（2026-04-18）

| # | 決定 | 理由 | 負責角色 |
|---|------|------|---------|
| W1 | 本票內修 | 模組頂層 side effect 污染所有 Playwright run（`--list` 都會印 warning），修法明確（移進 test scope / lazy function），成本 <5 行；留下等於每次跑既有 E2E 都被雜訊污染，debt 滾利。 | Engineer |
| W2 | 本票內修 | architecture.md 是下一個 ticket 的輸入源，stale 設計 vs 實作 drift 直接誤導後續 ticket（例如新 visual-report 類 spec 會照舊走 `testIgnore` 死路）；Architect retrospective §3 已明示此項應回補，本票不修等於前 retrospective 結論落空。 | Architect |
| W3 | 本票內修 | 雖目前 retries=0 風險未現形，但修法與 W1 同一次改動區（`visual-report.ts` 模組頂層→test scope），同時修邊際成本 0；拆到下票反而要重開 context。 | Engineer |
| W4 | 本票內修 | 採納 Reviewer 原評估（threat model 低但 2 行 validation 封掉）；凡「外部輸入 → 生成檔名」預設 whitelist 已列入 Reviewer retrospective 未來 AC 模板，這次先從本票示範落實。 | Engineer |
| S1 | 技術債 TD-012 | 根因解法（backend probe / fixture / mock）範疇超出視覺報告腳本本身，屬 `/app` 測試資料策略問題；TD-012 優先級「低」，待有相關 ticket 時一併處理（當前截圖行為已達 AC-008-CONTENT）。 | — |
| S2 | (b) `.gitignore` + `.gitkeep` | 採納 Reviewer 推薦：HTML 報告可本地重產（`npx playwright test visual-report.ts` 即得），QA 流程已把路徑通知 PM（使用者本地開即可），1 MB × N ticket 進 git 長期成本 > 線上瀏覽便利性。若未來有「milestone 歸檔」需求再議 (c)，本票先 (b)。 | Engineer |
| S3 | 隨 W2 修 | 同檔案同段落（architecture.md §3 / §QA Artifacts）單次改動成本最低；分兩次反而要 Architect 二次進場。 | Architect |

**本票剩餘工作：**
1. Engineer：修 W1（resolveTicketId 移入 test scope）/ W3（results 陣列 beforeAll 重置）/ W4（TICKET_ID whitelist 2 行 validation）+ S2 執行 `.gitignore` 設定（`docs/reports/*.html` 加 ignore，保留 `.gitkeep`，順手清掉已 untracked 的 `K-008-visual-report.html`）
2. Architect：修 W2（architecture.md §QA Artifacts 更新為 per-project testMatch 決策 + rationale + 副作用說明）+ S3（§3 Pages 行同步為 `{successes} captured, {failures} failed, {authRequired} auth-required (not captured)`）
3. 之後 → QA 回歸（Playwright full suite + visual-report script 重跑） → PM close

**排序：Engineer 先 / Architect 後。** 理由：W1/W3/W4 都在 `visual-report.ts`，Engineer 一次改完 + 跑 `npx tsc --noEmit` + `TICKET_ID=K-008 npx playwright test visual-report.ts` 驗證後，Architect 才有最終「per-project testMatch 決策 + W4 whitelist 實作」可以 reference 寫進 architecture.md；反過來 Architect 先寫可能又要 drift 修二次。

### Retrospective（Reviewer）

**沒做好：**
- `resolveTicketId()` 在模組頂層執行的 side effect 在 Architect §2.1 設計階段就可預見（「啟動時印 warning」明寫在設計裡，但沒提「啟動 = 何時」）。如果在 AC 或設計階段要求標明 side-effect 發生點（module load / beforeAll / test body），W1 就不會落到 Reviewer 才捕到。
- W4 的 path traversal 屬 env var → filesystem 的基礎安全 checklist 項，AC 條款沒規定 TICKET_ID 格式、Architect §2.1 也沒要求 validation，實作當然不會加。這是 PM AC 定義階段的覆蓋缺口（未來凡是「從外部輸入生成檔名」的 AC，應預設要求 whitelist）。

**下次改善：**
1. Review AC / Architect 設計文件時，對「模組頂層 side effect」類語句（warning / console / fs 操作）直接問「什麼時候觸發？會被誰 import？」把執行時機寫進設計。
2. 凡涉及「外部輸入（env var / URL param / file path）→ 生成檔名 / 路徑」的 AC，Reviewer checklist 加一條：驗證是否有 whitelist 或 allow-list。K-Line 未來新 ticket 應吸收到 PM 寫 AC 的模板。

---

## QA 驗收（2026-04-18）

執行者：qa agent（`~/.claude/agents/qa.md`）
範圍：AC-008-SCRIPT + AC-008-CONTENT 全量驗收 + Playwright E2E 回歸 + W1/W4/S2 修復驗證 + HTML 產物結構驗證。

### AC 逐條驗收

| AC | 結果 | 證據 |
|----|------|------|
| AC-008-SCRIPT | **PASS** | `cd frontend && TICKET_ID=K-008 npx playwright test visual-report.ts` → 5 passed (4.6s)；`docs/reports/K-008-visual-report.html` 產出（1,039,886 B），退出碼 0 |
| AC-008-CONTENT | **PASS** | HTML 結構抽樣：`grep -c 'class="page-section'` = **5**（4 success + 1 auth-required）；`grep -o 'data:image/png;base64' \| wc -l` = **4**（4 條公開路由各一張 full-page PNG）；`grep -A1 'class="route"'` 列出 5 條 `<code>` 標記：`/`、`/app`、`/about`、`/diary`、`/business-logic`；「需登入，下期補」placeholder 出現 1 次（只在 `/business-logic` section） |

### 回歸測試 6 步

| # | 指令（cwd = `frontend/`） | 結果 | 備註 |
|---|--------------------------|------|------|
| 1 | `npx tsc --noEmit` | **PASS**（exit 0） | 無型別錯誤 |
| 2 | `npx playwright test --project=chromium` | **PASS**（45 passed / 12.6s） | 既有 4 spec 全綠，無 regression |
| 3 | `TICKET_ID=K-008 npx playwright test visual-report.ts` | **PASS**（5 passed / 4.6s） | HTML 產出 1,039,886 B = 1.04 MB |
| 4 | `npx playwright test --list 2>&1 \| grep -i "TICKET_ID not set"` | **PASS**（無輸出，grep exit 1） | **W1 驗證通過**：`resolveTicketId()` 移入 `test.beforeAll()` 後，module load 階段不再印 warning |
| 5 | `TICKET_ID=../../etc/passwd npx playwright test visual-report.ts` | **PASS**（test fail with `Error: Invalid TICKET_ID: ../../etc/passwd`） | **W4 驗證通過**：whitelist regex 在 `beforeAll` 階段拒絕非法 ID，HTML 未被寫出；4 tests skipped 符合預期（beforeAll throw 中斷後續 test） |
| 6 | `git status --untracked-files=all` | **PASS** | **S2 驗證通過**：`docs/reports/K-008-visual-report.html` 不在 untracked 列表；`git check-ignore -v docs/reports/K-008-visual-report.html` 回 `.gitignore:32:docs/reports/*.html` — rule 精確命中，無 overreach；`.gitkeep` 仍列 untracked（預期行為，PR 時保留目錄結構） |

### Backend 回歸

`git -C <repo> diff --name-only HEAD -- backend/` → 無輸出。
**Backend unchanged, pytest skipped.**

### HTML 產物

| 項目 | 值 |
|------|-----|
| Path | `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/reports/K-008-visual-report.html` |
| Size | 1,039,886 B = 1.04 MB |
| Size 門檻 | ≥ 500 KB ✅；≤ 10 MB ✅（遠低於 Architect §6.3 門檻） |
| 結構 | 5 × `<section class="page-section ...">` + 4 × base64 PNG（`/`、`/app`、`/about`、`/diary`）+ 1 × auth-required placeholder（`/business-logic`） |
| Gitignore | rule `.gitignore:32:docs/reports/*.html` 精確命中，未誤傷 `dist/`、`coverage/` 等其他目錄（sampled） |

### 已知觀察（不影響本票 PASS）

1. **`/app` 截圖仍是空狀態**（height 720）— 後端 ECONNREFUSED，屬 TD-012 範圍，PM 已裁決登記為技術債不本票處理。
2. **W4 whitelist negative payload 只驗 `../../etc/passwd`** — 未測空字串 / 尾空白 / Unicode，QA 反省段已列為下次改善。
3. **HTML size 區間寬**（1.04 MB 遠低於 10 MB 門檻）— 若 future `/app` 有完整資料，4 張截圖 + base64 預估 2~5 MB，仍在 Architect §6.3 接受區間。

### 結論

**通過 — 可放行 PM close。**

所有 2 條 AC pass、6 步回歸 pass、W1/W3/W4/S2 修復驗證 pass、HTML 產出結構正確、無既有 E2E regression、backend 無改動故 pytest 跳過。建議 PM 走彙整 + close 流程。

---

## Retrospective

### PM 彙整（2026-04-18）

**跨角色重複問題：**

1. **「Architect 設計文件未寫 side-effect 執行時機 / 狀態邊界 / 配置 × run mode 矩陣」是本票多數 Warning 的共同上游根因**（Architect / Engineer / Reviewer 三角色各自獨立點出）：
   - W1：Architect §2.1 寫「啟動時印黃色警告」但沒界定「啟動」= module load 還是 test body；Engineer 照「script entry」心智模型寫成 module top-level，Reviewer 跑 `--list` 才發現污染 default E2E stdout
   - W3：Architect §3 沒把 Playwright 的 `retries` / `--repeat-each` 對 module-level state 的影響納入設計；Engineer 模組頂層 `results: SectionResult[] = []` 累積跨 run
   - W2：Architect §6.2 列「default 吃 / default 不吃」2 分支漏第 3 分支「default 不吃但 CLI 指檔也被擋」，Engineer 實測踩到後 pivot 到 per-project testMatch
   - S3：Architect §3 `Pages: 4 captured` 把 `/business-logic` placeholder 也當成 captured，狀態 × 計數矩陣沒列全
   - **共同根因：Architect 設計時用「大致正確的窮舉」而非「配置/狀態 × 執行時機 truth table」**
2. **「外部輸入 → filesystem sink 安全檢查」三層皆漏**（W4；Engineer / Reviewer 同根）：
   - PM AC 模板沒規定 TICKET_ID 格式約束
   - Architect §2.1 沒加 validation 條款
   - Engineer 思維定勢：env var 是 dev 手打 ≠ untrusted input，直接流到 `path.join` → `fs.writeFileSync`
3. **Architect 實作後 doc sync 無自動觸發機制**（W2 結構面；Architect 上一筆 K-008 設計 retrospective 已預告「下次實測」但 K-008 設計仍復發，自我標註重複違反）：Engineer 實作決策偏離 Architect 原設計（per-project testMatch / HTML counter 擴充）時，無 hook 把 Architect re-engage 做 doc sync，drift 到 Reviewer 才被動撈回
4. **QA 邊界 payload / gitignore overreach / artifact structural invariant 三項 checklist 缺口**（QA 自省，與 Reviewer「whitelist checklist 應回推 PM AC 模板」扣合）：W4 only `../../etc/passwd` 一個 payload；`.gitignore` 只驗目標檔未抽 `dist/` `coverage/`；HTML size 門檻不足以當 structural invariant

**流程改善決議：**

| 問題 | 負責角色 | 行動 | 更新位置 |
|------|---------|------|---------|
| Architect 設計未列「配置/狀態 × 執行時機」truth table（W1/W2/W3/S3 同根） | Architect | 設計文件涉及「X → Y 分支」「模組載入 / console / fs side effect」時，強制以 truth table 列全，並標明每個 side-effect 的執行時機（module load / beforeAll / test body）；無法實測者明標「Engineer 實測決策點」並列判斷條件 | `architect.md` agent spec 加「配置/狀態邊界 truth table」checklist；Architect retrospective 已記「下次改善 §1」，本次彙整要求下次 Architect 進場前 PM 核對 agent spec 有此條 |
| 「外部輸入 → filesystem sink」安全檢查三層皆漏（W4） | PM + Architect + Engineer | PM AC 模板對「env var / URL param / CLI arg → 生成檔名/路徑」場景預設寫「TICKET_ID 需 whitelist」AC；Architect 設計列 validation 條款；Engineer 實作看到 `process.env.*` 流向 `fs.*/path.*/child_process.*/URL` 立即加 `/^[A-Za-z0-9_-]+$/` 類 whitelist | PM AC 模板（`pm.md` agent spec）、`architect.md` agent spec、`engineer.md` agent spec 各自加對應 checklist（需使用者授權修 agent spec；本票先記於 per-role retrospective）|
| Architect 實作後 doc sync 無自動觸發（W2 結構；Architect 自標重複違反） | PM + Architect | Ticket close checklist 加「Engineer 實作決策偏離 Architect §N 原設計 → PM 必須 re-summon Architect 做 doc sync，不等 Reviewer 發現 drift」；Architect 交付 ticket §Architecture 時末尾加「Post-impl sync checklist」讓 PM / Engineer 有明確 trigger | K-Line `CLAUDE.md` ticket close checklist；Architect retrospective 已記（2026-04-18 W2/S3 修復後反省 §下次改善 §1），本次彙整升級為「PM 必做」而非「Architect 自選」|
| QA 邊界 payload / gitignore / artifact invariant checklist | QA | QA agent 建立固定 checklist：(a) env var / CLI 輸入類 ticket 自動跑「空字串 / 純空白 / 尾空白 / 大小寫 / Unicode / overflow 長度」6 個 payload；(b) 修改 `.gitignore` 時對 `dist/` `coverage/` `node_modules/` `docs/` 各抽 1 sample 跑 `git check-ignore -v`；(c) 每種 artifact 定義 1~3 個結構 grep 當 operational invariant 寫進 QA 驗收段 | `qa.md` agent spec；QA retrospective 已記三條「下次改善」，本次彙整確認不拆 ticket、由 QA 下次任務前自行補進 checklist |
| PM Reviewer 回饋裁決遇 Engineer + Architect 雙角色待辦時未顯性列「排序裁決」| PM | 裁決表下的「本票剩餘工作」獨立列「排序裁決」小段，明確寫三選項（A 先 / B 先 / 並行）與選擇理由；不得只在敘述中後設交代 | `pm.md` agent spec（PM retrospective 2026-04-18 K-008 W1–W4 裁決 §下次改善已記）|
| 跨票趨勢偵測（K-011 PM 彙整已預告，K-008 PM 彙整落實首次）| PM | 每次 PM 彙整時增加「掃描最近 3 張完成票的 QA retrospective」步驟，辨識同一類驗證留空的連續事件；本票實測：K-008 QA 自行補 HTML 結構抽樣驗證已封閉 K-010「截圖 script 缺」系統缺口，趨勢已收斂 | `pm.md` agent spec「自動觸發時機」表；本次彙整第一次正式執行，流程首次完整閉環 |

**本次彙整決策說明：** 上述 6 條流程改善中，(2)(3)(5)(6) 涉及修改 `~/.claude/agents/*.md` agent spec，屬於需使用者授權的制度面改動，本票先登記於各角色 per-role retrospective log 並在此彙整表存底；(1)(4) 為單票 ticket 操作規範，Architect / QA 下次進場前需先讀自身 retrospective log 並採用。PM 本次暫不擴大 scope 修 agent spec，避免違反「方案不明確時先討論再修改」memory；待使用者下次觸發相關機制時一併授權處理。
