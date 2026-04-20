---
title: K-021 全站設計系統基建 — 配色 + 字型 + NavBar + Footer
type: design
ticket: K-021
owner: senior-architect
created: 2026-04-20
pencil-frames-confirmed:
  - "35VCj — About /about (K-017 v2)"
  - "4CsvQ — Homepage / (v2 Dossier)"
  - "wiDSi — Diary /diary (v2 Dossier)"
  - "VSwW9 — Business Logic /business-logic (v2 Dossier)"
pencil-frames-missing:
  - "/login（設計稿未含此頁面 frame — 見 §0 Scope Question Q1）"
---

## 0. Scope Questions 回報 PM（設計前必讀）

Architect persona 禁止自行裁定需求；以下兩項為 ticket 文字與實際 codebase / 設計稿矛盾處，需 PM 在放行 Engineer **之前**裁決。本設計文件以「PM 可能裁決方向」預設規劃，Engineer 收到前需先看 PM 回覆。

### 裁決狀態（2026-04-20 PM agent 裁決）

| Question | PM 裁決 | Pre-Verdict 矩陣分數 | 載點 |
|----------|---------|---------------------|------|
| Q1 — `/login` 路由 | **Option A — 替換為 `/business-logic`**（不新建 /login 路由） | 10/10（A vs B=1, C=4） | ticket §3 + AC-021-BODY-PAPER + AC-021-FOOTER + 設計決策表 |
| Q2 — NavBar active 色 | **Option C — 兩色並存**（`brick = #B43A2C` 給 K-023 Hero；`brick-dark = #9C4A3B` 給 NavBar active） | 10/10（C vs B=9, A=3） | ticket AC-021-NAVBAR + 設計決策表 |

Engineer 以 ticket 新版文字為準接手。設計文件以下段落仍以「Q1=A / Q2=C」為預設前提，Architect 推薦與 PM 裁決一致。

### Q1 — `/login` 路由不存在，AC 5 頁斷言覆蓋衝突

**事實：**
- Ticket AC-021-BODY-PAPER / AC-021-FOOTER 明文列 5 個路由：`/` / `/about` / `/diary` / `/app` / `/login`
- `frontend/src/main.tsx` 實際註冊 5 條路由：`/` / `/app` / `/about` / `/diary` / `/business-logic`
- `frontend/design/homepage-v2.pen` top-level frame 含 4 頁：Homepage / About / Diary / Business Logic（無 Login frame）
- codebase 全局 grep `login` → 0 match（只有 e2e spec 含 `localStorage` 邏輯的 `bl_token`，與 login 頁面無關）
- 既有 `BusinessLogicPage` 本身是 auth-gated page，掛載時若無 token 即渲染 `<PasswordForm />`（實質扮演 login 頁面角色）

**兩種可能解讀：**

| 解讀 | 含義 | 影響 |
|------|------|------|
| A | Ticket 筆誤，`/login` 應為 `/business-logic` | 5 頁 = 現有 5 條路由；本票 scope 不變，實作路徑清晰 |
| B | `/login` 為未來獨立路由，本票要求先建立空殼頁面 | 本票 scope 擴大，需新增 `frontend/src/pages/LoginPage.tsx` + main.tsx 註冊路由；但 ticket「範圍」段落未列此工作 |

**Architect 推薦解讀：A（ticket 筆誤）**。理由：
1. Ticket「範圍」§1 配色 token、§2 字型、§3 body 配色、§4 NavBar、§5 Footer 所有具體工作項都基於「現有 5 條路由」框架；若要新增 `/login` 路由會是獨立的 feat ticket（`frontend/src/pages/LoginPage.tsx` + main.tsx 註冊），但完全未提
2. ticket §3 明列「`/` / `/about` / `/diary` / `/app` / `/login`」緊接著下一句「不含 `/business-logic`」——這個「不含」本身即洩漏 ticket 作者原本認知中 `/business-logic` 被排除，但 PM 採納解讀 A 時會意識到 business-logic 其實是 auth-gated page，auth gate 狀態即為實質 login 狀態。AC-021-BODY-PAPER 要求 `/login` body 米白化，如採解讀 A，即 `/business-logic` 頁也須米白化，才能涵蓋「未登入狀態的登入表單」與「登入後的交易邏輯內容」兩個 UI 狀態
3. 設計稿 VSwW9 frame 名稱「Business Logic /business-logic (v2 Dossier)」已含 /business-logic 的米白版面設計；無 /login frame

**PM 需回答：**
- A 或 B？
- 若 A：AC-021-BODY-PAPER / AC-021-FOOTER 中 `/login` 替換為 `/business-logic`，5 頁定義 = `/` / `/app` / `/about` / `/diary` / `/business-logic`（含 /business-logic 即符合「跳過 /business-logic」字面矛盾——但 ticket §3 的「不含 `/business-logic`」原文與解讀 A 衝突，需 PM 決定：把 /business-logic 納回還是真的跳過改成 4 頁？）
- 若 B：要求 Architect 另開 scope 擴充票 K-021-B，本票先不納

**以下設計文件以「PM 採納解讀 A 且把 `/business-logic` 納回 5 頁（含 auth gate state）」為假設前提**，Q1 PM 確定之前 Engineer 不得動工。

### Q2 — NavBar active state 色碼與 ticket AC 不一致

**事實：**
- Ticket AC-021-NAVBAR：active 狀態 `text-brick` = `#B43A2C`
- Ticket 範圍 §1 配色 token：`brick` = `#B43A2C`，`brick-dark` = `#9C4A3B`
- 既有 `UnifiedNavBar.tsx` + `frontend/e2e/navbar.spec.ts` 實作 active 使用 `#9C4A3B`（brick-dark）
- K-017 Pass 2 Reviewer 反省已將色彩系統更新為 `#9C4A3B`（見 ticket `## AC-NAV-4 — Active link highlighted`）

**兩種解讀：**

| 解讀 | 含義 |
|------|------|
| A | Ticket AC 為真理，active 應改為 `#B43A2C`，既有 navbar.spec.ts active 斷言一併更新 |
| B | 既有實作為真理（K-017 已驗收通過 brick-dark），Ticket AC 筆誤，應將 AC-021-NAVBAR 中 `text-brick` 改為 `text-brick-dark` 或維持 `#9C4A3B` |

**Architect 推薦解讀：B（既有實作為真理）**。理由：設計稿 homepage-v2.pen 中 NavBar active 渲染色與 `#9C4A3B` 更一致（brick-dark 在米白底視覺對比更佳，#B43A2C 在 #F4EFE5 上偏亮過度），且既有 Playwright 斷言已落地 K-017 驗收通過。PM 改色等於回退 K-017 視覺決策。

**PM 需回答：** A 或 B？若 B，本設計文件中 NavBar active 一律採 `text-brick-dark`，`brick` token 保留但不在本票使用（留給未來高對比 accent 場景）。

**以下設計文件以解讀 B 為假設前提。**

---

## 1. 決策摘要（三項裁決 + 一致性備忘）

| 項目 | 裁決 | 章節 |
|------|------|------|
| 字型載入方式 | **追認既有 Google Fonts CDN（index.html preconnect + stylesheet link）**，不切本地 `@font-face` | §3 |
| 全站 body 配色 CSS 入口 | **Option A：`frontend/src/index.css` 全域 `body { @apply bg-paper text-ink; }`**，同步移除 4 個 Page component 的 `bg-[#0D0D0D] text-white` dark wrapper | §6 |
| Footer 放置策略 | **各頁面在 Page component 末端自行引入 `<HomeFooterBar />` / `<FooterCtaSection />`**，不新建 Layout component 插槽 | §5 |
| NavBar active state 色碼 | `#9C4A3B`（brick-dark），待 Q2 PM 裁決確認 | §4 |

---

## 2. Pencil frame 完整性稽核（persona 強制）

本節對應 `~/.claude/agents/senior-architect.md` 的 Pencil Frame Completeness Check 規則（K-017 遺漏 Homepage v2 的根因防護）。

