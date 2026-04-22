---
id: K-024
title: /diary 結構重做 + diary.json schema 扁平化
status: backlog
type: feat
priority: medium
created: 2026-04-20
visual-spec: docs/designs/K-024-visual-spec.json
qa-early-consultation: docs/retrospectives/qa.md#2026-04-22-k-024-early-consultation-round-1
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
**And** `title` 與 `text` 為 required non-empty string（`.length > 0`，純空白字串視為空）
**And** `date` 欄位為 `YYYY-MM-DD` 格式（regex `^\d{4}-\d{2}-\d{2}$` 匹配）
**And** `date` 必須為有效日曆日期（`new Date(date).toISOString().slice(0, 10) === date`；排除 `9999-13-45` 等語法符合但語意無效日期）
**And** `ticketId` 若存在則為 `K-XXX` 格式（regex `^K-\d{3}$`）；不接受空字串（empty string `""` 視為 invalid，缺席 key 才合法）
**And** entry 不得含宣告外的 extra keys（任何 `ticketId` / `title` / `date` / `text` 以外的 key 使 schema guard FAIL；舊 `milestone` / `items` 殘留等同違反）
**And** 舊 schema（`{ milestone, items[] }`）已全部轉換，檔案中不再含 `milestone` key
**And** Vitest 單元測試：採 **zod**（非手寫 type guard；zod 聲明式較易驗證且 error message 可讀）+ `.strict()` 禁 extra keys；載入 diary.json 後驗證 schema，全部 entry pass

---

### AC-024-ENGLISH：diary.json 所有條目統一英文 `[K-024]`

**Given** 開發者讀取 `frontend/public/diary.json`
**When** 掃描所有 entry 的**所有 string 欄位**（`ticketId` + `title` + `date` + `text`，不限 title + text）
**Then** 所有欄位內容為英文（擴展 regex `[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]` 零匹配；涵蓋 CJK 符號 + 平假名 + 片假名 + CJK 擴展 A + BMP CJK + 全形符號與拉丁）
**And** 既有中文條目已逐條英譯，保留原意
**And** Vitest 單元測試：對每筆 entry 執行 `Object.values(entry).filter(v => typeof v === 'string')` 後套用上述擴展 regex，無任何命中

---

### AC-024-LEGACY-MERGE：舊無 K-XXX 條目統整為一筆 `[K-024]`

**Given** 開發者讀取 `frontend/public/diary.json`
**When** 掃描所有 entry
**Then** `ticketId` **缺席**（key 不存在）的 entry **正好一筆**
**And** 空字串 `ticketId: ""` 不合法（由 AC-024-SCHEMA `^K-\d{3}$` regex 強制；LEGACY-MERGE 條目以「key 缺席」表達，不以空字串表達）
**And** 該筆的 `title` literal 文字為 `"Early project phases and deployment setup"`（涵蓋 Phase 1/2/3 + Deployment + Codex Review Follow-up）
**And** 該筆的 `text` 為該段時期摘要：**50-100 英文字 word count**（以空白切分後計數，`text.trim().split(/\s+/).length` 介於 50~100 含邊界）
**And** 該筆的 `date` 為 `"2026-04-16"`（PM 裁決 2026-04-22：該段時期最後活動日；Phase 1-3 + Deployment + Codex Review Follow-up 活動至 2026-04-16 告一段落，K-017 始於 2026-04-19）
**And** Vitest 斷言：`entries.filter(e => !('ticketId' in e)).length === 1` 且 `entries.filter(e => e.ticketId === '').length === 0`
**And** Vitest 斷言（word count）：該筆 `text.trim().split(/\s+/).length` 介於 50~100 含邊界

---

### AC-024-HOMEPAGE-CURATION：Homepage 顯示最新 3 條 `[K-024]`

**範圍**：本 AC 僅適用於 desktop viewport ≥ 1248px；mobile 行為由 AC-024-CONTENT-WIDTH 的 Architect hand-off 統一涵蓋。

