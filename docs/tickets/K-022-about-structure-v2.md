---
id: K-022
title: /about 頁面結構細節對齊設計稿 v2（12 項）
status: closed
type: feat
priority: medium
created: 2026-04-20
---

## 背景

K-017 完成 `/about` 文案結構（8 sections + 2 scope +1 artifacts）後，PM 於 2026-04-20 逐條比對 Pencil 設計稿 v2（frame `35VCj`）與 Playwright 視覺報告，發現 12 項 **結構細節** 差異（section label、dossier header、hairline、redaction bar、annotation label 等），屬於細節視覺還原，需獨立票處理。

**完整裁決紀錄：** memory `project_k017_design_vs_visual_comparison.md`（2026-04-20）

## 依賴關係

- **依賴 K-021**（全站設計系統基建）：本票所有 UI 斷言引用 K-021 交付的 Tailwind token / 三字型系統 / NavBar / Footer
- 本票不可在 K-021 放行前開始 Engineer 實作

## 範圍（12 項結構對齊）

含：

### A-1 Section label + hairline
每個 section 上方顯示 small-caps 英文 label（如 `SECTION · ROLES`），下方帶 1px hairline 分隔線

### A-2 Dossier header bar + FILE Nº
`/about` 頁最上方的 dossier header bar（深色橫條），含 `FILE Nº` 編號標示

### A-3 Hero 分兩行
PageHeaderSection 的 "One operator..." 文字分為兩視覺層：
- 主句（sans-serif display，大字）
- 結尾句 "Every feature ships with a doc trail."（italic，小字，獨立行）

### A-4 副標結構
每個 section 下有一句 italic 副標（Newsreader italic），與標題分離的獨立視覺層

### A-5 Redaction bar
部分 metric / role card 後端資訊以黑色 redaction bar（矩形塗黑條）呈現，模擬「已編輯文件」視覺

### A-6 OWNS / ARTEFACT label
6 Role Cards 的兩欄位使用 small-caps Geist Mono 標籤 `OWNS` / `ARTEFACT`（非一般字體）

### A-7 Link 樣式
頁面內所有 link 採 Newsreader italic + underline（非一般 `text-blue-600 hover:underline`）

### A-8 CASE FILE header
`Anatomy of a Ticket` 區塊以 `CASE FILE` header 呈現（Geist Mono small-caps）

### A-9 LAYER label
`How AI Stays Reliable` 三 pillar 每個採 `LAYER 1/2/3` 前綴 label

### A-10 Footer 單行
`/about` 底部的 `FooterCtaSection` 所在樣式維持 K-017 AC-017-FOOTER 規格（不動），但確認 K-021 NavBar/字型/配色改動後視覺不破（回歸斷言）

### A-11 BEHAVIOUR / POSITION annotation
Role Cards 下方以 small Geist Mono 標 `BEHAVIOUR` / `POSITION` 這類 annotation（設計稿中 marginalia）

### C-4 Role grid 高度
6 Role Cards 的 grid 高度對齊設計稿（3×2 排列，每 card 固定高度）

### A-12 Shared primitives paper palette 遷移（K-021 Round 3 S-NEW-2 併入）
`/about` 主 consumer 的 shared primitives 元件殘留 K-017 dark class，於本票一併遷到 paper palette：
- `components/shared/CardShell.tsx`
- `components/shared/SectionContainer.tsx`
- `components/shared/SectionHeader.tsx`
- `components/shared/SectionLabel.tsx`
- `components/shared/CtaButton.tsx`

**盤點：** Engineer 實作前 grep 上列檔案 `text-white` / `bg-gray-` / `border-white` / `#0[0-9A-F]{5}` 等 dark pattern，列完整對照表。
**遷移原則：** K-021 token 為主（`bg-paper` / `text-ink` / `border-ink`），若 /about 設計稿 v2 有 dossier header `bg-charcoal` 類暗色塊，維持該語義色。
**回歸考量：** shared primitives 亦被 AppPage 使用（見 K-026），但 K-026 會重新驗證 AppPage 子元件；本票只負責 /about 主 consumer 視覺斷言，K-026 覆蓋 AppPage consumer 回歸。

