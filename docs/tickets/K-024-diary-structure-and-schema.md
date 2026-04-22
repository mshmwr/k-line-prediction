---
id: K-024
title: /diary 結構重做 + diary.json schema 扁平化
status: backlog
type: feat
priority: medium
created: 2026-04-20
visual-spec: docs/designs/K-024-visual-spec.json
---

## 背景

K-017 完成 `/diary` 基本渲染後，PM 於 2026-04-20 逐條比對 Pencil 設計稿 v2（frame `wiDSi`）與 Playwright 視覺報告，發現 `/diary` 頁面存在 **24 項差異**（其中 22 項實質待修），核心衝突包括：
1. **配色系統顛倒**（dark mode vs 米白紙本風）→ 交由 K-021 處理
2. **資訊結構完全不同**：設計稿採「扁平 timeline」（垂直線條 + 矩形 marker + 三層排版）vs 實作採「milestone accordion」（可摺疊區塊）→ 本票處理
3. **diary.json schema 過於複雜**（milestone + items 雙層結構）且含中文內容 → 本票扁平化並統一英文

本票同時定義 **PM 每日 diary.json 維護流程**，上線後由 PM persona（`~/.claude/agents/pm.md`，已於 2026-04-20 寫入）自動執行。

**完整裁決紀錄：** memory `project_k017_design_vs_visual_comparison.md`（2026-04-20）

## 依賴關係

- **依賴 K-021**（全站設計系統基建）：本票所有 UI 斷言引用 K-021 交付的 Tailwind token / 三字型系統 / NavBar / Footer
- 本票不可在 K-021 放行前開始 Engineer 實作

## K-027 設計繼承（2026-04-21 新增）

K-027（手機版 mobile diary hotfix）產出了五項暫行決策，K-024 Architect 設計時**必須逐項評估是否沿用或重新設計**，不得沉默繼承。K-027 設計文件 §6 為正式來源：

| 項目 | K-027 暫行決策 | K-024 需決定 |
|------|-------------|------------|
| Mobile breakpoint | `sm:` = 640px（Tailwind 預設） | 新結構是否沿用 sm: 或改為 480px custom breakpoint |
| DiaryEntry 手機 layout | `flex-col`，date 在上，text 在下 | 扁平 timeline 的 date + title + text 三層排版在手機寬度下的順序與字級 |
| Milestone 間距 | `mb-4 sm:mb-3` | 新 timeline rail + marker 結構的 entry 間距規格 |
| `overflow-hidden` 策略 | 展開區加 `overflow-hidden`（防橫向溢出） | 新結構移除 accordion，overflow 策略從頭設計 |
| `break-words` | `DiaryEntry` text 欄加 `break-words` | 扁平 text element 是否繼承 |

**K-027 設計文件 §2.1 的 Before/After 對照為 K-024 的「Before」基準。**

K-024 Architect 接手前，必須先讀 `docs/designs/K-027-mobile-diary-layout.md §6`，確認繼承決策已明確寫入 K-024 設計文件。

## 範圍

含：

### Phase 1 — diary.json schema 扁平化（資料層）

**新 schema：**
```json
[
  {
    "ticketId": "K-017",
    "title": "/about portfolio-oriented recruiter enhancement",
    "date": "2026-04-19",
    "text": "Completed portfolio-oriented rewrite of /about with 8 sections covering ..."
  },
  {
    "ticketId": "K-008",
    "title": "Automated visual report script",
    "date": "2026-04-18",
    "text": "Built Playwright screenshot pipeline ..."
  }
]
```

- **型別：** `Array<{ ticketId?: string, title: string, date: string (YYYY-MM-DD), text: string }>`
- `ticketId` 可省（對應舊無 K-XXX 條目，如 Phase 1/2/3、Deployment、Codex Review Follow-up）
- 舊無 K-XXX 條目統整為 **一筆**（`ticketId` 空，title 例如 `"Phase 1-3 + Deployment + Early Setup"`，text 為該段時期摘要）
- 舊 schema `{ milestone, items[] }` 全部轉換為 flat array
- **統一英文**（Yahoo US Commerce 等國際求職情境）：既有中文條目逐條英譯

### Phase 2 — Curation 策略（前端渲染）

- **Homepage `<DevDiarySection>`**：顯示最新 **3 條**（by `date` desc）
- **Diary 頁面 `<DiaryPage>`**：
  - 載入全部條目
  - 預設渲染最新 **5 條**
  - 滾動或點擊「Load more」載入更多（每次再載 5 條；由 Architect 決定 infinite scroll 或 button click pattern）

### Phase 3 — Diary 頁面結構重做（13 項）

