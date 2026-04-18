---
id: K-009
title: 1H 預測路徑使用錯誤的 MA history 來源
status: closed
type: bug
priority: high
created: 2026-04-18
closed: 2026-04-18
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

---

## Retrospective

### Engineer

**2026-04-18**

**做得好：** TDD 順序走完（先 failing test，確認 `captured['ma_history']` 是 `None`，再動生產碼）。test 用 monkeypatch 攔截 `find_top_matches`，只鎖「參數身分」（`is main._history_1d` + `is not captured['history']`），完全避開 MA99 / correlation 業務值斷言，規避 Test Escalation Rule。fix 採 1H/1D 分支拆分實作（if is_1d / else），1D call 一字不動，縮小 blast radius。
**沒做好：** 選擇不做 defense-in-depth warning — 理由是 predictor 層 log warning 無法阻止未來新 caller 重蹈覆轍（只能 post-hoc 告知），而改為 raise 又會誤傷 1D 路徑既有呼叫（`_history_1d` 既是 history 也是 ma_history 時本是合法）。此技術債（signature 靜默 fallback）未在本票內解決，需 Architect 後續裁決是否改為 required keyword。
**下次改善：** 若後續 K-xxx 新增 `find_top_matches()` caller，PR description 必須列「有無傳 ma_history」；或提票讓 Architect 評估把 `ma_history` 改成 required，一次杜絕此類 bug。

### Reviewer

**2026-04-18**

**Correctness（AC-009-FIX）：PASS。** `backend/main.py` L280-299 1H 分支顯式傳 `ma_history=_history_1d`，1D 分支維持原呼叫不動（1D 下 fallback `ma_history = history = _history_1d` 本來就對）。diff 限縮在 `predict()` try 區塊，無 side effect。

**Test quality（AC-009-TEST）：PASS（實測驗證）。** 執行 `git stash push backend/main.py` → `pytest tests/test_main.py::test_predict_1h_passes_history_1d_as_ma_history` → 確認 fail（`captured['ma_history']` = None，斷言 `is main._history_1d` 失敗）→ `git stash pop` 還原。Engineer「移除 fix 後 test 會失敗」的聲稱屬實。同時 `captured['ma_history'] is not captured['history']` 額外保護：即使誤把 `ma_history=history`（merged list）傳進去，該斷言也會攔截。

**Test Escalation Rule：PASS。** test 斷言只鎖參數身分（`is` / `is not`），無 PRD 業務值（無 MA99 threshold、無 correlation 分數、無 future_ohlc 數值），不需要升級為業務規則裁決。

**Regression（AC-009-REGRESSION）：PASS。** 全量 `python3 -m pytest` = 63 passed（基線 62 + 新增 1）。1D 分支 `test_merge_and_compute_ma99_1d_branch` 通過；auth / upload / parse 等 endpoint 無異動。

**Scope 拒絕合理性：accepted with tech-debt note。** Engineer 跳過 Architect 的「defense-in-depth warning」建議，理由（log 無阻擋力 + raise 會誤傷 1D 既有呼叫）有合理性，並將技術債（`ma_history` 靜默 fallback）明文記錄於上方 Engineer Retrospective。Architect 在設計 review 時已將其標為可選、授權 Engineer 自裁。**Reviewer 建議 PM 建立 follow-up ticket 追蹤此技術債**（見下方待 PM 裁決清單），避免僅靠 Retrospective 記錄而被遺忘。

**Diff hygiene：PASS。** 四個檔案改動範圍均在 scope 內（main.py、test_main.py、engineer retrospective log、單票 Retrospective）。無 unrelated 檔案異動、無 debug print、無格式走樣、註解有標明 K-009 原因。

---

**Critical：無**
**Warning：無**
**Suggestion（可選）：**
- S1. `find_top_matches()` 的 `if ma_history is None: ma_history = history` 靜默 fallback 是此 bug 根因；目前靠 regression test 鎖 caller 行為，未來新增 caller 若忘記傳仍會中招。建議開 follow-up ticket 由 Architect 評估兩條路徑：(a) 把 `ma_history` 改為 required keyword-only；(b) 在 `find_top_matches()` 內加 `timeframe == '1H' and ma_history is history` 的 assert/warning。

**待 PM 裁決清單：**
| 項目 | 類型 | Reviewer 建議 |
|------|------|--------------|
| S1 — predictor 層 ma_history 靜默 fallback | 技術債 | 開 follow-up ticket（不列入本票 scope），由 Architect 評估 (a)/(b) 方案 |

**裁決：放行 QA（無 Critical / 無 Warning）。** PM 收到 review 後裁決 S1 是否建票、何時排入 queue；此裁決不阻擋 K-009 流向 QA。

— senior-engineer, 2026-04-18

### QA

**2026-04-18**

