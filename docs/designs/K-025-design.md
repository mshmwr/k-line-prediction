---
title: K-025 — UnifiedNavBar hex → token 遷移 + navbar.spec.ts 雙軌斷言升級
type: design
ticket: K-025
created: 2026-04-22
owner: Architect
visual-spec: N/A — zero-visual-change pure refactor；computed color 等價由 dist CSS declaration grep 守護。ticket frontmatter 已於 L9 明示 `visual-spec: N/A — reason: zero-visual-change refactor` + QA Q1 修正註記。
depends-on: K-021（tokens `paper` / `ink` / `brick-dark` 註冊於 `frontend/tailwind.config.js` L6–L9，已驗；NavBar active-color 決策採 `brick-dark` 沿用）
---

## 0. Scope Questions / Blockers

**無 SQ / BQ 需 PM 裁決。** 下列常見歧義點均已由 ticket AC 或既有 code / design doc 閉合，Architect 不代 PM 決策：

| 可能疑點 | 來源確認 | 結論 |
|---------|---------|------|
| NavBar active 色為 `brick` 還是 `brick-dark`？ | K-021 設計文件 §Q2 PM 裁決為 B（brick-dark 維持）、ticket K-025 §範圍 L26 明列 `text-[#9C4A3B]` → `text-brick-dark` | `text-brick-dark` |
| `text-[#1A1814]/60` 對應何 token？ | `tailwind.config.js` 有 `ink: '#1A1814'`，Tailwind `/60` opacity modifier 直接作用於 named color | `text-ink/60`（computed `rgba(26, 24, 20, 0.6)`）|
| 需不需要新增 props？ | K-021 §5.3 Before/After 明列 NavBar 維持零 props | 維持零 props（pure internal className refactor）|
| QA Q1「compiled CSS 相同」如何驗證？ | ticket frontmatter L9 + AC-025-REGRESSION L78 指定「`dist/assets/*.css` 4 條 declaration 宣告數 pre == post」 | pre-build + post-build 各跑 `npm run build`，grep 4 hex declaration count 比對 |
| `[aria-current="page"]` 對現有 spec 是否已存在？ | AC-021-NAVBAR 既有 3 條 aria-current 斷言（spec L217 / L227 / L235），本票新增 `toHaveCSS` 作第二軌、drop 5 條 class-name regex | 既有 aria-current 斷言保留，不重寫 |

---

## 1. Scope Summary

K-025 為 pure-refactor（type=refactor，frontmatter L6），目標是在 `frontend/src/components/UnifiedNavBar.tsx` 把最後 7 處 hex literal 改寫為 K-021 已註冊的 Tailwind tokens（`paper` / `ink` / `brick-dark`），並把 `frontend/e2e/navbar.spec.ts` 中 5 處 class-name regex 斷言（K-021 Reviewer W-3 標示為中間層最弱寫法）汰換為「attribute + computed color 雙軌斷言」，一次補齊 TD-K021-09 的 `/` route inactive color 3 斷言與 QA Q3 要求的 `/business-logic` hidden-route active-link no-op 斷言。

rendered-color 層等價由 `dist/assets/*.css` 中 4 條 hex declaration（`color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`）在 refactor 前後出現次數 pre == post 守護；selector 名稱（`text-[#9C4A3B]` → `text-brick-dark`）會變，computed value 不變。此為「behavior equivalent at rendered-color level，NOT at CSS-selector level」（對齊 QA Early Consultation Q1 修正）。

---

## 2. OLD → NEW className Mapping（7 處，分色分組）

### 2.1 grep 結果（source of truth）

`grep -nE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` 回 5 行，展開後含 7 處 className hex literal（L18 / L19 註釋內 hex 不需改；為 K-017 決策敘述文字）：

| 行號 | OLD className 含 hex | hex value | distinct color |
|------|----------------------|-----------|----------------|
| L36 | `text-[#9C4A3B]` | `#9C4A3B` | brick-dark（active） |
| L38 | `text-[#1A1814]/60` | `#1A1814` | ink（inactive 主色 @ 60% opacity） |
| L38 | `hover:text-[#1A1814]` | `#1A1814` | ink（hover target @ 100%） |
| L75 | `bg-[#F4EFE5]` | `#F4EFE5` | paper（nav background） |
| L75 | `border-[#1A1814]` | `#1A1814` | ink（bottom border） |
| L82 | `text-[#1A1814]` | `#1A1814` | ink（HomeIcon idle） |
| L82 | `hover:text-[#9C4A3B]` | `#9C4A3B` | brick-dark（HomeIcon hover） |

