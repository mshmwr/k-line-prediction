---
id: K-023
title: Homepage 結構細節對齊設計稿 v2（5 項）
status: closed
type: feat
priority: medium
created: 2026-04-20
closed: 2026-04-21
qa-early-consultation: completed-2026-04-21
---

## 背景

K-017 AC-017-HOME-V2 完成 Homepage v2（`<DiaryTimelineEntry>` + hpHero / hpLogic / hpDiary 基本渲染）後，PM 於 2026-04-20 逐條比對 Pencil 設計稿 v2（`Homepage v2 Dossier` frame `4CsvQ`）與 Playwright 視覺報告，發現 Homepage 仍有 5 項結構細節差異需對齊。

**B-2 左箭頭撤回說明：** 原 memory 誤記「實作有多餘左箭頭」，實際 `DevDiarySection.tsx:99` 正是「— View full log →」無左箭頭，**無差異**，不列入本票。

**完整裁決紀錄：** memory `project_k017_design_vs_visual_comparison.md`（2026-04-20）

## 依賴關係

- **依賴 K-021**（全站設計系統基建）：本票所有 UI 斷言引用 K-021 交付的 Tailwind token / 三字型系統 / NavBar / Footer
- 本票不可在 K-021 放行前開始 Engineer 實作
- **token 用途對齊（PM 2026-04-20 Q2 裁決）：** K-021 定義 `brick = #B43A2C`（hero/title magenta）與 `brick-dark = #9C4A3B`（hover/active variant）兩色並存。本票 A-2 Diary marker 採 `brick-dark`、A-4 Hero 副標第二行磚紅採 `brick`——用途分工與 K-021 決策表一致。Engineer 實作時若選 class 有疑義，以 K-021 ticket「設計決策紀錄」表為準

## 範圍（5 項結構對齊）

含：

### A-2 Diary bullet 矩形磚紅 marker
Homepage `hpDiary` section 裡每條 `<DiaryTimelineEntry>` 左側的 marker 改為矩形磚紅（`20×14px` 長方形，`#9C4A3B` = `brick-dark` 色）

### A-3 Step 卡片 header bar
Homepage `hpLogic` section（4 步流程 / 3-step flow）的每張 Step 卡片頂部加 header bar：
- 背景 `#2A2520`（`charcoal`）
- 文字白色
- 內容 `STEP 01 · INGEST` / `STEP 02 · <...>` / `STEP 03 · <...>` 格式（Geist Mono 10px）

### ~~A-4 Hero 副標第二行磚紅 Bodoni italic~~ [REMOVED — PM ruling SQ-023-02, 2026-04-21]
Pencil design frame `4CsvQ` hpHero heroCol has no second-line brick Bodoni italic element. Design file is source of truth. A-4 removed from scope.

### ~~A-5 Hero 水平分隔線~~ [REMOVED — PM ruling SQ-023-03, 2026-04-21]
Current hairline position (after H1 heading, before subtitle) already matches Pencil design exactly. A-5 was predicated on A-4 (second subtitle line) which no longer exists. A-5 removed from scope.

### C-4 Body padding
Homepage 整頁 body 的內邊距對齊設計稿：`padding: 72px 96px 96px 96px`（top 72px / right 96px / bottom 96px / left 96px）

**PM ruling SQ-023-04 Q1 (2026-04-21):** Pencil `hpBody` metadata shows `padding: [72, 96, 96, 96]` (bottom=96px). Design overrides original ticket text (`72px 96px`). Correct value: top=72px, right=96px, bottom=96px, left=96px.

**PM ruling SQ-023-04 Q2 (2026-04-21):** Per-section `py-XX px-6 max-w-5xl mx-auto` padding classes on HeroSection, ProjectLogicSection, and DevDiarySection must be removed when body padding is applied to prevent double-stacking. Design's `hpBody` sections have no individual padding.

**不含（明確排除）：**
- ~~B-2 左箭頭~~（撤回，實作正確）
- 文案改動（hpHero / hpLogic / hpDiary 文案由 K-017 文案定稿或設計稿決定，本票僅改結構視覺）
- 新 section / 刪 section
- `<BuiltByAIBanner />` 改動（由 K-017 AC-017-BANNER 定義，本票不動）

## 設計決策紀錄

