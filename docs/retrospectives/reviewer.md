# Reviewer Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次 review 結束前由 senior-engineer agent（code reviewer）append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（本來該在更早的設計/AC 階段攔截到的問題）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 Reviewer 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

## 2026-04-21 — K-022 /about 結構細節對齊 v2（Step 2 專案深度）

**做得好：**
- 設計文件 §10 文件同步清單逐列對照 commit diff，抓出 `agent-context/architecture.md` 在 K-022 commit range 未更新（Critical: architecture.md 不同步）。
- A-12 shared primitives 逐檔確認 dark pattern 殘留，理解 SectionLabel 保留舊色屬「向後相容、/about 不使用 SectionLabel」，不誤判為 Warning。
- AC-022-HERO-TWO-LINE 字型不一致（AC 說 Newsreader / Pencil TQmUG 是 Bodoni Moda / E2E 驗 Bodoni Moda）三方比對後確認 Architect 設計文件已調整，但 ticket AC 未同步，正確列為 Warning 而非 Critical。

**沒做好：**
- AC-022-SECTION-LABEL ticket AC「6 個 section」vs 設計文件「5 個 label」數字差異，等到審查尾段才發現，應在 Review 開始時就做 ticket AC 數字 × 設計文件列表 × E2E count 三方比對。

**下次改善：**
1. Review 開始時固定 grep ticket AC 中所有數字（「N 個 X」），對照設計文件列表與 E2E spec count 斷言三方比對；不一致立即列 Warning。
2. Architect 因 Pencil 實測覆蓋 AC 文字時，Reviewer 驗設計文件 §2.x 是否有「AC 勘誤說明」，若無則列 Warning 要求 Architect 反寫 ticket AC（雙向一致性）。

---

## 2026-04-20 — K-021 Round 3 re-review（Step 2 專案深度）

**做得好：** Round 3 fix 後實跑 `npm run build`（max chunk vendor-react 179.29 kB gzip 58.57，無 >500 kB warning）+ 全量 Playwright chromium（115 passed + 1 skipped，skip 為 AC-017-BUILD 既有），直接驗 AC-021-REGRESSION 末段；逐檔讀 C-1（PasswordForm/BusinessLogicPage）/ C-2（Diary 三個子元件）/ C-3（HomePage wrapper 刪除 diff 486f06e）/ C-4（sitewide-fonts.spec.ts 73 行 3 case）commit diff 對照 Round 2 問題清單，確認 fix 真正消除而非症狀遮蓋；AC-021-FONTS 判定從 Round 2 PARTIAL → Round 3 PASS（3 case 覆蓋 font-display Bodoni + font-mono Geist + /app cross-route）；Round 2 新增 persona 硬步驟全部落地驗證（engineer.md L14 絕對不做第 4 條 / L69-73 前端實作順序第 5 步 / L84-88 驗證清單設計文件 checklist gate / senior-architect.md L71-85 Architecture Doc Self-Diff 段 / 4 memory 檔 + MEMORY.md 索引）。

**沒做好：** W-5 architecture.md Footer 表 Round 2 修 L463-469（`/app = HomeFooterBar`, `/diary = 無`）正確落地，但**同檔 L476 `Shared Components 邊界` 表的 `HomeFooterBar` 用於欄位仍誤寫** `/ /diary /business-logic`（應為 `/ /app /business-logic`）—— 屬 Architect self-diff 硬步驟覆蓋範圍內（結構化表格）卻漏掃第二張表。Reviewer Round 2 只對照 L463-469 未延伸檢 L476，屬 cross-check 範圍不足；已在本輪列為新發現 Warning（W-R3-01）。Round 3 另一遺漏：AC-021-FONTS 第三字型 Newsreader 的 fontFamily 斷言未被 spec 覆蓋（`font-italic` class 在 codebase 零使用，現況以 `font-['Newsreader']` arbitrary value + inline style 落地），屬 TD-K021-01 漸進處理範圍但應在 Round 2 點出，未點出。

