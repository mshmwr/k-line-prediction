---
id: K-004
title: /app TopBar Logo 點擊回 Home
status: open
type: feat
priority: medium
created: 2026-04-16
---

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

## 驗收條件

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
