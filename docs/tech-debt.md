# K-Line Prediction — 技術債登記簿

集中記錄 PM 裁決為「不立刻修、之後再排」的技術債。每條由 Code Review / Retrospective 產出，PM 確認後寫入此檔。

未取得 PM 裁決前，Code Reviewer / Engineer 不得擅自搬入此檔。

---

## 索引

| ID | 項目 | 來源 | 優先級 | 登記日期 |
|----|------|------|--------|---------|
| TD-001 | 前端 bundle 過大（K-003 已完成主體，餘量監控） | K-003 retrospective | 低 | 2026-04-16 |
| TD-002 | 後端測試覆蓋率不足（K-001 已 closed 餘項） | K-001 retrospective | 中 | 2026-04-16 |
| TD-003 | Upload history 模組全域變數無同步，併發 race | 2026-04-18 Codex review P2-A | 中 | 2026-04-18 |
| TD-004 | MatchList PredictorChart effect deps 不含實際 candle values | 2026-04-18 Codex review P2-B | 中 | 2026-04-18 |
| TD-005 | `frontend/src/AppPage.tsx` 責任過多，建議抽 3 個 hook + presentational sub-sections | 2026-04-18 Codex review Modularity | 中 | 2026-04-18 |
| TD-006 | `backend/main.py` 混雜 FastAPI 路由 / CSV parsing / 狀態管理 / 持久化 / 預測編排 | 2026-04-18 Codex review Modularity | 中 | 2026-04-18 |
| TD-007 | `backend/predictor.py` 模組過廣，建議拆 `predictor_ma` / `predictor_similarity` / `predictor_stats` | 2026-04-18 Codex review Modularity | 中 | 2026-04-18 |
| TD-008 | Cross-layer：consensus/stats 前後端各算一次，有漂移風險 | 2026-04-18 Codex review | 高 | 2026-04-18 → K-013 |
| TD-009 | Vitest index-based selector 殘留（AppPage + OHLCEditor）| 2026-04-18 K-010 review W1/W2 | 低 | 2026-04-18 → K-014 |
| TD-010 | `predictor.find_top_matches()` `ma_history` 靜默 fallback（K-009 根因） | 2026-04-18 K-009 review S1 | 中 | 2026-04-18 → K-015 |
| TD-011 | `frontend/design/homepage.pen` 仍含 `Running prediction...` 文字節點（K-011 drift） | 2026-04-18 K-011 review Drift C | 低 | 2026-04-18 |
| TD-012 | visual-report `/app` 空狀態截圖價值低 — 後端不可用時 placeholder 降級 | 2026-04-18 K-008 review S1 | 低 | 2026-04-18 |
| TD-013 | GA4 initGA() 無冪等保護 + dataLayer 型別 + 未知路由無 warn（S2/S3/S4） | 2026-04-19 K-018 review S2–S4 | 低 | 2026-04-19 |
| TD-K021-01 | 部分頁面 `font-mono` 仍用 Tailwind 預設，未全面遷 K-021 `mono` (Geist Mono) token | K-021 Engineer retro | 低 | 2026-04-20 |
| TD-K021-02 | UnifiedNavBar 保留 6 處 hardcode hex（PM Q2 既有斷言 vs 使用者 prompt「嚴禁 hardcode」衝突） | K-021 Reviewer W-3 | 中 | 2026-04-20 → K-025 |
| TD-K021-07 | AppPage `h-screen overflow-hidden` + HomeFooterBar 在 <900px viewport 可能擠壓 predictor | K-021 Reviewer W-1 | 低 | 2026-04-20 |
| TD-K021-08 | HomeFooterBar `email / github / LinkedIn` 未包 `<a>` 錨點 | K-021 Reviewer S-1 | 低 | 2026-04-20 |
| TD-K021-09 | `/` route NavBar inactive color 未於 navbar.spec.ts 斷言 | K-021 Reviewer S-2 | 低 | 2026-04-20 |
| TD-K021-10 | DiaryPage `font-mono` 既有 Tailwind default，K-024 時再評估是否改 `font-mono` (Geist Mono) token | K-021 Reviewer S-5 | 低 | 2026-04-20 |
| TD-K021-11 | PasswordForm button 保留 `bg-purple-600 text-white`（Q1 使用者裁決保留），未遷 `bg-brick` token | K-021 Reviewer Round 3 S-R3-02 | 低 | 2026-04-20 |
| TD-K021-13 | PasswordForm `expiredMessage` 用 `text-yellow-400`，在米白底（`#F4EFE5`）對比 ~2.4:1，不達 WCAG AA | K-021 Reviewer Round 3 S-NEW-1 | 中 | 2026-04-20 |