**不含（明確排除）：**
- B-1 Pillar `<code>` 標籤（設計稿有但實作不做）
- B-2 Ticket 副說明（設計稿有但實作不做）
- B-3 Privacy 註腳（注意：AC-018-PRIVACY-POLICY 合規要求 Footer 有 GA4 聲明必保留，勿刪）
- 文案改動（K-017 文案定稿，本票僅改結構視覺）
- 新 section / 刪 section（scope 僅微調現有結構）

## 設計決策紀錄

| 決策項目 | 內容 | 來源 |
|----------|------|------|
| 12 項 scope 切分 | 依 PM 逐條比對結果（memory 裡 A-1 ~ A-11 + C-4） | PM 裁決 2026-04-20 |
| B-1/B-2/B-3 不做 | 使用者 2026-04-20 決定跳過（MVP 不必要） | 使用者決定 |
| AC-018-PRIVACY-POLICY 保留 | GA4 聲明為 K-018 合規要求，本票不得移除 | PM 裁決 |

## Acceptance Criteria

### AC-022-SECTION-LABEL：每個 section 上方有 small-caps label + hairline `[K-022]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至任一 section（Header / Metrics / Roles / Pillars / Tickets / Architecture / Footer）
**Then** section 上方顯示 small-caps 英文 label（如 `SECTION · ROLES`），字型為 Geist Mono small-caps（computed `fontFamily` 含 "Geist Mono"、`textTransform` 為 `uppercase` 或原始大寫字串）
**And** label 下方有 1px hairline 分隔線（`borderBottom: 1px solid` 或 `<hr>` 元素），顏色為 `text-muted` / `border-muted`
**And** Playwright 斷言：5 個 section label（Nº 01~05；Hero section 依設計稿無 label，共 5 個）各自含對應 label 字串（以 `{ exact: true }`）

---

### ~~AC-022-DOSSIER-HEADER：頁面頂部 dossier header bar + FILE Nº `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — DossierHeader component has no Pencil frame backing per §Phase 2 Drift Audit D-1 (Designer manifest DRIFT-P2-MISSING-FRAME confirmed `frame 35VCj` contains no dossier bar subtree). Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by **AC-034-P2-DRIFT-D1** (DossierHeader component retired) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** 使用者訪問 `/about`
**When** 頁面載入完成
**Then** 頁面最上方（NavBar 下方）顯示深色橫條 dossier header bar
**And** 橫條背景色為 `bg-charcoal`（`#2A2520`），文字色為白
**And** 橫條內含 `FILE Nº` 字樣後接編號（如 `FILE Nº · K-017 / ABOUT`）
**And** Playwright 斷言：dossier header bar 存在、含 `FILE Nº` 字串（`{ exact: true }`）

---

### ~~AC-022-HERO-TWO-LINE：Hero 分兩行視覺 `[K-022]`~~ **RETIRED 2026-04-23 by K-040 sitewide font reset**

> **Retired 2026-04-23 by K-040 (AC-040-SITEWIDE-FONT-MONO).** The Bodoni-Moda-display + Bodoni-Moda-italic typographic voice is retired sitewide; About PageHeader Hero renders in Geist Mono at Designer-calibrated 52px, italic OFF (per `docs/designs/K-040-designer-decision-memo.md` `about-v2.frame-wwa0m` sub-nodes `nolk3` (line 1) / `02p72` (line 2)). The two-line visual break + main/tail spacing contract is preserved (structural layout unchanged); only the font family + italic axis inverts. Engineer rewrites the corresponding `about-v2.spec.ts:66-83` assertion block (Bodoni Moda + italic → Geist Mono + style=normal) as part of AC-040-SITEWIDE-FONT-MONO implementation, NOT as regression. AC text body preserved below as historical record.