**已 batch_get 確認 frame 清單（homepage-v2.pen）：**

| Frame ID | 名稱 | 對應路由 | 本票是否受影響 |
|----------|------|----------|---------------|
| `4CsvQ` | Homepage / (v2 Dossier) | `/` | 是（body bg / NavBar / HomeFooterBar） |
| `35VCj` | About /about (K-017 v2) | `/about` | 是（body bg 覆蓋 dark / NavBar / FooterCtaSection 維持） |
| `wiDSi` | Diary /diary (v2 Dossier) | `/diary` | 是（body bg 覆蓋 dark / NavBar；K-024 決定 Footer） |
| `VSwW9` | Business Logic /business-logic (v2 Dossier) | `/business-logic` | 是（body bg 覆蓋 dark / NavBar / HomeFooterBar）假設 Q1 解讀 A |

**AppPage (`/app`) 無對應 .pen frame：** 設計稿僅含 4 個公開展示頁，`/app` 為工具頁（predictor UI），其配色處理需依本票「全站統一 paper/ink」原則**強制套用**，不另做 frame 等設計稿驗證。Engineer 實作時須 dev server 目視 `/app` 四個操作狀態（empty / uploading / predicting / results），不得僅依賴 Playwright class-name 斷言（memory `feedback_shared_component_all_routes_visual_check.md`）。

**PM scope 對照：** ticket §3 列 5 頁（假設 Q1=A 後含 /business-logic）。4 個 .pen frame + AppPage = 5 頁，吻合。無遺漏頁面。

---

## 3. 字型載入方式裁決

### 3.1 現況查證

- `frontend/index.html` line 7–9 已含 preconnect + stylesheet `<link>` to Google Fonts，載入 IBM Plex Mono / Bodoni Moda / Newsreader / Geist Mono 四字型
- `frontend/src/components/home/HeroSection.tsx` 已 inline `style={{ fontFamily: '"Bodoni Moda", serif' }}` 等三字型使用，K-017 QA 視覺報告 PASS 代表 Google Fonts 在 production 已 serve
- `frontend/tailwind.config.js` 目前 `theme.extend` 為空 `{}`，`fontFamily` 未註冊 → 無法使用 `font-display` / `font-italic` / `font-mono` Tailwind class，Engineer 只能 inline style

### 3.2 方案對比

**方案 A：維持 Google Fonts CDN**（現況延伸）

- 實作：保留 index.html 的 `<link>`，僅新增 tailwind `fontFamily` 條目把 `font-display/italic/mono` class 綁定到 `Bodoni Moda/Newsreader/Geist Mono`
- 追加：index.html `<link>` 加 `media="print" onload="this.media='all'"` 非阻塞載入模式（optional，FOUC 最佳化）

**方案 B：切本地 `@font-face`**

- 實作：下載四個字型 woff2 檔到 `frontend/public/fonts/`，`index.css` 加 `@font-face` 區塊，index.html 移除 Google Fonts `<link>`
- 新增檔案：`public/fonts/BodoniModa-Italic.woff2`、`public/fonts/Newsreader-Italic.woff2`、`public/fonts/GeistMono-Regular.woff2` + `GeistMono-Bold.woff2` + `public/fonts/IBMPlexMono-Regular.woff2` + `IBMPlexMono-Bold.woff2`（約 6 個 woff2）

### 3.3 評分矩陣（Pre-Verdict）

| 維度 | 權重 | Option A — CDN | Option B — 本地 |
|------|------|----------------|------------------|
| 效能（首屏 load） | 20% | 7/10（CDN edge cache 熱，但 cross-origin handshake + preconnect 已優化） | 8/10（同源 HTTP/2 multiplex，但首次 load 增加 bundle body） |
| 離線可靠度 | 20% | 4/10（Google Fonts 掛掉或被牆時失效；fallback 生效 但視覺降級） | 10/10（完全可控） |
| 實作成本 | 20% | 10/10（現況即是，只加 tailwind tokens） | 4/10（下載授權合規、檔案命名、@font-face 5 個區塊、`font-display: swap`、subsetting 全自理） |
| 維護成本 | 20% | 9/10（Google 自動推新版 + subsetting） | 5/10（字型升版需手動 re-subset + 更新） |
| 隱私 GDPR | 20% | 5/10（Google Fonts CDN 向 Google 回報 IP/User-Agent；GDPR 灰色地帶，部分 EU 企業禁用） | 10/10（完全自持） |
| **加權總分** | | **7.0** | **7.4** |

### 3.4 紅隊自檢（≥3 條）

1. **「CDN 已上線 K-017 已 PASS，為何不直接 Option A？」** — Option A 效能/成本得分合理，總分落後 Option B 0.4 主因為 GDPR。本專案目標受眾是求職 portfolio（recruiter），非 EU B2B 合約客戶，GDPR 在目前用戶規模屬 over-engineering。
2. **「Option B 的 woff2 下載流量會超過 CDN？」** — 四字型 woff2 全 subset 後約 80–120 kB total，CDN 一樣是 80 kB 級；Option B 同源 HTTP/2 multiplex 與 main bundle 一起下載，實際 TTFP 可能更快。但 Firebase Hosting 單 bundle 大小目前已接近 500 kB warning line（見 ticket AC-021-REGRESSION 提及），再增 120 kB 會觸警告；需 Engineer 額外調 `vite build` chunk split，超出本票範圍。
3. **「Google Fonts 被牆情境？」** — 目標 production（Firebase Hosting + global CDN）rarely 命中此情境，開發環境（Taipei / Taiwan）不受影響。若 recruiter 在中國大陸開啟，可能字型失效 → fallback `serif`/`monospace`，視覺降級但非 crash。此風險以 Tech Debt 登記（見 §11 TD-K021-01）不阻擋本票。
4. **「index.html preconnect 已生效，為何還要指定 stylesheet link?」** — preconnect 只建立 TCP+TLS，stylesheet 還是要下載 CSS。現況寫法正確，Option A 不需動。

### 3.5 裁決宣告

**採 Option A — 維持 Google Fonts CDN。** Tailwind config 新增 `fontFamily` 映射，Engineer 本票不新增 woff2 檔、不改 index.html `<link>`。Fallback 策略：Tailwind tokens 寫 `['Bodoni Moda', 'serif']` 等含 fallback 的 array，若 Google Fonts 載入失敗則系統 serif / monospace 渲染，body 不 crash。GDPR / 牆內風險以 Tech Debt 登記，不阻擋本票。

### 3.6 既有 inline fontFamily 的遷移（tech debt 清理）

`HeroSection.tsx` 4 處 inline `style={{ fontFamily: ... }}` **建議 Engineer 本票一併改為 Tailwind class**（`font-display italic` / `font-italic` / `font-mono`）— 因 K-022 Homepage v2 改版會大量動此檔，先統一 class 慣例減少 K-022 衝突。此工作屬本票 scope（配色 token 同時套用 class），不新增 TD。

---

## 4. Tailwind config 結構（完整 before/after diff）

### 4.1 Before（現況）

檔案：`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
```

