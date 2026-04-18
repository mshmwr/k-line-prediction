---
id: K-011
title: LoadingSpinner 文案中性化 — 加 label prop
status: open
type: enhancement
priority: medium
created: 2026-04-18
source: docs/reviews/2026-04-18-code-review.md#p3-shared-loading-spinner-copy-is-now-misleading
---

## 背景

Codex code review 2026-04-18 發現 `frontend/src/components/common/LoadingSpinner.tsx` 寫死文案 `Running prediction...`。

此組件目前被多處共用：

- `BusinessLogicPage`
- `DiaryPage`
- `DevDiarySection`
- `PredictButton`

非預測情境（diary、business-logic）顯示 prediction 相關文字造成誤導。

## 範圍

**含：**
- `LoadingSpinner` 新增 `label?: string` prop，預設值由呼叫方決定
- 更新所有 4 個呼叫處，傳入情境正確的 label（e.g. `"載入日記…"`、`"Running prediction…"`）
- 無 label 時 fallback 策略由 Engineer 選擇（推薦：無 label 就只顯示 spinner 不顯示文字）

**不含：**
- 動畫視覺升級（K-002 AC-002-LOADING 已涵蓋）
- 新增 skeleton / pulse variants

## 預期異動檔案

- `frontend/src/components/common/LoadingSpinner.tsx`
- `frontend/src/pages/BusinessLogicPage.tsx`
- `frontend/src/pages/DiaryPage.tsx`
- `frontend/src/components/DevDiarySection.tsx`
- `frontend/src/components/PredictButton.tsx`
- 可能更動：`frontend/src/__tests__/*`、`frontend/e2e/*`（若有斷言 spinner 文字）

## 驗收條件

### AC-011-PROP：LoadingSpinner 支援 label prop

**Given** `LoadingSpinner` 組件
**When** 呼叫方傳入 `<LoadingSpinner label="載入中…" />`
**Then** 畫面顯示該 label 文字
**And** 未傳 label 時，不顯示 `Running prediction...` 這組 prediction-specific 文字

### AC-011-CALLSITES：各呼叫處情境正確

**Given** 4 個使用 LoadingSpinner 的位置
**When** 各自觸發 loading 狀態
**Then** 顯示的 label 與該頁面任務情境一致（diary 類顯示日記相關文案；predict 類顯示預測相關文案）

### AC-011-REGRESSION：無既有功能回歸

**Given** 前端完整檢查
**When** 依序執行 `npx tsc --noEmit` / `npm test` / `/playwright`
**Then** 全部通過
**And** 原本測試若斷言 `Running prediction...` 文字，應對應更新為新 label

## 優先級理由

**medium** — 非 correctness 問題，但已在 review 中明確列為誤導性 UX；和 K-002 UI 優化同屬語意整理類工作，改動小。排在 K-009/K-010 之後處理即可。

## 下一棒

直接交 Engineer（props 新增 + 5 處呼叫點更新，無架構決策）。

## 相關連結

- [Code Review](../reviews/2026-04-18-code-review.md#p3-shared-loading-spinner-copy-is-now-misleading)
- [K-002 UI 優化 AC-002-LOADING](../../PRD.md#ac-002-loadingloading-動畫改版-k-002)

---

## Architecture Review

**裁決：無需 Architecture** — 由 senior-architect 於 2026-04-18 審視。

**理由：**
- 改動範圍：`LoadingSpinner` 加 `label?: string` prop + 4 個 callsite 各自傳入文案
- 無跨層：純 UI 組件 prop 擴充，無 API、無 routing 影響
- Props interface 變更極小（向後相容，`label` optional + fallback「無文字只顯示 spinner」）
- AC-011-PROP / AC-011-CALLSITES / AC-011-REGRESSION 已足以鎖定行為

**實作提醒（非 blocking，給 Engineer 參考）：**
- 若既有 unit test 或 E2E 斷言 `Running prediction...` 文字，請一併更新（AC-011-REGRESSION 已涵蓋此點）
- 4 個 callsite 文案建議與頁面 i18n 風格一致（目前專案為中文 UI，spinner 文案建議中文）

**放行 Engineer。**

— senior-architect, 2026-04-18
