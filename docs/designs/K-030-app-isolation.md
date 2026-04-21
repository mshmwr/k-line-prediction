---
id: K-030-design
title: /app page isolation — new tab + no site chrome + bg override — 設計文件
ticket: K-030
author: senior-architect
created: 2026-04-21
status: ready-for-qa-early-consultation
---

## 0 Pre-impl Preconditions

### 0.1 Ticket path / component name audit

全部 ticket 引用的檔名／組件名於本 worktree 磁碟確認存在（`ls` / `grep` 實測）：

| Ticket 引用 | 磁碟狀態 |
|------------|---------|
| `frontend/src/AppPage.tsx` | ✓ 存在 |
| `frontend/src/components/UnifiedNavBar.tsx` | ✓ 存在 |
| `frontend/src/components/home/HomeFooterBar.tsx` | ✓ 存在 |
| `frontend/src/index.css` | ✓ 存在（含 K-021 `@layer base body` 規則，L5–9） |
| `frontend/e2e/sitewide-body-paper.spec.ts` | ✓ 存在（含 `/app` 測試，L46–51） |
| `frontend/e2e/sitewide-footer.spec.ts` | ✓ 存在（含 `/app` 測試，L47–51） |
| `frontend/e2e/sitewide-fonts.spec.ts` | ✓ 存在（含 `/app` footer font 測試，L55–73） |
| commit `338e4b8` | ✓ 確認為 K-021 Stage 2 design-system commit |

無路徑勘誤需登記。

### 0.2 Pencil design file coverage

**`/app` 不在 Pencil 設計稿範圍。** `frontend/design/homepage-v2.pen` 4 個 top-level frames 為 `Homepage 4CsvQ` / `About 35VCj` / `Diary wiDSi` / `Business Logic VSwW9`（marketing 頁面）。`/app` 刻意排除於 marketing design system 之外——這票正是要把誤把 marketing palette 套上去的部分撤回。因此本 ticket 不適用 Pencil frame completeness check。

### 0.3 Scope Questions — 無 unresolved contradictions

Ticket AC 與 codebase / design doc 之間無矛盾。Ticket §"Design Decisions Pending" 列出 5 項 Architect 裁決事項已於本文件 §2 逐項裁決。無需 PM 上報。

---

## 1 Root Cause Recap

根因在 ticket §Root Cause 已明列。Architect 補一項 codebase 驗證：

**K-021 commit `338e4b8` 對 `AppPage.tsx` 的 diff：**

```
 return (
-    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
+    <div className="h-screen flex flex-col overflow-hidden">
```

原始 `/app` 設計意圖是 **neutral dark tool palette（`bg-gray-950` = `#0B0F19`，`text-gray-100` = `#F3F4F6`）**，與 TopBar 的 `bg-gray-900` / panel 的 `bg-gray-900/70` 等 tool-style dark panel 色系一致。K-021 只撤除 `bg-gray-950 text-gray-100` wrapper，沒有對應新增 `/app` 專屬的 non-paper bg 規則，導致 body 層的 paper bg 直接穿透。

→ 這也決定了 §2.1 背景色的推薦方向：回到原始 dark tool UI 意圖，而不是改成 white / off-white。

---

## 2 Design Decisions — Architect 裁決

### 2.1 `/app` 背景色

**Options：**

| Option | 描述 | 色值 |
|--------|------|------|
| A | Pre-K-021 原設計色（`bg-gray-950` + `text-gray-100`） | bg `rgb(3, 7, 18)` / text `rgb(243, 244, 246)` |
| B | White (`#FFFFFF`) | 純白 tool UI |
| C | Off-white（例：`#F8F8F6`） | 中性淺底 |
| D | Paper-adjacent neutral（`#EDEAE3` 等） | paper 同色系但更淺 |

**Pre-verdict 打分（1–10；維度 locked 於裁決前）：**

| 維度 | Weight | A (dark) | B (white) | C (off-white) | D (paper-adj) |
|------|-------|---------|----------|--------------|---------------|
| 對齊原設計意圖（commit `338e4b8` 前的 `/app` palette） | 3 | 10 | 3 | 3 | 2 |
| 與 marketing site（paper）視覺區隔清晰度 | 3 | 10 | 7 | 5 | 2 |
| 與 `/app` 現有 panel（`bg-gray-900/70` / `bg-gray-950`）一致性 | 2 | 10 | 2 | 2 | 1 |
| chart / OHLC 表格可讀性（dark theme vs light theme 既有 UI） | 2 | 9 | 5 | 5 | 4 |
| 未來維護成本（需撤銷/調整時） | 1 | 8 | 9 | 9 | 9 |
| **加權總分** | | **9.7** | **4.5** | **4.3** | **2.7** |

**Score 差距 ≥ 1，直接採 A。**

**Recommendation：A — `bg-gray-950` + `text-gray-100`**（對應 Tailwind default gray scale，無需新增 token）