**Given** 使用者訪問 `/` 且 viewport 寬度 ≥ 1248px 且 `diary.json` entry 數 ≥ 3
**When** 頁面滾動至 Diary section（`hpDiary`）
**Then** 顯示 **3 條** diary entry（非更多、非更少），對應 visual-spec `N0WWY` 的 `entryCount=3`
**And** 3 條按 `date` 降序排列（最新在最上方）
**And** 3 條均為 diary.json 中 `date` 最新的 3 筆
**And** **Tie-break 規則**：兩筆 `date` 相同時，以 `diary.json` **陣列後出現者為新**（array index 越大越新；與 K-Line 每日 append 流程一致）
**And** Homepage diary section 含 3 個 marker 元素（一一對應 3 條 entry），依 visual-spec `N0WWY` 的 marker role
**And** Playwright 斷言：以 `data-testid="diary-entry-wrapper"` 選擇器取得 3 個元素（復用 K-028 Sacred testid，避免同一 DOM 兩個 `data-testid` 衝突），`expect(page.locator('[data-testid="diary-entry-wrapper"]')).toHaveCount(3)`；且 `expect(homepageMarkers).toHaveCount(3)`

**Given** `diary.json` entry 數為 0（空陣列）
**When** 使用者訪問 `/`
**Then** Homepage Diary section **整個隱藏**（不渲染 section heading、rail、marker；無 empty-state 訊息）
**And** Playwright 斷言：`expect(page.locator('#hpDiary')).toHaveCount(0)`（或對應 section 選擇器）

**Given** `diary.json` entry 數為 1 或 2（`< 3`）
**When** 使用者訪問 `/`
**Then** 顯示 **所有可用 entry**（不 padding、不補空位、不隱藏 section；Homepage 顯示 N 條，N = entry 總數）
**And** marker 數 = 顯示的 entry 數（非固定 3）
**And** Playwright 斷言（fixture 1 entry 與 2 entries 各一組）：`diary-entry-wrapper` count 等於 fixture 大小

---

### AC-024-DIARY-PAGE-CURATION：Diary 頁預設渲染 5 條 + Load more button 載入更多 `[K-024]`

**範圍**：本 AC 僅適用於 desktop viewport ≥ 1248px；mobile 行為由 AC-024-CONTENT-WIDTH 的 Architect hand-off 統一涵蓋。

**Pagination pattern**：PM 裁決 2026-04-22 採 **Load more button**（非 infinite scroll）——按鈕可測、無 scroll timing flakiness；Architect 決定按鈕 literal 文字、位置、disabled 樣式。

**Data fetch**：一次性載入整份 `diary.json`，所有 pagination 為**純 client-side slicing**（無 mid-load 的 API failure 場景；AC-024-LOADING-ERROR-PRESERVED 僅涵蓋初始 fetch）。

**Tie-break**：`date` 相同時 array index 越大越新（與 AC-024-HOMEPAGE-CURATION 一致）。

**Given** 使用者訪問 `/diary` 且 viewport ≥ 1248px 且 `diary.json` entry 數 ≥ 5
**When** 頁面載入完成（尚未點 Load more）
**Then** 顯示 **5 條** diary entry
**And** 5 條按 `date` 降序排列（含 tie-break array-index 降序）
**And** 5 條為 diary.json 中 `date` 最新的 5 筆

**Given** 使用者在 `/diary` 且 diary.json entry 數 > 5
**When** 點擊 Load more button
**Then** 再渲染 5 條（總共 10 條顯示）
**And** 若 diary.json 剩餘條數 ≤ 0 則 Load more button **從 DOM 移除或 disabled**
**And** Playwright 斷言：初始 5 條；點擊後 10 條；剩餘 0 時按鈕 `expect(button).toBeHidden()` 或 `toBeDisabled()`