**Distinct colors = 3**（`#9C4A3B` / `#1A1814` / `#F4EFE5`），total hex occurrences = 7，與 ticket §背景 L15 敘述一致。

### 2.2 OLD → NEW className 對照（1:1 token 替換）

| # | Line | OLD | NEW | Tailwind 編譯產物（對照 tailwind.config.js）|
|---|------|-----|-----|-------------------------------------------|
| 1 | L36 | `text-[#9C4A3B]` | `text-brick-dark` | `.text-brick-dark { color: rgb(156 74 59); }` |
| 2 | L38 | `text-[#1A1814]/60` | `text-ink/60` | `.text-ink\/60 { color: rgb(26 24 20 / 0.6); }` |
| 3 | L38 | `hover:text-[#1A1814]` | `hover:text-ink` | `.hover\:text-ink:hover { color: rgb(26 24 20); }` |
| 4 | L75 | `bg-[#F4EFE5]` | `bg-paper` | `.bg-paper { background-color: rgb(244 239 229); }` |
| 5 | L75 | `border-[#1A1814]` | `border-ink` | `.border-ink { border-color: rgb(26 24 20); }` |
| 6 | L82 | `text-[#1A1814]` | `text-ink` | `.text-ink { color: rgb(26 24 20); }` |
| 7 | L82 | `hover:text-[#9C4A3B]` | `hover:text-brick-dark` | `.hover\:text-brick-dark:hover { color: rgb(156 74 59); }` |

**驗證方式：** Engineer 改完後跑 `grep -nE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx`，結果行數 = 2（僅剩 L18 / L19 的 K-017 決策敘述註釋），className 範圍內 0 hex。

**註釋處理：** L18–L20 JSDoc 提到 `#9C4A3B` / `#B43A2C` 為「歷史色決策敘述」（保留 K-017 視覺驗收、brick 與 brick-dark 語意區分）。此為文件性 hex，非 className。保留不動；AC-025-NAVBAR-TOKEN 的 grep 目標為 className 範圍 0 hex（Then clause「所有顏色/邊框/背景 class 均為 K-021 token」）而非整檔 0 hex。Engineer 如要一併把註釋 hex 改名（例如 `brick-dark (#9C4A3B)` → `brick-dark`）為 stylistic choice，非本票硬要求，建議保留以維持 K-017 決策溯源。

---

## 3. OLD → NEW E2E 斷言 Mapping（5 drop + 4 new-add = 9 rows）

### 3.1 Drop 既有 class-name regex（5 rows）

| # | spec 行號 | OLD 斷言 | 為何 drop | 替代斷言位置 |
|---|-----------|----------|-----------|-------------|
| 1 | L177 | `nav.getByRole('link', { name: 'About' }).toHaveClass(/text-\[#9C4A3B\]/)` | class-name regex 寫死 pre-refactor selector；refactor 後 class 變 `text-brick-dark`，regex 會失敗且無法驗 rendered color | §3.2 row #1 + row #2（/about About aria-current + toHaveCSS）|
| 2 | L178 | `nav.getByRole('link', { name: 'App' }).toHaveClass(/text-\[#1A1814\]/)` | post-refactor 仍會匹配 `text-ink/60`（寬鬆 substring），無法偵測 state-swap bug（active/inactive 被互換時仍通過）| §3.2 row #3（/about App toHaveCSS inactive）|
| 3 | L186 | `nav.getByRole('link', { name: 'Diary' }).toHaveClass(/text-\[#9C4A3B\]/)` | 同 #1 | §3.2 row #4 + row #5（/diary Diary aria-current + toHaveCSS）|
| 4 | L187 | `nav.getByRole('link', { name: 'About' }).toHaveClass(/text-\[#1A1814\]/)` | 同 #2 | §3.2 row #6（/diary About toHaveCSS inactive）|
| 5 | L204 | `nav.getByRole('link', { name: 'About' }).toHaveClass(/text-\[#1A1814\]/)`（mobile / page）| 同 #2；mobile viewport | §3.2 row #7（/ mobile About toHaveCSS inactive）|

