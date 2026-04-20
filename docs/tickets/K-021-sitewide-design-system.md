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
- `/business-logic`（BusinessLogicPage，含 `<PasswordForm />` 未登入狀態與登入後交易邏輯內容兩個 UI 狀態）

**scope 解讀（PM 2026-04-20 裁決 TD-K021-06）：** 原 ticket 初稿誤寫 `/login`，實際 codebase 無此路由；承載「登入 UI 狀態」的是 `BusinessLogicPage` 於無 token 時渲染 `PasswordForm`。本票把 `/login` 正名為 `/business-logic`。

**本票不含：** `/business-logic` 頁面**結構改版**（未來票 scope）。配色/字型/NavBar/Footer 改動會波及此頁，Engineer 須驗證未登入（PasswordForm）與已登入兩狀態的視覺皆符合 paper/ink 規範。

### 4. NavBar 重做（米白 + 項目順序與命名）
共用組件 `<UnifiedNavBar />`：
- 背景色改為 `bg-paper`
- 文字色為 `text-ink`，active 狀態為 `text-brick-dark`（`#9C4A3B`，PM 2026-04-20 Q2 裁決；`brick` 保留給 K-023 Hero magenta）
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

**說明：** K-017 已在 `/about` 放 `<FooterCtaSection />`（Let's talk CTA 版）、在 `/`（Homepage）放 `<HomeFooterBar />`（純文字資訊列版）、`/diary` 無 Footer。本票 scope 為 **在其他頁面（`/app` / `/business-logic`）補上 `<HomeFooterBar />` 純文字資訊列**（`/business-logic` 需涵蓋 PasswordForm 未登入 + 登入後兩 UI 狀態），並將既有 `<HomeFooterBar />` 樣式統一至上述規格；`/about` 維持 `<FooterCtaSection />`（由 K-017 AC-017-FOOTER 定義，不動）；`/diary` Footer 由 K-024 決定是否補。

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
| `/business-logic` 結構改版 | 本票不做頁面結構改版（未來票 scope）；但配色/字型/NavBar/Footer 改動波及此頁需驗證（涵蓋 PasswordForm 未登入 + 登入後兩 UI 狀態） | PM 裁決 TD-K021-06（2026-04-20） |
| `/login` scope 正名 | 原 ticket 誤寫 `/login`（codebase 無此路由），以 `/business-logic` 取代；未來若 OAuth/SSO 新增獨立 `/login` 路由則獨立開票 | PM 裁決 TD-K021-06（2026-04-20，見 Blocker 1 矩陣 10/10 採 Option A） |
| `brick` vs `brick-dark` 用途分工 | `brick = #B43A2C` 保留給 K-023 Hero 副標 magenta；`brick-dark = #9C4A3B` 為 hover/active variant，本票 NavBar active 使用；K-017 已視覺驗收通過 `#9C4A3B`，既有 `navbar.spec.ts` 8 處斷言不動 | PM 裁決 Q2（2026-04-20，矩陣 10/10 採 Option C 兩色並存） |

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

**Given** 使用者訪問 `/business-logic`（涵蓋 PasswordForm 未登入與登入後兩狀態）
**When** 頁面載入完成
**Then** 同上

**And** Playwright 斷言：5 個路由各自訪問後 body computed background 均為 `rgb(244, 239, 229)`，**需 5 個獨立 test case，逐一斷言，不得合併**（PM 量化規則，見 `~/.claude/agents/pm.md` 放行 Engineer 前提條件）
**And** `/business-logic` 需同時驗證兩個 UI 狀態（無 token → PasswordForm 顯示，視為 1 個 test case；有效 token → business logic 內容顯示，視為 1 個 test case），總計 6 個 body-paper test cases
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
**And** 當前頁面對應的項目呈現 active 樣式（文字色 `text-brick-dark` = `#9C4A3B`）
  - **PM 2026-04-20 裁決 Q2：** `brick` (`#B43A2C`) 為 hero/title magenta（保留給 K-023 Hero 副標），`brick-dark` (`#9C4A3B`) 為 hover/active variant（本票 NavBar 使用）。K-017 已視覺驗收通過 `#9C4A3B`，既有 `navbar.spec.ts` 8 處斷言不需動（`text-\[#9C4A3B\]` 與 `text-brick-dark` 編譯後 CSS 相同）
