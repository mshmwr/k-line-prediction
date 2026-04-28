---
title: K-017 — /about portfolio-oriented recruiter enhancement — Architecture
type: design
tags: [K-017, Architecture, Frontend, Scripts, Docs]
status: draft
authors: [senior-architect]
related_ticket: docs/tickets/K-017-about-portfolio-enhancement.md
updated: 2026-04-19
---

## Summary

K-017 重寫 `/about` 為 portfolio-oriented recruiter page（8 sections），在 homepage 加一條導向 `/about` 的 thin banner，並交付兩個支援 artifact（`scripts/audit-ticket.sh` + `docs/ai-collab-protocols.md`）。本設計為純 UI + docs/script 新增，無跨層 API 合約變更、無後端異動。

**Pass 2（2026-04-19，cross-page component audit）：** 第一輪僅對 `/about` 做組件拆分，未做 cross-page duplicate audit。Pass 2 盤點 D1–D10 duplicate / inline pattern 後抽 7 個 primitive（P1–P7）+ 1 個 hook（`useDiary`），將 MilestoneSection / DiaryPreviewEntry 合併為 `<MilestoneAccordion variant>`，CtaButton 補 `rel=noopener`，RoleCard interface 重設並加 `Reviewer` role。primitive 抽出只給 K-017 新組件用（HomePage/既有 about 不 migrate），避免 scope 蔓延。

**Pass 3（2026-04-19，Pencil 核對後設計更新）：** Pencil batch_get 核對後確認 Homepage hpDiary 與 Diary dpList 的 timeline DOM pattern 根本不同（前者 `layout:none` + absolute rectangle rail + absolute marker；後者 flexbox 雙欄 + left-border stroke，無獨立 rail 與 marker 元素），P5/P6 條件不成立，**正式刪除**。P4 MilestoneAccordion（variant="preview"|"full"）亦因兩端結構差異過大無法共用一個 primitive，**廢棄 P4**，改為各自實作：Homepage 用新建 `DiaryTimelineEntry.tsx`（layout:none 絕對定位），Diary 沿用現有結構。P7 DiaryEntryRow 隨 P4 廢棄。About S7 確認為 `BuiltByAIBanner` 的 mockup 展示卡（非真實 banner 組件），`BuiltByAIBanner.tsx` 仍置於 `HomePage.tsx`。`useDiary` hook 保留（fetch 邏輯仍可共用，與 rendering pattern 無關）。

**主要決策：**
1. `/about` 組件樹採「每個 PRD section = 一個 Section 容器組件 + 多個 presentational sub-component」的粒度，既有 14 個 about/ 組件只保留 1 個（`RoleCard` 需重設 interface），其餘 13 個刪除。Pass 2 所有新 section 外層 wrap `<SectionContainer>`（P1），5 個 card 共用 `<CardShell>`（P2）。
2. `audit-ticket.sh` 採 bash function 模組化 + ANSI escape 上色 + early-skip-by-date，不引入 jq / yq / node 依賴。
3. `ai-collab-protocols.md` 以 mechanism 三段 + curated retrospective appendix 組織，每段首標 stable anchor ID 讓 `/about` inline link 跳轉。
4. Pass 2 盲抽的 P5 / P6（`<VerticalRail>` / `<TimelineMarker>`）經 Pass 3 Pencil 核對後**正式刪除**（兩頁 pattern 不共用）；P4 / P7 亦廢棄，各自 inline 實作。

---

## 1. 技術方案選擇

### 決策 A：`/about` 組件拆分粒度

| 方案 | 描述 | Trade-off |
|------|------|-----------|
| A1. 單檔 AboutPage.tsx 含所有 JSX | 一個 600+ 行大檔；所有 section 行內 | 易讀行順、難單測、違反既有 components/about/ 子目錄慣例 |
| A2. 每 PRD section = 一個容器組件 + 需要時再切 sub-component（推薦） | 8 個 `*Section.tsx`（7 個新增 + 1 個 `PageHeaderSection` 改寫）；MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarCard / FooterCtaLink 等 sub-component | 對齊現有 about/ 子目錄慣例、Playwright 可用 `data-section` attr 或 section heading 鎖定、每檔 < 120 行 |
| A3. 一張大 config JSON 驅動 + 泛用 SectionRenderer | 文案集中、組件少 | Playwright 無法用 structural selector 精準斷言，且 AC-017-ROLES 18 條斷言對欄位 ordering 敏感，data-driven render 容易漂移 |

**推薦：A2。** Playwright 斷言（AC 規定每區 3~9 條）需要可辨識的 semantic container；既有 `about/` 目錄已有子組件慣例，延用讓讀 codebase 的 recruiter 看到一致風格。

### 決策 B：`audit-ticket.sh` bash 結構

| 方案 | 描述 | Trade-off |
|------|------|-----------|
| B1. 單一 main 函式 + inline check | 快速 | 難讀、難擴充、check group 界線糊 |
| B2. 每個 check group 一個 bash function（推薦） | `check_a_ticket_file` / `check_b_ac` / … / `check_g_qa` 7 個 function + `main` dispatcher + `log_ok` / `log_warn` / `log_fail` / `log_skip` utility | 模組化清楚、未來要加 H/I group 只加 function 即可、echo 邏輯集中方便測 |
| B3. 引入 jq / yq 解 frontmatter | parse 精準 | 引入非 stdlib 依賴，違反 AC「bash，不依賴 node / python runtime」；macOS 預設無 jq |

**推薦：B2。** Frontmatter 欄位只讀 `id` / `title` / `status` / `type` / `priority` / `created`，用 `grep -E` + `sed` 可解；額外一層 jq 依賴不划算。

### 決策 C：`ai-collab-protocols.md` 文件組織

| 方案 | 描述 | Trade-off |
|------|------|-----------|
| C1. 三 section flat 列（推薦） | `## Role Flow` / `## Bug Found Protocol` / `## Per-role Retrospective Log`，每段含 intro + subsection + appendix 引 retrospective 節選 | 簡單、anchor ID 穩定（markdown h2 自動 slug）、recruiter 線性讀得完 |
| C2. 依「人 / 機制 / 證據」主題分類 | 更敘事化 | anchor 不對應 `/about` pillar 名稱，需額外 map 表 |
| C3. 每條 retrospective 一 section | 最細 | 太長、破壞 mechanism-focused 原則（見 K-017 PRD curation 策略） |

**推薦：C1。** 對齊 PRD 既有三 section 命名 + `/about` Section 4 pillar inline link 目標明確。

---

## 2.0 共用 Primitive & Reuse 規劃（2026-04-19 Pass 2 — cross-page component audit）

**背景：** 第一輪設計（§2 起）只對 `/about` 做組件拆分，未做 cross-page duplicate audit。Pass 2 對 K-017 scope 全域掃描後定位出 10 個 D1–D10 duplicate / inline pattern，使用者已逐條裁決（見本段各小節「決策來源」）。

**Scope 原則：** Primitive 抽出 **只給 K-017 新增組件用**（HomePage / 既有 about / DiaryPage 既有組件不 migrate），避免 scope 蔓延。既有改造僅限：`RoleCard` interface 重設（D6 — 舊 AiCollabSection 反正要刪）、`CtaButton` 補 `rel="noopener"`（D7）、HomePage / DiaryPage diary fetch 抽 `useDiary` hook（D2）。

### 2.0.1 Primitive component 清單

| # | Primitive | 檔案位置 | 誰會用 | 決策來源 |
|---|-----------|---------|-------|----------|
| P1 | `<SectionContainer>` | `frontend/src/components/primitives/SectionContainer.tsx` | K-017 /about 7 sections + HomePage 新 `BuiltByAIBanner` 周邊不用（它是 thin banner 自帶樣式） | Q3-A（只 K-017 新 section 用；HomePage 既有 section 不 migrate） |
| P2 | `<CardShell>` | `frontend/src/components/primitives/CardShell.tsx` | `<MetricCard>` / `<RoleCard>`（重寫版）/ `<PillarCard>` / `<TicketAnatomyCard>` / `<ArchPillarBlock>` | Q4-A + Q5-A（5 卡共用 shell，各自內容組件 wrap） |
| P3 | `<ExternalLink>` | `frontend/src/components/primitives/ExternalLink.tsx` | `<FooterCtaLink>`（GitHub / LinkedIn）/ `<TicketAnatomyCard>` GitHub link / `<PillarCard>` docs link（注意：docs link 為站內相對路徑，**不算 external**，改用 `react-router-dom` `<Link>` 或 `<a href>`） | Q7-A + 順手補 `CtaButton` `rel="noopener"` |
| P4 | ~~`<MilestoneAccordion>`~~ | **DELETED（Pass 3）** | Homepage hpDiary 用 `layout:none` + absolute 定位（rectangle rail + marker），Diary dpList 用 flexbox 雙欄（date + content with left-border stroke），兩端 DOM 結構根本不同，無法共用 variant prop。**廢棄 P4**：Homepage 改用新建 `<DiaryTimelineEntry>`（`frontend/src/components/home/DiaryTimelineEntry.tsx`，layout:none 絕對定位對齊設計稿）；Diary 沿用現有 `MilestoneSection.tsx` / `DiaryEntry.tsx`（不刪除） | Pass 3 Pencil 核對 |
| P5 | ~~`<VerticalRail>`~~ | **DELETED（Pass 3）** | Homepage 用 `rectangle` id=`qNeCy` absolute 置於 frame 內；Diary dpList **無獨立 rail rectangle**，改用 flexbox 右欄的 `stroke:{align:"center", fill:"#1F1F1F", thickness:{left:1}}` 製造軌道感。兩處 pattern 不同，條件不成立，P5 刪除 | Pass 3 Pencil 核對（batch_get 確認） |
| P6 | ~~`<TimelineMarker>`~~ | **DELETED（Pass 3）** | Homepage hpDiary 每個 entry 有 `cornerRadius:6, fill:"#9C4A3B", height:14, width:20` 的 absolute marker；Diary dpList **無 marker 元素**。兩處不共用，P6 刪除 | Pass 3 Pencil 核對（batch_get 確認） |
| P7 | ~~`<DiaryEntryRow>`~~ | **DELETED（Pass 3）** | P4 MilestoneAccordion 廢棄後，P7 的設計前提（Accordion 合併後 row 統一）消失。各自頁面 entry row 維持原有實作，不抽 primitive | P4 廢棄連帶 |

