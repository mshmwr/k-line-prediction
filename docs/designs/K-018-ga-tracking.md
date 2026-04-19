---
title: K-018 GA4 Tracking — 系統設計
ticket: K-018
type: design
status: approved
author: senior-architect
created: 2026-04-19
---

## 1. 技術選型：`react-ga4` vs 手刻 `gtag.js`

### 選項比較

| 面向 | `react-ga4` | 手刻 `gtag.js` |
|------|-------------|----------------|
| 安裝成本 | `npm i react-ga4`（~5 KB gzip） | 無新套件 |
| API 熟悉度 | `ReactGA.initialize()` / `ReactGA.send()` | 直接呼叫 `window.gtag()` |
| pageview 追蹤 | 提供 `usePageViews()` hook 但需在 BrowserRouter 內呼叫，仍需自建 `useEffect` | 同樣需要 `useEffect` + `useLocation` |
| SPA 路由切換支援 | 需手動接 `useLocation` 才能偵測路由切換，非自動 | 同樣需手動接 |
| TypeScript 支援 | 完整（package 附 types） | 需自宣告 `window.gtag` type |
| Playwright spy 難度 | 底層仍推 `window.dataLayer`，spy 方式一致 | 直接 spy `window.dataLayer` |
| 維護狀況 | 社群維護（GitHub 1.1k stars，2024 仍有 commit） | GA4 官方 API，Google 長期維護 |
| 套件額外依賴 | 無 | 無 |

### 推薦：**手刻 `gtag.js`**

**理由：** `react-ga4` 的主要賣點（`usePageViews()`）在實際使用時仍需 `useLocation` 才能抓 SPA 路由切換，並無節省工作量；反而引入一個第三方套件做的事我們完全能手刻，且 `window.gtag()` 是 Google 官方長期穩定的 API。本專案 GA4 需求簡單（1 pageview hook + 4 click events），手刻避免套件版本鎖定與 peer dependency 風險。`react-ga4` 當前（2025/2026）維護頻率已降低，選官方 API 更有保障。

---

## 2. 安裝策略

### 2.1 Script Tag 注入方式

**選用：JS 動態注入（不在 `index.html` hardcode）**

**理由：** AC-018-INSTALL 要求「若 `VITE_GA_MEASUREMENT_ID` 未設定，snippet 不被注入」。`index.html` 靜態 script tag 無法在 build time 根據 env var 動態省略（Vite 的 `index.html` env var 注入不支援條件存在）。JS 動態注入可以在程式碼層面做 `if (!measurementId) return` 的 guard，完全符合 AC。

**不選 `index.html` 靜態 script tag 的原因：** 若在 `index.html` 寫 `<script src="https://www.googletagmanager.com/gtag/js?id=%VITE_GA_MEASUREMENT_ID%">`，Vite 會在 build 時替換 `%VITE_GA_MEASUREMENT_ID%`，但若變數未設定則 src 變成 `?id=undefined`，仍會發出 network request，違反 AC。

### 2.2 Env Var 注入方式

透過 Vite 的 `import.meta.env.VITE_GA_MEASUREMENT_ID` 讀取（Vite 自動 expose 所有 `VITE_` 前綴變數到客戶端 bundle）。

**格式：** `G-XXXXXXXXXX`（GA4 測量 ID 標準格式）

**設定位置：**
- 本機開發：`frontend/.env.local`（不 commit，加入 `.gitignore`）
- Firebase Hosting / CI：透過 hosting deploy 前的 `firebase deploy --only hosting`（Vite build 前設定 env var）或 GitHub Actions secret

### 2.3 動態注入實作位置

新建 `frontend/src/utils/analytics.ts`，提供：

```typescript
// 初始化函式（在 main.tsx 或根組件呼叫一次）
export function initGA(): void

// pageview 追蹤（供 useGAPageview hook 使用）
export function trackPageview(path: string, title: string): void

// click event 追蹤（供各 CTA 組件使用）
export function trackCtaClick(label: string): void
```

`initGA()` 內部邏輯：
1. 讀 `import.meta.env.VITE_GA_MEASUREMENT_ID`
2. 若空字串/undefined → return（不注入）
3. 動態建立 `<script>` tag，src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`，async = true，append 到 `document.head`
4. 初始化 `window.dataLayer = window.dataLayer || []`
5. 定義 `window.gtag = function() { dataLayer.push(arguments) }`
6. 呼叫 `gtag('js', new Date())` 與 `gtag('config', measurementId, { send_page_view: false })`（關閉自動 pageview，改由 `useGAPageview` hook 手動觸發，確保 SPA 路由切換時正確發送）

**TypeScript Window 型別擴充（在 `analytics.ts` 頂部）：**
```typescript
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}
```

---

## 3. Pageview 追蹤

### 3.1 Hook 設計

新建 `frontend/src/hooks/useGAPageview.ts`：

```typescript
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../utils/analytics'

