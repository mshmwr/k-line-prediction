---
id: K-011
title: LoadingSpinner 文案中性化 — 加 label prop
status: closed
type: enhancement
priority: medium
created: 2026-04-18
closed: 2026-04-18
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

---

## Retrospective

### Engineer — 2026-04-18

**沒做好：**
- Ticket 原寫 callsite 在 `frontend/src/components/DevDiarySection.tsx`，實際位於 `frontend/src/components/home/DevDiarySection.tsx`。首次 Read 404 才 grep 出正確路徑。根因：沒先用 Grep 驗證 ticket 提供的路徑，直接信任。
- 預期有 E2E 或 unit test 斷言 `Running prediction...`，實際 grep 後只有 `PredictButton.test.tsx` 一處；該處 PredictButton 仍傳 `"Running prediction..."` 所以 test 無需改動。若 PM 要求統一改中文「預測中…」會觸發 Test Escalation Rule（斷言內容變更），幸好本票文案未變更該 callsite。

**下次改善：**
- 動手前先 `Grep "<組件名>"` 驗證 ticket 列出的路徑是否正確，若不符立即回報 PM 修正 ticket，不自行默修。
- 對 4 個 callsite 的中文文案選擇（BusinessLogic 用「載入內容中…」/ Diary 兩處用「載入日記中…」/ Predict 保留英文「Running prediction...」）應在實作前列清單給 PM confirm 一次，避免之後因文案風格被退回。

### Reviewer — 2026-04-18

**做得好：**
- 除紙上比對還實跑 `npx tsc --noEmit`（exit 0）與 `npm test`（36 pass / 6 files），獨立驗證 Engineer 回報屬實。
- Grep `LoadingSpinner` + `Running prediction` 兩個關鍵字全工作目錄，cross-check callsite 無遺漏、無 test 斷言漏網（`PredictButton.test.tsx:24` 英文斷言仍命中 PredictButton 保留的英文 label → AC-011-REGRESSION 自動保）。
- 對 3 條 drift 分別給出明確裁決（A 本票內修 / B 不動建議加 superseded 註 / C 拆 ticket），不讓 Engineer 回頭收拾無限 scope。

**沒做好：**
- `agent-context/architecture.md:139` 的「目前固定 Running prediction...」一行是 K-010 起 Architect 守則「結構/介面變更必同步 architecture.md」涵蓋範圍，但本票 Architect 裁決「無需 Architecture」時未指示 Engineer 順手修；Reviewer 階段才發現並建議 in-scope，延後了一棒。應在 Architect 放行時就攔截到。
- 3 條 drift 是 Engineer 主動提出的，但 ticket AC 階段從未把「文件同步」列入 scope；Reviewer 階段才做 in-scope / tech-debt 裁決，本該是 PM 在 ticket 初稿時就明確「含文件 / 不含文件」。

**下次改善：**
- Review 發現「架構文件 drift 根因是本次改動」且改動極小（單行）時，直接建議本票內修；同時回饋 Architect 裁決「無需 Architecture」流程補一句 checklist：「grep 組件名於 architecture.md，有過期描述列入 Engineer scope」。
- 面對已歸檔的設計 spec（`docs/superpowers/specs/*-design.md`），不強求同步內容，建議加「superseded by K-XXX」頭註，避免扭曲歷史快照。

**Drift 裁決：**
| Drift | 檔案 | 裁決 | 理由 |
|------|------|------|------|
| A | `agent-context/architecture.md:139` | **本票內修（建議 PM 放行 Engineer 補一行）** | 一行註解、不改設計、K-010 Architect 守則要求同步；留著會誤導下個 agent |
| B | `docs/superpowers/specs/k002-component-spec.md:99,111` | **不改內容，建議加 superseded 頭註（可拆小 ticket）** | spec 是 K-002 設計快照，改會扭曲歷史；加「superseded by K-011」即可 |
| C | `frontend/design/homepage.pen` | **拆 ticket → 技術債** | Designer agent 範圍，需 Pencil MCP 操作，不在 Engineer scope |

**Review 結論：pass with suggestions（無 Critical / 無 Warning / 1 本票內修建議 + 2 drift 拆單建議）。**

### PM 裁決（Review Suggestions）— 2026-04-18

