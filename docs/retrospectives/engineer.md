# Engineer Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 engineer agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（根因 + 測試/設計為何沒覆蓋到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 Engineer 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

## 2026-04-18 — K-010 Vitest AppPage 修復

**做得好：** 先跑 `npm test -- --run` 確認失敗點，再讀 MainChart 原始 DOM 才下手改 test + 加 `data-testid`，不靠猜。
**沒做好：** 原 test「display mode toggle does not trigger API recompute; predict always uses timeframe 1H」描述的是已消失的 right-panel display toggle（dual-toggle 架構），與 MainChart timeframe toggle 行為完全不同。單純改 selector 無法讓斷言通過 — 我初版只改 selector 導致 `/api/merge-and-compute-ma99` 誤觸發斷言。之後才重寫 test 意圖反映當前單一 timeframe toggle。這類過時斷言在上一輪 UI 重構（移除 right-panel toggle）時就該同步清掉，留到 K-010 才處理代表 CR 當時只看 tsc 沒跑 vitest。
**下次改善：** UI 結構調整 PR 的 CI 必含 `npm test`；Engineer 實作時發現刪掉某 UI 元件，主動 grep `__tests__` 目錄該元件名稱，一併更新 test 或在 ticket 裡標示後續要修的斷言。

<!-- 新條目從此處往上 append -->
