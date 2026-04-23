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
| TD-K027-01 | diary-mobile.spec.ts TC-007 只測 1280px；AC-027-DESKTOP-NO-REGRESSION 要求 1024/1280/1440px 三 viewport | K-027 Reviewer I-002 | 低 | 2026-04-21 |
| TD-K027-02 | diary-mobile.spec.ts `.px-4.pb-4` 定位器脆弱，K-024 結構重寫後將靜默失效 | K-027 Reviewer N-001 | 低 | 2026-04-21 |
| TD-K027-03 | milestone title overflow 屬性未驗（AC-027-TEXT-READABLE 含此要求但 spec 缺斷言）；flex-col 下實際截斷場景極低 | K-027 Reviewer N-003 | 低 | 2026-04-21 |
| TD-K027-04 | `assertLastCardVisible` 的 `waitForTimeout(200)` hardcoded sleep；CI 慢機器潛在不穩定；改 `toBeInViewport()` 須重構邏輯，目前 7 tests 全過 | K-027 Reviewer R2 I-R2-01b | 低 | 2026-04-21 |
| TD-K022-01 | `font-italic` fontFamily class 與 `italic` font-style class 命名易混淆；應 rename `fontFamily.italic` → `fontFamily.newsreader` | K-022 Breadth Review I-2 | 低 | 2026-04-21 |
| TD-K022-02 | `SectionLabel` 殭屍 colorMap（purple/cyan/pink/white）保留向後相容，K-026 確認 AppPage 也不用後一次清除 | K-022 Breadth Review I-3 | 低 | 2026-04-21 → K-026 後清理 |
| TD-K030-01 | `AppPage` interaction regression E2E coverage 缺（PredictButton sticky 定位、OHLC edit 互動未有 Playwright 斷言）| K-030 Code Review I-1 | 低 | 2026-04-21 |
| TD-K030-02 | `UnifiedNavBar` `renderLink` 本地 type alias 結構為 `typeof TEXT_LINKS[number]` 子集，應改用 `typeof` 派生型別避免 drift | K-030 Code Review M-3 | 低 | 2026-04-21 |
| TD-K030-03 | `visual-report.ts` 未帶 `TICKET_ID` env var 時應 throw 而非 fallback `K-UNKNOWN`，避免 full Playwright suite 靜默汙染 `docs/reports/` | K-030 QA retro | 中 | 2026-04-21 |
| TD-K030-04 | `frontend/public/diary.json` K-021/K-022/K-023 遺留繁中條目違反 `feedback_diary_json_english` 英文硬規則 | K-030 QA retro | 中 | 2026-04-21 |
| TD-K029-01 | `about-v2.spec.ts` L474 / L487 Outcome / Learning label Playwright selector 使用 `locator('span', { hasText: 'Outcome' })` / `hasText: 'Learning'`；label copy 當下鎖定安全，但未來 data 彈性可能造成 sibling `<p>` 誤命中 | K-029 Reviewer Step 2 W-1 + QA sign-off | 低 | 2026-04-22 |
| TD-K025-01 | Tailwind refactor AC grep pattern 對非 opacity-modifier utilities 為 degenerate proxy（`color:#hex` 只 match `/60` 等 alpha 變體，非 opacity 改用 `rgb(R G B / var(...))` 形式） | K-025 Reviewer W-1 | 中 | 2026-04-22 |
| TD-K034-01 | `scripts/check-pen-json-parity.sh` 自動化：對 `frontend/design/specs/*.json` 驗 `pen-file` + `pen-mtime-at-export` 與實際 `.pen` 檔 mtime 一致；pre-commit hook 接入 | K-034 QA Early Consultation Q1 | 中 | 2026-04-23 |
| TD-K034-02 | `scripts/validate-visual-delta.sh` 自動化：`visual-delta: none` ticket 觸發 `git diff main..HEAD -- frontend/src/** frontend/public/**`，match 即 block commit | K-034 QA Early Consultation Q3 | 中 | 2026-04-23 |
| TD-K034-03 | Phase 2 expansion：`shared-components.spec.ts` auto-generated NavBar × 路由 + BuiltByAIBanner × 路由 pairwise byte-diff matrix，覆蓋 inventory 全體 | K-034 QA Early Consultation Q5（full 部分） | 中 | 2026-04-23 |
| TD-K034-04 | Designer persona 「新路由 intake」硬 gate codification（`.pen` frame + specs JSON + PNG + inventory Edit 四件套完成才回報 PM） | K-034 QA Early Consultation Q7 | 低 | 2026-04-23 |
| TD-K034-05 | Phase 1 QA sign-off 實裝 dual-baseline 驗證：`scripts/compare-baselines.sh` hash diff `frontend/e2e/__screenshots__/*.png` vs `frontend/design/screenshots/*.png`；`package.json` `test:e2e:update-snapshots` 加 branch-name guard（僅 `chore/baseline-refresh-*` 可執行） | K-034 QA Early Consultation Q2 | 中 | 2026-04-23 |
| TD-K034-06 | Designer persona monthly Pencil orphan audit step；`.pen` schema version bump 機制（需 Pencil MCP 支援）；首次 orphan 事件發生時升級為硬 gate | K-034 QA Early Consultation Q4 | 低 | 2026-04-23 |
| TD-K034-07 | `docs/reports/ci-budget.md` 制定：full Playwright suite >6 min 觸發 reduction；reduction 順序 visual-report > viewport sweep > shared-component snapshot（snapshot 為 Sacred） | K-034 QA Early Consultation Q6 | 低 | 2026-04-23 |

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