**統一 convention：** 所有 primitive 放 `frontend/src/components/primitives/`（新目錄；不是 `common/`，因為 `common/` 現有 `LoadingSpinner` / `ErrorMessage` / `SectionLabel` / `SectionHeader` / `CtaButton` 為 domain-agnostic UI atom；primitive 是 K-017 抽象出來的 structural building block，語意不同，分目錄避免 `common/` 膨脹）。

**Props interface（TypeScript pseudo-code）：**

```ts
// P1 — SectionContainer
interface SectionContainerProps {
  width: 'narrow' | 'wide'      // narrow = max-w-3xl; wide = max-w-5xl
  divider?: boolean              // true → border-b border-white/10
  paddingY?: 'md' | 'lg'         // md = py-12; lg = py-16 (default)
  children: ReactNode
  id?: string                    // 供 anchor 跳轉（e.g. AboutPage section anchor）
}

// P2 — CardShell
interface CardShellProps {
  padding?: 'sm' | 'md' | 'lg'  // sm = p-3; md = p-5 (default); lg = p-6
  borderColorClass?: string      // default 'border-white/10'
  children: ReactNode
  // 不含 role 特定 styling（顏色 / icon 由內容組件傳 borderColorClass 或自行 wrap）
}

// P3 — ExternalLink
interface ExternalLinkProps {
  href: string
  label: string
  className?: string             // 讓外部組件客製 typography（ticket card vs footer 不同）
  ariaLabel?: string
  // target="_blank" + rel="noopener noreferrer" 寫死，不開 prop 避免 forget
}

// P4 — DELETED（Pass 3）：MilestoneAccordion 廢棄
// Homepage 改用 DiaryTimelineEntry（home/DiaryTimelineEntry.tsx，layout:none absolute 定位）
// Diary 沿用現有 MilestoneSection.tsx / DiaryEntry.tsx（不刪除）
interface DiaryTimelineEntryProps {
  milestone: DiaryMilestone     // Homepage preview 用；layout:none 絕對定位對齊設計稿
}

// P5 / P6 / P7 — DELETED（Pass 3）
// P5 VerticalRail：各頁 rail 各自 inline（Homepage 用 absolute rectangle；Diary 用 flexbox left-border stroke）
// P6 TimelineMarker：Diary 無 marker，Homepage marker 直接寫進 DiaryTimelineEntry
// P7 DiaryEntryRow：隨 P4 廢棄
```

**使用範例（pseudo-JSX）：**

```tsx
// /about S2 MetricsStrip
<SectionContainer width="wide" divider>
  <MetricCard title="Features Shipped" subtext="17 tickets, K-001 → K-017" />
  {/* MetricCard 內部 wrap CardShell */}
</SectionContainer>

// MetricCard.tsx 內部
<CardShell padding="md">
  <h3>{title}</h3>
  <p>{subtext}</p>
</CardShell>

// /about Footer GitHub link
<ExternalLink href="https://github.com/..." label="GitHub" />

// DiaryPage
<MilestoneAccordion milestone={m} variant="full" defaultOpen={i===0} />

// HomePage DevDiarySection
<MilestoneAccordion milestone={m} variant="preview" />
```

### 2.0.2 Custom hook：`useDiary`

**決策來源：** Q2-A（本票順手抽）。

**檔案：** `frontend/src/hooks/useDiary.ts`

**Signature：**

```ts
interface DiaryState {
  entries: DiaryMilestone[]
  loading: boolean
  error: string | null
  refetch: () => void            // 供 ErrorMessage retry 用（DiaryPage 既有行為）
}

function useDiary(limit?: number): DiaryState
```

**實作大綱（pseudo-code，對齊 HomePage / DiaryPage 既有行為）：**

1. 內部 `useAsyncState<DiaryMilestone[]>()` 包裝 status / data / error
2. `useEffect` mount 時 `fetch('/diary.json')` → 失敗 `throw new Error('Failed to load diary: ${status}')`
3. 成功時 `limit` 有值 → `data.slice(0, limit)`；無值 → 全量
4. 回傳 `{ entries: state.data ?? [], loading: state.status === 'loading', error: state.error, refetch }`

**Edge case：**
- `limit === 0` 視為有值（回空陣列），不 fallback 全量
- `fetch` network error 的 `err.message` 直接存 error（對齊既有）

**遷移計畫（K-017 scope 內）：**
- `HomePage.tsx`：刪既有 `useAsyncState` + `useEffect` + `.slice(0, 3)` 區塊 → `const { entries, loading, error } = useDiary(3)`；傳給 `<DevDiarySection>` 的 props 改用新結構（`milestones={entries} / loading={loading} / error={error}`）
- `DiaryPage.tsx`：刪既有 fetch 邏輯 → `const { entries, loading, error, refetch } = useDiary()`；retry 按鈕接 `refetch`

### 2.0.3 既有改造清單（K-017 scope 內）

| 檔案 | 改造內容 | 為何 | 決策來源 |
|------|---------|------|---------|
| `frontend/src/components/about/RoleCard.tsx` | Interface 由 `{ role, responsibilities: string[], borderColorClass }` 改為 `{ role, owns: string, artefact: string, borderColorClass? }`；`role` enum 去 `'Senior Architect'`、加 `'Reviewer'`（保留 `'Architect'` 單字版）；舊 `responsibilities.map` JSX 改為兩行 `Owns: ...` / `Artefact: ...` + wrap `<CardShell>` | K-017 S3（AC-017-ROLES）要求 Owns/Artefact 欄位；舊 AiCollabSection 反正會刪，舊 interface 無其他 caller | Q6-A（直接改，不 dual-export） |
| `frontend/src/components/common/CtaButton.tsx` | `external=true` 分支的 `rel="noreferrer"` → `rel="noopener noreferrer"` | 現狀漏 `noopener`（見 §7.3）；Q7 順手補 | Q7-A |
| `frontend/src/components/about/AiCollabSection.tsx` | **刪除整檔** | 舊 5-role section 被 K-017 S3 6-role RoleCardsSection 取代 | §2.2 既有定案 |
| `frontend/src/components/about/PhaseGateBanner.tsx` | **刪除** | AiCollabSection 唯一 caller 被刪 | §2.2 既有定案 |
| `frontend/src/pages/HomePage.tsx` | 改用 `useDiary(3)`；在 `<UnifiedNavBar />` 與 `<HeroSection />` 之間加 `<BuiltByAIBanner />`；頁面底部加 `<FooterCtaSection />`（Q8 全站共用） | Q2-A + AC-017-BANNER + Q8 | Q2 + PRD |
| `frontend/src/pages/DiaryPage.tsx` | 改用 `useDiary()`；`retry` 按鈕接 `refetch`；頁面底部加 `<FooterCtaSection />`（Q8 全站共用） | Q2-A + Q8 | Q2 |
| `frontend/src/components/diary/MilestoneSection.tsx` | **保留不動**（Pass 3：P4 已廢棄，Diary 頁維持現有 flexbox 雙欄結構） | Pass 3 決策 | Pass 3 |
| `frontend/src/components/diary/DiaryTimeline.tsx` | **Pass 3 修正：不改動**（P4 已廢棄；保留內部 `<MilestoneSection>` 引用原樣） | Pass 3 決策 | Pass 3 |
| `frontend/src/components/diary/DiaryEntry.tsx` | **保留不動**（Pass 3：P4/P7 已廢棄，`DiaryEntry` 仍為 DiaryTimeline 內部使用組件） | Pass 3 決策 | Pass 3 |
| `frontend/src/components/home/DiaryPreviewEntry.tsx` | **刪除** | 被 Pass 3 新建的 `<DiaryTimelineEntry>` 取代（layout:none 絕對定位） | Pass 3 |
| `frontend/src/components/home/DevDiarySection.tsx` | 內部 `<DiaryPreviewEntry>` → 新建 `<DiaryTimelineEntry>`（layout:none 絕對定位）；props 接 `{ milestones, loading, error }`（對齊 `useDiary` 回傳） | Pass 3 + Q2-A | Pass 3 + Q2 |

**不動（out-of-scope 明確聲明，避免 Engineer 誤擴）：**
- `StepCard.tsx` / `TechDecCard.tsx`（皆已刪除計畫外）不 migrate 至 `<CardShell>`
- `HomePage.tsx` 既有 `<HeroSection>` / `<ProjectLogicSection>` / `<DevDiarySection>` 外層不加 `<SectionContainer>`
- 既有 `common/` 下組件（LoadingSpinner / ErrorMessage / SectionLabel / SectionHeader / CtaButton）不搬到 `primitives/`

---

## 2. 組件樹拆分（`/about` + homepage banner）

### 2.1 AboutPage 新組件樹（含 primitive 引用標註）

**圖例：** `← P1` 表節點 wrap `<SectionContainer>`；`← wraps P2` 表節點內部 wrap `<CardShell>`；`← P3` 表 external link 用 `<ExternalLink>`。Primitive 清單見 §2.0.1。

```
AboutPage.tsx
  ├─ <UnifiedNavBar />                              (既有，不動)
  ├─ <SectionContainer width="narrow">              ← P1
  │     └─ <PageHeaderSection />                    (S1 — 改寫既有檔；內部 <SectionLabel>"PROJECT OVERVIEW" + <h1>)
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <MetricsStripSection />                  (S2 — 新增)
  │           └─ <MetricCard title subtext /> × 4   ← wraps P2 <CardShell padding="md">
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <RoleCardsSection />                     (S3 — 新增)
  │           └─ <RoleCard role owns artefact /> × 6 ← wraps P2 <CardShell padding="md">；interface 重設（見 §2.0.3）
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <ReliabilityPillarsSection />            (S4 — 新增)
  │           └─ <PillarCard title body anchorQuote docsHref /> × 3
  │                 ├─ wraps P2 <CardShell padding="lg">
  │                 └─ docsHref = /docs/ai-collab-protocols.md#...  → 用 <a href> 同分頁開（**不走 P3 ExternalLink**）
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <TicketAnatomySection />                 (S5 — 新增)
  │           └─ <TicketAnatomyCard id title outcome learning githubHref /> × 3
  │                 ├─ wraps P2 <CardShell padding="md">
  │                 └─ githubHref → <ExternalLink>  ← P3
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <ProjectArchitectureSection />           (S6 — 新增)
  │           └─ <ArchPillarBlock title body testingPyramid? /> × 3 ← wraps P2 <CardShell padding="md">
  └─ <SectionContainer width="wide">                ← P1（底部無 divider）
        └─ <FooterCtaSection />                     (S8 — 新增；**全站共用組件**，同時掛入 HomePage + DiaryPage，見 Q8 決策)
              ├─ email → <a href="mailto:..."> (mailto 非 http，**不走 P3**)
              └─ GitHub / LinkedIn → <ExternalLink> × 2 ← P3
```