const PAGE_TITLES: Record<string, string> = {
  '/': 'K-Line Prediction — Home',
  '/app': 'K-Line Prediction — App',
  '/about': 'K-Line Prediction — About',
  '/diary': 'K-Line Prediction — Dev Diary',
  '/business-logic': 'K-Line Prediction — Business Logic',
}

export function useGAPageview(): void {
  const location = useLocation()
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? document.title
    trackPageview(location.pathname, title)
  }, [location.pathname])
}
```

### 3.2 掛載位置

**掛在 `main.tsx` 中的 Layout wrapper 組件，而非分散在各 Page 組件。**

具體做法：在 `main.tsx` 的 `<BrowserRouter>` 內新建 `<GATracker />` 組件（純 hook，無 render），在組件內呼叫 `useGAPageview()`，放在 `<Routes>` 的同層：

```tsx
// main.tsx（修改）
function GATracker() {
  useGAPageview()
  return null
}

// 在 BrowserRouter 內：
<BrowserRouter>
  <GATracker />
  <Routes>
    ...
  </Routes>
</BrowserRouter>
```

**為什麼不掛在各 Page 組件？**
- 避免各 Page 重複呼叫 hook 邏輯
- 新增路由時不需記得加 hook
- `GATracker` 在 Router context 內，可以正確使用 `useLocation()`

**為什麼不掛在 `App.tsx`？**
- 本專案無 `App.tsx`（入口直接是 `main.tsx` 的 BrowserRouter + Routes）。`GATracker` 放在 `main.tsx` 最清晰。

**`initGA()` 呼叫時機：** 在 `main.tsx` 最上方（BrowserRouter 外），`ReactDOM.createRoot(...).render(...)` 前呼叫一次。

---

## 4. Click Event 追蹤

### 4.1 Event Spec

所有 CTA click event 統一 name = `cta_click`，附帶：
- `label`：識別觸發來源的字串（見下表）
- `page_location`：當前 `window.location.pathname`

`trackCtaClick(label: string)` 實作：
```typescript
export function trackCtaClick(label: string): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'cta_click', {
    label,
    page_location: window.location.pathname,
  })
}
```

### 4.2 各 CTA 改動位置

| CTA | label | 修改組件 | 改動方式 |
|-----|-------|----------|---------|
| Email link | `"contact_email"` | `FooterCtaSection.tsx` | `<a>` 加 `onClick={() => trackCtaClick('contact_email')}` |
| GitHub link | `"github_link"` | `FooterCtaSection.tsx` | `<ExternalLink>` 加 `onClick={() => trackCtaClick('github_link')}` |
| LinkedIn link | `"linkedin_link"` | `FooterCtaSection.tsx` | `<ExternalLink>` 加 `onClick={() => trackCtaClick('linkedin_link')}` |
| BuiltByAIBanner | `"banner_about"` | `BuiltByAIBanner.tsx`（新建） | 整個 banner 包 `onClick` handler |

**注意：** `ExternalLink` primitive（`frontend/src/components/primitives/ExternalLink.tsx`）目前**不接受 `onClick` prop**。有兩個選項：

- **Option A（推薦）：** 在 `FooterCtaSection.tsx` 中不使用 `ExternalLink` 包裝，改用 `<a target="_blank" rel="noopener noreferrer">` 直接寫，加 `onClick` handler。避免修改 `ExternalLink` primitive（其他使用者不受影響）。
- **Option B：** 在 `ExternalLink.tsx` 加 `onClick?: React.MouseEventHandler<HTMLAnchorElement>` prop 並 pass-through。

**推薦 Option A**，理由：`ExternalLink` 是 primitive，加 `onClick` prop 會讓它承擔業務邏輯（GA tracking），違反「primitive 只管 rel/target」的設計原則（K-017 設計決策）。`FooterCtaSection` 直接使用原生 `<a>` 更 surgical。

### 4.3 Props Interface

**不抽共用 hook**（僅 4 個 CTA，邏輯簡單，抽 hook 反增複雜度）。每個組件直接 import `trackCtaClick` 呼叫。

### 4.4 BuiltByAIBanner 組件（新建）

Architecture.md 記錄 `home/BuiltByAIBanner.tsx` 應存在，但目前**實際上不存在**（`frontend/src/components/home/` 目錄下無此檔）。`HomePage.tsx` 也尚未渲染 banner。

**K-018 範圍：** 建立 `frontend/src/components/home/BuiltByAIBanner.tsx`，並在 `HomePage.tsx` 加入渲染（NavBar 之後、HeroSection 之前的 thin banner）。Banner 點擊導向 `/about`（React Router `<Link>`），點擊時觸發 `trackCtaClick('banner_about')`。

Banner 設計參考 `BuiltByAIShowcaseSection.tsx` 內的 mockup（S7 section 已有完整 mockup，Engineer 直接照搬樣式）。

---

## 5. Footer 文字（AC-018-PRIVACY-POLICY）

### 5.1 加入位置

在 `FooterCtaSection.tsx` 最底部新增一行文字。

### 5.2 文案

```
This site uses Google Analytics to collect anonymous usage data.
```

### 5.3 樣式

參考現有 footer 文字樣式，使用 `text-gray-500 text-xs font-mono text-center mt-4`。不需要連結、不需要 Cookie banner。

**Playwright 斷言**：`expect(page.locator('footer')).toContainText('Google Analytics')` 或等效（頁面無 `<footer>` 標籤時，改用 FooterCtaSection 外層容器的 role/label）。

---

## 6. Playwright 驗證策略

### 6.1 核心原則

**不打真實 GA4 網路請求。** 在每個 E2E test 的 setup phase，spy `window.dataLayer`。

### 6.2 Spy 機制

`window.dataLayer` 是 GA4 的通用訊息匯流排，`gtag()` 本質上是 `dataLayer.push`，所有 event（pageview、custom event）都會進入 `dataLayer`。

```typescript
// 在 test setup 中
await page.addInitScript(() => {
  window.dataLayer = window.dataLayer || []
  // 覆寫 gtag function，確保 dataLayer 可被 spy
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args)
  }
})
```

`addInitScript` 在頁面 JS 執行前注入，確保 `initGA()` 呼叫 `window.gtag` 時我們的版本已就位。

### 6.3 各 AC 的 Playwright 斷言策略

**AC-018-INSTALL：**
```typescript
await page.goto('/')
// 驗 script tag 存在（不需 env var 真實值，Playwright 的 dev server 設 VITE_GA_MEASUREMENT_ID=G-TEST）
await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1)
```
或（若 E2E 環境不設 GA env var）：
```typescript
// 驗 initGA() guard 正確 — head 內無 gtag script
await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0)
```
**決策：** E2E 環境設定一個假測量 ID `G-TESTID0000`（`.env.test` 或 playwright.config.ts 的 `webServer.env`），讓 snippet 被注入，才能驗 AC-018-INSTALL + AC-018-PAGEVIEW + AC-018-CLICK。GA4 server 收不到真實 hit（假 ID 無效），對測試無影響。

**AC-018-PAGEVIEW：**
```typescript
const dataLayer = await page.evaluate(() => window.dataLayer)
// 找 page_view event
const pageviewEntry = dataLayer.find(
  entry => Array.isArray(entry) && entry[0] === 'event' && entry[1] === 'page_view'
)
expect(pageviewEntry).toBeDefined()
expect(pageviewEntry[2]).toMatchObject({ page_location: '/about' })
```

**AC-018-CLICK：**
```typescript
await page.locator('[data-testid="cta-email"]').click()
const dataLayer = await page.evaluate(() => window.dataLayer)
const clickEntry = dataLayer.find(
  entry => Array.isArray(entry) && entry[1] === 'cta_click'
)
expect(clickEntry[2]).toMatchObject({ label: 'contact_email' })
```

**AC-018-PRIVACY：**
```typescript
// 確認 gtag config 不含 user_id
const configEntry = dataLayer.find(
  entry => Array.isArray(entry) && entry[0] === 'config'
)
if (configEntry) {
  expect(configEntry[2]).not.toHaveProperty('user_id')
}
```

**AC-018-PRIVACY-POLICY：**
```typescript
await page.goto('/')
await expect(page.getByText('Google Analytics', { exact: false })).toBeVisible()
```

### 6.4 Playwright Config 調整

在 `playwright.config.ts` 的 `webServer` 加入 GA test env var：
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  env: {
    VITE_GA_MEASUREMENT_ID: 'G-TESTID0000',  // 假 ID，讓 snippet 注入但不打真實 GA4
  },
  reuseExistingServer: !process.env.CI,
  timeout: 30_000,
},
```

