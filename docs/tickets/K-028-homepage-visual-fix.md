---
id: K-028
title: Homepage 視覺修復 — section spacing 補充 + DevDiarySection entry 高度自適應
status: await-deploy
type: fix
priority: high
created: 2026-04-21
qa-early-consultation: docs/retrospectives/qa.md 2026-04-21 K-028 entry (6 challenges: 4 must-add supplemented to AC, 2 declared Known Gap)
---

## 背景

K-023（Homepage 結構細節對齊 v2）部署後，現場截圖發現兩個視覺問題：

### 問題 1：Homepage section spacing 缺失（K-023 設計決策副作用）

K-023 AC-023-BODY-PADDING PM 裁決（SQ-023-04 Q2）：「HeroSection / ProjectLogicSection / DevDiarySection 各自的 `py-XX px-6 max-w-5xl mx-auto` 必須移除，避免與 body padding 雙重疊加」。

Engineer 正確執行了此裁決——各 section 的 per-section padding 已移除，body container padding 已套用正確數值（`sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]`）。

**然而**，移除 per-section padding 後，section 之間（HeroSection ↔ ProjectLogicSection ↔ DevDiarySection）完全沒有 vertical spacing，三個 section 緊貼在一起，視覺上凌亂、無層次感。設計稿 frame `4CsvQ` 顯示各 section 之間應有明確間距。

**根因判斷：K-023 設計決策本身正確（body padding 統一），但 K-023 ticket AC 沒有明確定義 section 間 vertical spacing 應為多少。本 issue 不屬於 K-023 regression（K-023 實作符合 AC），而是 K-023 設計決策執行後暴露的設計缺口，需新票補充。**

### 問題 2：DevDiarySection entry 文字重疊（舊有缺陷由 K-023 diary.json 更新觸發）

`DevDiarySection.tsx` 使用 `ENTRY_HEIGHT = 140` 固定高度做 absolute positioning：
```js
const ENTRY_HEIGHT = 140
const ENTRY_GAP = 20
const top = i * (ENTRY_HEIGHT + ENTRY_GAP)  // 每個 entry 從固定 top 位置開始
```

此設計假設每條 entry 的渲染高度不超過 140px。K-023 diary.json 新增的 milestone entry 文字長度明顯超過前幾條（K-023 milestone text 約 270 字元，遠超舊 entry 的 ~80 字元），導致：

- entry 0（K-023）的實際渲染高度 > 140px
- entry 1（K-022）的 absolute top = 160px，與 entry 0 的渲染內容重疊

**根因判斷：此為 DevDiarySection 長期存在的設計缺陷（假設固定高度），K-023 沒有修改此組件，但 K-023 diary.json 更新觸發了缺陷暴露。不屬於 K-023 regression，屬於 pre-existing structural issue 的新觸發。**

## 範圍

### 修復項目 1：Section 間 vertical spacing

在 `HomePage.tsx` root container 中，HeroSection / ProjectLogicSection / DevDiarySection 三個 section 之間補充適當的 vertical spacing，對齊設計稿 frame `4CsvQ` 的 section 間距。

**不含：**
- 修改 body container padding 數值（K-023 AC-023-BODY-PADDING 已定義，不動）
- 修改各 section 的 horizontal layout

### 修復項目 2：DevDiarySection entry 高度自適應

將 `DevDiarySection.tsx` 的 absolute positioning layout 改為允許每條 entry 的高度由內容決定，消除因 `ENTRY_HEIGHT = 140` 固定假設導致的文字重疊。

**改版方向：** 從 absolute positioning + 固定 totalHeight 改為 flex-col 或 relative flow layout，保留 vertical rail 視覺效果，但各 entry 高度由內容自適應。

**不含：**
- 修改 DevDiarySection 的 header row 樣式（`§ DEV DIARY` badge + 分隔線）
- 修改「— View full log →」連結
- 修改 marker 尺寸（20×14px 矩形，K-023 已定義）

## 依賴關係

- 無前置 ticket 依賴（K-023 已 closed，本票獨立修復）

## AC 設計決策紀錄

| 決策項目 | 內容 | 來源 |
|----------|------|------|
| Section spacing 數值 | 待 Architect 從設計稿 frame `4CsvQ` 提取精確值 | Architect SQ |
| DevDiarySection layout 改版方案 | 待 Architect 設計（absolute → flow-based）| Architect 設計文件 |
| Mobile viewport 斷言要求 | 兩個 AC 均需含 375px viewport 驗收 | K-027 retrospective 規範 |