**Q8 決策（FooterCtaSection 全站共用）：** PM 已裁決（ticket 設計決策紀錄 2026-04-19）Footer CTA 為全站共用組件，不限於 /about 頁。React 實作上 `FooterCtaSection.tsx` 檔案仍放 `about/`，但 HomePage、DiaryPage、AboutPage 均 import 並在頁面底部渲染此組件。AC-017-FOOTER 的 Playwright 斷言在 `/about` 頁驗通即代表「全站共用組件正確運作」（AC 文字：「Playwright 斷言於 `/about` 頁驗證三個 href 完整匹配 + `mailto:` prefix 正確（代表全站 Footer 組件）」），不需在每個頁面獨立寫 E2E 斷言，但 **Engineer 必須確保 HomePage + DiaryPage 也加入 `<FooterCtaSection />`**。

**關於 S4 docs link vs ExternalLink：** `PillarCard.docsHref` 為站內相對路徑（`/docs/ai-collab-protocols.md#...`），須在同分頁開啟（recruiter 讀完按 back 回 `/about`）。`<ExternalLink>` 寫死 `target="_blank"`，不適用；改用原生 `<a href={docsHref}>`。

**關於 S7 — `BuiltByAIBannerSection`（Pass 3 澄清）：** AboutPage S7 在設計稿中是一個 **mockup 展示卡**（frame `35VCj` 內含 `bannerMock` + `annoRow`），呈現 homepage banner 的設計截圖，**不是真實的 `<BuiltByAIBanner>` 組件**。因此 AboutPage S7 的 React 實作為靜態 section，展示 banner 設計示意（圖片 / 截圖 / inline mockup），不 import 也不渲染 `<BuiltByAIBanner />`。真實的 `<BuiltByAIBanner />` 仍放在 `HomePage.tsx`（見 §2.3）。AboutPage S7 組件命名改為 `<BuiltByAIShowcaseSection />`（放 `frontend/src/components/about/BuiltByAIShowcaseSection.tsx`），以區分「banner 本體」與「展示卡」。

### 2.2 既有 about/ 檔案處置

| 檔名 | 動作 | 理由 |
|------|------|------|
| `PageHeaderSection.tsx` | **改寫**（保留檔名） | S1 新文案取代舊 "What Is This Project?" |
| `RoleCard.tsx` | **重設 interface**（保留檔名） | 由 `responsibilities: string[]` 改為 `owns: string; artefact: string`，符合 AC-017-ROLES |
| `AiCollabSection.tsx` | **刪除** | 舊 5-role cards 被 S3 新 6-role cards 取代 |
| `HumanAiSection.tsx` / `ContributionColumn.tsx` | **刪除** | 舊人機對比，PRD 不再含 |
| `TechDecSection.tsx` / `TechDecCard.tsx` | **刪除** | 舊 tech decisions，被 S6 architecture snapshot 取代 |
| `TechStackSection.tsx` / `TechStackRow.tsx` | **刪除** | 舊 tech stack 表，S6 含必要關鍵詞 |
| `ScreenshotsSection.tsx` / `ScreenshotPlaceholder.tsx` | **刪除** | PRD 無截圖區 |
| `FeaturesSection.tsx` / `FeatureBlock.tsx` | **刪除** | PRD 無 features 清單區 |
| `PhaseGateBanner.tsx` | **刪除** | AiCollabSection 附屬，連帶刪 |

**新增**（放 `frontend/src/components/about/`）：
`MetricsStripSection.tsx` / `MetricCard.tsx` / `RoleCardsSection.tsx` / `ReliabilityPillarsSection.tsx` / `PillarCard.tsx` / `TicketAnatomySection.tsx` / `TicketAnatomyCard.tsx` / `ProjectArchitectureSection.tsx` / `ArchPillarBlock.tsx` / `FooterCtaSection.tsx` / `FooterCtaLink.tsx`

### 2.3 Homepage BuiltByAIBanner + HeroSection v2 + ProjectLogicSection v2 + 時間軸組件樹（含 primitive 引用）

**位置：** `HomePage.tsx` 內，`<UnifiedNavBar />` 下方、`<HeroSection />` 上方（thin banner 在 nav 與 hero 之間，符合 PRD「最上方 thin banner」）。

**組件檔：** `frontend/src/components/home/BuiltByAIBanner.tsx`（新增，放 home/ 子目錄；**不 wrap `<SectionContainer>`**，它是 thin banner 自帶滿寬樣式）。

**Link 機制：** 用 `react-router-dom` 的 `Link to="/about"`（SPA 導航，符合 AC「不發生全頁 reload」）。整條 banner 為單一 `<Link>` 包裹，確保 banner 任何位置 click 都有效。

```
HomePage.tsx
  ├─ <UnifiedNavBar />                              (既有)
  ├─ <BuiltByAIBanner />                            ← 新增（thin banner 自帶樣式，不 wrap P1）
  ├─ <HeroSection />                                ← v2 設計規格（見下方 §2.3.1）
  ├─ <ProjectLogicSection />                        ← v2 設計規格（見下方 §2.3.2）
  ├─ <DevDiarySection milestones loading error />   (既有檔，Pass 3：改用 <DiaryTimelineEntry> 取代舊 DiaryPreviewEntry)
  │     └─ <DiaryTimelineEntry milestone={m}> × N  ← 新建（layout:none 絕對定位，取代 P4 廢棄後的 MilestoneAccordion）
  └─ <HomeFooterBar />                              ← 新建（Pencil hpFooterBar 規格：純文字聯絡資訊；不 wrap P1，自帶底部樣式）
```

#### §2.3.3 hpFooterBar 規格（Pencil frame `4CsvQ` → 子節點 `1BGtd`）

**Pass 4 修正（Q8 Pencil 核對）：** 設計稿實際為純文字 `hpFooterBar`，非 FooterCtaSection（含 email/GitHub/LinkedIn 三個獨立外連）。兩者設計理念不同，不得混用。

| 屬性 | 值 |
|------|---|
| 容器 ID | `1BGtd`（hpFooterBar） |
| 寬度 | fill_container |
| padding | [20, 72]（上下 20px，左右 72px） |
| justifyContent | space_between |
| 頂部 border | stroke inside，fill:#1A1814，thickness top:1 |
| 子節點 | 單一 text node（id: `W3zUd`） |
| 文案 | `"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"` |
| 字型 | Geist Mono 11px，normal，letterSpacing:1 |
| 文字色 | #6B5F4E（中性灰棕） |

**React 實作要點（HomeFooterBar.tsx）：**
- 新建 `frontend/src/components/home/HomeFooterBar.tsx`（放 home/ 子目錄，因為是 Homepage 專屬底部條）
- 純文字，一個 `<p>` 或 `<div>` 包裹整段文案，無獨立 `<a>` 連結（設計稿為純展示，不走 P3 ExternalLink）
- 樣式：`font-mono text-[11px] tracking-[1px] text-[#6B5F4E]`；容器 `px-[72px] py-5 border-t border-[#1A1814] flex justify-between items-center w-full`
- 無 props，文案寫死

**與 FooterCtaSection 的差異：**
- `FooterCtaSection.tsx`（放 about/）：三個獨立連結（email `<a mailto>`、GitHub/LinkedIn `<ExternalLink>`），供 `/about` 頁 S8 使用
- `HomeFooterBar.tsx`（放 home/）：純文字展示，供 `HomePage.tsx` 底部使用
- 兩者互不共用，各自實作

#### §2.3.1 hpHero v2 規格（Pencil frame `zyttw`）

**版面結構：** 單欄 `heroCol`（layout:vertical, gap:18, fill_container）

| 元素 | 文案 | 樣式 |
|------|------|------|
| Heading 第一行 | `"K-line similarity"` *(updated K-057 2026-04-28)* | Geist Mono, 56px, bold, fill:#1A1814, lineHeight:1.1, textGrowth:fixed-width |
| Heading 第二行 | `"lookup engine."` *(updated K-057 2026-04-28)* | 同上，fill:**#9C4A3B**（brick-dark；整行換色） |
| 分隔線 | — | rectangle, width:fill_container, height:1, fill:#2A2520 |
| 副標題 | `"Pattern-matching engine for K-line candlestick charts. Upload historical data, find similar formations, and see what happened next."` | Newsreader, 18px, italic, fill:#1A1814, lineHeight:1.5, textGrowth:fixed-width |
| heroBtns 容器 | — | layout:horizontal, gap:14, width:fill_container |
| CTA 按鈕 `btnPrimary` | `"Run the ETH/USDT Demo →"` *(updated K-057 2026-04-28)* | fill:#2A2520, cornerRadius:6, padding:[12,26]; 文字 Geist Mono 13px bold, letterSpacing:1, fill:#F4EFE5 |

**React 實作要點：**
- `<HeroSection />` 不接 props，文案寫死對應 Pencil 原文
- Heading 兩行為**兩個獨立 `<h1>` 元素**（或 `<span>` 各自設色）：第一行用 `text-[#1A1814]`，第二行用 `text-[#9C4A3B]`
- 分隔線：`<hr>` 或 `<div className="h-px bg-[#2A2520]">`
- CTA 按鈕 `"Try the App →"`：`<Link to="/app">` 包裹（SPA 導航）；若仍為外部或預留，用 `<a href="/app">`
- `heroBtns` 僅含單一 CTA（Pencil 設計稿為一顆按鈕）

#### §2.3.2 hpLogic v2 規格（Pencil frame `b8KQJ`）

**版面結構：** layout:vertical, gap:28, width:fill_container

