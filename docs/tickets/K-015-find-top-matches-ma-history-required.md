---
id: K-015
title: find_top_matches() ma_history 靜默 fallback 移除（改 required 或加 assert/warning）
status: backlog
type: refactor
priority: medium
created: 2026-04-18
source: docs/tickets/K-009-1h-ma-history-fix.md#suggestion-s1
td: TD-010
---

## 背景

K-009 修復了 `backend/main.py` `predict()` 1H 路徑未傳 `ma_history` 導致 `find_top_matches()` fallback 為 `ma_history = history`（誤用 1H 資料做 30-day MA 計算）的 bug。

但**根因未解**：`backend/predictor.py` `find_top_matches()` 仍保有：

```python
if ma_history is None:
    ma_history = history
```

這是靜默 fallback — 未來任何新增 `find_top_matches()` caller 只要忘記傳 `ma_history`，都會重蹈 K-009 覆轍，而且編譯期、linter、test suite 皆無法攔截。K-009 的 regression test 只鎖**當下的 1H call site**，不保護未來新 caller。

Code Review（senior-engineer agent, 2026-04-18）以 Suggestion S1 提出，並建議開 follow-up ticket 由 Architect 評估方案（見下方 Open Questions）。

## 範圍

**含：**
- `backend/predictor.py` `find_top_matches()` 的 signature / 入口防護改造
- 同步更新所有 caller（目前為 `backend/main.py` 1D / 1H 分支各一個）
- 補強 test：新增 caller 遺漏 `ma_history` 時必須在測試階段 raise 或 mypy/pyright 層攔截（不是 production silent）

**不含：**
- 其他 predictor 內部重構（屬 TD-007）
- stats / consensus payload 改動（屬 TD-008 / K-013）
- 1D / 1H 預測行為變更 — 僅保護機制強化

## 建議方案（待 Architect RFC 裁決）

**Option A — `ma_history` 改 required keyword-only 參數**
```python
def find_top_matches(*, history, ma_history, timeframe, history_1d=None):
```
- 優點：編譯期即攔截（type checker + runtime `TypeError`），零 silent fallback
- 代價：所有 caller 需同步改；1D 路徑需顯式傳 `ma_history=_history_1d`（目前靠 fallback 剛好對）

**Option B — 保留選填但加入口 assert / warning**
```python
if ma_history is None:
    if os.getenv("PYTEST_CURRENT_TEST"):
        raise ValueError("ma_history must be provided in test mode")
    logger.warning("find_top_matches called without ma_history, falling back to history")
    ma_history = history
```
- 優點：向後相容、逐步推動；測試階段 raise 擋住漏傳
- 代價：仍是 post-hoc 發現，production warning 需要 log 監控才看得到

**Architect 初步傾向：** Option A（K-009 Engineer 反省段已指出「log warning 無阻擋力，raise 會誤傷 1D 既有呼叫」— 但若 1D 分支同步顯式傳 `ma_history=_history_1d`，Option A 完全沒有誤傷風險，且效益最大）。

最終方案由 Architect RFC 產出後 PM 裁決。

## 驗收條件

### AC-015-NO-FALLBACK：無 silent fallback

**Given** `backend/predictor.py` `find_top_matches()` 實作
**When** caller 未傳 `ma_history`
**Then** 行為為以下之一（依 RFC 裁決）：
- Option A：`TypeError` raised（required keyword）
- Option B：測試環境 raise / 生產環境 log warning，不 silent

**And** 任一情況下皆無 `if ma_history is None: ma_history = history` 靜默回退

### AC-015-CALLERS：所有現有 caller 顯式傳遞

**Given** `backend/main.py` 全部 `find_top_matches()` 呼叫
**When** grep `find_top_matches(` 該檔
**Then** 每次呼叫都顯式傳 `ma_history=<value>`，無依賴預設值或 fallback

### AC-015-TEST-GUARD：caller 漏傳在 test 階段被攔截

**Given** backend test suite
**When** 故意拿掉某 caller 的 `ma_history` 參數
**Then** 至少一個 test 必須失敗（not silent pass）
**And** 失敗原因可直接指出「`ma_history` 遺漏」

### AC-015-REGRESSION：1D / 1H 預測行為不變

**Given** 63 個現有 backend tests + K-009 regression test
**When** 執行 `python3 -m pytest backend/tests/`
**Then** 全部通過
**And** 1D 分支 `test_merge_and_compute_ma99_1d_branch` 通過
**And** K-009 regression `test_predict_1h_passes_history_1d_as_ma_history` 通過

## 優先級理由

**medium** — 不是 active bug（K-009 regression test 已鎖當下 call site），但屬於結構性 defense-in-depth 缺口。排程考量：

1. 改 signature 等於動 public API，應與 TD-007（`predictor.py` 拆分）同梯次處理，避免短期重複動同一檔
2. K-013（TD-008 Option C）落地後，predictor 層的 contract test 基礎設施會更完備，此時一併實作 Option A 成本最低
3. 目前排程 cycle #2~#6 已定，本票進 backlog，等 K-013 完成後再排程

## 下一棒

Backlog — 由 Architect 在 TD-007 RFC 啟動時（K-013 完成後）一併評估 Option A/B，產出 RFC 後 PM 裁決。若中途有新增 `find_top_matches()` caller，升級為 P1 立即處理。

## 相關連結

- [K-009 Reviewer S1](./K-009-1h-ma-history-fix.md#retrospective)（Suggestion 原文）
- [TD-010](../tech-debt.md#td-010--predictor-find_top_matches-ma_history-靜默-fallback)
- [K-013 TD-008 Option C](./K-013-consensus-stats-contract.md)（先行梯次）
- [TD-007 predictor.py 拆分](../tech-debt.md#td-007--predictorpy-拆分)（同梯次建議）
