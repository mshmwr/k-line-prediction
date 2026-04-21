---
title: K-022 /about 頁面結構細節對齊設計稿 v2
type: design
ticket: K-022
owner: senior-architect
created: 2026-04-21
pencil-frame: 35VCj (About /about K-017 v2)
depends-on: K-021
---

## 0. 設計前提

- K-021 已交付：`bg-paper` / `text-ink` / `text-muted` / `font-display` / `font-italic` / `font-mono` 等 Tailwind token 可用
- `AboutPage.tsx` 外層 `<div>` 已移除 dark wrapper（K-021 Stage 2）
- 本文件以 **Pencil frame `35VCj`**（`homepage-v2.pen`）為視覺 source of truth
- 今日日期：2026-04-21

---

## 1. Component Tree Diff（A-1 ~ A-12、C-4）

下表列出 12 項結構對齊各自的異動類型、受影響組件、建議路徑。

| # | 項目 | 異動類型 | 受影響既有組件（檔案路徑） | 新組件名稱（建議路徑） |
|---|------|----------|--------------------------|----------------------|
| A-1 | Section label + hairline | **修改既有** | `SectionContainer.tsx`（`primitives/`），每個 section 上方插入 label row | — |
| A-2 | Dossier header bar + FILE Nº | **新增組件** | `AboutPage.tsx`（在 `<UnifiedNavBar />` 下方插入） | `DossierHeader.tsx`（`components/about/`） |
| A-3 | Hero 分兩行 | **修改既有** | `PageHeaderSection.tsx`（`components/about/`） | — |
| A-4 | 副標結構（italic subtitle） | **修改既有** | `MetricsStripSection.tsx` / `RoleCardsSection.tsx` / `ReliabilityPillarsSection.tsx` / `TicketAnatomySection.tsx` / `ProjectArchitectureSection.tsx` 各加一行 subtitle | — |
| A-5 | Redaction bar | **新增組件** | `MetricCard.tsx`（`components/about/`）+ `RoleCard.tsx`（`components/about/`） | `RedactionBar.tsx`（`components/about/`） |
| A-6 | OWNS / ARTEFACT label 字型 | **修改既有** | `RoleCard.tsx`（`components/about/`） | — |
| A-7 | Link 樣式（Newsreader italic + underline） | **修改既有** | `PillarCard.tsx`（`components/about/`）/ `TicketAnatomyCard.tsx`（`components/about/`）/ `FooterCtaSection.tsx`（`components/about/`）— 各自 `<a>` class 遷移 | — |
| A-8 | CASE FILE header（TicketAnatomy） | **修改既有** | `TicketAnatomySection.tsx`（`components/about/`）— section label 文字改為 `CASE FILE` | — |
| A-9 | LAYER 1/2/3 前綴 label | **修改既有** | `ReliabilityPillarsSection.tsx`（`components/about/`）+ `PillarCard.tsx`（`components/about/`）— 每個 pillar Top bar label 改為 `LAYER 1/2/3` | — |
| A-10 | Footer regression | **純回歸斷言**（不改組件） | `FooterCtaSection.tsx`（`components/about/`）— K-017 AC-017-FOOTER 回歸驗證 | — |
| A-11 | BEHAVIOUR / POSITION annotation | **修改既有** | `RoleCard.tsx`（`components/about/`）— 新增 marginalia `<span>` | — |
| C-4 | Role Card grid 高度 | **修改既有** | `RoleCardsSection.tsx`（`components/about/`）+ `RoleCard.tsx`（`components/about/`）— grid gap + card `min-h` 設定 | — |
| A-12 | Shared primitives paper palette 遷移 | **修改既有** | `CardShell.tsx`（`primitives/`）/ `SectionContainer.tsx`（`primitives/`）/ `SectionHeader.tsx`（`common/`）/ `SectionLabel.tsx`（`common/`）/ `CtaButton.tsx`（`common/`）| — |

**說明：**
- A-1 的 section label 在設計稿中以獨立 `s_N_Head` frame 存在，包含 `Geist Mono 13px 700` 的 label 文字 + 1px hairline（`fill: #8B7A6B`）。建議做法：在每個 `SectionContainer` 包層外、或在各 SectionN component 頂部新增 `SectionLabel` row，而非改 `SectionContainer` primitive（避免影響其他 consumer）。
- A-2 `DossierHeader` 是本票唯一純新增的獨立組件（見 §1.1）。
- A-12 修改 5 個 shared primitives，對應 §4 的完整 dark pattern 對照表。

### 1.1 新增組件規格：DossierHeader.tsx

```tsx
// components/about/DossierHeader.tsx
interface DossierHeaderProps {
  fileNo?: string  // default: "K-017 / ABOUT"
}

export default function DossierHeader({ fileNo = 'K-017 / ABOUT' }: DossierHeaderProps) {
  return (
    <div
      data-testid="dossier-header"
      className="bg-charcoal text-paper font-mono text-xs tracking-[2px] px-[72px] py-[6px] flex items-center gap-2"
    >
      <span>FILE Nº</span>
      <span className="opacity-50 mx-1">·</span>
      <span>{fileNo}</span>
    </div>
  )
}
```