**Given** 使用者訪問 `/about`
**When** 頁面載入完成
**Then** PageHeaderSection 的 "One operator, orchestrating AI agents end-to-end — PM, architect, engineer, reviewer, QA, designer." 以 display 字型（Bodoni Moda / serif display）呈現為主視覺大字
**And** "Every feature ships with a doc trail." 為獨立行，字型為 Bodoni Moda italic，字級明顯小於主句
**And** 主句與結尾句之間有視覺間距（`margin-top` 或 `gap`），不擠在同一行
**And** Playwright 斷言：主句 computed `fontFamily` 含 "Bodoni Moda"、結尾句 computed `fontFamily` 含 "Bodoni Moda" 且 `fontStyle` 為 `italic`（Pencil 節點 TQmUG：Bodoni Moda 22px italic，§2.7）

---

### ~~AC-022-SUBTITLE：每個 section 有 italic 副標 `[K-022]`~~ **RETIRED 2026-04-23 by K-040 sitewide font reset**

> **Retired 2026-04-23 by K-040 (AC-040-SITEWIDE-FONT-MONO).** The Newsreader italic subtitle voice is retired sitewide; 5 About section subtitles render in Geist Mono with `font-style: normal` per Designer decision memo. The structural contract ("each section has a subtitle line under its main title") is preserved; only the font family + italic axis inverts. Engineer rewrites the corresponding `about-v2.spec.ts:114-131` assertion block (3× Newsreader italic computed-style assertions → Geist Mono + style=normal) as part of AC-040-SITEWIDE-FONT-MONO implementation, NOT as regression. Note: K-034 Phase 2 `AC-034-P2-DRIFT-D26-SUBTITLE-VERBATIM` text-content assertions (verbatim subtitle strings) remain in force — K-040 inverts only the font axis, not the text content. AC text body preserved below as historical record.

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Metrics / Roles / Pillars / Tickets / Architecture 任一 section
**Then** section 主標題下方顯示一行 italic 副標（Newsreader italic）
**And** 副標文字為該 section 的一句說明（內容由 Architect 與 Designer 定稿；維持 K-017 文案精神）
**And** Playwright 斷言：5 個 section 各自含一個 italic 字型副標（computed `fontStyle` = `italic` 且 `fontFamily` 含 "Newsreader"）

---

### AC-022-REDACTION-BAR：部分資訊以 redaction bar 呈現 `[K-022]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Metrics 或 Roles section
**Then** 至少一個 metric subtext 或 role artefact 欄位以 redaction bar（黑色矩形塗黑條）遮蔽視覺樣式呈現
**And** redaction bar 的 `backgroundColor` 為 `bg-ink` 或 `bg-charcoal`，`height` 符合設計稿（Architect 補數值）
**And** redaction bar 不影響實際文字內容（文字仍存在於 DOM，僅視覺覆蓋）
**And** Playwright 斷言：至少一個 `[data-redaction]` 或 class `.redaction-bar` 元素存在

---

### AC-022-OWNS-ARTEFACT-LABEL：Role Cards 欄位 label 採 Geist Mono small-caps `[K-022]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Role Cards 區塊
**Then** 6 張卡片的欄位標籤 `OWNS` 與 `ARTEFACT` 以 Geist Mono small-caps 呈現（computed `fontFamily` 含 "Geist Mono"、`textTransform` 為 `uppercase` 或原始大寫）
**And** label 字級為 10-11px（Architect 補精確數值）
**And** label 顏色為 `text-muted`（`#6B5F4E`）
**And** Playwright 斷言：6 張 Role Card 各含兩個 label（`OWNS` + `ARTEFACT`），共 12 條斷言

---

