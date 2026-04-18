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

## 2026-04-18 — K-008 visual-report script

**做得好：** 沒只看檔案 diff，實跑 `npx playwright test --list`（無 project 篩選）重現「default E2E 流程會被 visual-report.ts 模組頂層 `resolveTicketId()` 印 warning 污染 stdout」的 side-effect（W1），抓到 Engineer / Architect 紙上審查漏掉的跨 project noise；並以 `path.join` 實測 `TICKET_ID=../../...` 算出預期外的 output path（W4），把「純理論威脅」轉成可觀察的行為。

**沒做好：** W1 的根因在 Architect §2.1 的設計「啟動時 stdout 印黃色警告」裡其實就埋了 — 「啟動」何時發生（module load / test body）沒被追問；如果設計階段要求把 side-effect 發生點寫明，Engineer 實作就會自然避開 module-level 執行。W4 的 path traversal 屬於「env var → filename 生成」類通用安全檢查，AC 階段沒寫 TICKET_ID 格式約束、Architect §2.1 也沒加 validation 條款，落到 Reviewer 才捕到；這是跨 role 的 checklist 缺口。

**下次改善：**
1. Review AC / Architect 設計文件時，遇「模組載入時 warning / console / fs / 啟動檢查」類語句，主動問「執行時機？誰會 import？」把 side-effect 發生點寫進設計或 AC。
2. 凡 AC 有「外部輸入（env var / URL param）→ 生成檔名 / 路徑」的場景，Reviewer checklist 加固定一條「驗證 whitelist / allow-list / path normalize 是否存在」；未來可把此條回推到 PM AC 模板，讓 K-Line 下一張類似 ticket 起就不漏。
3. 對 per-project testMatch / testIgnore 類 Playwright config 決策，Reviewer 除了驗證目前 spec 集合，還要主動指出「以後新增 spec 如何歸 project」的操作守則是否寫進 architecture.md（W2 的根源是 Architect 文件沒把 final 決策的副作用寫清楚）。

---

## 2026-04-18 — K-011 LoadingSpinner label

**做得好：** 除了對 4 個 callsite 紙上比對，還 Grep 全工作目錄 `LoadingSpinner` + `Running prediction` 兩個關鍵字，cross-check 沒遺漏任何 src / test / E2E 斷言；並實跑 `npx tsc --noEmit` + `npm test`（非信任 Engineer 回報），確認 `PredictButton.test.tsx:24` 的英文斷言仍命中 `PredictButton` 傳入的 `"Running prediction..."` label，AC-011-REGRESSION 自動保。

**沒做好：** Engineer 指出 3 條 drift（architecture.md / k002-component-spec.md / homepage.pen），但 ticket AC 從頭到尾只鎖「4 個 callsite 傳 label」，沒把文件同步寫進 AC。Architect 裁決「無需 Architecture」時其實已經知道 architecture.md:139 有「目前固定 Running prediction...」這行，卻未在裁決中指示 Engineer 順手修；結果全交給 Reviewer 裁 in-scope/tech-debt。這類「單行文件同步」本該在 Architect 放行時就標為 in-scope。

**下次改善：** Review 發現「架構文件 drift 根因是本次改動」時，若改動極小（一行），直接建議 PM 本票內修（不拆 tech debt）；同時回饋 Architect 未來裁決「無需 Architecture」時，加一句 checklist：「grep 過期描述，有則列入 Engineer scope」。對 spec 歷史文件（已歸檔的 K-00X-design）不強求同步，建議 PM 改為加「superseded by K-XXX」頭註，不動原內容。

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