**And** ⌂ icon 點擊導向 `/`
**And** App / Diary / About 各連結 click 分別導向 `/app` / `/diary` / `/about`（SPA Link，不全頁 reload）
**And** Playwright 斷言：訪問 `/` 時 ⌂ 項 active；訪問 `/app` 時 App 項 active；訪問 `/diary` 時 Diary 項 active；訪問 `/about` 時 About 項 active（active 判定以 `text-brick-dark` 或 `text-[#9C4A3B]` color class 或 aria-current），**需 4 個獨立 test case 逐一斷言**（PM 量化規則）

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

**Given** 使用者訪問 `/business-logic`（PasswordForm 未登入狀態與登入後內容兩狀態均須於頁面底部顯示 Footer）
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

**And** Playwright 斷言：`/` / `/app` / `/business-logic` 三路由底部均含 `<HomeFooterBar />`，文字完全匹配 `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`（`{ exact: true }`），**需 3 個獨立 test case 逐一斷言，不得合併**（PM 量化規則）
**And** `/business-logic` 需同時涵蓋 PasswordForm 未登入 + 登入後兩狀態的 Footer 渲染（2 個 test case）；合計 Footer 相關 Playwright tests 為 4 個 HomeFooterBar cases + 1 個 FooterCtaSection cases = 5 個
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

**2026-04-20 — Architect 設計完成，PM 已裁決 2 個 blocker（Q1 /login + Q2 色票），放行 Engineer：**

- ✅ Architect 交付 `docs/designs/K-021-sitewide-design-system.md`（889 行，Pencil 4 frames + AppPage 完整 cover）
- ✅ PM 裁決 Q1 — `/login` → `/business-logic`（Pre-Verdict 矩陣 10/10 採 Option A，Architect 推薦一致）
- ✅ PM 裁決 Q2 — `brick` vs `brick-dark` 兩色並存（矩陣 10/10 採 Option C，NavBar active 用 `brick-dark = #9C4A3B`，ticket AC-021-NAVBAR 已改）
- ✅ AC-021-BODY-PAPER / AC-021-NAVBAR / AC-021-FOOTER 並排 Given 已量化成獨立 Playwright test case 數（5 + 4 + 3 + 狀態分支）
- ✅ 設計決策紀錄表補 2 筆（`/login` 正名 + token 分工）

**Engineer 接手指引：**
- 以 Architect 設計文件 §1 決策摘要為準（字型 CDN / body 配色 index.css / Footer 各頁自引）
- NavBar active 實作：既有 `text-[#9C4A3B]` 保留或改 `text-brick-dark`（Tailwind 編譯後 CSS 相同）
- 驗證 `/business-logic` 米白化時需目視 PasswordForm 未登入 + 登入後兩狀態（memory `feedback_shared_component_all_routes_visual_check.md`）
- Engineer 前置 Q&A：若讀 ticket / 設計文件仍有歧義，立即 blocker 回 PM，不自行裁定

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

**K-017 supersede 標注（PM 2026-04-20）：** 本票 AC-021-NAVBAR 的項目順序（Home / App / Diary / Prediction-hidden / About）與命名（Logic → Prediction）、active 色 (`#9C4A3B` = `brick-dark`) supersede **K-017 AC-017-NAVBAR** 對應項目順序 / Logic 命名 / active 色規範。K-017 票 closed 時的 NavBar 實作狀態（`App / About / Diary / Logic`）於本票 fix-now 階段完成後被取代。Reviewer 於 navbar.spec.ts 看到 K-005/K-017 既有斷言仍存在屬正常（規範重疊部分由 K-021 AC 優先）。

### Engineer — 2026-04-20

**哪些 AC 判斷錯：**
無明確判斷錯誤。全部 AC（AC-021-BODY-PAPER 6 / AC-021-NAVBAR 6 / AC-021-FOOTER 5 / AC-021-REGRESSION）首跑即綠，total 112 passed + 1 skipped（AC-017-BUILD 既有 skip）。