## TD-K027-01 — diary-mobile.spec.ts 桌面 TC 僅覆蓋 1280px

**來源：** K-027 Code Review I-002（2026-04-21）

`diary-mobile.spec.ts` TC-007 僅測 1280px viewport；AC-027-DESKTOP-NO-REGRESSION 要求 1024px / 1280px / 1440px 三個 viewport。

**風險：** 低 — `sm:` prefix = 640px，三個 desktop viewport 的 Tailwind class 應用完全相同，無 breakpoint 差異。1024px / 1440px 出 bug 的機率極低。

**PM 裁決（2026-04-21）：** 低優先技術債。補三個視覺上相同的桌面 TC 的 CI 成本 vs 收益不平衡；K-024 啟動時（diary 結構重做）補齊三 viewport 桌面 TC。

**排期觸發條件：** K-024 啟動時，設計文件的桌面 regression 測試規格中強制補齊三 viewport。

---

## TD-K027-02 — diary-mobile.spec.ts `.px-4.pb-4` 定位器脆弱

**來源：** K-027 Code Review N-001（2026-04-21）

`diary-mobile.spec.ts` 某些定位器依賴 `.px-4.pb-4` class 組合定位 MilestoneSection 展開區；K-024 移除 accordion 結構後，這些 class 將不存在，相關 spec 靜默失效（通過但未真正測到目標元素）。

**風險：** 低-中 — 當前 K-027 測試通過，不影響現在；K-024 啟動後若 Reviewer 漏稽核此定位器，將造成 E2E 通過但無實質覆蓋。

**PM 裁決（2026-04-21）：** 低優先技術債。K-024 Reviewer checklist 必須含「稽核 diary-mobile.spec.ts 定位器是否仍有效」這一項，作為 code review 硬性要求。

**排期觸發條件：** K-024 Reviewer 階段強制稽核；可選在 K-024 Engineer 實作時一併更新定位器為結構無關的 selector（如 `data-testid`）。

---

## TD-K027-03 — milestone title overflow 屬性未驗

**來源：** K-027 Code Review N-003（2026-04-21）

AC-027-TEXT-READABLE 要求「無 text-overflow: ellipsis 截斷、無 overflow: hidden 隱藏字元」，但 `diary-mobile.spec.ts` 未對 milestone title 元素驗 overflow computed style。

**風險：** 低 — milestone title 在 `flex-col` 下佔完整行寬，無 `truncate` 等截斷 class；實際場景中字元被截斷的可能性接近零。

