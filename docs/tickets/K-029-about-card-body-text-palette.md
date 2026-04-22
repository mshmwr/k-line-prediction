---
id: K-029
title: /about Architecture + Ticket Anatomy cards — dark-theme gray text 遷移至 paper palette
status: open
type: fix
priority: high
created: 2026-04-21
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-029
---

## 背景

K-022 A-12（shared primitives paper palette 遷移）scope 僅涵蓋五個 primitive/common 組件（CardShell / SectionContainer / SectionHeader / SectionLabel / CtaButton）。但 `/about` 內有兩個 leaf-level 組件仍殘留 dark-theme gray classes，在 paper background 下呈現為低對比灰色文字，視覺可讀性差：

1. **`components/about/ArchPillarBlock.tsx`**（S6 Project Architecture section）
   - `text-gray-300`（body div）
   - `text-gray-400`（testing pyramid list item）
   - `text-gray-300`（testing pyramid layer label span）

2. **`components/about/TicketAnatomyCard.tsx`**（S5 Anatomy of a Ticket section）
   - `text-gray-400`（body space-y-2 div）
   - `text-gray-500`（Outcome / Learning label spans）
   - `text-purple-400`（ticket ID badge span — dark-theme accent，paper bg 上對比不足）

這是 K-022 A-12 遷移不完整的遺漏，不是 K-022 以後引入的 regression。

## 根因

K-022 A-12 scope 清單只列 shared primitives，未往下掃 `/about` 所有 leaf 組件。兩個受影響組件（`ArchPillarBlock.tsx` / `TicketAnatomyCard.tsx`）是在 K-017 時以 dark-theme 寫成，K-022 未覆蓋。

## 關於 Footer 問題的釐清

本票**不處理** footer — architecture doc「Footer 放置策略」表明確指定 `/about` 使用 `<FooterCtaSection />`（含 "Let's talk →" + email + GitHub + LinkedIn + GA 聲明），而非 `HomeFooterBar`。此為有意設計，經 K-021 / K-022 AC-022-FOOTER-REGRESSION 確認。`FooterCtaSection` 是 `/about` 的 about-specific CTA，具備 GA tracking、Newsreader italic link 樣式；與 `HomeFooterBar` 的功能性差異是設計語意不同，非 bug。

## 範圍

僅修改以下兩個檔案：

- `frontend/src/components/about/ArchPillarBlock.tsx`
- `frontend/src/components/about/TicketAnatomyCard.tsx`

遷移原則：K-021 paper palette tokens（`text-ink` / `text-muted` / `text-charcoal`）為目標，參考同類組件（`PillarCard.tsx` 用 `text-muted` 作 body text）。ticket ID badge 改為 `text-charcoal` 或 `text-ink`（需 Architect 確認語義色）。

**不包含：**
- K-022 已處理的 CardShell / SectionContainer / SectionLabel 等
- PillarCard.tsx（已用 `text-muted`，無問題）
- RoleCard.tsx / MetricCard.tsx（視 Architect scan 結果決定；若發現 gray 殘留則同票修）
- FooterCtaSection（設計語意正確，不改）
- HomeFooterBar（不在 /about scope）

## Architect Pre-check 決策（PM 2026-04-22 裁決）

PM 依 architecture.md §Design System Tokens（L442-L463）+ 同類組件參照（`PillarCard.tsx` / `RoleCard.tsx` / `MetricCard.tsx`）+ WCAG AA 對比計算，直接裁決三項 BQ：

### C-body：ArchPillarBlock / TicketAnatomyCard 主 body text token
**決策：`text-muted`（`#6B5F4E`）**
- **理由：**
  - 與 `PillarCard.tsx` L29 `<div className="text-muted text-sm leading-relaxed mb-4 flex-1">{body}</div>` 語義對齊 — PillarCard 本身就是 K-022 A-12 paper palette 標準，照抄。
  - WCAG AA 對比 `#F4EFE5` vs `#6B5F4E` ≈ 4.84:1，body text（12px `text-xs` / 14px `text-sm`）通過 AA 4.5:1 門檻。
  - `text-muted` 於 architecture.md L453 定義為「Footer / meta / NavBar non-active」，延伸至 card body prose 屬合理擴張（PillarCard 已確立先例）。

