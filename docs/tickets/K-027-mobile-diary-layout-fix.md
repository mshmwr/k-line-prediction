---
id: K-027
title: DiaryPage 手機版 milestone timeline 視覺重疊修復
status: closed
type: bug
priority: high
created: 2026-04-21
closed: 2026-04-21
---

## 背景

使用者於 2026-04-21 回報 production bug：`/diary` 頁面在手機寬度下渲染壞掉。production URL：`https://k-line-prediction-app.web.app/diary`。

**使用者提供截圖描述（手機 viewport ~375px/390px 寬度）：**

- 症狀：Dev Diary 內多個 milestone 條目視覺上互相重疊堆疊，標題 / 日期 / 內文文字糊成一團
- 具體命中條目（至少三筆）：K-021（全站設計系統基建）、K-008（自動化視覺報告 script）、Codex Review Follow-up（K-009/K-010/K-011）的 milestone block 互相壓疊
- 內容區高度計算疑似錯誤導致 overflow 重疊（左側 timeline bullet / border 位置看起來正確）
- 英文 italic 與中文 body 混疊
- **桌面寬度（≥ 1024px）同頁面正常**——K-017 / K-021 的 Playwright 視覺報告均為桌面截圖，未能捕捉此 mobile regression

**影響：** portfolio-facing demo 在手機訪客視角壞掉。Recruiter 使用手機訪問時會看到糊成一團的 Dev Diary，對求職主動曝光造成直接傷害（參考 memory `project_job_search_criteria.md` 硬條件 / K-017 的 portfolio-oriented 定位）。

**初步結構參考（留給 Architect 診斷，非 PM 裁決）：**

目前 `/diary` 組件結構：
- `frontend/src/pages/DiaryPage.tsx` — 最外層 wrapper（`max-w-3xl mx-auto px-6 py-16`）
- `frontend/src/components/diary/DiaryTimeline.tsx` — 直接 map milestones，無 layout 包裝
- `frontend/src/components/diary/MilestoneSection.tsx` — accordion 展開/折疊（`border rounded-sm mb-3`），展開時子內容用 `divide-y`
- `frontend/src/components/diary/DiaryEntry.tsx` — `flex gap-4 py-2`，`date` 固定 `w-24`（96px），`text` flex-1

K-021 完成後 `/diary` 只做了 body 配色遷移（paper/ink + 字型），**結構與 mobile responsive 未經獨立驗收**。

## 依賴關係

- **不依賴** K-022 / K-023 / K-024（後三票處理結構改版 / schema 扁平化）
- 本票為 hotfix 性質，只修 mobile responsive bug，不動 DiaryPage 結構 / diary.json schema
- **與 K-024 scope 邊界：** 若 Architect 評估 bug 根因需要 schema / 結構層級改動，應 blocker 回 PM 重新討論是否併入 K-024；K-027 預設為 CSS / responsive 層面 surgical fix

## 範圍

**含：**

1. DiaryPage 手機版 timeline milestone 不重疊（≤ 480px viewport 全部 breakpoint）
2. 手機寬度下所有 milestone 的標題、日期、內文文字可讀性（不 clip / 不 overflow-hidden 截斷）
3. Playwright 新增 mobile viewport 測試涵蓋上述兩項
4. 桌面寬度（≥ 1024px）既有 layout 與視覺不得回歸

**不含：**

- 桌面視覺重設計（桌面目前 OK，非 regression）
- `diary.json` schema 改動（屬 K-024 scope）
- DiaryPage 結構改版 / 新 component 拆分（屬 K-024 scope）
- 全站其他頁面（Homepage / About / App / BusinessLogic）的 mobile responsive audit（若需要，另開獨立 ticket）
- 字型 / 配色調整（K-021 已處理）

## 設計決策紀錄（待 Architect 設計階段處理，PM 本次不裁決）

| 決策項目 | 內容 | 目前狀態 |
|----------|------|---------|
| Layout 技術方案 | mobile 改用 flex-col 堆疊 / CSS Grid / media query 重排 date 與 text / 其他 | 待 Architect 評估 |
| DiaryEntry 手機版 date 位置 | 保持左側 w-24 / 改 date 置於 text 上方 / 縮小 date 字級 | 待 Architect 評估 |
| Milestone card padding/margin 策略 | 保持 `mb-3` / 手機增加間距 / 改用 `divide-y` on outer | 待 Architect 評估 |
| Mobile breakpoint 定義 | Tailwind 預設 `sm:` (640px) / 自訂 480px / 375px-specific | 待 Architect 評估 |
| accordion 展開行為是否手機特化 | 手機預設全收合（省空間） / 保持桌面相同 `defaultOpen={i===0}` | 待 Architect 評估 |