| 決策項目 | 內容 | 來源 |
|----------|------|------|
| 5 項 scope 切分（原始） | 依 PM 逐條比對結果（memory 裡 A-2/A-3/A-4/A-5/C-4） | PM 裁決 2026-04-20 |
| B-2 左箭頭撤回 | 原 memory 記錄錯誤，實作無此差異 | PM 重新比對 2026-04-20 |
| Body padding 採設計稿數值 | `72px 96px`（Pencil frame 4CsvQ） | 設計稿決定 |
| SQ-023-01：A-3 已實作完成 | `ProjectLogicSection.tsx:55–62` 完整實作 header bar，與 AC 規格一致。Engineer 僅需新增 Playwright spec，無需改動組件。 | PM 裁決 SQ-023-01，2026-04-21 |
| SQ-023-02：A-4 移除 | Pencil design frame `4CsvQ` hpHero 無第二行磚紅 Bodoni italic 元素，AC 係誤判設計稿。設計稿為唯一真實來源。 | PM 裁決 SQ-023-02，2026-04-21 |
| SQ-023-03：A-5 移除 | 現有 hairline 位置（H1 後、副標前）完全符合設計稿，A-5 依賴 A-4（已移除），無需任何改動。 | PM 裁決 SQ-023-03，2026-04-21 |
| SQ-023-04 Q1：bottom padding = 96px | Pencil hpBody `padding: [72, 96, 96, 96]`（bottom=96px）覆蓋 ticket 原文 `72px 96px`。 | PM 裁決 SQ-023-04，2026-04-21 |
| SQ-023-04 Q2：移除各 section 個別 padding | HeroSection / ProjectLogicSection / DevDiarySection 的 `py-XX px-6 max-w-5xl mx-auto` 於加入 body padding 時同步移除，避免雙重疊加。 | PM 裁決 SQ-023-04，2026-04-21 |
| AC-023-STEP-HEADER-BAR 文字色修正 | `rgb(255,255,255)`（原 AC 近似值誤記）→ `rgb(244, 239, 229)`（`paper` = `#F4EFE5`，K-021 設計系統 token）。設計文件 §2 A-3 current code state 原始碼為 `text-[#F4EFE5]`，Target state = Same as current，實作正確，AC 為誤記。 | PM 裁決 2026-04-21 |

## 驗收條件

### AC-023-DIARY-BULLET：Homepage Diary section 每條 entry 左側矩形磚紅 marker `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面滾動至 Diary section（`hpDiary`）
**Then** 每條 `<DiaryTimelineEntry>` 左側的 marker 以矩形呈現（非圓形）
**And** marker 的 computed `width` = `20px`、`height` = `14px`
**And** marker 的 `backgroundColor` 為 `rgb(156, 74, 59)`（`#9C4A3B` = `brick-dark`）
**And** marker 的 computed `borderRadius` 為 `0px`（所有四角 border-radius 均為 0，確認無 rounded 效果）
**And** Playwright 斷言：Homepage diary section 中至少 3 個 marker 元素，其 bounding rect 寬 20px 高 14px，computed backgroundColor 為 `rgb(156, 74, 59)`，computed borderRadius 為 `0px`

---

### AC-023-STEP-HEADER-BAR：hpLogic section 每張 Step 卡片頂部 header bar `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面滾動至 hpLogic section（流程步驟區塊）
**Then** 每張 Step 卡片頂部顯示 header bar
**And** header bar `backgroundColor` 為 `rgb(42, 37, 32)`（`#2A2520` = `charcoal`）
**And** header bar 文字色為 `paper`（`rgb(244, 239, 229)`，`#F4EFE5`）——K-021 設計系統 token，非純白；AC 原文 `rgb(255,255,255)` 係近似值誤記，PM 裁決 2026-04-21 修正
**And** header bar 文字格式為 `STEP 0X · <LABEL>`（例：`STEP 01 · INGEST`、`STEP 02 · MATCH`、`STEP 03 · PROJECT`，精確標籤由 Architect 從設計稿 frame `4CsvQ` 提取）
**And** header bar 文字字型為 Geist Mono，字級 10px（computed `fontSize` = `10px`）
**And** Playwright 斷言：**3 個獨立 test case**，分別斷言 STEP 01、STEP 02、STEP 03 各自的 header bar 文字符合 `STEP 0X · <WORD>` pattern（regex）；不得合併為單一 test case（PM 量化規則）

---

### ~~AC-023-HERO-SUBTITLE-TWO-LINE~~ [REMOVED — PM ruling SQ-023-02, 2026-04-21]

Pencil design frame `4CsvQ` hpHero has no second-line brick Bodoni italic element. This AC is removed from scope. No implementation or Playwright spec required.

