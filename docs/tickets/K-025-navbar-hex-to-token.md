---
id: K-025
title: UnifiedNavBar hex → token 遷移 + navbar.spec.ts regex 同步更新
status: backlog
type: refactor
priority: medium
created: 2026-04-20
source: K-021 Reviewer 合併報告 W-3（TD-K021-02）
---

## 背景

K-021 交付時 `UnifiedNavBar.tsx` 保留 6 處 hex（`text-[#9C4A3B]` 等），`navbar.spec.ts` 有 8 處 regex 斷言 `/text-\[#9C4A3B\]/` 鎖定該寫法。PM 2026-04-20 Q2 裁決允許保留，理由為「`text-[#9C4A3B]` 與 `text-brick-dark` 編譯後 CSS 相同，保留不動可避免 K-005 navbar.spec 8 處 regex 回歸」。

但 K-021 Reviewer 合併報告 W-3 指出：此保留與使用者 prompt「嚴禁 hardcode hex」衝突，屬 token 集中管理原則的缺口。PM 本票獨立開票，一次性遷移 NavBar + spec，避免污染 K-021 fix-now 批次。

**依賴：** K-021 fix-now 完成後啟動（K-021 reviewer fix 批次含 C-1~C-4 + W-2 + S-3）。

## 範圍

**含：**

1. **`UnifiedNavBar.tsx` 6 處 hex → token 遷移**（全部已在 K-021 Tailwind config 註冊）：
   - `text-[#9C4A3B]` → `text-brick-dark`（active state）
   - `text-[#1A1814]` → `text-ink`（主文色，若有遺留）
   - `border-[#1A1814]` / `border-black` 等 → `border-ink`
   - 其他 `bg-[#F4EFE5]` → `bg-paper` 如有遺留一併遷
   - 完整對照表由 Engineer 執行前 grep `UnifiedNavBar.tsx` 列出

2. **`navbar.spec.ts` 8 處 regex 斷言同步更新**：
   - 既有 `/text-\[#9C4A3B\]/` 改為 `/text-brick-dark/` 或 aria-current 判定（推薦後者，斷言語意更清晰）
   - 配合 K-021 已加入的 `aria-current="page"`，spec 可改用 `[aria-current="page"]` selector 避免 class name 鎖定

3. **補 `/` route inactive color 斷言**（合併 TD-K021-09）：
   - `/` 路由下 App / Diary / About 三項斷言 color 為 `text-ink/60` 或 muted token（具體值依 K-021 design §5 確認）

**不含：**
- NavBar 結構改動（順序 / 新項 / icon 換）— 非 scope
- 其他頁面 hex 遷移（由 K-022/K-023/K-024 自管）

## 驗收條件

### AC-025-NAVBAR-TOKEN：NavBar 零 hex `[K-025]`

**Given** 開發者 grep `UnifiedNavBar.tsx`
**When** 搜尋 `#[0-9A-Fa-f]{6}` pattern
**Then** 返回結果數 = 0
**And** 所有顏色 / 邊框 / 背景 class 均為 K-021 token（`text-ink` / `text-brick-dark` / `bg-paper` 等）
**And** `npx tsc --noEmit` exit 0
**And** `npm run build` 成功

### AC-025-NAVBAR-SPEC：既有斷言語意不降級 `[K-025]`

**Given** `navbar.spec.ts` 8 處既有 regex 改為 token / aria-current selector
**When** 執行 `npx playwright test navbar.spec.ts`
**Then** 所有既有 test case 通過（K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR）
**And** active state 斷言改用 `[aria-current="page"]` selector（不再鎖 class name）
**And** 新增 `/` route inactive color 4 斷言（App / Diary / About / Prediction-hidden 分別斷言），補 TD-K021-09

### AC-025-REGRESSION：既有功能無回歸 `[K-025]`

**Given** K-021 所有 AC（AC-021-*）為 PASS
**When** 本票實作完成
**Then** K-021 所有 Playwright 斷言仍 PASS
**And** K-005 AC-NAV-1~5 仍 PASS
**And** 其他頁面 E2E 不回歸

## 相關連結

- [K-021 ticket](./K-021-sitewide-design-system.md)（前置依賴）
- [K-021 Reviewer W-3 findings](../reports/)（待 Reviewer 報告歸檔）
- [tech-debt TD-K021-02](../tech-debt.md#td-k021-02--unifiednavbar-hardcode-hex-k-025)
- [tech-debt TD-K021-09](../tech-debt.md#td-k021-09--route-navbar-inactive-color-未斷言)