### C-pyramid：ArchPillarBlock testing pyramid layer span（`Unit` / `Integration` / `E2E`）
**決策：`text-ink`（`#1A1814`）**
- **理由：**
  - 原設計用 `text-gray-300` 搭配 `font-mono` 於 `text-gray-400` sibling li 之上，是想讓 layer label 比 detail 文字更突出；在 paper 環境下對應語義是「提高對比強度」。
  - `text-ink` AAA（≈ 13.5:1），比 body 的 `text-muted` 多一階，維持原本「label 比 detail 顯著」的視覺階層。
  - 避免 `text-charcoal` — 保留 charcoal 給 badge / CardShell LAYER header 等 identity 角色（見 C-badge 下方說明）。

### C-badge：TicketAnatomyCard ticket ID badge（`K-002` / `K-008` / `K-009`）
**決策：`text-charcoal`（`#2A2520`）**
- **理由：**
  - Badge 於原設計是 `text-purple-400 font-bold`，語義是「identifier / metadata flag」而非 body prose — architecture.md L452 `charcoal` token 定義即「次文字 / 輔助元素」，對齊語義。
  - AAA 對比（≈ 11.9:1），保留原先「勝過 body 的視覺權重」意圖（font-bold + higher contrast）。
  - 不選 `text-ink` 因 ink 是主文字（card title `h3` 已用 `text-ink`），避免 badge 與 title 同階混淆。
  - 不選 `text-muted` 因 muted 用於 body / meta，強度不足以替代原設計的「accent pop」角色。

### C-scope：其餘 `components/about/` 組件 dark-theme 殘留掃描
**結論：無需擴大 scope。**
- grep `text-gray-* / text-purple-* / text-blue-* / text-slate-* / text-zinc-*` on `frontend/src/components/about/` → 只有 `ArchPillarBlock.tsx`（3 sites）+ `TicketAnatomyCard.tsx`（4 sites）命中。
- RoleCard / MetricCard / PillarCard / FooterCtaSection / PageHeaderSection / SectionHeader / SectionContainer / DossierHeader / RedactionBar 全部乾淨（皆 `text-ink` / `text-muted`）。
- ticket §範圍不擴大；K-022 A-12 + K-029 為完整 cover /about paper palette 遷移。

## QA Early Consultation（2026-04-22 完成）

記錄於 `docs/retrospectives/qa.md 2026-04-22 K-029`。**PM 子 agent session 無 Agent 工具，依 persona §PM session capability pre-flight 以明示揭露進行 simulated consultation**；QA sign-off 時由正式 qa subagent 覆驗。

**Challenges 提出 7 項，處置：**
- C1 AC 措辭「可讀深色 / 或更深」主觀 → **補 AC**：改 RGB allow-list（text-ink / text-charcoal / text-muted）+ disallow-list（gray-300/400/500 / purple-400）。
- C2 Ticket ID badge 語義色 → **PM 裁 `text-charcoal`**（見下方 Architect Pre-check 決策）。
- C3 Playwright selector 穩定性 → **KG-029-01 Known Gap**：Engineer 可自行加 testid 或用結構 anchor；非 AC 強制。
- C4 新 spec 安置 → Architect 設計文件指定檔案，非 AC-blocking。
- C5 cross-component 完整性 → grep 確認僅 2 檔殘留，scope 完整。
- C6 Testing pyramid layer span 色 → **PM 裁 `text-ink`**（body 同階，與粗體 sibling li 避免對比混淆）。
- C7 CardShell 繼承 → 驗證無繼承風險。