含：

1. **Dev Diary 大標**：Bodoni italic 64px + 上方分隔線 + italic 副標
2. **左側垂直 rail**：1px 深線（`charcoal` `#2A2520`）貫穿所有 entry
3. **磚紅矩形 marker**：每條 entry 左側與 rail 交接處的 marker，矩形 `#9C4A3B`（`brick-dark`），尺寸對齊設計稿
4. **三層條目排版**：
   - Ticket title：Bodoni Moda italic 18px bold
   - Date：Geist Mono 12px
   - Text：Newsreader italic 18px
5. **Ticket ID 前綴**：每條 entry 的 ticket title 為 `K-XXX — <title>` 格式（em-dash U+2014，兩側各一個半形空格；若 `ticketId` 存在）
6. **移除 milestone accordion**：不再有可摺疊區塊
7. **移除 defaultOpen**：隨 accordion 移除
8. **移除 `divide-y`**：視覺分隔改由 rail + marker 表達
9. **font-mono h1 改 Bodoni**：頁面大標字型從 mono 改為 Bodoni Moda
10. **內容寬 1248px**：content 容器最大寬度
11. **letterSpacing**：大標與副標採設計稿指定 letterSpacing（Architect 補精確數值）
12. **頁面標題與副標文案**：對齊設計稿（Architect 從 frame `wiDSi` 提取）
13. **Hero 區分隔線 + 副標**：頁面頂部 Hero 區下方加分隔線 + italic 副標

**保留（不動）：**
- B2 Loading / Error 狀態顯示機制（保留既有 UX）

### Phase 4 — PM 每日 diary.json 維護流程（persona 層，已寫入）

- 已於 2026-04-20 寫入 `~/.claude/agents/pm.md` 的 `## K-Line diary.json 每日維護（K-023 上線後生效）` 段落
  - 註：persona 文檔中用的是「K-023 上線後生效」文字，實際 ticket 編號為 **K-024**（因 K-020 已佔用為 GA4 SPA Pageview E2E 票），本票關閉時 PM 同步修正 persona 文字為「K-024 上線後生效」
- 每日流程：讀 `~/Diary/daily-diary.md` 前一天 K-Line 段 → 篩 K-Line 相關子項 → append diary.json（扁平 schema）
- **Append-only + 有限例外**：禁 rewrite 既有條目；允許 typo / 事實錯誤（ticket 編號、日期寫錯）修正
- 統一英文

**不含：**
- 新功能邏輯（本票僅 UI 結構 + 資料 schema，不改後端預測邏輯）
- Diary 內容大規模改寫（僅中譯英 + 舊條目統整，不 rewrite 個人陳述）
- 其他頁面改動（Homepage Diary bullet marker 由 K-023 A-2 處理，不在本票）

## 設計決策紀錄

| 決策項目 | 內容 | 來源 |
|----------|------|------|
| Schema 扁平化 | `{ ticketId?, title, date, text }` flat array，非 `{ milestone, items[] }` 雙層 | PM 裁決 2026-04-20 |
| Curation 策略 | 首頁 3 條 / Diary 頁預設 5 條 + 滾動載入更多 | PM 裁決 2026-04-20 |
| 統一英文 | Yahoo US Commerce 等國際求職情境；既有中文條目英譯 | PM 裁決 2026-04-20 |
| Append-only + 有限例外 | 禁 rewrite 陳述；允許 typo / 事實錯誤修正 | PM 裁決 2026-04-20 |
| 舊無 K-XXX 條目統整 | 合併為一筆（Phase 1/2/3 + Deployment + Codex Review Follow-up 等），`ticketId` 空 | PM 裁決 2026-04-20 |
| PM persona 維護流程啟用 | 本票關閉後生效；persona 文字已寫入，ticket 編號待關閉時校正為 K-024 | PM 裁決 2026-04-20 |
| Milestone accordion 移除 | 扁平 timeline 取代；Loading / Error 機制保留 | PM 裁決 2026-04-20 |

## 驗收條件

### AC-024-SCHEMA：diary.json 採扁平 flat array schema `[K-024]`

**Given** 開發者讀取 `frontend/public/diary.json`
**When** 解析內容
**Then** 內容為 JSON array（top-level 非 object）
**And** 每個 element 為 object，schema 為 `{ ticketId?: string, title: string, date: string, text: string }`
**And** `date` 欄位為 `YYYY-MM-DD` 格式（regex `^\d{4}-\d{2}-\d{2}$` 匹配）
**And** `ticketId` 若存在則為 `K-XXX` 格式（regex `^K-\d{3}$`）
**And** 舊 schema（`{ milestone, items[] }`）已全部轉換，檔案中不再含 `milestone` key
**And** Vitest 單元測試：載入 diary.json 後驗證 schema（用 zod 或手寫 type guard），全部 entry pass

