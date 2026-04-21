---
id: K-029
title: /about Architecture + Ticket Anatomy cards — dark-theme gray text 遷移至 paper palette
status: open
type: fix
priority: high
created: 2026-04-21
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

## Architect Pre-check（開工前）

Engineer 開工前 Architect 須確認：
1. `text-muted`（`#6B5F4E`）作為 body/description text 是否符合 paper bg 對比要求
2. ticket ID badge（`K-002` / `K-008` / `K-009`）的語義色：`text-charcoal`（`#2A2520`）或 `text-muted`
3. 全掃 `components/about/` 其餘組件是否還有 `text-gray-*` / `text-purple-*` / `text-blue-*` dark-theme 殘留，若有則併入本票 scope

## QA Early Consultation 評估

本票全部為 happy-path CSS token 替換，無 error state / boundary condition / network / auth edge case。

**QA Early Consultation: N/A — 所有 AC 均為 happy-path 視覺斷言，無 boundary/error/auth edge case。**

## 驗收條件

### AC-029-ARCH-BODY-TEXT：Architecture section card body 文字可讀深色 `[K-029]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Project Architecture section（Nº 05）
**Then** 三個 ArchPillarBlock 的 body text（description 段落、testing pyramid detail 文字）呈現為可讀深色，與米白背景形成明顯對比
**And** body text 的 computed color 不得為 gray-300（`rgb(209, 213, 219)`）、gray-400（`rgb(156, 163, 175)`）等深色背景專用低對比色
**And** testing pyramid layer label（`Unit` / `Integration` / `E2E`）文字亦為可讀深色，不得為 gray-300
**And** Playwright 斷言：至少一個 ArchPillarBlock body 段落的 computed `color` 為 `text-muted`（`rgb(107, 95, 78)`）或更深

---

### AC-029-TICKET-BODY-TEXT：Ticket Anatomy section card body 文字可讀深色 `[K-029]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Anatomy of a Ticket section（Nº 04）
**Then** 三個 TicketAnatomyCard 的 Outcome / Learning 內容文字呈現為可讀深色，與米白背景形成明顯對比
**And** body text 的 computed color 不得為 gray-400（`rgb(156, 163, 175)`）、gray-500（`rgb(107, 114, 128)`）等深色背景專用低對比色
**And** Outcome / Learning label（`OUTCOME` / `LEARNING`）的 computed color 亦為可讀深色（不得為 gray-500）
**And** ticket ID badge（`K-002` / `K-008` / `K-009`）文字在 paper 背景上可讀（不得為 purple-400（`rgb(196, 181, 253)`））
**And** Playwright 斷言：至少一個 TicketAnatomyCard Outcome 段落的 computed `color` 為 `text-muted` 或更深

---

### AC-029-REGRESSION：K-022 既有斷言不回歸 `[K-029]`

**Given** K-022 所有 AC（AC-022-*）於 K-022 關閉時為 PASS
**When** 本票實作完成
**Then** K-022 + K-017 所有 Playwright 斷言仍 PASS（特別是 AC-022-FOOTER-REGRESSION、AC-022-SECTION-LABEL、AC-022-DOSSIER-HEADER）
**And** `npx tsc --noEmit` exit 0

---

## 放行狀態

**待 Architect 確認語義色（架構決策）後放行 Engineer。**

- [ ] Architect 確認 body text token（`text-muted` vs `text-charcoal`）
- [ ] Architect 全掃 `components/about/` 剩餘 `text-gray-*` / `text-purple-*` residuals，確認 scope 完整

## 相關連結

- [K-022 ticket（A-12 遷移前置）](./K-022-about-structure-v2.md)
- [K-021 ticket（paper palette token 定義）](./K-021-sitewide-design-system.md)
- [architecture.md Design System tokens](../../agent-context/architecture.md)

---

## Retrospective

（各角色完成後補上；PM 於 QA PASS 後彙整）