**下次改善：**
1. Architecture doc cross-check 擴為「全檔 grep 同義欄位」：每次 architecture.md drift 檢查不只對照設計文件當下 section，同檔所有含同名組件（`HomeFooterBar` / `UnifiedNavBar` / `FooterCtaSection`）的表格均需 grep 逐列比對；不限於本次新增段落。
2. AC 列舉 N 字型 / N 路由 / N 狀態時，spec 覆蓋率 cross-check 延伸到每一項，不以「主要項已覆蓋」降級為 PASS；未覆蓋項如屬既有漸進遷移（TD 範圍），Reviewer 仍應於 Round 報告標 Suggestion，不沉默通過。

---

## 2026-04-20 — K-021 Sitewide Design System（Step 2 專案深度 review Round 2）

**做得好：** 沒停留於 Step 1 findings 的彙整，實際跑 `npm run build` 取得最新 chunk size（vendor-react 179.29 kB gzip 58.57 最大；無 >500 kB warning 新增）確認 AC-021-REGRESSION 末段；讀 `docs/designs/K-021-sitewide-design-system.md` §9.1 列出的 3 支 spec（`sitewide-body-paper` / `sitewide-footer` / `sitewide-fonts`）vs `frontend/e2e/` 實際檔案 cross-check，確認缺 `sitewide-fonts.spec.ts` 屬設計文件明列但 Engineer 未建（不是 Reviewer 自創新要求）；逐頁 grep HomeFooterBar + FooterCtaSection 實作，對照 `agent-context/architecture.md` § Footer 放置策略表，抓出 `/app` 與 `/diary` 兩列 drift（實作 `/app` 有 footer、`/diary` 無，architecture.md 寫顛倒）。

**沒做好：** AC-021-FONTS 的 Playwright 斷言「font-display / font-mono computed fontFamily」Architect 已在設計文件 §9.1 明列為獨立 spec 檔，卻未在放行 Engineer 時交付清單明寫「3 支 spec 必建」，讓 Engineer 實作只建 2 支（Engineer 在自己的 Retrospective 也沒列為 edge case）。Reviewer 在 Step 1 後若更早讀設計文件 §9 就能在 Engineer Pre-implementation Q&A 階段即點出缺口，而非等實作完檢查。同樣的「設計文件指定的 spec 清單 vs 實作 spec 檔名 cross-check」在 K-018 Reviewer retrospective（2026-04-19）已列「每條 AC 的 Then/And 逐行 grep spec」改善動作，但當時僅針對 AC 文字，未擴及設計文件明列的 spec 清單；本次仍漏。

**下次改善：**
1. Review 開始時固定跑：`grep -n "spec.ts" docs/designs/<ticket>*.md` 抽設計文件列出的 spec 檔名 → `ls frontend/e2e/` cross-check 實際檔名；有 drift 先列 Critical/Warning，不等跑 build 才發現。此條已 Edit 進 `~/.claude/agents/reviewer.md` 「Review Checklist」新增「設計文件 spec 清單 vs 實作 spec 檔名 cross-check」硬步驟（詳下）。
2. 架構文件 drift 檢查擴及「放置表」類規格表：每次 review 涉及 shared component placement 改動，固定對照 `agent-context/architecture.md` 的表格（Footer 放置 / NavBar 項目 / 路由表）逐列 grep 實作確認一致，drift 當場列 Warning 回 PM；不因「只是文件」降級為 Suggestion。

---

## 2026-04-19 — K-017 /about portfolio enhancement

**做得好：** 實際執行 `bash scripts/audit-ticket.sh K-002`、`K-008`、`K-999` 三個 AC-017-AUDIT case 驗證 exit code 與輸出格式，而非只讀 code；逐條對照 PRD 全部 10 條 AC 的 Then/And 子句與 spec 覆蓋，發現 AC-017-NAVBAR 的 DOM 順序斷言和 AC-017-BUILD 的 dev/build 環境矛盾兩個 spec 漏洞，而非只比對 describe 標題與 AC 標題。

**沒做好：** AC-017-NAVBAR 「NavBar 在 PageHeaderSection 之上（DOM 順序）」這條 And 子句在 spec 中缺漏；AC-017-BUILD test 在 dev server 下必然失敗的問題沒被 Architect 在 §7 風險清單中點出（只提了 Firebase Hosting 問題，沒有說 Playwright dev vs build 矛盾），而 Engineer 也未加 test.skip 或環境說明。這兩個缺漏本應在 AC 撰寫（PM）與 E2E 策略設計（Architect §7.11）時就明確——AC-017-NAVBAR 的 DOM 順序 And 子句是 PM 寫 AC 時明確列出的，Architect E2E 風險清單應把「DOM 結構順序斷言」的 Playwright selector 策略列為風險項目。