### ~~AC-022-LINK-STYLE：頁內 link 採 Newsreader italic + underline `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — K-034 Phase 2 Pencil SSOT (frame `35VCj` + sub-frames) establishes link styling from JSON source-of-truth; pre-Phase-0 assumptions (Newsreader italic + underline across all `/about` links) superseded by per-drift-row Pencil-exact assertions. Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by Phase 2 drift rulings (see §5 Phase 2 Drift Audit) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** 使用者訪問 `/about`
**When** 頁面內任一 link（Ticket cards 的 GitHub link / Pillar inline link / Footer CTA 的 email/GitHub/LinkedIn link）
**Then** link 字型為 Newsreader italic（computed `fontFamily` 含 "Newsreader"、`fontStyle` = `italic`）
**And** link 樣式含 underline（computed `textDecoration` 含 `underline`）
**And** Playwright 斷言：至少一個 `<a>` 元素 computed `fontStyle` = `italic` 且 `textDecoration` 含 `underline`

---

### AC-022-CASE-FILE-HEADER：Anatomy of a Ticket 區塊以 CASE FILE header 呈現 `[K-022]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 `Anatomy of a Ticket` 區塊
**Then** 該區塊的 section label 為 `CASE FILE`（取代一般 label）
**And** 字型為 Geist Mono small-caps
**And** Playwright 斷言：`CASE FILE` 字串存在於該區塊上方（`{ exact: true }`）

---

### ~~AC-022-LAYER-LABEL：How AI Stays Reliable 三 pillar 含 LAYER 前綴 label `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — K-034 Phase 2 Pencil SSOT (frame `35VCj` Reliability sub-frame) shows pillar label copy is `FILE Nº 0N · PROTOCOL` (not `LAYER 1/2/3` as K-022 AC asserted). Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by Phase 2 drift rulings (pillar label copy normalized to Pencil-exact `FILE Nº 0N · PROTOCOL`) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** 使用者訪問 `/about`
**When** 頁面滾動至 `How AI Stays Reliable` 區塊
**Then** 三 pillar（Persistent Memory / Structured Reflection / Role Agents）各自有 `LAYER 1` / `LAYER 2` / `LAYER 3` 前綴 label
**And** label 字型為 Geist Mono small-caps，字級 10-11px
**And** Playwright 斷言：三 pillar 各自含對應 `LAYER 1` / `LAYER 2` / `LAYER 3` 字串（`{ exact: true }`）

---

### AC-022-FOOTER-REGRESSION：Footer CTA 在 K-021 改動後視覺不破 `[K-022]`

**Given** K-017 AC-017-FOOTER 於 K-017 關閉時為 PASS（`/about` 底部顯示 `<FooterCtaSection />`）
**When** K-021 + K-022 實作完成
**Then** `/about` 底部 `<FooterCtaSection />` 仍存在
**And** 內容維持 K-017 規格（Let's talk → / email / GitHub / LinkedIn）
**And** 視覺不因 K-021 配色改動而斷裂（Reviewer / QA 目視確認 `<FooterCtaSection />` 與頁面米白 body 配色銜接自然）
**And** Playwright 斷言：K-017 AC-017-FOOTER 所有 `/about` 斷言仍 PASS

---

### ~~AC-022-ANNOTATION：Role Cards 下方 marginalia annotation `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — K-034 Phase 2 Pencil SSOT (frame `35VCj` RoleCardsSection) shows RoleCard subtree contains OWNS/ARTEFACT labels only; POSITION/BEHAVIOUR marginalia is absent from Pencil. Pre-Phase-0 AC assumption (annotation marginalia required) superseded. Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by Phase 2 drift rulings (RoleCard POSITION/BEHAVIOUR annotation removed) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Role Cards 區塊
**Then** 至少一張卡片下方或側邊有 small Geist Mono 標 `BEHAVIOUR` 或 `POSITION` 的 annotation（marginalia 樣式）
**And** annotation 字級 9-10px，顏色 `text-muted`
**And** Playwright 斷言：至少一個 `BEHAVIOUR` 或 `POSITION` 字串存在於 Role Cards 區塊（`{ exact: true }`）

---

### AC-022-ROLE-GRID-HEIGHT：Role Cards grid 高度對齊設計稿 `[K-022]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Role Cards 區塊
**Then** 6 張 role card 以 3 欄 × 2 列 grid 排列
**And** 每張 card 的 computed `height` 相同（誤差 ≤ 2px）
**And** grid container 的 gap 對齊設計稿（Architect 補數值）
**And** Playwright 斷言：6 張 card 的 `getBoundingClientRect().height` 最大最小差 ≤ 2px