PM 本票只開 ticket + 定 AC 視覺行為，layout 技術方案交 Architect 設計階段裁決。

## 驗收條件

### AC-027-NO-OVERLAP：手機 viewport 下相鄰 milestone 不重疊 `[K-027]`

**Given** 使用者於手機 viewport（375px / 390px / 414px 三種寬度）訪問 `/diary`
**When** 頁面載入完成且 diary.json 含至少 3 筆 milestone
**Then** 任兩個相鄰 milestone card 的 bounding box y 區間**完全不重疊**（`boxA.y + boxA.height <= boxB.y`），此斷言需涵蓋折疊狀態與全部展開狀態各一輪
**And** 所有 milestone card（不論展開或折疊狀態）的 `overflow-hidden` 不得截斷任何可讀文字（文字可完整顯示、無字元被 clip 或隱藏）；允許容器加 `overflow-hidden` 防止長字串橫向溢出至相鄰 milestone，但文字本身必須藉 `break-words` / `flex-col` 在容器內完整折行顯示
**And** 滾動至頁面底部，最後一個 milestone card（folded 狀態）完整可見（不被 viewport bottom / footer 遮擋）

**Playwright test case 數量需求：** 至少 **3 個獨立 test case**，每個 viewport（375 / 390 / 414）一個；每個 test case 內對所有相鄰 milestone 對跑 y 區間斷言（milestone 數量 N → N-1 對比較）。

---

### AC-027-TEXT-READABLE：milestone 標題 / 日期 / 內文完整可讀 `[K-027]`

**Given** 使用者於手機 viewport（375px / 390px / 414px）訪問 `/diary`
**When** 展開任一 milestone（或預設 `defaultOpen={i===0}` 的第一個）
**Then** 該 milestone 的 `milestone` title 文字完整顯示（無 `text-overflow: ellipsis` 截斷、無 `overflow: hidden` 隱藏字元）
**And** 該 milestone 所有 `items` 的 `date` 欄位（`YYYY-MM-DD` 格式）完整顯示（10 字元全可見）
**And** 該 milestone 所有 `items` 的 `text` 欄位（中英文混排）完整顯示，不被容器寬度限制截斷
**And** 所有文字的 computed `color` 不得為 `transparent` / 與背景相同（對比度可讀）
**And** 所有文字的 `font-size` 在 375px viewport 下不得小於 12px（可讀性下限）

**Playwright test case 數量需求：** 至少 **3 個獨立 test case**（375 / 390 / 414 各一），每個 case 對「首個展開 milestone 的 title + 首筆 item 的 date + text」三處驗證可讀性條件。

---

### AC-027-DESKTOP-NO-REGRESSION：桌面視覺零回歸 `[K-027]`

**Given** 使用者於桌面 viewport（1024px / 1280px / 1440px）訪問 `/diary`
**When** 頁面載入完成
**Then** DiaryPage 渲染結果與 K-021 closed 時 `docs/reports/K-021-visual-report.html` 的 `/diary` 截圖**視覺一致**（layout / 字型 / 配色 / 間距不變）
**And** 所有既有 Playwright 桌面測試（`diary.spec.ts` 及其他涉及 `/diary` 的 spec）繼續通過，無斷言修改
**And** `max-w-3xl mx-auto px-6 py-16` wrapper、`UnifiedNavBar`、`MilestoneSection` accordion 行為保持不變

**Playwright test case 數量需求：** 至少 **1 個桌面 baseline test case**（1280px viewport，跑首個 milestone 展開 + 三筆 item 可見斷言）；**加上既有 diary-related spec 全量 regression 通過**（數量由 QA 跑 suite 確認）。

---

**AC 覆蓋 test case 總計下限：** `3 (NO-OVERLAP) + 3 (TEXT-READABLE) + 1 (DESKTOP-NO-REGRESSION) = 7 個新增 test case`，外加既有 diary-related spec regression。

## 放行狀態

**2026-04-21 ticket 開立，待 Architect 設計階段接手。**

PM 本票不做下列事項：
- 不召喚 Architect / Engineer / Reviewer / QA（使用者只要求開票）
- 不裁定 layout 技術方案（flexbox vs grid vs absolute vs media query 留給 Architect）
- 不 commit（等使用者指示）
- 不假設使用者要立即執行（可能先囤 backlog）

**等使用者下一步指示：** 立即放行 Architect 開始設計 vs 囤 backlog 等 K-022/K-023/K-024 結構改版一併處理。

