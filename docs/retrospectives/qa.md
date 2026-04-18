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

## 2026-04-18 — K-008 QA 驗收反省

**做得好：** 6 步回歸不只機械執行，在 Step 3 HTML 產出後主動補跑「結構抽樣」驗證（`grep -c 'class="page-section'` = 5、`grep -o 'data:image/png;base64' \| wc -l` = 4、`grep -A1 'class="route"'` 列 5 條 `<code>` 路由標記），把 AC-008-CONTENT 條文「每張截圖有對應的 route path 標記」從「Engineer 自述」升級為「QA 獨立驗證」。Step 6 也額外執行 `git check-ignore -v` 確認 `.gitignore:32` rule 精確命中、無 overreach，不只看 `status` 輸出有無目標檔。

**沒做好：** W4 whitelist 的 negative path 只驗 PM prompt 指定的 `../../etc/passwd` 一個 payload；QA 應自備邊界清單（空字串、純空白、尾空白、`K-` 大小寫、Unicode、overflow 長度）主動擴展驗證面，但這次沒做。另外 `.gitignore` rule overreach 只做 `docs/reports/*.html` 單 rule 抽樣，未對 `dist/`、`coverage/`、`node_modules/` 內常見產物目錄各抽 1 sample 跑 `check-ignore` 確認未誤傷。HTML size 驗證僅比 `>500KB` / `<10MB` 門檻，若未來產物結構大幅異常（例：24 張截圖擠成 1 MB，或某條 route 變空），size 仍會落在範圍內，size 不足以當 structural invariant。

**下次改善：**
1. **邊界 payload 清單固定化** — QA 自備 fixed checklist（空字串、純空白、尾空白、大小寫、Unicode、overflow 長度）隨任何 env var / CLI 輸入 ticket 一起跑，不等 Reviewer / PM 在 prompt 列 payload。
2. **gitignore 跨產物 sample 檢查** — 凡修改 `.gitignore`，QA 對 repo 內常見產物目錄（`dist/`、`coverage/`、`node_modules/`、`docs/`）各抽 1 個 sample 檔案跑 `git check-ignore -v`，確認 rule 精確，不靠「只看目標檔是否被 ignore」單點判斷。
3. **Artifact 內容抽樣作為 invariant** — HTML / JSON artifact 不只看 size；每種 artifact 定義 1~3 個結構 grep 作為 AC 的 operational invariant（本票 `<section>` 數、base64 圖數、route 標記清單），寫進 QA 驗收章節當證據，不靠 Engineer 自述。

---

## 2026-04-18 — K-011（LoadingSpinner label prop 回歸測試）

**做得好：** 三層驗證（tsc exit 0 / Vitest 36 pass / Playwright 45/45）全程實跑並 tail 輸出驗證精確數字，未沿用 Reviewer 段落 relay；主動 Read `agent-context/architecture.md:139` 確認 Drift A 已由 Engineer 補完，不假設「PM 裁決 = 已執行」。補執行「獨立 grep `Running prediction` 於 `frontend/` 全樹」作為雙重驗證，確認 `frontend/e2e/` 無任何斷言依賴、`PredictButton.test.tsx:24` 為唯一依賴點、`homepage.pen:4825` 為 TD-011 已登記項，無漏網。

**沒做好：** `LoadingSpinner` 本身沒有 unit test（現存 test 都走上層 PredictButton / AppPage 間接覆蓋），對 `label` 的 falsy 邊界（空字串 `""`、`undefined`、極長字串）與 `aria-label` fallback（`label ?? 'Loading'`）未有直接斷言；若未來新 callsite 誤傳空字串，行為是「不渲染 `<p>` 且 `aria-label` 走 fallback」，本票無測試攔截此情境。此外，未主動在 retrospective 中將這些邊界列成「K-011 未覆蓋」的 follow-up 清單交 PM 評估是否需要補 unit test。

**下次改善：** (1) 共用 UI 組件「新增 prop」類 ticket，QA 必主動列「新 callsite 的邊界條件」（falsy 值、極長字串、RTL / emoji）給 PM 評估是否補 unit test；即使 PM 判定非 scope，也要在 retrospective 明記「這些邊界未覆蓋」供未來 bug 溯源。(2) 沿用 Reviewer grep 結論前，自己跑一次獨立 grep（`frontend/e2e/ frontend/src/__tests__/ frontend/src/`），把 Reviewer 的結論當 hypothesis 而非 fact，發出 PASS 前必有 QA 自行 grep 紀錄。

## 2026-04-18 — K-009（1H MA history fix 回歸測試）

**做得好：** 實跑 `python3 -m pytest` 取得完整 63 passed 數字，並與 ticket AC-009-REGRESSION 基準（18 + 44 = 62 + 新增 1 = 63）逐項 cross-check 對齊；同步跑 `py_compile` 雙檔確認無語法/縮排漏網。跳過 Playwright 的決策明確寫進報告並附理由（無前端 diff、無 UI surface），不用「沒時間」含糊帶過。

**沒做好：** 未執行單點驗證「移除 fix 後 test 會失敗」—— 雖然 Reviewer 已實跑 `git stash` 驗過（ticket Reviewer 段有記錄），但 QA 層面未再獨立覆核，純粹 relay Reviewer 結論；若 Reviewer 記錄本身有誤（此次無，但流程上不應假設），QA 等於失守。此外，S1 技術債（predictor 層靜默 fallback）已開 K-015，但 QA 未主動列出「未來新增 `find_top_matches()` caller 時，測試需攔截此類 regression」的邊界條件清單給 PM。

**下次改善：** (1) 後端 bug fix 類 ticket，QA 必須獨立執行「reverse-fix → test fail → restore fix → test pass」一輪小驗證，不全然依賴 Reviewer 段落；(2) 看到「技術債已開票」的裁決時，QA 主動在 retrospective 註記該 follow-up 需要的 regression 測試覆蓋點（例如：K-015 解掉時必須附「新 caller 忘記傳 ma_history」的 predictor 層 assert test），避免技術債修復時又踩相同坑。

## 2026-04-18 — K-010（Vitest AppPage 修復）

**做得好：** 三重回歸（Vitest 36/36、tsc exit 0、Playwright 45/45）全程實跑並 tail 輸出確認數字，不信 Implementation log；額外 grep `chart-timeframe-` 比對 testid 在 E2E 是否被依賴，釐清本次 DOM 改動的 blast radius 只在 Vitest，E2E 無回歸風險。

**沒做好：** 未跑 Vitest coverage 確認 Engineer 是否意外讓既有 test skip 或改判（只看 pass 數無法偵測「斷言被削弱」），本次靠 review 手動檢查 test diff 間接證明，程序上有漏洞；截圖 script 仍缺（K-008 未實作 cycle #6），本次跳過但流程定義上 QA 尾段是缺的。

**下次改善：** (1) 日後 Vitest 涉及改寫斷言的 ticket，QA 必加跑 `npm test -- --run --coverage` 比對 coverage diff（或至少 read 改動的 test 原/新 diff）再聲明 PASS；(2) 在 K-008 實作前，QA 的「截圖報告」欄位採固定「跳過（K-008 未完成）」而不逕自聲稱流程完整，避免 PM 誤解。
