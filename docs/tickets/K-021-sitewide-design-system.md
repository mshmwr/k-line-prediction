---
id: K-021
title: 全站設計系統基建 — 配色 + 字型 + NavBar + Footer 共用組件
status: backlog
type: feat
priority: high
created: 2026-04-20
---

## 背景

K-017 完成 `/about` portfolio-oriented 改版後，PM 於 2026-04-20 逐頁比對設計稿 v2（`frontend/design/homepage-v2.pen`）與 Playwright 視覺報告（`docs/reports/K-017-visual-report.html`），發現三頁面（Homepage / About / Diary）呈現**整頁配色系統顛倒**（設計稿為米白紙本風 vs 實作為 dark-mode）與字型系統缺失（設計稿採三字型 Bodoni/Newsreader/Geist Mono vs 實作為 system default / font-mono）的核心差異。

此為 K-021/K-022/K-023/K-024 四票裁決結果的 **前置基建票**：配色 token、字型系統、NavBar、Footer 均為全站共用，必須先完成後，K-022（About 結構）/ K-023（Homepage 結構）/ K-024（Diary 結構）才能基於統一 token 實作頁面差異。

**完整裁決紀錄：** memory `project_k017_design_vs_visual_comparison.md`（2026-04-20）

## 依賴關係

- **本票為 K-022 / K-023 / K-024 的前置依賴**，必須先於其他三票完成
- 後三票所有 UI AC 均引用本票交付的 token / 字型 / 共用組件

## 範圍

**含：**

### 1. Tailwind theme token（全站配色系統）
於 `frontend/tailwind.config.js` 的 `theme.extend.colors` 補上：
- `paper` (bg base)：`#F4EFE5`（米白紙本色）
- `ink` (主文)：`#1A1814`
- `brick` (magenta accent)：`#B43A2C`
- `brick-dark` (variant)：`#9C4A3B`
- `charcoal` (header bar)：`#2A2520`
- `muted` (Footer 文字 / redaction 底色)：`#6B5F4E`

### 2. 三字型系統
於 `frontend/src/index.css` 或對應的全域 CSS 匯入並定義 Tailwind `fontFamily`：
- `display`：Bodoni Moda（serif display，hero / ticket title）
- `italic`：Newsreader italic（accent / body italic）
- `mono`：Geist Mono（code / section label / date）

載入方式：Google Fonts CDN 或本地 `@font-face`（Architect 決定）。

### 3. 全站 body 配色米白化（5 頁）
以下頁面的 root / body 背景與主文色改為 paper + ink：
- `/`（HomePage）
- `/about`（AboutPage）
- `/diary`（DiaryPage）
- `/app`（AppPage）
- `/login`（LoginPage）

**不含 `/business-logic`：** 使用者 2026-04-20 決定跳過此頁（設計稿保留為未來參考）。

### 4. NavBar 重做（米白 + 項目順序與命名）
共用組件 `<UnifiedNavBar />`：
- 背景色改為 `bg-paper`
- 文字色為 `text-ink`，active 狀態為 `text-brick`
- 項目順序與命名對齊設計稿：**Home / App / Diary / Prediction / About**
  - 當前實作順序為 `App / About / Diary / Logic`，須改
  - `Prediction` 項對應 `/business-logic` 路由，但本票中 **先隱藏**（如 K-017 設計決策，`hidden` attribute 或 conditional render `false`），不渲染至 DOM
- Home 以 ⌂ icon 呈現，點擊返回 `/`
- NavBar padding：依設計稿（Architect 補數值於設計文件）

### 5. 全站 Footer 組件（`<HomeFooterBar />` 擴展為全站共用）
在所有頁面底部顯示單行純文字 Footer（純資訊列，非可點擊 CTA 版）：
- 內容：`email · github · linkedIn`（單行，以中點分隔）
  - email：`yichen.lee.20@gmail.com`
  - github：`github.com/mshmwr`
  - linkedIn：`LinkedIn`
- 字型：Geist Mono 11px
- 顏色：`text-muted`（`#6B5F4E`）
- 頂部有 border 線作為視覺分隔

**說明：** K-017 已在 `/about` 放 `<FooterCtaSection />`（Let's talk CTA 版）、在 `/`（Homepage）放 `<HomeFooterBar />`（純文字資訊列版）、`/diary` 無 Footer。本票 scope 為 **在其他頁面（`/app` / `/login`）補上 `<HomeFooterBar />` 純文字資訊列**，並將既有 `<HomeFooterBar />` 樣式統一至上述規格；`/about` 維持 `<FooterCtaSection />`（由 K-017 AC-017-FOOTER 定義，不動）；`/diary` Footer 由 K-024 決定是否補。