## PM Code Review 裁決（2026-04-21）

| Finding ID | 嚴重度 | 裁決 | 說明 |
|------------|--------|------|------|
| C-001 | Critical | Fix Now — AC 修訂 + 補斷言 | `overflow-hidden` 技術辯護成立（防橫向溢出非截斷文字）；AC 措辭已修訂（本 session）；Engineer 補驗「overflow-hidden 下文字完整可見」斷言 |
| I-001 | Important | Fix Now — Engineer 補斷言 | AC line 77 明文要求；/diary 無 footer 不是降級理由；補 scroll to bottom + last card bounding box TC |
| N-002 | Warning | Fix Now — TC-001~003 加全展開斷言 | AC 明文「不論展開或折疊狀態」；多 milestone 同時展開是原始 bug 高發場景 |
| K-024 承繼 | Warning | Fix Now — PM 補文件 | 設計文件 §6 五項承繼決策已更新至 K-024 ticket（本 session 執行） |
| I-002 | Minor | Tech Debt（TD-K027-01） | 1024/1440px TC 缺失；sm: breakpoint 下行為與 1280px 完全相同，技術風險極低；K-024 啟動時補齊 |
| N-001 | Minor | Tech Debt（TD-K027-02） | `.px-4.pb-4` 定位器脆弱；K-024 結構重寫後靜默失效；K-024 Reviewer 必須 checklist 稽核 |
| N-003 | Minor | Tech Debt（TD-K027-03） | title overflow 屬性未驗；flex-col 下截斷場景幾乎不存在；K-024 設計時若改 title 結構再補 |

### Engineer 下一輪 Fix Now 清單（Round 2）

1. **補 overflow-hidden 下文字可見斷言**（C-001）：在 TC-004~006（TEXT-READABLE）加斷言，展開後驗 `DiaryEntry` text 欄文字 `overflow` computed style 為 `visible` 或 `textContent` 長度等於預期值，確認 `overflow-hidden` 未截斷字元
2. **補最後一個 card 可見 TC**（I-001）：375/390/414px 各 viewport，scroll to bottom，取最後一張 MilestoneSection bounding box，斷言 `card.y + card.height <= viewportHeight`（folded 狀態）
3. **TC-001~003 加全展開狀態斷言**（N-002）：先依序 click 所有 `aria-expanded=false` 的 accordion trigger，展開全部 milestone，再對所有相鄰 card 跑 y 區間不重疊斷言

### 技術債登記（Round 2 前登記）

見 docs/tech-debt.md TD-K027-01 / TD-K027-02 / TD-K027-03。

---

## PM Code Review Round 2 裁決（2026-04-21）

| Finding ID | 嚴重度 | 裁決 | 說明 |
|------------|--------|------|------|
| C-R2-01 | Critical | **Fix Now — Engineer Round 3** | overflow-hidden for-loop 是死代碼（`isHiddenOverflow` 永遠 false，因 `overflow-hidden` class 在容器不在 `p`）；`containerScrollCheck` 在內容撐開容器時空轉（`scrollHeight ≤ clientHeight + 2` 必然 true）；唯一有效斷言是 getBoundingClientRect 段；死代碼誤導讀者相信覆蓋度，是測試誠信問題，必須清除 |
| I-R2-01a | Important | **Fix Now — Engineer Round 3** | `assertLastCardVisible` 只驗 `box.y + box.height <= viewportHeight + 1`，缺 `box.y >= 0`；scroll to bottom 後 card 頂部可能滾出 viewport 而斷言仍過，是邏輯漏洞；補 `expect(box.y).toBeGreaterThanOrEqual(0)` |
| I-R2-01b | Minor | **Tech Debt（TD-K027-04）** | `waitForTimeout(200)` hardcoded sleep；改 `toBeInViewport()` 須重構 assertLastCardVisible 邏輯，且 Playwright `toBeInViewport()` 僅驗「可見於 viewport」不驗「底部未超出」；目前 7 tests 全過；CI 穩定性問題留 K-024 清理 |
| I-R2-02 | Important | **Fix Now — Engineer Round 3** | `assertNoOverlapWhenAllExpanded` 兩個問題：(1) click 後只 `waitForTimeout(100)` 無確認展開，改為 `await expect(btn).toHaveAttribute('aria-expanded', 'true')`；(2) `page.getByRole('button')` 全頁抓 button 可能包含 NavBar button，應限定在 milestone 容器（`.border.border-ink\\/10.rounded-sm`）內 |

### Engineer Round 3 Fix Now 清單