### 6.5 新 E2E Spec 檔案

新建 `frontend/e2e/ga-tracking.spec.ts`，涵蓋：
- AC-018-INSTALL：snippet script tag 存在於 head
- AC-018-PAGEVIEW：各路由 pageview event 含 `page_location`
- AC-018-CLICK：4 個 CTA click event 含 `label`
- AC-018-PRIVACY：config call 不含 `user_id`
- AC-018-PRIVACY-POLICY：Footer Google Analytics 文字可見

---

## 7. 預期異動檔案清單

### 新建（New）

| 檔案 | 說明 |
|------|------|
| `frontend/src/utils/analytics.ts` | GA4 初始化 + trackPageview + trackCtaClick |
| `frontend/src/hooks/useGAPageview.ts` | useLocation → trackPageview hook |
| `frontend/src/components/home/BuiltByAIBanner.tsx` | 首頁 thin banner，點擊 → /about，click event |
| `frontend/e2e/ga-tracking.spec.ts` | K-018 所有 AC 的 Playwright spec |
| `frontend/.env.example` | 記錄 VITE_GA_MEASUREMENT_ID（無實際值，供參考） |

### 修改（Modified）

| 檔案 | 改動說明 |
|------|---------|
| `frontend/src/main.tsx` | 1. 呼叫 `initGA()` 2. 加 `<GATracker />` 組件（呼叫 useGAPageview） |
| `frontend/src/components/about/FooterCtaSection.tsx` | 1. email/GitHub/LinkedIn 加 onClick trackCtaClick 2. 底部加 GA 聲明文字 3. ExternalLink 改為原生 `<a>`（Option A） |
| `frontend/src/pages/HomePage.tsx` | import + 渲染 `<BuiltByAIBanner />`（NavBar 之後、HeroSection 之前） |
| `frontend/playwright.config.ts` | webServer.env 加 VITE_GA_MEASUREMENT_ID=G-TESTID0000 |
| `agent-context/architecture.md` | Directory Structure + Changelog 更新（Architect 完成設計後回填） |