---

### AC-024-ENGLISH：diary.json 所有條目統一英文 `[K-024]`

**Given** 開發者讀取 `frontend/public/diary.json`
**When** 掃描所有 entry 的 `title` + `text` 欄位
**Then** 所有欄位內容為英文（不含 CJK 字元：`[\u4e00-\u9fff]` 零匹配）
**And** 既有中文條目已逐條英譯，保留原意
**And** Vitest 單元測試：載入 diary.json 後 regex 掃描 title + text，無任何 CJK 字元

---

### AC-024-LEGACY-MERGE：舊無 K-XXX 條目統整為一筆 `[K-024]`

**Given** 開發者讀取 `frontend/public/diary.json`
**When** 掃描所有 entry
**Then** `ticketId` 為 undefined / 空字串 的 entry **最多一筆**
**And** 該筆的 `title` 涵蓋原本的 Phase 1/2/3 + Deployment + Codex Review Follow-up 等主題（例 `"Early project phases and deployment setup"`）
**And** 該筆的 `text` 為該段時期的摘要（英文，約 50-100 字）
**And** 該筆的 `date` 為該段時期的代表日期（由 PM / Architect 決定，例 `2026-04-16`）
**And** Vitest 斷言：entries.filter(e => !e.ticketId).length ≤ 1

---

### AC-024-HOMEPAGE-CURATION：Homepage 顯示最新 3 條 `[K-024]`

**Given** 使用者訪問 `/`
**When** 頁面滾動至 Diary section（`hpDiary`）
**Then** 顯示 **3 條** diary entry（非更多、非更少），對應 visual-spec `N0WWY` 的 `entryCount=3`
**And** 3 條按 `date` 降序排列（最新在最上方）
**And** 3 條均為 diary.json 中 `date` 最新的 3 筆
**And** Homepage diary section 含 3 個 marker 元素（一一對應 3 條 entry），依 visual-spec `N0WWY` 的 marker role
**And** Playwright 斷言：Homepage diary section 含 3 個 `<DiaryTimelineEntry>` 元素；且 `expect(homepageMarkers).toHaveCount(3)`

---

### AC-024-DIARY-PAGE-CURATION：Diary 頁預設渲染 5 條 + 滾動載入更多 `[K-024]`

**Given** 使用者訪問 `/diary`
**When** 頁面載入完成（尚未滾動）
**Then** 顯示 **5 條** diary entry（假設 diary.json ≥ 5 筆）
**And** 5 條按 `date` 降序排列
**And** 5 條為 diary.json 中 `date` 最新的 5 筆

**Given** 使用者在 `/diary`
**When** 滾動至頁面底部（或點擊「Load more」按鈕，由 Architect 決定 pattern）
**Then** 再渲染 5 條（總共 10 條顯示）
**And** 若 diary.json 總數 ≤ 10，則停止載入並不再觸發；若 > 10，持續可載入直到全部顯示
**And** Playwright 斷言：初始載入顯示 5 條；滾動或點擊後顯示 10 條（假設 diary.json ≥ 10 筆）

**Given** diary.json 只有 3 筆
**When** 使用者訪問 `/diary`
**Then** 顯示 3 條（全部），無 Load more 觸發
**And** Playwright 斷言（以測試用 fixture）：3 筆 diary.json 載入後 Diary 頁顯示 3 條

---

### AC-024-TIMELINE-STRUCTURE：Diary 頁採扁平 timeline 結構 `[K-024]`

**Given** 使用者訪問 `/diary`
**When** 頁面載入完成
**Then** 頁面結構為扁平垂直 timeline，**無 milestone accordion**（無可摺疊區塊）
**And** 所有 entry 同層級垂直排列（非分組嵌套）
**And** 左側有垂直 rail 貫穿所有 entry；寬度、位置、高度、顏色依 visual-spec `wiDSi` 的 rail role（rail height 隨 entryCount 變動：`/diary` 對應 wiDSi `entryCount=5` 為 624px；Homepage 對應 N0WWY `entryCount=3` 為 304px）
**And** 每條 entry 左側與 rail 交接處有矩形 marker；尺寸、cornerRadius、位置、顏色依 visual-spec `wiDSi` 的 marker role
**And** Playwright 斷言：`/diary` 頁面無 `<details>` / `<summary>` 元素（accordion 機制）；有 rail 元素
**And** Playwright 斷言（rail）：`import spec from '../docs/designs/K-024-visual-spec.json';` → `expect(rail).toHaveCSS('background-color', hexToRgb(railRole.color))`；寬/高/位置用 JSON 值做 `toHaveCSS`
**And** Playwright 斷言（marker）：marker 數量 = visual-spec 對應 frame 的 `entryCount`（/diary 為 5，Homepage 為 3，假設 diary.json ≥ 該值）；每個 marker 的 computed style 用 JSON import 做 `toHaveCSS`