**Pencil 來源：** frame `35VCj` 子節點無獨立 Dossier Header Bar（設計稿中 `/about` page 頂部為 `abNav`）；但每個 Card 的 `xTop` frame（如 `r1Top`、`m1Top`、`p1Top`）均採 `fill: #2A2520`（`bg-charcoal`）+ 白色文字 label（如 `FILE Nº 01 · PERSONNEL`），高度 padding `[6, 10]`。AC-022-DOSSIER-HEADER 描述「頁面最上方（NavBar 下方）顯示深色橫條」，Architect 判斷此對應設計稿中**每張 Card 頂部 header bar 語言**被提拔為頁面級 header，而非 frame `35VCj` 有一個獨立的 page-level header bar。Engineer 實作時如有疑義，回報 PM。

### 1.2 Shared Component 邊界（本票）

| 組件 | 路徑 | Consumer（/about） | 本票改動 | K-026 AppPage 影響 |
|------|------|-------------------|----------|-------------------|
| `CardShell` | `primitives/CardShell.tsx` | `MetricCard` / `RoleCard` / `PillarCard` / `TicketAnatomyCard` | dark class 移除（A-12） | **影響 AppPage**（見 §4 備注） |
| `SectionContainer` | `primitives/SectionContainer.tsx` | `AboutPage`（8 × SectionContainer） | `border-white/10` → `border-ink/20`（A-12） | **影響其他頁面**（K-026 回歸） |
| `SectionHeader` | `common/SectionHeader.tsx` | /about 目前**未使用**（sections 自帶 h2） | `text-white` + `text-gray-400` 遷移（A-12） | **未直接用於 /about，改動為預防性** |
| `SectionLabel` | `common/SectionLabel.tsx` | /about 目前**未使用**（A-1 新建 label row） | color token 遷移（A-12） | 影響使用 SectionLabel 的其他頁面 |
| `CtaButton` | `common/CtaButton.tsx` | /about 目前**未使用** | 全色系遷移（A-12） | 影響使用 CtaButton 的其他頁面 |

---

## 2. Pencil v2 精確規格

以下數值直接取自 frame `35VCj` batch_get 結果，標明來源節點 ID。

### 2.1 A-2 Dossier header bar（每張 Card 頂部 header bar 語言）

- **高度（padding）：** padding `[6, 10]`（6px 上下，10px 左右）
- **背景色：** `#2A2520`（`bg-charcoal`）
- **文字色：** `#F4EFE5`（`text-paper` = 白色系）
- **字型：** Geist Mono 10px，letterSpacing 2，fontWeight normal
- **格式：** `FILE Nº 01 · PERSONNEL`（Pencil 節點 `w6UOK`）
- **頁面級 Header（AC-022-DOSSIER-HEADER）** 建議 `FILE Nº · K-017 / ABOUT`，`bg-charcoal` 橫跨全寬

### 2.2 A-5 Redaction bar 高度

- **Pencil 節點：** `m1Redact`（`AxyBl`）：`height: 10, width: 100`
- **規格：** `height: 10px`，`width` 可變（100px 為設計稿 m1 的數值，m2 為 140px）
- **顏色：** `fill: #2A2520`（`bg-charcoal`）— 設計稿同 card header，非純黑 `#000000`
- **DOM 含義：** 文字仍存在 DOM，視覺覆蓋（`aria-hidden` 或 `data-redaction` 屬性）

### 2.3 A-6 OWNS / ARTEFACT label 字級

- **Pencil 節點：** `r1OwnsL`（`SdhGZ`）：`fontSize: 10, letterSpacing: 2, fill: #6B5F4E, fontFamily: Geist Mono`
- **規格：** **10px**，Geist Mono，letterSpacing 2，`text-muted`（`#6B5F4E`）
- **結論：** AC 問「10px 或 11px」，Pencil 實測為 **10px**

### 2.4 C-4 Role Card grid gap 與 min-height

- **Pencil 節點：** `s3Row1` / `s3Row2`：`gap: 14`（即 `gap-[14px]` 或 `gap-3.5`）
- **Card height：** `height: 320`（Pencil 節點 `szZ7h` / `p3NWv` / `HGPky` / `3O32j` / `msFox` / `vtpKx` 全部 `height: 320`）
- **Grid 排列：** 設計稿分兩行（`s3Row1` 含 PM/Architect/Engineer，`s3Row2` 含 Reviewer/QA/Designer），各行 3 欄
- **規格：** `min-h-[320px]`（或 `h-[320px]`），grid gap `gap-[14px]`（`gap-3.5`）

### 2.5 A-9 LAYER label 字級

- **Pencil 節點：** `p1Lbl`（`Y3VDv`）：`content: "FILE Nº 01 · PROTOCOL", fontSize: 10, letterSpacing: 2, fill: #F4EFE5, fontFamily: Geist Mono`
- **規格：** **10px**，Geist Mono，`text-paper`（card header 白字）

### 2.6 Section Label 通用規格（A-1）

- **Pencil 節點：** `s2label`（`kvHMP`）：`content: "Nº 01 — DELIVERY METRICS", fontSize: 13, fontWeight: 700, letterSpacing: 2, fill: #1A1814, fontFamily: Geist Mono`
- **Hairline：** `height: 1, fill: #8B7A6B`（`text-muted`，比 `text-ink` 淺）
- **規格：** Geist Mono 13px bold，`text-ink`，letterSpacing 2；hairline `h-px bg-[#8B7A6B]`