**Justification（一句）：** 與 `/app` 內部所有 panel（TopBar `bg-gray-900`、side panel `bg-gray-900/70`、sticky predict bar `bg-gray-950`）palette 已是 dark tool UI，恢復 `bg-gray-950` wrapper 即還原 commit `338e4b8` 移除的原設計意圖。

---

### 2.2 bg 覆蓋實作方式

**Options：**

| Option | 描述 | Pros | Cons |
|--------|------|------|------|
| α | AppPage 根 `<div>` 加 `bg-gray-950 text-gray-100` 類別 | 最小改動（單行 className）；scope 限於 `/app`；body 規則維持不變 | tooling 測試須 assert wrapper `<div>` 而非 `<body>` |
| β | 新增 CSS module（`AppPage.module.css`） | 封裝強 | 現有檔案都未用 CSS module；破壞一致性；過度設計 |
| γ | 於 body 掛 `route-app` class，在 `index.css` 加 `body.route-app { @apply bg-gray-950 text-gray-100 }` | body-level override；與 body-paper 規則同層 | 需 effect hook 動態切換 class；進入/離開 `/app` 時機易漏；StrictMode 下 effect 二次執行風險 |
| δ | `index.css` 加 `body:has(> #root [data-page="app"]) { ... }` | 純 CSS 無 JS | `:has()` 瀏覽器支援雖普及但仍有舊 Safari 邊界；DOM 結構耦合 |

**Recommendation：α — AppPage 根 div className**

**Justification：**
1. 恢復 pre-K-021 的實作方式（commit `338e4b8` 移除的正是這個 wrapper className）— 這是最小逆向變更。
2. 作用域限 `/app`，其他 4 條路由不受影響，符合 K-021 body paper 規則的原意（marketing site paper 承載不變，只排除 tool 頁）。
3. 不引入新 CSS 架構（module / `:has()` / JS class toggle），維護成本最低。

**與 body-level K-021 rule 的 tradeoff：** body 仍是 `bg-paper`，但 `/app` 根 div `h-screen` 佔滿 viewport + 套 `bg-gray-950` 完全覆蓋 body 底色，無 beige bleed-through 可能。DOM 結構：`<body bg-paper>` → `<div id="root">` → `<div class="h-screen bg-gray-950">`（覆蓋）→ NavBar/Footer 移除後子節點不再有 `bg-paper` 依賴。

---

### 2.3 New-tab 實作（UnifiedNavBar App link）

**現況（codebase 確認）：** `UnifiedNavBar.tsx` L55–63（desktop）與 L71–80（mobile）使用 `<Link to={link.path}>` from `react-router-dom`。`<Link>` 無 `target` prop 支援（React Router SPA 導向不適用 `target="_blank"` 語意）。

**Recommendation：** `App` link **專屬** 改為原生 `<a>`，其他 link 保持 `<Link>`。

**實作 pseudo-code：**

```
// 在 TEXT_LINKS 陣列為 App 加 external: true 標記
TEXT_LINKS = [
  { label: 'App', path: '/app', external: true },
  { label: 'Diary', path: '/diary' },
  { label: 'Prediction', path: '/business-logic', hidden: true },
  { label: 'About', path: '/about' },
]

// map 時 branch：external 用 <a>，其他用 <Link>
visibleLinks.map(link =>
  link.external
    ? <a
        href={link.path}
        target="_blank"
        rel="noopener noreferrer"
        aria-current={undefined}  // 不套 active（跨 tab，無 pathname match 語意）
        className={navLinkClass(link.path)}  // 但仍套 inactive class 保持視覺一致
      >{link.label}</a>
    : <Link to={link.path} ...>
)
```

**必須屬性：** `target="_blank"` + `rel="noopener noreferrer"`（後者防止 reverse tabnabbing + 避免 Referrer 泄漏；符合 `components/primitives/ExternalLink.tsx` 既有全站規範）。

**`aria-current` 處理：** App link 在 new tab 開啟後，當前 tab 仍在原頁面，本 tab 的 App link 永遠不該是 `aria-current="page"`（因為使用者不在 `/app`，是新 tab 在 `/app`）。新 tab 載入 `/app` 時，該 tab 的 NavBar 已被移除，無 App link 可標。因此 App link 的 `aria-current` 不設值。

**active class 視覺處理：** 保留原 `navLinkClass(path)`，但 `pathname` 永遠 ≠ `/app`（因為 `/app` 已不再渲染 NavBar），App link 將始終套 inactive class `text-[#1A1814]/60`，視覺與 `Diary` / `About` 同等。

---

### 2.4 NavBar 移除範圍

**唯一 consumer：** `AppPage.tsx` L9 `import UnifiedNavBar from './components/UnifiedNavBar'` + L369 `<UnifiedNavBar />`。

**Grep 驗證：**
```
grep -n "UnifiedNavBar" frontend/src/
→ AppPage.tsx:9, AppPage.tsx:369
→ HomePage.tsx / AboutPage.tsx / DiaryPage.tsx / BusinessLogicPage.tsx (4 個 marketing 頁面，不動)
```