---

### AC-024-ENTRY-LAYOUT：每條 entry 三層排版 `[K-024]`

**Given** 使用者訪問 `/diary`
**When** 頁面滾動至任一 entry
**Then** entry 含三層文字：entry-title / entry-date / entry-body
**And** 三層文字的字型、字級、字重、行高、letterSpacing、顏色依 `docs/designs/K-024-visual-spec.json` `wiDSi` frame 的對應 role（entry-title / entry-date / entry-body）定義
**And** 若 `ticketId` 存在，entry-title 文字為 `K-XXX — <title>` 格式
  - 分隔符為 em-dash（U+2014），兩側各一個半形空格
  - 例：`K-017 — Portfolio /about Rewrite`
  - **不得使用 middle-dot（·, U+00B7）或 hyphen（-）**
**And** 若 `ticketId` 不存在，無前綴（entry-title 直接為 title 文字）
**And** Playwright 斷言（分隔符）：`import spec from '../docs/designs/K-024-visual-spec.json';` → 對 wiDSi frame 的 entry-title role，`expect(title).toContainText(' — ')` 且 `expect(title).not.toContainText(' · ')` 且 `expect(title).not.toContainText(' - ')`
**And** Playwright 斷言（字型 catchall）：entry-title / entry-date / entry-body 的 computed `fontFamily` / `fontSize` / `fontStyle` / `fontWeight` / `lineHeight` / `letterSpacing` / `color` 均 import visual-spec role 值 + `hexToRgb(role.color)` 做 `toHaveCSS`，不得手打 literal 數值

---

### AC-024-PAGE-HERO：/diary 頁面 Hero 區大標 + 分隔線 + italic 副標 `[K-024]`

**Given** 使用者訪問 `/diary`
**When** 頁面載入完成
**Then** 頁面頂部（NavBar 下方）顯示 Hero 區
**And** 大標文字為 `Dev Diary`（依 visual-spec `wiDSi` 的 hero-title role）
**And** 大標字型規格依 visual-spec `wiDSi` 的 hero-title role（Bodoni Moda italic 64px）
**And** 大標下方有水平分隔線，尺寸與顏色依 visual-spec `wiDSi` 的 hero-divider role
**And** 分隔線下方有 italic 副標，literal 文字為：`Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first.`
**And** 副標字型規格依 visual-spec `wiDSi` 的 hero-subtitle role（Newsreader italic 17px）
**And** Playwright 斷言：`import spec from '../docs/designs/K-024-visual-spec.json';` → hero-title `toHaveText(heroTitle.text)`；computed `fontFamily` / `fontSize` / `fontStyle` / `color` 用 JSON import 做 `toHaveCSS`
**And** Playwright 斷言：hero-subtitle `toHaveText(heroSubtitle.text)`；computed style 用 JSON import 做 `toHaveCSS`
**And** Playwright 斷言：hero-divider computed `backgroundColor` = `hexToRgb(spec.frames[0].components.find(c => c.role === 'hero-divider').color)`

---

### AC-024-CONTENT-WIDTH：Diary 頁內容寬度 1248px `[K-024]`

**Given** 使用者訪問 `/diary` 且 viewport 寬度 ≥ 1248px
**When** 頁面載入完成
**Then** content 容器的 computed `maxWidth` 為 `1248px`（依 visual-spec `wiDSi.contentWidth`）
**And** content 容器水平置中（`margin: 0 auto` 或等效）
**And** Playwright 斷言（desktop viewport）：`/diary` content container computed `maxWidth` = `1248px`

**Given** 使用者訪問 `/diary` 且 viewport 寬度 < 1248px（含 mobile ≤ 480px）
**When** 頁面載入完成
**Then** mobile layout 規格由 Architect 設計文件於 `docs/designs/K-024-diary-structure.md` 定義（Breakpoint 決策、entry 三層文字在窄寬下的順序與字級、rail / marker 是否隱藏或縮放）
**And** 本 AC 不測 mobile；mobile 斷言由 Architect 設計文件定版後另起 AC，或加入設計文件的 Playwright 清單

---

### AC-024-LOADING-ERROR-PRESERVED：Loading / Error 狀態機制保留 `[K-024]`