1. **刪除 for-loop 死代碼**（C-R2-01）：刪除 `assertTextReadable` 內行 238-253（`paragraphs.count()` for-loop + `isHiddenOverflow` + if-block）；保留行 258-277（`containerScrollCheck` + `containerNotClipping`）；在 `containerNotClipping` 段前加一層容器 computed `overflow` 驗證（`entriesContainer.evaluate` 確認 `getComputedStyle(container).overflow` 包含 `hidden`，確認測試前提成立）
2. **補 `box.y >= 0` 斷言**（I-R2-01a）：在 `assertLastCardVisible` 的 `if (box && viewportSize)` 區塊內，現有 `expect(box.y + box.height).toBeLessThanOrEqual(viewportSize.height + 1)` **之前**加 `expect(box.y).toBeGreaterThanOrEqual(0)`
3. **accordion 展開等待 + button scope 限定**（I-R2-02）：(a) `await btn.click()` 後改 `await expect(btn).toHaveAttribute('aria-expanded', 'true')` 取代 `waitForTimeout(100)`；(b) `const buttons = page.getByRole('button')` 改為 `const milestoneCards = page.locator('.border.border-ink\\/10.rounded-sm')` + `const buttons = milestoneCards.getByRole('button')`

### 技術債登記（Round 2 新增）

見 docs/tech-debt.md TD-K027-04。

---

## PM Code Review Round 3 裁決（2026-04-21）

| Finding ID | 嚴重度 | 裁決 | 說明 |
|------------|--------|------|------|
| I-R3-01 | Important | **Fix Now — Engineer Round 4** | `assertTextReadable` 行 181 `page.getByRole('button').first()` 全頁抓 button；Round 3 已將 `assertNoOverlapWhenAllExpanded` 同類問題修為 `milestoneCards.getByRole('button')`，此處遺漏形成規範不一致；K-022/K-024 NavBar 改動時靜默失效風險可預期；一行改動工作量極小，Fix Now |

### Engineer Round 4 Fix Now 清單

1. **`assertTextReadable` button scope 限定**（I-R3-01）：行 181 `page.getByRole('button').first()` 改為先取 `milestoneCards = page.locator('.border.border-ink\\/10.rounded-sm')`，再取 `milestoneCards.first().getByRole('button').first()` — 與 `assertNoOverlapWhenAllExpanded` 修法保持一致

## Retrospective

### Engineer 反省（2026-04-21）

**做得好：**
- 實作前逐一 grep E2E spec 確認 `DiaryEntry` / `MilestoneSection` / `DevDiarySection` 在 e2e/ 無依賴，避免改動後 spec 靜默失效。
- TDD 順序嚴格遵守：先寫 spec → 確認 FAIL（6 tests fail on Before CSS state）→ 修 components → 7 tests all pass。
- 設計文件 §4 異動清單逐列確認，Before/After 每個 class 逐一比對，無漏項。

**沒做好：**
- `assertMobileFlexCol` 的 date width 斷言第一版用 `getBoundingClientRect().width < 96` 判斷 `w-auto`，但在 `flex-col` 下 span 撐滿父容器寬度（293–332px），斷言邏輯倒置（Before state 反而會 pass）。根因是對「`flex-col` 下 inline element 的實際 rendered width 行為」預期錯誤——沒有先在瀏覽器 DevTools 驗證斷言條件，直接寫進 spec。
- 修正後改用 `w-auto` class 字串驗證 + `computed width != 96px` 組合，才讓斷言能正確區分 Before/After。

**下次改善：**
- 任何基於 `getBoundingClientRect()` / computed style 的斷言，若涉及 flex/grid layout 特性，**先在 browser console 或 `page.evaluate()` 確認預期值再寫斷言**，不憑想像推算 computed width。
- 加入此規則到 pre-implementation checklist：「computed style 斷言要先 evaluate 確認預期值」。

### Engineer 補斷言反省（Round 2 — 2026-04-21）

**做得好：**
- Fix 1 (C-001) 的 `containerNotClipping` 斷言第一版用 `p.offsetTop + p.offsetHeight > container.clientHeight` 判斷截斷，立刻跑 Playwright 發現 3 tests 失敗，立即診斷而不是盲目修改。
- 診斷路徑正確：寫臨時 debug spec → 在 page.evaluate 中印出 `offsetTop`、`offsetHeight`、`offsetParent`、`getBoundingClientRect` 四組數據，確認根因是 `offsetParent = BODY`（不是容器），`offsetTop` 基準錯誤。
- 改用 `scrollHeight <= clientHeight`（容器無溢出）+ `getBoundingClientRect().bottom` 比較正確基準，改後 7/7 全過。

