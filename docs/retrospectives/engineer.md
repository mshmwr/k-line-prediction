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

## 2026-04-21 — K-022 Code Review fix（I-1 + S-3）

**做得好：**
- 兩個修正範圍精確：`overflow-hidden` 加在 CardShell className，comment 加在對應行末，無多餘變動。
- Pre-read 確認 `CardShell padding="lg"` 位置後再 Edit，無猜測。

**沒做好：**
- I-1（overflow-hidden）和 S-3（容差 comment）是 Code Review 提出的，表示這兩點應在原始實作時就處理。`overflow-hidden` 配合 negative margin 的 pair 是標準 pattern，應是 Engineer 自查項。

**下次改善：**
- 凡使用 `-mx-*` / `-mt-*` negative margin 的組件，實作時主動確認外層容器是否有 `overflow-hidden`；加 comment 說明容差數字的行，視為 self-review 必查項，不等 Code Review 提出。

## 2026-04-21 — K-022 /about 結構細節對齊 v2

**做得好：**
- Stage 1 → Stage 6 嚴格按設計文件順序執行，每 Stage 後 tsc exit 0，全程無堆疊未驗證的變更。
- `data-redaction` / `data-testid` / `data-section-hairline` / `data-section-subtitle` / `data-annotation` 等 test attribute 在實作時同步加入，E2E 斷言直接對應，不需事後加 selector。
- 1 個 E2E fail（AC-017-HEADER）定位快：設計文件 §2.7 已明確 "PM, architect..." 移到 `<p>` Newsreader italic，舊斷言找 `<h1>` 必然 break，更新策略明確後立即修正。

**沒做好：**
- A-3 結構重構（角色列從 h1 拆到 p）必然導致 K-017 舊 `about.spec.ts` 的 `h1.toContainText('PM, architect...')` 斷言 break。這是可預期的，但沒有在 Stage 1 前 grep 舊 spec 預先列出「必然 break 的舊斷言」，等 Stage 6 全跑才發現。根因：Pre-implementation checklist 缺「對照設計文件的結構重構，grep 舊 E2E spec，預列會 break 的斷言」步驟。

**下次改善：**
- 實作前，對照設計文件每個結構層級改變（h1/p 拆分、組件重組），grep 對應舊 E2E spec，預列「因結構重構必然 break 的舊斷言」及更新策略，再開始 Stage 1。避免 Stage 6 全跑時出現「意料外」的回歸 fail。

## 2026-04-21 — K-027 Round 3（純 spec 修正：刪死代碼 + Fix 2/Fix 3）

**做得好：**
- 實作前讀完整 spec 檔，發現 `containerOverflow` 使用錯誤變數名（`firstEntriesContainer` vs `entriesContainer`），當場修正，tsc exit 0 確認無型別問題。
- 3 項修正各自 atomic edit，確認每項套用正確後再進行下一項。

**沒做好：**
- Fix 1 刪除死代碼時，PM 指示使用 `firstEntriesContainer` 作為 evaluate 目標，但 `assertTextReadable` 函數內的變數名是 `entriesContainer`（不同於 `assertMobileFlexCol` 的 `firstEntriesContainer`）。此次靠 tsc 抓到，但應該在 Edit 前就對照 scope 確認。

**下次改善：**
- 跨 function 套用範例程式碼前，先 grep 目標 function 內的變數名，確認對應關係，再調整範例中的識別符。

## 2026-04-21 — K-027 Round 2（補斷言 C-001/I-001/N-002）

**做得好：**
- `containerNotClipping` 斷言失敗後立即寫 debug spec 打印四組數據（`offsetTop`、`offsetParent`、`getBoundingClientRect`、`scrollHeight`），確認根因是 `offsetParent = BODY`（不是 `.px-4.pb-4`），改用正確的 `getBoundingClientRect()` 基準，7 tests 全過。
- 全量 128 tests 0 regression。

**沒做好：**
- `offsetTop` 是相對 `offsetParent` 而非任意祖先容器，這是 DOM 基礎，但仍寫出 `p.offsetTop + p.offsetHeight > container.clientHeight` 這種假設 offsetParent = container 的錯誤斷言。與 Round 1 的根因相同：沒有先 `page.evaluate` 確認實際值再寫斷言。

**下次改善：**
- 跨容器位置斷言的固定流程：先確認 `element.offsetParent.tagName === 預期容器`；不匹配一律改用 `getBoundingClientRect().bottom` 比較。

