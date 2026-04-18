# PM Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 PM agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（根因 + 為何 AC/Phase Gate 沒抓到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落「PM 彙整」並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

<!-- 新條目從此處往上 append -->

## 2026-04-18 — K-010 Close + Retrospective 彙整

**做得好：** 收到各角色反省段後，識別出 Engineer / Reviewer / PM 三端各自寫了同一根因的改善（test 改動涉業務規則時無 escalation 節點），沒一條條獨立處理就了事，而是彙整為單一流程結構性缺口，對應更新三個 agent 文件的對稱位置（Engineer 加 escalation rule、Reviewer 加偵測規則、PM 加 Phase Gate 欄位），讓三端互相補位而非各寫各的。QA 截圖報告缺口（K-008 未完成）明確列為 tech-debt 追蹤、不當作正常通過，也不阻擋 K-010 close — 避免把流程缺口塞進「通過」欄位。
**沒做好：** 本次彙整時才第一次把三份反省並排讀，發現跨角色重複點；若 Phase Gate 結束時就要求 PM 先把三份反省並排比對再寫彙整，這個觀察本該早一輪出現。另外 K-010 closing 階段才補上「test 改動涉業務規則」Phase Gate 欄位，等於是事後補制度，K-009 / K-013 若在 K-010 close 前進入實作仍會踩同坑。
**下次改善：** pm.md「自動觸發時機」表再加一條「Retrospective 彙整前：先將各角色反省段平行讀一輪，找跨角色重複根因，再動筆寫彙整」；制度補丁（如本次 escalation rule）生效日期在 agent 文件明標「K-010 起」，並在 PM-dashboard 加 note 提醒進行中的 ticket（K-009 / K-013 等）在下次迭代套用。

## 2026-04-18 — K-010 Reviewer Warning 三條裁決

**做得好：** W1/W2/W3 逐條對照（red/scope/成本/修法成熟度）再分流，沒一律「記 tech-debt 了事」也沒過度全部拉回 Engineer loop — W3 為 doc level PM 自行 Edit 閉環，W1/W2 合併成單一 TD-009 + K-014 backlog 最低成本選項，理由寫進 ticket 與 TD-009 條目。開 K-014 時順手將「觸發排期條件」寫清楚（OHLCEditor 下次結構改動時捎帶修），避免變成永遠 stale 的 backlog。
**沒做好：** W1/W2 其實是 K-010 Reviewer 自己在反省段建議「以後所有 `getAllBy*()[N]` 一律列 Warning + 建議 follow-up」— 這是**本該在 ticket 建立階段由 PM 預先設好的 ticket scope discipline**，但 K-010 PRD 寫「若順手發現其他脆弱斷言，列入 ticket 回報，不在此 scope 修」只列了一半：Engineer/Reviewer 要怎麼回報、回報後 PM 是否一律開 follow-up、閾值在哪，沒定義，才會造成 review 結束時還要來回確認。
**下次改善：** ticket 模板「範圍」段加一行 boilerplate「**scope 外發現的同類問題一律列於 Retrospective `Reviewer 反省段`，PM 於裁決時明確決定 A/B/C，不落空**」；並在 senior-engineer agent 與 pm.md 各自加一條對應的 checkpoint，避免這種需要二輪溝通才能 close 的 trailing item。

## 2026-04-18 — K-010 業務規則裁決（R1 / R2）

**做得好：** 收到 Engineer 在 Implementation 段列出 R1 / R2 兩條 test-vs-prod 矛盾後，未急著放行 Code Reviewer，而是先查 git log（fb20f21「switch 1D flow to native timeframe contract」是刻意決策）+ 對照 PRD 既有 AC-1D-3（1D 模式需要 1D fields，反證 predict timeframe 必須跟隨 view）+ UX Notes Early MA99 loading state（toggle 走同一 pre-compute 路徑），三條證據到齊才做裁決，不靠直覺選邊。PRD 補 AC-010-R1 / R2 同時附脈絡段說明「為什麼生產碼行為合理、原 test 殘留的歷史原因」，避免未來有人回來看測試改動又被當成 bug。
**沒做好：** K-010 ticket 當初下 Architecture「無需 Architecture」是正確的（改動確實只是 selector），但 PM 自己在 AC 驗收清單沒攔到「test 斷言語意變更是否需要需求裁決」這個節點 — Engineer 遇到矛盾時自行擇一（改 test 符合生產碼），雖然方向對，但違反 engineer.md「不做需求決策」原則，PM 沒在 Phase Gate 清單明寫「test 改動若涉及業務規則變更需回 PM」，導致規則踩線只能事後補救。
**下次改善：** Phase Gate 結束清單加一條「若 test 改動涉及業務規則（行為、API payload、觸發時機）而非純 selector，必須升級 PM 裁決」；engineer.md 同步補這條 escalation rule；pm.md 的「自動觸發時機」表格加一列「Engineer 在 Implementation 段列出 test-vs-prod 矛盾 → PM 立即攔停做裁決」。

## 2026-04-18 — K-008 Triage

**做得好：** 使用者先給三條方向（priority medium / 獨立 ticket / MVP 不做 mapping），我逐條對照現狀（QA agent 結尾動作懸空、cycle #1~#5 無 UI）再裁決，沒盲推；另外主動抓出 MVP 仍有 3 條 blocking ambiguity（執行環境 / 登入頁 / ticket ID 傳入方式），在放行 Architect 前列出，避免 Architect 設計到一半卡需求。
**沒做好：** K-008 從 2026-04-18 建立當天就知道 QA 結尾動作會懸空，卻直接放 backlog 沒做 triage — 等使用者今天點名才動，triage 晚了一輪。根因：新機制啟用時 PM 沒反向盤點「此機制依賴哪些工具、工具是否 ready」，只記得把 retrospective 條目加進 CLAUDE.md，沒跟工具完備性連動。
**下次改善：** 新機制/新規範寫入 CLAUDE.md 或 agent spec 前，同步列「此機制依賴的工具清單 + 每項是否 ready」，未 ready 者當場開 ticket 並排 cycle，不留 backlog。