---

## TD-003 — Upload history 併發 race

**來源：** Codex code review 2026-04-18 P2-A

`backend/main.py` 以 module globals 儲存 `_history_1h` / `_history_1d`，`upload_history_file()` 的 read-merge-write-swap 流程無同步機制。

**風險：** 併發上傳可能遺失 bars；last writer 覆蓋其他 request 的 merge 結果；多 worker 部署時風險放大。

**PM 裁決（2026-04-18）：** 目前部署為單使用者、單 worker，併發機率低；先列技術債。若未來切到多 worker 或開放多使用者上傳，立即升級為 P1 ticket。

**建議解法（Architect 介入前先 RFC）：**
- Option A：加 `asyncio.Lock` 包住 update/write flow
- Option B：抽 `history_repository` 層，內部做 atomic write + 鎖

排期觸發條件：多 worker 部署決議時、或 TD-006（backend/main.py 拆分）啟動時一併處理。

---

## TD-004 — PredictorChart effect deps 不全

**來源：** Codex code review 2026-04-18 P2-B

`frontend/src/components/MatchList.tsx` 的 `PredictorChart` useEffect 依賴為 `startDate` / `timeframe` / array lengths，不含實際 candle values。若 rerun prediction 回傳相同長度但不同內容的 bars，展開中的 card 可能顯示舊 chart。

**PM 裁決（2026-04-18）：** 目前使用者實際操作路徑不常觸發（多數情境下切 timeframe 或 startDate 會變），但設計上有 bug；可接受現狀一小段時間，與 TD-005（AppPage 拆分）同梯次處理。

**建議解法：** Effect deps 改成 memoized chart input（或 data identity hash），順便移除 exhaustive-deps suppression。

---

## TD-005 — AppPage.tsx 責任過多

**來源：** Codex code review 2026-04-18 Modularity

`frontend/src/AppPage.tsx` 同時承擔 official CSV parsing / upload workflows / MA99 loading / prediction orchestration / derived statistics / selection state / layout composition。

**PM 裁決（2026-04-18）：** 目前可運作，不緊急；但下一個 UI 相關 feature 開始前必須先做此拆分，避免進一步累積。

**建議解法（Architect 介入前先 RFC）：**
- `useOfficialInput()`
- `useHistoryUpload()`
- `usePredictionWorkspace()`
- 左右兩欄 rail 抽為 presentational sub-sections

排期觸發條件：下一張 `/app` UI 相關 ticket 開啟前。

**Architect 段（2026-04-18）：** 需 Architect RFC（排 TD-008 後）。拆分時 `usePredictionWorkspace()` 會受 TD-008 決議影響（consensus/stats 抽出後 hook 邊界會改變），順序：**TD-008 RFC 定案 → TD-005 RFC → 實作**。

---

## TD-006 — backend/main.py 拆分

**來源：** Codex code review 2026-04-18 Modularity

`backend/main.py` 混雜 FastAPI wiring / CSV parsing / 狀態管理 / 持久化 / 預測 orchestration / fallback 路由。

**PM 裁決（2026-04-18）：** 與 TD-003、TD-007 形成後端重構梯次；優先順序在 UI 修復（K-009/010/011/012）之後。

