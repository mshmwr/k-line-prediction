# Reviewer Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次 review 結束前由 senior-engineer agent（code reviewer）append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（本來該在更早的設計/AC 階段攔截到的問題）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 Reviewer 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

## 2026-04-18 — K-009 1H MA history fix

**做得好：** 除了紙上比對 diff，實際執行 stash push → pytest 單 test → stash pop 驗證 Engineer 聲稱「移除 fix 後 test 會失敗」屬實（`captured['ma_history']` = None，斷言 `is main._history_1d` 失敗）；同時跑全量 63 tests 確認 1D 分支與其他 endpoint 未受影響。Test 斷言只鎖參數身分（`is` / `is not`），Test Escalation Rule 自動合規。

**沒做好：** Architect 把「predictor 層 ma_history 靜默 fallback」列為 defense-in-depth 選項並授權 Engineer 自裁；Engineer 拒絕並標技術債後通過。但此決定本質是把根因留原地，未來新 caller 仍可能重犯 — 我作為 Reviewer 接受此選擇，僅把它列 Suggestion 上送 PM，沒主動要求開 follow-up ticket 追踪技術債（容易被遺忘在單票 Retrospective）。

**下次改善：** 遇到 Engineer 明示「保留技術債 + 寫在 Retrospective」的情況，review 必同步建議 PM 開 follow-up ticket（不一定立刻做，但至少 ticket queue 有條目），避免 Retrospective 被當作 garbage collection；同類靜默 fallback / optional 參數陷阱在未來 review 預設標 Warning 而非 Suggestion。

---

## 2026-04-18 — K-010 Vitest AppPage 修復

**做得好：** 除了紙上比對還實跑 `npm test`（36 pass）/`tsc --noEmit`（exit 0）/`npx playwright test`（45 pass）三重驗證，沒只信 Engineer 的 Implementation log；同時 grep handlePredict / handleTimeframeChange 確認 test 斷言的 payload 與 production 行為完全一致（timeframe=viewTimeframe、toggle 只打 merge-and-compute-ma99）。

**沒做好：** K-010 原被標為單純 selector 修復，但 test 的行為斷言與生產碼矛盾（R1/R2）本應在 K-010 建立階段就透過「原 test 能否反映 production handler 今天的呼叫序列」這個檢查攔到；我作為 Reviewer 在更早的類似 ticket（如 K-005 / K-006 的 UI 改動）也未提醒「重構 UI 時 grep `src/__tests__/` 的舊斷言」，讓 dual-toggle 遺留斷言苟活到 K-010 才爆。

**下次改善：** Review checklist 加一條「UI/flow 重構 ticket 預設要求 Engineer 附 `grep -r <被改組件或 handler 名> src/__tests__/` 輸出」；我 review 到 test 改動時必用 grep 掃同名 handler 的所有 spec 依賴；遇到 index-based selector（`getAllBy*()[N]`）不管在不在 scope 內，一律在 Warning 欄列出並建議開 follow-up ticket。

---

<!-- 新條目從此處往上 append -->
