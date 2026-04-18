# Engineer Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 engineer agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（根因 + 測試/設計為何沒覆蓋到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 Engineer 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

## 2026-04-18 — K-008 W1/W3/W4 修復後反省

**沒做好：** 無新 surprise。一次改動三個 Warning 加 `.gitignore` 落地，驗收全綠（tsc exit 0、chromium 45 全綠、visual-report 5 全綠、path traversal 正確 throw、`docs/reports/*.html` 正確被 ignore）。W1 的修法改動面比預期大一點——因為原 `renderHtml()` 直接讀模組頂層 `TICKET_ID`，要把那個 const 搬進 `test.beforeAll()` 就得順手把 `renderHtml()` 改成 `(ticketId, results)` 參數形式；但這是「把隱性耦合變顯式」的正收益，不是 surprise。

**下次改善：** 寫 Playwright spec 時第一版就該把「渲染/格式化函式」寫成 pure function 接參數（不讀 module-level state），避免之後為了 test-scoped 還要回頭 refactor 一次。已更新至前一條 Bug Found 反省的 checklist（「spec 的共享狀態放 test-scope」），下次新寫類似 spec 時就會直接採用。

---

## 2026-04-18 — K-008 W1/W3/W4 Bug Found Protocol 反省

**沒做好：**
- **W1 根因（`resolveTicketId()` 模組頂層 side effect）：** 我把 `visual-report.ts` 當「script entry」心智模型寫，預期「啟動時印 warning」= 實際執行 visual-report 時才印。但 Playwright test collection phase 會 `import` 所有符合 testMatch 的檔案，`--project=chromium` 跑 `--list` 或 default run 時雖然不會**執行**此檔案的 test body，卻會**載入 module**（這是 JS import 語意，不是 Playwright 特殊行為）。模組頂層的 `const TICKET_ID = resolveTicketId()` 因此在 default run 也被觸發，warning 進了既有 E2E 的 stdout。實作當時我沒追問「Architect §2.1 設計 `[visual-report] WARNING: TICKET_ID not set...` 這行 `console.warn` 是在什麼 scope 執行」，直接寫成 top-level。另一層：我在 K-008 Engineer retrospective 記下「per-project testMatch 解決 default 不吃 visual-report」，但只驗「test 不會跑」，沒驗「module 不會被 import」——這兩個是不同事情，前者是 test body execution、後者是 module load，per-project 只隔離前者。
- **W3 根因（模組級 `results: SectionResult[] = []` 非 test-scoped）：** 我把 results 陣列心智模型設為「一次 script 執行的 accumulator」，本機 retries=0 時一次 run 正確。沒意識到 Playwright 對同一 spec file 的 retries / `--repeat-each=N` 是在「同一 module load 內重複執行 test body」——module 只 load 一次，頂層 `const results = []` 只初始化一次，test body 每次 push 都累積到同一陣列，HTML 會出現重複 section。驗證時我沒模擬 retries 情境（`playwright.config.ts` retries 目前 0 所以沒踩到）。Playwright 文件的「test-scoped state」概念是在 `test.beforeAll/beforeEach` callback 內初始化，我直接寫模組頂層等於跨 run 共享——這是 Playwright spec 慣例我沒放進 mental checklist。
- **W4 根因（`TICKET_ID` env var 無 whitelist，path traversal）：** 我把 `process.env.TICKET_ID` 視為「開發者自己打指令傳進來的 trusted 字串」，完全沒把它當作「外部輸入 → filesystem sink（`path.join` → `fs.writeFileSync`）」的 tainted source 對待。思維定勢：env var 是 dev 手打，不是網路來的 request → 不需要 validate。但 input sanitization 的判準不該是「誰打的」，而是「這個值流到哪」——`path.join(OUTPUT_DIR, 'K-${TICKET_ID}-visual-report.html')` 一旦含 `..` 就是 path traversal sink，與 user input 來源無關。AC 與 Architect §2.1 都沒寫「TICKET_ID 格式限制」，我實作時也沒補這層；Architect retrospective §2 已把「外部輸入 → 生成檔名」列為 AC 模板未來必加項，代表此缺口在設計階段就該攔。

**下次改善：**
1. **寫 Playwright spec 時，module top-level 只放 `const`、`type`、純函式定義**——任何 `console.*` / `fs.*` / 呼叫會有 side effect 的 function（包括讀 env var 並印 warning），一律包進 `test.beforeAll()` 或 `test(...)` body 內。寫之前自問：「這行如果在 `--list` 或其他 project 載入時執行會怎樣？」有疑問就不放 top-level。
2. **Playwright spec 的共享狀態（accumulator / counter / cache）一律放 `test.describe` closure 內並用 `test.beforeAll` 重置**，不放 module 頂層。寫之前自問：「若 retries=2 或 `--repeat-each=3` 這個變數會怎樣？」——沒把握就 beforeAll reset。Checklist 項：`grep -E '^(const|let) .* = \[\]$' *.ts` 掃模組頂層陣列/map，轉 test-scoped。
3. **任何 `process.env.*` 流向 `fs.*` / `path.*` / `child_process.*` / `URL` 的值，實作當下立即加 whitelist/allow-list validation**，不拖到 Reviewer 階段。固定 pattern：
   ```ts
   const raw = process.env.X
   if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error(`Invalid X: ${raw}`)
   ```
   Checklist：新增 env var 讀取點時，追蹤該變數的所有 downstream 使用，若有 filesystem / shell / URL 操作就加 validation。