## 2026-04-21 — K-027（手機版 /diary milestone 重疊修復）

**沒做好：**
- `assertMobileFlexCol` 中用 `getBoundingClientRect().width < 96` 判斷 `w-auto` 效果，未考慮 `flex-col` 下 span 撐滿父容器導致 width 遠大於 96px，斷言邏輯倒置。根因是未在瀏覽器環境預先驗證 computed value，直接憑直覺推算 flex-col 下 inline element 的 width 行為。

**下次改善：**
- computed style 相關斷言（尤其 flex/grid layout 下的 width/height），**先 `page.evaluate()` 確認預期值，再寫 `expect` 斷言**，不憑想像推算。

## 2026-04-20 — K-021 Round 4 fix（/about text-white readability）

**做得好：**

1. **Scope discipline 嚴守：** PM 交接指引 10 檔 10 行清單與初始 grep 結果零差異，逐檔做純 text-color 替換（`text-white` → `text-ink` 一個 class token），未順便動 layout / font-size / spacing 等相鄰 class。engineer.md absolute-don't #4 不降級 scope 與 #1 不擴張 scope 兩條一起守住。
2. **交付前硬查歸零：** Edit 完 10 檔後再跑 `grep 'text-white' frontend/src/components/about/` 回報 `No matches found`，gate 通過前就驗證 fix 完整性，未依賴 QA 再探針一次才知道。

**沒做好：**

1. **首輪 parallel Edit 全部因為沒 Read 失敗：** agent session 新接手無前任 Read context，直接對 10 檔下 Edit batch → 10 個 `File has not been read yet` 錯誤，補 Read 10 檔後才能重 Edit。應該接手 session 第一步就批次 Read 再 Edit，不省這一步。

**下次改善：**

1. 新 session agent 接手純文字替換任務，預設流程「批次 Read → 批次 Edit → 硬查 grep」，不先試沒 Read 就 Edit。特別是批次操作時 10 檔一起 fail 浪費 parallel tool call 額度。

## 2026-04-20 — K-021 Round 3 fix（Reviewer Round 1+2 合併修復）

**做得好：**

1. **Round 2 新增 persona 3 條硬步驟實地驗證行為有變：** 絕對不做第 4 條「不降級設計文件 scope」直接擋下我想把 C-3 HomePage outer hex wrapper 再標一次「保守決策」的念頭；前端實作順序第 5 步「body-layer CSS 全子元件 dark-class scan」讓我 grep 全掃 94 處 / 23 檔而非只看頁面檔；驗證清單「設計文件 checklist 逐列勾」讓我交付前先跑 §8.1 / §9.1 / 附錄 A 三張表 hard gate，缺一項都不交。這三條 persona 改動實際改變了行為（Round 2 我會略過，Round 3 不會）。
2. **font-display 零用量的 scope 判斷：** grep 發現 codebase 原本 0 處用 `font-display` class，§9.1 要求 spec 斷言該 class computed `fontFamily` 含 Bodoni → 自行補最小遷移（HeroSection 2 行 Bodoni h1 從 inline style 遷 `font-display` class），其他 Newsreader / Geist Mono inline style 留 TD-K021-01 漸進處理。沒有為了過 spec 而溢出改動整頁 HeroSection。

**沒做好：**

1. **AC-021-FONTS Round 2 誤判 PARTIAL 而非 FAIL：** Round 2 判斷時用「`sitewide-footer.spec.ts` 斷言 fontSize 11px 可間接證明字型 OK」合理化 PARTIAL 標記。實際 AC 要求 computed `fontFamily` 含 "Bodoni Moda" / "Geist Mono"，fontSize 11px 跟 fontFamily 家族**不等價**（fontSize 11px 可配 system-ui 過斷言）。根因：把「AC 有相關 spec 存在」等同「AC 語義已覆蓋」，沒逐字對 AC 的 Then/And 子句。
2. **ESM `.ts` extension 坑：** 抽 `e2e/_fixtures/mock-apis.ts` 後首次跑 Playwright 報 `Cannot find module './_fixtures/mock-apis'`。`frontend/package.json "type": "module"` 要求 relative import 帶明確副檔名，tsc 因 `allowImportingTsExtensions: true` 不擋，但 Playwright ESM resolve 擋。應該在寫 import 前先確認 package.json type 再決定副檔名寫法。

**下次改善（硬步驟）：**