**建議解法（Architect 介入前先 RFC）：**
- `history_repository.py`
- `history_service.py`
- `prediction_service.py`
- `main.py` 僅保留薄路由層

**Architect 段（2026-04-18）：** 需 Architect RFC（排 TD-008 後）。TD-003（併發 race）建議併入同 RFC 一起解（`history_repository` 層可同時處理 atomic write + lock）。

---

## TD-007 — predictor.py 拆分

**來源：** Codex code review 2026-04-18 Modularity

`backend/predictor.py` 含時間 normalize / MA99 helpers / similarity scoring / trend classification / 1D 聚合 / stats generation。

**PM 裁決（2026-04-18）：** 與 TD-006 為同梯次。

**建議解法：**
- `predictor_ma.py`
- `predictor_similarity.py`
- `predictor_stats.py`
- `predictor.py` 留作 orchestration entrypoint

**Architect 段（2026-04-18）：** 需 Architect RFC（排 TD-008 後）。TD-008 若採 Option C，`compute_stats` 會被 contract test 鎖定，拆進 `predictor_stats.py` 時 fixture 需同步遷移。RFC 順序：**TD-008 → TD-007**。

---

## TD-008 — Cross-layer 重複計算

**來源：** Codex code review 2026-04-18

projected future bar aggregation / stats derivation / time aggregation 前後端各有一份實作，容易長期漂移。

**PM 裁決（2026-04-18）：** 標記為「高優先技術債」。不立刻動，但在 TD-005 + TD-006 動之前必須先決定 single source of truth（推薦：統一在 backend 算好 payload，frontend 純 render）。

**Architect 段（2026-04-18）：** RFC 草案已產出於 [`docs/designs/TD-008-rfc-consensus-source-of-truth.md`](designs/TD-008-rfc-consensus-source-of-truth.md)。列出 Option A（backend only）/ B（frontend only）/ C（shared schema + contract test），**推薦 Option C**（UX 不退步 + CI 鎖漂移 + API 向後相容）。待 PM 裁決後開 K-XXX ticket 實作。

**PM 裁決（2026-04-18）：**

| 項目 | 裁決 |
|------|------|
| 方案 | 接受 **Option C**（shared schema + 前端算 subset + 後端算全集 + contract test） |
| Open Q1：fixture 路徑 | 接受推薦 A — `backend/tests/fixtures/stats_contract_cases.json`（不新增 `shared/` 目錄層級，前端測試以 relative path 讀取） |
| Open Q2：CI contract drift job | **暫緩**，下個 phase 再加；本 cycle 靠 PR reviewer 人工把關 + 兩端跑 fixture 時自動失敗作為安全網 |
| 負責人 | Engineer（實作）、senior-engineer agent（code review） |
| 對應 ticket | [K-013](tickets/K-013-consensus-stats-contract.md) |
| RFC status | `draft` → `accepted`（見 RFC 底部 PM 裁決段） |

**排期順序（PM 確認後版本）：**
1. 先做 K-010（CI 安全網修復，最小改動）
2. 接著 K-009（1H 正確性 bug，優先級最高但範圍聚焦）
3. K-011 / K-012（UX 清理 + E2E 斷言補齊）
4. K-013（TD-008 實作，改動最大放最後，含 contract test 鎖漂移）
5. K-013 驗收後，再啟動 TD-005 / TD-006 / TD-007 拆分 RFC

---

## TD-009 — Vitest index-based selector 殘留

**來源：** K-010 senior-engineer review W1/W2（2026-04-18）

以下位置仍使用 `getAllBy...()[N]` 形式的 index-based selector，未來對應組件結構微調（OHLCEditor 欄位順序、AppPage input layout）即可能脆化：

- `frontend/src/__tests__/AppPage.test.tsx` line 66 / 86 / 89 / 92 — `getAllByPlaceholderText('Open')[0]`
- `frontend/src/__tests__/OHLCEditor.test.tsx` line 25 — 同型斷言