**Drop 後相關 describe 結構調整：**
- L169 `test.describe('AC-NAV-4 — Active link highlighted #9C4A3B, others #1A1814/60', ...)` → rename 為 `'AC-NAV-4 — Active link highlighted (brick-dark), inactive ink/60 — dual-rail'`（敘述不再暗示 hex regex）
- L169–L189 兩個 test 主體重寫（見 §3.2）
- L193 `test.describe('AC-NAV-4 — Active link highlighted (mobile)', ...)` 保留標題；test 主體（L199–L205）改用雙軌（見 §3.2 row #7）

### 3.2 New-add（整合舊 test + 補 coverage）

以下 4 列為 **新斷言**；其中 row #7 / #8 為 TD-K021-09 `/` route 3 斷言 + QA Q3 `/business-logic` 斷言一次補齊。

| # | 路由 / 視窗 | Link | 斷言 1（attribute）| 斷言 2（computed color）| 涵蓋 AC |
|---|-----------|------|-------------------|------------------------|---------|
| 1 | `/about` desktop | About (active) | `toHaveAttribute('aria-current', 'page')` | `toHaveCSS('color', 'rgb(156, 74, 59)')` | AC-025-NAVBAR-SPEC（active 雙軌）|
| 2 | `/about` desktop | App (inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` | AC-025-NAVBAR-SPEC（inactive 替換寬鬆 regex）|
| 3 | `/diary` desktop | Diary (active) | `toHaveAttribute('aria-current', 'page')` | `toHaveCSS('color', 'rgb(156, 74, 59)')` | AC-025-NAVBAR-SPEC |
| 4 | `/diary` desktop | About (inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` | AC-025-NAVBAR-SPEC |
| 5 | `/` desktop | App / Diary / About (3 inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` × 3 | AC-025-NAVBAR-SPEC + TD-K021-09 |
| 6 | `/` mobile | About (inactive) | — | `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` | AC-025-NAVBAR-SPEC（替換 L204 寬鬆 regex）|
| 7 | `/business-logic` desktop | — | `page.locator('[aria-current="page"]').toHaveCount(0)` | — | AC-025-NAVBAR-SPEC + QA Q3 |
| 8 | `/about` desktop | Home (inactive) | — | *optional*，non-blocking | —（可選補；見下方 note）|

**Test case 總數變化（以 Playwright test() 單位計）：**
- `AC-NAV-4 — Active link highlighted #9C4A3B, others #1A1814/60` describe 下 2 tests → 重寫為 dual-rail 2 tests（/about 1 + /diary 1，每 test 含 2 links × 雙軌；row #1–#4 併入這 2 tests）
- `AC-NAV-4 — Active link highlighted (mobile)` describe 下 1 test → 改寫 1 test（row #6）
- 新增 describe `AC-025 — Inactive color on / route (desktop)` 下 1 test（row #5，3 links 併入同 test）
- 新增 describe `AC-025 — /business-logic has no active link` 下 1 test（row #7）
- Prediction hidden 既有 2 tests（L252 / L258）保留不動（AC-025-NAVBAR-SPEC `And` 第 5 條明示不重複新增）

**Net delta on spec file：** drop 5 regex 斷言、改寫 3 tests（/about 1 / /diary 1 / mobile 1）、新增 2 tests（`/` inactive × 1 + `/business-logic` no-active × 1）。

**AC cross-check（對齊 persona "AC ↔ Test Case Count Cross-Check" 硬 gate）：**
- ticket §驗收條件 AC-025-NAVBAR-SPEC 的 `And` 條款（L65 / L66 / L67 / L68 / L69）總計 5 條可測 assertion family：
  - And #1（L65 active 雙條件）→ 對應 §3.2 row #1 + row #3（2 tests）
  - And #2（L66 inactive computed color）→ 對應 §3.2 row #2 + row #4 + row #5 + row #6（併入前述 2 dual-rail tests + 新增 2 tests 共 4 tests 的 assertion）
  - And #3（L67 `/` desktop inactive 3 斷言）→ 對應 §3.2 row #5（1 test，3 assertion 併入同 test）
  - And #4（L68 `/business-logic` aria-current count 0）→ 對應 §3.2 row #7（1 test）
  - And #5（L69 Prediction hidden 不重複新增）→ N/A（non-add）
- 設計文件新增 / 改寫 test 總數 = 5（/about dual-rail 1 + /diary dual-rail 1 + mobile 1 改寫 + `/` inactive 1 新增 + `/business-logic` 1 新增）
- 5 tests ≥ 5 AC `And` 條款覆蓋 ✓

---

## 4. Route Impact Table（4 routes × {visual, behavior, test-coverage-delta}）

`UnifiedNavBar` 掛 4 marketing 路由（K-030 起 `/app` 不再掛 NavBar，故不列入）：

| Route | Visual | Behavior | Test coverage delta | 備註 |
|-------|--------|----------|---------------------|------|
| `/` | `unchanged` — 背景 paper / inactive ink/60 / hover ink / active brick-dark 四色 computed 值不變（由 dist CSS declaration grep 守護）| `unchanged` — aria-current 邏輯、external new-tab、filter hidden 均無改動 | +1 test（row #5 desktop 3 links inactive）；+0 test（mobile 既有已覆蓋 Home）| Engineer 無需額外視覺驗證，tsc + Playwright + dist CSS grep pre==post 三門即可 |
| `/about` | `unchanged` | `unchanged` | 改寫 1 test（dual-rail：About active + App inactive）| About active → `brick-dark`；App inactive → `ink/60` |
| `/diary` | `unchanged` | `unchanged` | 改寫 1 test（dual-rail：Diary active + About inactive）| Diary active → `brick-dark`；About inactive → `ink/60` |
| `/business-logic` | `unchanged` | `unchanged` — 既有行為：`pathname !== '/'` 且不匹配任何 visible link.path，故無 `[aria-current="page"]` | +1 test（row #7 aria-current count 0）| 補 QA Q3 hidden-route coverage gap（pre-K-025 無此斷言）|

**視覺驗證結論：** 四路由皆 `unchanged`；Engineer 不需開 dev server 逐路由目視（per feedback_shared_component_all_routes_visual_check，視覺不變 → 視覺驗證可免；但 dist CSS declaration count pre == post 是 hard gate）。

---

## 5. Behavior-diff Statement（3 bullets per protocol）

- **Rendered-color level：equivalent.** `npm run build` 前後各跑一次，grep `dist/assets/*.css` 中 `color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814` 四條 declaration 出現次數必 pre == post（AC-025-REGRESSION L78 強制）。Tailwind JIT 會把 `text-[#9C4A3B]` 與 `text-brick-dark` 編為相同的 color value 宣告（前者為 arbitrary-value utility，後者為 named-color utility，selector class name 不同但 declared color 值相同）。QA Q1 修正說明本條。
- **CSS-selector level：NOT equivalent.** `.text-\[\#9C4A3B\]` 類 selector 在編譯產物中**將消失**（若 codebase 其他處無此 arbitrary-value 消費者）；`.text-brick-dark` 類 named selector 將出現。原 `navbar.spec.ts` 5 條 class-name regex 斷言如果不汰換，refactor 後會失敗（OLD regex 匹配失敗）或誤通過（`/text-\[#1A1814\]/` 仍寬鬆匹配 `text-[#1A1814]/60` 子串）。雙軌斷言（aria-current + toHaveCSS）脫離 selector 名稱依賴，直接驗 React state + rendered computed color，refactor-proof。
- **Component props / internal logic：equivalent.** `UnifiedNavBar` 維持零 props（K-021 §5.3 敘述）、`TEXT_LINKS` 常數 shape 不動、`navLinkClass()` 邏輯分支（isActive → active / else → inactive）不動、`renderLink()` external / SPA 分支不動、`useLocation` + `pathname === path` 判斷不動。`git show main:frontend/src/components/UnifiedNavBar.tsx` truth table（下節）逐行確認。

### 5.1 git-show baseline truth table（per persona Pre-Design Dry-Run Proof）

`git show main:frontend/src/components/UnifiedNavBar.tsx`（已執行，見 Architect session Bash log）— 行為分支逐格 enumerate：

| 路徑 | `pathname === path`？| `link.external`？| render | className 輸出 |
|------|---------------------|-------------------|--------|----------------|
| `/app` on `/` | false | true | `<a target=_blank rel=noopener>` | `text-[13px] font-mono text-[#1A1814]/60 hover:text-[#1A1814] transition-colors`（desktop）/ `text-[11px]`（mobile）|
| `/app` on `/app` | N/A — `/app` 不掛 NavBar（K-030）| — | — | — |
| `/diary` on `/diary` | true | undefined | `<Link aria-current="page">` | `text-[13px] font-mono text-[#9C4A3B] transition-colors`（active）|
| `/diary` on `/about` | false | undefined | `<Link aria-current={undefined}>` | inactive className |
| `/about` on `/about` | true | undefined | active className（`text-[#9C4A3B]`）| |
| `/about` on `/diary` | false | undefined | inactive className | |
| `/business-logic` on 任何 | hidden: true → filter 過濾 → 不 render | — | — | — |
| Home icon on `/` | `pathname === '/'` → active | — | `<Link aria-current="page">` | `text-[#1A1814] hover:text-[#9C4A3B]` |
| Home icon on `/about` | `pathname === '/about'` → false → aria-current={undefined} | — | `<Link aria-current={undefined}>` | `text-[#1A1814] hover:text-[#9C4A3B]` |

**Refactor 後 truth table 每格 className 的 hex-literal 部分替換為 token 名稱，其餘不動。** 無邏輯分支改動，Engineer 不得引入任何 filter / 排序 / 排版變化（若有 → scope creep，回報 PM）。

### 5.2 §API 不變性雙軸（per Gate 3）

- **(a) wire-level schema diff：** 本票不涉及任何 API schema（純 frontend className / test assertion 改動），`git diff main -- backend/` 預期空 diff。AC-025-REGRESSION L76–L77 K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR + 其他頁面 E2E 不回歸守護。
- **(b) frontend observable behavior diff table：**

| 觀察點 | OLD render (base `main`) | NEW render (post-K-025) | 是否等價 |
|--------|--------------------------|-------------------------|---------|
| `/about` About active link 的 computed `color` | `rgb(156, 74, 59)`（`#9C4A3B` arbitrary-value class）| `rgb(156, 74, 59)`（`brick-dark` named class）| ✓ |
| `/` App inactive link 的 computed `color` | `rgba(26, 24, 20, 0.6)` | `rgba(26, 24, 20, 0.6)` | ✓ |
| `/diary` nav `<nav>` 的 computed `background-color` | `rgb(244, 239, 229)` | `rgb(244, 239, 229)` | ✓ |
| `/business-logic` 任何 link 的 `aria-current` count | 0（pre-existing 行為，既有 spec 未斷言）| 0（unchanged；新增斷言守護）| ✓ |
| Empty / hidden Prediction link DOM 出現次數 | 0（filter）| 0（filter，未動）| ✓ |
| Boundary：`pathname === '/'` 時 Home icon `aria-current` | `"page"` | `"page"` | ✓ |
| Boundary：external App link 按下 → new tab | `target=_blank` 行為 | `target=_blank` 行為 | ✓ |

四路由 × {active / inactive / background / border / hover} 組合於 rendered-color 層全部 `unchanged`。

---

## 6. File Change List（3 files 上限）

| # | 檔案 | 動作 | 責任描述 |
|---|------|------|----------|
| 1 | `frontend/src/components/UnifiedNavBar.tsx` | modify | 7 處 hex className 按 §2.2 表 1:1 替換為 token；邏輯 / props / JSX 結構不動；L18–L20 註釋 hex 保留（文件性溯源，非 className）|
| 2 | `frontend/e2e/navbar.spec.ts` | modify | 依 §3.1 drop 5 class-name regex；依 §3.2 改寫 3 tests（/about / /diary desktop dual-rail + mobile inactive）+ 新增 2 tests（`/` desktop 3-inactive + `/business-logic` no-active）|
| 3 | `agent-context/architecture.md` | append-only | Changelog 前置一列：`**2026-04-22**（Engineer, K-025 實作）— UnifiedNavBar 7 處 hex→token（paper/ink/brick-dark）+ navbar.spec.ts 5 regex drop / 雙軌 toHaveCSS 斷言 + TD-K021-09 收齊；no structural change`；§Frontend Routing / §Design System / §Shared Components 邊界表不動（零結構改動）|

**明確不改動：**
- `frontend/tailwind.config.js` — tokens 已於 K-021 註冊，不動
- `frontend/src/index.css` — body paper CSS 為 K-021 入口，不動
- `frontend/src/components/NavBar.tsx`（legacy）— K-021 設計曾建議刪除，但本票 ticket §範圍 L46 明示「NavBar 結構改動 — 非 scope」，不刪除（若要清 dead file 開獨立 TD ticket）
- 其他頁面 hex — ticket L47 明示「K-022/K-023/K-024 自管」

---

## 7. Implementation Order（序列）

| Step | 動作 | 驗證手段 | 預計結果 |
|------|------|---------|---------|
| 0 | `cd` 進 worktree；確認 base 為 main HEAD；`git show main:frontend/src/components/UnifiedNavBar.tsx` 與工作樹 diff 應為空 | `git diff main -- frontend/src/components/UnifiedNavBar.tsx` | empty |
| 1 | `npm ls tailwindcss` + `grep -nE "'paper'\|'ink'\|'brick-dark'" frontend/tailwind.config.js` | 確認 3 token 已註冊（已於 §0 驗證）| 3 row match |
| 2 | **Pre-refactor CSS baseline 取樣**：`cd frontend && npm run build && grep -oEc "(color:#9c4a3b\|color:#1a1814\|background-color:#f4efe5\|border-color:#1a1814)" dist/assets/*.css > /tmp/k025-pre.txt` | stash count 為 post 比對 baseline | 記錄 4 declaration 出現次數 |
| 3 | Edit `UnifiedNavBar.tsx`：依 §2.2 7 rows 一口氣改 | `grep -nE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` | 僅剩 L18–L20 註釋 hex，className 範圍 0 hex |
| 4 | `npx tsc --noEmit` | exit code | 0 |
| 5 | **Post-refactor CSS count 比對**：`cd frontend && npm run build && grep -oEc "(color:#9c4a3b\|color:#1a1814\|background-color:#f4efe5\|border-color:#1a1814)" dist/assets/*.css > /tmp/k025-post.txt && diff /tmp/k025-pre.txt /tmp/k025-post.txt` | diff exit code | 0（pre == post 4 declaration 同數）|
| 6 | Edit `navbar.spec.ts`：依 §3.1 drop 5 regex；依 §3.2 改寫 3 tests + 新增 2 tests | 讀檔確認 | spec 純文字語法對 |
| 7 | `npx playwright test navbar.spec.ts` | exit code + 新 test 通過 | 0，且改寫 / 新增 test 綠燈 |
| 8 | `npx playwright test` 全 suite regression | exit code | 0（不得新增 failure） |
| 9 | `grep -rnE '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` 最終確認 | grep 結果 | 僅註釋，無 className |
| 10 | Append architecture.md Changelog（§6 row #3）| 讀檔 | 新條目在最上方 |
| 11 | commit with message `refactor(K-025): migrate UnifiedNavBar hex literals to K-021 tokens + dual-rail navbar assertions` | `git log -1` | commit 建立 |

**阻斷條件（任一即回退 blocker）：**
- Step 5 diff 不為 0（pre != post declaration count）→ refactor 不是 rendered-color-equivalent，blocker 回 Architect（可能 Engineer 漏改或多改 className）
- Step 7 新 spec fail → 雙軌斷言實作錯誤（computed color 寫錯 rgb() 格式、aria-current 寫錯屬性）
- Step 8 舊 spec fail → 回歸，blocker 調查是否 scope creep

---

## 8. Shared Component Boundary（per persona）

- `UnifiedNavBar` 確認為 **shared component**（consumer：`/` / `/about` / `/diary` / `/business-logic` 4 marketing routes，K-030 起 `/app` 撤除）
- **無新 props interface；零 props 維持**（K-021 §5.3 + 本票 L46 不改結構）
- Blast radius：4 routes × {rendered-color, aria-current behavior} = 8 cell，§4 Route Impact Table 全 `unchanged`
- Target-route consumer scan（per persona §Target-Route Consumer Scan）：本票不改 route 導航行為（new-tab / SPA / redirect），不觸發 scan 規則

---

## 9. Boundary Pre-emption

| Boundary scenario | Is behavior defined? | 補救 |
|------------------|----------------------|------|
| Empty / null input | N/A — 組件無輸入（零 props） | — |
| Max / min value boundary | N/A — 無數值邏輯 | — |
| API error response | N/A — 不涉 API | — |
| Concurrency / race condition | N/A — 無副作用 | — |
| 空列 / 單項 / 大量資料 | N/A — `TEXT_LINKS` 靜態常數 | — |
| Hidden route active-link（K-025 新補）| ✅ 新增 AC-025-NAVBAR-SPEC `And #4` + §3.2 row #7 | — |
| 註釋內 hex 被 grep 誤殺 | ✅ §2.2 已說明 className 範圍 0 hex vs 整檔，AC-025-NAVBAR-TOKEN Given/When/Then 聚焦 className | — |
| mobile viewport inactive 色斷言 | ✅ §3.2 row #6 保留 | — |
| dist/assets CSS 檔名可能含 hash | ✅ glob `dist/assets/*.css`；且該檔案目錄由 Vite 產出唯一 css bundle，無需處理多檔 | — |

---

## 10. Refactorability Checklist

- [x] Single responsibility — UnifiedNavBar 單責任（渲染 nav 列），refactor 不引入新責任
- [x] Interface minimization — 零 props 維持
- [x] Unidirectional dependency — `useLocation` → `pathname` → className，無 side effect 或 upward 呼叫
- [x] Replacement cost — Tailwind token 集中 `tailwind.config.js`，未來替換成本聚焦單點
- [x] Clear test entry point — dual-rail 斷言顯式分離「React state（aria-current）」與「render output（computed color）」兩個測試視角
- [x] Change isolation — API contract 不動（§5.2a）；UI className 改動不波及 backend / hooks

---

## 11. All-Phase Coverage Gate

本票為 single-phase（refactor），無跨 Phase scope。確認四格 ✅：

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|-----------------|----------------|----------------|
| 單票 | N/A（不涉 API）| §4 Route Impact Table 4 routes | §2–§5 UnifiedNavBar 單組件，無新增 / 搬移 / 刪除 | §8 零 props 維持 |

---

## 12. Known Risks

- **風險 R-1：** Engineer 漏改某一處 hex literal（例如 L82 Home icon 兩處 className 漏其一）→ Step 5 dist CSS declaration count 仍會 pre == post（因兩種 Tailwind 寫法編譯結果同 declaration value），grep 結果會失敗暴露。Step 9 grep 為兜底。
- **風險 R-2：** Tailwind config 某處被誤改（例如 `brick-dark` 被改色）→ Step 5 diff 會 fail。鎖定在 pipeline 中暴露。
- **風險 R-3：** `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` 在不同 Chromium 版本下 stringify 格式可能差（例如 `rgb(26 24 20 / 0.6)` vs `rgba(26, 24, 20, 0.6)`）→ Engineer 若在 Step 7 碰到 format 差異，先確認 Playwright runtime 實際 stringify 樣式再 pin；本 spec 已沿用 ticket AC L35 / L66 的寫法（Playwright 既有 codebase 慣用 rgba 寫法可驗）
- **風險 R-4：** `/business-logic` 於 hidden-route 行為依賴 `Prediction` 在 `TEXT_LINKS` 中為 `hidden: true` 而被 filter。若未來刪除 hidden key 改回 render，row #7 斷言將 fail（因 `pathname === '/business-logic'` 匹配到 Prediction.path）；但 K-025 不動 TEXT_LINKS，此為跨票風險，非本票 scope。已於 §4 備註「pre-K-025 無此斷言」揭示。

---

## Retrospective

**Where most time was spent:** §3 spec diff table 推敲「5 drop」對應 spec 實際行數（L177 / L178 / L186 / L187 / L204，共 5 regex 都在舊 describe `AC-NAV-4` 下的 3 個 tests 裡），需要同時展開 §3.2 新斷言要用幾個 test 包裝（AC cross-check 卡 5 AC `And` ≤ 5 tests）。先拉了一次 spec 的完整 line 掃描再建表，避免 test 數量與 AC 數量漂移。

**Which decisions needed revision:** 初稿考慮把 §3.2 row #5（`/` desktop 3 inactive）拆 3 個獨立 test（一 link 一 test），但 ticket AC-025-NAVBAR-SPEC `And #3` 僅要求「新增 `/` route desktop inactive 3 斷言」未要求 3 tests。拆 3 test 會造成「AC 3 條 = test 3 條」過度膨脹（violates persona 「test 數量 = AC 家族數」的對齊原則）。改為 1 test 內 3 `expect`，與 §3.2 row #5 描述一致。

**Next time improvement:** 未來 pure-refactor type ticket 在寫 §3 E2E diff 表前，先固定「spec file line 掃描」為設計文件 §2/§3 的共用 source of truth block（把 `grep -n` 結果當 appendix 引用），省去後續人肉 cross-check spec 行號位置的重工。本次 §2.1 grep 結果已作為 appendix，延伸到 §3.1 spec 舊行號時再次出現了一批新數字（L177/L178/...），未來考慮在設計文件開頭統一列「source of truth scan」一節。