**Layout 依賴分析：** NavBar `h-[56px] md:h-[72px]` 是 flex 子項，在 `<div class="h-screen flex flex-col">` 裡 NavBar 占頂部、TopBar 占次頂、`flex-1` main region 吃剩餘高度。移除 NavBar **增加** main region 的可用高度 56–72px，layout 非破壞性。AppPage **無** 任何基於 NavBar 高度的 `margin-top` / `padding-top` / `calc(100vh - 72px)` 硬編數值——確認 grep `"72px\|56px\|h-\[56px\|h-\[72px"` 於 `AppPage.tsx` 零匹配。

---

### 2.5 Footer 移除範圍

**唯一 consumer 之一：** `AppPage.tsx` L10 import + L496 `<HomeFooterBar />`。

**其他 HomeFooterBar consumers（保留）：** `HomePage.tsx` / `BusinessLogicPage.tsx`（grep 確認）。

**Layout 依賴分析：** HomeFooterBar 是 `<div class="h-screen flex flex-col overflow-hidden">` 的最後子節點，位在 main region（`flex-1`）之後。由於 `flex-1` 吃掉所有剩餘空間，Footer 是被 flex 擠到底部。移除 Footer 後：

- `main region` (`flex-1`) 高度 += Footer 原佔用高度（`py-5` + 內文 + border = 約 60–80px）
- `h-screen overflow-hidden` 根 div 仍完全填滿 viewport
- sticky predict button（L469 `sticky bottom-0`）仍正確貼 main region 底部（sticky 相對於 overflow 容器，即 side panel，不受 Footer 移除影響）

移除安全，無 layout 依賴。

---

### 2.6 Spec conflict resolution（`sitewide-body-paper.spec.ts` / `sitewide-footer.spec.ts` / `sitewide-fonts.spec.ts`）

**PM flagged：** `sitewide-body-paper.spec.ts` 與 ticket AC-030-BG-COLOR 衝突。

**Architect 額外發現兩處額外衝突：**
- `sitewide-footer.spec.ts` L47–51：`/app — HomeFooterBar shows` → 移除 footer 後必 fail
- `sitewide-fonts.spec.ts` L55–73：`/app HomeFooterBar fontFamily Geist Mono` → 移除 footer 後必 fail（找不到 footer text）

**Options：**

| Option | 描述 |
|--------|------|
| A | `/app` 由 wrapper 層 override body bg，spec 改 `/app` 斷言為「wrapper `<div>` bg = `rgb(3, 7, 18)`（gray-950）」 |
| B | `/app` 從 sitewide-body-paper.spec.ts 完全移除，spec 保持 body 層斷言（4 routes）；`/app` 不再屬於 sitewide paper 規則範圍 |

**Pre-verdict（維度 locked 於裁決前）：**

| 維度 | Weight | A (assert wrapper) | B (remove /app) |
|------|-------|--------------------|------------------|
| 語意清晰（spec 名稱 `sitewide-body-paper` 反映斷言範圍） | 3 | 5（`/app` 斷的不是 body 而是 wrapper，與 spec 名稱矛盾） | 10 |
| 漏洞防護（未來有人誤加 `bg-paper` 回 AppPage 是否會被抓到） | 3 | 9（仍會 assert `/app` wrapper bg ≠ paper） | 9（可用獨立 AC-030-BG-COLOR spec 斷 `/app` wrapper bg ≠ paper） |
| 架構一致性（`/app` 是否屬於 sitewide paper system） | 2 | 3（名為 sitewide 實際例外） | 10（明確排除，與 ticket 立場一致：`/app` 不是 marketing site） |
| spec 命名成本 | 1 | 10（不改檔名） | 10（不改檔名） |
| 測試覆蓋完整性 | 2 | 9 | 10（新 spec AC-030-BG-COLOR 獨立斷 `/app` non-paper + wrapper bg 一致性） |
| **加權總分** | | **6.8** | **9.7** |

**Score 差距 ≥ 1，採 B。**

**Recommendation：B — `/app` 從 `sitewide-body-paper.spec.ts` 移除**

**Justification：** `/app` 設計意圖是 **排除於 sitewide design system 之外**（這是 K-030 的核心立場）。讓 `sitewide-body-paper.spec.ts` 保持「4 個 marketing routes + business-logic 2 狀態」斷 body bg = paper，`/app` 的背景由新 spec `app-bg-isolation.spec.ts` 獨立守護。命名與語意一致，未來新增 route 時一目瞭然。

**對應三個 spec 的處理：**

