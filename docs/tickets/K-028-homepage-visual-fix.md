---
id: K-028
title: Homepage 視覺修復 — section spacing 補充 + DevDiarySection entry 高度自適應
status: open
type: fix
priority: high
created: 2026-04-21
qa-early-consultation: N/A — reason: all ACs are happy-path layout fix, no error state / boundary / network / auth edge cases
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

**PM Note：** 精確 gap 數值由 Architect 從設計稿 frame `4CsvQ` 提取後補入 Playwright 斷言。上述 `> 32px` / `> 16px` 為最低門檻，Architect 若提取到更大值則以設計稿為準。

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

### AC-028-REGRESSION：K-023 已通過的斷言不回歸 `[K-028]`

**Given** K-023 所有 AC（AC-023-*）於 K-023 關閉時為 PASS
**When** 本票實作完成
**Then** K-023 所有 Playwright 斷言仍 PASS，特別是：
**And** AC-023-DIARY-BULLET：marker 矩形（20×14px，`rgb(156, 74, 59)`，`borderRadius: 0px`）不變動
**And** AC-023-STEP-HEADER-BAR：3 個 STEP header bar 文字、字型、背景色不變動
**And** AC-023-BODY-PADDING：desktop padding `72px / 96px / 96px / 96px` + mobile padding `32px / 24px` 不變動
**And** `npx tsc --noEmit` exit 0

---

## 放行狀態

**待 Architect 設計文件：** Architect 接手後需產出 `docs/designs/K-025-homepage-visual-fix.md`，涵蓋：
1. 設計稿 frame `4CsvQ` section 間距精確數值（px 或 Tailwind class）
2. DevDiarySection layout 改版方案（absolute → flow-based）的組件結構 pseudo-diff
3. Playwright 斷言策略（bounding box gap 取哪個 testid 或 selector）

## Tech Debt

（留空，依 Code Review 結果補入）

## 相關連結

- [K-023 ticket（前置，body padding 設計決策）](./K-023-homepage-structure-v2.md)
- [K-027 ticket（DevDiarySection 絕對定位機制相關）](./K-027-mobile-diary-layout-fix.md)
- [設計稿: homepage-v2.pen frame 4CsvQ](../../frontend/design/homepage-v2.pen)
- [PRD.md — K-025 section](../../PRD.md)（待補入）

---

## Retrospective

（Architect / Engineer / Reviewer / QA / PM 各自於完成階段補上）
