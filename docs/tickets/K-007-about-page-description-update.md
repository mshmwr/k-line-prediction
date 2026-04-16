---
id: K-007
title: About 頁面描述更新
type: content
priority: medium
status: open
created: 2026-04-16
---

## 背景

About 頁面（`/about`）描述內容需要更新。具體修改範圍待 PM 確認。

根據 PRD AC-ABOUT-1，About 頁面目前包含以下 Section：
- Overview
- AI 協作開發流程
- 人的貢獻 vs AI 的貢獻
- 技術選型決策
- Screenshots（佔位圖）
- Features

## PM 指定調查流程（Engineer / Architect 執行前必讀）

執行前依序完成以下調查，再決定修改範圍：

1. **掃 About 頁面現有內容** — 讀取 `AboutPage.tsx`（及相關組件），逐 section 列出目前文案
2. **查 diary.json + git log** — 確認實際完成的里程碑、部署架構、技術決策
3. **詢問 Engineer 現用架構** — 確認目前 production 使用的技術棧（frontend framework、hosting、backend、API 設計模式）
4. 根據以上三點，提出 About 頁面的具體修改 diff，送 PM 審核後才實作

**目標：** 確保 About 頁面正確陳述專案內容與 AI 協作開發模式。

## Blocking Questions

無（調查流程已由 PM 定義，Architect 審查後直接放行 Engineer 執行調查步驟）

## Acceptance Criteria

（待調查完成、PM 審核修改 diff 後由 PM 補充具體 AC）

### AC-K007-1（草稿）

**Given** 使用者訪問 `/about`
**When** 頁面載入
**Then** About 頁面所有 section 的文案正確反映專案現況（技術棧、部署架構、AI 協作開發模式）
**And** 無過時或不正確的描述

## 相關檔案

- `frontend/src/pages/AboutPage.tsx`（或對應組件）
- PRD AC-ABOUT-1