| Spec | 處理 |
|------|------|
| `sitewide-body-paper.spec.ts` | 移除 L46–51 `AppPage (/app) — body bg=#F4EFE5` 測試；header 註解的 5 routes 縮成 4 routes；test case 總數 `6 cases` 變 `5 cases` |
| `sitewide-footer.spec.ts` | 移除 L47–51 `/app — HomeFooterBar shows` 測試；header 註解的 `3 個獨立 test case` 描述更新為「2 個 + /business-logic 登入後 1 = 3」+ /about FooterCtaSection boundary |
| `sitewide-fonts.spec.ts` | 移除 L55–73 `AC-021-FONTS — HomeFooterBar fontFamily cross-route` 整個 describe block（只測 `/app` 一條），無需替代；HomePage HomeFooterBar Geist Mono 已在 L35–53 測試 |

**新增 spec：** `frontend/e2e/app-bg-isolation.spec.ts`（AC-030-BG-COLOR 測試，見 §6）

---

## 3 Refactorability Checklist

- [x] **單一責任：** AppPage 根 div 仍只負責 layout 結構（`h-screen flex flex-col`）；新增的 `bg-gray-950 text-gray-100` 為 presentational class，與 layout 結構 concern 在同一層，可接受。
- [x] **Interface 最小化：** `UnifiedNavBar.tsx` TEXT_LINKS 新增 `external?: boolean` optional field，默認 false 兼容既有 link；非必要地方不需改。
- [x] **單向依賴：** 無 NavBar ↔ AppPage 循環；AppPage import NavBar（單向），NavBar 無 AppPage 依賴。
- [x] **替換成本：** `/app` 背景 tailwind class 若未來撤換，僅 1 檔 1 行 diff。NavBar `external` branch 若未來撤換，1 檔 1 個 conditional block。
- [x] **測試入口清晰：** AC-030-* 5 條分別對應 5 條獨立測試（new-tab / no-navbar / no-footer / bg-color / regression），每條測試斷言明確。
- [x] **變更隔離：** `/app` bg 變更不影響 marketing 4 頁 body paper bg；NavBar App link external 變更不影響其他 link 行為（`<Link>` 保持 SPA）。

---

## 4 All-Phase Coverage Gate

**本票為 single-phase ticket（K-030 無多 Phase 拆分）。** 單 Phase 內四維覆蓋：

| 維度 | 狀態 | 備註 |
|------|------|------|
| Backend API | ✅ N/A | 本票零後端異動（ticket §Scope 明列 "Not included: Any change to the prediction feature logic or API"） |
| Frontend Routes | ✅ | 路由表無新增（已存在 `/app`）；§5.1 Route Impact Table 逐條標示 |
| Component Tree | ✅ | §5.2 列 `UnifiedNavBar` / `AppPage` / `HomeFooterBar` 三個受影響組件 + 影響半徑 |
| Props Interface | ✅ | §5.3 列 `TEXT_LINKS` entry shape 變更（加 `external?: boolean`）；AppPage 無 props |

---

## 5 Route Impact & Shared Component Blast Radius

### 5.1 Route Impact Table

根據 persona 硬 gate（global-style / shared-component 變更必列 Route Impact Table）。

| Route | 狀態 | Notes |
|-------|------|-------|
| `/` | unaffected | body `bg-paper` 規則不變；NavBar App link external 變更：使用者點擊後不再 SPA 轉頁，改開 new tab；視覺上 Home 頁本身無變化 |
| `/about` | unaffected | body `bg-paper` 規則不變；NavBar App link 同上 |
| `/diary` | unaffected | body `bg-paper` 規則不變；NavBar App link 同上 |
| `/business-logic` | unaffected | body `bg-paper` 規則不變；NavBar App link 同上 |
| `/app` | **must-be-isolated** | wrapper bg 覆蓋 body paper 為 gray-950；NavBar 完全不渲染；Footer 完全不渲染；§2.2 α 方案已定義 override 實作 |

**零 route 被移除或新增，僅 `/app` 行為改變。**

### 5.2 Shared Component Changes + Blast Radius

| 組件 | 位置 | 變更 | Blast Radius |
|------|------|------|--------------|
| `UnifiedNavBar` | `frontend/src/components/UnifiedNavBar.tsx` | TEXT_LINKS 新增 `external?: boolean`；App link 渲染分支 `<a target=_blank>` vs `<Link>` | 全 4 marketing pages（HomePage / AboutPage / DiaryPage / BusinessLogicPage）— NavBar 在這 4 頁仍渲染，App link 行為對「所有訪客」生效：從任一頁點 App 都開 new tab。需 navbar.spec.ts 微調 AC-NAV-4 App link test（見 §6.2）|
| `HomeFooterBar` | `frontend/src/components/home/HomeFooterBar.tsx` | **組件本身無 diff**；只從 AppPage.tsx 撤 import + 撤 `<HomeFooterBar />`（consumer 減少） | HomePage / BusinessLogicPage 繼續用，不影響。architecture.md Footer placement 表 `/app` 欄需從 `<HomeFooterBar />` 改為 `無 footer（K-030 isolation）` |
| `AppPage` | `frontend/src/AppPage.tsx` | 根 div className 加 `bg-gray-950 text-gray-100`；刪 `<UnifiedNavBar />` + `<HomeFooterBar />` + 對應 import | 頁面專屬（page-specific），不影響其他頁 |