## 驗收條件

### AC-028-SECTION-SPACING：Homepage section 之間有適當 vertical spacing `[K-028]`

**Given** 使用者訪問 `/`
**When** 頁面載入完成
**Then** HeroSection 與 ProjectLogicSection 之間的視覺間距足夠清晰，兩 section 不緊貼在一起
**And** ProjectLogicSection 與 DevDiarySection 之間的視覺間距足夠清晰，兩 section 不緊貼在一起
**And** Playwright 斷言：HeroSection root element（`<section>`）與 ProjectLogicSection root element 的 bounding box 之間的 gap > 32px（desktop 1280px viewport）
**And** Playwright 斷言：ProjectLogicSection root element 與 DevDiarySection root element 的 bounding box 之間的 gap > 32px（desktop 1280px viewport）

**Given** viewport 寬度 375px（mobile）
**When** 頁面載入完成
**Then** HeroSection 與 ProjectLogicSection 之間的視覺間距在 mobile viewport 下仍清晰可見，兩 section 不緊貼
**And** ProjectLogicSection 與 DevDiarySection 之間的視覺間距在 mobile viewport 下仍清晰可見，兩 section 不緊貼
**And** Playwright mobile 斷言：兩處 section gap 均 > 16px（375px viewport）

**Given** viewport 寬度 640px（Tailwind `sm` 斷點起點）
**When** 頁面載入完成
**Then** section gap 套用 desktop 值（72px），不套用 mobile 值（24px）
**And** Playwright 斷言：HeroSection ↔ ProjectLogicSection gap 為 72px（±2px 誤差）於 640px viewport

**Given** viewport 寬度 639px（Tailwind `sm` 斷點正下方）
**When** 頁面載入完成
**Then** section gap 套用 mobile 值（24px），不套用 desktop 值（72px）
**And** Playwright 斷言：HeroSection ↔ ProjectLogicSection gap 為 24px（±2px 誤差）於 639px viewport

**PM Note：** 精確 gap 數值由 Architect 從設計稿 frame `4CsvQ` 提取 = 72px desktop / 24px mobile（`gap-6 sm:gap-[72px]`）。tablet 斷點斷言（640px / 639px）由 QA Early Consultation #3 補入，防 Tailwind `sm` 斷點 regression。

---

### AC-028-DIARY-ENTRY-NO-OVERLAP：DevDiarySection 各 entry 渲染不重疊 `[K-028]`

**Given** 使用者訪問 `/`，`diary.json` 包含至少 3 個 milestone，各 milestone 的 text 欄位長度不均（包含長文字 entry，如 K-023 的 ~270 字元 text）
**When** 頁面滾動至 Diary section（`hpDiary`）
**Then** 每條 diary entry 的渲染內容（milestone 標題 + 日期 + text 段落）完整可見，不被相鄰 entry 遮蓋
**And** 相鄰兩條 entry 的 bounding box 不重疊（bottom of entry N ≤ top of entry N+1）
**And** vertical rail 仍貫穿所有 entry（視覺上不斷開）
**And** Playwright 斷言：取前 3 個 diary entry wrapper 元素，逐對確認 entry[N].boundingBox().y + entry[N].boundingBox().height ≤ entry[N+1].boundingBox().y（允許 ±2px 誤差）

**Given** viewport 寬度 375px（mobile）
**When** 頁面滾動至 Diary section
**Then** 3 條 diary entry 在 375px viewport 下各自完整可讀，不截斷、不重疊
**And** Playwright mobile 斷言：同上 bounding box 不重疊斷言，於 375px viewport 執行

---

### AC-028-DIARY-EMPTY-BOUNDARY：diary.json 異常數量下不崩潰 `[K-028]`

**Given** `diary.json` 回傳 0 個 milestone（或 `useDiary(3).entries.length === 0`）
**When** 頁面載入完成
**Then** `DevDiarySection` 不 render 任何 entry，不顯示 rail，不出現 layout crash
**And** 「— View full log →」連結行為不變
**And** Playwright 斷言：`data-testid="diary-entry-wrapper"` 元素數量為 0，rail element（`aria-hidden` rail div）不存在或 `height === 0`

