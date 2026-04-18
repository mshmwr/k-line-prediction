---
id: K-009
title: 1H 預測路徑使用錯誤的 MA history 來源
status: open
type: bug
priority: high
created: 2026-04-18
source: docs/reviews/2026-04-18-code-review.md#p1-1h-prediction-path-uses-the-wrong-ma-history-source
---

## 背景

Codex code review 2026-04-18 發現 `backend/main.py` 的 `predict()` 在呼叫 `find_top_matches()` 時，傳入了：

- `history=history`
- `timeframe=req.timeframe`
- `history_1d=_history_1d`

但**沒有傳入 `ma_history`**。

`backend/predictor.py` 的 `find_top_matches()` 在 `ma_history is None` 時會 fallback 為 `ma_history = history`，因此 1H 路徑誤用了 `_history_1h` 作為「30-day MA99」filter 與 MA correlation 輸入。`_fetch_30d_ma_series()` helper 的語意是以 daily-history 為基礎，用 1H 資料計算會導致：

- 候選 filtering 錯誤
- Ranking 錯誤
- 1H 預測結果可能與預期策略行為不一致

## 範圍

**含：**
- `backend/main.py` `predict()` 呼叫 `find_top_matches()` 時補傳 `ma_history=_history_1d`
- 新增 1H 預測路徑的 regression test（鎖住此行為）

**不含：**
- `find_top_matches()` 簽章或內部重構
- 1D 路徑邏輯變更

## 預期異動檔案

- `backend/main.py`（修正 `find_top_matches()` 呼叫參數）
- `backend/tests/test_main.py` 或 `backend/tests/test_predictor.py`（補 regression test）

## 驗收條件

### AC-009-FIX：predict() 1H 路徑傳遞正確的 ma_history

**Given** backend 同時載入 `_history_1h` 與 `_history_1d`
**When** `/api/predict` 以 `timeframe="1H"` 被呼叫
**Then** `find_top_matches()` 收到 `ma_history=_history_1d`（而非 fallback 為 `history`）
**And** 1H 預測結果的 MA99 filter 與 correlation 基於 daily history 計算

### AC-009-TEST：1H regression test 鎖住行為

**Given** 後端 test suite
**When** 執行 `python3 -m pytest backend/tests/`
**Then** 存在一個 test case 明確驗證 1H 路徑下 `ma_history` 為 `_history_1d`
**And** 若回退至舊行為（不傳 `ma_history`），該 test 必須失敗

### AC-009-REGRESSION：1D 路徑與其他 API 行為不變

**Given** 現有 backend test suite（18 + 44 tests）
**When** 執行全部 backend tests
**Then** 全部通過，無新增 failure

## 優先級理由

**high** — 這是 correctness 問題，影響預測品質；使用者會拿到結果但 ranking 可能與策略預期不符，信任度受損。早於 UI/重構類工作處理。

## 下一棒

直接交 Engineer（改動聚焦、不涉及架構決策）。若 Engineer 發現 `find_top_matches()` 參數設計本身需要調整（e.g., 讓 `ma_history` 變必填），暫停回報 PM 決定是否升級為 Architect 介入。

## 相關連結

- [Code Review](../reviews/2026-04-18-code-review.md#p1-1h-prediction-path-uses-the-wrong-ma-history-source)
- [PM Summary](../reviews/2026-04-18-pm-summary.md#2-1h-prediction-quality-may-be-affected)

---

## Architecture Review

**裁決：無需 Architecture** — 由 senior-architect 於 2026-04-18 審視。

**理由：**
- 改動範圍：僅 `backend/main.py` 一個 call site 補 `ma_history=_history_1d` + regression test
- 無跨層影響：不動 API schema、不動前端、不動 field mapping
- 無 interface 變更：`find_top_matches()` 簽章維持既有預設參數形式（`ma_history: Optional = None`）

**對「`ma_history` 是否該在 predictor 層強制（而非 caller 決定）」的判斷：**

此問題在 Codex review 原文中已被 ticket 下一棒段落條件式點出（「若 Engineer 發現參數設計本身需要調整… 暫停回報 PM」）。Architect 評估：

- 「caller 決定傳哪個 history」是合理設計（1D 路徑、1H 路徑、測試路徑可傳不同 history 做 MA filter）
- 但目前 fallback `if ma_history is None: ma_history = history` 本身是**靜默回退**，會讓 K-009 這類 bug 不易被測試攔截
- 合理折衷：**維持 signature 選填，但在 `find_top_matches()` 入口加一個 assert/log warning**，若 `timeframe == "1H"` 且 `ma_history is history` 時 log 警告（或測試模式下 raise）
- 此折衷不屬於 K-009 AC 範圍，列入 Engineer 實作時的**建議 defense-in-depth**，由 Engineer 自行裁量。若選擇不做，該 regression test 已能鎖住當下正確行為。

**放行 Engineer。** 實作完成後 Code Review（senior-engineer agent）按原流程執行即可，無需再過 Architect。

— senior-architect, 2026-04-18
