---
id: K-014
title: Vitest index-based selector 殘留清理（AppPage + OHLCEditor）
status: backlog
type: test
priority: low
created: 2026-04-18
source: docs/tickets/K-010-vitest-apppage-fix.md#reviewer-warnings-w1-w2
td: TD-009
---

## 背景

K-010 senior-engineer review 提出 Warning W1 / W2：除了 K-010 已修的兩個失敗 test 外，仍有 5 處 `getAllBy...()[N]` 形式的 index-based selector 未清理。當下非 red（scope 外 + UI 未異動），但屬於 AC-010-ROBUST 同型問題，列 TD-009，由本 ticket 背景處理。

## 範圍

**含：**
- `frontend/src/__tests__/AppPage.test.tsx` line 66 / 86 / 89 / 92 — 改用 `getByLabelText` / `getByRole({ name, exact })` / `data-testid`
- `frontend/src/__tests__/OHLCEditor.test.tsx` line 25 — 同型改動
- 若需補 `data-testid` 或 `aria-label` → 動到對應組件，必須同步補 accessible name（兼顧 a11y）

**不含：**
- 其他 test 檔案（若 Engineer 實作途中發現更多同型殘留，列入本 ticket 彙整修）
- 組件行為變更 — 純 test refactor + accessibility attr 加強

## Acceptance Criteria

### AC-014-SELECTOR：無 index-based selector

**Given** `frontend/src/__tests__/`
**When** 執行 `grep -rn "getAllBy.*\[\d\]" frontend/src/__tests__/`
**Then** 無結果
**And** 若必須用 `getAllBy`，使用 filter/find 搭配語意斷言，不用 `[N]`

### AC-014-GREEN：Vitest suite 全綠

**Given** 修改後的 test 檔
**When** 執行 `npm test -- --run`
**Then** 全部 tests 通過，exit 0

### AC-014-REGRESSION：tsc / E2E 不回歸

**Given** 前端完整檢查
**When** 執行 `npx tsc --noEmit` 與 `/playwright`
**Then** tsc exit 0
**And** Playwright E2E 全通過

## 優先級理由

**low** — 當前 suite 全綠，不 block merge gate；成本低但無立即價值；推薦在 OHLCEditor / AppPage 上傳區下一次結構改動時捎帶一併修。若背景閒置 cycle 可直接消化。

## 下一棒

Backlog — 排在 K-009 / K-011 / K-012 / K-013 之後，由 PM 視 cycle 容量排入 Architect / Engineer。

## 相關連結

- [TD-009](../tech-debt.md#td-009--vitest-index-based-selector-殘留)
- [K-010 Review Warnings](./K-010-vitest-apppage-fix.md#retrospective)