**Boundary**（PM 強制覆蓋；每條 fixture 獨立 spec）：
- **entry = 0**：Diary 頁顯示「no entries yet」空狀態訊息（literal 由 Architect 定）；Load more 按鈕不存在；rail/marker 不渲染
- **entry = 1**：顯示 1 條；Load more 不存在；rail 高度貼合單 entry container 高度
- **entry = 3**（< 初始 5）：顯示 3 條；Load more 不存在
- **entry = 5**（=初始）：顯示 5 條；Load more **不存在**（無可載）
- **entry = 10**（=一輪 Load more 後剛好滿）：初始 5 → 點擊 → 10；點擊後 Load more 不存在
- **entry = 11**（> 2 輪）：初始 5 → 第一次點擊 10 → 第二次點擊 11；第二次點擊後 Load more 不存在

**Concurrency / idempotency**：
**Given** 使用者快速連點 Load more button 兩次（< 100ms 間隔）
**When** 第二次點擊發生於第一次載入 render cycle 內
**Then** 只再載入 **5 條**（非 10 條）；Load more 於載入過程中 disabled 或以 React state flag 確保 idempotent
**And** Playwright 斷言（rapid double-click）：`await Promise.all([button.click(), button.click()])` 後顯示 10 條不是 15 條

**Fixture strategy**：
- Boundary specs 用 `page.route('**/diary.json', ...)` fulfill 測試 fixture（fixture 陣列大小 0/1/3/5/10/11 各一份）
- 不改動 production `frontend/public/diary.json` 做測試
- 既有 DiaryPage.spec.ts 主 flow 仍用 production diary.json

---

### AC-024-TIMELINE-STRUCTURE：Diary 頁採扁平 timeline 結構 `[K-024]`

**範圍**：本 AC 僅適用於 desktop viewport ≥ 1248px；mobile rail/marker 行為由 AC-024-CONTENT-WIDTH 的 Architect hand-off 統一涵蓋。

**Given** 使用者訪問 `/diary` 且 viewport ≥ 1248px
**When** 頁面載入完成
**Then** 頁面結構為扁平垂直 timeline，**無 milestone accordion**（無可摺疊區塊）
**And** 所有 entry 同層級垂直排列（非分組嵌套）
**And** 左側有垂直 rail 貫穿所有 entry
  - 顏色、寬度、x 座標依 visual-spec `wiDSi` 的 rail role
  - rail height **不直接斷言 visual-spec 的 624px literal**（design 的 624px 耦合固定 entry 高度，真實 DOM entry 高度隨 text 長度變動）
  - 改斷言「rail height ≥ 已渲染 entries container 高度 − 容忍量」（robust 至 text wrap）
**And** 每條 entry 左側與 rail 交接處有矩形 marker；尺寸、cornerRadius、位置、顏色依 visual-spec `wiDSi` 的 marker role
**And** **marker 數量 = 當前已渲染的 entry 數**（動態語義；非固定 visual-spec entryCount literal）
  - `/diary` 初始載入：marker 數 = 初始 entry 數（5 或 entry 總數小於 5 時等於總數）
  - Load more 點擊後：marker 數 = 新的總顯示 entry 數
  - Homepage：marker 數 = AC-024-HOMEPAGE-CURATION 的顯示 entry 數（0 時 section 隱藏則 0；1/2 時等於 entry 總數；≥3 時等於 3）
**And** Playwright **負斷言**（防 regression）：
  - `expect(page.locator('details, summary')).toHaveCount(0)` — 無 accordion
  - `expect(page.locator('[class*="divide-y"]')).toHaveCount(0)` — 舊 divider 已移除
  - `expect(page.locator('[class*="milestone"]')).toHaveCount(0)` — 舊 milestone wrapper 已移除
**And** Playwright **正斷言**（rail）：`import spec from '../docs/designs/K-024-visual-spec.json';` → rail `toHaveCSS('backgroundColor', hexToRgb(railRole.color))`；rail `width` 以 JSON 值斷言；rail `height` 以動態計算（entries bounding box bottom − top）與 rail bounding box `toBeGreaterThanOrEqual` 比對
**And** Playwright **正斷言**（marker）：marker 數量動態 = `page.locator('[data-testid="diary-entry"]').count()`；每個 marker computed style `backgroundColor` / `width` / `height` / `borderRadius` 以 JSON import + `hexToRgb` 做 `toHaveCSS`