**PM 裁決（2026-04-21）：** 低優先技術債。K-024 設計時 title 元素結構可能改動（Bodoni 64px h1 等），彼時補驗 title overflow 成本最低且最有意義。

**排期觸發條件：** K-024 AC-024-ENTRY-LAYOUT Playwright 斷言規劃時，將 title overflow 驗證加入 spec。

---

## TD-K027-04 — assertLastCardVisible hardcoded sleep

**來源：** K-027 Code Review Round 2 I-R2-01b（2026-04-21）

`assertLastCardVisible` 在 `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))` 後用 `waitForTimeout(200)` 等待 scroll 穩定；hardcoded sleep 在 CI 慢機器（CPU throttle、Headless Chrome 啟動延遲）可能不足，造成 scroll 未完成時就取 `boundingBox()`，斷言結果不穩定。

**風險：** 低 — 目前 7/7 tests 全過；200ms 對本地機器充裕；CI 環境若有 throttle 才會浮現。

**PM 裁決（2026-04-21）：** 低優先技術債。改用 Playwright `toBeInViewport()` 需重構 `assertLastCardVisible` 邏輯（`toBeInViewport()` 只驗「可見於 viewport」，不驗「card 底部 ≤ viewportHeight」），不是直接替換；且目前 CI 無穩定性問題回報；K-024 重寫 diary spec 時一併清理。

**建議解法：**
- Option A：改用 `page.waitForFunction(() => document.readyState === 'complete')` 或 scroll 事件 listener + Promise resolve，確保 scroll 完全停止
- Option B：改用 `lastCard.scrollIntoViewIfNeeded()` 取代 `window.scrollTo(0, scrollHeight)` + 200ms sleep，讓 Playwright 管理 scroll 到位

**排期觸發條件：** K-024 diary spec 重寫時一併清理；或 CI 回報此 test 有 flaky 記錄時立即升級。

---

## TD-K022-01 — `font-italic` fontFamily 命名語意混淆

**來源：** K-022 Breadth Review I-2（2026-04-21）

`tailwind.config.ts` 中 `theme.extend.fontFamily.italic` 指向 Newsreader 字型，與 Tailwind 原生 `italic`（font-style）命名衝突，極易誤讀。當前使用者需同時寫 `font-italic italic` — 前者是字型 class，後者是斜體 class。

**風險：** 低 — 功能正常，純命名混淆問題；新開發者或 Engineer 初次接觸時易誤解。

**PM 裁決（2026-04-21）：** 低優先技術債。改名需同步更新所有使用 `font-italic` 的組件 class（grep + 批次替換），屬一次性清理作業，無立即安全/功能風險。

**建議解法：** `tailwind.config.ts` 中 `fontFamily.italic` → `fontFamily.newsreader`，並 grep 全專案 `font-italic` 一次批次替換為 `font-newsreader`；同步更新 E2E spec 的 `computed fontFamily` 斷言無需修改（CSS 編譯後相同）。

**排期觸發條件：** 下次 tailwind.config.ts 有結構性修改時一併 rename；或獨立開小票（DX cleanup batch）時批次處理。

---

## TD-K022-02 — `SectionLabel` 舊 dark colorMap 殭屍代碼

**來源：** K-022 Breadth Review I-3（2026-04-21）

`components/common/SectionLabel.tsx` 保留 `purple/cyan/pink/white` 顏色選項以維持向後相容，但 K-022 完成後目前僅 `/about` 使用 SectionLabel 相關組件（以 `SectionLabelRow` 形式），且不使用上述顏色。

**風險：** 低 — 殭屍代碼，無功能影響；K-030 確認 AppPage 也不引用後，這些 colorMap branch 可安全移除。

**PM 裁決（2026-04-21 更新）：** K-026 已 superseded by K-030（K-030 重新定位 `/app` 為獨立 tool，會重做 AppPage 配色與結構）。改由 K-030 closed 後 Reviewer 確認 AppPage consumer 情況，若確認無使用，列入 K-030 cleanup 或獨立小票一次清除。