**logicHead 子區塊（`xqt6y`，layout:horizontal, gap:16, alignItems:center）：**
| 元素 | 文案 / 屬性 |
|------|------------|
| `logicStamp` | `"§ PROJECT LOGIC"`，Geist Mono 16px bold, fill:#F4EFE5；背景 fill:#9C4A3B；padding:[8,14]；rotation:**-3°** |
| 橫線 | rectangle, width:fill_container, height:1, fill:#8B7A6B |
| label | `"HOW IT WORKS"`，Geist Mono 11px, letterSpacing:2, fill:#1A1814 |

**副標題文案（`BMFct`）：**
`"— The engine scans historical K-line data to find windows that resemble the current formation, then shows you the price action that followed."`
- Newsreader, 15px, italic, fill:#1A1814, lineHeight:1.6, textGrowth:fixed-width

**logicSteps 容器（`LTwuW`，layout:horizontal, gap:14, width:fill_container）— 三欄等寬步驟卡：**

| 步驟卡 | Header 文案 | Body 標題 | Body 說明 |
|--------|------------|-----------|----------|
| step1 | `"STEP 01 · INGEST"` | `"Upload"` | `"Drop in a CSV of 24 × 1H OHLC bars. The reference sample."` |
| step2 | `"STEP 02 · MATCH"` | `"Scan"` | `"Cosine similarity walks the history database to rank windows."` |
| step3 | `"STEP 03 · PROJECT"` | `"Project"` | `"Show the price action that followed each matched window."` |

步驟卡通用樣式（`AP34H` / `4QeGF` / `BFjhU`）：
- 容器：layout:vertical, cornerRadius:6, border:1px solid #1A1814, fill:#F4EFE5, width:fill_container
- Header（`8mtkT`/`PBh8T`/`uT8HX`）：fill:#2A2520, padding:[6,10], width:fill_container；文字 Geist Mono 10px, letterSpacing:2, fill:#F4EFE5
- Body（`yflh6`/`T9ULd`/`gxlZs`）：layout:vertical, gap:12, padding:20
  - 標題：Bodoni Moda 24px italic bold, fill:#1A1814
  - 分隔線：rectangle, width:40, height:1, fill:#2A2520
  - 說明：Newsreader 13px italic, lineHeight:1.55, fill:#1A1814, textGrowth:fixed-width

**techRow（`MUEQA`，layout:horizontal, gap:10, alignItems:center）：**
- Label：`"STACK —"` Geist Mono 11px, letterSpacing:2, fill:#6B5F4E
- 值：`"React · TypeScript · Vite · FastAPI · Python · Playwright"` Geist Mono 11px, letterSpacing:1, fill:#1A1814

**React 實作要點：**
- `logicStamp` 的 rotation:-3° → 用 `className="rotate-[-3deg]"`（Tailwind）
- 三欄步驟卡用 `<div className="grid grid-cols-3 gap-3.5">` 或 `flex gap-3.5`
- 步驟卡 header 背景 #2A2520 需明確設 `bg-[#2A2520]`；body 背景 #F4EFE5 繼承父容器
- `<ProjectLogicSection />` 不接 props，文案寫死

**Homepage hpDiary 實作要點（Pass 3 Pencil 核對後）：**
- Rail：`position:absolute` 的 `<div>` 模擬 rectangle（`fill:"#2A2520"`, `width:1`, `height:304`, `x:29, y:40`），直接 inline 於 `<DevDiarySection>` 容器
- Marker：每個 `<DiaryTimelineEntry>` 內部 absolute 定位的 `<span>`（`cornerRadius:6, fill:"#9C4A3B", w-5 h-3.5, x:20, y:10`）
- Date / Title / Body 均用 absolute 定位（`x:92`），對應 Pencil frame 結構

**Homepage / Diary timeline pattern 差異（Pass 3 確認）：**
- Homepage hpDiary：`layout:none` frame + absolute rectangle rail + absolute marker per-entry
- Diary dpList：flexbox 雙欄（date left / content right），right column 用 `stroke:{thickness:{left:1}}` 製造左邊線軌道感，**無獨立 rail rectangle，無 marker**
- 兩者 pattern 根本不同 → P5/P6/P4 刪除，各自 inline 實作（不再有「條件性 primitive」待確認的步驟）

**About S7（Pass 3 澄清）：** 設計稿 frame `35VCj` 內 S7 `S7_BuiltByAIBannerSection` 為 mockup 展示卡（`bannerMock` + `annoRow`），非真實 banner。React 實作為靜態 `<BuiltByAIShowcaseSection />` 展示 banner 設計示意；真實 `<BuiltByAIBanner />` 仍置於 `HomePage.tsx` 此處。

### 2.4 Props Interface（TypeScript pseudo-code）

```ts
// PageHeaderSection — 無 props，文案寫死對應 AC-017-HEADER
interface PageHeaderSectionProps {}

// MetricsStripSection — 無 props，內部定義 4 筆 MetricCard data
interface MetricCardProps {
  title: string
  subtext: string
}

// RoleCardsSection — 無 props，內部定義 6 筆 role data
interface RoleCardProps {
  role: 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'
  owns: string         // e.g. "Requirements, AC, Phase Gates"
  artefact: string     // e.g. "PRD.md, docs/tickets/K-XXX.md"
}

// ReliabilityPillarsSection — 無 props
interface PillarCardProps {
  title: 'Persistent Memory' | 'Structured Reflection' | 'Role Agents'
  body: ReactNode                    // 可能含 <code>，用 ReactNode 保留格式化彈性
  anchorQuote: string                // blockquote italic 引用句
  docsHref: string                   // e.g. "/docs/ai-collab-protocols.md#per-role-retrospective-log"
}

// TicketAnatomySection — 無 props
interface TicketAnatomyCardProps {
  id: 'K-002' | 'K-008' | 'K-009'
  title: string                      // e.g. "UI optimization"
  outcome: string                    // 一句 outcome
  learning: string                   // 一句 learning
  githubHref: string                 // 完整 GitHub blob URL
}

// ProjectArchitectureSection — 無 props
interface ArchPillarBlockProps {
  title: 'Monorepo, contract-first' | 'Docs-driven tickets' | 'Three-layer testing pyramid'
  body: ReactNode
  testingPyramid?: Array<{ layer: 'Unit' | 'Integration' | 'E2E'; detail: string }>
}

// FooterCtaSection
interface FooterCtaLinkProps {
  href: string
  label: string
  external: boolean                  // true → target=_blank + rel=noopener noreferrer
}

// Homepage banner
interface BuiltByAIBannerProps {}    // 無 props；文案寫死對應 AC-017-BANNER
```

**Why no props for Section roots：** 所有文案由 PRD / AC 鎖死，不需外部注入；寫死在組件內讓 grep 找 AC 文字時一步即到。Sub-component（MetricCard / RoleCard / …）接 props 以減少重複 JSX。

---

## 3. `scripts/audit-ticket.sh` 架構

### 3.1 檔案位置

`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/scripts/audit-ticket.sh`
（`scripts/` 目錄不存在 → 新建；不是 `frontend/scripts/` 或 `backend/scripts/`，因為此 script 對整個 K-Line-Prediction 子專案做 audit）

### 3.2 模組化（bash function 拆分）

```bash
# Pseudo-code structure — 非實作

set -euo pipefail

# ── Utilities ─────────────────────────────────────
log_ok()    { printf '\033[0;32m[OK]\033[0m    %s\n' "$1"; }
log_warn()  { printf '\033[0;33m[WARN]\033[0m  %s\n' "$1"; warn_count=$((warn_count+1)); }
log_fail()  { printf '\033[0;31m[FAIL]\033[0m  %s\n' "$1"; fail_count=$((fail_count+1)); }
log_skip()  { printf '\033[0;90m[SKIP]\033[0m  %s\n' "$1"; }
header()    { printf '\n\033[1m=== %s ===\033[0m\n' "$1"; }

# Detect if stdout is TTY — when piped / CI, disable colour via NO_COLOR fallback
if [[ ! -t 1 ]] || [[ -n "${NO_COLOR:-}" ]]; then
  # redefine log_* to strip ANSI
fi

# Parse frontmatter field (grep + sed)
read_frontmatter_field() { … ; }     # $1=file, $2=field_name

# Date comparison helper — returns 0 if $1 < $2 (YYYY-MM-DD string compare works)
date_lt() { [[ "$1" < "$2" ]]; }

# ── Check Groups ──────────────────────────────────
check_a_ticket_file()      { … }    # frontmatter 必填 + status=closed 時須有 closed date
check_b_ac()               { … }    # ## 驗收條件 section 存在 + PRD.md grep "AC-XXX-"
check_c_architecture()     { … }    # docs/designs/K-XXX-*.md 存在 OR ticket 聲明「無需 Architecture」; 設計檔需 ## Retrospective
check_d_commit_trail()     { … }    # git log --grep="K-XXX" ≥ 1 + 排除 vague msg (wip/fix only)
check_e_code_review()      { … }    # ticket ## Retrospective 有 Reviewer 反省段
check_f_retrospectives()   { … }    # 5 角色反省段 + per-role log 有 ## YYYY-MM-DD — K-XXX entry
check_g_qa_playwright()    { … }    # grep spec + docs/reports/K-XXX-*.html 存在

# ── Main Dispatcher ───────────────────────────────
main() {
  local ticket_id="$1"
  local ticket_file="docs/tickets/${ticket_id}-*.md"
  # glob expansion → 取第一個 match

  header "Ticket ${ticket_id}"

  # A is hard prerequisite — if fails, exit 2 immediately
  check_a_ticket_file "$ticket_id" || { log_fail "A failed; cannot continue"; exit 2; }

  check_b_ac "$ticket_id"
  check_c_architecture "$ticket_id"
  check_d_commit_trail "$ticket_id"
  check_e_code_review "$ticket_id"

  # F/G skip logic
  local created
  created=$(read_frontmatter_field "$actual_ticket_file" "created")
  if date_lt "$created" "2026-04-18"; then
    log_skip "F (created=$created < 2026-04-18 — per-role retro 機制啟用前)"
    log_skip "G (same reason)"
  else
    check_f_retrospectives "$ticket_id"
    check_g_qa_playwright "$ticket_id"
  fi

  # Summary + exit code
  if (( fail_count > 0 )); then exit 2; fi
  if (( warn_count > 0 )); then exit 1; fi
  exit 0
}

main "$@"
```