### 5.3 Props Interface 變更

**`UnifiedNavBar.tsx` TEXT_LINKS shape（只記 diff，shared components 邊界宣告）：**

```
Before:
{ label: string; path: string; hidden?: boolean }

After:
{ label: string; path: string; hidden?: boolean; external?: boolean }
```

- `external?: boolean` — Optional。default undefined = SPA `<Link>`；true = 原生 `<a target="_blank" rel="noopener noreferrer">`
- 僅 `App` entry 設 `external: true`；Diary / About / Prediction 保持 SPA

**AppPage.tsx：** 無 props（default export 為 parameterless component），無 interface 變更。

---

## 6 File Change List

| File | 動作 | 一句描述 |
|------|------|---------|
| `frontend/src/AppPage.tsx` | Modify | 根 `<div>` className 加 `bg-gray-950 text-gray-100`；刪除 L9 UnifiedNavBar import、L10 HomeFooterBar import、L369 `<UnifiedNavBar />`、L496 `<HomeFooterBar />` |
| `frontend/src/components/UnifiedNavBar.tsx` | Modify | TEXT_LINKS App entry 加 `external: true`；map 時按 `external` 分支渲染 `<a target=_blank rel=noopener noreferrer>` vs `<Link>`；desktop + mobile 兩 map 同步處理 |
| `frontend/e2e/sitewide-body-paper.spec.ts` | Modify | 移除 L46–51 `/app` 測試；header JSDoc 註解 L5 `5 routes` → `4 routes`；L12 `5 個獨立 case 不合併；/business-logic 另加登入後狀態 = 6 cases 總計` → `4 個獨立 case 不合併；/business-logic 另加登入後狀態 = 5 cases 總計` |
| `frontend/e2e/sitewide-footer.spec.ts` | Modify | 移除 L47–51 `/app — HomeFooterBar shows` 測試；header JSDoc L7 `Given: user visits /, /app, /business-logic` → `Given: user visits /, /business-logic`；L12 `3 個獨立 test case` → `2 個獨立 test case`；L13 `= 4` → `= 3` |
| `frontend/e2e/sitewide-fonts.spec.ts` | Modify | 刪除整個 describe block `AC-021-FONTS — HomeFooterBar fontFamily cross-route`（L55–73） — 該 block 唯一的測試 case 是 `/app`，移除後整 block 無內容可留 |
| `frontend/e2e/navbar.spec.ts` | Modify | AC-NAV-4 `App link navigates to /app` 測試（L141–147）改為 new-tab 斷言（使用 `context.waitForEvent('page')`）；AC-NAV-1 / AC-NAV-2 `/app` 的 `{ path: '/app', name: 'AppPage' }` entries（L33 / L71） → 移除這 2 列 iteration（因 `/app` 不再渲染 NavBar，測 NavBar-present-on-/app 恆 fail）；AC-NAV-4 mobile active link `on /app page (mobile)` 測試（L201–208）移除（同理）；AC-021-NAVBAR `on /app — App link has aria-current=page` 測試（L235–242）移除 |
| `frontend/e2e/app-bg-isolation.spec.ts` | **Add** | 新建 spec，4 個 test cases 對應 AC-030-NEW-TAB / NO-NAVBAR / NO-FOOTER / BG-COLOR（§6.2 細部） |
| `frontend/e2e/ga-tracking.spec.ts` | No change | `/app fires page_view` 測試（L71–84）直接 `page.goto('/app')` 不經 NavBar 點擊，仍通過。但 Engineer 須實際 run 確認，Architect 判斷為無需修改 |
| `frontend/e2e/ma99-chart.spec.ts` | No change | 所有 `page.goto('/app')` 直接 URL 載入，不經 NavBar 點擊，不受影響 |
| `frontend/e2e/visual-report.ts` | No change | 繼續截 `/app` 整頁（不再有 NavBar + Footer，截圖視覺會 reflect ticket 結果），無需改腳本 |

**AppPage unit test 影響確認：** `frontend/src/__tests__/AppPage.test.tsx` / `OHLCEditor.test.tsx` / `PredictButton.test.tsx` / `StatsPanel.test.tsx` / `MatchList.test.tsx` 均測試組件行為／工具邏輯，不依賴 NavBar / Footer DOM，**不需改動**（AC-030-FUNC-REGRESSION 要求 unit tests 無需修改即通過）。

---

## 6.2 New Playwright Test Cases（app-bg-isolation.spec.ts）

**檔案：** `frontend/e2e/app-bg-isolation.spec.ts`
**測試總數：** 5 個獨立 test case（對應 AC-030-NEW-TAB / NO-NAVBAR / NO-FOOTER / BG-COLOR ×2 / PENCIL-ALIGN 由 T4 同時綁定）
**Viewport：** 1280×800（desktop），AC-030 未限定 mobile 獨立驗，AC-030-NO-NAVBAR / NO-FOOTER 的 DOM 斷言在 desktop 即充分覆蓋