**建議解法：** K-030 closed 後 grep `SectionLabel` 全專案使用點，確認僅 `/about` 相關組件使用（且皆用新 prop 格式）；移除 `purple/cyan/pink/white` colorMap branch；同步簡化型別定義。

**排期觸發條件：** K-030 closed 後一個 review cycle 以內處理。

---

## TD-K030-01 — AppPage interaction regression E2E coverage 缺

**來源：** K-030 Code Review I-1（2026-04-21）

K-030 Engineer 交付後 Vitest 36 tests pass，但都只驗 render（`@testing-library/react` shallow render），無 Playwright spec 斷 PredictButton sticky 定位、OHLC 表格編輯互動、chart rerender 等 `/app` tool 內部行為。AC-030-FUNC-REGRESSION 僅透過 existing Vitest + existing E2E suite 維護，未新增互動層斷言。

**風險：** 低 — QA 視覺比對（Pencil v1 `ap001` + get_screenshot）+ 既有 Vitest render test 仍能覆蓋主要 regression；但若未來 sticky 定位因 CSS flex context 變動（例如移除 `h-screen` 或改 `min-h-screen`）靜默破壞，現有測試無法抓到。

**PM 裁決（2026-04-21）：** 低優先技術債，本票不擴 scope。理由：(a) K-030 核心 scope 是「isolation 層面」（new-tab + chrome removal + bg），非 `/app` 內部互動 hardening；(b) sticky 定位既有 Playwright `ma99-chart.spec.ts` + `visual-report.ts` 在視覺層有覆蓋；(c) TD-005（`AppPage.tsx` 責任過多）重構時一併補齊 interaction E2E 效益最大。

**建議解法：** 新增 `frontend/e2e/app-interaction.spec.ts` 斷 (1) PredictButton `position: sticky` + `bottom: 0` computed style；(2) OHLC 表格 cell edit 後 state 更新；(3) Predict 按下後 chart rerender。

**排期觸發條件：** TD-005 `AppPage.tsx` 拆分 ticket 啟動時一併補齊；或獨立小票處理。

---

## TD-K030-02 — UnifiedNavBar renderLink type alias 應用 typeof 派生

**來源：** K-030 Code Review M-3（2026-04-21）

`frontend/src/components/UnifiedNavBar.tsx` 內 `renderLink` 函式宣告的 link 參數型別為本地 inline `{ label: string; path: string; hidden?: boolean; external?: boolean }`，結構是 `TEXT_LINKS` entry 的子集；未來 `TEXT_LINKS` entry shape 擴充欄位（如 `icon` / `analyticsId`）時，`renderLink` 需同步手改型別，有 drift 風險。

**風險：** 低 — 純 DX / 型別派生慣用法差異，無 runtime 影響。當前 TEXT_LINKS 欄位穩定。

**PM 裁決（2026-04-21）：** 低優先技術債。Reviewer 建議改為 `typeof TEXT_LINKS[number]` 自動派生，一行 edit，無功能變更；但不 block K-030。

**建議解法：** `renderLink(link: typeof TEXT_LINKS[number], isMobile: boolean)` 派生；確保未來 TEXT_LINKS 擴欄時 renderLink 簽名自動同步。

**排期觸發條件：** TD-K021-02 / K-025 NavBar hex-to-token 後續票 / 或任一 NavBar 結構改動 ticket 啟動時順手處理。

---

## TD-K030-03 — visual-report.ts TICKET_ID 未提供時 fallback `K-UNKNOWN`

**來源：** K-030 QA retrospective 2026-04-21

`frontend/e2e/visual-report.ts` 當未帶 `TICKET_ID` env var 執行時，目前 fallback 為 `K-UNKNOWN-visual-report.html` 寫入 `docs/reports/`。K-030 QA 在 full Playwright suite 執行過程中誤觸發一次無 env var 跑法，產生 `K-UNKNOWN-visual-report.html` 汙染檔（已手動清除並重跑 `TICKET_ID=K-030 npx playwright test visual-report.ts`）。