### 3.3 Exit code 規則

| Exit | 意義 | 觸發條件 |
|------|------|----------|
| 0 | All pass | 無 FAIL、無 WARN |
| 1 | Warning | 至少 1 個 WARN（e.g. D 組 vague commit msg）且無 FAIL |
| 2 | Critical missing | 至少 1 個 FAIL（e.g. ticket file 不存在、AC 段缺） |

### 3.4 Date-based skip 邏輯

- `created < 2026-04-18` → skip F / G（不計 WARN / FAIL，純資訊）
- 字串比較即可：bash 的 `[[ "$a" < "$b" ]]` 對 `YYYY-MM-DD` 字典序正確
- 邊界：`created = 2026-04-18` → **不 skip**（含等號的那天起啟用機制，與 PRD "K-008 起啟用" 對齊）

### 3.5 Output 著色策略

- 用 **ANSI escape code**（`\033[...m`），不用 `tput`：`tput` 依賴 terminfo，某些 CI runner / `less -R` 有相容問題
- TTY detect：`[[ -t 1 ]]`，非 TTY 或 `NO_COLOR` env var 設定時 → 重新定義 `log_*` 為無色版本
- Symbol 統一：`[OK]` / `[WARN]` / `[FAIL]` / `[SKIP]`，不用 emoji（對齊 CLAUDE.md 規範 + 對 old-school CI log viewer 相容）

### 3.6 檔案路徑假設

| 類別 | 路徑模板 | Check |
|------|----------|-------|
| Ticket | `docs/tickets/K-XXX-*.md`（glob） | A, B, E, F |
| Design | `docs/designs/K-XXX-*.md`（glob，可多份） | C |
| PRD | `PRD.md`（專案根） | B |
| Per-role retro | `docs/retrospectives/{pm,architect,engineer,reviewer,qa,designer}.md` | F |
| Visual report | `docs/reports/K-XXX-*.html`（glob） | G |
| Playwright specs | `frontend/e2e/*.spec.ts`（grep K-XXX） | G |
| Git log | `git log --all --grep="K-XXX" --oneline` | D |

**Working directory 約定：** script 必須從專案根目錄（K-Line-Prediction/）執行。script 開頭加：
```bash
cd "$(dirname "$0")/.." || exit 2    # 自動切到專案根
```

---

## 4. `docs/ai-collab-protocols.md` 結構

### 4.1 檔案位置

`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/ai-collab-protocols.md`

### 4.2 章節結構

```markdown
---
title: AI Collaboration Protocols — K-Line Prediction
type: reference
tags: [AI-Collab, Protocols, Public]
updated: YYYY-MM-DD
---

# AI Collaboration Protocols

[1 paragraph intro — One operator, 6 AI agents, every feature leaves a doc trail.]

## Role Flow  {#role-flow}
### The 6 Roles
[Table mirroring /about S3 — Role / Owns / Artefact]
### Handoff Sequence
[PM → Architect → Engineer → Reviewer → QA → PM diagram in ASCII or simple prose]
### What "No artifact = no handoff" means
[Verifiable via ./scripts/audit-ticket.sh K-XXX]

## Bug Found Protocol  {#bug-found-protocol}
### The Four Steps
1. Reflect (responsible role)
2. PM confirms reflection quality
3. Write memory entry
4. Fix released
### Example — K-008 W2/S3
[2-3 sentences pointing to actual ticket]
### Example — K-009 TDD bug fix
[2-3 sentences]

## Per-role Retrospective Log  {#per-role-retrospective-log}
### Mechanism
[docs/retrospectives/<role>.md; K-008 起啟用; YYYY-MM-DD / 做得好 / 沒做好 / 下次改善 format]
### Curated Retrospective Excerpts  {#curated-excerpts}
[2–3 curated English excerpts — see §4.4 selection criteria]

## Verification
[How a recruiter can verify — ./scripts/audit-ticket.sh K-002 / K-008 / K-009]
```

### 4.3 Anchor ID 規劃

GitHub-flavored markdown 自動從 H2 slug 產生 anchor，但為穩定性我們**顯式加 `{#id}`**（redcarpet 忽略、GFM 保留、markdown-it 等多數 renderer 支援）。

| Pillar in `/about` S4 | Inline link target | Markdown anchor |
|------------------------|--------------------|-----------------|
| Persistent Memory | `/docs/ai-collab-protocols.md#per-role-retrospective-log` | `## Per-role Retrospective Log  {#per-role-retrospective-log}` |
| Structured Reflection | `/docs/ai-collab-protocols.md#bug-found-protocol` | `## Bug Found Protocol  {#bug-found-protocol}` |
| Role Agents | `/docs/ai-collab-protocols.md#role-flow` | `## Role Flow  {#role-flow}` |

**注意：** PRD AC-017-PILLARS 寫「每個 pillar 底部有 inline link 導向 `/docs/ai-collab-protocols.md`」——未強制 anchor。但若不加 anchor，recruiter 需手動滾動才找得到對應 section。**建議 Engineer 實作時加 anchor，並於 PR 描述標註此為「超出 AC 最低要求的 UX 增益」**，讓 PM 確認。

**部署考量：** Firebase Hosting rewrite 規則已把所有非 asset request 打到 `/index.html` SPA。靜態 `.md` 檔訪問需要：
- 方案 1（推薦）：把 `docs/ai-collab-protocols.md` **copy 到 `frontend/public/docs/ai-collab-protocols.md`**，build 時進 `frontend/dist/docs/`，可直接訪問
- 方案 2：在 `firebase.json` 加 exact-match `docs/*.md` rewrite（更動部署 config，風險高）

**推薦方案 1**：新增一個 `frontend/public/docs/` 目錄同步。Engineer 實作時用 `cp docs/ai-collab-protocols.md frontend/public/docs/` 或 symlink。**此為 Engineer 任務，要求在實作清單中明示**。

### 4.4 Curated retrospective 節選原則（2–3 條）

**挑選來源：** `docs/retrospectives/architect.md` / `reviewer.md` / `qa.md` / `pm.md`（per-role log），不從單票 `## Retrospective` 挑（單票屬內部紀錄、未經公開整理）。

**挑選原則：**
1. **必含「根因 + 下次改善」**：空泛「溝通要好一點」不選；要有可驗證的行為改動
2. **覆蓋不同角色**：3 條挑時 cover ≥ 2 個 role，避免全是 Architect
3. **時間近 30 天**：有新鮮度，對應 K-008 ~ K-017 的 retrospective
4. **避免重複 memory index 已有條目**：若某反省已提煉成 `MEMORY.md` 的 rule，則不再節選（KB 格式原則）

**建議候選（供 Engineer 參考，最終由使用者挑）：**
- Architect 2026-04-18 K-008 W2/S3 — directory drift 根因 + ticket-level 回填義務
- Reviewer 2026-04-18 K-008 — W2 為何 review 未攔截（若 log 有記）
- QA（待 K-017 完成後補；若 K-008 QA 反省合適亦可）

**引用格式：**
```markdown
### [Architect] 2026-04-18 — K-008 W2/S3 drift
> Source: [docs/retrospectives/architect.md](./retrospectives/architect.md)
>
> [原文引用 2-4 行]
>
> **Lesson codified:** [一句總結]
```

---

## 5. 檔案異動清單（Pass 2 — 含 primitive + hook）

### 新增（26 檔）

**Primitive（P1–P3，K-017 Pass 2 新抽；P4–P7 Pass 3 DELETED）：**

| 檔案 | 職責 | 見 |
|------|------|-----|
| `frontend/src/components/primitives/SectionContainer.tsx` | P1 — 外層 section wrapper（width/divider/paddingY） | §2.0.1 |
| `frontend/src/components/primitives/CardShell.tsx` | P2 — 共用 card 容器（padding/border） | §2.0.1 |
| `frontend/src/components/primitives/ExternalLink.tsx` | P3 — 新分頁外連（寫死 target=_blank + rel=noopener noreferrer） | §2.0.1 |
| ~~`frontend/src/components/primitives/MilestoneAccordion.tsx`~~ | **DELETED（Pass 3）** — P4 廢棄；各自 inline 實作 | §2.0.1 |
| ~~`frontend/src/components/primitives/VerticalRail.tsx`~~ | **DELETED（Pass 3）** — P5 Pencil 核對後兩頁 pattern 不共用 | §2.0.1 |
| ~~`frontend/src/components/primitives/TimelineMarker.tsx`~~ | **DELETED（Pass 3）** — P6 同 P5，Diary 無 marker | §2.0.1 |
| ~~`frontend/src/components/primitives/DiaryEntryRow.tsx`~~ | **DELETED（Pass 3）** — P7 隨 P4 廢棄 | §2.0.1 |

**Pass 3 新增（替代 P4）：**

| 檔案 | 職責 | 見 |
|------|------|-----|
| `frontend/src/components/home/DiaryTimelineEntry.tsx` | Homepage hpDiary entry（layout:none 絕對定位；rail/marker inline 於 DevDiarySection；取代舊 DiaryPreviewEntry） | §2.3 |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | S7 AboutPage mockup 展示卡（靜態 section；非真實 banner 組件） | §2.1 |

**Custom hook：**

| 檔案 | 職責 | 見 |
|------|------|-----|
| `frontend/src/hooks/useDiary.ts` | `useDiary(limit?)` — 封裝 diary fetch + AsyncState；HomePage / DiaryPage 共用 | §2.0.2 |

**`/about` 新 section 組件：**