| Test ID | describe / test title | 斷言骨架 |
|---------|----------------------|---------|
| T1 | `AC-030-NEW-TAB — App link opens /app in new tab` / `clicking App link on / opens new tab with /app URL` | `page.goto('/')`；`await context.waitForEvent('page', { predicate: p => p.url().includes('/app') })` 包裹 click；斷言 App link 元素 `attr target=_blank` + `attr rel=noopener noreferrer`；斷言原 tab URL 仍為 `/`；斷言 new page URL match `/app` |
| T2 | `AC-030-NO-NAVBAR — /app page has no UnifiedNavBar` / `navbar testids absent on /app` | `page.goto('/app')`；`expect(page.locator('[data-testid="navbar-desktop"]')).toHaveCount(0)`；`expect(page.locator('[data-testid="navbar-mobile"]')).toHaveCount(0)`；`expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0)`；`expect(page.getByText('Loaded rows:')).toBeVisible()`（TopBar 工具內容仍在）|
| T3 | `AC-030-NO-FOOTER — /app page has no HomeFooterBar` / `HomeFooterBar text absent on /app` | `page.goto('/app')`；`expect(page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })).toHaveCount(0)`；`expect(page.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true })).toHaveCount(0)`|
| T4 | `AC-030-BG-COLOR / AC-030-PENCIL-ALIGN — /app wrapper bg is gray-950, not paper` / `app root wrapper computed bg matches gray-950 (rgb(3,7,18)) — binds Pencil ap001 frame` | `page.goto('/app')`；wait networkidle；讀根 `<div class="h-screen ...">` 的 computed `background-color`，assert `!== 'rgb(244, 239, 229)'` AND `=== 'rgb(3, 7, 18)'`（Tailwind gray-950，同時鎖 Pencil v1 `ap001` frame 色值）|
| T5 | `AC-030-BG-COLOR — body bg paper rule preserved on /app` / `body computed bg remains rgb(244,239,229) on /app` | `page.goto('/app')`；wait networkidle；讀 body 的 computed bg，assert `=== 'rgb(244, 239, 229)'`（證明 K-021 sitewide body 規則未被刪除，僅 wrapper 層覆蓋；防未來 refactor 將 body 改為 route-scoped 時 T4 仍 pass 但 K-021 靜默 regress）|

**為什麼拆 5 個獨立 case 而非合併：** PM 量化規則（K-021 / K-022 既有）— 每 AC 至少 1 個獨立 test case，合併會使失敗時斷點定位困難。AC-030-BG-COLOR 於 ticket QA Early Consultation 被 PM 裁決拆為 wrapper 與 body 兩斷言（ticket L191 Option A），故 T4/T5 分列；T4 同時綁 AC-030-PENCIL-ALIGN（無獨立 spec，以 T4 色值斷言鎖 Pencil frame）。

### 6.3 Post-review addendum（pending Engineer landing）

Code Review I-2 round 後 Engineer 正進行 fix pass 2 追加 Hero CTA new-tab test case（`AppPage` 外部另一處 `/app` 開啟入口，若存在則需與 T1 等同斷言 new tab 行為）。該 test 由 Engineer 實作並 land 後，PM 將於 ticket close 時更新本段 §6.2 總數 5→6 並補列 T6。目前占位不前瞻改總數，避免設計文件與 main branch spec 不一致。

### 6.2.1 Playwright new-tab pattern（T1 詳述給 Engineer）

```
const { page, context } = ...
await page.goto('/')
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.locator('[data-testid="navbar-desktop"]').getByRole('link', { name: 'App', exact: true }).click(),
])
await newPage.waitForLoadState()
expect(newPage.url()).toContain('/app')
expect(page.url()).toMatch(/\/$/)  // 原 tab 仍在 /
```

**注意點：** `Promise.all` 把 `waitForEvent('page')` 與 `click()` 並行註冊，避免 click 觸發 new page 事件時已錯過 listener。

---

## 7 Boundary Preemption

對每個受影響 AC，明列邊界行為：