### 2.7 Hero 字型規格（A-3）

從 Pencil 節點 `wwa0m` 子節點直接取值：

| 節點 | 文字 | fontFamily | fontSize | fontStyle | fontWeight | fill |
|------|------|-----------|---------|-----------|-----------|------|
| `nolk3` | "One operator, orchestrating AI" | Bodoni Moda | 64 | italic | 700 | `#1A1814` |
| `02p72` | "agents end-to-end —" | Bodoni Moda | 64 | italic | 700 | `#B43A2C`（brick accent） |
| `gNx84` | "PM, architect... designer." | Newsreader | 18 | italic | normal | `#1A1814` |
| `TQmUG` | "Every feature ships with a doc trail." | Bodoni Moda | 22 | italic | 700 | `#1A1814` |
| `qFnDN` | （分隔線） | — | — | — | — | `#2A2520`，height 1 |

**實作備注：** 主句第二行「agents end-to-end —」採 `text-brick`（`#B43A2C`）**已確認**（BQ-022-03 PM 2026-04-21 裁決）。理由：Pencil 節點 `02p72` 為明確設定值，accent 色強調「orchestrating AI agents」是整頁核心主張，呼應 Role card role name 的 `text-brick` 配色，整頁語言一致；對 recruiter 掃瞄頁面時立即抓到重點有實質幫助。Engineer 直接依設計稿實作，無需另行確認。

### 2.8 Role Card 主標字型（A-3 延伸）

- **Pencil 節點：** `r1Role`（`yHMgd`）：`content: "PM", fontFamily: Bodoni Moda, fontSize: 36, fontStyle: italic, fontWeight: 700, fill: #B43A2C`
- **規格：** Role 名稱以 Bodoni Moda 36px italic 700 `text-brick` 呈現（現況 `font-mono font-bold text-ink text-base` 需全量替換）

### 2.9 Subtitle（italic）規格（A-4）

- **Pencil 節點：** `s3Intro`（`JcFQi`）：Newsreader 15px italic normal，`fill: #1A1814`
- **規格：** `font-italic text-[15px] italic text-ink leading-relaxed`
- **5 個 section 各一句副標**（文案由 Engineer 依 K-017 精神自訂，Architect 不定稿文字）

---

## 3. Playwright 斷言策略

### 3.1 AC-022-SECTION-LABEL

```ts
// 6 sections 的 label 文字（依設計稿 Nº 00 — XXX 格式）
const sectionLabels = [
  'Nº 01 — DELIVERY METRICS',
  'Nº 02 — THE ROLES',
  'Nº 03 — RELIABILITY',
  'Nº 04 — ANATOMY OF A TICKET',  // 或 CASE FILE（見 A-8）
  'Nº 05 — PROJECT ARCHITECTURE',
]

for (const label of sectionLabels) {
  await expect(page.getByText(label, { exact: true })).toBeVisible()
}

// fontFamily 驗證（任一 label）
const labelEl = page.getByText('Nº 01 — DELIVERY METRICS', { exact: true })
const ff = await labelEl.evaluate(el => getComputedStyle(el).fontFamily)
expect(ff).toContain('Geist Mono')

// hairline 存在（section label 下方 hr 或 div h-px）
const hairline = page.locator('[data-section-hairline]').first()
await expect(hairline).toBeVisible()
```

**注意：**
- `{ exact: true }` 強制（memory `feedback_playwright_getbytext_case.md`）
- Hairline 建議在 Engineer 實作時加 `data-section-hairline` attribute 方便測試

#### Mobile viewport 補充（375px / 390px / 414px）

```ts
for (const width of [375, 390, 414]) {
  test(`AC-022-SECTION-LABEL — ${width}px — label 不截斷`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 812 } })
    const page = await ctx.newPage()
    await page.goto('/about')
    const label = page.getByText('Nº 01 — DELIVERY METRICS', { exact: true })
    await expect(label).toBeVisible()
    // 確認文字未截斷（overflow）
    const overflow = await label.evaluate(el => getComputedStyle(el).overflow)
    expect(overflow).not.toBe('hidden')
    await ctx.close()
  })
}
```

---

### 3.2 AC-022-DOSSIER-HEADER

```ts
const header = page.locator('[data-testid="dossier-header"]')
await expect(header).toBeVisible()
await expect(header).toContainText('FILE Nº')
// 背景色 bg-charcoal
const bg = await header.evaluate(el => getComputedStyle(el).backgroundColor)
expect(bg).toBe('rgb(42, 37, 32)')  // #2A2520
```

---

### 3.3 AC-022-HERO-TWO-LINE

```ts
// 主句字型（Bodoni Moda）
const h1 = page.getByRole('heading', { level: 1 })
const mainFF = await h1.evaluate(el => getComputedStyle(el).fontFamily)
expect(mainFF).toContain('Bodoni Moda')

// 結尾句字型（Newsreader italic）
const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
const tagFF = await tagline.evaluate(el => getComputedStyle(el).fontFamily)
expect(tagFF).toContain('Bodoni Moda')  // 依 Pencil 規格 TQmUG：Bodoni Moda 22px italic
const tagStyle = await tagline.evaluate(el => getComputedStyle(el).fontStyle)
expect(tagStyle).toBe('italic')
```