| 檔案 | 職責 |
|------|------|
| `frontend/src/components/about/MetricsStripSection.tsx` | S2 容器，內含 4 張 MetricCard；外層 wrap P1 |
| `frontend/src/components/about/MetricCard.tsx` | 單張 metric（title + subtext）；內部 wrap P2 |
| `frontend/src/components/about/RoleCardsSection.tsx` | S3 容器，內含 6 張 RoleCard；外層 wrap P1 |
| `frontend/src/components/about/ReliabilityPillarsSection.tsx` | S4 容器，內含 3 張 PillarCard；外層 wrap P1 |
| `frontend/src/components/about/PillarCard.tsx` | 單支 pillar（title + body + italic quote + docs link 用原生 `<a>`）；內部 wrap P2 |
| `frontend/src/components/about/TicketAnatomySection.tsx` | S5 容器，內含 3 張 TicketAnatomyCard；外層 wrap P1 |
| `frontend/src/components/about/TicketAnatomyCard.tsx` | 單張 ticket card；GitHub link 用 P3；內部 wrap P2 |
| `frontend/src/components/about/ProjectArchitectureSection.tsx` | S6 容器，內含 3 個 ArchPillarBlock；外層 wrap P1 |
| `frontend/src/components/about/ArchPillarBlock.tsx` | 單個 arch pillar（含可選 testing pyramid list）；內部 wrap P2 |
| `frontend/src/components/about/FooterCtaSection.tsx` | S8 容器；外層 wrap P1；email 用原生 `<a mailto:>`；GitHub / LinkedIn 用 P3 |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | S7 容器；靜態 mockup 展示卡（bannerMock 示意圖 + annoRow）；**非真實 BuiltByAIBanner 組件**（Pass 3 澄清） |

**Homepage + script + docs + E2E：**

| 檔案 | 職責 |
|------|------|
| `frontend/src/components/home/BuiltByAIBanner.tsx` | S7 HomePage thin banner → `/about`（不 wrap P1，自帶滿寬樣式） |
| `frontend/src/components/home/DiaryTimelineEntry.tsx` | Homepage hpDiary entry（layout:none 絕對定位；取代廢棄的 P4 MilestoneAccordion）（Pass 3 新增） |
| `frontend/src/components/home/HomeFooterBar.tsx` | **Pass 4 新增**：Pencil hpFooterBar 純文字聯絡資訊（`"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"`）；Geist Mono 11px #6B5F4E；頂部 border #1A1814；無連結；供 HomePage 底部使用（見 §2.3.3） |
| `scripts/audit-ticket.sh` | Portfolio demo audit script |
| `docs/ai-collab-protocols.md` | 公開版協議文件（英文） |
| `frontend/public/docs/ai-collab-protocols.md` | Build-time copy（見 AC-017-BUILD），**.gitignore 後不 commit** |
| `frontend/e2e/about.spec.ts` | `/about` 8 sections 的 Playwright 斷言 |
| `frontend/e2e/homepage-banner.spec.ts` | AC-017-BANNER 斷言（或加入既有 pages.spec.ts，Engineer 裁定） |
| `backend/tests/test_audit_script.py` 或 bats test（**可選**） | audit-ticket.sh smoke test（AC-017-AUDIT 四個 case） |
| `docs/reports/K-017-visual-report.html` | QA 階段產出（非實作交付物） |

**~~FooterCtaLink.tsx~~（Pass 2 刪除計畫）：** Pass 1 規劃的 `FooterCtaLink.tsx` 被 P3 `<ExternalLink>` 取代，**不新增此檔**。Footer 內 email 用原生 `<a href="mailto:">`，GitHub / LinkedIn 直接用 `<ExternalLink>`，無需額外 wrapper。

### 修改（11 檔）

| 檔案 | 改動 | 決策來源 |
|------|------|---------|
| `frontend/src/pages/AboutPage.tsx` | 整段 JSX 替換為新 8-section tree（含 P1 wrap） | PRD |
| `frontend/src/pages/HomePage.tsx` | 在 `<UnifiedNavBar />` 與 `<HeroSection />` 之間插入 `<BuiltByAIBanner />`；fetch diary 邏輯改用 `useDiary(3)`；**頁面底部加入 `<HomeFooterBar />`（Pencil hpFooterBar 純文字，Pass 4 修正）** | PRD + Q2-A + Q8（Pencil 核對） |
| `frontend/src/pages/DiaryPage.tsx` | fetch diary 邏輯改用 `useDiary()`；retry 按鈕接 `refetch`；**頁面底部加入 `<FooterCtaSection />`（Q8 全站共用）** | Q2-A + Q8 |
| `frontend/src/components/about/PageHeaderSection.tsx` | 文案改為 S1（One operator 聲明）；外層 wrap P1 | PRD |
| `frontend/src/components/about/RoleCard.tsx` | Interface 由 `{ role, responsibilities: string[], borderColorClass }` 改為 `{ role, owns, artefact, borderColorClass? }`；`role` enum 去 `'Senior Architect'`、加 `'Reviewer'`（合成 6 role）；內部 wrap P2 | Q6-A + AC-017-ROLES |
| `frontend/src/components/common/CtaButton.tsx` | `external=true` 分支的 `rel="noreferrer"` → `rel="noopener noreferrer"` | Q7-A |
| `frontend/src/components/diary/DiaryTimeline.tsx` | **Pass 3 修正：不改用 P4**（P4 已刪除）；`<MilestoneSection>` 保留原有，Diary 沿用現有 flexbox 雙欄結構 | Pass 3 |
| `frontend/src/components/home/DevDiarySection.tsx` | 內部 `<DiaryPreviewEntry>` → 新建 `<DiaryTimelineEntry>`（layout:none 絕對定位，取代廢棄的 P4）；props 接 `{ milestones, loading, error }`（對齊 `useDiary`） | Pass 3 + Q2-A |
| `frontend/package.json` | `scripts.prebuild` 新增 `mkdir -p public/docs && cp ../docs/ai-collab-protocols.md public/docs/`（AC-017-BUILD） | AC-017-BUILD |
| `frontend/.gitignore`（或專案根 .gitignore） | 加 `frontend/public/docs/` | AC-017-BUILD |
| `agent-context/architecture.md` | `updated:` 改 2026-04-19；Directory Structure 子樹更新（about/ 13 檔刪除 + 10 檔新增 / 2 檔修改 + home/ 加 BuiltByAIBanner + DiaryTimelineEntry + 新增 primitives/ 子目錄 3 檔（P1-P3）+ hooks/ 加 useDiary.ts；**diary/ MilestoneSection.tsx / DiaryEntry.tsx 保留不動（Pass 3）**）；Frontend Routing 表 `/about` 說明更新；新增 `## Scripts & Public Protocols Doc` 段；`## Primitives & Shared Hooks` 段新增（K-017 Pass 2 抽出）；`## Changelog` 加 2026-04-19 Pass 2+3 一筆 | 本文件 Step 7 |

### 刪除（14 檔）

**`frontend/src/components/about/` 下（12 檔，Pass 1 既有）：**
`AiCollabSection.tsx` / `HumanAiSection.tsx` / `ContributionColumn.tsx` / `TechDecSection.tsx` / `TechDecCard.tsx` / `TechStackSection.tsx` / `TechStackRow.tsx` / `ScreenshotsSection.tsx` / `ScreenshotPlaceholder.tsx` / `FeaturesSection.tsx` / `FeatureBlock.tsx` / `PhaseGateBanner.tsx`

**`frontend/src/components/diary/` 下（Pass 3 修正：不刪除）：**
`MilestoneSection.tsx` 和 `DiaryEntry.tsx` **保留**（Pass 2 原計畫由 P4/P7 取代，但 P4/P7 已廢棄，Diary 頁維持現有組件不變）

**`frontend/src/components/home/` 下（1 檔）：**
`DiaryPreviewEntry.tsx`（由 Pass 3 新建的 `DiaryTimelineEntry.tsx` 取代）

（共 13 檔刪除；較 Pass 2 少 2 檔，因 MilestoneSection / DiaryEntry 保留）

**另外：** 既有 `frontend/e2e/pages.spec.ts` 內任何斷言舊 AboutPage 文字（"What Is This Project?" / "AI COLLABORATION" / "HUMAN-AI SYNERGY" / "CONTRIBUTIONS" / "TECH DECISIONS" / "SCREENSHOTS" / "TECH STACK" / "FEATURES"）的測試必須**移除或改寫**。見 §7.4 E2E 風險段。

---

## 6. 實作順序

**Phase A — 可平行（無相互依賴）：**
- **A0. Pre-implementation grep scan（Pass 2 新增 — 強制執行）** — 見 §7.11 Engineer 首要步驟，輸出 E2E 修改清單給 PM 驗收前 review
- ~~**A0.1. Pencil .pen 核對（Pass 2 — Q8）**~~ — **REMOVED（Pass 3）**：Pencil 核對已由 Architect Pass 3 完成，P5/P6 正式刪除，無需 Engineer 再核對。此步驟取消
- A1. `scripts/audit-ticket.sh` 開發 + smoke test（bash，獨立）
- A2. `docs/ai-collab-protocols.md` 撰寫（純文件）
- A3. `primitives/` 3 檔 scaffold（`SectionContainer` / `CardShell` / `ExternalLink`；**Pass 3：P4/P5/P6/P7 已刪除，不 scaffold**）
- A3b. `home/DiaryTimelineEntry.tsx` scaffold（Pass 3 新增，取代廢棄的 P4）
- A4. `hooks/useDiary.ts` 抽出（對齊 §2.0.2 signature + 遷移計畫）
- A5. `/about` 新 section 組件檔（新增 11 個檔，含 Pass 3 新增的 `BuiltByAIShowcaseSection.tsx`；wrap P1 / P2 / P3 依 §2.1 樹）

**Phase B — 依賴 A3：**
- B1. `AboutPage.tsx` 重組 import + JSX
- B2. `PageHeaderSection.tsx` / `RoleCard.tsx` 改寫（interface 先定，再給新 RoleCardsSection 用）
- B3. 舊組件刪除（B1/B2 完成後安全刪）

**Phase C — 依賴 B：**
- C1. `HomePage.tsx` 插 `BuiltByAIBanner` + 遷移至 `useDiary(3)` + **新建並加入 `<HomeFooterBar />`**（Pencil hpFooterBar 純文字規格，見 §2.3.3；Pass 4 修正：非全站共用的 FooterCtaSection，為 Homepage 專屬純文字底部條）
  - 先新建 `frontend/src/components/home/HomeFooterBar.tsx`（純文字展示，Geist Mono 11px #6B5F4E，無 `<a>` 連結）
  - 再在 `HomePage.tsx` 最底部 import + 渲染 `<HomeFooterBar />`
