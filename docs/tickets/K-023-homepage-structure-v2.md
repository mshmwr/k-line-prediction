---
id: K-023
title: Homepage 結構細節對齊設計稿 v2（5 項）
status: backlog
type: feat
priority: medium
created: 2026-04-20
---

## 背景

K-017 AC-017-HOME-V2 完成 Homepage v2（`<DiaryTimelineEntry>` + hpHero / hpLogic / hpDiary 基本渲染）後，PM 於 2026-04-20 逐條比對 Pencil 設計稿 v2（`Homepage v2 Dossier` frame `4CsvQ`）與 Playwright 視覺報告，發現 Homepage 仍有 5 項結構細節差異需對齊。

**B-2 左箭頭撤回說明：** 原 memory 誤記「實作有多餘左箭頭」，實際 `DevDiarySection.tsx:99` 正是「— View full log →」無左箭頭，**無差異**，不列入本票。

**完整裁決紀錄：** memory `project_k017_design_vs_visual_comparison.md`（2026-04-20）

## 依賴關係

- **依賴 K-021**（全站設計系統基建）：本票所有 UI 斷言引用 K-021 交付的 Tailwind token / 三字型系統 / NavBar / Footer
- 本票不可在 K-021 放行前開始 Engineer 實作
- **token 用途對齊（PM 2026-04-20 Q2 裁決）：** K-021 定義 `brick = #B43A2C`（hero/title magenta）與 `brick-dark = #9C4A3B`（hover/active variant）兩色並存。本票 A-2 Diary marker 採 `brick-dark`、A-4 Hero 副標第二行磚紅採 `brick`——用途分工與 K-021 決策表一致。Engineer 實作時若選 class 有疑義，以 K-021 ticket「設計決策紀錄」表為準

## 範圍（5 項結構對齊）

含：

### A-2 Diary bullet 矩形磚紅 marker
Homepage `hpDiary` section 裡每條 `<DiaryTimelineEntry>` 左側的 marker 改為矩形磚紅（`20×14px` 長方形，`#9C4A3B` = `brick-dark` 色）

### A-3 Step 卡片 header bar
Homepage `hpLogic` section（4 步流程 / 3-step flow）的每張 Step 卡片頂部加 header bar：
- 背景 `#2A2520`（`charcoal`）
- 文字白色
- 內容 `STEP 01 · INGEST` / `STEP 02 · <...>` / `STEP 03 · <...>` 格式（Geist Mono 10px）

### A-4 Hero 副標第二行磚紅 Bodoni italic
Homepage `hpHero` 的副標分為兩行：
- 第一行：常規副標文字
- 第二行：關鍵句（由 Designer 從設計稿取內容），字型 Bodoni Moda italic，顏色 `brick`（`#B43A2C`）

### A-5 Hero 水平分隔線
Homepage `hpHero` 副標下方加一條全寬水平細線（`#2A2520` `charcoal` 色，1px high），作為 Hero 與下一 section 的視覺分隔

### C-4 Body padding
Homepage 整頁 body 的內邊距對齊設計稿：`padding: 72px 96px`（上下 72px / 左右 96px）

**不含（明確排除）：**
- ~~B-2 左箭頭~~（撤回，實作正確）
- 文案改動（hpHero / hpLogic / hpDiary 文案由 K-017 文案定稿或設計稿決定，本票僅改結構視覺）
- 新 section / 刪 section
- `<BuiltByAIBanner />` 改動（由 K-017 AC-017-BANNER 定義，本票不動）

## 設計決策紀錄

| 決策項目 | 內容 | 來源 |
|----------|------|------|
| 5 項 scope 切分 | 依 PM 逐條比對結果（memory 裡 A-2/A-3/A-4/A-5/C-4） | PM 裁決 2026-04-20 |
| B-2 左箭頭撤回 | 原 memory 記錄錯誤，實作無此差異 | PM 重新比對 2026-04-20 |
| Body padding 採設計稿數值 | `72px 96px`（Pencil frame 4CsvQ） | 設計稿決定 |

## 驗收條件

### AC-023-DIARY-BULLET：Homepage Diary section 每條 entry 左側矩形磚紅 marker `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面滾動至 Diary section（`hpDiary`）
**Then** 每條 `<DiaryTimelineEntry>` 左側的 marker 以矩形呈現（非圓形）
**And** marker 的 computed `width` = `20px`、`height` = `14px`
**And** marker 的 `backgroundColor` 為 `rgb(156, 74, 59)`（`#9C4A3B` = `brick-dark`）
**And** Playwright 斷言：Homepage diary section 中至少 3 個 marker 元素，其 bounding rect 寬 20px 高 14px，computed backgroundColor 為 `rgb(156, 74, 59)`

---