| Drift | 檔案 | 裁決 | 理由 / 行動 |
|------|------|------|------------|
| A | `agent-context/architecture.md:139` | **本票內修（in-scope）** | 單行註解改動、K-010 起 Architect 守則要求結構/介面變更必同步 architecture.md；留著會誤導下個 agent。指示 Engineer 補完 — 將該行「← K-011 將加 label prop（目前固定『Running prediction...』）」改為反映新事實「← 接受 `label?: string` prop，各呼叫處傳入情境文案（K-011 完成 2026-04-18）」。不改本票 status=in-progress，Engineer 補完後才交 QA。 |
| B | `docs/superpowers/specs/k002-component-spec.md:99,111` | **拆新 ticket K-016（low priority）** | 已歸檔的設計 spec 是 K-002 時間點快照，改內容會扭曲歷史；正確作法是加「Superseded by K-011 (2026-04-18)」頭註，本票 scope 不含 spec 歸檔規範，拆小票單獨處理。 |
| C | `frontend/design/homepage.pen` | **登記技術債 TD-011** | Designer agent 範圍、需 Pencil MCP 操作 + 截圖驗證，工具鏈與 Engineer scope 不同；排在下次 Designer 進場時一併同步。 |

**Scope 增補（Drift A）：** 本票 AC 追加一條隱性驗收「architecture.md:139 行內 LoadingSpinner 描述反映 label prop 新行為」。Engineer 執行步驟：
1. Read `agent-context/architecture.md` lines 138–140 確認當前文字
2. Edit 第 139 行，將「目前固定『Running prediction...』」改為反映 label prop 已上線的敘述
3. 回報 PM 並交 QA（無需再跑 tsc/npm test，僅文件改動）

**下一棒：** Engineer（補 architecture.md 單行），補完後直接放行 QA。

**新增 ticket / 技術債摘要：**
- K-016（新）— K-002 component spec 加 superseded 頭註（low priority，backlog）
- TD-011（新）— Designer 範圍 homepage.pen spinner 文字節點同步

### QA — 2026-04-18

**驗收結果：PASS（go）**

| 項目 | 結果 |
|------|------|
| `npx tsc --noEmit`（frontend/） | exit 0 |
| `npm test` | 36 passed / 6 files |
| Playwright E2E | 45 passed / 45 total（12.6s） |
| AC-011-PROP | PASS — `LoadingSpinner` 已接受 `label?: string`，無 label 時 `p` 不渲染、`aria-label` fallback 到 `'Loading'`，prediction 字樣不會再出現在無 label 呼叫處 |
| AC-011-CALLSITES | PASS — 4 callsite：`BusinessLogicPage`「載入內容中…」、`DiaryPage`「載入日記中…」、`DevDiarySection`「載入日記中…」、`PredictButton`「Running prediction...」；每個 callsite label 與頁面任務情境吻合 |
| AC-011-REGRESSION | PASS — tsc / Vitest / Playwright 三層全綠；`PredictButton.test.tsx:24` 英文斷言持續命中 PredictButton 保留的英文 label，無需改動 |
| Drift A — `agent-context/architecture.md:139` | 已由 Engineer 補完，反映 label prop 新事實 |
| 視覺報告 | 跳過 — `frontend/e2e/visual-report.ts` 不存在（K-008 未完成）；視覺驗證請由 PM / 使用者在 Pencil / 瀏覽器手動確認 |

**做得好：**
- 三層驗證（tsc / Vitest / Playwright）全程實跑並以 tail 取得精確數字（36/36、45/45），而非依賴 Reviewer 段落數字 relay；Grep 4 個 callsite 的實際 label 字串，直接核對 AC-011-CALLSITES 的「情境一致」Then 子句。
- 主動核對 Drift A（`agent-context/architecture.md:139`）已由 Engineer 補完，未假設「PM 裁決後 = Engineer 必做完」，Read 檔案第 139 行原字重新驗證。

**沒做好：**
- 未獨立針對 `aria-label` fallback 邏輯（`label ?? 'Loading'`）寫 reproduce 驗證。雖 Vitest/E2E 皆通過，但 `LoadingSpinner` 本身**沒有**對應 unit test（現存 test 都是上層 PredictButton / AppPage），真正 fallback 行為靠 render 時走不同 branch 間接覆蓋；若未來有 callsite 傳空字串 `""`（falsy，會觸發「不渲染 p + aria-label 走 fallback」），本票無測試攔截。
- 無獨立驗證「既有 E2E 是否曾斷言 `Running prediction...` 文字」。Reviewer 段落已列 grep 結論（`PredictButton.test.tsx:24` 為唯一依賴點、仍保留英文），但 QA 層此次直接沿用結論，未獨立 grep `Running prediction` 於 `frontend/e2e/` 目錄 cross-check。

**下次改善：**
- (1) 共用 UI 組件新增 prop 的 ticket，QA 必須主動列「新增 callsite 的邊界條件」（空字串、undefined、極長字串、RTL / emoji）給 PM 評估是否補 unit test；若 PM 判定非 scope，也要在 retrospective 明記「這些邊界未覆蓋」作為未來 bug 線索。
- (2) 不沿用 Reviewer 的 grep 結論。QA 自己跑一次 `grep -r "Running prediction" frontend/e2e/ frontend/src/__tests__/` 再下 PASS，雙重確認無漏網。