### 4.2 After（Engineer 需實作的形狀）

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4EFE5',
        ink: '#1A1814',
        brick: '#B43A2C',
        'brick-dark': '#9C4A3B',
        charcoal: '#2A2520',
        muted: '#6B5F4E',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'serif'],
        italic: ['"Newsreader"', 'serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

### 4.3 JIT 可用性驗證

- Tailwind v3.4.4（見 package.json）預設啟用 JIT；`content` glob 已涵蓋 `src/**/*.{ts,tsx}`，新 token 一旦出現在 tsx class 即被編譯
- `bg-paper` / `text-ink` / `text-brick` / `text-brick-dark` / `bg-charcoal` / `text-muted` / `font-display` / `font-italic` / `font-mono` 九個 class 將可用
- 驗證步驟（Engineer checklist）：
  1. 改 tailwind.config.js
  2. 在任一 component 試加 `<div className="bg-paper text-ink">` → dev server 熱更新看是否正確渲染
  3. `npx tsc --noEmit` exit 0
  4. `npm run build` 成功，確認 `dist/assets/index-*.css` 含 `.bg-paper{background-color:#F4EFE5}` 等規則

### 4.4 既有 hardcoded hex 的遷移策略

grep 到既有 codebase 已有多處 hardcode `#F4EFE5` / `#1A1814` / `#9C4A3B`（NavBar、HomeFooterBar、HeroSection、BuiltByAIBanner），**本票不強制 Engineer 全量遷移**（超出 scope，K-022/K-023/K-024 頁面改版時再一併處理），僅要求：

- 本票新增或改寫的檔案（主要是 `index.css`、`tailwind.config.js`、`UnifiedNavBar.tsx`、`HomeFooterBar.tsx` + 5 Page wrapper）採用新 class（`bg-paper` / `text-ink` / `text-brick-dark` / `text-muted` 等）
- 既有 inline hex 保持不動，由後續 ticket 漸進遷移（TD 登記見 §11 TD-K021-02）

---

## 5. NavBar 組件重構方案

### 5.1 既有實作現況（已 Read）

檔案：`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/src/components/UnifiedNavBar.tsx`

- **項目順序（現況）：** 左側 `⌂` icon Link / 右側 `App | About | Diary | Logic 🔒`（`Logic` 含 LockIcon）
- **配色（現況）：** `bg-[#F4EFE5]` / `border-[#1A1814]` / inactive text `text-[#1A1814]/60` / active text `text-[#9C4A3B]` / Logic purple `text-purple-500`
- **Height / padding：** `h-[56px] md:h-[72px]` / `px-6 md:px-[120px]`
- **Active 判定：** `pathname === path`（`useLocation()` hook）
- **Mobile / Desktop：** 兩 container 分別帶 `data-testid="navbar-desktop"` / `data-testid="navbar-mobile"`，用 `hidden md:flex` / `flex md:hidden` 切換

### 5.2 Ticket §4 要求（與現況差異）

| 項目 | 現況 | Ticket 要求 | 差異 |
|------|------|-------------|------|
| 項目順序 | ⌂ / App / About / Diary / Logic 🔒 | ⌂ / App / Diary / Prediction(hidden) / About | 需調：About → 最右，Diary 提前，Logic → Prediction（hidden） |
| `Logic` 命名 | `Logic` | `Prediction`（hidden） | 改字樣 |
| Prediction 連結渲染 | `Logic` 顯示（含 LockIcon，text-purple-500） | `Prediction` hidden（不渲染至 DOM） | 改 `hidden` attribute 或 conditional false |
| Active state | `text-[#9C4A3B]`（brick-dark） | `text-brick`（#B43A2C） | Q2 待 PM 裁決；本文件假設 B（維持 brick-dark） |

### 5.3 Props interface（before / after diff）

**Before：** `UnifiedNavBar` 無 props（零 props）。

**After：** `UnifiedNavBar` 維持零 props（所有邏輯由 `useLocation()` 推得），**不新增 props**。項目順序與命名由組件內 `TEXT_LINKS` 常數重排，`Prediction` 項以 `hidden: true` 標記過濾。

```ts
// 組件內部 constant（非 exported API）重新定義：
// 假設 Q2=B（active=brick-dark 維持）

const TEXT_LINKS: Array<{ label: string; path: string; hidden?: boolean }> = [
  { label: 'App', path: '/app' },
  { label: 'Diary', path: '/diary' },
  { label: 'Prediction', path: '/business-logic', hidden: true }, // K-021 隱藏
  { label: 'About', path: '/about' },
]
```

組件 render 時 `TEXT_LINKS.filter(link => !link.hidden).map(...)`，`Prediction` 連結與 LockIcon 完全不渲染至 DOM。現有 desktop/mobile 雙 container 結構維持。

### 5.4 項目順序遷移策略（逐步驟）

1. 重排 `TEXT_LINKS` 陣列：`App / Diary / Prediction(hidden) / About`
2. 刪除原 `<Link to="/business-logic">...LockIcon...</Link>` 獨立 JSX 區塊（desktop + mobile 各一處），改由 map 渲染（filter hidden 掉）
3. 刪除 `lucide-react` 的 `LockIcon` import（不再使用）
4. 維持 `HomeIcon` 為左側 Home link
5. 若 Q2=A，color class 改為 `text-[#B43A2C]`；若 Q2=B，維持 `text-[#9C4A3B]`

### 5.5 Active state 判定方式

**維持 class 比對 + 新增 `aria-current="page"` 雙機制**（之前僅 class 比對，不利 screen reader 與未來測試斷言彈性）：

```tsx
<Link
  to={link.path}
  aria-current={isActive ? 'page' : undefined}
  className={isActive ? 'text-[#9C4A3B] ...' : 'text-[#1A1814]/60 ...'}
>
```

- 既有 Playwright 斷言 `toHaveClass(/text-\[#9C4A3B\]/)` 照常通過
- 新增 `aria-current="page"` 屬性讓 AC-021-NAVBAR 的 4 個 active-state test case 可改用更穩定的 `[aria-current="page"]` selector（Engineer 本票同步新增斷言，見 §9）

### 5.6 Consumer 影響清單（grep 結果）

`UnifiedNavBar` 當前 consumer（5 處 import + 5 處 JSX 使用）：

| 檔案 | 使用行 | 本票是否動到 |
|------|--------|-------------|
| `frontend/src/pages/HomePage.tsx` | L7 import / L14 `<UnifiedNavBar />` | 否（NavBar 內部改，consumer 不動） |
| `frontend/src/pages/AboutPage.tsx` | L1 import / L15 | 否 |
| `frontend/src/pages/DiaryPage.tsx` | L5 import / L12 | 否 |
| `frontend/src/pages/BusinessLogicPage.tsx` | L6 import / L89 | 否 |
| `frontend/src/AppPage.tsx` | L9 import / L368 | 否 |

**結論：** NavBar 內部 refactor 不影響任何 consumer 的 JSX 使用方式。唯一潛在影響是 `LockIcon` 不再渲染 → e2e/navbar.spec.ts 的 AC-NAV-6「Logic link with LockIcon」test case 必失敗（必須更新 spec 或直接刪該 test group，見 §9 REGRESSION）。

### 5.7 Legacy `NavBar.tsx` 處理

檔案：`frontend/src/components/NavBar.tsx`（已標 `@deprecated`，從未被 import，5 個 link 順序還是舊版 Home/App/About/Diary/Business Logic）。

**建議本票一併刪除** `NavBar.tsx`（死檔 0 consumer，K-017 Code Reviewer 已識別為 dead file），理由：
- 刪死檔成本極低（1 行 git rm）
- 保留舊檔案反而讓新 Engineer 誤讀
- AC-021-NAVBAR 本身涉及 NavBar refactor，順手處理是常理

若 PM 不允許擴大 scope，本項可改登記為 TD（§11 TD-K021-03）留給後續。

---

## 6. 全站 body 配色 CSS 入口裁決

### 6.1 現況查證

- `frontend/index.html` body 已 `class="bg-[#F4EFE5]"` → 米白底已生效
- `frontend/src/index.css` 當前僅含 `@tailwind base; @tailwind components; @tailwind utilities;`，無 body 規則
- 4 個 Page component 內層 `<div className="min-h-screen bg-[#0D0D0D] text-white">` 覆蓋 body 為 dark（AboutPage / DiaryPage / BusinessLogicPage / AppPage 的 `h-screen bg-gray-950 text-gray-100`）
- HomePage 已 `<div className="min-h-screen bg-[#F4EFE5] text-[#1A1814]">`（米白，K-017 已完成）

### 6.2 方案對比

**Option A — `frontend/src/index.css` 全域 `body` 規則**

```css
/* index.css after */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-paper text-ink;
  }
}
```

+ 4 個 Page component（AboutPage / DiaryPage / BusinessLogicPage / AppPage）**移除** inner `<div className="min-h-screen bg-[#0D0D0D] text-white">` 包裝；改成 `<div className="min-h-screen">`（或直接 `<></>`）讓 body bg 透過。

**Option B — Layout component / Route wrapper 套 `div.bg-paper`**

新建 `frontend/src/layouts/AppLayout.tsx`：

```tsx
// pseudo
<div className="min-h-screen bg-paper text-ink">
  <UnifiedNavBar />
  <Outlet />
</div>
```

main.tsx routes 用 `<Route element={<AppLayout />}>` 嵌套，5 個 Page component 移除各自的 `<UnifiedNavBar />` 與外層 `<div>`。

**Option C — 頁面各自 `<div className="bg-paper text-ink">`**

不動 index.css 和 layout，只改 4 個 Page component 的外層 `<div>` class 從 `bg-[#0D0D0D] text-white` 改為 `bg-paper text-ink`。HomePage 已是此狀態。

### 6.3 評分矩陣（Pre-Verdict，4 維度）

| 維度 | 權重 | Option A（index.css） | Option B（Layout） | Option C（各頁） |
|------|------|----------------------|---------------------|-------------------|
| 實作成本 | 25% | 9/10（1 行 CSS + 4 page 刪 dark wrapper） | 4/10（新建 AppLayout + 改 main.tsx routes 結構 + 5 page 重構 + Outlet pattern） | 8/10（只改 4 page class） |
| 污染面（不預期影響） | 25% | 7/10（body 全局改；若未來某頁要 dark 需 inline 覆寫） | 9/10（Layout 層獨立） | 10/10（完全局部） |
| tsc / 可驗證度 | 25% | 8/10（CSS class 不過 tsc，但 Playwright body computed bg 斷言可驗） | 9/10（TS route 結構變更，tsc 全量檢查） | 9/10（class 改動 tsc + Playwright 同時驗） |
| 未來 dark-mode 回退成本 | 25% | 6/10（未來要 dark-mode 需 body `dark:bg-*` + 每頁確認不覆蓋） | 9/10（Layout 單點切換 dark/light 最簡） | 5/10（5 page 逐一改最費工） |
| **加權總分** | | **7.5** | **7.75** | **8.0** |

### 6.4 紅隊自檢（≥3 條）

1. **「Option C 得分最高為何不選？」** — Option C 得分高但違反 ticket「全站共用設計系統基建」意圖（ticket §3 標題是「全站 body 配色米白化」，若只改各頁 class，token 與實際渲染之間無 single source of truth，未來新增第 6 頁時容易漏）。Option A 的 body base 規則讓「新頁面預設米白」成為 framework 行為，對齊 token 命名精神。Option C 的污染面得分 10/10 是因為「只影響目前 4 頁」，未來擴充頁面不受保護。選型應以「token 集中管理精神」為 tiebreaker。
2. **「Option B 為何 tsc 可驗證度 9？」** — Layout component + Outlet pattern 會強制 route 結構重構，tsc 對 Outlet 的 children 推導較嚴格；但成本 4/10 已反映此複雜度。實作成本 > 效益。
3. **「Option A 的 `@layer base body` 會不會被 Tailwind preflight 覆蓋？」** — `@tailwind base` 載入 preflight 預設 `body { line-height: inherit; }` 等；`@layer base` 寫在 tailwind import 之後可正確疊加（Tailwind v3 JIT 合併策略 `base` layer 內同 selector 以最後定義為準）。Engineer 需驗證：寫完 `index.css` 後 `npm run build`，grep `dist/assets/index-*.css` 確認 body 規則含 `background-color:#F4EFE5` 出現在 preflight 之後。
4. **「AppPage 的 `h-screen overflow-hidden` flex layout 會不會壞？」** — AppPage 特殊使用 `h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden`（全螢幕 grid layout）。Option A 後需改為 `h-screen flex flex-col overflow-hidden`（維持 h-screen + flex，移 dark class）；body 層 bg-paper 會透過 AppPage 外層看到。但 AppPage 內層 `bg-gray-900/70` / `bg-gray-950/70` 等 panel 樣式與米白 body 對比刺眼。**AppPage 視覺系統需 K-022/K-023/K-024 級別的頁面級改版才能完整對齊，本票僅要求 body bg 透過但不強求 panel 重配色**（AC-021-BODY-PAPER 斷言僅驗 body computed bg，不驗 panel 子層 bg）。此限制登記為 Tech Debt TD-K021-04。

### 6.5 裁決宣告

**採 Option A — `frontend/src/index.css` 全域 `body` 規則。** 搭配 4 個 Page component 的 dark wrapper 刪除（AppPage 需保留 h-screen/flex/overflow 但移 bg/text class）。`index.html` body 的 `class="bg-[#F4EFE5]"` 可保留作 preload hint（避免 CSS parse 前的 FOUC white flash），不衝突。

### 6.6 4 個 Page component 的確切改法（pseudo diff，非 code）

| 檔案 | Before（line / class） | After |
|------|----------------------|-------|
| `AboutPage.tsx` | L14 `<div className="min-h-screen bg-[#0D0D0D] text-white">` | `<div className="min-h-screen">` |
| `DiaryPage.tsx` | L11 `<div className="min-h-screen bg-[#0D0D0D] text-white">` | `<div className="min-h-screen">` |
| `BusinessLogicPage.tsx` | L88 `<div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">` | `<div className="min-h-screen flex flex-col">` |
| `AppPage.tsx` | L367 `<div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">` | `<div className="h-screen flex flex-col overflow-hidden">`（panel 子層維持 dark gray，屬 TD-K021-04） |
| `HomePage.tsx` | L13 `<div className="min-h-screen bg-[#F4EFE5] text-[#1A1814]">` | `<div className="min-h-screen">`（可一併清理冗餘 class；body 層已管） |

---

## 7. Footer 放置策略裁決

### 7.1 現況查證

- `HomeFooterBar.tsx`（`components/home/HomeFooterBar.tsx`）：目前單一 consumer = HomePage，class `font-mono text-[11px] tracking-[1px] text-[#6B5F4E] px-[72px] py-5 border-t border-[#1A1814] w-full`
- `FooterCtaSection.tsx`（`components/about/FooterCtaSection.tsx`）：目前單一 consumer = AboutPage，含 email + GitHub + LinkedIn 三個連結 + GA tracking onClick + GA 聲明文字；**內部 class 含 `text-white` / `text-purple-400` / `text-gray-500` 等 dark-theme 遺留**（與米白頁面不協調，屬 K-017 遺留，但 K-017 已驗收通過；本票不動）
- `/app` / `/business-logic`（假設 Q1=A 納入 Footer）目前 **無 Footer**
- `/diary` 本票明文不決定（K-024 處理）

### 7.2 方案對比

**Option A — 各頁面自行 import 引入**（現況延伸）

- HomePage.tsx 維持 `<HomeFooterBar />`
- AboutPage.tsx 維持 `<FooterCtaSection />`
- AppPage.tsx 末端新增 `<HomeFooterBar />`（Q1=A 後若含 /business-logic）
- BusinessLogicPage.tsx 末端新增 `<HomeFooterBar />`
- DiaryPage.tsx 本票不動
- `HomeFooterBar.tsx` 位置維持 `components/home/`（TD-K017-01 已登記建議搬 common/，但本票不改）

**Option B — Layout component 插槽**

`AppLayout.tsx` 含一個 `footer` prop 或 conditional：依 route 決定 render `HomeFooterBar` / `FooterCtaSection` / `null`

### 7.3 評分矩陣（Pre-Verdict，3 維度）

| 維度 | 權重 | Option A（頁面各自） | Option B（Layout 插槽） |
|------|------|---------------------|--------------------------|
| 實作成本 | 34% | 9/10（各頁加一行 import + 一行 JSX） | 3/10（同 §6.2 Option B，整個 route 結構重構） |
| 變更局部性 | 33% | 10/10（只動 2 個 Page 檔案 + `HomeFooterBar.tsx` class） | 6/10（Layout + 5 Page 同時動） |
| 未來擴充（K-024 決定 /diary） | 33% | 9/10（K-024 只需改 DiaryPage.tsx 加一行） | 7/10（K-024 需修改 AppLayout 的 conditional + DiaryPage） |
| **加權總分** | | **9.33** | **5.33** |

### 7.4 紅隊自檢（≥3 條）

1. **「K-022/K-023/K-024 要統一改 Footer 時 Option A 是不是要改 N 檔？」** — 若 K-024 決定 Diary 也用 `<HomeFooterBar />`，Option A 要改 DiaryPage.tsx 一行；Option B 要改 AppLayout 的 conditional + DiaryPage。Option A 反而更乾淨（DiaryPage 的「是否 Footer」決策就近貼在 DiaryPage 檔案內）。
2. **「Option B 的 sticky footer 佈局可控性比較好？」** — Layout pattern 對 sticky footer 確實是 canonical 做法，但本票 ticket §3 並未要求 sticky（AC-021-FOOTER 只說「頁面滾動至底部 Then 顯示」，即 natural document flow bottom）。AppPage 的 `h-screen overflow-hidden` 反而 **不允許** footer 在滾動底部出現（整頁不滾），Footer 需放哪個位置待 §7.5 處理。
3. **「`HomeFooterBar.tsx` 搬到 `common/` 才能跨頁 import 嗎？」** — 不需要。TypeScript import path 無位置限制，現況就能 `import from '../components/home/HomeFooterBar'`。「共用組件該放 common/」是團隊命名慣例而非技術要求，TD-K017-01 可晚點處理。本票維持原路徑，降低 diff 干擾。

### 7.5 裁決宣告

**採 Option A — 各頁面自行 import 引入。** 具體放置：

| 路由 | 頁面檔 | Footer 組件 | 放置位置（JSX 層級） |
|------|--------|-------------|---------------------|
| `/` | `HomePage.tsx` | `<HomeFooterBar />` | 頁面 flex vertical column 最後子節點（現況） |
| `/about` | `AboutPage.tsx` | `<FooterCtaSection />` | `<SectionContainer id="footer-cta">` 內（現況維持，K-017 鎖定） |
| `/app` | `AppPage.tsx` | `<HomeFooterBar />` | **特殊：** AppPage `h-screen overflow-hidden` 不滾動，Footer 不可放 `</div>` 末端（會被 flex 壓掉）。**方案：** AppPage 現有 `flex flex-col` 最外層加 `<HomeFooterBar />` 作最後子節點，讓它出現在 viewport 最底部（需要 Engineer 把 predictor UI 的 `flex-1` 容器高度略減）。視覺上等同 sticky bottom。Engineer 實作時需 dev server 目視 `/app` 頁面 Footer 未遮蓋操作區 |
| `/diary` | `DiaryPage.tsx` | 無（本票不動，K-024 決定） | — |
| `/business-logic` | `BusinessLogicPage.tsx`（假設 Q1=A） | `<HomeFooterBar />` | 頁面 flex vertical column 最後子節點 |

### 7.6 `<HomeFooterBar />` 樣式 diff（現況 vs 本票規格）

**現況（已讀）：**

```tsx
<footer className="font-mono text-[11px] tracking-[1px] text-[#6B5F4E] px-[72px] py-5 border-t border-[#1A1814] w-full">
  <div className="flex justify-between items-center">
    <span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>
  </div>
  <p className="text-center mt-3">
    This site uses Google Analytics to collect anonymous usage data.
  </p>
</footer>
```

**Ticket AC-021-FOOTER 要求：**
- 字型 Geist Mono ✅（已 `font-mono`，配 §4 tailwind fontFamily 新 token 不變行為）
- 字級 11px ✅（已 `text-[11px]`）
- 顏色 `text-muted` = `#6B5F4E` ✅（已 `text-[#6B5F4E]`，改為 `text-muted` class 即符合 token 規範）
- border-top ✅（已 `border-t border-[#1A1814]`）

**結論：功能全符，只需 token class migration**（`text-[#6B5F4E]` → `text-muted`；`border-[#1A1814]` → `border-ink`；可選）。GA 聲明段保留。

**唯一新規格差異：** `px-[72px]` 在 mobile viewport（< 768px）過寬，會導致 mobile 內容水平擠壓。建議 Engineer 改為 `px-6 md:px-[72px]`（響應式），此為本票範圍內的小改動。

---

## 8. 5 頁視覺驗證 checklist

對應 memory `feedback_shared_component_all_routes_visual_check.md`。Engineer/Reviewer/QA 三角色按此 checklist 逐頁 dev server 目視 + Playwright 斷言。

### 8.1 每頁驗證項目

**頁 `/`（HomePage）**
- 目視：body 米白（#F4EFE5）、NavBar 米白、Hero 米白、Banner 紅字 See how、HomeFooterBar 11px muted + border-top
- Playwright selector：
  - body bg：`await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 239, 229)')`
  - body text：via `document.documentElement` computed color via `page.evaluate`
  - HomeFooterBar：`page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })`
  - NavBar active：`page.locator('[data-testid="navbar-desktop"] [aria-current="page"]')` — 在 `/` 路由下應為 Home icon 的父 Link
- Viewport：1280×800 desktop + 375×667 mobile 雙截圖

**頁 `/app`（AppPage）**
- 目視：body 米白（透過 AppPage 外層 `h-screen flex flex-col`）、NavBar 米白、predictor panel（gray-900/70 灰）與米白 body 對比醒目但不刺眼（TD-K021-04 待修）、HomeFooterBar 顯示在 viewport 底部
- Playwright selector：同 body bg + HomeFooterBar 文案 + NavBar active（App 項 `text-[#9C4A3B]`）
- Viewport：1280×800 desktop（不做 mobile 截圖，AppPage 本來就不 mobile 友好）

**頁 `/about`（AboutPage）**
- 目視：body 米白、NavBar 米白、PageHeaderSection 文字深色可讀、FooterCtaSection `text-white` 字在米白底上 **不可見** → 需連同本票一併把 FooterCtaSection 的 inline dark class 刪掉；**但 K-017 鎖定 `FooterCtaSection` 不動**。此矛盾登記為 TD-K021-05 或本票強制修（Engineer 實作時若用 `text-white` 不可見，目視會失敗）
- Playwright selector：body bg + `page.getByText("Let's talk →", { exact: true })`
- Viewport：1280×800 desktop + 375×667 mobile

**頁 `/diary`（DiaryPage）**
- 目視：body 米白、NavBar 米白、DiaryTimeline 內容深色可讀、**無 Footer**（K-017 AC-017-FOOTER 負斷言）
- Playwright selector：body bg + `page.getByText("Let's talk →")` toHaveCount(0) + `page.getByText('yichen.lee.20@gmail.com', { exact: true })` toHaveCount(0)
- Viewport：1280×800 desktop

**頁 `/business-logic`（假設 Q1=A）**
- 目視：body 米白、NavBar 米白、PasswordForm 內容（input / button）與米白 body 對比可讀、HomeFooterBar 在底部
- Playwright selector：body bg + HomeFooterBar 文案；Prediction 連結 NOT 在 NavBar DOM（toHaveCount 0）
- Viewport：1280×800 desktop + 375×667 mobile

### 8.2 目視 checklist（手動執行，Code Reviewer + QA）

```
Dev server 啟動：cd frontend && npm run dev
依序訪問：
  [ ] http://localhost:5173/        body 米白 + NavBar 米白 + footer 米白 + banner 可見
  [ ] http://localhost:5173/app     body 米白 + NavBar 米白 + footer 在底部
  [ ] http://localhost:5173/about   body 米白 + NavBar 米白 + FooterCta 米白底文字可讀
  [ ] http://localhost:5173/diary   body 米白 + NavBar 米白 + 無 footer
  [ ] http://localhost:5173/business-logic  body 米白 + NavBar 米白 + PasswordForm 可讀 + footer 在底部

每頁額外確認：
  [ ] NavBar 項目順序：⌂ / App / Diary / About（Prediction 不可見）
  [ ] 當前頁 NavBar 項 active 色（brick-dark #9C4A3B）
  [ ] 其他項 inactive 色（#1A1814/60）
  [ ] body default text 色深色（#1A1814）非白
```

---

## 9. Test 規劃章節（對應 PM 追加量化要求）

### 9.1 Playwright spec 檔名建議

| 目的 | 建議檔名 | 新檔 / 擴充 |
|------|----------|-------------|
| AC-021-BODY-PAPER（5 test case） | `frontend/e2e/sitewide-body-paper.spec.ts` | 新檔 |
| AC-021-FOOTER（5 test case） | `frontend/e2e/sitewide-footer.spec.ts` | 新檔 |
| AC-021-NAVBAR（4 active-state case + 其他）| 擴充 `frontend/e2e/navbar.spec.ts` | 擴充（既有檔） |
| AC-021-TOKEN | 與 BODY-PAPER 合併，smoke test bg-paper 等 class render 正確 | 合併 `sitewide-body-paper.spec.ts` |
| AC-021-FONTS | `frontend/e2e/sitewide-fonts.spec.ts`（2 斷言：任頁 font-display / font-mono computed fontFamily 含 "Bodoni Moda" / "Geist Mono"） | 新檔 |
| AC-021-REGRESSION | 跑既有整 suite + 視覺報告 | 不新增 spec |

### 9.2 AC-021-BODY-PAPER — 5 獨立 test case 骨架

檔案：`frontend/e2e/sitewide-body-paper.spec.ts`

```ts
import { test, expect } from '@playwright/test'

// Mock 所有 /api/* 避免後端依賴（沿用 pages.spec.ts 的 mockApis helper）
async function mockApis(page) { /* 同 navbar.spec.ts */ }

test.describe('AC-021-BODY-PAPER — body paper bg on 5 routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  const routes = [
    { path: '/',                name: 'HomePage' },
    { path: '/about',           name: 'AboutPage' },
    { path: '/diary',           name: 'DiaryPage' },
    { path: '/app',             name: 'AppPage' },
    { path: '/business-logic',  name: 'BusinessLogicPage' }, // 假設 Q1=A
  ]

  for (const { path, name } of routes) {
    test(`${name} (${path}) — body bg=#F4EFE5 + text=#1A1814`, async ({ page }) => {
      await mockApis(page)
      await page.goto(path)
      // 等 render 完成
      await page.waitForLoadState('networkidle')

      // body computed background
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 239, 229)')

      // body computed text color（via document.documentElement 或 body computed style）
      const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color)
      expect(bodyColor).toBe('rgb(26, 24, 20)')
    })
  }
})
```

**注意事項：**
- 每個 route 獨立 test case（非 parametrize 內合併），符合 PM 「5 個獨立 test case」要求
- `page.waitForLoadState('networkidle')` 確保 CSS 完全 apply（Tailwind base layer body 規則）
- `toHaveCSS('color', ...)` 對 body 可能回傳 inherit；改用 `page.evaluate` 讀 `getComputedStyle(document.body).color` 更可靠

### 9.3 AC-021-FOOTER — 5 獨立 test case 骨架

檔案：`frontend/e2e/sitewide-footer.spec.ts`

```ts
test.describe('AC-021-FOOTER — footer per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  // 以下 3 頁驗 <HomeFooterBar />
  for (const path of ['/', '/app', '/business-logic']) {
    test(`${path} — HomeFooterBar present with 11px muted + border-top`, async ({ page }) => {
      await mockApis(page)
      await page.goto(path)
      const footerText = page.getByText(
        'yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn',
        { exact: true }
      )
      await expect(footerText).toBeVisible()

      // 字級 11px
      const fs = await footerText.evaluate(el => getComputedStyle(el).fontSize)
      expect(fs).toBe('11px')

      // 顏色 muted
      const color = await footerText.evaluate(el => getComputedStyle(el).color)
      expect(color).toBe('rgb(107, 95, 78)')
    })
  }

  // /about 驗 <FooterCtaSection /> 存在 + <HomeFooterBar /> 不存在
  test('/about — FooterCtaSection present, HomeFooterBar absent', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
    await expect(
      page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })
    ).toHaveCount(0)
  })

  // /diary 不強制（K-024 決定）— 本票不寫斷言；K-017 AC-017-FOOTER 已有負斷言（pages.spec.ts 內），不重複
})
```

### 9.4 AC-021-NAVBAR — 4 獨立 active-state test case 骨架

**擴充** `frontend/e2e/navbar.spec.ts`（既有檔已有 AC-NAV-4 active 斷言，本票新增 4 個顯式 per-route active case）：

```ts
test.describe('AC-021-NAVBAR — active state per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('on / — Home icon active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    // aria-current=page 用於 Home icon link
    const homeLink = page.getByRole('link', { name: 'Home', exact: true })
    await expect(homeLink).toHaveAttribute('aria-current', 'page')
  })

  test('on /app — App link active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    const nav = page.locator('[data-testid="navbar-desktop"]')
    const appLink = nav.getByRole('link', { name: 'App', exact: true })
    await expect(appLink).toHaveAttribute('aria-current', 'page')
    await expect(appLink).toHaveClass(/text-brick-dark|text-\[#9C4A3B\]/)
  })

  test('on /diary — Diary link active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    const nav = page.locator('[data-testid="navbar-desktop"]')
    const diaryLink = nav.getByRole('link', { name: 'Diary', exact: true })
    await expect(diaryLink).toHaveAttribute('aria-current', 'page')
  })

  test('on /about — About link active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    const nav = page.locator('[data-testid="navbar-desktop"]')
    const aboutLink = nav.getByRole('link', { name: 'About', exact: true })
    await expect(aboutLink).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('AC-021-NAVBAR — Prediction hidden', () => {
  test('Prediction link not rendered in DOM', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)
  })
})
```

### 9.5 REGRESSION — 既有 spec 需更新 / 確認

| 既有 spec | 狀態 | 本票需動 |
|-----------|------|----------|
| `e2e/navbar.spec.ts` AC-NAV-1 (Desktop 5 pages home icon+links) | 斷言 `Logic` link → 現況 `nav.getByRole('link', { name: /Logic/ })` → Prediction hidden 後 0 match | **需改**：刪 Logic link 斷言，改為 `expect Prediction link toHaveCount(0)` |
| `e2e/navbar.spec.ts` AC-NAV-2 (Mobile 5 pages) | 同上 | 同上 |
| `e2e/navbar.spec.ts` AC-NAV-4 (Logic link → /business-logic navigate) | Prediction hidden 後無此連結可 click | **需刪**：刪此 test |
| `e2e/navbar.spec.ts` AC-NAV-6 (Logic link LockIcon) | Prediction hidden 後 LockIcon 不渲染 | **需刪** AC-NAV-6 全段 |
| `e2e/navbar.spec.ts` AC-NAV-4 active-state test | 現用 `toHaveClass(/text-\[#9C4A3B\]/)` | **維持**（Q2=B）；若 Q2=A 需改 regex |
| `e2e/pages.spec.ts` AC-ABOUT-1 PageHeader | 不依賴 bg class，文字斷言 | 不改 |
| `e2e/pages.spec.ts` AC-ABOUT-1 Footer CTA | `Let's talk →` 文字 | 不改 |
| `e2e/about.spec.ts` 全檔 | K-017 主要 spec | 不改（AC-017 鎖定） |
| `e2e/ga-tracking.spec.ts` | K-018 | 不改 |
| `e2e/ma99-chart.spec.ts` | K-009 | 不改 |
| `e2e/business-logic.spec.ts` | 原 AuthState spec | 若 body 從 dark 改米白，內部 assertion 可能 break — Engineer 跑完後看 |

**REGRESSION gate：**
1. `npx tsc --noEmit` exit 0
2. `npm run build` 成功（無新增 > 500 kB chunk warning，對應 AC-021-REGRESSION）
3. 整 Playwright suite `npm run test:e2e` chromium project 全綠（除可能預期刪除 / 更新的 AC-NAV-6 區塊）
4. visual-report：`TICKET_ID=K-021 npx playwright test visual-report.ts` 產出 `docs/reports/K-021-visual-report.html`

---

## 10. Engineer 實作順序建議

分 6 階段，每階段為一個 stable checkpoint（對應 engineer.md 紀律），每階段交付後跑 §9 對應驗證。

### Stage 1 — Tailwind token + fontFamily 註冊

**交付單位：** `frontend/tailwind.config.js` 新增 extend（§4.2）
**驗證：** `npx tsc --noEmit` exit 0 + `npm run build` 成功 + dev server 熱更新 + 手動在任一 component 試 `<div className="bg-paper text-ink">` 確認渲染正確
**對應 AC：** AC-021-TOKEN

### Stage 2 — `index.css` body base 規則 + 4 Page dark wrapper 移除

**交付單位：** `frontend/src/index.css` 加 `@layer base body`；AboutPage / DiaryPage / BusinessLogicPage / AppPage 四個檔外層 `<div>` 移除 dark bg/text class（§6.6）
**驗證：** dev server 目視 5 頁（按 §8.2 checklist）+ Playwright `sitewide-body-paper.spec.ts` 跑過
**對應 AC：** AC-021-BODY-PAPER
**建議 spec：** `frontend/e2e/sitewide-body-paper.spec.ts`（新檔，§9.2）

### Stage 3 — UnifiedNavBar 重構

**交付單位：** `components/UnifiedNavBar.tsx` 重排 `TEXT_LINKS` + Prediction hidden + aria-current + 刪 LockIcon import + 刪 legacy `NavBar.tsx`（若 PM 允許）
**驗證：** dev server 目視 5 頁 NavBar 項目順序 + active state + Prediction 不在 DOM + 刪既有 navbar.spec.ts 不相關 test（AC-NAV-6 Logic LockIcon）
**對應 AC：** AC-021-NAVBAR
**建議 spec：** 擴充 `frontend/e2e/navbar.spec.ts`（§9.4 AC-021-NAVBAR + Prediction hidden），刪 AC-NAV-6 block + AC-NAV-4 Logic navigate test

### Stage 4 — Footer 放置（`/app` / `/business-logic` 加 `<HomeFooterBar />`）

**交付單位：** AppPage.tsx + BusinessLogicPage.tsx（假設 Q1=A）末端加 `<HomeFooterBar />`；`HomeFooterBar.tsx` 小改 `px-6 md:px-[72px]` 響應式 padding
**驗證：** dev server 目視 5 頁 Footer（§8.1）+ Playwright `sitewide-footer.spec.ts` 跑過
**對應 AC：** AC-021-FOOTER
**建議 spec：** `frontend/e2e/sitewide-footer.spec.ts`（新檔，§9.3）

### Stage 5 — 字型 Tailwind class 遷移（可選，次要 cleanup）

**交付單位：** `HeroSection.tsx` 4 處 inline `style={{ fontFamily: ... }}` 改為 `font-display italic` / `font-italic` / `font-mono` class
**驗證：** dev server 目視 Hero 字型不變 + Playwright `sitewide-fonts.spec.ts` 跑過
**對應 AC：** AC-021-FONTS
**建議 spec：** `frontend/e2e/sitewide-fonts.spec.ts`（新檔，§9.1）

### Stage 6 — Full regression + visual report

**交付單位：** 跑整 suite + 產 visual-report + 手動 §8.2 checklist 目視 5 頁
**驗證：** `npx tsc --noEmit` + `npm run build` + `npm run test:e2e` + `TICKET_ID=K-021 npx playwright test visual-report.ts`
**對應 AC：** AC-021-REGRESSION

---

## 11. Tech Debt / 風險登記

| ID | 描述 | 優先級 | 預定處理 |
|----|------|--------|----------|
| TD-K021-01 | Google Fonts CDN 在 GFW 牆內環境載入失敗，fallback serif/monospace 視覺降級 | low | 目前 portfolio 情境不影響；若將來 target 中國市場再評估切本地 |
| TD-K021-02 | 既有 codebase 多處 hardcode hex（`#F4EFE5` / `#1A1814` / `#9C4A3B`）未遷移至 token class | medium | K-022 / K-023 / K-024 頁面改版時順手遷移；本票不強制 |
| TD-K021-03 | Legacy `components/NavBar.tsx`（@deprecated 死檔） | low | 若 PM 不允許本票刪，獨立 cleanup ticket；推薦本票順手刪 |
| TD-K021-04 | `/app` AppPage 內層 panel 使用 `bg-gray-900/70` 系 dark 樣式，與 body 米白對比刺眼 | medium | `/app` 需頁面級重配色（K-022 / K-023 / K-024 未含 /app，建議另開 K-025 AppPage redesign） |
| TD-K021-05 | `/about` FooterCtaSection 內用 `text-white` / `text-gray-500` dark 遺留，米白 body 下文字不可見 | **high** | K-017 鎖定不動，但與 K-021 body 米白化視覺衝突；PM 需裁決：本票一併修還是另開 ticket。若不修，Stage 2 dev server 目視 /about 會直接看到「Let's talk →」白字看不見 |
| TD-K021-06 | Q1 解讀 A 仍未解決 /login 語意矛盾（ticket §3 明文「不含 /business-logic」） | **blocker** | PM 必回覆 Q1 + Q2 才能 Engineer 動工 |

**Tech Debt 建議：** 以上 6 項待 PM 在本設計文件批准時逐條裁決（此刻 fix / 本票不修登記 / 延後開獨立 ticket），此裁決寫回本設計文件 §11 表格 `預定處理` 欄。

---

## 12. 共用組件邊界（persona 強制）

對應 memory `feedback_architect_shared_components.md`。

### 12.1 本票影響共用組件

| 組件 | 檔案 | Consumer | 本票改動 | Props interface |
|------|------|----------|----------|-----------------|
| `<UnifiedNavBar />` | `components/UnifiedNavBar.tsx` | HomePage / AboutPage / DiaryPage / BusinessLogicPage / AppPage | TEXT_LINKS 重排 + Prediction hidden + aria-current + 刪 LockIcon | **零 props**（before/after 相同，見 §5.3） |
| `<HomeFooterBar />` | `components/home/HomeFooterBar.tsx` | HomePage（現況）+ AppPage（新增）+ BusinessLogicPage（新增，假設 Q1=A） | 擴增 consumer + `px-6 md:px-[72px]` 響應式 padding | **零 props**（無改動） |
| `<FooterCtaSection />` | `components/about/FooterCtaSection.tsx` | AboutPage | **本票鎖定不動**（K-017 決定） | **零 props** |

### 12.2 頁面專屬改動（非共用）

| 頁面組件 | 本票改動 |
|---------|---------|
| `HomePage.tsx` | 外層 `<div>` class 清理（body 管 bg/text，HomePage 僅留 `min-h-screen`） |
| `AboutPage.tsx` | 外層 `<div>` class 移除 dark wrapper |
| `DiaryPage.tsx` | 外層 `<div>` class 移除 dark wrapper |
| `BusinessLogicPage.tsx` | 外層 `<div>` class 移除 dark wrapper + 末端新增 `<HomeFooterBar />` |
| `AppPage.tsx` | 外層 `<div>` class 移除 dark wrapper（保留 h-screen/flex/overflow）+ 末端新增 `<HomeFooterBar />` |
| `HeroSection.tsx` | 4 處 inline `style={{ fontFamily }}` → Tailwind class（可選，Stage 5） |

### 12.3 CSS / 配置層改動

| 檔案 | 改動 |
|------|------|
| `frontend/tailwind.config.js` | `theme.extend.colors` + `theme.extend.fontFamily` |
| `frontend/src/index.css` | `@layer base body { @apply bg-paper text-ink; }` |

**不改動：** `frontend/index.html`（preconnect + Google Fonts `<link>` 維持）、`frontend/vite.config.ts`、`frontend/playwright.config.ts`、`frontend/package.json`

---

## 13. Architect → Engineer 交付前檢查清單

對應 Architect persona「Pencil Frame Completeness Check」+「Cross-Page Duplicate Audit」+「Triage 無需 Architecture 時的 Drift 檢查」。

- [x] Pencil frame 完整性稽核（§2）— 4 frame 確認，無遺漏
- [x] Cross-page duplicate audit（§13.1）— 下方
- [x] architecture.md 同步（§14）— 下方待 Write
- [x] 設計文件末 `## Retrospective` 段（§15）— 下方待 Write
- [ ] PM 回覆 Q1 + Q2（§0）— **BLOCKER，未完成不得交付 Engineer**
- [ ] Per-project retrospective log（§15.2）— 下方寫入 architect.md

### 13.1 Cross-Page Duplicate Audit（強制）

本票有新加組件/section：Prediction 隱藏項、Footer 放置 2 頁。對本票 scope 內「新增組件」grep 既有 codebase：

```
# 已 grep
grep -rn "HomeFooterBar" frontend/src/        → HomePage + home/HomeFooterBar.tsx（1 consumer）
grep -rn "FooterCtaSection" frontend/src/    → AboutPage + about/FooterCtaSection.tsx（1 consumer）
grep -rn "UnifiedNavBar" frontend/src/       → 5 Page consumers（正確共用）
```

**無重複 pattern，無需抽新 primitive。** 本票純屬現有組件的 consumer 擴增 + 配色系統基建，無新組件。

---

## 14. architecture.md 同步（本設計文件產出後 Edit）

本票結構變更：
- Tailwind config 新增 `colors` + `fontFamily` token（配色與字型 API 現在是全站約定）
- body 配色 CSS 入口改 `index.css` `@layer base`
- `HomeFooterBar.tsx` consumer 從 1 增至 3
- legacy `NavBar.tsx` 可能刪（待 PM 決）

**Architect 已規劃更新 architecture.md 四處：**

1. `## Directory Structure` 段：`frontend/src/components/NavBar.tsx` 標註 `(to be removed K-021)` 或直接刪（待 PM）
2. **新增 `## Design System (K-021)` 段**，定義 paper / ink / brick / brick-dark / charcoal / muted 6 色 token + 3 字型 token + body base 規則
3. `## Frontend Routing` 段 NavBar 描述更新：「左側 ⌂ / 右側 App / Diary / About（Prediction hidden）」+ active 用 aria-current
4. `## Changelog` append 一筆 `2026-04-20 (Architect, K-021 設計) — ...`

實際 Edit 操作見本文件寫入完成後的 architecture.md 更新動作。

---

## 15. Retrospective

### 15.1 本次設計 Retrospective（Architect）

**做得好：**
- 在設計前就用 `grep Login` + `grep /login` + batch_get .pen frame 清單雙驗證 `/login` 路由不存在，於 §0 Scope Questions 回報 PM 而非自行裁定，避免 Architect 做需求決策
- 用 `git status / codebase read` 確認 Google Fonts CDN 已在 index.html 存在，避免重新走「CDN vs 本地 @font-face」全新評估（此資訊在 ticket 未明寫，Ticket 作者可能以為字型全新引入）
- 逐項 Pre-Verdict 評分 + 紅隊 ≥3 條：字型載入 / body CSS 入口 / Footer 放置 三項都走了完整裁決程序
- Tech Debt 清單（§11）辨識出 TD-K021-05（FooterCtaSection dark 遺留）為 high priority blocker，避免 Engineer dev server 目視時被 `/about` Let's talk 白字看不見嚇到

**沒做好：**
- 未在設計一開始立即 ScheduleWakeup 或主動停下回報 PM Q1/Q2 後再繼續，而是用「假設解讀 A/B」貫穿文件——若 PM 最終裁決與假設不同，§5/§6/§9 大段要回頭重寫。根因：Architect persona 禁止決策但未明文要求「遇 scope question 必 pause 等 PM」，我自行選擇「先產完整框架讓 PM 一次看 + 一次裁決」，但這違背「不做需求決策」的邊界模糊處（即「哪些條款假設也算隱性決策」）
- §6 Option A vs C 評分矩陣 Option C 總分最高（8.0 > 7.5），但最終選 A——用「token 精神」tiebreaker 選項，此 tiebreaker 並未預先寫在評分維度內。理論上應該把「token 集中管理度」加入評分 5 維度，而非事後用 tiebreaker 覆寫總分

**下次改善：**
1. **Architect 遇到 scope question（如 Q1/Q2 這類 ticket 與 codebase 矛盾）必須立即 ScheduleWakeup 停止 + 回報 PM，不貫穿整份設計文件用「假設」推進**——此條 rule 寫入本 persona 作為硬步驟（見 §15.3 persona edit）
2. **Pre-Verdict 評分矩陣必須預先列滿所有 tiebreaker 維度**，不得事後用「精神」/「意圖」覆寫總分。若某維度難以量化（如 token 集中管理度），至少命名該維度並給 1–10 分，接受「整體加權可能偏差」而非「隱藏 tiebreaker」——此條亦寫入 persona

### 15.2 per-project retrospective log

寫入 `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/retrospectives/architect.md` 最上方一筆，見檔案內容。

### 15.3 Persona 落地

本設計文件的「下次改善」第 1 點（Architect 遇 scope question 必停）將 Edit 進 `~/.claude/agents/senior-architect.md`，作為硬步驟加入新的章節「Scope Question Pause Rule」。

---

## 附錄 A — 檔案異動清單（Engineer 交付）

### 新增

- `frontend/e2e/sitewide-body-paper.spec.ts`
- `frontend/e2e/sitewide-footer.spec.ts`
- `frontend/e2e/sitewide-fonts.spec.ts`

### 修改

- `frontend/tailwind.config.js`（§4.2）
- `frontend/src/index.css`（§6.2 Option A）
- `frontend/src/components/UnifiedNavBar.tsx`（§5）
- `frontend/src/components/home/HomeFooterBar.tsx`（響應式 padding + 可選 token class 遷移）
- `frontend/src/pages/AboutPage.tsx`（外層 div class）
- `frontend/src/pages/DiaryPage.tsx`（外層 div class）
- `frontend/src/pages/BusinessLogicPage.tsx`（外層 div class + 末端 `<HomeFooterBar />`）
- `frontend/src/pages/HomePage.tsx`（外層 div class 清理，可選）
- `frontend/src/AppPage.tsx`（外層 div class + 末端 `<HomeFooterBar />`）
- `frontend/src/components/home/HeroSection.tsx`（Stage 5，可選）
- `frontend/e2e/navbar.spec.ts`（§9.5 更新 / 刪除 test groups；§9.4 新增 active-state 4 test + Prediction hidden）

### 刪除（PM 裁決）

- `frontend/src/components/NavBar.tsx`（legacy dead code，K-017 Reviewer 已識別）
  - 若 PM 不允許擴 scope → 改登記 TD-K021-03 保留

### 文件同步

- `ClaudeCodeProject/K-Line-Prediction/agent-context/architecture.md`（§14）
- `ClaudeCodeProject/K-Line-Prediction/docs/retrospectives/architect.md`（§15.2）
- `~/.claude/agents/senior-architect.md`（§15.3）

---

**Architect 本設計文件完成，等 PM 回覆 Q1 + Q2 + §11 Tech Debt 裁決後放行 Engineer。**
