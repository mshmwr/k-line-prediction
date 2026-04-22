## 2026-04-22 — K-035 Bug Found Protocol (Reviewer)

**做得好（具體事件限定）：** 無。K-017（2026-04-19）與 K-022（2026-04-20）兩輪 Step 2 depth review 皆未攔截 `frontend/src/components/about/FooterCtaSection.tsx` 這個 inline footer duplicate，且 retrospective 全無提及 `/` 與 `/diary` 已有 `HomeFooterBar.tsx` 可重用。reviewer.md 現有 Review Checklist 針對 shared-component placement 的 `architecture.md` 表格 cross-check 規則是在 K-021 Round 2（2026-04-20）才落地，當時 K-017 已 closed；K-022 在該規則落地後 review，仍未觸發檢查，因為 K-022 的改動 scope 被 Architect 限縮為「結構細節對齊」，未列 Footer 為改動對象 → Reviewer 在 §Plan Alignment 執行「out-of-scope 改動偵測」反向邏輯（只驗有無越界改未列檔），未執行正向邏輯（本頁該用 shared component 卻重造）。

**沒做好（根因 — Reviewer 本該在 Step 2 就攔下）：** reviewer.md §Review Checklist 現行條目：AC alignment、設計文件 spec 清單 vs 實作檔名、架構文件放置表、AC count vs impl count、Pure-Refactor Behavior Diff、Test vs Production 一致性、Python/FastAPI、React/TypeScript、Frontend Build Integrity，**無任何一條掃「頁面級 JSX 是否重造已存在的 shared structural chrome（footer / nav / hero）」**。K-017 當時 Reviewer 看到 `FooterCtaSection.tsx` 新增檔案，對照 AC 斷言「頁面底部顯示 CTA + footer 文案」全通過，未回頭問「為什麼不是 import `HomeFooterBar`」。K-022 Reviewer 在 reviewer.md 已補 shared-component placement 表 cross-check 硬 gate，但該 gate 的觸發條件是「shared component 改動」，K-022 改的是 About 內部 section 層級不是 Footer 本體，依規則未觸發 → 規則 scope 漏掉「新頁面 / 大範圍頁面改寫時反向掃既有 shared 是否被重造」這個正向 case。此屬 architectural smell 範疇，Reviewer 即使在 AC 未明文要求 shared footer 的情況下，**仍有責任**把「duplicate of existing structural chrome」升級為 Critical — 就像重複的 `<nav>` 會標 Critical 一樣，不該因「AC 沒寫」而降級。Reviewer 的角色定義就是「超越 AC 字面抓結構性問題」，否則 Step 2 depth review 與 superpowers 廣度掃描無差異。

**下次改善（具體硬 gate codify 進 reviewer.md）：**
1. **新增 Review Checklist 硬步驟「Structural Chrome Duplication Scan」（K-035 2026-04-22 入）**：對任何 page-level `.tsx` 新增或大幅改寫（新檔 / diff >50% / 列為「頁面 v2」），Reviewer Step 2 固定執行三步——
   - Step A：`grep -rn "<footer\|<nav\|<header" frontend/src/components/ frontend/src/pages/` 枚舉全站 structural chrome 來源，建 inventory 表（file → element 類型 → 使用路由）。
   - Step B：對 review 目標頁面 grep 同類 structural element（`<footer>` / `<nav>` / `<header>` / repeated CTA 大 block），找出 JSX 樹狀結構重疊 ≥3 elements 的 candidates。
   - Step C：比對 inventory，重疊者分類標註：(a) structural chrome（footer/nav/hero/page-header）重複 → **Critical**，阻擋 merge，要求抽 shared 或 justify 在 design doc；(b) content cards / section wrapper 重複 → **Warning**，列 TD；(c) utility primitives（Button / Badge 等）重複 → Suggestion 即可。