**範圍確認：** K-009 為純後端修復（`backend/main.py` 1H 分支補 `ma_history=_history_1d` + 新增 regression test），無任何 `frontend/src/` 或 `frontend/e2e/` 檔案變動。依 QA agent 召喚時機 + K-Line CLAUDE.md Frontend Changes 規則，Playwright E2E 非必跑；本次採「後端全量 pytest + py_compile」雙把關。

**測試結果：**
- `cd backend && python3 -m pytest` — **63 passed, 1 warning in 35.57s**（AC-009-REGRESSION 基準：原 62 + 新增 1 = 63，對齊）
  - `tests/test_auth.py` 5/5 pass
  - `tests/test_main.py` 14/14 pass（含新增 `test_predict_1h_passes_history_1d_as_ma_history`）
  - `tests/test_predictor.py` 44/44 pass
  - 唯一 warning 為 starlette `python_multipart` PendingDeprecationWarning，與本次改動無關
- `python3 -m py_compile backend/main.py backend/tests/test_main.py` — **exit 0**（無縮排 / 語法錯誤）

**Playwright 跳過理由：** 本票 git diff 無 `frontend/` 檔案異動，UI 行為與呈現層均未觸及；跑 Playwright 僅會重複驗證 K-008 / K-010 既有 baseline，對 K-009 correctness 無增量信號。決策：**跳過 Playwright E2E + 視覺報告 script**，依 QA task 說明「無 UI 變化時可省」。

**視覺報告：** 跳過 `docs/reports/K-009-visual-report.html` 產出，理由同上（無 UI 變化）。

**Go/No-go 建議：放行 PM 進入 Retrospective 彙整階段。** 全量 backend regression 通過、無新增 failure、AC-009-FIX / AC-009-TEST / AC-009-REGRESSION 三條 AC 於 Reviewer + QA 兩輪驗證均 PASS。S1 技術債已由 PM 裁決開 K-015 / TD-010 進 backlog，不阻擋本票收斂。

**邊界提醒（給 PM）：** K-015 修復時，需特別覆蓋「未來新增 `find_top_matches()` caller 若忘記傳 `ma_history`」的 regression 測試點；單靠本票的 1H caller 專屬 test（`test_predict_1h_passes_history_1d_as_ma_history`）無法攔截「新 timeframe caller」類的 silent fallback bug。建議 K-015 AC 明文要求 predictor 層直接 assert / 改 required keyword。

— qa, 2026-04-18

### PM 彙整

**2026-04-18**

**跨角色重複問題：** Engineer / Reviewer / QA 三段都指向同一根因 — `find_top_matches()` 的 `if ma_history is None: ma_history = history` 靜默 fallback 是 caller 忘記傳參時的系統性風險來源：
- Engineer Retrospective 明文記錄為未解技術債，建議「若後續 K-xxx 新增 caller，PR description 必須列有無傳 ma_history / 或提票改 required」
- Reviewer S1 建議開 follow-up ticket 評估 (a) required keyword-only 或 (b) `timeframe == '1H' and ma_history is history` assert/warning
- QA 邊界提醒 K-015 修復時需覆蓋「新 timeframe caller」類 silent fallback regression 測試點

三角色對同一風險獨立提出 → 確認非孤立觀察，而是 predictor 層 API 設計缺陷。

**流程改善決議：**

| 問題 | 負責角色 | 行動 | 更新位置 |
|------|---------|------|---------|
| `ma_history` 靜默 fallback 技術債 | Architect | 評估 Option A（required keyword-only）/ Option B（1H-specific assert）→ 由 Architect 於 K-015 實作前裁決方案 | `docs/tickets/K-015-find-top-matches-ma-history-required.md` + `docs/tech-debt.md` TD-010 |
| Architect 段 conditional suggestion（「建議 X 但授權 Engineer 自裁」）無回收節點 | PM | Architect 段出現 conditional suggestion 時，PM 放行 Engineer 前必須補一行「Engineer 裁決結果無論選擇什麼，Reviewer 都必須在 review 時回收為 S/W/Critical 之一，不得省略」；pm.md 自動觸發時機表加一條「Architect 段含 conditional suggestion → PM 追蹤至 Reviewer 段明確回收」 | `~/.claude/agents/pm.md`（下次 session 補）+ 本次 `docs/retrospectives/pm.md` 已登記 |
| Silent fallback 類 API 設計 bug 需 predictor 層攔截，不能只靠 caller-side regression test | Architect（K-015 實作時） | K-015 AC 明文要求 predictor 層 assert / required keyword；regression test 必須覆蓋「新 caller 忘傳 ma_history」場景，而非只鎖 1H 現行 call site | K-015 ticket AC 段（已在 backlog，排期觸發條件已寫） |

**裁決：K-009 關票。** 三條 AC 全 PASS、63 backend tests 綠、S1 技術債已轉 K-015 + TD-010 進 backlog 不阻擋本票收斂。下一棒由主流程決定是否啟動 cycle #3（K-011 LoadingSpinner a11y label, medium）。

— pm, 2026-04-18