**不含：**
- 頁面結構改版（Homepage v2 / About v2 / Diary v2）— 由 K-022/K-023/K-024 負責
- `/business-logic` 頁面（使用者跳過）
- 字型色彩 accent 以外的 visual refinement（hover state 動畫、漸變等）— 非 MVP，待未來 ticket

## 設計決策紀錄

| 決策項目 | 內容 | 來源 |
|----------|------|------|
| 配色 token 位置 | Tailwind theme.extend.colors（semantic 命名 paper/ink/brick），不用 `#F4EFE5` hex 直接散落 | PM 裁決（token 集中管理） |
| 字型載入方式 | Architect 於設計文件補完（Google Fonts CDN vs 本地 `@font-face`） | Architect 裁決 |
| NavBar Prediction 項隱藏 | 同 K-017 AC-017-NAVBAR（`hidden` attribute 或 conditional render），不渲染至 DOM | 沿用 K-017 決策 |
| /diary Footer 歸屬 | 本票不處理，由 K-024 決定；K-017 當前 `/diary` 無 Footer（AC-017-FOOTER 負斷言） | PM 決策（scope 切分） |
| `/business-logic` 跳過 | 配色/字型/NavBar 涉及此路由，但頁面本身不做 → NavBar Prediction 項隱藏即可 | 使用者 2026-04-20 決定 |

## 驗收條件

### AC-021-TOKEN：Tailwind theme token 完整註冊 `[K-021]`

**Given** 開發者檢視 `frontend/tailwind.config.js`
**When** 讀取 `theme.extend.colors`
**Then** 下列 6 個 token 全部存在且 hex 值精確匹配：
- `paper` = `#F4EFE5`
- `ink` = `#1A1814`
- `brick` = `#B43A2C`
- `brick-dark` = `#9C4A3B`
- `charcoal` = `#2A2520`
- `muted` = `#6B5F4E`
**And** `npx tsc --noEmit` exit 0（無 type error）
**And** `npm run build` 成功（token 可被 Tailwind JIT 正確編譯）
**And** 任一既有元件使用 `bg-paper` / `text-ink` 等 class 均可正確渲染（Playwright smoke test 驗證）

---

### AC-021-FONTS：三字型系統載入並註冊 Tailwind fontFamily `[K-021]`

**Given** 使用者訪問任一頁面
**When** 頁面載入完成
**Then** document 含載入 Bodoni Moda / Newsreader / Geist Mono 三字型的資源（`<link>` to Google Fonts 或 `@font-face` rule）
**And** `frontend/tailwind.config.js` 的 `theme.extend.fontFamily` 含：
- `display` → `['Bodoni Moda', 'serif']`
- `italic` → `['Newsreader', 'serif']`（italic weight 應可用）
- `mono` → `['Geist Mono', 'monospace']`
**And** Playwright 斷言：任一頁面套用 `font-display` class 的元素，computed `fontFamily` 含 "Bodoni Moda"
**And** Playwright 斷言：任一頁面套用 `font-mono` class 的元素，computed `fontFamily` 含 "Geist Mono"
**And** 若字型載入失敗（例如離線），fallback 至 serif / monospace 系統字型，不 crash

---

### AC-021-BODY-PAPER：全站 5 頁 body 配色米白化 `[K-021]`

**Given** 使用者訪問 `/`
**When** 頁面載入完成
**Then** `<body>` 或 root container 的 computed `backgroundColor` 為 `rgb(244, 239, 229)`（`#F4EFE5`）
**And** 主文色 computed `color` 為 `rgb(26, 24, 20)`（`#1A1814`）

**Given** 使用者訪問 `/about`
**When** 頁面載入完成
**Then** 同上（bg `#F4EFE5` + text `#1A1814`）

**Given** 使用者訪問 `/diary`
**When** 頁面載入完成
**Then** 同上

**Given** 使用者訪問 `/app`
**When** 頁面載入完成
**Then** 同上

**Given** 使用者訪問 `/login`
**When** 頁面載入完成
**Then** 同上

**And** Playwright 斷言：5 個路由各自訪問後 body computed background 均為 `rgb(244, 239, 229)`
**And** Code Reviewer / QA 強制執行「全站共用組件改動後必目視所有路由」（見 memory `feedback_shared_component_all_routes_visual_check.md`），不以 class-name 斷言代替視覺驗證

---

### AC-021-NAVBAR：NavBar 米白化 + 項目順序對齊設計稿 `[K-021]`

**Given** 使用者訪問任一頁面
**When** 頁面載入完成
**Then** NavBar 背景 computed `backgroundColor` 為 `rgb(244, 239, 229)`（`#F4EFE5`）
**And** NavBar 文字 computed `color` 為 `rgb(26, 24, 20)`（`#1A1814`）
**And** NavBar 項目自左至右為：⌂（Home icon）/ App / Diary / Prediction（hidden）/ About
  - 目前實作順序 `App / About / Diary / Logic` 必須改為上述
  - `Logic` 字樣改為 `Prediction`（語義與未來 `/business-logic` 頁面對齊）