- C2. `DiaryPage.tsx` 遷移至 `useDiary()` + 加入 `refetch`（**注意：DiaryPage 不加 HomeFooterBar；Q8 決策已由 Pencil 核對修正，hpFooterBar 為 Homepage 專屬設計**）
- C3. `frontend/public/docs/ai-collab-protocols.md` sync — **改用 `prebuild` hook 自動 copy**（AC-017-BUILD），不手 cp
- C4. 刪除 `DiaryPreviewEntry.tsx`（被 `DiaryTimelineEntry.tsx` 取代）
  - **注意：`MilestoneSection.tsx` 與 `DiaryEntry.tsx` 不刪除** — P4/P7 已於 Pass 3 廢棄，Diary 頁維持現有組件，此二檔保留（見 §2.0.1 P4 廢棄說明 + §5 刪除清單）
- C5. `HeroSection.tsx` 改寫為 v2 設計規格（§2.3.1）：
  - heading 兩行分色（#1A1814 / #9C4A3B）
  - 副標題 Newsreader 18px italic
  - 分隔線 `<div className="h-px bg-[#2A2520]">`
  - `"Try the App →"` CTA 按鈕（#2A2520 背景，rounded，Geist Mono）
  - **驗證：** `npx tsc --noEmit` pass；Playwright AC-HOME-1 中 Hero heading 斷言對齊新文案