1. **PARTIAL 降級前驗 AC 語義等價性：** 宣告「有 spec 間接覆蓋」時，具體列出 spec 的斷言內容 vs AC Then/And 子句，逐字對照證明等價，不等價一律補直接斷言或標 FAIL。已同步 persona。
2. **ESM 專案 helper 抽取預設帶副檔名：** 新增 Playwright fixture/helper 時，先 `cat package.json | grep '"type"'` 確認 type → "module" 則 relative import 一律帶 `.ts`，不先試無副檔名版本省時間。

**本輪 Final Gate 成績：** tsc exit 0 / build OK max chunk 179 kB / Playwright 115 passed + 1 skipped / dark-class scan 94 match 全在 K-021 scope 外 / §8.1 視覺 checklist headless agent 無法跑 dev server 目視（Reviewer + QA 須補）/ §9.1 spec list 5 列全綠 / 附錄 A 檔案異動全落地。Round 3 新增 5 commits：C-1 / C-2 / C-3 / W-2 / C-4+W-4+S-3。

---

## 2026-04-20 — K-021 Round 2 反省（Reviewer Step 1+2 回報）

**沒做好：**

1. **漏掃子元件 dark-theme class（C-1 + C-2，同根因）：** Stage 3 Option A 將 body bg 搬進 `index.css @layer base`，隨後在 4 個 Page component 外層刪 `bg-[#0D0D0D] text-white`。我的掃描範圍**只到頁面檔**（`frontend/src/pages/*.tsx`），沒往下進入 `components/` 子元件。實際落網 5 處未改：
   - `components/business-logic/PasswordForm.tsx` L24 `text-gray-400`、L29 `bg-white/5 border-white/20 text-white`（米白底 input 內容白字 + 半透明白框 → 肉眼看不見）
   - `components/diary/MilestoneSection.tsx` L14 / L20 / L24 `border-white/10` / `text-white` / `divide-white/5`
   - `components/diary/DiaryEntry.tsx` L10 / L11 `text-gray-500` / `text-gray-300`
   - `pages/DiaryPage.tsx` L15 `text-gray-400` 副標（此行在頁面檔但本身屬「頁面描述文字」，未被外層 dark wrapper 掃描 pattern 命中）
   - `pages/BusinessLogicPage.tsx` L93 `text-gray-400` 副標
   實作時具體跑的命令是 `grep -rn "bg-\[#0D0D0D\]" frontend/src/` + 人眼掃 4 個 Page component 的外層 `<div>`，**應該同時跑** `grep -rn "text-white\|text-gray-\|bg-white\|border-white\|divide-white" frontend/src/components/` 全子元件掃一次才完整。設計文件 §8.1「/diary DiaryTimeline 內容深色可讀」+「/business-logic PasswordForm 可讀」兩條明寫子元件目視檢核，Stage 3 跑完後我沒回頭對照 §8.1 checklist，直接進 Stage 4 NavBar。Playwright `sitewide-body-paper.spec.ts` 全綠是因為斷言只驗 `body` computed `background-color`（`rgb(244, 239, 229)`），**子元件文字顏色**完全沒覆蓋到（Playwright 只斷言「body 米白」，不斷言「body 下所有文字可讀」）。既有 memory `feedback_shared_component_all_routes_visual_check.md` 明寫「啟動 dev server 逐一訪問 /, /about, /diary, /app 目視」—— 但 Stage 3 目視我只開了 /about（因為已知 K-017 FooterCta 是高風險），/diary 與 /business-logic 略過以為「沒改頁面檔外層就沒事」，這是結構性漏洞：目視範圍我收斂到「本 Stage 我改動的頁面」，但全站 body 從 dark→paper 的切換**影響所有頁面的所有子元件**，目視 scope 應固定為「全路由」不是「本 Stage 改動路由」。