**下次改善：** Review E2E spec 時固定執行：展開每條 AC 所有 Then/And 子句，逐行 grep spec；對「DOM 順序」「URL 跳轉」「空間關係」類斷言優先盤點，這類斷言比內容斷言更容易漏寫。遇到 test 依賴 build artifact 時直接標為需要 build mode，不等 CI 失敗才發現。

---

## 2026-04-19 — K-018 GA4 Tracking

**做得好：** 逐條比對 PRD AC 的所有 Then/And 子句與 spec 覆蓋率，抓出 `/app` 路由 pageview 測試缺失和 click event `page_location` 斷言漏掉，而非只看測試標題與 AC 標題是否對應；同時確認 `initGA()` 的 spy 覆蓋分析（addInitScript 的 spy 與 initGA 的 gtag 都 push 到同一個 `window.dataLayer`，測試讀 dataLayer 不受 gtag 被覆寫影響），而非只從表面「函式被覆寫」就誤判為 bug。

**沒做好：** AC-018-PAGEVIEW 的「SPA 內部路由切換也會各自觸發 pageview」這條 And 子句（不只是 page.goto，而是透過 Link click 導航），spec 內沒有一個測試實際驗證 SPA 導航觸發的 pageview；banner_about 測試的 SPA 導航副作用雖間接覆蓋了部分場景，但並不是明確的 SPA pageview 路由切換斷言。這應在設計階段就由 Architect 把「SPA 路由切換測試 pattern」列進 Playwright 驗證策略（§6.3），而非只列靜態 page.goto 斷言。

**下次改善：** Review 時加固定步驟：展開 PRD 每條 AC 的所有 Then/And 子句逐行 grep spec，不只比對 describe block 名稱；有「每個 X 都要有 Y」這類全稱量詞的 And 子句時，確認 spec 對每個 X 各自斷言 Y，而非只第一個。

---

## 2026-04-18 — K-008 visual-report script

**做得好：** 沒只看檔案 diff，實跑 `npx playwright test --list`（無 project 篩選）重現「default E2E 流程會被 visual-report.ts 模組頂層 `resolveTicketId()` 印 warning 污染 stdout」的 side-effect（W1），抓到 Engineer / Architect 紙上審查漏掉的跨 project noise；並以 `path.join` 實測 `TICKET_ID=../../...` 算出預期外的 output path（W4），把「純理論威脅」轉成可觀察的行為。

**沒做好：** W1 的根因在 Architect §2.1 的設計「啟動時 stdout 印黃色警告」裡其實就埋了 — 「啟動」何時發生（module load / test body）沒被追問；如果設計階段要求把 side-effect 發生點寫明，Engineer 實作就會自然避開 module-level 執行。W4 的 path traversal 屬於「env var → filename 生成」類通用安全檢查，AC 階段沒寫 TICKET_ID 格式約束、Architect §2.1 也沒加 validation 條款，落到 Reviewer 才捕到；這是跨 role 的 checklist 缺口。

**下次改善：**
1. Review AC / Architect 設計文件時，遇「模組載入時 warning / console / fs / 啟動檢查」類語句，主動問「執行時機？誰會 import？」把 side-effect 發生點寫進設計或 AC。
2. 凡 AC 有「外部輸入（env var / URL param）→ 生成檔名 / 路徑」的場景，Reviewer checklist 加固定一條「驗證 whitelist / allow-list / path normalize 是否存在」；未來可把此條回推到 PM AC 模板，讓 K-Line 下一張類似 ticket 起就不漏。
3. 對 per-project testMatch / testIgnore 類 Playwright config 決策，Reviewer 除了驗證目前 spec 集合，還要主動指出「以後新增 spec 如何歸 project」的操作守則是否寫進 architecture.md（W2 的根源是 Architect 文件沒把 final 決策的副作用寫清楚）。

---

## 2026-04-18 — K-011 LoadingSpinner label

