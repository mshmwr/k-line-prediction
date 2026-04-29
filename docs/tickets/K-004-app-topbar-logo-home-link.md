---
id: K-004
title: /app TopBar Logo 點擊回 Home
status: superseded
superseded-by: K-030
superseded-date: 2026-04-21
type: feat
priority: medium
created: 2026-04-16
---

## ⚠️ SUPERSEDED BY K-030 (2026-04-21)

**Supersede reason:** K-030 removes UnifiedNavBar from `/app` page and opens `/app` in a new browser tab. With no NavBar on `/app`, the TopBar logo-click-to-Home premise of K-004 no longer exists. Users naturally return to the marketing site by closing the `/app` tab; a dedicated Home link is redundant.

**Action:** No work required on this ticket. Close as superseded.

## 背景

使用者進入 `/app` 後沒有明顯路徑回到 Landing Page（`/`）。
其他頁面（`/about`、`/diary`）的 NavBar 有「← Home」連結，但 `/app` 的 TopBar 只有 logo + badge，無回首頁入口。

## 決策

Logo（"K-Line Predictor"）點擊後導向 `/`。
採用業界慣例（logo = home link），不在 TopBar 加額外文字連結以節省空間。

## 範圍

**含：**
- `/app` TopBar 的 logo 文字改為可點擊的 `<Link to="/">`
- hover 樣式明示可點擊（cursor-pointer、輕微 opacity 變化）

**不含：**
- 其他頁面的 NavBar（已有「← Home」）
- TopBar 其他欄位的修改

## Acceptance Criteria

**AC-K004-1：Logo 點擊導向 Home**

**Given** 使用者在 `/app` 頁面
**When** 點擊 TopBar 左上角 "K-Line Predictor" logo
**Then** 頁面導向 `/`（Landing Page）
**And** 不發生全頁 reload（SPA 路由）

**AC-K004-2：Hover 樣式**

**Given** 使用者在 `/app` 頁面
**When** 滑鼠 hover 在 logo 上
**Then** cursor 顯示為 pointer，logo 有 opacity 或顏色變化

## 相關連結

- [PM-dashboard.md](../../../PM-dashboard.md)
- [設計稿 homepage.pen — App /app section](../../frontend/design/homepage.pen)
- [K-030 — /app page isolation](./K-030-app-page-isolation.md)（本票 supersede 來源）

---

## Retrospective

### PM — 2026-04-21

**Supersede decision:** K-030 removes NavBar + Footer from `/app` and opens `/app` in a new tab. With no NavBar, the TopBar logo-click-to-Home UX need is dissolved — closing the tab replaces the Home link. Superseded without implementation work.

**Lesson:** K-004 assumed `/app` is part of the marketing site chrome (same as `/about`, `/diary`). K-030 reframed `/app` as an isolated tool surface, which dissolved the "return-to-Home" UX need entirely. Future: when a navigation-related ticket depends on "page X shares chrome with page Y," explicitly state the chrome-sharing assumption so it can be re-validated when page role changes.