2. **設計文件 scope 指示自行降級為保守決策（C-3）：** design doc §6.6 表格 L383 明列 `HomePage.tsx` L13 Before `<div className="min-h-screen bg-[#F4EFE5] text-[#1A1814]">` → After `<div className="min-h-screen">`（註記「可一併清理冗餘 class；body 層已管」）；§12 共用組件邊界 L772 進一步明列「HomePage.tsx 外層 `<div>` class 清理（body 管 bg/text，HomePage 僅留 `min-h-screen`）」；附錄 A L880 同樣列為檔案異動清單項。我實作時把附錄 A 的「可選」當成「可不做」，在 ticket Retrospective 段自行把它標為「TD-K021-03 未處理（保守決策）」（編號還標錯——design doc §11 TD-K021-03 是 NavBar legacy dead code，不是 HomePage 外層 class），用「怕 regression」當理由，但 design doc §6.6 設計論述已寫「body 層已管」，意味著移除 hex wrapper 後 body `@layer base` 規則會接手相同 bg/text，技術上不存在 regression。這是把 Architect 設計決策自行降格為「可做可不做」的行為決策，違反 engineer.md 絕對不做「不做架構決策」。
3. **設計文件 spec 清單未對照交付（C-4）：** design doc §9.1 L530 明列 `frontend/e2e/sitewide-fonts.spec.ts` 為新檔，對應 AC-021-FONTS（2 斷言：任頁 `font-display` / `font-mono` computed `fontFamily` 含 "Bodoni Moda" / "Geist Mono"）。Stage 5 我跑的 grep 是 `ls frontend/e2e/sitewide-*`，看到 `sitewide-body-paper.spec.ts` + `sitewide-footer.spec.ts` 兩檔存在就繼續，**沒用 §9.1 表格當 checklist**（3 個新檔 + 1 個擴充 spec）。AC-021-FONTS 因此 PARTIAL，既有 `sitewide-footer.spec.ts:34` 驗的是 `fontSize` 11px，不是字型家族。交付前應該用 §9.1 5 列表格（包含 REGRESSION 列）逐列對照 `ls frontend/e2e/`，缺哪個補哪個。
4. **Viewport 覆蓋不足（W-1）：** AppPage.tsx L368 用 `h-screen flex flex-col overflow-hidden`，L496 在 flex column 末端放 `<HomeFooterBar />`。1280×800 可見是因為高度剛好夠，但 900×600 以下（例如 iPad 直立、筆電半視窗）flex 子節點被擠壓，footer 可能跑出 viewport。我實作時只開 1280×800 dev server 目視，沒多開 window resize 試 900/720 等低高度 viewport。design doc §8.1「Viewport：1280×800 desktop（不做 mobile 截圖，AppPage 本來就不 mobile 友好）」—— 但「不做 mobile 截圖」不等於「不測其他 desktop 高度」；我把它讀成了「只測 1280×800」。PM 已裁決 TD-K021-07 不 fix-now，但反省仍需做。

**既有防呆為何未覆蓋（結構性，非個案）：**

- `feedback_shared_component_all_routes_visual_check.md`：明寫「dev server 逐一訪問所有路由目視」。我這次踩的結構性問題是「目視 scope 我自行收斂到本 Stage 改動路由」—— memory 原文沒明寫「body bg 全站切換時，目視範圍必須是全部路由+所有子元件深色 class」。memory 覆蓋「改共用組件（NavBar / Footer）」情境，但**沒覆蓋「body 層 CSS 全站切換」情境**，我把 index.css body 規則等同於「只改 CSS 不改組件」而低估了影響面。
- `feedback_read_prd_ac_before_impl.md`：明寫「實作前 grep PRD AC 逐條確認 Then/And 子句」。但這條 memory 的 How to apply 是「實作前」動作，我當下確實讀了 AC-021-BODY-PAPER 寫進 Stage 計畫；問題在於「**實作中 + 交付前**沒再回頭對照 AC 的 Then/And 清單」。memory 沒覆蓋「Stage 完成後回頭交付 gate」動作。
- design doc §13 L794-799「Architect → Engineer 交付前檢查清單」是寫給 Architect 的，**沒有等價的 Engineer 交付前清單**。我 Stage 完成後直接跑「tsc + Playwright」就交付，沒有「回讀 design doc §8.1 視覺 checklist + §9.1 spec 清單逐列對照」這一步。
- engineer.md L71-76「驗證清單（每個 Phase 完成前必須全過）」只有 tsc / py_compile / Playwright E2E —— **沒有「回讀設計文件 §視覺 checklist + §spec 清單」這項**。這是 persona 結構性缺口。

**結構性根因（聚合 C-1/C-2/C-3/C-4）：**

我缺一個「Engineer Stage 交付前 gate」—— 把「Architect 給我的視覺 checklist + spec 清單 + 檔案改動清單」當成**交付前硬查表**，而不是「實作前參考資料」。當前 workflow 是「讀 design doc → 跑 Stage → 跑 tsc + Playwright → commit」，缺「跑完測試 → 再次回讀 design doc 每個『checklist / 清單 / 表格』逐列勾 → commit」這一步。四項 Bug 都因此而起：
- C-1 + C-2：§8.1 checklist 沒勾 → 漏目視子元件
- C-3：§6.6 + §12 + 附錄 A 沒勾 → HomePage hex wrapper 保留
- C-4：§9.1 表格沒勾 → sitewide-fonts.spec.ts 缺檔