**Given** `diary.json` 回傳恰好 1 個 milestone
**When** 頁面載入完成
**Then** 1 條 entry render，marker 可見，rail 可退化為 height=0 無 layout artifact
**And** Playwright 斷言：`data-testid="diary-entry-wrapper"` 元素數量為 1，marker `boundingBox().width === 20 && height === 14`

**PM Note：** diary.json 為 runtime JSON，理論上可被手動改為空或 1 entry；補此 AC 防 empty state 未 tested regression。Architect §2.6 已涵蓋 engineering 實作。

---

### AC-028-DIARY-RAIL-VISIBLE：vertical rail 具獨立可驗證存在性 `[K-028]`

**Given** `diary.json` ≥ 3 個 milestone
**When** 頁面載入至 Diary section
**Then** rail element（vertical line）存在於 DOM 並可見
**And** rail 寬度為 1px，高度大於 0
**And** rail 位於 `diary-entries` 容器內（子關係），視覺上貫穿 entries 垂直範圍
**And** Playwright 斷言：`data-testid="diary-rail"` 元素存在 + `boundingBox().width === 1` + `height > 0` + rail 的 top / bottom 落在 `data-testid="diary-entries"` 容器 bbox 範圍內

**PM Note（2026-04-21 裁決）：** 原 AC 初稿寫「rail 覆蓋 first marker center → last marker center（±4px）」屬過度 prescriptive — 將 Architect rail 定位設計（top:40 / bottom:40 對齊 title baseline）機械化死，違反 `feedback_pm_ac_visual_intent`（AC 寫視覺意圖，不寫 property value）。改以「rail 存在 + 有高度 + 落在 entries 容器內」作為「Engineer 不得刪除 rail」的防禦斷言，設計意圖交 Architect 決定。Engineer BQ 觸發 PM 裁決 Option C。

---

### AC-028-REGRESSION：K-023 已通過的斷言不回歸 `[K-028]`

**Given** K-023 所有 AC（AC-023-*）於 K-023 關閉時為 PASS
**When** 本票實作完成
**Then** K-023 所有 Playwright 斷言仍 PASS，特別是：
**And** AC-023-DIARY-BULLET：marker 矩形（20×14px，`rgb(156, 74, 59)`，`borderRadius: 0px`）不變動
**And** AC-023-STEP-HEADER-BAR：3 個 STEP header bar 文字、字型、背景色不變動
**And** AC-023-BODY-PADDING：desktop padding `72px / 96px / 96px / 96px` + mobile padding `32px / 24px` 不變動
**And** `npx tsc --noEmit` exit 0

**And** AC-028-MARKER-COORD-INTEGRITY：marker parent 從 absolute wrapper 改為 flex-col entry 後，`firstMarker.boundingBox()` 仍回傳 `width === 20 && height === 14`（非 0/null）；`backgroundColor === 'rgb(156, 74, 59)'`；`borderRadius === '0px'`；前 3 個 entry 皆滿足
**And** AC-028-MARKER-COUNT-INTEGRITY：`[data-testid="diary-marker"]` 元素數量恰等於 `useDiary(3).entries.length`（3），無雙渲染或漏渲染

---

## Known Gap（PM 自 QA Early Consultation 裁決宣告）

### KG-028-01：長字串（40-char 無空白連續字串）mobile 375px overflow 不測

**QA Challenge #4 原文：** `break-words` 對 40-char 無空白字串的處理未測試。
**PM 裁決：** 宣告 Known Gap。
**理由：** 生產 data（`frontend/public/diary.json`）text 欄位皆為中英文混合句，無純 40-char 無空白連續字串；diary 內容均為人類語意，URL 若出現也會因格式切分；ROI 低於補測試成本。
**風險：** 若未來 diary.json 引入純 URL / hash 字串，mobile 可能水平 overflow。
**Mitigation：** Engineer 使用 `break-words`（Architect §2.6 已指定），覆蓋 95% 情境；若日後有實例可補測試。

### KG-028-02：`document.documentElement.scrollHeight` / footer 可見性不獨立測