---

## 2026-04-18 — K-008 Visual Report script

**做得好：** 實作前先跑 `npx playwright test --list` 驗 Architect §6.2「default 吃不吃 visual-report.ts」的預設假設，發現 default 不吃（45 tests 乾淨）；但隨後踩到未列入的第三分支「CLI 指檔也被 default glob 擋掉」，及時 pivot 到 per-project testMatch（`chromium` only `*.spec.ts` / `visual-report` only `visual-report.ts`），沒硬改 default 規則污染既有 E2E。
**沒做好：** 第一次寫 `visual-report.ts` 用 `__dirname` / `path.resolve(__dirname, ...)`，沒先查 `package.json "type": "module"`，跑 `--list` 才吃 `ReferenceError: __dirname is not defined in ES module scope`。根因：我把「Playwright test 檔」潛意識當成 CJS 寫，忽略 frontend/ 是 Vite ESM 專案；`@playwright/test` 內部編譯遵循 package.json 的 module 設定。Architect §3 只給 HTML 結構不限 runtime module 型別，設計面沒覆蓋到 runtime-native 的 ESM 限制。
**下次改善：**
1. 新增 `.ts` 到 Node runtime 執行（script / playwright spec / vite plugin）時，開頭先查 `package.json` 的 `type` 欄位；`"module"` 一律用 `fileURLToPath(import.meta.url)` 寫法，不用 `__dirname`。
2. 實作 Playwright spec/runner 分岔時，先在骨架階段用 `--list` 雙向驗收：「默認 run 不吃」+「CLI 指檔能吃」兩端都對，不等截圖階段才發現 glob 問題。
3. 實測發現 Architect §6.2 風險條款漏了分支（CLI 指檔被 default glob 擋 → 需 per-project testMatch），已在 ticket Engineer 段登錄，轉交 Architect 補 knowledge；下一張類似 ticket 不再踩。

---

## 2026-04-18 — K-011 LoadingSpinner 文案中性化

**做得好：** 動手前先 `Grep "Running prediction"` 全專案盤出所有相依處（unit test / E2E / PRD / .pen / architecture.md），確認只有 PredictButton.test.tsx 一處有斷言，且 PredictButton callsite 保留原文案 → test 零改動，避開 Test Escalation Rule。
**沒做好：** Ticket 標示 callsite 為 `frontend/src/components/DevDiarySection.tsx`，實際在 `home/` 子目錄；首次 Read 報 404 才 Grep 修正。根因：我信任 ticket 路徑直接 Read 而非先 Grep 驗證，違反「聲稱檔案不存在前先查根目錄」memory 的延伸精神（信任外部提供的路徑也該先驗）。
**下次改善：** 接到票第一步固定 `Grep "<主組件名>"` 列出實際 import 路徑，再比對 ticket 預期異動檔案清單；不一致立即回報 PM，不自行默修。

---

## 2026-04-18 — K-009 1H MA history fix

**做得好：** 先寫 failing test（monkeypatch `main.find_top_matches` 攔截 `ma_history` 做 identity 斷言），確認 None 真的出現再動生產碼；不涉及 PRD 業務規則，避開 Test Escalation Rule。fix 保留原 1D 分支不動，1H 分支顯式多傳 `ma_history=_history_1d`，盡量縮小 diff。
**沒做好：** `find_top_matches()` 的 `ma_history is None → ma_history = history` 靜默 fallback 是此 bug 根因，但修復僅補 caller，不動 signature（PM/Architect 已裁決維持選填）。未來類似 caller 忘記傳還是會中招，單靠此 regression test 鎖不住所有 call site。
**下次改善：** 之後若新增 `find_top_matches()` caller（或改簽章讓 ma_history 必填），同步在 predictor 層補 assert/log；目前已在 ticket Retrospective 記錄此技術債由 Architect 日後決策。

---

## 2026-04-18 — K-010 Vitest AppPage 修復

**做得好：** 先跑 `npm test -- --run` 確認失敗點，再讀 MainChart 原始 DOM 才下手改 test + 加 `data-testid`，不靠猜。
**沒做好：** 原 test「display mode toggle does not trigger API recompute; predict always uses timeframe 1H」描述的是已消失的 right-panel display toggle（dual-toggle 架構），與 MainChart timeframe toggle 行為完全不同。單純改 selector 無法讓斷言通過 — 我初版只改 selector 導致 `/api/merge-and-compute-ma99` 誤觸發斷言。之後才重寫 test 意圖反映當前單一 timeframe toggle。這類過時斷言在上一輪 UI 重構（移除 right-panel toggle）時就該同步清掉，留到 K-010 才處理代表 CR 當時只看 tsc 沒跑 vitest。
**下次改善：** UI 結構調整 PR 的 CI 必含 `npm test`；Engineer 實作時發現刪掉某 UI 元件，主動 grep `__tests__` 目錄該元件名稱，一併更新 test 或在 ticket 裡標示後續要修的斷言。

<!-- 新條目從此處往上 append -->
