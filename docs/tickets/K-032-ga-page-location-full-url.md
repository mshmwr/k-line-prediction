---
id: K-032
title: GA4 page_location 欄位送完整 URL（修正 pre-existing bug，pathname → full URL）
status: backlog
type: bug
priority: low
size: S
created: 2026-04-22
updated: 2026-04-22
qa-early-consultation: N/A — single-field bug fix with matching AC; no edge case surface expected at Architect handoff. Will revisit if Architect design surfaces multi-path deps (e.g. SSR, custom domain override).
---

## 背景

K-020 QA Early Consultation（2026-04-22）Challenge #15 發現：`frontend/src/hooks/useGAPageview.ts` 呼叫 `trackPageview` 時傳入的 `page_location` 值是 `location.pathname`（例如 `/about`），但 GA4 Measurement Protocol 對 `page_location` 欄位的慣例是**完整 URL**（例如 `https://k-line.example.com/about`）。

此 bug 非 K-018 或 K-020 造成，屬 K-018 前即存在的既有實作。K-020 scope 為「測試硬化」不混修 production bug，故另開此 ticket 追。

## 目標

- 修正 `useGAPageview` 與 `trackPageview` 呼叫鏈，使 `page_location` 欄位送完整 URL（包含 protocol + host + path + query）
- 同步更新 AC-020-SPA-NAV 與 AC-020-BEACON-* 斷言中 `page_location === '/about'` 等 hard-coded 片段，改為 full URL 驗證（或 regex 匹配）
- 確保 GA4 Realtime / Reports 顯示的 Page location 欄位符合 GA4 慣例，不再是裸 pathname

## 範圍

**含：**
- `frontend/src/hooks/useGAPageview.ts` — 將 `location.pathname` 改為 `window.location.href` 或等效 full URL 構造
- `frontend/src/utils/analytics.ts` — 若 `trackPageview` signature 需要調整以區分 pathname 與 location，一併更新
- `frontend/e2e/ga-tracking.spec.ts` + K-020 新增 spec — 更新 `page_location` 斷言，使用 full URL 或 regex
- PRD.md AC 段落同步

**不含：**
- `page_path` 欄位變更（此欄位慣例就是 pathname，不需改）
- GA4 property settings 變更
- Custom domain 或 SSR 場景（目前專案為純 SPA，`window.location.href` 即 production URL）

## AC

**AC-032-PAGE-LOCATION-FULL-URL：** `page_location` 欄位值為完整 URL
- **Given**：用戶在任意路由（`/` / `/about` / `/diary` / `/app`），`window.location.href` 為完整 URL（含 protocol + host + path + 可能的 query/hash）
- **When**：`useGAPageview` 的 `useEffect` 觸發 `trackPageview`
- **Then**：`window.dataLayer` push 的 Arguments-object entry[2].page_location 必須等於 `window.location.href`（完整 URL）
- **And**：不得為 `location.pathname`（裸路徑）或 `location.origin + pathname`（缺 query/hash）

**AC-032-SPEC-SYNC：** 現有 K-020 / K-018 相關 E2E 斷言同步更新
- **Given**：K-020 已上線且 spec 含 `page_location === '/about'` 硬編字串
- **When**：本 ticket land
- **Then**：相關 spec 必須改為驗 `window.location.href` 值（或 regex `/\/about(?:\?|#|$)/` 匹配）
- **And**：Playwright 全部 GA tracking specs 必須 pass

**AC-032-NO-REGRESSION：** 不破壞 K-018 / K-020 既有 AC
- **Given**：K-018 AC-018-PAGEVIEW、K-020 AC-020-SPA-NAV / AC-020-BEACON-* 已通過
- **When**：本 ticket 實作完成
- **Then**：全部既有 AC 仍通過（可能需配合 AC-032-SPEC-SYNC 更新斷言，但語意不變）

## 相依

- **K-020 landed 後再進**：K-020 會先固化目前 `page_location === '/about'` 的斷言；本 ticket land 時同步改
- 若 K-020 未 land，本 ticket 單獨進亦可（改 production + 改 existing K-018 spec），但建議串起做以利 review

## 備註

- GA4 Measurement Protocol 官方：`page_location` 對應 `dl` query key（full URL），`page_path` 對應 `dp` query key（pathname）
- 目前 bug 的實際影響有限（GA4 會從 request headers 推斷 host，Realtime 仍看得到頁面），但語意不正；屬低優先順序 bug
