---
id: K-026
title: AppPage 子元件 paper palette 遷移（K-021 W-R3-02 follow-up）
status: backlog
type: refactor
priority: medium
created: 2026-04-20
source: K-021 Reviewer Round 3 W-R3-02
---

## 背景

K-021 已將 `/app` body 外層遷至 paper palette（`bg-paper` + `text-ink`），並通過 AC-021-BODY-PAPER Playwright 斷言。但 K-021 Reviewer Round 3 發現 AppPage 7 個子元件仍殘留 dark-class：

- `frontend/src/components/MainChart.tsx`
- `frontend/src/components/TopBar.tsx`
- `frontend/src/components/OHLCEditor.tsx`
- `frontend/src/components/StatsPanel.tsx`
- `frontend/src/components/MatchList.tsx`
- `frontend/src/components/PredictButton.tsx`
- `frontend/src/components/ErrorBoundary.tsx`

此 7 檔有 `text-white` / `bg-gray-900` / `border-white/10` 等 dark-class。外層米白 + 內層暗色的視覺斷層與 K-021 design doc §6.6「AppPage 整頁米白」不一致。

**K-025 scope 限定為 UnifiedNavBar hex → token，不含 AppPage 子元件**；另開 K-026 獨立追蹤。

## 依賴關係

- K-021 已 closed（AC-021-BODY-PAPER 外層已綠）
- 與 K-025 可並行（兩票不交疊）
- 可於 K-022 / K-023 / K-024 前或後進行

## 範圍

**含：**

1. **逐檔盤點 dark-class**：上列 7 檔 grep `text-white` / `bg-gray-` / `bg-\[#0` / `border-white` / 其他 dark-hex，列出完整對照表。
2. **對應 K-021 token 遷移**：
   - `text-white` 在 AppPage workspace bg 上 → `text-ink` 或 `text-paper`（視外層容器實際色決定）
   - `bg-gray-900` / `bg-[#0D0D0D]` → `bg-paper` 或 AppPage workspace 專屬中間色（若 design doc 有列）
   - `border-white/10` → `border-ink/10` 或 `border-muted`
3. **視覺目視驗證**：dev server 訪問 `/app` 登入上傳 CSV 後整頁截圖，對照 K-021 design doc §6.6 AppPage mockup（如有）或 K-017 visual report `/app` 段落；要求 MainChart 背景、OHLCEditor input、StatsPanel card、MatchList row、PredictButton 皆符合米白系。
4. **Playwright 斷言**：擴 `frontend/e2e/sitewide-body-paper.spec.ts` 或新 spec，斷言 AppPage 主要子元件 computed bg/text 符合 paper/ink token。

**不含：**
- AppPage 結構改版（TD-K021-04 redesign 範圍，未來獨立票）
- AppPage <900px viewport 響應性（TD-K021-07）
- AppPage 功能行為改動

## 驗收條件

### AC-026-APPPAGE-PAPER：AppPage 7 子元件無 dark-class `[K-026]`

**Given** 開發者 grep 上列 7 個子元件檔案
**When** 搜尋 `text-white` / `bg-gray-9` / `border-white` / hex `#0[0-9A-F]{5}` / hex `#1[0-9A-F]{5}` 等 dark pattern
**Then** 返回結果數 = 0（或僅留已明示保留之 edge case，於 ticket 內列出並說明）
**And** `npx tsc --noEmit` exit 0
**And** `npm run build` 成功

### AC-026-APPPAGE-VISUAL：目視與 Playwright 雙重驗證 `[K-026]`

**Given** QA 於 dev server 訪問 `/app`、登入並上傳測試 CSV
**When** 觸發 prediction 並展開 MatchList 任一 card
**Then** 整頁配色符合 K-021 paper palette（無暗色區塊殘留，除非 design doc 明列 workspace dim zone）
**And** Playwright 斷言：AppPage 主要子元件（MainChart container / OHLCEditor input / StatsPanel / MatchList card）computed backgroundColor 不為 `rgb(0, 0, 0)` 或任何暗色；text color 符合 `rgb(26, 24, 20)`（ink）或 design doc workspace 中階色

### AC-026-REGRESSION：既有 AppPage 功能無回歸 `[K-026]`

**Given** K-021 所有 AC-021-* 在 K-021 關閉時為 PASS
**When** 本票實作完成
**Then** K-021 Playwright suite 全綠（特別是 AC-021-BODY-PAPER `/app` case、AC-021-FOOTER `/app` case）
**And** `/app` 上傳 CSV → prediction → MatchList 展開 → 統計面板顯示完整流程無 regression

## 相關連結

- [K-021 ticket](./K-021-sitewide-design-system.md)
- [K-025 ticket](./K-025-navbar-hex-to-token.md)（並行，scope 不交疊）
- [K-021 design doc §6.6](../designs/K-021-sitewide-design-system.md)
- tech-debt TD-K021-04（AppPage redesign，未來範圍）

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上；PM 於 QA PASS 後彙整）