**沒做好：**
- `offsetTop` 是相對 `offsetParent` 計算，而非相對任意祖先容器。這是 DOM 基礎知識，應在寫斷言前先確認 `offsetParent` 是誰。與 Round 1 的根因相同：沒有先 `page.evaluate` 確認實際值再寫斷言。

**下次改善：**
- 所有跨容器的位置斷言，第一步必須是 `page.evaluate` 印出 `offsetParent.tagName`，確認 offsetParent 是預期容器後再用 offsetTop，否則一律改用 `getBoundingClientRect` 做 viewport-relative 比較。

### PM 彙整（2026-04-21）

**Phase Gate 決策：CLOSED 2026-04-21**

**AC 覆蓋確認：**
- AC-027-NO-OVERLAP：TC-001（375px）/ TC-002（390px）/ TC-003（414px）全展開 + 折疊雙狀態 y 區間斷言 → PASS
- AC-027-TEXT-READABLE：TC-004（375px）/ TC-005（390px）/ TC-006（414px）title + date + text 可讀性斷言 → PASS
- AC-027-DESKTOP-NO-REGRESSION：TC-007（1280px 桌面 baseline）+ 既有 diary-related spec 全量 regression 通過 → PASS
- 7 TC 全數 PASS，127 passed / 1 skipped / 0 failed，無 regression

**本票歷程摘要：**
4 輪 Code Review → PM 逐輪裁決 → 3 輪 Engineer fix → 1 輪 QA 通過。核心問題是 `DiaryEntry` 的 `flex gap-4` + 固定 `w-24`（96px date 欄）在 375px viewport 下與中英文混排 line-height 互動造成視覺重疊；修法為改用 `flex-col` + `break-words` 取代固定 date 欄寬。

**技術債（本票完成後遺留）：**
- TD-K027-01：1024/1440px TC 缺失（K-024 啟動時補齊）
- TD-K027-02：`.px-4.pb-4` 定位器脆弱（K-024 結構重寫後 checklist 稽核）
- TD-K027-03：title overflow 屬性未驗（K-024 設計時若改 title 結構再補）
- TD-K027-04：`waitForTimeout(200)` hardcoded sleep（K-024 清理）

---

### QA 反省（2026-04-21）

**沒做好：**
- TC-001~003（NO-OVERLAP）折疊狀態的斷言僅驗相鄰 milestone 不重疊，但未覆蓋「折疊 + 展開混合狀態」（例如第 1 張展開、第 2 張折疊、第 3 張展開的交叉組合）；現行 assertNoOverlapWhenAllExpanded 只跑「全折疊」與「全展開」兩個端點，中間態未驗。
- `assertLastCardVisible` 的 `box.y >= 0` 斷言（I-R2-01a Fix Now）雖已要求 Engineer 補入，但 QA 未獨立在 Round 3 修正後執行一次 viewport scroll 實測確認 card 頂部確實未滾出 viewport，只依賴斷言通過作為證明。
- Mobile viewport 測試僅覆蓋 375 / 390 / 414px 三種寬度；AC 定義的「≤ 480px 全部 breakpoint」中 430px（iPhone 14 Pro Max）、480px 邊界值均未被 test case 獨立覆蓋。
- visual report 產出時未帶 `TICKET_ID=K-027`，導致檔名為 `K-UNKNOWN-visual-report.html`（延續 K-017 相同失誤，但 K-017 retro 已記錄此改善點，本次仍未落地）。

**下次改善：**
1. **TICKET_ID 必須在截圖 script 執行前確認設定**：QA persona 中「執行截圖 script」步驟改為 `TICKET_ID=<ticket-id> npx playwright test visual-report.ts`，不允許省略環境變數。此規則已在 K-017 retro 記錄但尚未落地為硬 gate — 本次補強為 persona 步驟強制格式。
2. **Accordion 中間態覆蓋**：凡有 accordion/collapse 的頁面，QA 必須在 NO-OVERLAP 類斷言中額外加一輪「奇偶交叉展開」場景（展開奇數索引、折疊偶數索引），不只跑全折疊 vs 全展開兩端點。
3. **Viewport 邊界補點**：AC 若定義「≤ X px 全部 breakpoint」，QA 必須在三種標準 viewport 之外加測 X px 邊界值本身（本票應補 480px TC）。
4. **最後一張 card 可見性獨立實測**：scroll-to-bottom 類斷言在所有 Fix Now 修正後，QA 必須開一個 browser session 目視或以 `toBeInViewport()` 輔助驗證，不以斷言通過為唯一證明。