**Known Gap：**
- **KG-029-01** — Playwright selector path: Architect design doc prescribes data-testid names for 4 assertion targets (`arch-pillar-body` / `arch-pillar-layer` / `ticket-anatomy-body` / `ticket-anatomy-id-badge`). Engineer implements per design doc. QA sign-off verifies compliance with prescribed testids.

### Verified by qa subagent 2026-04-22

qa subagent re-ran adversarial review. Upgrades to previous simulated consultation:
- C3 → KG reframed: testid naming is Architect mandate, not Engineer discretion (about/ DossierHeader + FooterCtaSection precedent)
- C6 → AC tightened: pyramid `<li>` detail fixed to text-muted (prevents hierarchy inversion if Engineer chose text-ink for both li and span)
- AC allow-list assertion tightened from "至少一個" to "三個皆" (previous wording allowed Engineer to pick a color outside both allow AND disallow lists and still pass "at least one" on 1/3 cards)
- Borderline observation: text-muted on paper at 12px = 4.84:1 (passes AA 4.5:1 but close to floor) — recorded, no action
- K-022 about-v2.spec.ts L195 color-assertion style confirmed as the canonical pattern to follow

## 驗收條件

### AC-029-ARCH-BODY-TEXT：Architecture section card body 文字採用 paper palette token `[K-029]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Project Architecture section（Nº 05）
**Then** 三個 ArchPillarBlock 的 body text（description 段落）computed `color` 必須等於下列三個 paper palette 之一（**三個 ArchPillarBlock 皆須命中**，逐個斷言，不得以「至少一個」通過）：
  - `rgb(26, 24, 20)`（text-ink `#1A1814`）
  - `rgb(42, 37, 32)`（text-charcoal `#2A2520`）
  - `rgb(107, 95, 78)`（text-muted `#6B5F4E`）
**And** 上述 body text 元素 computed `color` **不得**等於任一以下 dark-theme 殘值：
  - `rgb(209, 213, 219)`（gray-300）
  - `rgb(156, 163, 175)`（gray-400）
  - `rgb(107, 114, 128)`（gray-500）
**And** testing pyramid `<li>` detail（pyramid `<ul>` 下三個 `<li>` 的描述文字）computed `color` 必須**固定等於** `rgb(107, 95, 78)`（text-muted）— 不採 allow-list；避免與下一條 layer span 同色造成階層崩塌（child == parent）
**And** testing pyramid layer label span（`Unit` / `Integration` / `E2E` mono span，nested 在 `<li>` 內）computed `color` 必須等於 `rgb(26, 24, 20)`（text-ink；PM 於 BQ 裁決，對齊 body 同階並在 muted `<li>` detail 上提亮，見 §Architect Pre-check C-pyramid）
**And** Playwright 斷言：三個 ArchPillarBlock **逐一**（iterate 全部 instance）驗 body 段落 computed `color` 命中 allow-list 集合；三個 pyramid `<li>` detail 逐一驗 = `rgb(107, 95, 78)`；三個 layer span 逐一驗 = `rgb(26, 24, 20)`。本 AC 對應 3（pillar）+ 3（pyramid li）+ 3（layer span）= **9 個獨立 Playwright 斷言**，不得合併

---

### AC-029-TICKET-BODY-TEXT：Ticket Anatomy section card body 文字採用 paper palette token `[K-029]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Anatomy of a Ticket section（Nº 04）
**Then** 三個 TicketAnatomyCard 的 Outcome / Learning 內容文字 computed `color` 必須等於下列三個 paper palette 之一（**三個 TicketAnatomyCard 皆須命中**，逐個斷言，不得以「至少一個」通過）：
  - `rgb(26, 24, 20)`（text-ink `#1A1814`）
  - `rgb(42, 37, 32)`（text-charcoal `#2A2520`）
  - `rgb(107, 95, 78)`（text-muted `#6B5F4E`）