**風險：** 當前非 red，但屬於 AC-010-ROBUST 同型問題；若 OHLCEditor 未來加入第二個 Open 類輸入（例如預留 bar 編輯或第二層 form）即破。

**PM 裁決（2026-04-18）：** 低優先技術債。理由：
- 當前 suite 全綠，不 block merge gate
- 修法明確（改 accessible name / `data-testid`），fix 成本低但無立即價值
- OHLCEditor 下一次結構改動前一併清理成本最低（同一輪 test 改寫）

**建議解法：** 替換為 `getByLabelText` / `getByRole({ name, exact })` / `data-testid`；同時補上 accessible name 以兼顧 a11y。

**觸發排期條件：** OHLCEditor 或 AppPage 上傳區下一次 UI 結構改動開啟 ticket 時，在同一 ticket 捎帶清理；或獨立由 K-014 背景批次處理。

**對應 ticket：** [K-014](tickets/K-014-vitest-index-selector-cleanup.md)

---

## TD-010 — predictor `find_top_matches()` ma_history 靜默 fallback

**來源：** K-009 senior-engineer review 2026-04-18 Suggestion S1

`backend/predictor.py` `find_top_matches()` 含 `if ma_history is None: ma_history = history` 靜默回退。K-009 bug 能溜到 production 的根因即此：`backend/main.py` 1H 路徑未傳 `ma_history`，`find_top_matches()` 默默用 1H history 當 30-day MA 資料，結果 filter / correlation 錯誤但無任何 log / error。

**風險：** 未來任何新增 `find_top_matches()` caller 只要忘記傳 `ma_history`，都會重蹈 K-009 覆轍。K-009 regression test 只鎖當下 1H call site 行為，不保護未來新 caller。編譯期 / linter / test suite 皆無法自動攔截漏傳。

**PM 裁決（2026-04-18）：** 列技術債，不併入 K-009 scope。理由：
- K-009 regression test 已鎖當下行為，非 active bug
- 改 signature 等於動 public API，屬 predictor 層重構範疇，應與 TD-007（`predictor.py` 拆分）同梯次處理
- K-013（TD-008 Option C）落地後 contract test 基礎完備，此時實作 Option A 成本最低
- 立刻併 cycle #2 會拖 K-011/012/013/008/014 整條 pipeline

**建議解法（Architect RFC 前草案，見 K-015）：**
- Option A：`ma_history` 改 required keyword-only 參數（推薦 — 編譯期攔截，零 silent fallback）
- Option B：保留選填但入口 assert（test raise）+ warning（prod log）

**排期觸發條件：** K-013 驗收後 / TD-007 RFC 啟動時一併處理。若中途有新 `find_top_matches()` caller，升級為 P1。

**對應 ticket：** [K-015](tickets/K-015-find-top-matches-ma-history-required.md)

---

## TD-011 — homepage.pen 設計稿 spinner 文字節點未同步 K-011

**來源：** K-011 code review 2026-04-18 Drift C

`frontend/design/homepage.pen` 內仍含 `Running prediction...` 文字節點，與 K-011 改動後的 `LoadingSpinner` + `label?: string` prop 行為不一致。

**風險：** 低 — `.pen` 檔為設計快照，不參與 build / runtime；但下次 Designer agent 進場做 UI 調整時，若以此為基準會複製過期文案到新稿。

**PM 裁決（2026-04-18）：** Designer agent 專屬範圍，需 Pencil MCP 操作 + `get_screenshot` 視覺驗證，與 Engineer 工具鏈不同；不升級為 ticket，記為技術債等下次 Designer 進場（例如 K-008 Visual Report 或未來 UI 重新設計 ticket）時順帶同步。

**建議解法：**
- Designer agent 以 `batch_design` 更新對應文字節點：
  - Option A：若設計稿表達的情境為「Predict 流程」，保留英文文案，但改為通用佔位（如 `[loading label]`）
  - Option B：直接反映新實作，各 callsite 對應畫面改為情境文案（中文「載入日記中…」/「載入內容中…」/ 保留英文「Running prediction...」於 PredictButton 畫面）