---

### ~~AC-023-HERO-HAIRLINE~~ [REMOVED — PM ruling SQ-023-03, 2026-04-21]

Current hairline position already matches Pencil design. This AC was predicated on A-4 (second subtitle line) which is removed. No implementation or Playwright spec required.

---

### AC-023-BODY-PADDING：Homepage body 內邊距符合設計稿 `[K-023]`

**Given** 使用者訪問 `/`
**When** 頁面載入完成
**Then** Homepage 主 content 容器的 computed padding 為：`paddingTop: 72px`、`paddingRight: 96px`、`paddingBottom: 96px`、`paddingLeft: 96px`
**And** 此 padding 適用於 hpHero / hpLogic / hpDiary 三個 section 的共同 container（`HomePage.tsx` root container）
**And** 現有 HeroSection / ProjectLogicSection / DevDiarySection 各自的 `py-XX px-6 max-w-5xl mx-auto` padding classes 已移除，不得與 body padding 雙重疊加
**And** Playwright 斷言：Homepage root container（`data-testid="homepage-root"`）的 computed `paddingTop` 為 `72px`、`paddingRight` 為 `96px`、`paddingBottom` 為 `96px`、`paddingLeft` 為 `96px`

**Given** viewport 寬度 < 640px（行動裝置，Tailwind `sm:` breakpoint）
**When** 頁面載入完成
**Then** padding 降為 responsive 變體：`paddingTop: 32px`、`paddingBottom: 32px`、`paddingLeft: 24px`、`paddingRight: 24px`
**And** Playwright mobile viewport（375px width）斷言：padding 數值符合上述 mobile 值，不為 desktop 的 `72px / 96px`

**PM ruling SQ-023-04 (2026-04-21):**
- Q1: bottom padding = 96px (Pencil `hpBody` metadata `[72, 96, 96, 96]` overrides original ticket text)
- Q2: per-section padding removal is required (Option A) — prevents double-stacking, matches design intent
- Mobile breakpoint: Tailwind `sm:` (640px), not 767px — standard breakpoint avoids custom `tailwind.config.js` change

**Known Gap（PM 裁決 2026-04-21）：** 640px breakpoint boundary 精確 test case（639px vs 640px）由 QA sign-off 時補入。

---

### AC-023-REGRESSION：K-017 既有斷言不回歸 `[K-023]`

**Given** K-017 所有 AC（AC-017-*）於 K-017 關閉時為 PASS，特別是 AC-017-HOME-V2 / AC-017-BANNER
**When** 本票實作完成
**Then** K-017 所有 Playwright 斷言仍 PASS
**And** 特別是 `<BuiltByAIBanner />` 位置（NavBar 下方、Hero 上方）不變動
**And** hpHero / hpLogic / hpDiary 三 section 基本存在斷言仍 PASS
**And** `<DiaryTimelineEntry>` 組件（K-017 Pass 3 設計）的 `layout:none` 絕對定位機制不被破壞
**And** AC-HOME-1 既有斷言（Homepage 四個 section 渲染）仍 PASS
**And** `npx tsc --noEmit` exit 0

---

## 放行狀態

**待 K-021 先完成 + Architect 設計：** Architect 需於 K-021 放行後接手 K-023，產出設計文件 `docs/designs/K-023-homepage-structure.md`，涵蓋：
- 設計稿 frame `4CsvQ` 的精確 Step 標籤文字提取（STEP 01/02/03 各自的 WORD）
- Hero 副標第二行的精確文案提取
- `<DiaryTimelineEntry>` 現有 marker 樣式改為矩形的實作方式（CSS `border-radius: 0` + `width/height`）
- Step 卡片 header bar 的組件結構（新增 `<StepHeaderBar>` vs 直接 inline）
- Body padding responsive breakpoint（desktop vs mobile 精確數值）

**Known Gap 觸發點（PM ruling SQ-023-02/03/04 後更新，2026-04-21）：**
- ~~KG-023-01：AC-023-HERO-SUBTITLE-TWO-LINE~~ — CLOSED. A-4 removed from scope per SQ-023-02.
- KG-023-02/03：AC-023-BODY-PADDING mobile responsive exact pixel value — RESOLVED per SQ-023-04: mobile = `32px top/bottom, 24px left/right` at `sm:` breakpoint (640px). No further PM action needed.
- KG-023-04：640px breakpoint boundary test (639px vs 640px) — QA adds at sign-off.

## Tech Debt