**風險：** 中 — 若 CI 或開發者未帶 env var 跑全 suite，會靜默寫入 `K-UNKNOWN` 檔；若後續 commit 誤 stage 此檔將污染版控。當前 `docs/reports/*.html` 在 gitignore 內緩解 commit 污染，但 local dir 仍會被蓋。

**PM 裁決（2026-04-21）：** 中優先技術債。理由：(a) 當前 gitignore 阻擋 commit 層汙染；(b) local 污染需 QA / 開發者手動清理，影響 report 可信度；(c) 修法簡單（將 fallback 改 throw），但屬 tooling 範疇與 K-030 feature 無關，不擴 scope。

**建議解法：** `frontend/e2e/visual-report.ts` 頂層（Playwright test discover 階段外，以符合 `feedback_test_module_toplevel_pure` — 搬進 `test.beforeAll` 或 config setup）讀 `process.env.TICKET_ID`；未提供時直接 `throw new Error('TICKET_ID env var required for visual-report.ts')`；刪除 `K-UNKNOWN` fallback。

**排期觸發條件：** 下次 visual-report tooling 調整或 CI 加入 visual-report job 時一併處理。

---

## TD-K030-04 — diary.json K-021/K-022/K-023 遺留繁中條目違反英文硬規則

**來源：** K-030 QA retrospective 2026-04-21

`frontend/public/diary.json` 內 K-021 / K-022 / K-023 相關 milestone items 部分 `text` 欄位為繁體中文，違反 `~/.claude/memory/feedback_diary_json_english.md` 硬規則（「milestone 名稱與 text 欄位一律英文；對外 portfolio 頁面」）。

**風險：** 中 — portfolio 對外頁面語言不一致，影響 recruiter / 訪客體驗。非功能性問題但屬 user-facing content。

**PM 裁決（2026-04-21）：** 中優先技術債。理由：(a) 規則於 K-024 票確立後才 codify，K-021/22/23 為歷史條目；(b) 一次性翻譯作業屬獨立工作，不屬 K-030 scope（K-030 是 `/app` isolation）；(c) 需逐條 review 用詞，不宜急就章。

**建議解法：** 逐條英譯 K-021/022/023 milestone items，保留技術名詞原樣（`UnifiedNavBar`、`HomeFooterBar` 等）；翻譯後跑 `DiaryPage.spec.ts` 確認 E2E 無破壞。

**排期觸發條件：** 下次 diary 類 ticket（K-024 /diary 結構重做或其他 diary.json 更新）啟動時一併清理；或獨立開小票處理。

---

## TD-K025-01 — Tailwind refactor AC grep pattern degenerate proxy

**來源：** K-025 Reviewer depth (Step 2) W-1 2026-04-22

AC-025-REGRESSION 的「pre==post declaration count」grep 對 4 個 hex pattern 實際只有 2 個有監控力（`color:#1a1814` 變體 / `border-color:#1a1814`），另 2 個（`color:#9c4a3b` / `background-color:#f4efe5`）pre 與 post 皆為 0，不論 refactor 是否正確都恆成立。

**根因：** QA Q1 最初建議的 grep pattern 未 sanity-check 實際 dist CSS 形式。Tailwind JIT 對非 opacity-modifier utilities 產出 `color:rgb(R G B / var(--tw-text-opacity, 1))`，僅 opacity 變體（`/60`、`/80`）產出 lowercase-hex-with-alpha-byte 形式（`color:#1a181499`）。PM 整合建議入 AC、Architect 複製到設計文件、Engineer 執行均未重新驗證 pattern 實際 match 數。

**本票實際影響：** 無。Reviewer behavior-diff truth table + dual-rail assertions（aria-current + toHaveCSS）已獨立證明 rendered-color 等價，grep 只是額外監控層。outcome 不受影響。

