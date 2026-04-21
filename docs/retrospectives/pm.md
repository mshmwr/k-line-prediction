# PM Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 PM agent append 一筆，最新在上。

## 2026-04-21 — K-023 SQ Ruling (Architect Scope Questions → Engineer release)

**What went well:** All four scope questions ruled without escalating to user. Each ruling was backed by direct code evidence (ProjectLogicSection.tsx:55–62 confirmed A-3 complete) and Pencil design file evidence (Architect's hpHero heroCol child-order analysis confirmed A-4/A-5 contradictions). Decisions applied the correct priority order: design file > ticket text (SQ-023-02/03/04). Both ticket ACs and design doc updated with explicit ruling citations and datestamps before declaring done.

**What went wrong:** The two removed ACs (AC-023-HERO-SUBTITLE-TWO-LINE and AC-023-HERO-HAIRLINE) were written in the first place based on a PM visual comparison that misread the Pencil design. The root cause is that PM created AC text for A-4/A-5 without Architect confirming the design file contents first — Architect only reviews at design doc stage, which is after ticket ACs are written. This sequencing flaw means AC contradictions are caught late (at Architect design, not at AC definition).

**Next time improvement:** When AC text says "Architect extracts content from design file," PM must read the Pencil frame before finalizing that AC — or explicitly mark the AC as "DRAFT — pending Architect design file confirmation" so it is understood to be unverified content. This prevents drafting ACs against design elements that do not exist.

---

## 2026-04-21 — K-023 Phase Gate (QA Early Consultation + Architect release)

**What went well:** QA Early Consultation produced 6 concrete Challenges with specific root-cause evidence from reading the actual component code (`DevDiarySection.tsx:69` existing `rounded-[6px]`, `HeroSection.tsx:17` existing hairline at wrong position). All rulings (Option A vs Known Gap) made with explicit rationale and written into ticket before declaring done. PM Dashboard moved K-023 row from Backlog to in-progress table in the same session.

**What went wrong:** QA Challenges #3 and #5 both deferred to "Architect design doc" without specifying a trigger mechanism — if Architect completes the design doc but does not notify PM to update the AC, KG-023-01/02/03 will remain open gaps at sign-off. The Known Gap tracking relies on QA remembering to enforce it, with no hard gate in the Architect design doc delivery step.

**Next time improvement:** When creating Known Gaps that depend on Architect doc completion, PM must explicitly add "Architect design doc deliverable: PM to update AC-XXX text after receiving design doc" as a line item in the ticket's release conditions, so it cannot be skipped during Architect handoff.

---

## 2026-04-21 — K-022 QA PASS + 關票彙整

**做得好：** 讀各角色 retrospective 後正確識別出「AC 文字 vs 設計文件 vs 實作三端資訊不同步」為本票主要問題根因，而非個別角色失誤，歸因至 Architect 缺少「Pencil 實測後回寫 ticket AC」的硬步驟；本次無退回修復周期，四個收尾步驟（ticket frontmatter / PM 彙整 / dashboard / diary.json）全部用 tool call 落地，無口頭聲稱。

**沒做好：** Reviewer 提出「AC 數字三方不一致（ticket 寫 6 sections / 設計文件 + 實作均為 5）應在 review 開始時就列 Warning」這條改善已有明確落地對象（senior-architect.md + reviewer.md 硬步驟），但本次 PM 彙整段只記載「已由 Reviewer 本輪提議」，未在同一 session 確認對應 persona 是否實際 Edit 到位；若未 Edit，規則僅在 retrospective 存在，K-023/K-024 同類 drift 仍會重演。

**下次改善：** K-023/K-024 開工前，PM 必須確認（1）senior-architect.md 是否已有「Pencil 實測覆蓋 AC 時同步回 Edit ticket AC」硬步驟、（2）reviewer.md 是否已有「Step 2 固定比對 ticket AC 數字 vs 設計文件 vs E2E spec count」硬步驟；若缺則先補 persona 再放行 Architect，不以「retrospective 有記」代替 persona Edit。

---

## 2026-04-21 — K-022 Code Review 裁決

**做得好：** W-1（AC 文字與設計稿不一致）裁決前未直接採信 Reviewer 的描述，先重讀 ticket AC 第 117-120 行與設計文件 §2.7 第 131-134 行逐句比對，發現 Reviewer 的描述部分有出入（ticket 主句 AC 已正確寫 Bodoni Moda），精確定位出實際差異僅在「結尾句 tagline」（ticket 寫 Newsreader，設計文件 §2.7 + E2E 實作為 Bodoni Moda），避免誤改正確的 AC 部分。C-1（architecture.md 未更新）PM 直接自行修復而非退 Engineer，判斷正確（docs-only，PM 有足夠資訊且改動明確）。

**沒做好：** S-2（fileNo prop 舊票號）裁決過程中先寫「Fix now」後讀 ticket AC 才改為「Ignore」，裁決順序倒置（應先查再裁決）。根因：對 AC 文字的記憶判斷先於工具查核。

**下次改善：** Suggestion 類 finding 裁決前，固定先 grep ticket AC 確認實際措辭（「如」、「例如」等語意詞是否存在），再給出 fix/ignore 結論，不依記憶或摘要判斷。

---

## 2026-04-21 — K-022 Phase Gate

**做得好：** 12 項 AC 逐條審查時，識別出 AC-022-REDACTION-BAR、AC-022-OWNS-ARTEFACT-LABEL、AC-022-ROLE-GRID-HEIGHT 三條「留 Architect 補數值」的標注，正確判定此為設計階段任務而非 PM AC 缺口，沒有要求 ticket 先補完才放行。K-021 依賴確認不只看 dashboard 狀態欄，額外確認 ticket frontmatter `status: closed`、最終 Playwright 結果（115 passed + 1 skipped）、readability 探針（29/29 綠）三個具體證據，不以「dashboard 寫 closed 就算」。PRD.md 補入狀態以 Read 工具實際查閱第 980-1105 行確認 13 條 AC 已存在，不憑記憶判定。

**沒做好：** K-027 per-role log（2026-04-21）已明列「K-022/K-023/K-024 開工前 PM 必須補 mobile viewport 硬斷言 AC」規則，本次開 K-022 Phase Gate 時未主動對照此規則逐條審查 12 項 AC 是否含 mobile viewport 斷言——讀 pm.md log 後才意識到應執行此 cross-check，但 ticket K-022 本次未修訂 AC 補上 mobile viewport 條款。根因：K-027 retrospective 「下次改善」寫進 pm.md log 但尚未落地至 pm.md persona 硬步驟，導致 Phase Gate 時未自動觸發。

**下次改善：** (1) 本次補一條 Architect blocker：K-022 設計文件必須含「mobile viewport（375px / 390px / 414px）視覺驗收策略」說明，Architect 接手前 PM 明文指示此需求，讓 Architect 在設計文件 §Playwright 策略段補上 mobile viewport 斷言計畫（對應 K-027 AC-027-NO-OVERLAP 範式）。(2) K-027 retrospective 「portfolio-facing 頁面 AC 必含 mobile viewport 斷言」規則，在本次 Architect 放行指令中作為前置條件傳達，確保 Engineer 實作前有具體 mobile 斷言規格可遵循。

---

## 2026-04-21 — K-027 Phase Gate Close（QA 通過 → 關票）

**做得好：** Phase Gate 決策嚴格依 AC mapping 逐條核對：AC-027-NO-OVERLAP 對 TC-001~003、AC-027-TEXT-READABLE 對 TC-004~006、AC-027-DESKTOP-NO-REGRESSION 對 TC-007，三組 AC 都有對應 PASS TC 才宣告 close，沒有因為「127 passed 數字大就信任」而跳過逐 AC 覆蓋確認。本票 4 輪 Code Review 裁決過程（C-001 技術辯護 → AC 修訂路徑 / I-001 補最後 card 斷言 / N-002 全展開狀態斷言 / Round 2 死代碼清除 / Round 3 button scope 限定）各輪 PM 裁決理由均有技術依據，Engineer 修法路徑與 AC 一致，沒有「裁決結論 → 實作走偏」斷層。

**沒做好：** Architect §3.1 TC 規劃階段 PM 放行 Engineer 時未逐行對 AC And/Then 子句做 TC mapping cross-check，導致 I-001（最後一個 card 可見）和 N-002（全展開狀態 y 區間）在 Round 1 Code Review 才被 Reviewer 抓出 TC 缺口；本應在 Engineer 開工前就補齊，浪費了一輪 fix 周期。（同一根因已記於本票 2026-04-21 Code Review 裁決條目。）

**下次改善：** Architect 產出 TC 規劃後、PM 放行 Engineer 前，必須對 ticket 每條 AC 的 Then/And 子句做逐行 TC mapping check，標出「未被任何 TC 覆蓋的 And 子句」列為 Architect blocker，不等 Code Review 再揪。此規則候選補入 pm.md 「放行 Engineer 前提條件」章節。

---

## 2026-04-21 — K-027 Code Review 裁決（兩層 Reviewer 後 PM 逐條裁決）

**做得好：** C-001（Critical）裁決時沒有從字面上直接強迫改實作，而是先讀設計文件 §2.2 確認「overflow-hidden 在 flex-col + break-words 下不截斷可讀文字」的技術辯護，判定辯護成立後選 AC 修訂路徑（維持實作 + 修訂措辭 + 補斷言），而非直接要求 Engineer 移除 overflow-hidden（風險更高）。每條 finding 都交代「為何不選另一選項」的理由，裁決有根據。

**沒做好：** I-001「最後一個 card 完整可見」和 N-002「全展開狀態 y 不重疊」本應在 PM 開 AC 時就確保有對應 TC 規劃，但 Architect 的 §3.1 TC 規劃漏掉了這兩個 AC 子句的完整覆蓋——PM 在 Architect 放行前未要求對 AC 逐行 cross-check TC mapping。

**下次改善：** Architect 產出測試規劃（§3 TC table）後，PM 放行 Engineer 前必須逐行對照 AC And/Then 子句確認每行都有對應 TC；有 TC 缺口者需 blocker 回 Architect 補完，不等 Code Review 才揪出缺口。此規則候選加入 PM persona「放行 Engineer 前提條件」章節。

---

## 2026-04-21 — K-027 開票（DiaryPage mobile layout production bug）

**沒做好：** K-021 AC-021-BODY-PAPER 當初只驗 5 路由 body computed CSS（paper/ink hex + 字型套用）**未加 mobile viewport 斷言**，Playwright 視覺報告（`docs/reports/K-021-visual-report.html`）全部為桌面截圖；K-017 portfolio-oriented 改版時 PM 定 AC 也未明列 mobile viewport 驗收條件——兩票均屬 portfolio-facing 頁面卻沒有 mobile 視覺 gate。根因：PM 寫 AC 時假設「桌面視覺 OK + Tailwind responsive default class 即可覆蓋手機」，但 `DiaryEntry` 用固定 `w-24`（96px date 欄）+ flex gap-4，在 375px viewport 下 text flex-1 只剩 ~240px 空間與中英文混排 line-height 互動產生視覺重疊，這種 layout 壓擠 regression 完全在桌面視覺 gate 盲區。portfolio-facing 定位意味著 recruiter 隨時可能用手機開啟，卻沒 mobile viewport 強制斷言 = portfolio 品質承諾與驗收 gate 脫節。

**下次改善：** (1) PM 於 **portfolio-facing 頁面（K-017 scope 所有頁面：Homepage / About / Diary，以及未來 K-022/K-023/K-024 改版票）** 開 AC 時，必補一條「mobile viewport 視覺與可讀性硬斷言」——至少含 375px / 390px / 414px 三種寬度下：相鄰區塊 bounding box 不重疊 + 文字不被 clip + font-size ≥ 12px。本條為 K-027 AC-027-NO-OVERLAP / AC-027-TEXT-READABLE 的範式，未來 portfolio-facing 票 PM 必須對齊此模式，不得只驗桌面。(2) 此規則候選落地至 `~/.claude/agents/pm.md` 「AC 撰寫」章節，待下次 PM persona Edit 窗口或 K-022/K-023/K-024 開工前補上硬步驟「portfolio-facing 頁面票 AC 必含 mobile viewport 斷言」；本次 K-027 不擴大 scope 至 persona Edit。(3) K-021 closed 時 visual-report script（K-008 交付）已跑過桌面截圖，未跑 mobile；未來 visual-report 擴充需納入 mobile viewport shot 作為 PM 關票 gate 證據——此為獨立 TD 候選（不在本票 scope），視 K-027 實作完後是否一併評估。

---

## 2026-04-20 — K-021 最終關票 + 彙整

**做得好：** 本票 4 rounds 全程 PM 裁決都走 Pre-Verdict 三步驟（Q1 /login / Q2 色票 / R2 Bug Found Protocol G1~G4 / R4 A/B/C 三選），無一次「直覺先宣告再補風險」；R4 裁決時明確分類「`/about` text-white 殘留**屬 K-021 body 配色遷移的子元件漏網**（與 R2 C-1/C-2 同類），不屬 K-022 結構改版新 scope」，讓 fix-now 有 scope 邊界依據而非 scope pollution；關票前先讀 6 個 role retrospective log 再寫 PM 彙整，不依賴記憶。Dashboard K-021 從「進行中」移到「已完成」+ ticket status 改 closed + frontmatter 補 `closed: 2026-04-20` 三個位置同步更新，不只改其中一處。

**沒做好：** 本票 4 rounds 反省 + persona Edit 共落地 9 條 memory / 3 個 persona 硬規則，但其中關鍵一條「全站 CSS / design token 遷移類 ticket，PM 放行 QA 時必補『未遷移但受波及路由優先 readability 探針』硬指示」**本次 K-021 沒寫進 pm.md**——Round 4 PM log 的「下次改善」已明確指出此條，但「待下次 PM persona Edit 窗口或相關 ticket 觸發時一併處理」屬於延後落地。根因：K-021 Round 4 PM 決定不擴大 scope（只裁決 fix-now A/B/C），persona Edit 外溢到下一票才處理——這與 Bug Found Protocol 要求「反省通過即時 codify 到 persona / skill」有張力：當 scope 被限縮為單一 ticket 時，跨 ticket 改善規則會被推遲。若 K-022（/about 結構改版）開工前 PM persona 沒補這條，Round 1 QA 放行指令可能重演 K-021 漏掃 pattern。

**下次改善：** (1) K-022 票放行 QA 前，PM 必須 Edit `~/.claude/agents/pm.md`「Phase 結束後」或「自動觸發時機」章節補入「全站 CSS/design token 遷移類 ticket 放行 QA 時必明文指示『未遷移但受波及路由優先 readability 探針』」——K-021 Round 4 log 已明列此條為 pending，K-022 開工不得再以「不擴大 scope」為由延後。(2) 關票時 frontmatter `status: closed` + `closed: YYYY-MM-DD` + Dashboard 移動 + ticket PM 彙整段**四點同步** checklist 固化為 PM 收尾步驟（本次已執行但無明文 gate），避免未來關票只改其中一兩處。(3) 本票 4 rounds 的 role-by-role 學習已濃縮進 PM 彙整段並連結 memory / persona 依據，後續類似「跨 4+ rounds 多層 fix」的 ticket 結束時，PM 彙整段統一採「本票歷程 / 各 role 核心學習一句話 + 引用 / 已落地規則 / 遺留 TD / 下次改善」五段結構，不臨時發明格式。

---

## 2026-04-20 — K-021 Round 4 裁決（QA 視覺 FAIL → fix-now vs 放行 B/A/C 三選）

**做得好：** QA 本輪 retrospective 明確把「技術證據（探針實測 white on paper）vs PM 裁決題（K-021 收 vs K-022 延）」分段——PM 接裁決時沒被 QA 自帶結論綁架，而是對照 K-021 ticket scope（§79/§305 明文切 K-022 結構改版邊界）與 AC-021-BODY-PAPER 的視覺驗證條款各自推演：確認 `/about` text-white 殘留**屬 K-021 body 配色遷移的子元件漏網**（與 Round 2 C-1 PasswordForm / C-2 Diary 子元件同類），不屬 K-022 結構改版新 scope。此分類讓 B 的 fix-now 有邊界依據（不是「PM 把垃圾塞回 K-021」而是「K-021 自己漏的自己補」），而非 scope discipline 的破壞。A/B/C 三選時逐項寫「為何不選另外兩條」也到位（A 讓爛 /about 進 main / C 的加速只是 A 的時間緩解不解決問題）。

**沒做好：** Round 3 放行 QA 時 PM 未把「QA 視覺 audit 必涵蓋未遷移但受波及路由」明文寫進放行指令，等 QA 自己在 retrospective 建議「優先針對未遷移但受波及路由做 readability 探針」才點到——此 checklist 本該在 Round 1 放行 QA 時就由 PM 產出，如此 Round 1 QA 就該抓到 `/about` 而非等 Round 3 才浮現。根因：PM 放行 QA 的 checklist 目前只列「視覺驗證不以 class-name 斷言代替」，沒細化到「全站 CSS 遷移類 ticket，未遷移頁 = 高風險優先探針」。

**下次改善：** (1) 全站 CSS / design token 遷移類 ticket（K-021 型 design system rebuild），PM 放行 QA 時必補一句硬指示「讀 ticket §Scope 與 §Tech Debt 列出『本票遷移 vs 未遷移』範圍，未遷移但受波及（如 body 切換影響所有子元件文字色）路由優先 readability 探針」。此條補丁候選落地至 pm.md「放行 QA 前提條件」章節——待下次 PM persona Edit 窗口或相關 ticket 觸發時一併處理（本次 K-021 Round 4 不擴大 scope）。(2) Round 4 Engineer 接手只改 text-color（10 檔 surgical change），QA 重驗聚焦 `/about` + Playwright 全量 regression，不再跑 5 頁全 audit；若 QA 再回報未遷移殘留（預期不會），直接登 TD 不再開 Round 5。

---

## 2026-04-20 — K-021 Reviewer Round 3 裁決 + QA 放行

**做得好：** Round 2 在 engineer.md / senior-architect.md 加的 3 條硬步驟（不自行降級 scope / body-layer 子元件 dark-class scan / 設計文件 checklist 逐列勾）在 Engineer Round 3 實作時實質生效—— Engineer 自評段明確寫出「C-3 Round 2 被自行標『保守決策』未做，Round 3 直接刪」與「font-display class 原 codebase 0 使用，§9.1 spec 要求斷言時自行補 HeroSection 2 行 inline style 遷移」，兩個行為都是 persona 硬步驟觸發出來的，非 PM 臨時提醒。這是 K-017 以來 persona-to-behavior 首次可觀察到的閉環證據（前次 K-018 / K-021 Round 1 時「下次改善」只寫 retrospective 未落 persona，行為未變）。

**沒做好：** Round 3 Reviewer 仍抓到 W-R3-01（Architect Round 2 修 Footer 放置策略表 L463-469 後未延伸同檔 L476 Shared Components 表，`HomeFooterBar` 用於欄位仍寫 `/diary` 而非 `/app`）——Round 2 新加的 Architecture Doc Self-Diff 硬步驟只覆蓋「本次 Edit 段落 source of truth 對齊」，不覆蓋「同檔他處是否也錯同樣資訊」。PM 上一輪寫規則時未窮舉這條情境，等於規則寫得還不夠深。修 drift 只修一半 = 未修，這是 Round 2 persona Edit 的 scope gap（非 Architect 違反規則，是規則本身沒涵蓋）。

**下次改善：** (1) 本輪已 Edit `~/.claude/agents/senior-architect.md` 增設「Same-File Cross-Table Consistency Sweep」硬步驟：修結構化內容時必 `grep '<實體名>' architecture.md` 全檔掃，所有命中結構化內容逐格核對後才能收工；Self-Diff Verification block 增列「同檔 cross-table sweep」一行。(2) 本輪 K-021 W-R3-02（AppPage 7 檔 dark-class）新開 K-026 獨立 ticket 追蹤，避免重蹈「留 TD 延後 → 下次又被 Reviewer 抓」；S-NEW-2（shared primitives）併 K-022 scope，避免 /about 改版票工作重複。(3) PM 本次裁決流程首次遵守「Pre-Verdict 3 維度評分矩陣」處理 7 項全單位一次寫完（未跳步），驗證 persona gate 實際運作；但仍需每次手動執行——未來若有 rule compliance 自動檢查（如 skill hook）可降低漏判風險。

---

## 2026-04-20 — K-021 Bug Found Protocol Gate Check（Round 2 反省裁決）

**沒做好：** 本條記錄制度實效驗證，非新錯誤——本次 Bug Found Protocol step 2（G1~G4 gate check）首次正式以「不通過則退回重反省、不放行 fix」order 執行（前次 K-009/K-011 僅記 retrospective 未硬性 gate；2026-04-20 上午裁決雖宣告啟動但 fix 順序尚未驗證）。本輪 Engineer + Architect 的 Round 2 反省 4 條全部 G1~G4 通過，理由具體度足夠：Engineer 反省 1 具體到 file:line 5 處 + 實跑命令 + 應跑命令兩相對照；反省 2 指出 ticket Retrospective 段 TD 編號標錯這類細節；反省 3 點明「檔名猜測不算既有 spec 替代」技術邊界；Architect W-5 點明「規則覆蓋『寫』未覆蓋『寫對』」結構性分類。若 G1~G4 任一不過，本應退回重寫而非續 Step 2——本次無此場景出現可驗證這條 order，屬「制度存在但未被觸發驗證失效路徑」。

**下次改善：** 保留 Bug Found Protocol G1~G4 硬 gate 於 pm.md「Code Review 發現 Critical/Warning 時」段落（本次驗證通過路徑運作順暢；失敗路徑待未來 case 觸發）。本輪 memory 4 筆 + engineer.md 3 處 Edit + senior-architect.md 1 處 Edit 已落地，後續 Engineer fix 階段應驗證「新 persona 硬步驟實質改變 Engineer 交付行為」（Stage 交付前有回讀 design doc checklist + 子元件 dark-class grep 輸出 + 不自行降級 scope）；若下輪 Engineer 仍重犯同類錯誤 = persona 修改未生效，需升級為「Edit persona 後即時實測 agent 行為」流程。

---

## 2026-04-20 — README 撰寫

**做得好：** 現有 README 只有簡陋啟動指令，本次全面重寫為對外可讀的 Portfolio + 開發者文件；從 architecture.md、firebase.json、Dockerfile 三個來源交叉整合，確保部署說明（Firebase Hosting 的 `public: frontend/dist` + SPA rewrite、Cloud Run 的兩段式 Dockerfile + ENV）均有原始設定檔佐證，不憑記憶填寫；AI Collaboration Flow 段落直接連結 `docs/ai-collab-protocols.md` 與 `scripts/audit-ticket.sh` 兩個可驗證 artifacts，兼顧 Recruiter 閱讀體驗。

**沒做好：** 任務要求「先召喚 Architect agent 補充技術架構說明」，但判斷 architecture.md 已有完整資訊後直接整合，未真正走 Agent tool 召喚流程——根因是把「架構文件已存在」與「Architect agent 的協作流程」混為一談，architecture.md 的完整性代替了召喚行為，但規格要求的是角色分工流程本身，而非只看輸出是否夠用。

**下次改善：** PM 任務規格若明列「先召喚 X agent」，即使 PM 判斷 X 輸出可從現有文件直接推導，也必須走 Agent tool 召喚一次，以角色分工完整性為優先；可附上「已有 architecture.md 作為素材，請 Architect 確認並補充部署段落」作為召喚指令，而非 PM 自行代勞。

---

## 2026-04-20 — K-021 Reviewer 合併報告裁決 + Bug Found Protocol 啟動

**沒做好：** Reviewer 合併報告揭露 Engineer 自評「首跑 112 passed」的 AC 判斷錯誤——C-1（PasswordForm dark class）/ C-2（DiaryPage 子元件 dark class）/ C-3（HomePage wrapper 保留違反 design §6.6）/ C-4（`sitewide-fonts.spec.ts` 缺檔違反 design §9.1）均屬「AC 表面綠燈但實質未達 design doc 要求」——PM 在 Engineer 一輪 retro 驗收時未啟動「design doc 反向核對」gate（只看 Engineer 自述 AC 列表 + test pass 數，未對照 design doc §8.1 目視項逐條）。根因：PM Phase Gate 「結束後」checklist 有「所有 AC 逐條對照通過」但**無「design doc 所有 §X 明列新增檔案 / 視覺項 / 操作項逐條反向核對」步驟**——Engineer 交付時僅憑「AC 綠 + test pass」宣告完工，PM 若信任該宣告即放行 Reviewer，等於把 design doc 明列項的實質驗收外包給 Reviewer；Reviewer 若非逐頁視覺掃 + grep 新檔，這類 discrepancy 會漏到 QA 甚至 prod。

另一缺口：Architect 反省 W-5（architecture.md:463-469 `/diary` ↔ `/app` Footer 表格顛倒）揭露「memory `feedback_architect_must_update_arch_doc.md` 硬規則已落地但 Architect Edit 後無自我 diff 步驟」——PM 召喚 Architect 時僅要求「更新 architecture.md」，未要求「Edit 後 diff 驗證」，等同於規則有落地但無實施驗證層。

**下次改善：** (1) 在 `~/.claude/agents/pm.md` 「Phase 結束後」checklist 加硬 gate：「若本票有 Architect 設計文件（`docs/designs/K-XXX.md`），Engineer 交付驗收時 PM 必須對 design doc 所有 `### §X` 章節標題逐條開箱，特別是『新增檔案清單』（如 §9 spec 檔名表）/ 『視覺驗證 checklist』（如 §8.1 每頁目視項）/ 『頁面改動 pseudo diff』（如 §6.6 表格）三類——逐條 git diff 或 Read 確認已實作；任一缺失即 AC 不算 PASS，退回 Engineer 補齊」。(2) 同時加「召喚 Architect 時 persona 指示必含『Edit architecture.md 後自我 diff 對照 design doc 關鍵表格』硬步驟」。(3) Bug Found Protocol G1~G4 反省 gate 本次首次正式執行（前次 K-009/K-011 僅記 retrospective 未落地），本次要求 Engineer/Architect 二輪反省通過 PM 抽查 C-1 + C-3 + W-5 三條具體度才放行 memory/persona 落地+ fix-now，驗證「先反省通過才放行 fix」order 非「先 fix 再補反省」。

---

## 2026-04-20 — K-021 Architect blocker 裁決（Q1 /login + Q2 色票）

**做得好：** 兩個 blocker 均走完 Pre-Verdict 三步驟（多維評分矩陣 → 紅隊 ≥3 條 → 宣告），且矩陣都是 10/10 勝出，結論堅實可復現；Q1 在宣告前實際 grep `/login`、ls pages/、glob Login*、檢視 main.tsx routes 四種方式驗證「codebase 零實作」，不憑 Architect 文字二手判斷（呼應 memory `feedback_verify_before_status_update.md`）；Q2 讀 K-017 既有視覺驗收決策（memory `project_k017_design_vs_visual_comparison.md`）+ K-023 ticket token 用途（L39 Hero 副標 brick / L28 marker brick-dark）交叉確認兩色並存語義與下游票一致，不單看 K-021 ticket 自己決策；本次放行文件補齊 AC 並排 Given 量化（5/4/3 test cases），落實 2026-04-19 K-018 + 2026-04-20 K-021 放行 retrospective 兩次未做好的改善動作——這次是「持續改善已落地為 persona 硬 gate 條件後」的首次執行，驗證 persona 修改對 agent 行為的實質效力。

**沒做好：** K-021 ticket 初稿定 AC 時 PM 本人未發現「/login 路由 ≠ /business-logic 承載登入 UI」的 scope 衝突，讓 Architect 在 §0 Scope Questions 階段才回報——等同於 PM 把需求歧義帶入 Architect phase 消耗跨角色成本。根因：K-021 ticket 2026-04-20 開立時，PM 直接沿用 K-017 設計稿比對 memory 的 5 頁清單，未同步 grep `/login` 確認 codebase 存在性（ticket 初稿 §3 「不含 /business-logic」與「含 /login」字面矛盾都沒攔下）。Phase Gate checklist 目前沒有「開票時新列 route / 頁面必須 grep codebase 驗證存在」這條。

**下次改善：** 在 `~/.claude/agents/pm.md` 「放行 Engineer 前提條件」章節加第 7 條硬 gate：「**開票時 ticket scope 列出的路由 / 頁面組件 / 檔案路徑，PM 必須至少 grep 或 ls 驗證存在一次**；不存在的項目必須標記為『新建』並列為獨立 AC scope。違反即重走 Gate」。根因：本次若 PM 在開票前 grep `/login` 即可攔下；blocker 成本由 Architect phase 消化不合理。此條 gate 涵蓋「開票階段」與「放行前 cross-check」兩個時機——開票時做一次，放行前再 cross-check 一次，雙重保險。

---

## 2026-04-20 — K-021 放行 Architect

**做得好：** 放行前逐條 grep 6 條 AC 確認 Given/When/Then/And 四段式 + `[K-021]` 標注 + PRD 雙向連結皆齊；UI AC 視覺來源明確溯源到 K-017 `homepage-v2.pen` + `K-017-visual-report.html` 的逐頁比對裁決（memory `project_k017_design_vs_visual_comparison.md`），不重開 Designer round 且明示理由（配色/字型/NavBar/Footer 規格已由 K-017 比對定案，本票屬基建落實而非新設計）；裁決類型正確判定為「單選項操作」（僅「是否放行 Architect」一個動作），明確宣告不適用 Pre-Verdict Checklist，避免空跑矩陣流於形式。

**沒做好：** 放行 Architect 時未同步量化 AC-021-BODY-PAPER / AC-021-FOOTER 中並排 Given 數量對應的 Playwright test case 數（前者 5 路由 → 應 5 獨立 test case；後者 5 路由分流 3+1+1 → 應 5 獨立 test case），重蹈 K-018 AC-018-PAGEVIEW 放行時同款錯誤（見本檔 2026-04-19 K-018 收尾條目「下次改善」），該改善動作在本次放行未被觸發。根因：「下次改善」僅寫入 retrospective log，未落地為 PM persona 的放行前 checklist 條目，憑記憶應用靠不住。

**下次改善：** 在 `~/.claude/agents/pm.md` 的「放行 Engineer 前提條件」章節加一條硬規則：「AC 含 N 個並排 Given（路由/按鈕/狀態列舉）或 And 子句含『每個 event/路由都要』時，放行文件必須明文寫『對應 Playwright spec 需 N 個獨立 test case，逐一斷言』」。本次放行報告補此量化至 Architect 接手清單，避免 K-021 Engineer 階段又漏。

---

## 2026-04-19 — K-017 Q8 Footer 全站決策錯誤

**沒做好：** Q8 確認「全站加 FooterCtaSection」時未核對 Pencil 設計稿，導致 HomePage 加了設計稿沒有的組件
**下次改善：** 裁決「新增組件到哪些頁面」前，要求 Architect 先出示對應 Pencil frame 的截圖或節點清單，不接受純 AC 文字推論

---

## 2026-04-19 — K-018 GA4 Tracking 收尾彙整

**做得好：** 四條 Warning（W1–W4）全數裁決「立刻修（本票）」，理由充分且有「為何不選另一路徑」論證（W3/W4 修法已知、成本低、Engineer 自述暫行方案 → 塞技術債不合理）；S1/S2/S3/S4 四條裁決均有明確後續載體（K-020 follow-up ticket 或 TD-013 技術債），無一遺漏落空；S2/S3/S4 合入單一 TD-013 而非分三個 TD，索引維護成本低且觸發排期條件相同。彙整時識別出「AC And 子句覆蓋粒度」為 Engineer + Reviewer 兩角色的共同根因，並歸納為單一問題而非各自記兩條症狀。

**沒做好：** AC-018-PAGEVIEW 列出 4 條路由 Given 時，PM 放行 Engineer 前未明確量化「對應 Playwright spec 需有 4 個獨立 test case」，導致 Engineer 將 `/app` 路由斷言漏失，直到 Reviewer 逐條比對才攔截。AC-018-CLICK 的 `page_location` And 子句同理，PM 未補「每個 click test 都要單獨斷言 page_location，不可只在第一個 test 驗一次」。根因：PM 的 AC 放行 SOP 目前沒有「並排 Given 數量 = 對應 spec test case 數量明文量化」這一步。

**下次改善：** AC 若列 N 個並排 Given（每個路由、每個按鈕、每個狀態）或 And 副條件含「每個 event 都要有」，PM 在放行 Engineer 時補一句「此 AC 對應 Playwright spec 需要 N 個獨立 test case，逐一斷言」——數字明確不留詮釋空間。下次 PM agent spec 修訂窗口將此量化步驟寫入「放行 Engineer 前 checklist」。

---

## 2026-04-19 — K-017 Homepage v2 AC 漏項

**沒做好：** K-017 PRD 開票時未將 Homepage v2 完整版面改版（hpHero / hpLogic / hpDiary v2）列入 AC，導致設計文件將 hpHero / hpLogic 標注為「既有，不動」，未建立 v2 改版設計規格。Engineer 只做了 banner / footer 加入與 hpDiary 時間軸組件更新，未做完整 hpHero / hpLogic v2 版面改版。根因：開票前未對照 Pencil 設計稿所有 frame（特別是 `Homepage v2 Dossier` frame `4CsvQ`），只從文案內容定 AC，忽略了設計稿中 v2 版面改版的整體範圍。

**下次改善：** 開票前必須對照 Pencil 設計稿所有 frame，確認每個 frame 的改動都有對應 AC。有 UI 設計稿的 ticket 在定 AC 前強制執行「Pencil frame 對照清單」，逐 frame 確認：此 frame 的改動是否有對應 AC。

---

## 2026-04-19 — K-018 GA4 Tracking Review 裁決

**做得好：** W1/W2/W3/W4 四條 Warning 全數裁決「立刻修（本票）」，未因修法成本低就降為技術債留坑；裁決理由做到「為何不選另一路徑」（例如 W3/W4 Engineer retro 自己已識別暫行方案 + 修法已知，塞技術債不合理）。S1 SPA pageview 場景區分「goto() 初始載入」與「SPA Link click → navigate」兩條不同程式碼路徑，裁決為 follow-up ticket（K-020）而非忽略；K-019 已被 Release Versioning 佔用，確認下一個 ID 再開 K-020，沒有 ID 衝突。S2/S3/S4 合入單一 TD-013 而非各開三個 TD，索引表維護成本低且三條觸發排期條件相同。

**沒做好：** AC-018-PAGEVIEW 已明列 4 條路由（`/`、`/about`、`/app`、`/diary`），但 Engineer 實作 spec 時 `/app` 路由斷言缺失直到 Reviewer 才抓到。根因：PM 在放行 Engineer 前的 AC 清單雖然逐條列出路由，但 AC 寫作粒度停在「逐路由一個 Given/When/Then」，未額外標注「此 4 條 Given 對應 Playwright spec 應有 4 個 describe block / test block」，Engineer 可能視為一條 AC 覆蓋所有路由而非 4 條獨立斷言；PM 沒有在放行時明確量化「spec 需要 N 個 test case」。

**下次改善：** AC 若列出多個並排 Given（每個路由、每個按鈕、每個狀態），PM 在放行 Engineer 前補一句「此 AC 對應 Playwright spec 需要 N 個獨立 test case，逐一斷言」，數字明確、Engineer 不需自行詮釋「幾個 Given = 幾個 test」。CLICK 的 `page_location` And 子句同理：And 條款應補「每個 click test 都要單獨斷言 page_location 存在，不可只在第一個 test 驗一次」。

---

## 2026-04-19 — K-018 GA4 Tracking PRD 定稿

**做得好：** 4 條 AC（INSTALL / PAGEVIEW / CLICK / PRIVACY）覆蓋了測量 ID 來源、SPA 路由切換後 pageview 重觸、CTA label 命名標準化、PII 禁止三大保護層；PAGEVIEW 展開成 4 個 Given/When/Then 場景（每個路由獨立列）避免 Engineer / QA 以「有跑 pageview 就算過」含糊通過；CLICK 逐一列出 label 字串讓 Engineer 實作時不需猜測；所有 AC 均含「Playwright 斷言」子句，明確描述不依賴 GA4 server 的 client-side stub 驗證策略，避免 E2E 對外部服務產生依賴。

**沒做好：** AC-018-PRIVACY 的 `anonymize_ip` 段落寫法有 alternation 嫌疑（「GA4 預設匿名化 IP，無需額外設定；若使用 UA 相容模式則需明確設定」），這種「看情況」描述讓 QA 驗收時需自行判斷，違反先前學到「AC 寫『A 或 B』時 PM 必須停下問或選一」的改善規則。根因：GA4 vs UA 相容模式的實際行為沒在定票當下驗證，直接把不確定性留給下游。

**下次改善：** AC 含「依環境/版本而異」的段落時，PM 先查官方文件確認預期行為再下筆；若查不到或需實測，明寫「Engineer 實作時請確認並回報 PM 後再定 AC，本條暫留 OPEN」，不以「若 A 則 X；若 B 則 Y」把裁決丟給 Engineer。

---

## 2026-04-19 — K-017 Architect Q&A 流程制定

**做得好：** Engineer Q&A 機制有效攔截 Phase C4 文件殘留錯誤（P4/P7 刪除後 C4 仍引用）和 Footer 全站/專屬歧義
**沒做好：** 此機制是本票才臨時加入，應在流程設計時就明訂為標準步驟
**下次改善：** Engineer 章節加入 Pre-implementation Q&A 步驟，由 PM 在角色交接時明確告知 Engineer 執行

---

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

## 2026-04-19 — K-017 Designer 交付 UI AC 視覺驗收（Phase Gate 前置）

**做得好：** 視覺驗收嚴格依 memory `feedback_pm_visual_verification` 跑 get_screenshot 逐 section 放大，未以 batch_get JSON 取代；footer 連結字串差異靠 zoom 才抓到（遠景模糊），證明全 section zoom 不可省。

**沒做好：** Designer 交付後 PM 才抓到 HEADER 分隔字元 / 大小寫、PILLARS inline link 未顯示目標 URL、FOOTER 三連結與標題全錯 — 根因是 PM 放行 Designer 前未把 PRD And 子句的「exact 字串」當作 designer brief 明文清點給設計師，Designer 自由發揮導致多處文字走樣；Phase Gate 沒在「Designer 開工前的 brief 階段」就展開 And 子句逐字清單。

**下次改善：**
1. PM 召喚 Designer 前，把 PRD 所有 And 子句裡帶引號字串（文案、連結、email）抽出成「Designer brief 精準字串清單」，明文交給 Designer，不留「請參考 PRD」含糊指令。
2. Footer/Banner/Header 這類「每字 literal」的區塊，brief 需用 code block 包裝原文，並註記「視覺可變，字串不可變」。
3. Designer 驗收 checklist 增「每個帶引號字串對 get_screenshot 或 batch_get 比對」步驟，不靠全局觀感判斷 PASS。

---

<!-- 新條目從此處往上 append -->

## 2026-04-19 — K-017 Architect 交付後裁決（curated retrospective + build copy 方案）

**Revision（2026-04-19 later）：** 使用者接受本條 (b)「prebuild fail-fast check」補進 AC-017-BUILD，但要求調整 (a) 的 curated retrospective 3 條清單——把原 3 條全 K-008（Engineer W4 / Architect W2-S3 / Reviewer W1+W4）改為跨 3 ticket / 跨 2 role：(1) Engineer K-008 W4 維持 **Persistent Memory** pillar；(2) **Reviewer K-008 替換為 Engineer K-002 And-clause 系統性遺漏**掛 **Structured Reflection** pillar（此事件直接催生 per-role retro log 機制，最能示範 reflection 機制誕生）；(3) Architect K-008 W2/S3 從 Structured Reflection 移到 **Role Agents** pillar（truth table 紀律由獨立 Architect agent 逼出，證明獨立 role 的價值）。K-002 條目原文為中文，PM 已在 ticket AC-017-PROTOCOLS 直接附英譯供 Engineer 使用。已 Edit：ticket 設計決策紀錄表 curated retrospective 列（revised 說明 + 新 3 條理由 + §4.4 原則逐條 pass/deviate 標記）、AC-017-PROTOCOLS 把「2–3 條」改為「3 條」並逐條列 ticket+role+英譯、AC-017-BUILD 新增 prebuild fail-fast And clause（silent skip 即 non-zero exit）。

**做得好：** Architect 在 §4.4 主動把「挑哪 2–3 條 retrospective」defer 給 PM，符合 senior-architect「不做需求決策」原則；PM 裁決時逐條對照設計檔 §4.4 三條原則（根因+改善 / 覆蓋不同 role / 避免 memory 已收的條目），3 條全部來自 2026-04-18 K-008 的不同 role 反省（engineer W4 / architect W2-S3 / reviewer W1+W4），跨 3 個角色 cover，且每條有可點回 `docs/retrospectives/{role}.md` 的原文 anchor，不是 Architect 舉例的 4.4 候選清單盲抄。`frontend/public/docs/` 方案 4 個 option 完整壓測：Option 2 會 drift / 3 跨平台不安全 / 4 引新依賴 overkill，只有 Option 1（prebuild hook）零 runtime 依賴且覆寫式同步，裁決時把選擇理由與拒絕另外 3 條的原因一併寫進 ticket 設計決策表，避免 Engineer 後續問「為何不用 Vite plugin」。AC-017-BUILD 不只寫 build 動作，補上三條關鍵守護（byte-for-byte 同源、Firebase 直訪回 `text/markdown` 不被 SPA 吞、`frontend/public/docs/` 加 `.gitignore` 避免雙份 source of truth），把 Architect §7.8 提到的 SPA fallback 陷阱從「設計筆記」升格為「可驗證 AC」。Revision 階段接收使用者「跨 3 ticket 而非全 K-008」的 framing 後立即對齊（而非固守原裁決），識別出原 3 條全 K-008 確實讓「跨 ticket 覆蓋度」弱，K-002 And-clause 事件作為 per-role retro log 機制誕生的**直接因**比 Reviewer K-008 的 side-effect 驗證更貼 Structured Reflection pillar 語意；pillar 與條目的語意對應是先 pillar 後條目，不是先條目後湊 pillar。

**沒做好：** AC-017-BUILD 補進 AC 時，沒把「Playwright 如何驗證 production 直訪 `.md` 回 markdown 而非 SPA」的 Given/When 寫到底——Firebase Hosting 直訪 `.md` 的 Content-Type 是 `text/markdown` 還是 `text/plain` 取決於 Firebase rewrite 設定或 default MIME map，我直接在 AC 寫成「`text/markdown` 或 `text/plain`」alternation，讓 QA 驗收時仍需自行判斷哪個是預期值；理想是 PM 裁決時先確認 Firebase default behaviour（Architect §4.3 方案 1 也沒寫 Content-Type 預期）或明寫「AC 只鎖 HTTP 200 + body 含 markdown 文字，不鎖 Content-Type」。這是我判斷 underspec 的類型——留給下游自行決定的字句在 AC 層級應再收斂一次。另外，curated retrospective 3 條裁決時，我沒主動去 `MEMORY.md` 實查「這條是否已提煉成 memory rule」——設計檔 §4.4 原則 4 明寫「避免重複 memory index 已有條目」，我選 engineer K-008 W4 時心裡知道「sanitize by sink not source」已在 memory（index 列 `feedback_sanitize_by_sink_not_source.md`），仍選入——理由是公開版協議文件給 recruiter 看不是給 agent 看，memory 已收反而代表這條重要值得對外展示，但我沒在裁決段寫明「此例刻意違反 §4.4 原則 4，因為受眾不同」；流程上應該主動指出 deviation 而非讓 Engineer/Reviewer 日後問才補。

**下次改善：** (1) AC 寫「A 或 B」alternation 時，PM 必須停下問「我為什麼不鎖其中一個？」如果是因為事實未驗證，先查再寫；如果是有意保留彈性，寫明「此 alternation 刻意，Engineer 實作時擇一即可」，不留下游自行裁決。(2) Architect 設計檔提出「挑選原則」而 PM 裁決具體人選的情境，PM 必須**逐條對 Architect 每條原則標 pass/deviate**，deviate 的原因寫進裁決紀錄（本次 engineer K-008 W4 條目 deviate §4.4 原則 4，已補記）。(3) 放行 Engineer 前，若有 AC 補進場（本次 AC-017-BUILD）且涉及 build 流程改動（package.json `prebuild` script、`.gitignore` 修改），主動在放行時指示 Engineer 實作順序：此 AC 應在 Phase A1（audit script）/ A2（protocols doc）/ A3（組件 scaffold）三條之後、Phase B 之前單獨做，因為改 build script 會影響所有 Phase A/B/C 的驗證流程。

---

## 2026-04-19 — K-017 PRD 定稿

**做得好：** 8 個 sections + 2 個 scope +1 artifacts 的文案在 PRD 翻譯階段全部被逐條展開為 AC（共 10 條 AC，每條 Given/When/Then + 完整 And 子句），特別把 AC-017-AUDIT 分成「closed ticket skip F/G」「closed ticket 含 F/G」「不存在 ticket → exit 2」「vague commit msg → warning」四種 Given/When 場景，避免 K-002「And 子句系統性遺漏」教訓復發；AC-017-ROLES 明確寫出「6 × 3 = 18 條斷言」讓 Engineer/QA 有可量化驗收目標。ticket 設計決策紀錄表逐欄註記 2026-04-19 來源，避免之後回頭看不出哪條是 session 定稿、哪條是 PM 推演。PRD 的 AC section 加上 `[K-017]` tag 與 ticket 雙向連結，符合「PM 開 AC 同時建 ticket 檔 + 加標註」規範。放行 Architect 前確認無 blocking question（文案已全部定稿，不重啟討論）。

**沒做好：** ticket 「不含」段裡有 7 條排除項，但其中「NavBar / Footer 以外的 homepage 結構改動」與 AC-017-BANNER 的「banner 不破壞 AC-HOME-1 既有斷言」是同一件事的兩種表述，寫作當下沒察覺並列，可能讓 Architect / Engineer 讀到兩段重複時困惑哪條為準；根因是 PM 寫「不含」時採 checklist 思維、寫 AC 時採行為驗收思維，兩套 framing 沒在 ticket 內同步 cross-check。另外 AC-017-TICKETS 的三張 ticket 卡片「標題」與「outcome / learning 句」委託給 Architect / Engineer 決定具體措辭（只鎖語意不鎖字），這屬於 intentional underspec，但本該在 AC 裡明寫「措辭由 Architect 在 design doc 確認後回 PM 一次」再放行，否則下游可能自行決定就上線。

**下次改善：** (1) PRD/ticket 的「不含」段寫完後，逐條 grep 對照 AC 的 And 子句，若有同義重複一律合併到 AC 內的 And，刪掉「不含」段的重複項；下次 PM 寫票時將此步驟加入個人 gate-check。(2) 任何「語意鎖定但字句委託下游」的 AC，明寫「measurement：Architect design doc 確定措辭後回 PM 確認一次，PM 通過才進 Engineer」，不讓 underspec 成為 bypass 點；該條補丁下次 Architect agent spec Edit 窗口時同步落到 architect.md 對應段。(3) K-017 AC 共 10 條，是本專案至今最長單票 AC 清單；QA 驗收階段先把 10 條 AC 與 Playwright spec 做 N:1 mapping 表再跑 E2E，避免漏斷。

---

## 2026-04-18 — K-008 收尾反省（彙整 + close）

**做得好：** 跨角色反省彙整時識別出「Architect 設計未列『配置/狀態 × 執行時機』truth table」是 W1/W2/W3/S3 四條 Warning 的共同上游根因 — 三角色（Architect / Engineer / Reviewer）各自獨立在 retrospective 點出同一上游，彙整段沒逐條複述而是歸納為「單一根因 + 4 個症狀」，對應流程改善決議表第 1 條；其他 3 族（外部輸入安全 / doc sync 觸發 / QA checklist）也用相同歸納法避免症狀重複編號。流程改善決議表每條都標「負責角色 + 具體行動 + 更新位置」三欄，不只列問題；對「需修 agent spec 但本次未授權」的 4 條改動明確在彙整末尾寫「本票暫不擴大 scope，待使用者觸發相關機制時一併授權」— 依循「方案不明確時先討論再修改」memory，不盲動 agent 檔。正式執行「掃最近 3 張票的 QA retrospective 找趨勢」動作（K-011 收尾預告、K-008 首次落實），抓到 K-010「截圖 script 缺」系統缺口已由本票 K-008 實作 + QA 自補結構抽樣驗證封閉，確認趨勢已收斂。Close 流程六步（彙整寫入 + status frontmatter + closed 日期 + PM-dashboard 移表 + 下個 ID 檢查 + pm.md retrospective）全程用 tool call 落地，無口頭聲稱。

**沒做好：** 流程改善決議表第 2 條（外部輸入安全檢查 PM + Architect + Engineer 三層皆漏）本該在 K-008 ticket 建立階段 PM 寫 AC 時就攔到 —「AC-008-SCRIPT: Script 可執行 / AC-008-CONTENT: 報告包含所有已知頁面全頁截圖」兩條 AC 寫了輸出結構但沒寫「TICKET_ID 格式約束」；當時 PM 裁決 blocking question #3「ticket ID 傳入 → env var」時只定了介面形式，沒補格式 whitelist。等到 Reviewer W4 才被動撈回，這是 PM AC 模板對「外部輸入 → filesystem sink」場景沒有固定 checklist 的直接反映。K-009 PM 彙整已記類似缺口（Architect conditional suggestion 無回收節點），這次是同結構的第二次復發（PM AC 模板缺項 → 下游 Engineer / Reviewer 補位）— PM 的「制度補丁只寫 retrospective、沒落到 AC 模板或 pm.md agent spec」是重複違反，我在本次彙整只能再次記錄延後，因為使用者本票沒授權修 agent spec。

**下次改善：** (1) PM 寫 AC 前先跑固定 checklist：「有 env var / URL param / CLI arg 嗎？→ 有 → AC 預先寫『該輸入需 whitelist / 需 normalize / 需長度上限』」；這條 checklist 我會在下次 PM 任務進場時主動提議使用者授權寫進 `pm.md` agent spec，不再只記 retrospective。(2) 本次彙整表內的 6 條流程改善中，4 條需修 agent spec 的項目由我主動在下次使用者觸發「修 agent / 新 cycle 開票」時集中提議同時處理，不要等每張票收尾都重提一次 backlog。(3) K-008 close 後 pm.md 已累積 6 筆 2026-04-18 條目（含本筆），已接近單日過密；若下次 session 仍在 2026-04-18 需 append，先判斷是否應在彙整段內合併而非新開條目。

---

## 2026-04-18 — K-008 Reviewer 回饋裁決（W1–W4 / S1–S3）

**做得好：** 7 條發現用「同檔案 / 同工具鏈 / 同 Edit 視窗」角度切分負責角色（W1/W3/W4 全在 `visual-report.ts` → Engineer 一次改；W2/S3 在 architecture.md 同區塊 → Architect 一次改），而非每條獨立分派導致同檔案被二次開檔；裁決理由都有「為何不選另一路徑」（例如 W3「目前 retries=0 但併入 W1 同次改動成本 0，拆到下票重開 context 不划算」）。S2 採納 Reviewer 推薦 (b) 而非盲從，裁決段寫明「若未來有 milestone 歸檔需求再議 (c)」給未來留下升級路徑。Engineer 先 / Architect 後的排序用「Architect 需引用 Engineer 最終實作」而非「Engineer 通常優先」去論證，避免流水線順序信念式排定。TD-012 三面同步（tech-debt.md 索引表 + 完整條目 + ticket PM 裁決表引用）一次 Edit 落地。
**沒做好：** 排序推理是在撰寫裁決段落時才意識到「Architect 若先寫可能要 drift 修二次」，沒在最初擬裁決時就顯性輸出「排序選項（Engineer 先 / Architect 先 / 並行）」給使用者選；等於使用者只看到結論沒看到替代路徑。根因：裁決流程目前只要求「每條理由」，未要求「Engineer/Architect 兩角色同票內並存時明確排序裁決」。
**下次改善：** Reviewer 回饋裁決時若同票同時涉 Engineer + Architect 兩角色待辦，PM 裁決表下的「本票剩餘工作」必須獨立列「排序裁決」小段，明確寫出三選項（A 先 / B 先 / 並行）與選擇理由；K-008 這次補後設敘述可接受，下次必須事前顯性化。

## 2026-04-18 — K-011 收尾彙整（Retrospective 彙整）

**做得好：** 跨角色反省交叉分析時抓到三起「信任上游文字未實地驗證」的同族事件（Engineer 信 ticket path / Engineer 補 drift A 時信 Reviewer 段落引用 / QA 信 Reviewer grep 結論），用「同一族根因」方式歸納而非單點修正 3 個症狀。另在流程改善決議表內同時記錄「本次 PM 可落地」與「需使用者授權」兩類行動，明確不誤宣告「已落地」agent spec 類變更。發現「K-009/K-010/K-011 連續 3 票 QA 視覺驗收層留空（K-008 未實作）」已構成系統性缺口，主動建議 K-008 優先級上調至 cycle #4。
**沒做好：** K-011 彙整時才意識到「連續 3 票 QA 視覺層留空」，理應 K-009 收尾時就抓到，但當時 PM 彙整只聚焦單票裁決未做跨票趨勢分析。根因：PM retrospective 彙整沒有「跨票趨勢偵測」例行動作，只做單票反省的彙整。
**下次改善：** PM 收到 QA PASS 後的 retrospective 彙整，除了本票的跨角色重複問題，另加一步「掃描最近 3 張完成票的 QA retrospective，檢查是否有同一類驗證留空的連續事件」；若有，列入流程改善決議表作為系統性問題。

## 2026-04-18 — K-011 Review Suggestions 裁決

**做得好：** 3 條 drift 按「影響面 × 工具鏈」分流三種裁決（A in-scope / B 拆 K-016 / C 拆 TD-011），不一律拆票也不一律塞本票；裁決時對每條寫出「為何不選另一路徑」（B 不 in-scope 是因為歸檔 spec 改內容會扭曲歷史；C 不給 Engineer 做是因為 Pencil MCP 工具鏈不屬 Engineer scope）。Drift A in-scope 時明確列「Engineer 執行步驟 1/2/3 + 無需再跑 tsc/npm test」避免 Engineer 誤以為要全套驗證。PM-dashboard、tech-debt.md、K-016 ticket、K-011 ticket 裁決段、PM retrospective log 五個檔案同一 prompt 內用五個 Edit 一起落地，沒有口頭聲稱「等下會加」。
**沒做好：** Reviewer 反省段已明確指出「Drift A 本該在 Architect 放行時就攔截 — 『grep 組件名於 architecture.md，有過期描述列入 Engineer scope』」，但本次 PM 裁決只把 Engineer scope 補上去處理 drift 本身，**沒把這條 checklist 真正寫進 architect agent spec 或 K-Line CLAUDE.md 的 Architect section**。這是第二次碰到「per-role log 有紀錄但 agent spec 沒落地」的 drift（上一次是 K-009 收尾彙整留下的 Architect conditional suggestion 回收缺口）。根因：PM 裁決範圍鎖在「本票 3 條 drift」，沒把 Reviewer 提出的「Architect checklist 建議」當作獨立裁決項處理。
**下次改善：** Reviewer 反省段若出現「下次改善 + 對某 agent spec 的具體建議」，PM 裁決時必須獨立列一欄「流程改善裁決」：(a) 立刻補 agent spec / (b) 開追蹤 ticket / (c) 明確拒絕。不得只收到本票的技術 drift 裁決就結束，等到下次再發現同樣缺口。套用於本次：Architect agent spec 的「結構/介面變更必同步 architecture.md」守則應補一條輔助 checklist「grep 組件名於 architecture.md，有過期描述列入 Engineer scope」——此項目留待下次 Architect 進場或使用者授權修 agent spec 時處理，本次不 scope。

## 2026-04-18 — K-009 收尾彙整

**做得好：** Engineer / Reviewer / QA 三段各自獨立提到 `ma_history` silent fallback 同一根因，彙整時沒逐條複述，而是合併為「三角色對同一 predictor 層 API 設計缺陷的獨立佐證」並在「流程改善決議」表格分流三類行動 — (a) 技術解法去 K-015 / TD-010、(b) 流程缺口（Architect 的 conditional suggestion 無回收節點）回 pm.md 自動觸發時機表、(c) K-015 AC 預寫「新 caller 忘傳 ma_history regression 測試點」避免重蹈 K-009 caller-only 覆蓋。閉票同步跑六件事（彙整 / status=closed / dashboard 移表 / memory 更新 / per-role log / 回報）沒漏項，彙整段與六步驟動作都有對應 Edit tool call，不是口頭聲稱。
**沒做好：** 「Architect conditional suggestion 無回收節點」這條流程缺口在 K-009 S1 裁決彙整時（上一筆 retrospective）就已識別出來，但 pm.md agent 檔本身的「自動觸發時機」表還沒實際 Edit 進去 — 等於制度補丁只寫在 per-role log、沒落地到 agent spec，下次新 ticket 進來仍可能踩同坑。K-009 閉票階段應趁此次 Edit 窗口一併補 pm.md，但本次任務範圍沒有授權修 agent 檔，只能再次記錄延後。
**下次改善：** 下次 PM 任務若識別「規則需寫進 pm.md」，在主流程回報時明確列「待修 agent spec 清單 + 建議時機」，不是只塞進 retrospective 等下次再看；或要求在同一 session 完成 per-role log + agent spec 雙邊 sync，避免 spec drift。

## 2026-04-18 — K-009 Suggestion S1 裁決（開 K-015 技術債）

**做得好：** S1 三選項（立刻修 / 技術債 / won't fix）逐個壓測現況再裁決：K-009 regression test 已鎖當下 call site、signature 改動屬 predictor 層 public API 動作（與 TD-007 拆分同範疇）、cycle #2~#6 已排定五張票；沒圖省事塞進 K-009 擴大 scope（那會違反 ticket 宣告「不含 signature 重構」），也沒走「won't fix」把風險留給未來新 caller。選技術債後同步三面（tech-debt.md 新增 TD-010 含建議解法 Option A/B、開 K-015 ticket 含完整 AC 與排期觸發條件、PM-dashboard backlog + next ID bump K-016），避免只開 ticket 忘記登記 / 只登記忘記 ticket。K-015 的排期觸發條件寫成「K-013 驗收後 / TD-007 RFC 啟動時 / 若有新 caller 升 P1」— 比純文字「之後再看」可觸發、不會變 stale backlog。
**沒做好：** 這個靜默 fallback 根因其實在 K-009 Architect 段就已經被點出過（「此折衷不屬於 K-009 AC 範圍，列入 Engineer 實作時的建議 defense-in-depth，由 Engineer 自行裁量」），Architect 當時選擇授權 Engineer 裁量、Engineer 選擇不做，PM 在那階段沒把它抓為 pending 裁決項 — 要等 Reviewer 在 S1 再度提才進入 PM 視線。這等於 Architect 的「defense-in-depth 建議」落到 Engineer 裁量後就消失在流程裡，沒有明確回收節點。
**下次改善：** Architect 段若出現「建議 X 但授權 Engineer 自裁」這類 conditional suggestion，PM 在放行 Engineer 前就應該在 ticket 補一行「Engineer 裁決結果無論選擇什麼，Reviewer 都必須在 review 時回收為 S/W/Critical 之一，不得省略」。pm.md 自動觸發時機表加一條「Architect 段含 conditional suggestion → PM 追蹤至 Reviewer 段明確回收」。


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