2. **AC 不要求 ≠ 可以不檢查**：reviewer.md 明文增註「shared-component reuse 屬 architectural smell 類檢查，即便 AC 未列，duplicate of structural chrome 一律升 Critical；不得以『AC 未要求』為理由降級。」理由：K-017 / K-022 兩輪 AC 都沒寫 "use shared Footer"，Reviewer 全部以「AC 全通過」結案，結果 duplicate footer 存活 6 天才被使用者肉眼抓到；這就是 Reviewer 角色失職。
3. **新頁面 / 頁面 v2 類 ticket 觸發「Shared Inventory Cross-Ref」硬 gate**：review 開場先 `ls frontend/src/components/` + `ls frontend/src/pages/` 列現有 shared 候選，對照本票新增/改寫頁面，逐項問「這個 shared 是否該被 import？如果沒有，design doc 是否明列原因？」未列原因 → Critical。此步應與「設計文件 spec 清單 vs 實作檔名 cross-check」並列，為 page-level ticket 的預設開場動作。

## 2026-04-22 — K-025 UnifiedNavBar hex→token + dual-rail spec upgrade (Step 2 depth review)

**做得好：** Pure-Refactor Behavior Diff Gate 按規執行：`git show main:frontend/src/components/UnifiedNavBar.tsx` 讀 OLD 後列逐分支 truth table（isActive=true / isActive=false / external=true / external=false / pathname==='/' / pathname!=='/'）7 格，每格 NEW className 與 OLD className 經 tailwind.config 解析後 computed color 完全等價（`#9C4A3B` ↔ `rgb(156 74 59)`、`#1A1814` ↔ `rgb(26 24 20)`、`#F4EFE5` ↔ `rgb(244 239 229)`、`/60` opacity modifier 保留），props 零異動、`TEXT_LINKS` 靜態常數不動、`renderLink` external / SPA 分支邏輯不動、`useLocation`+`pathname` 判斷不動。AC ↔ test count cross-check 通過（AC-025-NAVBAR-SPEC 5 And 家族 → spec 新增/改寫 5 tests）。dual-rail 斷言 rgb/rgba 格式用已存在的 `toHaveCSS` 實例（app-bg-isolation L119 / sitewide-body-paper L20）佐證 Chromium stringify 格式，無需冷啟實驗；/business-logic 路由 NavBar 實際掛載（BusinessLogicPage.tsx L90 `<UnifiedNavBar />`）經 grep 證實，`toHaveCount(0)` 斷言為「hidden-route behavior」而非「NavBar 未 render 的 false-green」。

**沒做好（本來該在更早階段攔截）：** AC-025-REGRESSION 的 4 條 `dist/assets/*.css` hex declaration grep（`color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`）作為等價性證據屬於 degenerate proxy — Tailwind JIT 對非 opacity-modified utility 輸出 `color:rgb(156 74 59)` 而非 lowercase hex，grep `color:#9c4a3b` 在 refactor 前與後同為 0（post-refactor dist 實測 0/7/0/3），pre==post 不變並非因為等價性成立而是因為 pattern 本身就測不到 brick-dark 與 paper 的主體 declaration。真正的 SSOT 是 `rgb(156 74 59)` (5 occurrences) / `rgb(244 239 229)` (5) / `rgb(26 24 20)` (7)，才是有 signal 的 invariant。此缺陷在 PRD QA Early Consultation Q1 採納時就應由 QA 或 Architect 追問「此 grep pattern 能否 capture 所有 declaration」，但當時 Q1 裁決用「dist grep pre==post」字眼結案，三方未對 pattern 覆蓋範圍追問。Engineer 在實作過程中自行發現並寫入 retrospective（§Next time improvement），屬下游 catch，不屬於 Reviewer 首攔的早期階段問題。