| 邊界場景 | 是否在 design 定義 | 行為 |
|---------|-------------------|------|
| 使用者禁用 JS（SPA 無法運作）| ✅ | AC-030 整體要求 SPA 場景；JS 禁用時 `/app` 本身無法載入（React 未 mount），與本票無關 |
| popup blocker 阻擋 new tab | ✅ | `<a target="_blank">` 透過使用者點擊觸發，屬 user-initiated navigation，主流瀏覽器不阻擋（有別於 `window.open()` script 觸發）。無需處理 fallback |
| middle-click / ctrl-click | ✅ | 原生 `<a href>` 支援所有瀏覽器導航快捷鍵（中鍵開新 tab / ctrl+click / cmd+click）；`<Link>` react-router 攔截會破壞此行為——換 `<a>` 反而修復（好處）|
| keyboard accessibility | ✅ | `<a>` 本身 focusable；無需額外 `tabIndex`；NavBar 維持 keyboard nav（Tab 循環） |
| App link 點擊時 context 已被關閉（tab 已有 unload） | ✅ | N/A 使用者觸發點擊時 tab 必 active |
| `/app` 直接 URL 載入（非從 NavBar 點擊） | ✅ | T2 / T3 / T4 測試正是 direct goto；行為一致 |
| Empty viewport（極窄螢幕）| ✅ | AppPage 原本已有 `h-screen`（非 min-h），即使無 NavBar + Footer，main region 填滿 viewport，無 empty space |
| NavBar `external` 未設（undefined）時 | ✅ | default 分支走 `<Link>`，向後兼容 |
| 瀏覽器禁 `noopener`（極舊） | ✅ | `rel="noopener noreferrer"` 為 declarative string，舊瀏覽器忽略時仍正確渲染 link（只是失去防護）；不屬 ticket scope |

無 unresolved boundary。

---

## 8 Implementation Order（建議 Engineer 順序）

1. **先改 AppPage.tsx**（最小 surface，無他檔依賴）：
   - 加 `bg-gray-950 text-gray-100` 到根 div
   - 刪 UnifiedNavBar import + 使用
   - 刪 HomeFooterBar import + 使用
   - `/playwright` 跑 ma99-chart + pages.spec.ts 確認 `/app` tool 功能不壞
   - `npx tsc --noEmit` 確認 type 乾淨

2. **改 UnifiedNavBar.tsx**（NavBar 全頁共用，影響範圍大）：
   - TEXT_LINKS App entry 加 `external: true`
   - desktop map + mobile map 都加 branch
   - `/playwright` 跑 navbar.spec.ts 對應測試 — 預期 AC-NAV-4 App link 測試（現版）會失敗（`.click()` 觸發 new tab 而非 same-tab navigate），進行下一步

3. **修既有 3 個 spec**（sitewide-body-paper / sitewide-footer / sitewide-fonts / navbar）：
   - 刪除 `/app` 相關 test case / block（見 §6）
   - `/playwright` 全跑 — 應全綠

4. **新增 app-bg-isolation.spec.ts**：
   - 依 §6.2 寫 4 個 test case
   - `/playwright` 跑全部 E2E — 全綠

5. **Vitest unit 跑一次**：
   - `npm test` 確認 AppPage / OHLCEditor / PredictButton / StatsPanel / MatchList 全綠（AC-030-FUNC-REGRESSION）

6. **deploy check**（per CLAUDE.md Deploy Checklist）：
   - `grep "/api/" src/` 確認 API path 無漏
   - `npm run build` 成功

**可平行：** 無；Step 2 依賴 Step 1 的 AppPage 已移除 NavBar（否則 `/app` 同時渲染 NavBar + App link 點擊 → 從 `/app` 跳回 `/app`，語意怪）。Step 3 / 4 可在 Step 2 完成後平行。

---

## 9 Risks & Notes

| 類別 | 項目 | 說明 |
|------|------|------|
| Security | `rel="noopener noreferrer"` 必須同時存在 | `noopener` 防 reverse tabnabbing，`noreferrer` 防 Referrer 洩漏。已於 §2.3 定義；Code Review 時 grep `target="_blank"` 確認每處皆配對 |
| 視覺 | 深色 `/app` vs 淺色 marketing site 落差 | 屬 ticket 設計意圖（tool UI vs marketing palette 刻意分離），非 bug |
| 視覺 | TopBar L7 `bg-gray-900 border-b border-gray-700` 與新根 `bg-gray-950` 對比 | 沒差；pre-K-021 即如此（`bg-gray-950` 根 + `bg-gray-900` TopBar 同一設計），恢復原狀 |
| Layout | `h-screen overflow-hidden` + 移除兩個 flex 子項 | main region flex-1 自動 grow 吃掉剩餘高度；sticky predict button `sticky bottom-0` 仍錨定 side panel 底部（relative to scroll container）；無 layout break |
| Accessibility | 移除 NavBar 等於 `/app` 無站內導航 | 使用者若要回其他頁只能關 tab 或手動改 URL；符合「tool application 獨立 viewport」意圖（類比：Figma / Notion 全螢幕模式）|
| 測試 | ga-tracking.spec.ts 測 `/app` pageview | 保留（direct goto 仍觸發 pageview）；但 Engineer 實跑確認 |
| 測試 | `navbar.spec.ts` 有 `/app` iteration 3 處需刪 | 已於 §6 文件化；Engineer 照表刪 |
| Deploy | Firebase Hosting + Cloud Run | 無後端變更，無 API path 變更；`/app` 路由 SPA fallback 不變 |

---

## 10 Architecture Doc Sync

需更新 `agent-context/architecture.md` 以下段落：

### 10.1 Frontend Routing 表