**And** 上述 body 元素 computed `color` **不得**等於任一以下 dark-theme 殘值：
  - `rgb(156, 163, 175)`（gray-400）
  - `rgb(107, 114, 128)`（gray-500）
**And** Outcome / Learning label（`Outcome` / `Learning` mono span）computed `color` 必須落在上述 allow-list，**三個 TicketAnatomyCard 的 Outcome label + Learning label 皆須逐一命中**，且**不得**為 `rgb(107, 114, 128)`（gray-500）
**And** ticket ID badge（`K-002` / `K-008` / `K-009`）computed `color` **三個 TicketAnatomyCard 皆須**等於 `rgb(42, 37, 32)`（text-charcoal；PM 於 BQ 裁決，見 §Architect Pre-check C-badge），**不得**為 `rgb(196, 181, 253)`（purple-400）
**And** Playwright 斷言：三個 TicketAnatomyCard **逐一**（iterate 全部 instance）驗 body 段落 computed `color` 命中 allow-list；三個 badge 逐一驗 = `rgb(42, 37, 32)`。本 AC 對應 3（body）+ 3（badge）+ 6（Outcome + Learning labels × 3）= **12 個獨立 Playwright 斷言**，不得合併

---

### AC-029-REGRESSION：K-022 既有斷言不回歸 `[K-029]`

**Given** K-022 所有 AC（AC-022-*）於 K-022 關閉時為 PASS
**When** 本票實作完成
**Then** K-022 + K-017 所有 Playwright 斷言仍 PASS（特別是 AC-022-FOOTER-REGRESSION、AC-022-SECTION-LABEL、AC-022-DOSSIER-HEADER）
**And** `npx tsc --noEmit` exit 0

---

## 放行狀態

**PM 2026-04-22 放行 Architect。**

- [x] QA Early Consultation 2026-04-22 完成（simulated with disclosure；qa subagent 於 sign-off 覆驗）
- [x] AC 措辭升級為 RGB allow/disallow-list（C1）
- [x] Architect Pre-check 全部 BQ 由 PM 直接裁決（C-body=`text-muted`、C-pyramid=`text-ink`、C-badge=`text-charcoal`、C-scope=2 檔完整）
- [x] Architect 放行：設計文件須涵蓋
  - Route Impact Table（/about 單頁，其他 route 標 unaffected — /、/diary、/app、/business-logic 無 ArchPillarBlock / TicketAnatomyCard）
  - Engineer 實作 checklist（檔案 2 個 / 代換項 7 處 / Playwright spec 安置決策）
  - **必須於 design doc prescribe 4 個 data-testid 名**：`arch-pillar-body` / `arch-pillar-layer` / `ticket-anatomy-body` / `ticket-anatomy-id-badge`，對齊 about/ 現有 testid convention（DossierHeader / FooterCtaSection 皆使用 `data-testid`）。Engineer 依 design doc 實作，不得自由裁量 selector 策略；QA sign-off 驗 compliance。
  - 無後端 / API / 路由 / props interface 變更（視覺 token 替換）
- [x] Engineer 放行：Architect 設計文件完成後 PM 覆核通過（2026-04-22 PM sign-off：checklist A/B/C/D/E/F 全綠；Route Impact Table §3、11-row implementation checklist §6、21-assertion Playwright strategy §7、§8 API Invariance、§9 Pencil Parity、§13 DOM 計數釐清全具備；architecture.md changelog L605 + `updated:` 2026-04-22 已更新；architect.md retro 2026-04-22 K-029 頂列已 append；AC↔design §15 cross-check 21 assertions bijective；KG-029-01 措辭與 ticket 一致）

## 相關連結

- [K-022 ticket（A-12 遷移前置）](./K-022-about-structure-v2.md)
- [K-021 ticket（paper palette token 定義）](./K-021-sitewide-design-system.md)
- [architecture.md Design System tokens](../../agent-context/architecture.md)

---

## Retrospective

（各角色完成後補上；PM 於 QA PASS 後彙整）