---

### AC-024-ENTRY-LAYOUT：每條 entry 三層排版 `[K-024]`

**範圍**：本 AC 僅適用於 desktop viewport ≥ 1248px；mobile 三層文字順序與字級由 AC-024-CONTENT-WIDTH 的 Architect hand-off 統一涵蓋。

**Given** 使用者訪問 `/diary` 且 viewport ≥ 1248px
**When** 頁面滾動至任一 entry
**Then** entry 含三層文字：entry-title / entry-date / entry-body
**And** **DOM 順序**：title 先於 date 先於 body（`titleEl.compareDocumentPosition(dateEl) & Node.DOCUMENT_POSITION_FOLLOWING` truthy，`dateEl.compareDocumentPosition(bodyEl) & Node.DOCUMENT_POSITION_FOLLOWING` truthy）
**And** 三層文字的字型、字級、字重、行高、letterSpacing、顏色依 `docs/designs/K-024-visual-spec.json` `wiDSi` frame 的對應 role（entry-title / entry-date / entry-body）定義
**And** 若 `ticketId` 存在，entry-title 文字為 `K-XXX — <title>` 格式
  - 分隔符為 em-dash（U+2014）**explicit codepoint**，兩側各一個**單一**半形空格（不得雙空格）
  - 例：`K-017 — Portfolio /about Rewrite`
  - **不得使用 middle-dot（·, U+00B7）或 hyphen-minus（-, U+002D）作為 ticketId/title 分隔符**
  - 負斷言 scope：僅檢查 ticketId 與 title 之間的分隔位置，title 本體含 hyphen（例 `AI-powered prediction`）合法
**And** 若 `ticketId` 不存在，entry-title 直接為 title 文字，textContent **不**以 `K-\d{3}` 開頭，且**不**含 ` — ` 作為開頭分隔符
**And** Playwright **正斷言**（ticketId 存在 case）：entry-title textContent 匹配 regex `/^K-\d{3} \u2014 .+$/`（codepoint `\u2014` explicit；單空格強制；防雙空格）
**And** Playwright **負斷言**（ticketId 存在 case，prefix-scoped）：
  - `expect(text).not.toMatch(/^K-\d{3} \u00b7 /)` — 開頭不得為 middle-dot 分隔
  - `expect(text).not.toMatch(/^K-\d{3} - /)` — 開頭不得為 hyphen-minus 分隔（title 本體 hyphen 不受影響）
**And** Playwright 斷言（無 ticketId case）：`expect(text).not.toMatch(/^K-\d{3}/)`
**And** Playwright 斷言（字型 catchall）：entry-title / entry-date / entry-body 的 computed `fontFamily` / `fontSize` / `fontStyle` / `fontWeight` / `lineHeight` / `letterSpacing` / `color` 均 import visual-spec role 值 + `hexToRgb(role.color)` 做 `toHaveCSS`，不得手打 literal 數值

---

### AC-024-PAGE-HERO：/diary 頁面 Hero 區大標 + 分隔線 + italic 副標 `[K-024]`

**範圍**：本 AC 僅適用於 desktop viewport ≥ 1248px；mobile Hero 字級與分隔線尺寸由 AC-024-CONTENT-WIDTH 的 Architect hand-off 統一涵蓋。

**Given** 使用者訪問 `/diary` 且 viewport ≥ 1248px
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

### AC-024-CONTENT-WIDTH：Diary 頁內容寬度 1248px + 邊界點 + 無溢出 `[K-024]`

**Given** 使用者訪問 `/diary` 且 viewport 寬度 ≥ 1248px
**When** 頁面載入完成
**Then** content 容器的 computed `maxWidth` 為 `1248px`（依 visual-spec `wiDSi.contentWidth`）
**And** content 容器水平置中（`margin: 0 auto` 或等效）
**And** Playwright 斷言（desktop viewport 1920/1440）：`/diary` content container computed `maxWidth` = `1248px`