---

### AC-022-REGRESSION：K-017 既有斷言不回歸 `[K-022]`

**Given** K-017 所有 AC（AC-017-*）於 K-017 關閉時為 PASS
**When** 本票實作完成
**Then** K-017 所有 Playwright 斷言仍 PASS
**And** 特別是 AC-017-HEADER / AC-017-METRICS / AC-017-ROLES / AC-017-PILLARS / AC-017-TICKETS / AC-017-ARCH / AC-017-FOOTER 各 section 的文案斷言不回歸
**And** `npx tsc --noEmit` exit 0

---

## 放行狀態

**待 K-021 先完成 + Architect 設計：** Architect 需於 K-021 放行後接手 K-022，產出設計文件 `docs/designs/K-022-about-structure.md`，涵蓋：
- 12 項結構細節的 component tree diff（哪些是新 component、哪些是既有 component 加 props）
- Pencil v2 frame `35VCj` 的精確尺寸 / padding / font size 提取
- Redaction bar / annotation 的 data-testid 與 Playwright selector 策略
- Role Card grid 高度對齊的實作方式（CSS grid vs flex + fixed height）

## 相關連結

- [PRD.md — K-022 section](../../PRD.md)（待同步補入）
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket（前置文案）](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket（前置基建）](./K-021-sitewide-design-system.md)
- [設計稿: homepage-v2.pen frame 35VCj](../../frontend/design/homepage-v2.pen)

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上反省；PM 於 QA PASS 後彙整）

### 2026-04-21 — Engineer — K-022 /about 結構細節對齊 v2

**做得好：**
- 讀完設計文件 §2.7 後發現 `AC-017-HEADER` 舊斷言假設 "PM, architect..." 在 `<h1>` 裡，但 A-3 設計明確要求把角色列移到 Newsreader italic `<p>`。在執行 Stage 6 全跑時只有 1 個 fail，定位快（斷言邏輯問題，非程式錯誤），並在更新舊斷言前確認設計意圖正確後才動手。
- Stage 1 → Stage 6 嚴格按照設計文件順序執行，每個 Stage 後跑 `npx tsc --noEmit`，全程 tsc exit 0，無堆疊未驗證的變更。
- RedactionBar 和 DossierHeader 是本票唯二新增組件，`data-redaction` / `data-testid="dossier-header"` / `data-section-hairline` / `data-section-subtitle` / `data-annotation` 等 test attribute 在實作時同步加入，E2E 斷言不需另外 grep 就能直接對應。

**沒做好：**
- AC-017-HEADER 回歸測試 fail 是可預期的：設計文件 §2.7 明確把角色列 "PM, architect..." 從 `<h1>` 拆到 `<p>` Newsreader italic，這意味著 K-017 舊 `about.spec.ts` 斷言 `await expect(h1).toContainText('PM, architect...')` 必然需要更新。但我在實作前沒有預讀舊 E2E spec 確認這一點，等 Stage 6 全跑才發現。根因：Pre-implementation checklist 沒有「讀舊 E2E spec 與設計文件對比，列出因 A-3 結構重構而必然 break 的舊斷言」。

**下次改善：**
- 實作前，對照設計文件每個結構重構（h1 / p 層級改變、組件拆分等），先 grep 對應的舊 E2E spec 斷言，列出哪些會因結構改動而 break，預先確認更新策略再開始 Stage 1。這樣 Stage 6 全跑時不會出現「意料外」的舊斷言 fail。

### 2026-04-21 — Reviewer — K-022 Project Depth Review