**風險：** 中 — 未來 Tailwind refactor 若套用同樣 AC 模板，會誤以為有覆蓋實則無。需於 persona/skill 層級 codify raw-count sanity rule（本票同步執行）。

**PM 裁決（2026-04-22）：** 接受為 TD，不阻 K-025 close。理由：(a) behavior 等價已由其他 gate 獨立證明；(b) 修 AC 需重跑 Engineer 驗證成本不成比例；(c) 同步 codify Reviewer/QA persona hard gate 預防未來 refactor ticket 重蹈覆轍（見 `feedback_refactor_ac_grep_raw_count_sanity.md`、`reviewer.md` §Pure-Refactor Behavior Diff + `qa.md` §Early Consultation gate）。

**建議解法：** 下次 Tailwind refactor 類 ticket 建立 AC 時，pattern 清單須同時 cover：
- Named selector 正向存在（`.text-brick-dark { color:` 的 count 不為 0）
- 非 opacity utilities 的 `rgb(R G B /` 形式 count pre==post
- Opacity-modifier utilities 的 alpha-byte hex 形式 count pre==post
- 任何 raw count 為 0 的 pattern 視為「無監控力」需替換，不得當作等價證據

**排期觸發條件：** 下次 Tailwind token refactor ticket 啟動時作為 AC template 要求；或獨立 TD 清理票處理。

---

## TD-K029-01 — about-v2.spec.ts Outcome / Learning label selector 未來 data 彈性風險

**來源：** K-029 Reviewer Step 2 W-1 + QA sign-off（2026-04-22，兩方皆獨立標記為 TD 候選）

`frontend/e2e/about-v2.spec.ts` L474 + L487 對 TicketAnatomyCard Outcome / Learning label span 使用 `locator('span', { hasText: 'Outcome' })` / `locator('span', { hasText: 'Learning' })` 作 selector。K-029 實作時 TicketAnatomyCard 的 Outcome / Learning label 文字**硬編在組件源碼**（非 data-driven），且 sibling `<p>` 元素內文為 `outcome` / `learning` 描述性句子，當下無 `hasText` 誤命中風險，21 個斷言全綠。

**風險：** 低 — 需同時滿足三條件才破：(a) schema 改為 data-driven label；(b) 新 label 文字含 `Outcome` / `Learning` 字串（case-sensitive 完整包含）；(c) sibling `<p>` 文本同時出現該字串。當前 TicketAnatomyCard 的 label 是 component-level literal，改動要求 Architect-level scope（超出純視覺 ticket）。

**PM 裁決（2026-04-22）：** 登記低優先技術債，本票 close 不修。理由：
- Reviewer Step 1 (breadth) 0 Critical / 0 Important；Step 2 (depth) 0 Critical / 0 Warning；W-1 屬 Info 類 future-proofing 建議，非 active bug
- QA sign-off PASS，full suite 197 pass / 1 skip / 0 fail
- 修法明確（加 `data-testid="ticket-anatomy-outcome-label"` + `data-testid="ticket-anatomy-learning-label"` 兩 testid + spec getByTestId 替換），成本約 10 分鐘
- 當前 label 為 component literal，未來任何 schema 動態化改動必落在 TicketAnatomyCard 本身的 ticket（觸發條件明確、不會靜默漂移）

**建議解法：**
1. `frontend/src/components/about/TicketAnatomyCard.tsx` 既有的兩個 label span 加 `data-testid="ticket-anatomy-outcome-label"` / `data-testid="ticket-anatomy-learning-label"`
2. `frontend/e2e/about-v2.spec.ts` L474 / L487 把 `locator('span', { hasText: 'Outcome' })` 改為 `getByTestId('ticket-anatomy-outcome-label')`（Learning 同）
3. 執行完整 Playwright suite 確認 21 斷言仍全綠

**排期觸發條件：** (a) 下一張觸及 `TicketAnatomyCard.tsx` 的 ticket；(b) 或任一將 TicketAnatomyCard Outcome / Learning 改為 data-driven schema 的 ticket（發生前必先修本 TD）。

---