- 更新後用 `get_screenshot` 截圖 review 送回 PM 驗收

**排期觸發條件：** 下次 Designer agent 任何進場時一併處理；若 3 個月內無 Designer 進場，升級為獨立小票。

---

## TD-012 — visual-report `/app` 空狀態截圖價值低

**來源：** K-008 senior-engineer review 2026-04-18 Suggestion S1

`frontend/e2e/visual-report.ts` 執行時 `/app` 路由因後端 ECONNREFUSED（E2E 環境無 backend）停在 loading / 空狀態，截圖高度 720。AC-008-CONTENT 技術要求（full-page 截圖 + route 標記）達成，但此張截圖之於「視覺驗收」的價值近乎零。

**風險：** 低 — 不影響 script 運作、不影響其他 3 張 route 截圖。純資訊密度問題：使用者拿到 HTML 報告翻到 `/app` section 只看到空狀態 loading，無法判斷實際頁面功能是否回歸。

**PM 裁決（2026-04-18）：** 登記為低優先技術債。理由：
- 非 active bug，AC-008-CONTENT 仍通過
- 解法範疇超出 K-008 scope（涉及 backend probe 策略 / E2E fixture / mock 選型）
- 當前 3 張其他 route 截圖（`/`、`/diary`、`/about`）已能承擔大部分視覺驗收
- 修成本中等但立即收益有限，等有相關 ticket（例如 visual-report v2 / `/app` E2E 擴充）時一併處理

**建議解法方向（Architect RFC 前草案）：**
- Option A：script 啟動時 probe backend 可用性（`fetch /api/health` timeout 2s），不可用就把 `/app` route 標為 `auth-required` / `backend-unavailable` 類 placeholder，不進 captured count
- Option B：引入 backend fixture 或 mock server（MSW / local FastAPI 固定 payload），讓 `/app` 可跑到實際畫面
- Option C：降級為「跑 `/app` 前先登入 + 上傳 mock CSV」的完整 E2E 前置流程（重，不推薦）

**排期觸發條件：** 下次 visual-report 相關 ticket、或 `/app` E2E 覆蓋擴充時併入處理。

---

## TD-013 — GA4 initGA() 無冪等保護 + dataLayer 型別不精確 + 未知路由無 warn

**來源：** K-018 senior-engineer review 2026-04-19 S2/S3/S4（三條合入同一 TD）

**S2 — initGA() HMR 重載可能雙重注入：** `initGA()` 未檢查 `window.gtag` 是否已存在；HMR 重載時可能二次插入 `<script src="gtag.js">`，造成開發環境 dataLayer 事件重複推送。生產環境 GA4 gtag.js 本身有去重機制，不影響線上資料準確性。

**S3 — dataLayer 型別不精確：** `window.dataLayer` 宣告為 `unknown[]`，實際每個元素是 `unknown[]`（Array）；改為 `unknown[][]` 可提升 IDE 型別提示精度。純 DX 改善，無 runtime 影響。

**S4 — 未知路由無 console.warn：** pageview 追蹤的 switch 包含 fallback，未知路由靜默 fallback 到 `document.title` 而不發 warn，debug 時難察覺 title 未正確對應路由。

**PM 裁決（2026-04-19）：** 三條均為低優先技術債。理由：
- S2 不影響生產正確性，僅開發體驗；加冪等保護成本低但無立即驗收場景
- S3 純型別精化，linter 不報警，不阻礙測試
- S4 無需求 AC 對應，當前所有支援路由均有 case；未知路由目前不存在 SPA 正常操作路徑

**建議解法：**
- S2：`initGA()` 開頭加 `if (window.gtag) return;` 冪等 guard
- S3：`window.dataLayer: unknown[][]`
- S4：`default` case 加 `console.warn(\`[GA] Unknown route: ${path}\`)`

