---
id: K-016
title: K-002 component spec 加 superseded 頭註（LoadingSpinner 文案）
status: backlog
type: docs
priority: low
created: 2026-04-18
source: docs/tickets/K-011-loading-spinner-label.md#pm-裁決review-suggestions-2026-04-18 (Drift B)
---

## 背景

K-011 將 `LoadingSpinner` 由固定 `Running prediction...` 改為 `label?: string` prop，但 `docs/superpowers/specs/k002-component-spec.md:99,111` 仍描述舊行為。

此 spec 為 K-002 時間點的設計快照，改內容會扭曲歷史記錄；正確處理是加「Superseded by K-011」頭註，讓後續讀者知道該段落已不反映當前實作。

## 範圍

**含：**
- 在 `docs/superpowers/specs/k002-component-spec.md` 檔案最上方（frontmatter 之後 / 正文之前）加一行標註：
  ```
  > **Note:** Portions of this spec describing `LoadingSpinner` (lines 99, 111) are superseded by [K-011](../../tickets/K-011-loading-spinner-label.md) on 2026-04-18. Spec content preserved as a K-002 design snapshot.
  ```
- 不改 line 99 / 111 的原始內容

**不含：**
- 掃描其他歸檔 spec 的類似 drift（若未來發現再逐案開票）
- 制定「歸檔 spec 通用標註規範」（屬 process 改善，非本票 scope）

## 驗收條件

### AC-016-HEADER：superseded 頭註存在且連結正確

**Given** `docs/superpowers/specs/k002-component-spec.md`
**When** 讀取檔案
**Then** frontmatter 之後出現 superseded 頭註
**And** 頭註內 K-011 相對路徑可被 Markdown viewer 解析（`../../tickets/K-011-loading-spinner-label.md`）
**And** lines 99, 111 的原始內容保留未改

## 優先級理由

**low** — 純文件改動、無 code / UX 影響。但放著不處理會讓未來讀 spec 的 agent 誤信舊行為，故仍登記而非丟棄。排序在 backlog 尾端，任何維運 session 可順手完成。

## 下一棒

待排程。直接交 Engineer（單檔案、單行 Edit，無架構決策）。

## 相關連結

- [K-011 LoadingSpinner label prop](./K-011-loading-spinner-label.md)
- [K-002 UI 優化票](./K-002-ui-optimization.md)