**QA Challenge #6 原文：** flex-col refactor 後 page scrollHeight 改變，無 AC 驗 footer 仍可見。
**PM 裁決：** 宣告 Known Gap。
**理由（2026-04-21 Code Review 後修訂）：** 現有 `pages.spec.ts` **未** 獨立斷言 HomeFooterBar visibility-in-viewport（原措辭「既有斷言間接覆蓋」過強，已修正）。改為工程判斷 — flex-col refactor 僅改 diary entries 內部定位（absolute → flow），HomePage 根 padding 未動（K-023 AC-023-BODY-PADDING 仍測），footer render 位置由 HomePage.tsx 結構決定，flex-col 不會產生極端 scrollHeight；此判斷 + QA regression 階段手測（dev server 滾到底目視）為 acceptable Mitigation。
**風險：** 若未來 diary 出現極端長度內容（例如 100+ milestone），page 變長但不影響 footer 存在性；無 runtime crash 風險。
**Mitigation：** QA regression 手測 footer at `/` 頁底可見；若 P2 TD-028-C 升級為補 AC 則此 KG close。

---

## 放行狀態

**已放行 Engineer：** 2026-04-21 PM 裁決
- ✓ QA Early Consultation 完成（6 challenges: 4 must-add → AC supplemented, 2 Known Gap）
- ✓ Architect 設計文件齊（`docs/designs/K-028-homepage-visual-fix.md`，Pencil frame `4CsvQ` 值已提取）
- ✓ AC 總計：AC-028-SECTION-SPACING（desktop + mobile + tablet 640/639）、AC-028-DIARY-ENTRY-NO-OVERLAP、AC-028-DIARY-EMPTY-BOUNDARY、AC-028-DIARY-RAIL-VISIBLE、AC-028-REGRESSION（含 MARKER-COORD-INTEGRITY + MARKER-COUNT-INTEGRITY）
- ✓ Known Gap 明文：KG-028-01 / KG-028-02

## Tech Debt

依 2026-04-21 Code Review（breadth + depth）兩層結果補入。無 Critical / Warning，3 TD 為測試覆蓋精細化與文件措辭精確化，不阻塞 merge。

### TD-028-A：marker x-center 與 rail x-center alignment 無斷言 `priority: P3`

**Gap:** AC-028-MARKER-COORD-INTEGRITY 斷言 marker width/height/bg/radius，未斷言 marker x-center 與 rail x-center 對齊。現況 rail `left: 29`、marker `left: 20 + w/2 = 30` 僅 1px 偏差（refactor 前後皆同，非回歸），但 parent 從 absolute wrapper 改 `relative pl-[92px]` 後，未來 refactor 可能無聲 drift。

**Follow-up:** 加一條 `marker.x + marker.width/2 ≈ rail.x + rail.width/2 ± 2` 斷言。

---

### TD-028-B：1-entry rail collapse height 無斷言 `priority: P3`

**Gap:** AC-028-DIARY-EMPTY-BOUNDARY 的 0-entry 分支斷言 rail 不存在或 height 0；1-entry 分支只斷言 entry count 與 marker dims，未斷言 rail collapse 高度（design §2.6 row 2 預測 ~0）。

**Follow-up:** 加 `expect((await rail.boundingBox())?.height ?? 0).toBeLessThanOrEqual(8)` 到 1-entry test。

---

### TD-028-C：KG-028-02 Mitigation 措辭過強 `priority: P2`

**Gap:** Known Gap KG-028-02 寫「HomeFooterBar 可見性已由既有 pages.spec.ts 其他斷言間接覆蓋」；實際 grep `pages.spec.ts` 無 footer visibility-in-viewport 斷言。宣稱過強，違反 memory `feedback_retrospective_honesty`（不過這是 PM 自己的 ticket 措辭，非 retrospective）。

**Follow-up:** 二選一 — (a) 修改 ticket KG-028-02 措辭為「未獨立驗；依賴 flex-col refactor 不會產生極端 scrollHeight 的工程判斷」，或 (b) 補一條 footer visibility 斷言降級 KG → closed。PM 裁決 P2 = 下一 iteration 處理，本票 close 前至少改措辭。

## 相關連結

- [K-023 ticket（前置，body padding 設計決策）](./K-023-homepage-structure-v2.md)
- [K-027 ticket（DevDiarySection 絕對定位機制相關）](./K-027-mobile-diary-layout-fix.md)
- [設計稿: homepage-v2.pen frame 4CsvQ](../../frontend/design/homepage-v2.pen)
- [PRD.md — K-025 section](../../PRD.md)（待補入）

---

## Retrospective

（Architect / Engineer / Reviewer / QA / PM 各自於完成階段補上）