**And** `Prediction` 項於本票實作時 **隱藏**（`hidden` attribute 或 conditional render），Playwright 斷言 `toHaveCount(0)` 或 `not.toBeVisible()`
**And** 當前頁面對應的項目呈現 active 樣式（文字色 `text-brick` = `#B43A2C`）
**And** ⌂ icon 點擊導向 `/`
**And** App / Diary / About 各連結 click 分別導向 `/app` / `/diary` / `/about`（SPA Link，不全頁 reload）
**And** Playwright 斷言：訪問 `/` 時 ⌂ 項 active；訪問 `/app` 時 App 項 active；訪問 `/diary` 時 Diary 項 active；訪問 `/about` 時 About 項 active（active 判定以 `text-brick` color class 或 aria-current）

---

### AC-021-FOOTER：全站 Footer 單行資訊列 `[K-021]`

**Given** 使用者訪問 `/`（首頁）
**When** 頁面滾動至底部
**Then** 顯示 `<HomeFooterBar />` 單行資訊列
**And** 內容為純文字 `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`（以 ` · ` 中點 + 空格分隔）
**And** 字型為 Geist Mono（computed `fontFamily` 含 "Geist Mono"）
**And** 字級為 11px（computed `fontSize` = `11px`）
**And** 顏色為 `text-muted`（computed `color` = `rgb(107, 95, 78)` = `#6B5F4E`）
**And** 頂部有 border 線（computed `borderTopWidth` > 0）

**Given** 使用者訪問 `/app`
**When** 頁面滾動至底部
**Then** 顯示 `<HomeFooterBar />`，內容 + 字型 + 字級 + 顏色同上

**Given** 使用者訪問 `/login`
**When** 頁面滾動至底部
**Then** 顯示 `<HomeFooterBar />`，內容 + 字型 + 字級 + 顏色同上

**Given** 使用者訪問 `/about`
**When** 頁面滾動至底部
**Then** 顯示 `<FooterCtaSection />`（Let's talk CTA 版，由 K-017 AC-017-FOOTER 定義）
**And** 本票 **不動** `<FooterCtaSection />` 的內容

**Given** 使用者訪問 `/diary`
**When** 頁面滾動至底部
**Then** 本票 **不決定** `/diary` 是否顯示 Footer（由 K-024 處理）
**And** 本票實作 `<HomeFooterBar />` 時不得強制插入 `/diary`

**And** Playwright 斷言：`/` / `/app` / `/login` 三路由底部均含 `<HomeFooterBar />`，文字完全匹配 `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`（`{ exact: true }`）
**And** Playwright 斷言：`/about` 底部存在 `<FooterCtaSection />`（以 data-testid 或 Let's talk 文字定位），不存在 `<HomeFooterBar />`

---

### AC-021-REGRESSION：既有功能無回歸 `[K-021]`

**Given** K-017 所有 AC（AC-017-*）於 K-017 關閉時為 PASS 狀態
**When** 本票實作完成
**Then** K-017 所有 Playwright 斷言仍 PASS（特別是 AC-017-NAVBAR / AC-017-FOOTER / AC-017-HOME-V2）
**And** K-005（統一 NavBar）AC-NAV-1~5 斷言仍 PASS
**And** 其他既有功能（AppPage 預測流程、Diary 渲染、Login 認證流程）Playwright 斷言不回歸
**And** `npx tsc --noEmit` exit 0
**And** `npm run build` 成功且 bundle size warning 不新增超過 500kB 的 chunk

---

## 放行狀態

**待 Architect 設計：** 下一步由 Architect 接手，產出設計文件 `docs/designs/K-021-sitewide-design-system.md`，涵蓋：
- 字型載入方式選擇（CDN vs 本地）與 fallback 策略
- Tailwind config 結構（新增 extend 的完整 diff）
- NavBar 項目順序改動的組件 props interface 與遷移策略
- Footer 在 `/app` / `/login` 的放置方式（layout component vs 頁面各自引入）
- 全站 body 配色改動的 CSS 入口（`index.css` vs Layout component）
- 5 頁視覺驗證 checklist（Code Reviewer / QA 目視確認步驟）

## 相關連結

- [PRD.md — K-021 section](../../PRD.md)（待同步補入）
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket](./K-017-about-portfolio-enhancement.md)
- [K-005 unified NavBar](./K-005-unified-navbar.md)
- [設計稿: homepage-v2.pen](../../frontend/design/homepage-v2.pen)
- [K-017 visual report](../../docs/reports/K-017-visual-report.html)

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上反省；PM 於 QA PASS 後彙整）
