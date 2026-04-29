---
id: K-005
title: 統一 NavBar — 所有頁面
status: closed
type: feat
priority: high
created: 2026-04-16
supersedes: K-004
---

## 背景

各頁面 NavBar 設計不一致，導致使用者難以在頁面間導航：
- Homepage `/`：3 連結（Home / App / Business Logic），缺 About、Diary
- About `/about`：logo + `← Home`
- Diary `/diary`：logo + `← Home`
- Business Logic `/business-logic`：logo + `← Back to App`
- App `/app`：TopBar（完全不同設計語言）

K-004（/app logo 點擊回 Home）被本票涵蓋，K-004 隨本票實作完成後關閉。

## 決策

所有 5 頁使用完全相同的 NavBar，桌機與手機版各一套。
設計稿參考：[homepage.pen](../../frontend/design/homepage.pen) — `NavBar — Revised` 系列 frame（x=7600）

**桌機（≥ 768px）：**
- 左：K-LINE PREDICTION logo（IBM Plex Mono, 16px, 700）
- 右：⌂（14px）| App | About | Diary | Logic 🔒（紫色）
- 高度 72px，背景 #111827，左右 padding 120px

**手機（< 768px）：**
- 左：⌂ icon（18px, 白色, 可點擊 → `/`）
- 右：App | About | Diary | Logic 🔒（11px）
- 高度 56px，背景 #111827，左右 padding 16px

## 範圍

**含：**
- 所有 5 頁（`/`、`/app`、`/about`、`/diary`、`/business-logic`）換成統一 NavBar 組件
- 抽出 `<UnifiedNavBar>` 共用組件，各頁引用
- 桌機 hover 樣式：cursor-pointer，active 頁面連結高亮（白色，其他灰色）
- Business Logic 連結保留 auth gate（未登入 → 紫色鎖頭，登入後正常連結）

**不含：**
- NavBar 以外的頁面 layout 修改
- App `/app` 內部 TopBar utility bar 的其他欄位

## Acceptance Criteria

**AC-NAV-1：桌機 NavBar 統一**

**Given** 使用者訪問任一頁面（`/`、`/app`、`/about`、`/diary`、`/business-logic`）
**When** 頁面載入，viewport ≥ 768px
**Then** NavBar 顯示：左側 logo "K-LINE PREDICTION"，右側連結 ⌂ / App / About / Diary / Logic 🔒
**And** 不發生 layout shift 或 NavBar 缺失

**AC-NAV-2：手機 NavBar 統一**

**Given** 使用者訪問任一頁面，viewport < 768px
**When** 頁面載入
**Then** NavBar 顯示：左側 ⌂ icon，右側連結 App / About / Diary / Logic 🔒
**And** 無漢堡選單，無水平捲動

**AC-NAV-3：⌂ 導向首頁**

**Given** 使用者在任何頁面
**When** 點擊 ⌂ icon（桌機右側連結 或 手機左側 icon）
**Then** 頁面導向 `/`，不發生全頁 reload（SPA 路由）

**AC-NAV-4：各連結導向正確頁面**

**Given** 使用者在任何頁面
**When** 點擊 NavBar 連結
**Then** App → `/app`、About → `/about`、Diary → `/diary`、Logic 🔒 → `/business-logic`
**And** 不發生全頁 reload

**AC-NAV-5：當前頁面連結高亮**

**Given** 使用者在某頁面
**When** 頁面載入
**Then** 對應該頁的 NavBar 連結顯示為白色（active），其他連結為灰色

**AC-NAV-6：Business Logic 連結 auth 狀態**

**Given** 使用者未登入
**When** 查看 NavBar
**Then** Logic 🔒 連結顯示鎖頭，點擊導向 `/business-logic`（auth gate 頁）
**And** 已登入時，Logic 連結正常，點擊直接顯示內容

## 相關連結

- [PM-dashboard.md](../../../PM-dashboard.md)
- [設計稿 homepage.pen](../../frontend/design/homepage.pen)
- [K-004](./K-004-app-topbar-logo-home-link.md)（本票實作後關閉）
