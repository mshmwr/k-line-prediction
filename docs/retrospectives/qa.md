# QA Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 qa agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（哪些回歸測試設計不足 / 邊界沒覆蓋到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 QA 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

<!-- 新條目從此處往上 append -->

## 2026-04-18 — K-010（Vitest AppPage 修復）

**做得好：** 三重回歸（Vitest 36/36、tsc exit 0、Playwright 45/45）全程實跑並 tail 輸出確認數字，不信 Implementation log；額外 grep `chart-timeframe-` 比對 testid 在 E2E 是否被依賴，釐清本次 DOM 改動的 blast radius 只在 Vitest，E2E 無回歸風險。

**沒做好：** 未跑 Vitest coverage 確認 Engineer 是否意外讓既有 test skip 或改判（只看 pass 數無法偵測「斷言被削弱」），本次靠 review 手動檢查 test diff 間接證明，程序上有漏洞；截圖 script 仍缺（K-008 未實作 cycle #6），本次跳過但流程定義上 QA 尾段是缺的。

**下次改善：** (1) 日後 Vitest 涉及改寫斷言的 ticket，QA 必加跑 `npm test -- --run --coverage` 比對 coverage diff（或至少 read 改動的 test 原/新 diff）再聲明 PASS；(2) 在 K-008 實作前，QA 的「截圖報告」欄位採固定「跳過（K-008 未完成）」而不逕自聲稱流程完整，避免 PM 誤解。