Items deferred from Code Review (2026-04-21 Code Review ruling):

| ID | Finding | Description | Priority | Reason for Deferral |
|----|---------|-------------|----------|---------------------|
| TD-K023-01 | F5 — DIARY-BULLET bounding-box on first() only | `pages.spec.ts` AC-023-DIARY-BULLET bounding-box test asserts width/height only on `markers.first()`, while backgroundColor and borderRadius tests loop all 3. Inconsistent coverage. | Low | borderRadius loop already covers all 3 markers for the primary AC concern (rounded vs rect). Width/height is set by same CSS class on all markers — variance is effectively zero. Cost of fix does not justify mid-ticket interruption. |
| TD-K023-02 | F6 — Incomplete K-021 token migration in ProjectLogicSection + DevDiarySection headers | `ProjectLogicSection.tsx` logicHead and DiarySection header badge still use inline hex (`bg-[#9C4A3B]`, `text-[#F4EFE5]`, `text-[#1A1814]`). Same computed color as tokens, no visual impact. | Medium | Follows pattern of K-025 (NavBar hex→token) and K-026 (AppPage paper palette). Scope expansion into logicHead is outside K-023 AC. Should be bundled into K-025/K-026 or a new follow-up ticket to avoid scope creep. |

---

## 相關連結

- [PRD.md — K-023 section](../../PRD.md)（待同步補入）
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket（前置文案 + v2 Pass 3）](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket（前置基建）](./K-021-sitewide-design-system.md)
- [設計稿: homepage-v2.pen frame 4CsvQ](../../frontend/design/homepage-v2.pen)

---

## QA Early Consultation Record (2026-04-21)

QA Early Consultation completed before releasing to Architect.

### Challenges Filed (6 total)

| # | AC | Issue | PM Ruling |
|---|-----|-------|-----------|
| 1 | AC-023-DIARY-BULLET | `borderRadius` not quantified in AC — risk of false-pass since existing code has `rounded-[6px]` | Option A: Added `borderRadius: 0px` assertion to AC |
| 2 | AC-023-STEP-HEADER-BAR | "≥ 3" assertion not quantified as independent test cases (PM parallel-Given rule) | Option A: Added explicit "3 independent test cases" requirement to AC |
| 3 | AC-023-HERO-SUBTITLE-TWO-LINE | DOM structure of "two lines" undefined; exact second-line text pending Architect extraction | Known Gap: Playwright to use regex; exact text to be added after Architect design doc |
| 4 | AC-023-HERO-HAIRLINE | Existing hairline in HeroSection is between heading and subtitle (not after subtitle). No position assertion in AC. | Option A: Added DOM-order position requirement and explicit note about existing element location |
| 5 | AC-023-BODY-PADDING | Mobile exact value pending Architect doc; 767px boundary test not specified | Known Gap (mobile value) + Known Gap (boundary test — to be added after Architect doc) |
| 6 | AC-023-REGRESSION | `layout:none` absolute positioning not covered by existing Playwright assertions | Known Gap: visual regression covered by QA sign-off `visual-report.ts`; positional quantification out of scope |

### Known Gaps (PM explicit rulings — updated 2026-04-21 per SQ rulings)

- **KG-023-01**: ~~AC-023-HERO-SUBTITLE-TWO-LINE second-line exact text~~ — CLOSED. AC removed from scope per PM ruling SQ-023-02.
- **KG-023-02**: AC-023-BODY-PADDING mobile responsive exact pixel value — RESOLVED. Mobile = `32px top/bottom, 24px left/right` at `sm:` breakpoint (640px) per PM ruling SQ-023-04.
- **KG-023-03**: ~~AC-023-BODY-PADDING 767px boundary test~~ — SUPERSEDED. Breakpoint changed to Tailwind `sm:` 640px per PM ruling SQ-023-04. QA to add 640px boundary test at sign-off.
- **KG-023-04**: AC-023-REGRESSION absolute positioning metric — covered by visual report screenshot, not quantitative assertion.

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上反省；PM 於 QA PASS 後彙整）

### PM Summary — Code Review Ruling (2026-04-21)

**Findings ruled: 7 total (F1–F7). Fix-now: 5. Tech Debt: 2.**