### 不動（Excluded）

| 檔案/目錄 | 理由 |
|-----------|------|
| `frontend/src/components/primitives/ExternalLink.tsx` | Option A 選擇不修改 primitive |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | About S7 展示卡，不是真實 banner，保留不動 |
| `backend/` 所有檔案 | GA4 全前端，無後端異動 |
| `frontend/index.html` | 不使用 index.html 靜態注入 |
| `/business-logic` 相關組件 | ticket 明列不含 auth-gated 頁面 |
| `frontend/src/components/UnifiedNavBar.tsx` | 無需改動 |

---

## 8. 不含範圍

- GA4 Admin Console 建立（使用者自行操作）
- 轉換目標、funnel、audience 設定
- Server-side event 追蹤
- `/business-logic` 頁面行為追蹤
- Cookie Consent Banner / GDPR modal
- `window.gtag` 的 TypeScript 全局 augment 拆至 `frontend/src/types/` 獨立 `.d.ts` 檔（在 `analytics.ts` inline 宣告即可，不值得新建型別檔）

---

## Retrospective

**花最多時間：** 確認 `BuiltByAIBanner.tsx` 的實際存在狀態。Architecture.md 記載它在 `home/` 子目錄，但 `ls` 顯示檔案不存在，HomePage.tsx 也無 import。花時間確認這是「K-017 Engineer 還未實作」還是「已改設計」，最終確認是 K-017 預期交付項目但實作中斷（About S7 展示卡是靜態 mockup，不是真正的 banner）。因此 K-018 需要建立真正的 banner 組件。

**需要修正的判斷：** 最初傾向用 `react-ga4` 套件（industry standard pattern），但計算實際節省的代碼量後發現 pageview / click event 兩個功能手刻更輕。若 GA4 需求後續擴增（ecommerce tracking、enhanced measurement），可能需要重新評估引入 `react-ga4`。

**下次改善：** 涉及「architecture.md 記載的組件」時，應在設計開始前就同時 `ls` 驗證存在性，而非讀 architecture.md 就假設檔案存在。此 pattern 與 K-017 設計時「AC 要求後才 walkthrough deploy path」是同一類滯後。