#### Mobile viewport 補充

```ts
// 在 375px 下主句與結尾句不重疊、不截斷
// 斷言：getBoundingClientRect() 兩元素不重疊
const h1Rect = await h1.evaluate(el => el.getBoundingClientRect())
const tagRect = await tagline.evaluate(el => el.getBoundingClientRect())
expect(tagRect.top).toBeGreaterThanOrEqual(h1Rect.bottom)
```

---

### 3.4 AC-022-SUBTITLE

```ts
// 5 個 section subtitle（Newsreader italic）
const subtitles = page.locator('[data-section-subtitle]')
await expect(subtitles).toHaveCount(5)
const firstSubtitle = subtitles.first()
const ff = await firstSubtitle.evaluate(el => getComputedStyle(el).fontFamily)
expect(ff).toContain('Newsreader')
const style = await firstSubtitle.evaluate(el => getComputedStyle(el).fontStyle)
expect(style).toBe('italic')
```

**建議 Engineer 在每個 subtitle `<p>` 上加 `data-section-subtitle`。**

---

### 3.5 AC-022-REDACTION-BAR

```ts
// 至少一個 redaction bar 存在
const bars = page.locator('[data-redaction]')
await expect(bars).toHaveCount({ min: 1 })

// 背景色為 charcoal
const bg = await bars.first().evaluate(el => getComputedStyle(el).backgroundColor)
expect(bg).toBe('rgb(42, 37, 32)')  // #2A2520

// 高度符合設計稿（10px）
const h = await bars.first().evaluate(el => getComputedStyle(el).height)
expect(h).toBe('10px')
```

---

### 3.6 AC-022-OWNS-ARTEFACT-LABEL

```ts
// 6 張卡片 × 2 label = 12 條斷言
const roles = ['PM', 'Architect', 'Engineer', 'Reviewer', 'QA', 'Designer']
for (const role of roles) {
  const card = page.locator(`[data-role="${role}"]`)
  
  const ownsLabel = card.getByText('OWNS', { exact: true })
  const artLabel = card.getByText('ARTEFACT', { exact: true })
  
  await expect(ownsLabel).toBeVisible()
  await expect(artLabel).toBeVisible()
  
  // 字型 Geist Mono 10px text-muted
  const ff = await ownsLabel.evaluate(el => getComputedStyle(el).fontFamily)
  expect(ff).toContain('Geist Mono')
  const fs = await ownsLabel.evaluate(el => getComputedStyle(el).fontSize)
  expect(fs).toBe('10px')
  const color = await ownsLabel.evaluate(el => getComputedStyle(el).color)
  expect(color).toBe('rgb(107, 95, 78)')  // text-muted #6B5F4E
}
```

---

### 3.7 AC-022-LINK-STYLE

```ts
// 至少一個 link 採 Newsreader italic + underline
const links = page.locator('a')
let found = false
for (const link of await links.all()) {
  const ff = await link.evaluate(el => getComputedStyle(el).fontFamily)
  const style = await link.evaluate(el => getComputedStyle(el).fontStyle)
  const deco = await link.evaluate(el => getComputedStyle(el).textDecoration)
  if (ff.includes('Newsreader') && style === 'italic' && deco.includes('underline')) {
    found = true
    break
  }
}
expect(found).toBe(true)
```

---

### 3.8 AC-022-CASE-FILE-HEADER

```ts
// TicketAnatomySection label：採設計稿格式（BQ-022-01 PM 已裁決）
await expect(page.getByText('Nº 04 — ANATOMY OF A TICKET', { exact: true })).toBeVisible()
```

**BQ-022-01 RESOLVED（PM 2026-04-21）：** 採設計稿格式 `Nº 04 — ANATOMY OF A TICKET`。理由：設計稿為本票視覺 source of truth，Nº XX — 序號體系貫穿全頁 5 個 section label，維持一致結構感優先；「CASE FILE」作為語意描述不取代序號格式。AC-022-CASE-FILE-HEADER 對應斷言改為 `Nº 04 — ANATOMY OF A TICKET`。

---

### 3.9 AC-022-LAYER-LABEL

```ts
// Pillar card 頂部 label：採 AC 格式 LAYER 1/2/3（BQ-022-02 PM 已裁決）
const layerLabels = ['LAYER 1', 'LAYER 2', 'LAYER 3']
for (const label of layerLabels) {
  await expect(page.getByText(label, { exact: true })).toBeVisible()
}
// 字型 10px Geist Mono text-paper（在 charcoal 背景上白字）
const layerEl = page.getByText('LAYER 1', { exact: true })
const ff = await layerEl.evaluate(el => getComputedStyle(el).fontFamily)
expect(ff).toContain('Geist Mono')
const fs = await layerEl.evaluate(el => getComputedStyle(el).fontSize)
expect(fs).toBe('10px')
```