**做得好：**
- 設計文件 §10 文件同步清單逐列對照 diff，發現 `agent-context/architecture.md` 在 K-022 commit range 內未更新（設計文件明列 Changelog + shared primitives 表更新為交付項）。
- A-12 shared primitives dark pattern grep 逐檔執行，確認 `SectionLabel.tsx` 保留舊色（purple/cyan/pink/white）符合設計文件向後相容原則，且 /about 未使用 SectionLabel（用 SectionLabelRow），不影響本票 AC。
- AC-022-HERO-TWO-LINE 發現 AC 文字描述（Newsreader italic）與 Pencil 實測（Bodoni Moda TQmUG）不一致，Architect 已在設計文件 §2.7 標注並在 E2E 依設計稿驗，但 ticket AC 本身未同步更新。

**沒做好：**
- AC-022-SECTION-LABEL Ticket AC 寫「6 個 section」，設計文件 §3.1 列 5 個 label（Nº 01~05），實作也是 5 個；數字差異本應在 review 開始時就標出，讓 PM 確認 AC 數字正確性，而非到審查尾段才發現。
- AC-022-HERO-TWO-LINE ticket AC 與設計稿不一致（tagline 字型 Newsreader vs Bodoni Moda），Architect 設計文件已調整但未回寫 ticket AC；Reviewer 本輪將此列為 Warning，應明確要求 Architect 補回寫流程為硬步驟。

**下次改善：**
- Review 開始時固定 grep ticket AC 內的數字（「N 個 section」「N 張卡片」），對照設計文件列表與 E2E spec count 斷言，三方數字不一致立即列 Warning，不留到尾段。
- Architect 在設計文件 §2.x 因 Pencil 實測覆蓋 AC 描述時，必須同步 Edit ticket AC 對應段落（列為硬步驟）；Reviewer 應在 Step 2 驗設計文件 vs ticket AC 是否雙向一致。

### QA

**Regression tests that were insufficient:** AC-017-BUILD（依賴 production build）屬已知設計 skip，非回歸失漏；全套其他斷言均 PASS，本票無回歸覆蓋缺口。

**Edge cases not covered:** I-1 fix（PillarCard overflow-hidden 移除）只透過 Playwright 結構斷言確認無破壞，未額外補「長文字溢出邊界」的視覺 edge case spec — 若日後 PillarCard 出現超長文字場景，現有 test 無法攔截。

**Next time improvement:** 當 Engineer fix 涉及移除 overflow-hidden 等 layout guard 屬性時，QA 須額外加一條 boundary spec（long-text or overflowing-content scenario），確認移除後 layout 不崩。

---

### PM 彙整（2026-04-21）

**流程觀察：** 本票角色協作整體順暢，無跨角色退回輪次。Architect 提出兩個 Blocking Questions（BQ-022-01 / BQ-022-02）均於 Phase Gate 前清楚裁決，未阻塞 Engineer 開工。Engineer 嚴格執行 Stage 1→6 驗證鏈，Code Review 只需一輪，QA 164 passed / 1 skipped / 0 failed 一次通過，全流程沒有退回修復週期。

**主要問題根因：** 問題集中在「AC 文字 vs 設計文件 vs 實作」三端資訊不同步——AC-022-HERO-TWO-LINE 的 tagline 字型（Newsreader vs Bodoni Moda）在 Architect 設計文件中已修正但未回寫 ticket AC；AC-022-SECTION-LABEL 的 section 數量（ticket 寫 6，設計文件 / 實作均為 5）也屬同類問題。根本結構：Architect 在 Pencil 實測覆蓋 AC 描述後，「同步回 ticket AC」未被列為硬步驟，導致 ticket AC 成為過期資訊。

**下個 ticket 改善點：** （1）Architect 設計文件任何 §2.x 因 Pencil 實測而覆蓋 ticket AC 描述時，必須在同次 design doc Edit 中一併 Edit ticket AC 對應段落（列為 senior-architect.md 硬步驟，已由 Reviewer 本輪提議）；（2）Reviewer Step 2 固定 grep ticket AC 中的數字（「N 個 section」「N 張卡片」），與設計文件 + E2E spec 三方比對，數字不一致立即列 Warning——此兩點若在下票（K-023/K-024）前落地 persona，可預防同類型 AC vs 實作數字 drift。