**Given** 使用者訪問 `/diary` 且 viewport 寬度 **正好 1248px**（邊界點）
**When** 頁面載入完成
**Then** content 容器的 computed `maxWidth` 為 `1248px`（閉區間 threshold inclusive）
**And** Playwright 斷言：viewport `setViewportSize({ width: 1248, height: 800 })` 後 maxWidth assertion 通過

**Given** 使用者訪問 `/diary` 且 viewport 寬度介於 **481px ~ 1247px**（tablet / laptop portrait 中間寬）
**When** 頁面載入完成
**Then** 頁面無水平捲軸溢出（`document.documentElement.scrollWidth <= window.innerWidth`）
**And** content 容器寬度 ≤ viewport 寬度（不跨出視窗）
**And** Playwright 斷言（800 / 1024 / 1200 三個 viewport）：`scrollWidth <= innerWidth`（no-overflow），content container bounding box width ≤ viewport width

**Given** 使用者訪問 `/diary` 且 viewport 寬度 **≤ 480px**（mobile only）
**When** 頁面載入完成
**Then** mobile layout 規格由 Architect 設計文件於 `docs/designs/K-024-diary-structure.md` 定義（Breakpoint 決策、entry 三層文字在窄寬下的順序與字級、rail / marker 是否隱藏或縮放）
**And** 本 AC 不測 mobile（≤ 480px）的 layout 細節；mobile 斷言由 Architect 設計文件定版後另起 AC 或加入設計文件的 Playwright 清單
**And** 但 **no-overflow 保護** 仍適用（mobile viewport 亦需 `scrollWidth <= innerWidth`）

---

### AC-024-LOADING-ERROR-PRESERVED：Loading / Error 狀態機制保留 `[K-024]` 🚫 **DEFERRED**

**Status**: **Blocked on Architect design** — 2026-04-22 QA Early Consultation 裁定為 untestable 直至 Architect 交付 component 結構 + data-testid 合約。

**Reason**: 當前 AC 僅言「沿用既有 UX」+「例 `<LoadingSpinner>` 或 skeleton」+「等效訊息」；selector / literal 文字 / slow-network 模擬手法皆未定，QA 無法寫 spec。

**Unblock protocol**:
1. Architect 於 `docs/designs/K-024-diary-structure.md` 明確定義：
   - Loading 組件 selector（`data-testid="diary-loading"`）與基本 DOM 結構
   - Error 組件 selector（`data-testid="diary-error"`）+ canonical 錯誤 literal（或明示 selector-only 斷言）
   - Slow-network 模擬手法（建議 `page.route('**/diary.json', r => setTimeout(() => r.continue(), 500))`；loading window ≥ 100ms visible）
   - 400 / 500 / timeout / CORS / offline 等 error 分類範圍（全部 cover 或逐條列 Known Gap + 理由）
   - Retry / recovery UX（retry button、auto-retry、或明示「單次 fetch 失敗無 retry」）
2. PM 基於 Architect design 回補完整 Given/When/Then 至本 AC（含上述條款）
3. PM 另起 **QA Early Consultation (round 2)** 只 review 本 AC 與 Architect design，通過後本 AC 移出 DEFERRED 並可放行 Engineer 實作

**直到 unblock 為止**：本 AC 不計入 Phase Gate AC 完備性評估；Engineer 實作 Phase 3 其他 AC 時不得觸碰 Loading / Error 邏輯（保持現狀 placeholder）。

---

### ~~AC-024-PM-PERSONA-SYNC~~ → 移至 DoD Checklist（非 AC）

**Reclassify 2026-04-22**（QA Challenge #10）：本項為 repo 外部檔案（`~/.claude/agents/pm.md`）的一次性手動 Edit，**無測試 harness**可驗證，不適合作為 Playwright/Vitest 可測的 AC。QA 裁定 untestable。

**改列為 `## 放行狀態` 下的 DoD Checklist 項目**（見該 section）——由 PM 於本票 close 時執行 Edit tool call，記錄於 ticket `## Retrospective` 段內，不計入 Phase Gate AC 數。

