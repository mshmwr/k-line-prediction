---
id: K-006
title: Homepage diary.json 補填 4/1–4/16 缺漏里程碑
type: content
priority: medium
status: closed
created: 2026-04-16
---

## 背景

`frontend/public/diary.json` 目前僅有以下日期的條目：

| 日期 | 里程碑 |
|------|--------|
| 2026-04-01 | MA99 Pearson Trend Filter + 1H/1D Forecast（⚠️ 日期錯誤，需拆成兩筆並修正） |
| 2026-04-15 | Phase 0 Architecture Planning + Design |
| 2026-04-15 | Phase 1 JWT Auth |
| 2026-04-15 | Phase 2 BrowserRouter Routing |
| 2026-04-16 | Phase 3 Frontend Pages |
| 2026-04-16 | Deployment Firebase + Cloud Run |

**缺漏期間：** 4/8–4/14（約一週）

根據 git log，以下里程碑無對應 diary 條目：

| Git 日期 | 工作項目 |
|----------|---------|
| 2026-04-08 | `/api/merge-and-compute-ma99` endpoint + computeMa99 function |
| 2026-04-08 | Early MA99 loading state（上傳即計算）+ Match Trend Labels |
| 2026-04-09 | Shared 1H/1D Forecast UI（native timeframe API contract） |
| 2026-04-09 | UTC/UTC+8 timestamp 統一修復 |
| 2026-04-11 | MA99 Pearson 30-day trend filter 取代 ma99_trend_override |

**PM 決策（2026-04-16）：** 日期一律依 git 日期，不用開始日期。`"2026-04-01"` 條目需拆成兩筆：

| 新日期 | 內容 |
|--------|------|
| 2026-04-10 | Shared 1H/1D Forecast UI（native timeframe API contract） |
| 2026-04-11 | MA99 Pearson 30-day trend filter 取代 ma99_trend_override |

## Acceptance Criteria

### AC-K006-1: 補填缺漏里程碑

**Given** `diary.json` 目前缺少 4/8–4/14 的紀錄
**When** Engineer 補填完成
**Then** diary.json 含有下列所有條目，日期依 git merge 日期：

| 日期 | 里程碑 |
|------|--------|
| 2026-04-08 | `/api/merge-and-compute-ma99` endpoint + computeMa99 function |
| 2026-04-08 | Early MA99 loading state（上傳即計算）+ Match Trend Labels |
| 2026-04-09 | UTC/UTC+8 timestamp 統一修復 |
| 2026-04-10 | Shared 1H/1D Forecast UI |
| 2026-04-11 | MA99 Pearson 30-day trend filter |

**And** 原 `"2026-04-01"` 條目刪除，由上表 4/10 和 4/11 兩筆取代
**And** 每筆 `text` 符合 diary 風格（一句話說明工作內容 + 關鍵決策/結果）

### AC-K006-2: E2E 不回歸

**Given** diary.json 修改後
**When** 執行 Playwright E2E
**Then** DiaryPage 相關測試全數通過

## PM 決策：milestone 粒度規則

- **獨立 milestone**：可對外說明「做了什麼功能」的工作（Early MA99、Shared Forecast、Pearson Filter）
- **items 裡的細項**：修復、補強、文件更新（UTC fix、Playwright fix、code review 改動）

→ UTC timestamp 修復合進「Shared 1H/1D Forecast UI」milestone 的 items，不獨立成一筆。

## Blocking Questions

- [x] ~~4/1 那筆日期是否要修正？~~ → **已決策：依 git 日期，拆兩筆（4/10 + 4/11）**
- [x] ~~milestone 粒度？~~ → **已決策：功能獨立，bugfix 併入最近功能 milestone 的 items**
- [ ] 4/8–4/14 各條目的 `text` 描述，Engineer 依 git log 起草初稿後送 PM 審核

## 相關檔案

- [frontend/public/diary.json](../../frontend/public/diary.json)
- PRD AC-HOME-1（diary section 渲染規則）