**下次改善（硬步驟）：**

1. **新增 engineer.md 硬步驟「Stage 交付前回讀設計文件」** — 每個 Stage 跑完 tsc + Playwright 後、commit 前，固定動作：
   - `grep -n "checklist\|清單\|Before.*After\|新檔 / 擴充" <設計文件>` 列出所有表格與 checklist section
   - 逐列對照實際檔案狀態，**每一項都標 [x] 已做 / [ ] 未做（附理由）**，未做項回報 PM 決定補做或登 TD
   - 違反此步直接交付 = 算反省不通過
2. **新增 engineer.md 硬步驟「body 全域 CSS 變更時全站子元件 dark-class 掃描」** — 若本 Stage 改動 `index.css @layer base body` / `:root color-scheme` / 全站字型 / 全站 CSS variable，除 `grep` 頁面檔外層 wrapper class 外，必須額外跑：
   ```bash
   grep -rn "text-white\|text-gray-\|bg-white\|bg-gray-\|border-white\|divide-white" frontend/src/components/
   ```
   並 dev server 目視全部路由（不只本 Stage 改動路由），每個路由檢查「body 下所有文字肉眼可讀、所有 border/divide 可辨識」。
3. **新增 engineer.md 硬步驟「設計文件 scope 指示不得自行降級」** — 設計文件有「明確改法 diff」「檔案異動清單」「共用組件 changes 欄位」任一寫到具體改動，即使附註「可選 / 可一併」，Engineer 預設**必做**；若要不做，必須先回報 PM 登成 TD 等裁決，不得自行決定「保守不動」。「怕 regression」不是降級理由 —— 設計文件已論證過相同視覺結果（body 層已管）即無 regression 風險，再怕就加 Playwright 負斷言。
4. **設計文件 spec 清單對照成為交付硬 gate** — §9.x 或同義「測試規劃章節」的 spec 檔名清單必須 `ls frontend/e2e/` 逐一對照，缺檔 = Stage 不完成；不得以「既有 spec 已覆蓋部分」supersede，除非該既有 spec 實際斷言 AC Then/And 對應條款（須逐行比對確認，非檔名猜測）。
5. **Viewport 覆蓋** — AppPage 類 `h-screen flex` + footer 佈局，目視至少 2 種 desktop viewport（1280×800 + 900×600）；PM 已裁決 TD-K021-07 不 fix-now，此條待 K-025 AppPage redesign 時落地。本次不改 persona 硬步驟，避免 scope creep；但我個人 mental checklist 加一條「flex column + fixed-height 容器內有 footer 時，至少 2 種 viewport」。

**做得好：** 略（本輪純反省，Round 1 做得好事項已在下方 2026-04-20 K-021 Sitewide Design System Foundation 條目記錄，不重複）。

---

## 2026-04-20 — K-021 Sitewide Design System Foundation

**做得好：**
- Stage 2 新增 `sitewide-body-paper.spec.ts` 第 6 case（`/business-logic` 登入後狀態）首跑失敗，立即識別出 Playwright LIFO route matching 特性：`mockApis(page)` 裡的 catch-all `/api/**` 註冊在後會覆蓋 test 裡的具體 `/api/auth` 與 `/api/business-logic`。把 `mockApis` 移到具體 route 之前註冊後 6/6 綠。
- Stage 4 改共用組件 `UnifiedNavBar` 前先 `grep -r "UnifiedNavBar\|getByRole.*link.*Logic\|Prediction" frontend/e2e/`，一次找出 `navbar.spec.ts` + `business-logic.spec.ts` 兩個 spec 依賴，避免漏 spec 造成 false positive。
- 全程 6 stage × 5 commit 分批送，每個 commit gate 跑過 `npx tsc --noEmit` + 對應 Playwright spec；沒有一次塞大 commit。