**做得好：** 除了對 4 個 callsite 紙上比對，還 Grep 全工作目錄 `LoadingSpinner` + `Running prediction` 兩個關鍵字，cross-check 沒遺漏任何 src / test / E2E 斷言；並實跑 `npx tsc --noEmit` + `npm test`（非信任 Engineer 回報），確認 `PredictButton.test.tsx:24` 的英文斷言仍命中 `PredictButton` 傳入的 `"Running prediction..."` label，AC-011-REGRESSION 自動保。

**沒做好：** Engineer 指出 3 條 drift（architecture.md / k002-component-spec.md / homepage.pen），但 ticket AC 從頭到尾只鎖「4 個 callsite 傳 label」，沒把文件同步寫進 AC。Architect 裁決「無需 Architecture」時其實已經知道 architecture.md:139 有「目前固定 Running prediction...」這行，卻未在裁決中指示 Engineer 順手修；結果全交給 Reviewer 裁 in-scope/tech-debt。這類「單行文件同步」本該在 Architect 放行時就標為 in-scope。

**下次改善：** Review 發現「架構文件 drift 根因是本次改動」時，若改動極小（一行），直接建議 PM 本票內修（不拆 tech debt）；同時回饋 Architect 未來裁決「無需 Architecture」時，加一句 checklist：「grep 過期描述，有則列入 Engineer scope」。對 spec 歷史文件（已歸檔的 K-00X-design）不強求同步，建議 PM 改為加「superseded by K-XXX」頭註，不動原內容。

---

## 2026-04-18 — K-009 1H MA history fix

**做得好：** 除了紙上比對 diff，實際執行 stash push → pytest 單 test → stash pop 驗證 Engineer 聲稱「移除 fix 後 test 會失敗」屬實（`captured['ma_history']` = None，斷言 `is main._history_1d` 失敗）；同時跑全量 63 tests 確認 1D 分支與其他 endpoint 未受影響。Test 斷言只鎖參數身分（`is` / `is not`），Test Escalation Rule 自動合規。

**沒做好：** Architect 把「predictor 層 ma_history 靜默 fallback」列為 defense-in-depth 選項並授權 Engineer 自裁；Engineer 拒絕並標技術債後通過。但此決定本質是把根因留原地，未來新 caller 仍可能重犯 — 我作為 Reviewer 接受此選擇，僅把它列 Suggestion 上送 PM，沒主動要求開 follow-up ticket 追踪技術債（容易被遺忘在單票 Retrospective）。

**下次改善：** 遇到 Engineer 明示「保留技術債 + 寫在 Retrospective」的情況，review 必同步建議 PM 開 follow-up ticket（不一定立刻做，但至少 ticket queue 有條目），避免 Retrospective 被當作 garbage collection；同類靜默 fallback / optional 參數陷阱在未來 review 預設標 Warning 而非 Suggestion。

---

## 2026-04-18 — K-010 Vitest AppPage 修復

**做得好：** 除了紙上比對還實跑 `npm test`（36 pass）/`tsc --noEmit`（exit 0）/`npx playwright test`（45 pass）三重驗證，沒只信 Engineer 的 Implementation log；同時 grep handlePredict / handleTimeframeChange 確認 test 斷言的 payload 與 production 行為完全一致（timeframe=viewTimeframe、toggle 只打 merge-and-compute-ma99）。

**沒做好：** K-010 原被標為單純 selector 修復，但 test 的行為斷言與生產碼矛盾（R1/R2）本應在 K-010 建立階段就透過「原 test 能否反映 production handler 今天的呼叫序列」這個檢查攔到；我作為 Reviewer 在更早的類似 ticket（如 K-005 / K-006 的 UI 改動）也未提醒「重構 UI 時 grep `src/__tests__/` 的舊斷言」，讓 dual-toggle 遺留斷言苟活到 K-010 才爆。

**下次改善：** Review checklist 加一條「UI/flow 重構 ticket 預設要求 Engineer 附 `grep -r <被改組件或 handler 名> src/__tests__/` 輸出」；我 review 到 test 改動時必用 grep 掃同名 handler 的所有 spec 依賴；遇到 index-based selector（`getAllBy*()[N]`）不管在不在 scope 內，一律在 Warning 欄列出並建議開 follow-up ticket。

---

<!-- 新條目從此處往上 append -->