**排期觸發條件：** 下次 GA 相關 ticket（例如 SPA pageview E2E、GA 設定重構）時一併清理；或獨立由後續 DX 清理 ticket 處理。

---

## TD-K021-01 — 部分頁面字型未遷 mono token

**來源：** K-021 Engineer retrospective 2026-04-20

部分元件仍使用 Tailwind 預設 `font-mono`（不綁定 Geist Mono CDN 字型），未全面遷至 K-021 theme `mono` token。Architect 設計文件已列為漸進遷移。

**PM 裁決（2026-04-20）：** 低優先。理由：既有 `font-mono` 在 Tailwind 預設會 fallback 至 monospace 系統字，視覺差異小；本票 AC-021-FONTS 只要求 `font-mono` computed fontFamily 含 "Geist Mono"，token 已註冊，實際 class 遷移屬漸進式 cleanup。

**排期觸發條件：** K-022 / K-023 / K-024 頁面改版時順手遷移。

---

## TD-K021-02 — UnifiedNavBar hardcode hex（→ K-025）

**來源：** K-021 Reviewer 合併報告 W-3（2026-04-20）

`UnifiedNavBar.tsx` 保留 6 處 hex（`text-[#9C4A3B]` 等）、`navbar.spec.ts` 8 處 regex 斷言——PM Q2 裁決允許保留以避免 K-005 既有斷言回歸，但與使用者 prompt「嚴禁 hardcode hex」衝突。

**PM 裁決（2026-04-20）：** 開 follow-up ticket K-025 獨立處理。理由：(a) K-021 AC-021-NAVBAR 明文允許 `text-[#9C4A3B]` 或 `text-brick-dark`（編譯後 CSS 相同）；(b) 一次改 NavBar + spec 8 處屬獨立工作單元，塞本票污染 fix-now 批次；(c) 使用者 prompt「嚴禁 hardcode」為未來規範，需正式開票裁決適用範圍。

**對應 ticket：** [K-025](tickets/K-025-navbar-hex-to-token.md)

---

## TD-K021-07 — AppPage <900px viewport 擠壓

**來源：** K-021 Reviewer 合併報告 W-1（2026-04-20）

AppPage `h-screen overflow-hidden` + 新加 HomeFooterBar，<900px viewport 下 predictor panel 可能被擠壓。Engineer 驗證僅 1280×800。

**PM 裁決（2026-04-20）：** 低優先 tech-debt。理由：AppPage design §8.1 明載「不做 mobile 截圖，AppPage 本即非 mobile 友好」；TD-K021-04 `/app` redesign 同族，併入未來 K-025 後續 AppPage redesign ticket（暫以「TD-K021-04 觸發時一併處理」記）。

**建議解法：** HomeFooterBar 改 `flex-shrink-0` + AppPage 增 `min-h-0` scroll container；或加 900×600 viewport Playwright case 作為 smoke。

**排期觸發條件：** TD-K021-04 AppPage redesign ticket 啟動時併入。

---

## TD-K021-08 — HomeFooterBar 文字無 `<a>` 錨點

**來源：** K-021 Reviewer 合併報告 S-1（2026-04-20）

`HomeFooterBar` 的 `email / github / LinkedIn` 三項為純文字，未包 `<a href>` 錨點，無法點擊跳轉。

**PM 裁決（2026-04-20）：** 低優先。K-021 AC-021-FOOTER 僅規範「單行資訊列」文字斷言，未要求 clickable link。Visitor 可手動複製，非阻塞 UX。

**排期觸發條件：** K-025 或任一 UI polish ticket 順手處理。

---

## TD-K021-09 — /` route navbar inactive color 未斷言

**來源：** K-021 Reviewer 合併報告 S-2（2026-04-20）

`navbar.spec.ts` 對 `/` 路由未斷言 inactive 項（App / Diary / About）color 為 `#1A1814/60` 或對應 muted token。AC-021-NAVBAR 只要求 active 項，未覆蓋 inactive。