**BQ-022-02 RESOLVED（PM 2026-04-21）：** 採 AC 格式 `LAYER 1` / `LAYER 2` / `LAYER 3`。理由：此區塊語意是「AI 可靠性分層架構」（記憶/反省/角色），LAYER 編號直接對應認知模型，對 recruiter 理解系統設計有實質幫助；`FILE Nº · PROTOCOL` 在 pillar 語境語意模糊（PROTOCOL 指涉不明）。視覺格式（Geist Mono 10px charcoal bar）維持不變，只換文字。

---

### 3.10 AC-022-FOOTER-REGRESSION

```ts
// K-017 AC-017-FOOTER 全部斷言仍 PASS
await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
const emailLink = page.locator('a[href="mailto:yichen.lee.20@gmail.com"]')
await expect(emailLink).toBeVisible()
await expect(page.getByText('Or see the source:', { exact: true })).toBeVisible()
```

---

### 3.11 AC-022-ANNOTATION

```ts
// 至少一個 BEHAVIOUR 或 POSITION annotation 存在
const annotations = page.locator('[data-annotation]')
await expect(annotations).toHaveCount({ min: 1 })

// 或依文字字串（{ exact: true }）
const behav = page.getByText('BEHAVIOUR', { exact: true })
const pos = page.getByText('POSITION', { exact: true })
const found = (await behav.count()) + (await pos.count())
expect(found).toBeGreaterThanOrEqual(1)

// 字級 9-10px Geist Mono text-muted
const el = annotations.first()
const fs = await el.evaluate(e => getComputedStyle(e).fontSize)
expect(['9px', '10px']).toContain(fs)
```

---

### 3.12 AC-022-ROLE-GRID-HEIGHT

```ts
// 6 張 Role Card height 誤差 ≤ 2px
const cards = page.locator('[data-role]')
await expect(cards).toHaveCount(6)
const heights = await cards.evaluateAll(els =>
  els.map(el => el.getBoundingClientRect().height)
)
const maxH = Math.max(...heights)
const minH = Math.min(...heights)
expect(maxH - minH).toBeLessThanOrEqual(2)
```

#### Mobile viewport 補充

```ts
// 375px 下 grid 可能切為單欄，每張 card 仍滿足 min-h 規格
for (const width of [375, 390, 414]) {
  test(`AC-022-ROLE-GRID-HEIGHT — ${width}px — cards visible`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 812 } })
    const page = await ctx.newPage()
    await page.goto('/about')
    const cards = page.locator('[data-role]')
    await expect(cards).toHaveCount(6)
    // 每張 card min-h 不低於 200px（mobile 可允許更短但不截斷）
    const heights = await cards.evaluateAll(els =>
      els.map(el => el.getBoundingClientRect().height)
    )
    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual(200)
    }
    await ctx.close()
  })
}
```

---

## 4. A-12 Shared Primitives Paper Palette 遷移規格

### 4.1 Dark Pattern Grep 執行結果（硬步驟 1 已執行）

```
grep 指令：text-white / bg-gray- / border-white / bg-slate / bg-purple / text-cyan / text-gray-
執行時間：2026-04-21
```

| 組件 | 路徑 | 發現的 dark pattern | 行號 |
|------|------|-------------------|------|
| `CardShell` | `primitives/CardShell.tsx` | `border-white/10`（default prop）, `bg-slate-800/60` | L13, L21 |
| `SectionContainer` | `primitives/SectionContainer.tsx` | `border-white/10`（divider） | L23 |
| `SectionHeader` | `common/SectionHeader.tsx` | `text-white`（h2）, `text-gray-400`（description） | L16, L20 |
| `SectionLabel` | `common/SectionLabel.tsx` | `text-purple-400 border-purple-400`, `text-cyan-400 border-cyan-400`, `text-pink-400 border-pink-400`, `text-white border-white` | L7-10 |
| `CtaButton` | `common/CtaButton.tsx` | `bg-purple-600 text-white border-purple-600`（primary）, `text-cyan-400 border-cyan-400`（secondary） | L11-12 |

### 4.2 Dark Pattern → Paper Palette Token 對照表

| 組件 | 舊 class | 新 class（K-021 token） | 備注 |
|------|----------|------------------------|------|
| **CardShell** | `bg-slate-800/60` | `bg-paper` | /about card bg 對應設計稿 `fill: #F4EFE5` |
| **CardShell** | `border-white/10`（default borderColorClass） | `border-ink/20`（建議新 default） | /about 設計稿卡片邊框為 `stroke: #1A1814 thickness:1` |
| **SectionContainer** | `border-white/10`（divider） | `border-ink/20` | 設計稿 section 間分隔用 `#8B7A6B`（muted），可改 `border-muted/40` |
| **SectionHeader** | `text-white`（h2） | `text-ink` | paper 底色下深色標題 |
| **SectionHeader** | `text-gray-400`（description） | `text-muted` | `#6B5F4E` |
| **SectionLabel** | `text-purple-400 border-purple-400` | `text-ink border-ink`（或 `text-muted border-muted`） | /about 設計稿 label 採 `text-ink` + 無 border（改為 hairline 分隔） |
| **SectionLabel** | `text-cyan-400 border-cyan-400` | 同上 | 舊 color prop 需新增 `'ink'` 選項 |
| **SectionLabel** | `text-pink-400 border-pink-400` | 同上 | |
| **SectionLabel** | `text-white border-white` | 同上 | |
| **CtaButton** | `bg-purple-600 text-white border-purple-600` | `bg-ink text-paper border-ink` | paper 底色下的 primary CTA |
| **CtaButton** | `text-cyan-400 border-cyan-400` | `text-muted border-muted` | secondary variant |

