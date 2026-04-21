---
id: K-020
title: GA4 SPA Pageview E2E — Link click → route change → pageview + HTTP beacon 驗證
status: backlog
type: test
priority: medium
size: M
created: 2026-04-19
updated: 2026-04-21
---

## 背景

K-018 GA4 Tracking 的 E2E 測試僅驗證 `goto(url)` 初始頁面載入觸發的 pageview 事件。但 SPA 路由切換（用戶點擊 NavBar Link → React Router navigate → 新路由渲染）是另一條完全不同的程式碼路徑，目前未被 Playwright 覆蓋。

K-018 Code Reviewer S1 點出此缺口，PM 裁決為 follow-up ticket。

**2026-04-21 scope 擴充 — K-018 production bug 揭露的結構性缺口：**
K-018 上線後 GA4 real-time 顯示 0 users，根因是 `window.gtag = function (...args) { dataLayer.push(args) }`（spread Array）實際上被 gtag.js 忽略——gtag.js 以 Arguments object 與 Array 的差異辨別 gtag 指令與 GTM event。E2E 整組 pass 卻沒抓到此 bug，因為 mock 只驗證「`window.gtag` 被呼叫的參數是什麼」，沒驗證「`/g/collect` HTTP beacon 是否真的送出」。此 ticket 擴充 scope，加入 HTTP beacon 斷言，確保未來 helper 內部實作改動不會讓整組測試在真實 GA4 pipeline 失效。

## 目標

- 驗證 SPA Link click（NavBar 或 BuiltByAIBanner CTA）後，GA4 pageview 事件確實在新路由觸發
- 覆蓋「click → navigate → 新頁面 JS 執行 → dataLayer.push → `/g/collect` HTTP beacon」完整時序
- 讓 ga-tracking 測試組對 production GA4 pipeline（gtag.js → collect endpoint）具備 end-to-end 驗證能力，非僅 helper 層 unit-ish 測試

## 範圍

**含：**
- Playwright E2E：至少一條 SPA navigate 場景（例如 `/` → NavBar About → `/about`），驗證 navigate 後 dataLayer 含新頁 pageview
- 採用 `waitForNavigation` / `Promise.race` 或 `page.on('request')` 取代 `waitForTimeout`，驗證非時序依賴的 SPA click pattern
- HTTP beacon 斷言：使用 `page.waitForRequest(/\/g\/collect/)` 或 `page.on('request')` 捕捉真實送往 googletagmanager.com / google-analytics.com 的 pageview beacon 請求
- ga-tracking.spec.ts 結構性重寫：將 addInitScript mock 改為 spy（保留 production gtag 呼叫行為，同時觀察參數），避免 mock shape 與 production helper 實作細節耦合

**不含：**
- GA4 Admin Console 驗證
- 多層 SPA navigate 鏈的壓力測試
- 完整離線 GA4 endpoint stubbing（beacon 斷言僅驗證 outbound request 存在 + URL 含 `en=page_view`，不 intercept response）

## AC

**AC-020-SPA-NAV：** SPA Link click 觸發 pageview 事件
- Given：用戶在 `/` 頁面
- When：點擊 NavBar 的 About 連結
- Then：Playwright 捕捉到 SPA navigate 完成後，`window.dataLayer` 含 `{ event: 'page_view', page_location: '/about' }` 的事件
- And：測試無 `waitForTimeout`，改以 `waitForNavigation` 或事件訊號同步

**AC-020-BEACON：** 真實 HTTP pageview beacon 送出
- Given：`VITE_GA_MEASUREMENT_ID` 設為測試用 ID，`initGA()` 正常執行
- When：用戶 `goto('/about')` 或 SPA navigate 觸發 pageview
- Then：Playwright 透過 `page.waitForRequest(url => /\/g\/collect/.test(url.url()))` 捕捉到送往 Google Analytics 的 beacon 請求
- And：該 request URL query string 包含 `en=page_view` 參數（GA4 Measurement Protocol event name）
- And：斷言須覆蓋 `/` 初始 load 與 SPA navigate `/ → /about` 兩條路徑

**AC-020-SPY-PATTERN：** mock 結構重寫避免 shape drift
- Given：ga-tracking.spec.ts 所有 test.describe
- When：需觀察 `window.gtag` 參數
- Then：改用 spy 模式（包裝 production `window.gtag` 而非 replace），或 `page.on('console')` / `dataLayer` 只讀斷言，不 addInitScript 覆蓋 gtag
- And：若保留 addInitScript 策略，mock 必須 call 原 production helper（先執行 initGA 再包 Arguments push），不得使用獨立 function body 重實作 push 行為

## 相依

- K-018 已關閉（fix commit `6a9d6cd`：push arguments + spec align 完成）
- K-020 可直接進入 Architect / Engineer，無其他 blocker

## Known Gap 轉入本 ticket

K-018 `## 最終關閉記錄` 列出的 follow-up：「E2E 僅驗證 `window.gtag` 呼叫參數，未驗證 `/g/collect` HTTP beacon」→ 由 AC-020-BEACON 覆蓋。

## Retrospective

<!-- 各角色完成後 append 反省段 -->