**PM 裁決（2026-04-20）：** 低優先。當前 AC 未明文要求 inactive 色，本票不擴 scope；併 K-025 navbar 改寫時補斷言。

**排期觸發條件：** K-025 或後續 navbar 改動 ticket。

---

## TD-K021-10 — DiaryPage font-mono 未改 mono token

**來源：** K-021 Reviewer 合併報告 S-5（2026-04-20）

DiaryPage 內 `font-mono` 用 Tailwind 預設，未綁 Geist Mono CDN。K-024 處理 diary 結構重做時一併評估。

**PM 裁決（2026-04-20）：** 低優先。K-024 票負責。

**排期觸發條件：** K-024 啟動。

---

## TD-K021-11 — PasswordForm button 保留 purple 未遷 brick token

**來源：** K-021 Reviewer Round 3 S-R3-02（2026-04-20）

`frontend/src/components/business-logic/PasswordForm.tsx:37` 保留 `bg-purple-600 text-white`。K-021 Q1 使用者裁決暫不動（避免影響登入現況），但 `design doc §6` 的 paper palette 僅含 `brick` / `brick-dark` 作為主色 accent，purple 屬 non-token 非系列色。

**風險：** 低 — 登入入口視覺與 design system 脫鉤，但功能運作正常；未來若 PasswordForm 整體重構時屬「設計決策的一次性遷移」範疇。

**PM 裁決（2026-04-20）：** 登低優先 tech debt。Q1 裁決保留為「本票不動」，TD 紀錄「未來一次性遷 `bg-brick`」的預期動作，避免三個月後新開發者再誤以為 purple 是有意保留。

**建議解法：** 整批 PasswordForm 重構或 `/business-logic` 頁面結構改版票啟動時，把 button 改為 `bg-brick hover:bg-brick-dark text-paper` + 同步 AC 斷言。

**排期觸發條件：** `/business-logic` 頁面結構改版 ticket 啟動時併入；或 3 個月內無 scope 觸發時獨立開小票。

---

## TD-K021-13 — PasswordForm expiredMessage 對比不足

**來源：** K-021 Reviewer Round 3 S-NEW-1（2026-04-20）

`frontend/src/components/business-logic/PasswordForm.tsx:20` 的 `expiredMessage` 文字使用 `text-yellow-400`（約 `#FACC15`），在 K-021 全站米白底（`#F4EFE5`）上對比度約 2.4:1，未達 WCAG AA 標準（normal text 4.5:1）。K-017 時 PasswordForm 在深色底，此顏色合理；K-021 body 米白化後遺留。

**風險：** 中 — 影響「session expired」提示文字可讀性，登入流程的錯誤訊息若使用者未看見將誤判「無法登入」。accessibility 問題，非純視覺議題。

**PM 裁決（2026-04-20）：** 中優先 tech debt。理由：
- 非 active bug（訊息仍渲染，只是對比低）
- 本票 fix-now 已超載，Round 3 不再擴 scope
- 修法明確（改 `text-amber-700` 或 `text-brick-dark`，WCAG AA ≥4.5:1）

**建議解法：** `text-yellow-400` → `text-amber-700`（對比 ~5.8:1）或 `text-brick-dark`（對比 ~6.2:1，與 design system 一致）。測試建議：加 `@axe-core/playwright` 掃整站 accessibility。

**排期觸發條件：** TD-K021-11 同族（`/business-logic` 頁面結構改版）一併處理；或 K-022 /about 改版時順手掃相關 shared primitive。

---

## 更新規則

- 新增技術債：先由 Code Reviewer 整理列單 → PM 逐條裁決 → 寫入本檔
- 從技術債升級為 ticket：同時開 K-XXX ticket，在本表標註 `→ K-XXX` 後歸檔「已轉 ticket」區
- 關閉技術債：ticket closed 後，在本表末尾「已結案」區保留紀錄（含 ticket 連結）