### 4.3 /about 專屬 vs AppPage 影響分析

| 組件 | /about 使用狀況 | AppPage 使用狀況 | 本票改動後 K-026 影響 |
|------|----------------|-----------------|----------------------|
| `CardShell` | MetricCard / RoleCard / PillarCard / TicketAnatomyCard | K-026 AppPage 可能使用 | **高影響**：改 `bg-paper` 後 AppPage 原 dark panel 視覺會改變，K-026 必須覆蓋回歸 |
| `SectionContainer` | AboutPage 8 × SectionContainer | DiaryPage / 其他頁 | **中影響**：divider 顏色改變，K-026 覆蓋 AppPage 回歸 |
| `SectionHeader` | /about 目前**不使用** | 可能被其他頁面使用 | **中影響**：改動屬預防性；Engineer 須 grep consumer 確認 |
| `SectionLabel` | /about 目前**不使用**（A-1 的 section label 是新加的 custom row） | 可能被 HomePage/DiaryPage 使用 | **中影響** |
| `CtaButton` | /about 目前**不使用** | 可能被 AppPage 使用 | **中影響**：K-026 覆蓋 AppPage 回歸 |

**重要提醒：** `CardShell` 的 `borderColorClass` 為 **prop 傳入**，本票建議改 **default 值**（`border-white/10` → `border-ink/20`），不改 prop interface（向後相容）。現有 consumer 若傳入自訂 borderColorClass 不受影響。

---

## 5. 實作順序（Engineer 參考）

建議以下 6 個 stage，每 stage 為一個穩定交付單位：

### Stage 1 — A-12 Shared Primitives 遷移（最先）

**理由：** 其他所有視覺改動都依賴 CardShell / SectionContainer paper bg，先改 primitives 讓後續 stage 的 dev server 目視更直觀。

**交付：**
- `CardShell.tsx`：`bg-slate-800/60` → `bg-paper`，default `borderColorClass` → `'border-ink/20'`
- `SectionContainer.tsx`：divider `border-white/10` → `border-muted/40`
- `SectionHeader.tsx`：`text-white` → `text-ink`，`text-gray-400` → `text-muted`
- `SectionLabel.tsx`：新增 `'ink'` color option，既有 purple/cyan/pink/white 保留（向後相容）
- `CtaButton.tsx`：primary → `bg-ink text-paper`，secondary → `text-muted border-muted`

**驗證：** `npx tsc --noEmit` exit 0 + dev server 目視 /about 各 section 背景為米白

**對應 AC：** AC-022-REGRESSION（primitives 改動不破 K-017 文字斷言）

---

### Stage 2 — A-1 Section label + hairline

**交付：** 在 `AboutPage.tsx` 每個 `<SectionContainer>` 前插入 `SectionLabelRow` 組件（或直接 inline JSX）：

```tsx
// 建議 inline（不值得新開組件，設計稿明確限 /about）
<div className="flex items-center gap-4 mb-4">
  <span
    className="font-mono text-[13px] font-bold tracking-[2px] text-ink"
    data-testid="section-label"
  >
    Nº 01 — DELIVERY METRICS
  </span>
  <div className="flex-1 h-px bg-[#8B7A6B]" data-section-hairline />
</div>
```

**驗證：** Playwright `AC-022-SECTION-LABEL` test group 全 PASS

---

### Stage 3 — A-2 DossierHeader + A-3 Hero 重構

**交付：**
- 新建 `DossierHeader.tsx`，插入 `AboutPage.tsx` `<UnifiedNavBar />` 下方
- 重構 `PageHeaderSection.tsx`：主句 Bodoni Moda 64px italic，角色列 Newsreader 18px italic，tagline Bodoni Moda 22px italic（依 §2.7 規格）

**注意：** A-3 需確認 BQ-022-01「CASE FILE vs Nº 04」後再動 `TicketAnatomySection.tsx`；本 stage 先改 Hero 和 DossierHeader。

**驗證：** AC-022-DOSSIER-HEADER + AC-022-HERO-TWO-LINE 斷言

---

### Stage 4 — A-4 副標 + A-5 Redaction bar + A-6 OWNS/ARTEFACT label

**交付：**
- 5 個 section component 各自新增 `data-section-subtitle` 的副標 `<p>`
- 新建 `RedactionBar.tsx`（`components/about/`），在 `MetricCard.tsx` 和 `RoleCard.tsx` 引入
- `RoleCard.tsx` 更新 OWNS/ARTEFACT label：字型 Geist Mono 10px `text-muted`，格式 uppercase tracking-[2px]（現況 `tracking-wide` 需確認是否等同 letterSpacing 2）

**驗證：** AC-022-SUBTITLE + AC-022-REDACTION-BAR + AC-022-OWNS-ARTEFACT-LABEL

---