## TD-K034-08 — HomePage Footer 容器寬度跨路由視覺不一致（byte-diff 不可視）

**來源：** K-034 Phase 1 Reviewer Step 2 Warning #W3（2026-04-23）

`frontend/src/pages/HomePage.tsx:13` 根 div `<div className="... sm:pl-[96px] sm:pr-[96px]">` 將 `<Footer />` 也包在左右各 96px 的 padding 內，viewport=1280 時 `/` 的 `<footer>` 有效寬度為 `1280 − 192 = 1088px`；而 `/about`（`AboutPage.tsx:71`）與 `/business-logic`（`BusinessLogicPage.tsx`）皆將 `<Footer />` 以根層 sibling 全寬渲染（有效寬 1280px）。

**Reviewer 實證：** `frontend/e2e/shared-components.spec.ts-snapshots/` 三張 PNG 基準：
- `footer-home-chromium-darwin.png` → 1088 × 87 px
- `footer-about-chromium-darwin.png` → 1280 × 87 px
- `footer-business-logic-chromium-darwin.png` → 1280 × 86 px

**為何 K-034 Phase 1 不修：**
- AC-034-P1-ROUTE-DOM-PARITY 斷言的是 `<footer>` outerHTML byte-identical — 滿足（`<footer>` 元素本身三路由完全相同，只有 ancestor 結構不同）
- T1 byte-identity gate 讀的是 `<footer>`.outerHTML，看不到 ancestor padding 導致的 render-width 差異，屬 out-of-scope class of divergence
- 修法需動 HomePage 根 div 結構（把 `<Footer />` 拉出 padded wrapper 成 root sibling），牽動 HomePage 其他 section 的左右 padding 語義 — 超出 K-034 Phase 1「variant prop 退役」的 scope
- 已登入 `docs/designs/design-exemptions.md` §2 INHERITED 分類（pre-existing since K-017 / K-021；暫時宣告視覺跨路由差異為可接受）

**風險：** 中 — `/` 的 Footer 視覺上比 `/about` / `/business-logic` 窄 192px，portfolio 對外呈現跨頁不一致；K-036 UI polish Item 3（HomePage 桌面 padding 調整）若未同時處理 Footer wrapper 結構可能加劇或固化此差異。

**建議解法：**
1. `frontend/src/pages/HomePage.tsx` 拆解根 div：padded wrapper 僅包住需要內縮的 section（HeroSection / FeaturesSection 等），`<Footer />` 移出成為根 fragment 下的 sibling
2. 跑 `shared-components.spec.ts` PNG snapshot — 此時 `/` 的 PNG 應變成 1280px，需 `--update-snapshots` 重建基準（審閱 diff 確認只差 width）
3. 確認 HomePage 其他 section 的左右 padding 語義未破（視需要在 section 本身加 `px-6 md:px-[96px]` 以維持既有內縮）
4. 同步刪除 `docs/designs/design-exemptions.md` §2 "HomePage.tsx Footer render context" 列（結構已矯正）

**排期觸發條件：**
- (a) K-036 UI polish Item 3（HomePage 桌面 padding 調整）實作時併處理 — 推薦
- (b) 或任何觸及 HomePage 根層結構的 ticket（發生前必先評估是否併修）
- (c) 獨立 ticket K-037+（若 K-036 決議只動 Hero/features padding 不動 Footer wrapper）

**PM 裁決（2026-04-23）：** 登記中優先技術債，K-034 Phase 1 close 不修。理由：pre-existing since K-017；byte-identity AC 滿足；已登 design-exemptions §2 INHERITED；K-036 自然觸發點明確。

---

## 更新規則

- 新增技術債：先由 Code Reviewer 整理列單 → PM 逐條裁決 → 寫入本檔
- 從技術債升級為 ticket：同時開 K-XXX ticket，在本表標註 `→ K-XXX` 後歸檔「已轉 ticket」區
- 關閉技術債：ticket closed 後，在本表末尾「已結案」區保留紀錄（含 ticket 連結）