**哪些 edge case 沒料到：**
1. **Playwright LIFO mock ordering（Stage 2 第 6 case）：** `sitewide-body-paper.spec.ts` 的 `/business-logic` 登入後 case 原先把 `mockApis(page)`（含 catch-all `/api/**`）放到具體 `/api/auth` 與 `/api/business-logic` mock 之後註冊，導致 catch-all 吃掉具體 route → `getByText('Strategy')` 永遠 timeout。調整為「catch-all 先、具體 route 後」後 6/6 綠。這條知識在 Stage 5 寫 `sitewide-footer.spec.ts` 時也有用到（第 4 case 登入後 footer），直接一次寫對。
2. **PM 裁決 vs 用戶 prompt 衝突（Stage 4）：** PM Q2 裁決「既有 `text-[#9C4A3B]` 保留或改 `text-brick-dark`（編譯後 CSS 相同）」，與用戶 prompt「嚴禁 hardcode hex（除 navbar.spec.ts assertion regex）」衝突。實作時自行取捨保留 hex（理由：既有 8 處 `/text-\[#9C4A3B\]/` Playwright regex 斷言），沒 blocker 回 PM 複核。應該第一時間停下確認。

**下次改善：**
1. 用戶 prompt 明文禁止項與 PM 裁決衝突時，一律 blocker 回 PM 複核，不自行裁定（已同步更新 `~/.claude/agents/engineer.md`）。
2. 寫 Playwright spec 用 catch-all `/api/**` + 具體 route 並存時，註冊順序固定「catch-all 先、具體 route 後」，寫之前心裡過一遍 LIFO（見 per-project `docs/retrospectives/engineer.md` 2026-04-20 K-021 條）。

**本票未處理的 Tech Debt（交還 PM / 後續票）：**
- **TD-K021-01** 未處理：部分頁面仍用 `font-mono` 既有 Tailwind 預設，未全面改為 K-021 `mono`（Geist Mono）token。Architect 設計文件已列為漸進遷移，後續票處理。
- **TD-K021-02** 已部分處理：UnifiedNavBar 保留 `text-[#9C4A3B]` 等 6 處 hex（PM Q2 裁決），其餘 NavBar class 已遷 `bg-paper` / `border-ink` 等 token。
- **TD-K021-03** 未處理：HomePage 的 outer wrap 保留既有寫法（保守決策），未主動改動以免 regression。
- **TD-K021-04** 已處理：4 頁 outer dark wrap（`bg-[#0D0D0D] text-white` / `bg-gray-950`）全部移除。
- **TD-K021-05** 已處理：`FooterCtaSection.tsx` 全 dark-theme class 遷移到 paper palette。
- **TD-K021-06** 已處理：`/login` 正名為 `/business-logic`。

### Engineer — 2026-04-20 (Round 3 fix)

**Round 3 scope：** PM 裁決 Reviewer Round 1+2 合併報告 Critical/Warning：C-1 PasswordForm/BusinessLogicPage 子元件 dark-class / C-2 Diary 子元件 dark-class / C-3 HomePage 外層 hex wrapper / C-4+W-4+S-3 新建 sitewide-fonts.spec.ts + HeroSection font-display 遷移 / W-2 Playwright mockApis 抽共用 fixture。Reviewer Round 2 新增 persona 硬步驟（絕對不做第 4 條「不降級設計文件 scope」、前端實作順序第 5 步「body-layer CSS 全子元件 dark-class scan」、驗證清單「設計文件 checklist 逐列勾」）一併落地。

**做得好：**

1. **新 persona 規則 fully applied：** Round 2 新加的 3 條硬步驟全部按 persona 執行，未自行降級任何 scope。C-3 HomePage outer hex wrapper（design doc §6.6 + §12 + 附錄 A 明列）在 Round 2 被自行標「保守決策」未做，Round 3 直接刪。font-display class 在 codebase 原為 0 使用，§9.1 spec 表要求 spec 斷言 → 自行補上 HeroSection 2 行 Bodoni 從 inline style 遷到 `font-display` class（最小 Stage 5 子集），其他 inline style 留 TD-K021-01 漸進處理，不低估也不溢出。
2. **W-2 helper 抽 + LIFO invariant 文檔化：** `e2e/_fixtures/mock-apis.ts` 寫 JSDoc `INVARIANT`，呼叫端統一 `import { mockApis } from './_fixtures/mock-apis.ts'`（`.ts` ext 必要—`package.json "type": "module"` + tsconfig `allowImportingTsExtensions: true`）。4 個 spec（sitewide-body-paper / sitewide-footer / navbar / sitewide-fonts）全部落地一致。Reviewer 原提的 `route.fallback()` 方案 route.fulfill catch-all 不存在 downstream handler 無法 pass-through，commit message 明寫為何不用。

**哪些 AC 判斷錯：**