`/app` 列 NavBar 描述：現行「NavBar 掛所有頁面」不變（敘述在 Design System 段），但需於「UnifiedNavBar」段補一行「`/app` 不渲染 NavBar（K-030 isolation）」。

### 10.2 Design System §"Footer 放置策略" 表

`/app` 欄：`<HomeFooterBar />` → `無 footer（K-030 isolation，`/app` 為獨立 tool viewport）`

### 10.3 Design System §"Shared Components 邊界" 表

`HomeFooterBar` used-by 欄：`/ /app /business-logic` → `/ /business-logic`

### 10.4 Design System §"全站 Body CSS 入口" 段

補一句註記：「`/app` 於 wrapper 層 override（`bg-gray-950 text-gray-100`），body 規則對 `/app` 的效果被覆蓋。K-030 引入此例外，標示 `/app` 不屬 sitewide paper system（tool page，非 marketing page）。」

### 10.5 Changelog 新增一條

```
- **2026-04-21**（Architect, K-030 post-code-review doc alignment）— §6.2 test count 4→5 + T4/T5 split（原 T4 合併 wrapper bg + body bg 斷言，改為 T4 = wrapper `rgb(3,7,18)` + AC-030-PENCIL-ALIGN 綁定；T5 = body `rgb(244,239,229)` 保留）；AC 映射補 AC-030-PENCIL-ALIGN；新增 §6.3 post-review addendum 占位 Hero CTA new-tab test case pending Engineer fix pass 2 landing。I-2 Code Review drift fix，無 source code 異動。
- **2026-04-21**（Architect, K-030 設計）— `/app` isolation：UnifiedNavBar 不再渲染於 /app；HomeFooterBar 從 /app 撤出（Footer 放置表 /app 改為「無 footer」，Shared Components 邊界表 HomeFooterBar 用於欄縮為 `/ /business-logic`）；AppPage 根 div 回到 pre-K-021 `bg-gray-950 text-gray-100` palette（wrapper 層 override body paper）；UnifiedNavBar TEXT_LINKS 加 `external?: boolean`，App link 設 external=true 開 new tab（`<a target=_blank rel=noopener noreferrer>`）。Engineer 交付後補 e2e spec 異動清單：sitewide-body-paper/footer/fonts 刪 /app case；navbar.spec.ts AC-NAV-*/AC-021-NAVBAR 刪 /app iteration；新增 app-bg-isolation.spec.ts（4 test cases 對應 AC-030-NEW-TAB/NO-NAVBAR/NO-FOOTER/BG-COLOR）。
```

### 10.6 Self-Diff Verification

Architect 本票同步 architecture.md 後，將於該 Edit 後 append：

```
### Self-Diff Verification
- Section edited: Footer 放置策略表 + Shared Components 邊界表 + 全站 Body CSS 入口段 + Changelog
- Source of truth: K-030 ticket §Scope (ticket L35–41)、本設計文件 §2.5 / §5.2 / §10
- 列數比對：Footer 放置策略 5 列 vs 5 列 ✓；Shared Components 3 列 vs 3 列 ✓；used-by 欄位 `/ /business-logic` 對應 Footer 表 /app=無 footer ✓
- 同檔跨表 sweep：`grep -n 'HomeFooterBar' agent-context/architecture.md` 全部命中處逐格驗證 ✓（Footer 放置表 L468 + Shared Components 表 L476，同步修正）
- 差異：無
```

**此 Self-Diff block 將由 Architect 在實際 Edit architecture.md 時 append 到 Changelog；目前設計文件階段宣告預期結果，實際 Edit 於交付後立即執行（見下方 handoff 步驟）。**

---

## 11 Handoff

- 本設計文件 status = `ready-for-qa-early-consultation`
- 下一步：PM 發動 QA Early Consultation（依 ticket §QA Early Consultation 四項 boundary 確認）
- QA 確認後 PM 放行 Engineer
- Architect 已完成：本文件 + §10 架構文件同步 + retrospective append（見下方）

---

## Retrospective

**Where most time was spent：** §2.1 背景色 Pre-verdict 打分（5 維 × 4 選項 = 20 cell），以及 §2.6 spec conflict 的兩額外衝突（`sitewide-footer.spec.ts` / `sitewide-fonts.spec.ts`）— PM 只 flag `sitewide-body-paper.spec.ts`，Architect grep `/app` 全 e2e 目錄才發現 2 個額外必連動 spec。

**Which decisions needed revision：** 無。

**Next time improvement：** Persona 層已有「global style / shared component 變更必列 Route Impact Table」，但對「撤除 shared component（反向變更）」時同類掃描未 codify。下次 ticket 若涉及「從某頁撤除 shared component」，第一步 grep 該組件於全 e2e 目錄，而非只讀 PM flagged 的 spec，避免遺漏連動。此改善補入 `senior-architect.md`「Cross-Page Duplicate Audit」段下另立一條 **Shared Component Removal Scan**。
