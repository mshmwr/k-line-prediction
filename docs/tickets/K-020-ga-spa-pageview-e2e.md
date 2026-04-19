---
id: K-020
title: GA4 SPA Pageview E2E — Link click → route change → pageview 驗證
status: backlog
type: test
priority: low
size: S
created: 2026-04-19
---

## 背景

K-018 GA4 Tracking 的 E2E 測試僅驗證 `goto(url)` 初始頁面載入觸發的 pageview 事件。但 SPA 路由切換（用戶點擊 NavBar Link → React Router navigate → 新路由渲染）是另一條完全不同的程式碼路徑，目前未被 Playwright 覆蓋。

K-018 Code Reviewer S1 點出此缺口，PM 裁決為 follow-up ticket。

## 目標

- 驗證 SPA Link click（NavBar 或 BuiltByAIBanner CTA）後，GA4 pageview 事件確實在新路由觸發
- 覆蓋「click → navigate → 新頁面 JS 執行 → dataLayer.push」完整時序

## 範圍

**含：**
- Playwright E2E：至少一條 SPA navigate 場景（例如 `/` → NavBar About → `/about`），驗證 navigate 後 dataLayer 含新頁 pageview
- 採用 `waitForNavigation` / `Promise.race` 或 `page.on('request')` 取代 `waitForTimeout`，驗證非時序依賴的 SPA click pattern

**不含：**
- GA4 Admin Console 驗證
- 多層 SPA navigate 鏈的壓力測試

## AC

**AC-020-SPA-NAV：** SPA Link click 觸發 pageview 事件
- Given：用戶在 `/` 頁面
- When：點擊 NavBar 的 About 連結
- Then：Playwright 捕捉到 SPA navigate 完成後，`window.dataLayer` 含 `{ event: 'page_view', page_location: '/about' }` 的事件
- And：測試無 `waitForTimeout`，改以 `waitForNavigation` 或事件訊號同步

## 相依

- K-018 Engineer 完成 W3/W4（waitForTimeout 修除）後，此 ticket 的 pattern 才能對齊

## Retrospective

<!-- 各角色完成後 append 反省段 -->