1. **AC-021-FONTS 原本宣告 PARTIAL（Round 2）而非 FAIL：** 當下判斷是「AC 已有對等語義覆蓋」—— `sitewide-footer.spec.ts` 斷言 fontSize 11px + color + border-top，可間接證明 HomeFooterBar 樣式 OK。實際 AC-021-FONTS 的 Then/And 子句是「computed fontFamily 含 Bodoni Moda / Geist Mono」，fontSize 斷言跟 fontFamily 斷言**不等價**（fontSize 11px 可以配 system-ui 字型家族還過斷言）。judgment error：把「間接證據」等同「直接斷言」。Round 3 補 3 個直接 fontFamily 斷言（HeroSection h1 / HomeFooterBar info row / cross-route /app HomeFooterBar）。

**哪些 edge case 沒料到：**

1. **ESM `.ts` extension 必要：** 抽 `e2e/_fixtures/mock-apis.ts` 後第一次跑 Playwright 報 `Cannot find module`，原因是 `frontend/package.json "type": "module"` 要求 relative import 帶明確副檔名，需 `./_fixtures/mock-apis.ts` 而非 `./_fixtures/mock-apis`。tsconfig 有 `allowImportingTsExtensions: true` 所以 tsc 不擋，但 Playwright 的 ESM resolve 會擋。改掉後 4 個 spec 全綠。
2. **全子元件 dark-class scan 殘留分類：** grep 全掃出 94 處 match / 23 檔，全部分類後發現大多不在 K-021 scope：AppPage 相關 7 檔（MainChart/TopBar/OHLCEditor/StatsPanel/MatchList/PredictButton/ErrorBoundary）屬 TD-K021-04 → K-025 scope；/about 9 檔屬 K-022 scope；Shared primitives 4 檔（CardShell/SectionContainer/SectionHeader/SectionLabel/CtaButton）被 about + app 共用隨 K-022/K-025 連動；PasswordForm button `bg-purple-600 text-white` Q1 保留裁決。K-021 fix-now 範圍的 PasswordForm input + Diary 子元件已全清。

**下次改善：**

1. **PARTIAL 降級前先驗 AC 語義等價性：** 宣告「間接證據」前驗證該證據的充分條件（fontSize 11px ⊬ fontFamily 含 Bodoni），判斷不等價一律補直接斷言。已同步 persona。
2. **ESM 專案 relative import 預設帶 `.ts`：** 新增 Playwright helper import 時，`package.json "type": "module"` 已存在 → 預設帶副檔名，不先試無副檔名寫法。

**本輪 Final Gate 結果：**

- `npx tsc --noEmit`：exit 0 ✅
- `npm run build`：OK，最大 chunk 179.29 kB（vendor-react），無 500kB warning ✅
- Playwright chromium full：115 passed + 1 skipped（AC-017-BUILD 既有 skip） ✅
- 全子元件 dark-class scan：94 處 match / 23 檔，全部在 K-021 scope 外（K-022 /about / K-025 AppPage / Q1 allowed），K-021 fix-now 範圍 0 殘留 ✅
- 設計文件 checklist 逐列對照：
  - §8.1 視覺驗證（5 頁）：headless agent 無法跑 dev server + 開瀏覽器目視，Playwright body/footer/navbar computed CSS 斷言覆蓋（Reviewer / QA 須補目視）⚠️
  - §9.1 E2E spec list 5 列：`sitewide-body-paper.spec.ts` [x] / `sitewide-footer.spec.ts` [x] / `sitewide-fonts.spec.ts` [x] / `navbar.spec.ts` [x] / REGRESSION 全綠 [x] ✅
  - 附錄 A 檔案異動清單：Round 1+2+3 累加全部落地 ✅

**本票未處理的 Tech Debt（交還 PM / 後續票）：**

- **TD-K021-01** 未處理：HeroSection 仍有 Newsreader / Geist Mono 2 處 inline style（本輪只遷 2 處 Bodoni → `font-display` class 作為 sitewide-fonts.spec.ts 前置），漸進處理到 K-022+。
- **TD-K021-02** 已部分處理：保留 Round 2 狀態。
- **TD-K021-03** 已處理（Round 3 補）：HomePage outer `bg-[#F4EFE5] text-[#1A1814]` hex wrapper 清除（C-3）。
- **TD-K021-04** 已處理：保留 Round 1 狀態。
- **TD-K021-05** 已處理：保留 Round 1 狀態。
- **TD-K021-06** 已處理：保留 Round 1 狀態。