### PM 彙整 — 2026-04-18

**跨角色重複問題：**

1. **「信任上游文字，未實地驗證」三起同源事件**
   - Engineer：信任 ticket 「預期異動檔案」清單的 `components/DevDiarySection.tsx` → 實際在 `components/home/`，Read 直接 404
   - Engineer：補 Drift A 時信任 Reviewer 段落引用的 `architecture.md:139` 原字，Read 回傳字元與預期 `old_string` 縮排不符，首次 Edit 失敗重試
   - QA：信任 Reviewer grep 結論，未自行 `grep -r "Running prediction" frontend/e2e/` 獨立 cross-check（QA 反省自認已是缺口）
   - 根因：**上游文字（ticket / reviewer 段 / reviewer grep 結論）被當「事實」直接引用到下游動作，而非「提示」觸發實地驗證**。
2. **「文件 drift scope 界定」在 Architect 放行時漏抓**
   - Reviewer 反省段已指出「Drift A 本該在 Architect 階段就 grep architecture.md 對描述」
   - 連續第二次：上一次 K-009 收尾（per-role log 有紀錄但 agent spec 未落地），本次 K-011 又在 Architect「無需 Architecture」裁決時漏做文件掃描
   - 根因：Architect 「無需 Architecture」時的 sanity check 清單從未形式化，Architect agent spec 也未補這條 grep 守則。

**流程改善決議：**

| 問題 | 負責角色 | 行動 | 更新位置 |
|------|---------|------|---------|
| ticket 預期異動檔案路徑錯誤讓 Engineer Read 404 | PM（ticket 起稿） + Engineer（動手前） | PM 起 ticket 時，對每個「預期異動檔案」路徑需 Glob 或 Read 先驗；Engineer 收到 ticket 後動手前一次 `ls` 或 `Glob` 掃 ticket 列出的所有 path，不符即回報 PM 修 ticket，不自行默修 | K-017 起 ticket template 增補；Engineer agent spec 補「預執行 path verification」checklist |
| QA 沿用 Reviewer grep 結論 | QA | 本票類「新增 prop 影響 N 處 callsite」型，QA 須自行跑一次關鍵字 grep 於 `e2e/` + `__tests__/` + `src/`，不得沿用 Reviewer 結論；在 QA 驗收表格新增「獨立 grep 驗證」欄位 | `~/.claude/agents/qa.md`（下次有權限編輯時補）+ K-Line `CLAUDE.md` QA section |
| Architect「無需 Architecture」時未掃 `architecture.md` drift | Architect | Architect 放行時，無論裁決「需設計」還是「無需設計」，一律先 `grep <組件名>` 於 `agent-context/architecture.md`，若有提及該組件的過期描述，列入 Engineer scope；此條已在上次 retrospective 識別但未落地，本次正式決議 | `~/.claude/agents/senior-architect.md` 補 checklist；`docs/retrospectives/architect.md` 本次由 Architect append 一筆「checklist 落地」反省 |
| 「Read 回傳縮排與實際字元不符」重試 Edit | Engineer | Edit 前固定先以 Read 小範圍（`old_string` 附近 5 行）取得真實字元，不憑記憶或 Reviewer 段落引用組 `old_string`；Edit 失敗一次即立即 Read 驗證，不盲目重試 | Engineer agent spec / K-Line `CLAUDE.md` Engineer section 的 Before-Edit Protocol |
| 視覺驗證缺口（K-011 QA 無法跑截圖報告，因 K-008 未實作） | PM | K-008（自動化視覺報告 script）優先級從 medium 上調 cycle #4 先做，取代 K-012 目前的 cycle #4 定位；理由：**連續 3 張票（K-009 / K-010 / K-011）都因 K-008 缺席而使 QA 視覺驗收層留空**，已成系統性缺口 | PM-dashboard.md 調整 cycle 順序（K-008 提前到 cycle #4、K-012 順延到 cycle #5、K-013 順延到 cycle #6） |

**裁決摘要：** 以上 5 條改善中，(1)(2)(4) 由 PM 於本次 retrospective 彙整即落地（本文件內記錄 + PM 下一次 ticket 起稿時套用）；(3) Architect checklist 落地需於下一次 Architect 進場或使用者授權編輯 agent spec 時處理；(5) K-008 優先級上調**需使用者最終核可**，本彙整建議「cycle #4 改為 K-008」並在 PM-dashboard 標註為 PM 建議，待使用者確認。