**沒做好：**
- Stage 4 發現 PM Q2 裁決「既有 `text-[#9C4A3B]` 保留或改 `text-brick-dark`（編譯後 CSS 相同）」與用戶 prompt「嚴禁 hardcode hex」直接衝突，但沒有第一時間 blocker 回 PM 確認，而是自行裁定採用 PM 裁決（保留 hex）。理由是 NavBar 既有 8 處 `/text-\[#9C4A3B\]/` Playwright regex 斷言；但「既有斷言 = 不改 hex」這條推論鏈應該由 PM 確認，我不該在兩份指示衝突時自行取捨。根因：PM 裁決 vs 用戶 prompt 的優先級在 engineer.md 沒明文規範，我預設 PM 裁決 > 用戶 prompt，但 CLAUDE.md 第一優先其實是用戶。
- Stage 2 開始就該預見「catch-all `/api/**` 與具體 route 並存」會踩 LIFO，沒有提前做 dry-run 驗證 mock 行為，等到跑 6/6 才發現（雖然快速解決，但是 reactive 而非 preventive）。

**下次改善：**
1. 用戶 prompt 的禁止項（「嚴禁 hardcode hex」、「不得 push」等）與 PM 裁決衝突時，**立即 blocker 回 PM 複核**，不自行裁定。已同步更新 `~/.claude/agents/engineer.md`「Pre-implementation Q&A」段，加一條：「PM 裁決若與用戶 prompt 明文禁止項衝突，一律 blocker 回 PM 確認裁決是否覆蓋用戶 prompt，不自行取捨」。
2. 寫 Playwright spec 用 `page.route('/api/**', ...)` catch-all 時，若同 test 還有具體 `/api/auth` 或 `/api/xxx` route，開 spec 前先心裡過一遍 LIFO matching：「catch-all 在最上面 → 具體 route 疊在後面 → 最後註冊 = 最先匹配」。Checklist 項：test body 內若出現兩層 `page.route`，註冊順序 = 「通用 → 具體」。

---

## 2026-04-20 — K-017 Bug Found Protocol — NavBar Critical

**沒做好：** NavBar 從 `bg-[#0D0D0D]` 改為 `bg-transparent` + `text-[#1A1814]` 後，沒有啟動 dev server 目視確認 /about 和 /diary（仍為 bg-[#0D0D0D] 深色背景）。深色背景上深色文字幾乎不可見，是 Critical 視覺 bug。E2E 103 tests 全過（只驗 class names），Code Review 才抓到。根因：修改全站共用組件後，沒有執行「逐路由目視確認」步驟，誤以為 Playwright 通過等同視覺正確。

**下次改善：** 全站共用組件改動（NavBar / Footer / shared primitives）後，必須啟動 dev server 逐一訪問所有路由（/, /about, /diary, /app）目視確認視覺效果。已加入 engineer.md 前端實作順序第 4 步（2026-04-20）。

## 2026-04-19 — K-017 Phase B–E (/about portfolio enhancement)

**沒做好：** Playwright spec 首跑即 TypeError（`locator().or()` 不存在）與 `not.toBeAttached()` 不存在，顯示寫 E2E 斷言時未確認 API 與版本相容性，依記憶套用較新 API。另外，對「整頁多處出現的文字」（Bug Found Protocol、docs/tickets/K-XXX.md、E2E）未先評估 strict mode 衝突，造成 3 條 regex 斷言失敗。根因：寫斷言前未做「這個 getByText 在整頁是否唯一」的 mental check。

**下次改善：** 寫 Playwright spec 前先 `npx playwright --version` 確認版本，再查 API changelog。對頁面全域可能重複的文字改用 scoped locator（data-* attribute 或 CSS scope）或精確 href selector，不寫全頁 regex 斷言。

---

## 2026-04-19 — K-018 GA4 Tracking

**做得好：** 實作前發現 `BuiltByAIBanner.tsx` 已存在（K-017 已完成），節省了不必要的重建工作；所有 11 個 K-018 ga-tracking.spec.ts 測試一次全綠。設計文件 Option A 判斷正確，FooterCtaSection 改用原生 `<a>` 取代 ExternalLink 避免修改 primitive。

**沒做好：** SPA Link 的 GA click event 測試中，初版沒預料到「SPA navigate 後 dataLayer 會被新頁面覆寫」，靠 `waitForTimeout(100)` 時序依賴解決，不是最健壯的方案。根因：未事先追蹤「click → SPA navigate → 新頁面 JS 執行 → dataLayer 重置」的完整時序對 spy 的影響。

**下次改善：** SPA 導航 CTA 的 GA click event 測試，改用 `page.on('request', ...)` 或 `Promise.race([clickPromise, page.waitForNavigation()])` 的方式捕捉 click 後、navigate 前狀態，不依賴 `waitForTimeout`。

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