**Given** diary.json 載入中（模擬 slow network）
**When** 使用者訪問 `/diary`
**Then** 顯示 Loading 狀態（沿用 K-017 前 `<DiaryPage>` 的 loading UX，例 `<LoadingSpinner>` 或 skeleton）
**And** 載入完成後切換至 timeline 結構

**Given** diary.json 載入失敗（模擬 404）
**When** 使用者訪問 `/diary`
**Then** 顯示 Error 狀態（沿用既有 UX），提示「Failed to load diary data」或等效訊息
**And** Playwright 斷言：載入失敗時 Error 元素存在

---

### AC-024-PM-PERSONA-SYNC：PM persona 每日維護流程文字對齊 K-024 `[K-024]`

**Given** `~/.claude/agents/pm.md` 的 `## K-Line diary.json 每日維護` 段落於 2026-04-20 寫入時使用「K-023 上線後生效」文字（當時預估編號）
**When** 本票關閉時
**Then** PM 同步 Edit persona 將「K-023 上線後生效」修正為「K-024 上線後生效」
**And** PM 的 auto trigger table 中對應條目也同步修正
**And** Edit tool call 實際執行（不得只聲稱）

---

### AC-024-REGRESSION：既有功能無回歸 `[K-024]`

**Given** K-017 所有 AC（AC-017-*）於 K-017 關閉時為 PASS，特別是 AC-017-HOME-V2 / AC-017-FOOTER（`/diary` 無 Footer 負斷言）
**When** 本票實作完成
**Then** K-017 所有 Playwright 斷言仍 PASS
**And** `AC-DIARY-1` 既有斷言（Diary 頁從 diary.json 正確渲染）仍 PASS（可能需更新斷言以對齊扁平 schema，但核心行為不變）
**And** Homepage `<DevDiarySection>` 在本票完成後仍渲染 3 條 entry（AC-024-HOMEPAGE-CURATION）
**And** `npx tsc --noEmit` exit 0
**And** `frontend/public/diary.json` 的變更觸發 `DiaryPage.spec.ts` Playwright 子集通過（依 file-class 表）

---

## 放行狀態

**待 K-021 先完成 + QA Early Consultation + Architect 設計：** Architect 需於 K-021 放行後接手 K-024，產出設計文件 `docs/designs/K-024-diary-structure.md`，涵蓋：
- diary.json schema migration 策略（一次性轉換 vs 雙 schema 並存 transition）
- 中文條目英譯規劃（保留原意的翻譯準則）
- 舊無 K-XXX 條目合併的代表性 date 與 title / text 選擇
- Curation 策略的 UI pattern（infinite scroll vs Load more button）
- Timeline 結構的 HTML 結構（`<ol>` vs `<ul>` vs `<div>`）與 accessibility（`role="list"`）
- Mobile breakpoint 決策（繼承 K-027 `sm:` 640px 或重設為 480px custom）與 entry 三層文字窄寬排版
- Loading / Error 元件實際結構（AC-024-LOADING-ERROR-PRESERVED 要求保留既有 UX，實際 component 由 Architect 選型）
- PM persona 更新的確切 Edit diff（AC-024-PM-PERSONA-SYNC）

**已由 visual-spec.json 定案（Architect 直接讀 `docs/designs/K-024-visual-spec.json`，不再待決）：**
- ~~磚紅矩形 marker 精確尺寸~~ → `wiDSi` marker role（20×14px, cornerRadius 6）
- ~~Hero 副標文案~~ → `wiDSi` hero-subtitle.text
- ~~Hero 大標精確文字~~ → `wiDSi` hero-title.text = `"Dev Diary"`
- ~~entry-title 分隔符~~ → em-dash（U+2014，兩側單空格），見 AC-024-ENTRY-LAYOUT + `wiDSi` entry-title role textDelimiter

**PM 放行 Architect 前置：** 依 global CLAUDE.md PM Handoff Verification 規則，ticket frontmatter 需有 `qa-early-consultation` 欄位指向 QA 早期諮詢紀錄；本票 frontmatter 尚未補入，AC 修訂完成後 PM 另起任務召喚 qa agent 做 Early Consultation，產出 retrospective log entry 後回補 frontmatter。

## 相關連結

- [PRD.md — K-024 section](../../PRD.md)（待同步補入）
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket（前置 Homepage v2）](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket（前置基建）](./K-021-sitewide-design-system.md)
- [設計稿: homepage-v2.pen frame wiDSi](../../frontend/design/homepage-v2.pen)
- [pm.md persona (~/.claude/agents/pm.md)](~/.claude/agents/pm.md)

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上反省；PM 於 QA PASS 後彙整）