**下次改善：**
1. **QA Early Consultation 對 "grep-based equivalence proxy" 新增一步 SSOT 對齊檢驗：** 當 AC 引用「post-build grep 某 pattern 在 dist CSS 中 pre == post」作為等價性證據，QA 必須在 pre-Architect 階段先 `npm run build` 一次當前 main，把 grep pattern 跑過實際 dist/assets/*.css 並報告 raw count。若 raw count 為 0（或與可能的 SSOT 數量差距大），立即回 PM 要求 widen grep（例如補 `rgb(R G B` 形式）或換 strategy（例如 `.text-brick-dark` class 存在斷言）。此建議 codify 進 qa.md 硬步驟。
2. **Reviewer Step 1 pre-build sanity：** 深度 review 時對「dist grep 等價」類 AC，先跑實際 grep 報 raw count，不只看 pre==post 結果是否相等。本次若執行 `grep -c 'color:#9c4a3b' dist/assets/*.css` = 0 在 Round 1 就會浮上 pattern-degenerate 疑慮，而不是靠 Engineer retrospective 揭示；codify 為 reviewer.md §Plan Alignment 子條「equivalence-grep proxy raw-count sanity」。

---

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
## 2026-04-21 — K-031 /about BuiltByAI showcase 移除（Step 2 depth review）

**做得好：** AC-031 三條 AC 逐條到 Playwright 層：AC-031-SECTION-ABSENT 用 id + heading role + caption text 三重 toHaveCount(0) 斷言（不是 not.toBeVisible，真正 deleted-from-DOM 語義）；AC-031-LAYOUT-CONTINUITY 用 nextElementSibling 直接斷 DOM adjacency（Architect §7 已 pre-verify SectionContainer emits <section>，Engineer read 過再寫）；AC-031-K022-REGRESSION 靠既有 about-v2.spec.ts 39 cases 全 pass 佐證。architecture.md §8 self-diff 3 drift（L13/L140/L410）git diff 對照 row-by-row 全落地，Changelog entry 已補 L585。file deletion 用 git rm 不是 rm，staged 狀態 clean。Pencil .pen 194 行 S7 block 整段刪，JSON schema 驗 OK，homepage BuiltByAIBanner frame 完好。out-of-scope 三項（BuiltByAIBanner / Nº 01–05 / FooterCtaSection）grep + ls 驗證全數未動。

**沒做好：** 無 Reviewer 此輪可抓早一點的問題。票乾淨、AC count / 設計文件 / 實作三者 count 一致（7 sections 全鏈路對齊），Engineer retro 自己抓到 worktree `node_modules` 缺漏屬於自運維範圍不涉及 review。唯一 observation：Pencil MCP offline 導致 Designer 無法輸出 get_screenshot，Designer retro 已明示 fallback 至 JSON + grep 三路交叉驗 + 主動要求 PM/使用者目視確認——此屬合理降級，不構成 MERGE blocker（純 removal，視覺變化 = 無此 section，無可「看錯」空間）。

**下次改善：**
1. **視覺 artefact deletion 類 ticket 的 Pencil screenshot 降級規則：** 當 ticket 屬 pure-removal 且 Designer JSON-level grep 已證殘骸為零時，MCP offline 不 block PM 驗收；Reviewer 負責在報告明示「視覺驗證 fallback 至 JSON schema + structural grep，無 screenshot」給 PM 裁決。無需 codify 進 persona（此為 Designer retro 已處理的議題；Reviewer 只做 relay）。
2. **worktree node_modules 缺漏觀察：** Engineer retro 自提首次進入 `.worktrees/K-031` 需 `npm install`，屬 engineer.md Pre-Implementation Checklist 改善範圍，非 reviewer 規則；Reviewer 執行深度 review 時本次先遇到 tsc 跑不動就自己 npm install，不阻塞 verdict。


## 2026-04-21 — K-013 Round 2 Fix Pack (Step 2 專案深度)

**做得好：** Gate 1 Pure-Refactor Behavior Diff 我主動重跑 5 輸入路徑 dry-run（`appliedData.stats=null` / full-set×bars≥2 / full-set×bars<2 / subset×bars≥2 / empty matches），逐列對照 Engineer L268-274 table，五列全綠（consensusForecast1h/1d 在 R2 `displayStats` spread pattern 下恢復與 OLD `b0212bb` L224-226 一致的無條件注入語意，其他欄位如 winRate/meanCorrelation 走 full-set=backend baseline 為 K-013 AC-013-APPPAGE 刻意行為非 regression）。Gate 4 Architecture Doc cross-check 逐檔 grep `consensus` / `SQ-013-01` / `Known Gap`：`docs/designs/K-013-consensus-stats-ssot.md` L39-47 / L202-203 / L474 / L509-513 / L558 **仍保留** 「全集下不顯示 consensus 圖 … pre-existing 行為」的 false premise；`agent-context/architecture.md` L354 亦同；R2 commit range 對兩檔 diff 皆空。這是 Round 2 遺漏，列為 Critical F-1（design doc 與 reality 永久矛盾，未來 reader 踩坑）。Gate 5 dev-mode warn 確認 `import.meta.env.DEV` 正確保護，prod build dead-code-eliminated。Gate 6/7 commit 粒度四刀切乾淨，docs-only 第 4 commit 無需 gate 符合 CLAUDE.md §File Class。Case D substitution 代數等價性（observable DOM 相同：StatsProjectionChart `if (!bars.length)` fallback branch）經 StatsPanel.tsx L109-121 code trace 確認，PM Option X 裁決合理。

**沒做好：** Round 1 review 時，Gate 4「architecture doc cross-check」只 grep `consensus_forecast_1h` producer 確認後端永遠 `[]`，但沒 grep 設計文件 SQ-013-01 文字斷言本身是否符合事實（本該把「全集下不顯示 consensus 圖」這句話本身 dry-run 一次，就能在 Round 1 抓到 C-1 的同一個源頭矛盾，而非等到 Pass/Fail table 回讀才觸發）。根因：我把「設計文件斷言」預設為可信 source，只驗 claim 內引用的具體 commit / file:line，沒直接 dry-run claim 本身。

**下次改善：**
1. **Gate 4 擴為「斷言本身 dry-run」：** 設計文件出現「不顯示 X」「無 Y」「全集下如 Z」等 negative/existential claim 時，除了驗 claim 引用的 file:line source，必須對 claim **結論本身**跑 dry-run（例：「全集下不顯示 consensus 圖」→ 模擬 isFullSet=true × projectedFutureBars.length>=2 → 追 displayStats.consensusForecast1h 值 → 追 StatsPanel.tsx bars.length 判斷 → 對結論「不顯示」成立與否做代數證明）。Codify 進 `~/.claude/agents/reviewer.md` §Architecture Doc Cross-Check 硬 gate，triggers = `pre-existing` / `全集下` / `subset 下` / 任何帶 existential quantifier 的 claim。
2. **Round 2 remediation cycle 必掃「前一輪遺留 stale 敘述」：** Bug Found Protocol Round 2 fix commit range 對 design doc / architecture.md diff 為空時（本次 R2 兩檔皆空），需主動提醒 PM 驗證「前一輪斷言是否仍成立」。即使 fix commit 只動 code / test / retro，根因為 false premise 的票必伴隨 doc 斷言修訂，否則下一位 reader 會 inherit 同一誤解。Codify 為「Round 2 Post-Fix Doc Consistency Check」。

---


## 2026-04-21 — K-013 Round 1 (Critical C-1 Consensus chart disappears on full-set)

**做得好：** 設計文件 SQ-013-01 明寫「pre-existing behavior, full-set consensus chart 本來就不畫」，初讀接受 Architect 斷言過，但在 Pass/Fail table 編完後回讀一次覺得 AC-013-APPPAGE NEW 實作「full-set 吐 appliedData.stats」與「OLD 本來就不畫」兩個斷言組合邏輯不合（consensus chart OLD 究竟有沒有畫？無法同時成立），決定 `git show b0212bb:frontend/src/AppPage.tsx` 讀 base，跑 useMemo 資料流 dry-run（isFullSet=true × projectedFutureBars.length>=2），得出 OLD 實際一律注入 consensusForecast1h/1d 的結論 → 推翻 SQ-013-01 premise → 升級為 Critical C-1（K-013 引入 regression）。這一步不是測試驗證可覆蓋，Architect design doc + Engineer AC 字面 + 174 Playwright 全綠也不會觸發，單靠 Reviewer 回讀時「邏輯斷言矛盾感」+「手動 git show base」才能抓到。

**沒做好：** Review 第一輪讀 design doc §0.1 + §SQ-013-01 時接受「pre-existing behavior」宣稱未 code-level 驗，等到 Pass/Fail table 回讀才懷疑。若 Reviewer Step 2 開場就把 type=refactor / SSOT 移轉 / hook 搬家類 ticket 固定做「Behavior Diff: OLD vs NEW」表作為第一步，不讓 Architect 敘述替代 code-level 驗，C-1 可在 review 第一輪前 10 分鐘抓到，省掉 PM Phase Gate 2 重跑。

**下次改善：** 三條 codify 進 `~/.claude/agents/reviewer.md` Review Checklist：(1) refactor / SSOT 移轉 / util 抽取 / hook 搬家類 ticket 固定跑「Behavior Diff: OLD vs NEW」表為第一步，逐輸入路徑列 OLD return 欄位集合 vs NEW return 欄位集合；(2) design doc 任何「pre-existing」「legacy」「API 不變」敘述一律 `git show <base>:<file>` 驗證，未跑視為 SQ 未解；(3)「行為等價」為唯一通過標準，tsc+test 綠 + AC 字面符合皆不足以取代此步驟。記 `feedback_reviewer_pure_refactor_behavior_diff.md`（已寫）。

---

## 2026-04-21 — K-022 /about 結構細節對齊 v2（Step 2 專案深度）

**做得好：**
- 設計文件 §10 文件同步清單逐列對照 commit diff，抓出 `agent-context/architecture.md` 在 K-022 commit range 未更新（Critical: architecture.md 不同步）。
- A-12 shared primitives 逐檔確認 dark pattern 殘留，理解 SectionLabel 保留舊色屬「向後相容、/about 不使用 SectionLabel」，不誤判為 Warning。
- AC-022-HERO-TWO-LINE 字型不一致（AC 說 Newsreader / Pencil TQmUG 是 Bodoni Moda / E2E 驗 Bodoni Moda）三方比對後確認 Architect 設計文件已調整，但 ticket AC 未同步，正確列為 Warning 而非 Critical。

**沒做好：**
- AC-022-SECTION-LABEL ticket AC「6 個 section」vs 設計文件「5 個 label」數字差異，等到審查尾段才發現，應在 Review 開始時就做 ticket AC 數字 × 設計文件列表 × E2E count 三方比對。

**下次改善：**
1. Review 開始時固定 grep ticket AC 中所有數字（「N 個 X」），對照設計文件列表與 E2E spec count 斷言三方比對；不一致立即列 Warning。
2. Architect 因 Pencil 實測覆蓋 AC 文字時，Reviewer 驗設計文件 §2.x 是否有「AC 勘誤說明」，若無則列 Warning 要求 Architect 反寫 ticket AC（雙向一致性）。

---

## 2026-04-20 — K-021 Round 3 re-review（Step 2 專案深度）

**做得好：** Round 3 fix 後實跑 `npm run build`（max chunk vendor-react 179.29 kB gzip 58.57，無 >500 kB warning）+ 全量 Playwright chromium（115 passed + 1 skipped，skip 為 AC-017-BUILD 既有），直接驗 AC-021-REGRESSION 末段；逐檔讀 C-1（PasswordForm/BusinessLogicPage）/ C-2（Diary 三個子元件）/ C-3（HomePage wrapper 刪除 diff 486f06e）/ C-4（sitewide-fonts.spec.ts 73 行 3 case）commit diff 對照 Round 2 問題清單，確認 fix 真正消除而非症狀遮蓋；AC-021-FONTS 判定從 Round 2 PARTIAL → Round 3 PASS（3 case 覆蓋 font-display Bodoni + font-mono Geist + /app cross-route）；Round 2 新增 persona 硬步驟全部落地驗證（engineer.md L14 絕對不做第 4 條 / L69-73 前端實作順序第 5 步 / L84-88 驗證清單設計文件 checklist gate / senior-architect.md L71-85 Architecture Doc Self-Diff 段 / 4 memory 檔 + MEMORY.md 索引）。

**沒做好：** W-5 architecture.md Footer 表 Round 2 修 L463-469（`/app = HomeFooterBar`, `/diary = 無`）正確落地，但**同檔 L476 `Shared Components 邊界` 表的 `HomeFooterBar` 用於欄位仍誤寫** `/ /diary /business-logic`（應為 `/ /app /business-logic`）—— 屬 Architect self-diff 硬步驟覆蓋範圍內（結構化表格）卻漏掃第二張表。Reviewer Round 2 只對照 L463-469 未延伸檢 L476，屬 cross-check 範圍不足；已在本輪列為新發現 Warning（W-R3-01）。Round 3 另一遺漏：AC-021-FONTS 第三字型 Newsreader 的 fontFamily 斷言未被 spec 覆蓋（`font-italic` class 在 codebase 零使用，現況以 `font-['Newsreader']` arbitrary value + inline style 落地），屬 TD-K021-01 漸進處理範圍但應在 Round 2 點出，未點出。

**下次改善：**
1. Architecture doc cross-check 擴為「全檔 grep 同義欄位」：每次 architecture.md drift 檢查不只對照設計文件當下 section，同檔所有含同名組件（`HomeFooterBar` / `UnifiedNavBar` / `FooterCtaSection`）的表格均需 grep 逐列比對；不限於本次新增段落。
2. AC 列舉 N 字型 / N 路由 / N 狀態時，spec 覆蓋率 cross-check 延伸到每一項，不以「主要項已覆蓋」降級為 PASS；未覆蓋項如屬既有漸進遷移（TD 範圍），Reviewer 仍應於 Round 報告標 Suggestion，不沉默通過。

---

## 2026-04-20 — K-021 Sitewide Design System（Step 2 專案深度 review Round 2）

**做得好：** 沒停留於 Step 1 findings 的彙整，實際跑 `npm run build` 取得最新 chunk size（vendor-react 179.29 kB gzip 58.57 最大；無 >500 kB warning 新增）確認 AC-021-REGRESSION 末段；讀 `docs/designs/K-021-sitewide-design-system.md` §9.1 列出的 3 支 spec（`sitewide-body-paper` / `sitewide-footer` / `sitewide-fonts`）vs `frontend/e2e/` 實際檔案 cross-check，確認缺 `sitewide-fonts.spec.ts` 屬設計文件明列但 Engineer 未建（不是 Reviewer 自創新要求）；逐頁 grep HomeFooterBar + FooterCtaSection 實作，對照 `agent-context/architecture.md` § Footer 放置策略表，抓出 `/app` 與 `/diary` 兩列 drift（實作 `/app` 有 footer、`/diary` 無，architecture.md 寫顛倒）。

**沒做好：** AC-021-FONTS 的 Playwright 斷言「font-display / font-mono computed fontFamily」Architect 已在設計文件 §9.1 明列為獨立 spec 檔，卻未在放行 Engineer 時交付清單明寫「3 支 spec 必建」，讓 Engineer 實作只建 2 支（Engineer 在自己的 Retrospective 也沒列為 edge case）。Reviewer 在 Step 1 後若更早讀設計文件 §9 就能在 Engineer Pre-implementation Q&A 階段即點出缺口，而非等實作完檢查。同樣的「設計文件指定的 spec 清單 vs 實作 spec 檔名 cross-check」在 K-018 Reviewer retrospective（2026-04-19）已列「每條 AC 的 Then/And 逐行 grep spec」改善動作，但當時僅針對 AC 文字，未擴及設計文件明列的 spec 清單；本次仍漏。

**下次改善：**
1. Review 開始時固定跑：`grep -n "spec.ts" docs/designs/<ticket>*.md` 抽設計文件列出的 spec 檔名 → `ls frontend/e2e/` cross-check 實際檔名；有 drift 先列 Critical/Warning，不等跑 build 才發現。此條已 Edit 進 `~/.claude/agents/reviewer.md` 「Review Checklist」新增「設計文件 spec 清單 vs 實作 spec 檔名 cross-check」硬步驟（詳下）。
2. 架構文件 drift 檢查擴及「放置表」類規格表：每次 review 涉及 shared component placement 改動，固定對照 `agent-context/architecture.md` 的表格（Footer 放置 / NavBar 項目 / 路由表）逐列 grep 實作確認一致，drift 當場列 Warning 回 PM；不因「只是文件」降級為 Suggestion。

---

## 2026-04-19 — K-017 /about portfolio enhancement

**做得好：** 實際執行 `bash scripts/audit-ticket.sh K-002`、`K-008`、`K-999` 三個 AC-017-AUDIT case 驗證 exit code 與輸出格式，而非只讀 code；逐條對照 PRD 全部 10 條 AC 的 Then/And 子句與 spec 覆蓋，發現 AC-017-NAVBAR 的 DOM 順序斷言和 AC-017-BUILD 的 dev/build 環境矛盾兩個 spec 漏洞，而非只比對 describe 標題與 AC 標題。

**沒做好：** AC-017-NAVBAR 「NavBar 在 PageHeaderSection 之上（DOM 順序）」這條 And 子句在 spec 中缺漏；AC-017-BUILD test 在 dev server 下必然失敗的問題沒被 Architect 在 §7 風險清單中點出（只提了 Firebase Hosting 問題，沒有說 Playwright dev vs build 矛盾），而 Engineer 也未加 test.skip 或環境說明。這兩個缺漏本應在 AC 撰寫（PM）與 E2E 策略設計（Architect §7.11）時就明確——AC-017-NAVBAR 的 DOM 順序 And 子句是 PM 寫 AC 時明確列出的，Architect E2E 風險清單應把「DOM 結構順序斷言」的 Playwright selector 策略列為風險項目。

**下次改善：** Review E2E spec 時固定執行：展開每條 AC 所有 Then/And 子句，逐行 grep spec；對「DOM 順序」「URL 跳轉」「空間關係」類斷言優先盤點，這類斷言比內容斷言更容易漏寫。遇到 test 依賴 build artifact 時直接標為需要 build mode，不等 CI 失敗才發現。

---

## 2026-04-19 — K-018 GA4 Tracking

**做得好：** 逐條比對 PRD AC 的所有 Then/And 子句與 spec 覆蓋率，抓出 `/app` 路由 pageview 測試缺失和 click event `page_location` 斷言漏掉，而非只看測試標題與 AC 標題是否對應；同時確認 `initGA()` 的 spy 覆蓋分析（addInitScript 的 spy 與 initGA 的 gtag 都 push 到同一個 `window.dataLayer`，測試讀 dataLayer 不受 gtag 被覆寫影響），而非只從表面「函式被覆寫」就誤判為 bug。

**沒做好：** AC-018-PAGEVIEW 的「SPA 內部路由切換也會各自觸發 pageview」這條 And 子句（不只是 page.goto，而是透過 Link click 導航），spec 內沒有一個測試實際驗證 SPA 導航觸發的 pageview；banner_about 測試的 SPA 導航副作用雖間接覆蓋了部分場景，但並不是明確的 SPA pageview 路由切換斷言。這應在設計階段就由 Architect 把「SPA 路由切換測試 pattern」列進 Playwright 驗證策略（§6.3），而非只列靜態 page.goto 斷言。

**下次改善：** Review 時加固定步驟：展開 PRD 每條 AC 的所有 Then/And 子句逐行 grep spec，不只比對 describe block 名稱；有「每個 X 都要有 Y」這類全稱量詞的 And 子句時，確認 spec 對每個 X 各自斷言 Y，而非只第一個。

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