### Stage 5 — A-8/A-9 label 格式 + A-11 annotation + A-7 Link 樣式 + C-4 grid

**交付：**
- `TicketAnatomySection.tsx` section label 確認採 BQ-022-01 PM 裁決的格式
- `ReliabilityPillarsSection.tsx`/`PillarCard.tsx` 頂部 label 改為 LAYER 格式（依 BQ-022-02 裁決）
- `RoleCard.tsx` 新增 `data-annotation` 的 BEHAVIOUR/POSITION marginalia
- `PillarCard.tsx` / `TicketAnatomyCard.tsx` / `FooterCtaSection.tsx` link class 改為 Newsreader italic + underline
- `RoleCardsSection.tsx` grid gap → `gap-[14px]`，card `min-h-[320px]`

**驗證：** AC-022-CASE-FILE-HEADER + AC-022-LAYER-LABEL + AC-022-ANNOTATION + AC-022-LINK-STYLE + AC-022-ROLE-GRID-HEIGHT

---

### Stage 6 — Full regression

**交付：** 跑整 Playwright suite + `npx tsc --noEmit` + 目視 /about 5 viewport（desktop 1280 + mobile 375/390/414）

**驗證：** AC-022-REGRESSION + AC-022-FOOTER-REGRESSION（K-017 AC-017-FOOTER 全 PASS）

---

## 6. 排除項目確認

| 排除項 | 原因（ticket 已定） |
|--------|-------------------|
| B-1 Pillar `<code>` 標籤 | 使用者 2026-04-20 決定：設計稿有但 MVP 不做 |
| B-2 Ticket 副說明 | 同上 |
| B-3 Privacy 註腳 | AC-018-PRIVACY-POLICY 合規要求保留 Footer 的 GA4 聲明，不動、不移除 |
| 文案改動 | K-017 文案定稿；本票僅改結構視覺 |
| 新增/刪除 section | scope 僅微調現有結構 |

---

## 7. Blocking Questions ✅ 全部 RESOLVED（PM 2026-04-21）

| # | 問題 | 裁決 | 影響 Stage |
|---|------|------|----------|
| ~~BQ-022-01~~ | ~~TicketAnatomy section label 格式~~ | **RESOLVED：採設計稿格式 `Nº 04 — ANATOMY OF A TICKET`**（維持全頁 Nº XX — 序號一致性） | Stage 5（A-8） |
| ~~BQ-022-02~~ | ~~Pillar card 頂部 label 格式~~ | **RESOLVED：採 AC 格式 `LAYER 1` / `LAYER 2` / `LAYER 3`**（語意直接對應 AI 可靠性分層架構） | Stage 5（A-9） |
| ~~BQ-022-03~~ | ~~Hero 主句第二行 accent 色~~ | **RESOLVED：採 `text-brick`（`#B43A2C`）**（設計稿明確節點值；accent 強調核心主張；與 Role card 配色呼應） | Stage 3（A-3） |

---

## 8. 共用組件邊界確認（本票 vs K-026）

本票僅改 **/about 主 consumer 視覺斷言**，不負責 AppPage consumer 回歸。K-026 票將覆蓋 AppPage 子元件回歸測試。具體邊界：

- **本票負責：** `/about` 所有 section、DossierHeader、MetricCard、RoleCard、PillarCard、TicketAnatomyCard
- **本票不負責：** `/app`（AppPage）下的 CardShell / SectionContainer consumer 視覺正確性（交由 K-026）
- **兩票共享 primitives：** CardShell / SectionContainer 改動後，Engineer 須 dev server 目視 `/app` 確認不 crash（即 K-021 §8.2 目視 checklist 步驟），但不需為 AppPage 加 Playwright 斷言

---

## 9. Self-Diff 結果（硬步驟 2）

對照 §1 Component Tree Diff 表格逐列驗證「異動類型 / 受影響組件 / 新組件名稱」三欄：

| 行 | 項目 | 異動類型 ✓ | 受影響既有組件路徑 ✓ | 新組件/路徑 ✓ |
|----|------|-----------|---------------------|--------------|
| 1 | A-1 Section label | 修改既有 ✓ | SectionContainer.tsx（primitives/）✓ | — ✓ |
| 2 | A-2 Dossier header | 新增組件 ✓ | AboutPage.tsx ✓ | DossierHeader.tsx（components/about/）✓ |
| 3 | A-3 Hero 分兩行 | 修改既有 ✓ | PageHeaderSection.tsx（components/about/）✓ | — ✓ |
| 4 | A-4 副標結構 | 修改既有 ✓ | 5 個 section components ✓ | — ✓ |
| 5 | A-5 Redaction bar | 新增組件 ✓ | MetricCard.tsx + RoleCard.tsx ✓ | RedactionBar.tsx（components/about/）✓ |
| 6 | A-6 OWNS/ARTEFACT label | 修改既有 ✓ | RoleCard.tsx（components/about/）✓ | — ✓ |
| 7 | A-7 Link 樣式 | 修改既有 ✓ | PillarCard / TicketAnatomyCard / FooterCtaSection ✓ | — ✓ |
| 8 | A-8 CASE FILE header | 修改既有 ✓ | TicketAnatomySection.tsx（components/about/）✓ | — ✓ |
| 9 | A-9 LAYER label | 修改既有 ✓ | ReliabilityPillarsSection + PillarCard ✓ | — ✓ |
| 10 | A-10 Footer regression | 純回歸斷言 ✓ | FooterCtaSection.tsx ✓ | — ✓ |
| 11 | A-11 BEHAVIOUR/POSITION | 修改既有 ✓ | RoleCard.tsx（components/about/）✓ | — ✓ |
| 12 | C-4 Role grid 高度 | 修改既有 ✓ | RoleCardsSection + RoleCard ✓ | — ✓ |
| 13 | A-12 Shared primitives | 修改既有 ✓ | CardShell / SectionContainer / SectionHeader / SectionLabel / CtaButton ✓ | — ✓ |