### AC-023-STEP-HEADER-BAR：hpLogic section 每張 Step 卡片頂部 header bar `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面滾動至 hpLogic section（流程步驟區塊）
**Then** 每張 Step 卡片頂部顯示 header bar
**And** header bar `backgroundColor` 為 `rgb(42, 37, 32)`（`#2A2520` = `charcoal`）
**And** header bar 文字色為白（`rgb(255, 255, 255)`）
**And** header bar 文字格式為 `STEP 0X · <LABEL>`（例：`STEP 01 · INGEST`、`STEP 02 · MATCH`、`STEP 03 · PROJECT`，精確標籤由 Architect 從設計稿 frame `4CsvQ` 提取）
**And** header bar 文字字型為 Geist Mono，字級 10px（computed `fontSize` = `10px`）
**And** Playwright 斷言：至少 3 張 Step 卡片各自含一個 header bar，文字符合 `STEP 0X · <WORD>` pattern（regex）

---

### AC-023-HERO-SUBTITLE-TWO-LINE：Hero 副標第二行磚紅 Bodoni italic `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面載入完成
**Then** hpHero section 的副標區域分為兩行
**And** 第一行為常規副標文字（字型沿用 K-017 設計）
**And** 第二行為關鍵句（精確內容由 Architect 從設計稿提取）
**And** 第二行字型為 Bodoni Moda italic（computed `fontFamily` 含 "Bodoni Moda"、`fontStyle` = `italic`）
**And** 第二行文字色為 `text-brick`（computed `color` = `rgb(180, 58, 44)` = `#B43A2C`）
**And** Playwright 斷言：Hero 區有兩行文字，第二行 computed `color` 為 `rgb(180, 58, 44)` 且 `fontStyle` = `italic`

---

### AC-023-HERO-HAIRLINE：Hero 副標下水平分隔線 `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面載入完成
**Then** Hero 副標第二行下方顯示一條全寬水平細線
**And** 細線 `backgroundColor` 或 `borderTopColor` 為 `rgb(42, 37, 32)`（`#2A2520` = `charcoal`）
**And** 細線 `height` 或 `borderTopWidth` 為 1px
**And** 細線 `width` 為 Hero 容器全寬（computed `width` 等於 Hero container 的 content width）
**And** Playwright 斷言：Hero 區塊底部含 `<hr>` 或 `<div>` 元素符合上述尺寸色彩

---

### AC-023-BODY-PADDING：Homepage body 內邊距符合設計稿 `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面載入完成
**Then** Homepage 主 content 容器的 computed `padding` 為 `72px 96px`（或等效 `paddingTop/Bottom: 72px`、`paddingLeft/Right: 96px`）
**And** 此 padding 適用於 hpHero / hpLogic / hpDiary 三個 section 的共同 container
**And** Playwright 斷言：Homepage root container 的 computed `paddingTop` 為 `72px`、`paddingLeft` 為 `96px`

**Given** viewport 寬度 < 768px（行動裝置）
**When** 頁面載入完成
**Then** padding 可降為 responsive 變體（Architect 於設計文件定義，例 `padding: 48px 24px`）
**And** Playwright mobile viewport 斷言：padding 數值 > 0 且不為 desktop 的 `72px 96px`

---

### AC-023-REGRESSION：K-017 既有斷言不回歸 `[K-023]`

**Given** K-017 所有 AC（AC-017-*）於 K-017 關閉時為 PASS，特別是 AC-017-HOME-V2 / AC-017-BANNER
**When** 本票實作完成
**Then** K-017 所有 Playwright 斷言仍 PASS
**And** 特別是 `<BuiltByAIBanner />` 位置（NavBar 下方、Hero 上方）不變動
**And** hpHero / hpLogic / hpDiary 三 section 基本存在斷言仍 PASS
**And** `<DiaryTimelineEntry>` 組件（K-017 Pass 3 設計）的 `layout:none` 絕對定位機制不被破壞
**And** AC-HOME-1 既有斷言（Homepage 四個 section 渲染）仍 PASS
**And** `npx tsc --noEmit` exit 0

---

## 放行狀態

**待 K-021 先完成 + Architect 設計：** Architect 需於 K-021 放行後接手 K-023，產出設計文件 `docs/designs/K-023-homepage-structure.md`，涵蓋：
- 設計稿 frame `4CsvQ` 的精確 Step 標籤文字提取（STEP 01/02/03 各自的 WORD）
- Hero 副標第二行的精確文案提取
- `<DiaryTimelineEntry>` 現有 marker 樣式改為矩形的實作方式（CSS `border-radius: 0` + `width/height`）
- Step 卡片 header bar 的組件結構（新增 `<StepHeaderBar>` vs 直接 inline）
- Body padding responsive breakpoint（desktop vs mobile）

## 相關連結

- [PRD.md — K-023 section](../../PRD.md)（待同步補入）
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket（前置文案 + v2 Pass 3）](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket（前置基建）](./K-021-sitewide-design-system.md)
- [設計稿: homepage-v2.pen frame 4CsvQ](../../frontend/design/homepage-v2.pen)

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上反省；PM 於 QA PASS 後彙整）