---

### AC-024-REGRESSION：既有功能無回歸 `[K-024]`

**Sacred assertions**（不得動；斷言 FAIL = 本票違反）：
- K-017 `NavBar` order + Footer 可見性（`/diary` 無 Footer 負斷言，見 AC-017-FOOTER）
- K-017 `AC-017-HOME-V2` 的 Homepage sections DOM order + bullet marker 可見性
- K-023 `<DevDiarySection>` Homepage 渲染 3 條 diary marker（20×14 / `rgb(156, 74, 59)` / `borderRadius 0`）
- K-021 `/about` readability token (`ink` / `paper` / `brick-dark`) 斷言
- K-027 手機版 DiaryEntry `flex-col` + `break-words` + `overflow-hidden` 暫行決策（除非 K-024 Architect design 文件明確重新設計並於 §K-027 設計繼承 裁定 override，否則保留）
- 所有 `npm run test` (Vitest) 既有 passing case 不得退化

**Allowed-to-change assertions**（扁平 schema / 新 timeline 結構要求的合理更新）：
- 舊 `<details>` / `<summary>` accordion 斷言（可刪）
- 舊 `.divide-y` visual separator 斷言（可刪）
- 舊 `milestone` wrapper / `items[]` nested schema 斷言（可刪）
- `AC-DIARY-1` 既有 Diary 頁渲染斷言可改寫對齊扁平 schema；但「從 diary.json 載入 entry 並顯示」的 **核心行為**必須保留
- K-017 舊「`/diary` 顯示 milestone accordion 展開」相關斷言可改寫為新的 timeline 斷言

**K-027 regression policy**：若 Architect design 文件選擇不繼承 K-027 某項暫行決策，必須 **回報 PM** 升級為 blocker + 登 Tech Debt；PM 裁決後才能移除對應 K-027 AC。Architect / Engineer 不得靜默捨棄。

**Given** K-017 / K-021 / K-023 / K-027 所有 Sacred assertions 為 PASS 基線
**When** 本票實作完成
**Then** 全套 Playwright E2E suite 跑完：Sacred assertions 全 PASS；Allowed-to-change 項目可改寫後為 PASS
**And** Homepage `<DevDiarySection>` 在本票完成後仍渲染 3 條 entry（AC-024-HOMEPAGE-CURATION ✓）
**And** `npx tsc --noEmit` exit 0
**And** `npm test` (Vitest) exit 0（含本票新增 zod schema spec + AC-024-SCHEMA / AC-024-ENGLISH / AC-024-LEGACY-MERGE 三支 Vitest）
**And** `frontend/public/diary.json` 的變更觸發 `DiaryPage.spec.ts` Playwright 子集通過（依 file-class 表）
**And** 若任一 Sacred assertion FAIL，QA 退件不 sign off，Engineer 修正後回跑

---

## 放行狀態

**待 K-021 先完成 + Architect 設計：** Architect 需於 K-021 放行後接手 K-024，產出設計文件 `docs/designs/K-024-diary-structure.md`，涵蓋：
- diary.json schema migration 策略（一次性轉換 vs 雙 schema 並存 transition）
- 中文條目英譯規劃（保留原意的翻譯準則）
- 舊無 K-XXX 條目合併段落的實際 `text`（50-100 words；date 已定 `2026-04-16`，title 已定 `"Early project phases and deployment setup"`）
- Homepage / Diary 頁面元件 `data-testid` 合約（至少：`diary-entry-wrapper`（Homepage，復用 K-028 Sacred）/ `diary-entry`（/diary）/ `diary-loading` / `diary-error` / `diary-load-more`）
- **Mobile breakpoint 決策**（PM 暫定：繼承 K-027 `sm:` 640px，除非 Architect 提出具體 design reason 改為 480px custom；不繼承須升級 blocker + 登 TD）
- Mobile layout：entry 三層文字順序、字級、rail / marker 是否隱藏或縮放（≤ 480px 範圍；481-1247px no-overflow 即可）
- Loading / Error 元件實際結構（AC-024-LOADING-ERROR-PRESERVED 已 DEFERRED，Architect 交付後 PM 另起 QA Early Consultation Round 2）
- Load more button literal 文字、disabled 樣式、位置（pattern 已定：button click + client-side slicing，見 AC-024-DIARY-PAGE-CURATION）

