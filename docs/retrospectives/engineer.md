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

## 2026-04-18 — K-011 LoadingSpinner 文案中性化

**做得好：** 動手前先 `Grep "Running prediction"` 全專案盤出所有相依處（unit test / E2E / PRD / .pen / architecture.md），確認只有 PredictButton.test.tsx 一處有斷言，且 PredictButton callsite 保留原文案 → test 零改動，避開 Test Escalation Rule。
**沒做好：** Ticket 標示 callsite 為 `frontend/src/components/DevDiarySection.tsx`，實際在 `home/` 子目錄；首次 Read 報 404 才 Grep 修正。根因：我信任 ticket 路徑直接 Read 而非先 Grep 驗證，違反「聲稱檔案不存在前先查根目錄」memory 的延伸精神（信任外部提供的路徑也該先驗）。
**下次改善：** 接到票第一步固定 `Grep "<主組件名>"` 列出實際 import 路徑，再比對 ticket 預期異動檔案清單；不一致立即回報 PM，不自行默修。

---

## 2026-04-18 — K-009 1H MA history fix

**做得好：** 先寫 failing test（monkeypatch `main.find_top_matches` 攔截 `ma_history` 做 identity 斷言），確認 None 真的出現再動生產碼；不涉及 PRD 業務規則，避開 Test Escalation Rule。fix 保留原 1D 分支不動，1H 分支顯式多傳 `ma_history=_history_1d`，盡量縮小 diff。
**沒做好：** `find_top_matches()` 的 `ma_history is None → ma_history = history` 靜默 fallback 是此 bug 根因，但修復僅補 caller，不動 signature（PM/Architect 已裁決維持選填）。未來類似 caller 忘記傳還是會中招，單靠此 regression test 鎖不住所有 call site。
**下次改善：** 之後若新增 `find_top_matches()` caller（或改簽章讓 ma_history 必填），同步在 predictor 層補 assert/log；目前已在 ticket Retrospective 記錄此技術債由 Architect 日後決策。

---

## 2026-04-18 — K-010 Vitest AppPage 修復

**做得好：** 先跑 `npm test -- --run` 確認失敗點，再讀 MainChart 原始 DOM 才下手改 test + 加 `data-testid`，不靠猜。
**沒做好：** 原 test「display mode toggle does not trigger API recompute; predict always uses timeframe 1H」描述的是已消失的 right-panel display toggle（dual-toggle 架構），與 MainChart timeframe toggle 行為完全不同。單純改 selector 無法讓斷言通過 — 我初版只改 selector 導致 `/api/merge-and-compute-ma99` 誤觸發斷言。之後才重寫 test 意圖反映當前單一 timeframe toggle。這類過時斷言在上一輪 UI 重構（移除 right-panel toggle）時就該同步清掉，留到 K-010 才處理代表 CR 當時只看 tsc 沒跑 vitest。
**下次改善：** UI 結構調整 PR 的 CI 必含 `npm test`；Engineer 實作時發現刪掉某 UI 元件，主動 grep `__tests__` 目錄該元件名稱，一併更新 test 或在 ticket 裡標示後續要修的斷言。

<!-- 新條目從此處往上 append -->