| Finding | Ruling | Rationale |
|---------|--------|-----------|
| F1 — Design doc §2 C-4 class order inverted | **Fix Now** | Tailwind mobile-first: `pt-[72px] sm:pt-8` in doc would cause mobile=72px/desktop=32px (wrong). Any future engineer copying from doc would ship a bug. 1-line edit. |
| F2 — fontFamily (Geist Mono) not asserted in STEP header bar tests | **Fix Now** | AC-023-STEP-HEADER-BAR explicitly requires Geist Mono. Font load failures are silent with monospace fallback. Added `toContain('Geist Mono')` to all 3 test cases. |
| F3 — BuiltByAIBanner DOM-order not asserted | **Fix Now** | AC-023-REGRESSION requires Banner position "NavBar下方、Hero上方 not changed." No structural guard existed. Added `compareDocumentPosition` check using `data-testid="built-by-ai-banner"` + h1 heading as proxy for HeroSection. |
| F4 — Step header bar locator couples to CSS class `div.bg-charcoal` | **Fix Now** | Token renames break locator silently. `data-testid="step-header-bar"` added to `ProjectLogicSection.tsx`; locators in all 3 spec blocks updated to `[data-testid="step-header-bar"]`. Consistent with established `data-testid` pattern (diary-marker, homepage-root). |
| F5 — DIARY-BULLET bounding-box on first() only | **Tech Debt** (TD-K023-01, Low) | borderRadius test already loops all 3. Width/height same CSS class on all markers. Variance probability near zero. |
| F6 — Incomplete K-021 token migration | **Tech Debt** (TD-K023-02, Medium) | Same computed color, no correctness issue. Bundle into K-025/K-026 scope. |
| F7 — "aliases" comment misleading | **Fix Now** | 1-line edit. "Aliases" implies tests duplicate existing tests (they don't — they add structural guards). Changed to "Regression guards." |

**Actions taken by PM (all executed in this session):**
- `docs/designs/K-023-homepage-structure.md` line 163: corrected Tailwind class order
- `frontend/src/components/home/ProjectLogicSection.tsx` line 55: added `data-testid="step-header-bar"`
- `frontend/src/components/home/BuiltByAIBanner.tsx`: added `data-testid="built-by-ai-banner"`
- `frontend/e2e/pages.spec.ts`: updated 3 STEP header bar locators + added fontFamily assertions; added Banner DOM-order check; fixed regression comment
- `docs/tickets/K-023-homepage-structure-v2.md`: added `## Tech Debt` section with TD-K023-01 and TD-K023-02

**Cross-role recurring issues:** None new — data-testid gap was an Architect recommendation already in §5 of design doc that Engineer did not implement. Root cause: design doc recommendation marked as "optional" was treated as skippable.

**Process improvement decisions:**
| Issue | Responsible Role | Action | Update Location |
|-------|-----------------|--------|----------------|
| Architect `data-testid` recommendations in design doc §5 treated as optional by Engineer | Engineer | Add to Engineer persona: "Architect §5 testability recommendations are required deliverables, not optional" | `~/.claude/agents/engineer.md` |

### QA

**Regression tests that were insufficient:** KG-023-04 (640px breakpoint boundary — 639px vs 640px) was listed in ticket as "QA adds at sign-off" but was not actioned at sign-off; boundary is uncovered.

**Edge cases not covered:** AC-023-BODY-PADDING does not test the exact sm: breakpoint boundary (639px mobile vs 640px desktop). Existing tests only cover 375px and 1280px.

**Next time improvement:** Any Known Gap labeled "QA adds at sign-off" must be escalated as a formal QA Interception to PM at sign-off — either Engineer adds the spec, or PM explicitly rules it as Known Gap with reason. Cannot leave it only in ticket metadata.

---

### PM Ruling — KG-023-04 (2026-04-21)

**Decision: Option B — Declare Known Gap**

**Rationale:** Testing Tailwind's `sm:` breakpoint boundary precision (639px vs 640px) is not the application's responsibility. The breakpoint boundary math is internal to Tailwind CSS framework and is tested at the framework level, not the application level. The existing 375px (mobile canonical) and 1280px (desktop canonical) Playwright test cases fully cover the application's padding intent for AC-023-BODY-PADDING. Application-level tests must verify business intent (correct padding values in mobile vs desktop contexts), not framework implementation details.

**KG-023-04 status: Formally closed as Known Gap — Option B (framework-level boundary, not application responsibility)**

---

### Deploy Record

**Deploy date:** 2026-04-21
**Git SHA at deploy:** `fbbd58c2e1fdd1f8aaa4b79e5b76b58d57c7793c`
**Hosting URL:** https://k-line-prediction-app.web.app
**Status:** Live