- C6. `ProjectLogicSection.tsx` 改寫為 v2 設計規格（§2.3.2）：
  - `logicStamp` rotation:-3°（`className="rotate-[-3deg]"`）+ #9C4A3B 背景
  - 三欄步驟卡 `grid grid-cols-3`（或 flex），各自 header(#2A2520) + body(Bodoni Moda title + 40px 分隔 + Newsreader 說明）
  - `techRow`：Geist Mono 11px，`"STACK — React · TypeScript · Vite · FastAPI · Python · Playwright"`
  - **驗證：** 同上，Playwright AC-HOME-1 中 ProjectLogic 斷言對齊新文案

**Phase D — 依賴 A + B + C：**
- D1. Playwright `about.spec.ts` 寫斷言 + 跑
- D2. Playwright banner 斷言（新增或加 pages.spec.ts）
- D3. 按 §7.11 R1 / R2 / R3 / R4 / R6 逐條改寫 E2E 斷言（`pages.spec.ts` AC-ABOUT-1 全改 / AC-HOME-1 檢查 index-based selector / AC-DIARY-1 檢查 P4 DOM 兼容）
- D4. `npx tsc --noEmit` 通過
- D5. `/playwright` 全跑

**Phase E — 最後：**
- E1. Architecture doc 更新（Architect 任務，已在本文件 Step 強制步驟 a 執行）
- E2. Visual report 產出（QA）

**可平行關鍵路徑：** A0 → A1 / A2 / A3 / A3b / A4 / A5 初版同時展開可壓 Engineer 工時；~~A0.1~~（Pass 3 已取消，Pencil 核對由 Architect 完成）。

---

## 7. 風險與注意事項

### 7.1 命名 / 拼寫 mismatch（高）
AC-017-HEADER 對 "PM / architect / engineer / reviewer / QA / designer" 逐字大小寫敏感（Playwright `{ exact: true }`）。AC-017-ROLES 又要求 role 名為 "PM / Architect / Engineer / Reviewer / QA / Designer"（S3 大寫化）。**Engineer 須嚴格區分 S1 文案（全小寫角色名）vs S3 card title（Title Case）**，不要在 refactor 時統一。

### 7.2 Playwright 斷言脆弱處（高）
- AC-017-METRICS 「Playwright 斷言逐條驗證 4 個 metric title 與其對應 subtext，不依 index 定位」→ 每張 MetricCard 加 `data-metric-title="Features Shipped"` 或用 `getByRole('heading', { name: 'Features Shipped', exact: true })` + sibling selector 鎖 subtext
- AC-017-ROLES 「6 × 3 = 18 條斷言」→ 建議每張 card wrap in `<article data-role="PM">`，`page.locator('[data-role="PM"]').getByText(owns_text)` 穩定
- AC-017-PILLARS 「anchor blockquote」→ italic blockquote 要用真正的 `<blockquote><em>...` 還是 markdown syntax `> *...*` 渲染？React 組件不 auto-render markdown，須手寫 JSX `<blockquote><em>...</em></blockquote>`

### 7.3 外部 link 安全
AC-017-FOOTER 明定 `rel="noopener noreferrer"` + `target="_blank"`。既有 `CtaButton` 只設 `rel="noreferrer"`（漏 `noopener`）—**FooterCtaLink 不能直接複用 CtaButton，必須自己寫完整 rel**。Ticket anatomy card 的 GitHub link 亦同。

### 7.4 SEO / accessibility
- `<h1>` 在 `/about` 只能一個（現 PageHeaderSection 用 h1，新設計 S1 沿用 h1）。S2/S3/S4/S5/S6/S8 的 section title 改用 `<h2>`。`SectionHeader` 組件預設 `<h2>`，直接複用。
- `aria-label` 給 BuiltByAIBanner（整條 Link）以對 screen reader friendly：`aria-label="About the AI collaboration behind this project"`.
- 文案全英文 → `<html lang="en">` 已設（main.tsx `index.html` 預設），不需改。

### 7.5 i18n
目前專案無 i18n 框架。PRD S1 / S7 / S8 全英文，S1 PM 確認為 recruiter 導向。若未來加 zh-TW 版本，S1 hero 文案需特別處理（重寫而非直譯）。**K-017 scope 只出英文版**。

### 7.6 Bash portability（macOS vs Linux）
`audit-ticket.sh` 若在 Linux CI 跑：
- `grep -E` 兩平台一致
- `sed -i` 在 macOS 需要 `sed -i ''`；**本 script 不做 in-place edit，純 read-only**，無此問題
- `[[ "$a" < "$b" ]]` 在 bash 3.2+（macOS 預設 bash）與 bash 4+ 皆可
- `date` 命令不用（僅字串比較 created），省掉 macOS BSD date vs GNU date 差異
- Shebang 用 `#!/usr/bin/env bash`（不用 `#!/bin/bash`，macOS `/bin/bash` 是 3.2）

### 7.7 Curation 選擇權（中）
挑哪 2–3 條 retrospective 節選**不是 Architect 決策**——涉及對外呈現判斷，應由 PM / 使用者確認。Architect 僅規定 4.4 挑選原則 + 引用格式，Engineer 實作時列候選交使用者選。

### 7.8 Firebase Hosting `.md` 訪問
（見 §4.3 方案 1）Engineer 必須把 `docs/ai-collab-protocols.md` 複製到 `frontend/public/docs/` 下，否則 `/docs/ai-collab-protocols.md` 在 production 會被 SPA fallback 吞掉導回 HomePage。**Playwright E2E 應加一條斷言：navigate 到 `/docs/ai-collab-protocols.md` 得到 markdown 文字（或 raw content），而非 HomePage。**

### 7.9 Drift 預防
Architect doc 同步規則已要求每張票回寫 architecture.md。本票實作過程 Engineer 若新增非計畫內組件（e.g. decorative divider），PM 驗收時需檢查 §5 異動清單與實際 git diff 對照，任何偏差回召 Architect 同步。

### 7.10 K-017 PRD 的 17 tickets 計數
AC-017-METRICS 「Features Shipped 的 subtext 為 "17 tickets, K-001 → K-017"」是寫死的 snapshot。若實作期間新增 K-018 / K-019，此數字 outdated。**PM 已鎖 K-017 為 portfolio snapshot 時間點**，Engineer 不需動態計算；未來若要刷新，開新 ticket。

### 7.11 E2E 斷言風險清單（Pass 2 新增，Q10）

本票為 `/about` 全面重寫 + Homepage 插入 banner + 既有 diary 組件大幅替換，E2E 斷言受衝擊面廣。Engineer 實作時按下表逐條 mitigate，不得省略。

| # | 風險 | 影響檔案 | Mitigation |
|---|------|---------|------------|
| R1 | 舊 `/about` 7 section label 斷言失效 — `pages.spec.ts` L32–38 `AC-ABOUT-1` 斷言 "PROJECT OVERVIEW" / "AI COLLABORATION" / "CONTRIBUTIONS" / "TECH DECISIONS" / "SCREENSHOTS" / "TECH STACK" / "FEATURES"。本票刪除舊 section 後，這 7 條 `getByText(...{ exact: true })` 全必紅 | `frontend/e2e/pages.spec.ts` (existing)；將新增 `about.spec.ts` (new) | Engineer 同步改寫 `pages.spec.ts` 的 `AC-ABOUT-1` 區塊，新斷言對齊 PRD K-017 AC-017-HEADER / METRICS / ROLES / PILLARS / TICKETS / ARCH / FOOTER。舊 section label 斷言全刪，新 label 按 PRD S1–S8 section 命名 |
| R2 | `getByText` 預設 case-insensitive 陷阱（memory `feedback_playwright_getbytext_case`）— section label 為短字串（e.g. "ROLE CARDS"），若不加 `{ exact: true }` 容易與 description 中較長文字誤命中 | 所有新建 `.spec.ts` 檔（`about.spec.ts` / `homepage-banner.spec.ts`） | 所有 section label 斷言統一加 `{ exact: true }`。AC-017-HEADER / AC-017-BANNER 已在 PRD AC 中明文要求 `{ exact: true }`；其他 section 斷言 Engineer 主動套用 |
| R3 | Homepage DOM order 位移 — 本票在 `HomePage.tsx` `<UnifiedNavBar />` 與 `<HeroSection />` 之間插入 `<BuiltByAIBanner />`，使 Hero 變成第 2 個主 section 而非第 1 個。既有 homepage spec 若用 index-based selector（e.g. `.locator('section').nth(0)` / `page.getByRole('button').first()`）可能被 banner 佔位吃掉 | `frontend/e2e/pages.spec.ts`（AC-HOME-1）+ 其他 homepage 相關 spec | Engineer 實作前執行：`grep -rnE "\.nth\(|\.first\(\)|\.last\(\)" frontend/e2e/` — 任何 homepage context 下的 index-based selector 都要評估 banner 插入後是否還正確。推薦改用 `getByRole('heading', { name })` 或 `getByText`（semantic selector）。**當前 diary 測試用 `.nth(1)` 為 DiaryPage 內部按鈕索引，不受 Homepage banner 影響，無須改動** |
| R4 | Footer 3 個 external link 的 `rel` / `target` 斷言 — AC-017-FOOTER 明定 "三個連結在新分頁開啟（`target="_blank"` + `rel="noopener noreferrer"`）"，需斷言驗證 | `frontend/e2e/about.spec.ts`（新增） | Engineer 新增斷言：`await expect(link).toHaveAttribute('target', '_blank')` + `await expect(link).toHaveAttribute('rel', 'noopener noreferrer')`。Mailto link 另行處理：`await expect(mailtoLink).toHaveAttribute('href', 'mailto:yichen.lee.20@gmail.com')`。由於 P3 `<ExternalLink>` 寫死 `target=_blank + rel=noopener noreferrer`，只要用 P3 就自動過 — 斷言仍需寫，防迴歸 |
| R5（延伸）| 新 7 組件的 label / anchor id 對齊 PRD 原文 — AC-017-ROLES 要求 6 card role 名稱為 "PM / Architect / Engineer / Reviewer / QA / Designer"，但 AC-017-HEADER 要求全小寫逗號分隔 "PM, architect, engineer, reviewer, QA, designer"。Engineer 若 refactor 時統一大小寫，會破壞 AC | 所有 /about 新組件 + `about.spec.ts` | Engineer 實作時嚴格區分 S1 文案（全小寫）vs S3 card title（Title Case）；斷言逐條引用 PRD 原文（不透過變數插值，寫死字串），避免 refactor 時誤統一 |
| R6（延伸）| ~~P4 `<MilestoneAccordion>` 取代舊 `MilestoneSection` / `DiaryPreviewEntry`~~ **— CLOSED（Pass 3）**：P4 已廢棄，`MilestoneSection.tsx` / `DiaryEntry.tsx` 保留不動，Diary 頁 DOM 結構無異動，`AC-DIARY-1` 斷言（`aria-expanded` / `.px-4.pb-4 p` selector）不受影響。`DiaryPreviewEntry.tsx`（Home 頁）改為 `DiaryTimelineEntry.tsx`（layout:none 絕對定位），影響的是 AC-HOME-1 的 DevDiarySection，不是 AC-DIARY-1。 | `frontend/e2e/pages.spec.ts`（AC-DIARY-1）| **無需 mitigation**：Diary 頁組件保留原樣，`AC-DIARY-1` 不需改動 |
| R7（Pass 4 新增；**updated K-057 2026-04-28**）| **hpHero v2 heading 文案斷言** — 文案已由 K-057 更新。當前 live 文案：heading 1 `"K-line similarity"`，heading 2 `"lookup engine."`，CTA `"Run the ETH/USDT Demo →"`；對應斷言已在 K-057 同步更新至 `pages.spec.ts` | `frontend/e2e/pages.spec.ts`（AC-HOME-1 Hero 段）| 斷言已 live：`await expect(page.getByText('K-line similarity', { exact: true })).toBeVisible()` + `await expect(page.getByText('lookup engine.', { exact: true })).toBeVisible()`；CTA：`await expect(page.getByRole('link', { name: /Run the ETH\/USDT Demo/i })).toBeVisible()` |
| R8（Pass 4 新增）| **hpLogic v2 文案斷言** — step 卡標題（STEP 01/02/03）、body 標題（Upload/Scan/Project）、techRow 文案均為新增或改寫，若舊斷言存在會紅 | `frontend/e2e/pages.spec.ts`（AC-HOME-1 Logic 段）| `grep -rn "HOW IT WORKS\|STEP 0\|logic\|Logic\|stack\|Stack" frontend/e2e/` 確認現有斷言範圍。新增斷言：`await expect(page.getByText('HOW IT WORKS', { exact: true })).toBeVisible()`；三步驟卡 header `getByText('STEP 01 · INGEST', { exact: true })`；body title `getByText('Upload', { exact: true })`（注意 exact:true 防止 body description 誤命中）；techRow `getByText('React · TypeScript · Vite · FastAPI · Python · Playwright', { exact: true })` |

**Engineer Phase A 首要步驟（加在 §6 Phase A 之前）：**

```
A0 — Pre-implementation grep scan（本段強制）：
  (1) grep -rnE "\.nth\(|\.first\(\)|\.last\(\)" frontend/e2e/ → 評估 R3 影響面
  (2) grep -rn "What Is This Project\|AI COLLABORATION\|CONTRIBUTIONS\|TECH DECISIONS\|SCREENSHOTS\|TECH STACK\|FEATURES" frontend/e2e/ → 列出 R1 要改寫的舊斷言
  (3) grep -rn "MilestoneSection\|DiaryPreviewEntry\|DiaryEntry" frontend/src/ → 確認 Q1-A 遷移無遺漏 caller
  (4) grep -rn "aria-expanded\|px-4.pb-4" frontend/e2e/ → 評估 R6 影響面
  輸出：一份 diff-level E2E 修改清單給 PM 驗收前 review
```

---

## 8. 放行建議

本文件（Pass 3）Architect 層面需求全部覆蓋，**無 blocking question**。建議 PM 放行 Engineer 執行 Phase A（A0 → A1 / A2 / A3 / A3b / A4 / A5 平行）。

**Pass 2 補充確認（非 blocking）：**
1. §4.4 curated retrospective 候選清單需使用者最終挑選（Engineer 實作到 Phase C 時會再列候選）— **已於 ticket 設計決策紀錄 2026-04-19 PM 裁決鎖定 3 條**（Engineer K-008 W4 / Engineer K-002 / Architect K-008 W2/S3），本點已關閉
2. §7.8 Firebase Hosting `.md` 訪問方案（prebuild hook copy，AC-017-BUILD）已於 ticket 設計決策紀錄鎖定 Option 1

**Pass 3 確認（已解決）：**
3. §2.0.1 P5 / P6（VerticalRail / TimelineMarker）Pencil 核對結果：**兩頁 pattern 不共用，P5/P6/P4/P7 全部刪除**。A0.1 核對步驟已由 Architect 完成，Engineer 無需再核對。此風險點已關閉

**Pass 4（2026-04-19，Homepage v2 Dossier hpHero / hpLogic 設計規格補充）：**
4. §2.3 已從「hpHero / hpLogic 既有，不動」改為完整 v2 設計規格（§2.3.1 + §2.3.2），包含文案、視覺結構、组件邊界、React 實作要點
5. §6 Phase C 新增 C5 / C6 步驟，Engineer 須同步改寫 `HeroSection.tsx` 與 `ProjectLogicSection.tsx` 對齊 v2
6. §7.11 新增 R7 / R8，hpHero / hpLogic 的 E2E 斷言策略已定義，Engineer 需 grep 舊斷言後改寫
7. **Engineer 注意：** `HeroSection.tsx` 與 `ProjectLogicSection.tsx` 是 K-017 scope 內的 v2 改寫，需在 Phase C（依賴 Phase B 完成後）執行，不可略過

---

## Retrospective

### 2026-04-19 — K-017 /about portfolio enhancement 設計

**做得好：**
- 設計前完整讀了 PRD 全部 10 條 AC + 現有 14 個 about/ 組件 + 既有 AboutPage / HomePage / main.tsx 路由、architecture.md Directory Structure 子樹，確認本次 drift 狀況（about/ 舊組件 13 檔需刪、RoleCard interface 需改、SPA fallback 對 `.md` 訪問是陷阱）
- 把「挑 2–3 條 retrospective 節選」的決策明確 defer 給 PM / 使用者，不越權替 portfolio 對外呈現做內容選擇（符合 senior-architect.md「不做需求決策」原則）
- Section 粒度對齊既有 about/ 子目錄慣例，刪除舊 12 個組件時同時列出對應的 PRD AC section 取代，避免 Engineer 誤刪仍有參考價值的檔

**沒做好：**
- Firebase Hosting 對 `.md` 訪問的陷阱（§7.8）在第一輪設計時差點漏——直到寫完 §4 anchor 規劃要驗證 inline link target 時才回想 SPA fallback 會吞 `.md`，補進 §7 風險。根因：AC-017-PROTOCOLS 只說「文件存在」，沒說「recruiter 點 pillar link 打得開」，設計時習慣只 cover AC 字面條件，對「recruiter 實際使用路徑」的 mental simulation 不夠早介入
- 未先檢查 `frontend/e2e/pages.spec.ts` 是否已對舊 AboutPage 文字（"What Is This Project?" / "AI COLLABORATION"）做斷言——若有，B3 刪除舊組件會直接破 E2E。本文件 §5 已列「Engineer 需 grep 掃」，但若我自己先掃一次給出清單會更具體。

**下次改善：**
- 設計階段在 §7 之前先做一輪「end-to-end recruiter mental walkthrough」——從 homepage 點 banner → /about → 點 pillar link → 點 GitHub link → email — 每一跳都 check 是否 production 可達（SPA、CORS、external link、Firebase rewrite）。此 walkthrough 寫進本 log 作為下次自檢 checklist
- 處理大幅重組既有頁面的 ticket（本票刪 12 改 4 新增 19）時，在 §5 檔案異動清單之前先主動 grep 既有 E2E spec 對舊文案的依賴，把這部分列為 Engineer 必備前置動作，不是單純「註記風險」

### 2026-04-19 — K-017 Pass 3：Pencil 核對後設計更新

**做得好：**（無具體事件可聲稱——Pass 3 是修正 Pass 2 盲抽錯誤，不是主動設計亮點）

**沒做好：** Pass 2 盲抽 P5/P6 時應更謹慎估計 Diary page 的實際 DOM pattern，設計師兩頁用的 pattern 不同這點本可提前問清楚；盲抽理由「commit message 強暗示三處共用」過於薄弱，實際兩頁連 rail 的實作方式都截然不同（rectangle vs stroke），不是「共用 primitive 但樣式不同」而是「根本設計思路不同」

**下次改善：** 「條件性 primitive」決策前先要求 Designer 提供所有相關頁面的 DOM 草圖，不等 Pencil MCP 連線好才確認；「commit message 暗示共用」不能作為抽 primitive 的唯一依據，必須至少有 structural similarity（相同 layout 模式）才考慮抽