**DoD Checklist（本票 close 時 PM 執行，非 AC）：**
- [ ] `~/.claude/agents/pm.md` 的 `## K-Line diary.json 每日維護（K-023 上線後生效）` 文字修正為「K-024 上線後生效」；PM auto trigger table 對應條目同步
- [ ] 實際 Edit tool call 執行並於本票 `## Retrospective` PM 段紀錄 before/after diff
- [ ] 完成後於 AC-024-PM-PERSONA-SYNC 已廢止區段註記「Closed 2026-MM-DD」

**已由 visual-spec.json 定案（Architect 直接讀 `docs/designs/K-024-visual-spec.json`，不再待決）：**
- ~~磚紅矩形 marker 精確尺寸~~ → `wiDSi` marker role（20×14px, cornerRadius 6）
- ~~Hero 副標文案~~ → `wiDSi` hero-subtitle.text
- ~~Hero 大標精確文字~~ → `wiDSi` hero-title.text = `"Dev Diary"`
- ~~entry-title 分隔符~~ → em-dash（U+2014，兩側單空格），見 AC-024-ENTRY-LAYOUT + `wiDSi` entry-title role textDelimiter

**QA Early Consultation 狀態：**
- **Round 1（2026-04-22）完成**：12 AC 逐條 testability review + 7 類 boundary sweep + visual-spec drift 掃描；產出 11 條 Challenge；PM 於 2026-04-22 裁決回補（見各 AC + `docs/retrospectives/qa.md`）。
- **Round 2（待排程）**：AC-024-LOADING-ERROR-PRESERVED 於 Architect 交付 design 文件後重啟，僅 review 該條 AC + 可能衍生的 Loading/Error AC 細則。
- Frontmatter `qa-early-consultation` 欄位指向 `docs/retrospectives/qa.md` 2026-04-22 K-024 Early Consultation 條目。

**PM 放行 Architect 前置**（依 global CLAUDE.md PM Handoff Verification）：
1. frontmatter `qa-early-consultation` 欄位已指向 Round 1 retrospective entry（commit `e2b6fe5` land ✓）
2. K-021 已 close + deployed（2026-04-20 closed，CDN 驗證 ✓）
3. 本 AC 版本為 2026-04-22 Round 1 後修訂版（PM 裁決 ✓）
4. Architect 於 2026-04-22 交付 design 文件（`docs/designs/K-024-diary-structure.md`）+ 1 BQ；Architect 交付 design 文件後再走 QA Early Consultation Round 2 覆蓋 LOADING-ERROR，然後放行 Engineer。

**PM BQ 裁決紀錄：**

**BQ-024-01（Architect 2026-04-22 raised）**：AC-024-HOMEPAGE-CURATION 原 literal `data-testid="homepage-diary-entry"` 與 K-028 Sacred `data-testid="diary-entry-wrapper"` 在同一 DOM 元素衝突（HTML 禁同名 data-testid）。
- **PM 2026-04-22 裁決**：Option (b) 更名 K-024 AC literal `homepage-diary-entry` → `diary-entry-wrapper`（復用 K-028 Sacred）。
- **理由**：K-028 closed + deployed + CDN live bundle grep 驗證 `diary-entry-wrapper` 存在；Sacred 不可動 → Option (a) 違反；Option (c) 加廢 DOM → Option (b) 成本最低且 AC 為 PM-owned 屬許可操作。
- **影響範圍**：K-024 ticket 3 處 literal（AC-024-HOMEPAGE-CURATION line 184 / 195，§放行狀態 data-testid 合約清單 line 401），已於本裁決同 commit 全部更新。
- **Phase 2 unblocked**：Architect 可繼續 Phase 2 curation 設計。

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