**Self-Diff 結果：13 列 vs 13 列 ✓**（含 A-1~A-12 共 12 項 + C-4 = 13 列）

---

## 10. 檔案異動清單（Engineer 交付）

### 新增

- `frontend/src/components/about/DossierHeader.tsx`（A-2）
- `frontend/src/components/about/RedactionBar.tsx`（A-5）
- `frontend/e2e/about-v2.spec.ts`（K-022 AC-022-* 全部斷言，新檔不覆蓋 about.spec.ts）

### 修改

- `frontend/src/components/primitives/CardShell.tsx`（A-12）
- `frontend/src/components/primitives/SectionContainer.tsx`（A-12）
- `frontend/src/components/common/SectionHeader.tsx`（A-12）
- `frontend/src/components/common/SectionLabel.tsx`（A-12）
- `frontend/src/components/common/CtaButton.tsx`（A-12）
- `frontend/src/pages/AboutPage.tsx`（A-1 section label rows + A-2 DossierHeader 插入）
- `frontend/src/components/about/PageHeaderSection.tsx`（A-3）
- `frontend/src/components/about/MetricsStripSection.tsx`（A-4 subtitle）
- `frontend/src/components/about/RoleCardsSection.tsx`（A-4 subtitle + C-4 grid）
- `frontend/src/components/about/RoleCard.tsx`（A-5 RedactionBar + A-6 label + A-11 annotation）
- `frontend/src/components/about/ReliabilityPillarsSection.tsx`（A-4 subtitle + A-9 LAYER label）
- `frontend/src/components/about/PillarCard.tsx`（A-7 link style + A-9 LAYER label）
- `frontend/src/components/about/TicketAnatomySection.tsx`（A-4 subtitle + A-8 CASE FILE）
- `frontend/src/components/about/TicketAnatomyCard.tsx`（A-7 link style）
- `frontend/src/components/about/FooterCtaSection.tsx`（A-7 link style）
- `frontend/src/components/about/MetricCard.tsx`（A-5 RedactionBar）

### 文件同步

- `agent-context/architecture.md`（Changelog + shared primitives 表更新）
- `docs/retrospectives/architect.md`（本任務反省條目）

---

## Retrospective

### 2026-04-21 — K-022 /about 結構細節設計

**做得好：**
- 硬步驟 1（grep dark pattern）在讀完 5 個 primitive 檔案後立即執行，而非靠記憶估算；grep 結果顯示 SectionHeader `text-white` / SectionLabel `text-purple-400` 等整批 dark patterns，發現 `SectionLabel` 和 `SectionHeader` 目前 /about 根本未直接使用（section label 是各組件自帶 h2 + Geist Mono span），避免 Engineer 無的放矢改一個 /about 不用的組件。
- Pencil frame `35VCj` batch_get 取到精確數值（Redaction bar `height: 10px`，Role Card `height: 320px`，grid `gap: 14px`，OWNS label `fontSize: 10px`），能直接寫進設計文件而非估算範圍。
- 發現兩個 AC vs 設計稿不一致（BQ-022-01 CASE FILE vs Nº 04、BQ-022-02 LAYER vs FILE Nº），在設計文件 §7 明列為 Blocking Questions，而非自行選邊。
- Self-Diff 明確執行：13 列 vs 13 列 ✓，對組件名稱 / 路徑 / 異動類型三欄逐格比對。

**沒做好：**
- K-022 ticket 指定 `components/shared/` 路徑，但實際 codebase 無 `shared/` 目錄（primitives 在 `primitives/`，SectionHeader/SectionLabel 在 `common/`，CtaButton 也在 `common/`）。設計文件若直接沿用 ticket 路徑會給 Engineer 錯誤指引。雖然在設計開始前執行 `ls` 確認了實際路徑，但 ticket 路徑錯誤未在設計文件 §0 明確標注「ticket §A-12 路徑有誤，以下設計以實際路徑為準」，若 Engineer 先看 ticket 後看設計文件可能仍困惑。根因：Architect 遇到 ticket 與 codebase 路徑不符時，只補正了設計文件，未在設計文件顯著位置告警 ticket 筆誤。

**下次改善：**
- 若 ticket 的具體路徑或組件名與 codebase 實際不符，在設計文件 **§0 設計前提** 段明確列一條「Ticket 路徑勘誤」，列出 ticket 寫的路徑 vs 實際路徑，防止 Engineer 混淆。此規則納入 senior-architect.md 硬步驟「Pre-Design Path Audit」。
