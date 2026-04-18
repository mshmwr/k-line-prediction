---
id: K-002
title: UI 優化 — icon、排版、loading 動畫
status: closed
type: feat
priority: medium
created: 2026-04-16
closed: 2026-04-18
---

## 背景

目前 UI 缺乏 icon、整體版面視覺層次不足、loading 狀態只有 CSS border-spin 動畫。
需要全面提升視覺質感。

## 範圍

**含：**
- Icon：NavBar、按鈕、Section 標題等加入 icon library
- 網頁排版：spacing、typography、視覺層次優化
- Loading 動畫：`LoadingSpinner` 改為較豐富的動畫效果
- NavBar 連結完整性：補上 About (`/about`) 入口連結

**不含：**
- 功能邏輯變更
- 深色 / 淺色主題切換
- 路由名稱變更（`/business-logic` 維持不變，另開 ticket 討論）
- 畫面切換系統重構（使用者說「後續討論」，另開 ticket）

## 設計決策紀錄

| 決策項目 | 內容 | 來源 | 時間 |
|----------|------|------|------|
| NavBar 按鈕呈現方式 | 回首頁按鈕（Home）：icon only；其他功能按鈕（App / About / Diary / Logic）：文字呈現 | 使用者確認 | 2026-04-18 |
| Home icon 來源 | 由設計師從 Lucide 挑選合適的 home icon；此 home icon 同時作為品牌識別的**暫代** logo，直到品牌 icon 正式設計完成 | 使用者確認（更正）| 2026-04-18 |
| 品牌 icon 設計 | 延後設計；現階段以 home icon（Lucide）暫代品牌識別，不在 K-002 範圍內 | 使用者確認（更正）| 2026-04-18 |
| Logic 連結呈現方式 | "Logic" 文字 + Lock icon 並排（**文字在左，icon 在右**）**固定顯示**，不因登入狀態改變；此為既有設計，設計師不得移除 Lock icon | 使用者確認（需求更正）| 2026-04-18 |
| Logic 連結路由 | href 對應現有 `/business-logic`，不改路由；設計稿 `/logic` 視為設計稿筆誤，Engineer 以現有路由為準 | PM 裁決（Architect 提出）| 2026-04-18 |
| About 連結入口 | NavBar 新增 About 連結（href: `/about`），列入 K-002 實作範圍；使用者確認「要改」 | PM 裁決（使用者補充）| 2026-04-18 |
| 畫面切換系統 | K-002 不動畫面切換系統；使用者說「後續討論」，另開新 ticket | PM 裁決（使用者補充）| 2026-04-18 |

## 狀態

**放行 Engineer。** PM 已裁決所有阻塞問題（2026-04-18）：路由維持 `/business-logic`、NavBar 補 About 連結、畫面切換系統延後至新 ticket。設計稿已完成，AC 全部確認，Engineer 可開始實作。

## 驗收條件

完整 AC 定義在 [PRD.md — UI 優化 Backlog](../../PRD.md#ui-優化-backlog)。

### AC-002-NAV：NavBar 連結完整性

**Given** 任何頁面載入完成
**When** 使用者看到 UnifiedNavBar
**Then** NavBar 包含以下連結：Home（icon only）、App、About、Diary、Logic
**And** About 連結的 href 為 `/about`
**And** Logic 連結的 href 為 `/business-logic`（不改路由）
**And** Logic 連結以「文字在左，Lock icon 在右」固定顯示

---

### AC-002-ICON：Icon Library 導入

**Given** 前端已安裝 icon library（具體選型由 Designer 決定，例如 Heroicons / Lucide）
**When** 使用者載入任一頁面
**Then** UnifiedNavBar 的 home icon 使用 icon library 的 home icon（取代現有 ⌂ Unicode 符號）
**And** PredictButton 的 icon 明確使用 Lucide `Play` icon（取代現有 ▶ Unicode 符號）
**And** SectionHeader 各 section 標題使用語意相符的 icon library icon
**And** 所有 icon 在 Retina / 高 DPI 螢幕下清晰，無鋸齒

**Given** icon library 已導入
**When** 工程師新增 icon
**Then** 可透過 import 單一套件使用，不需手動管理 SVG 檔案

### AC-002-LAYOUT：排版優化

**Given** 使用者訪問 `/`（首頁）或 `/app`（預測頁）
**When** 頁面載入
**Then** 頁面各區塊間距（section padding / gap）一致，符合設計稿規範
**And** 主要文字層次清晰：heading / subheading / body / caption 四級 typography 可視覺區分
**And** 互動元素（按鈕、輸入框）具備足夠的 touch target（最小 44×44px）

**Given** 使用者在行動裝置（viewport ≤ 768px）上訪問
**When** 頁面載入
**Then** 內容不溢出螢幕寬度
**And** 視覺層次與桌面版一致（無元素重疊或文字截斷）

### AC-002-LOADING：Loading 動畫改版

**Given** 使用者點擊 PredictButton 觸發預測請求
**When** API 請求進行中（loading 狀態）
**Then** LoadingSpinner 顯示比 border-spin 更有視覺質感的動畫（具體設計由 Designer 決定，例如 pulse、skeleton、multi-ring 等）
**And** 動畫流暢，不發生卡頓或閃爍

**Given** 預測請求完成或失敗
**When** loading 狀態結束
**Then** LoadingSpinner 立即消失，不殘留
**And** 頁面平滑過渡到結果或錯誤狀態（無明顯跳動）

## 技術債

| 項目 | 描述 | 優先級 | PM 裁決 | 裁決日期 |
|------|------|--------|---------|---------|
| AppPage.test.tsx 2 個 pre-existing failures | `shared timeframe toggle` 和 `display mode toggle` 在 JSDOM 環境找不到按鈕；與 K-002 無關，屬 JSDOM 環境限制。不影響 Playwright E2E 覆蓋。 | Low | 記入技術債，不開新 ticket；JSDOM 環境修復留待有需要時一併處理 | 2026-04-18 |
| AC-002-ICON Playwright 覆蓋不足 | 現有 spec 只驗證「icon library 可被使用」，未對 8 個 SectionHeader 的 icon 存在逐一斷言；CRITICAL-1 的根因測試漏洞。 | Medium | 記入技術債，下一個有 UI 變更的 ticket 補齊斷言 | 2026-04-18 |
| ARIA role 無 Playwright 斷言 | E2E 對 `role="status"` / `aria-label` 無覆蓋；CRITICAL-2 的根因測試漏洞。 | Medium | 記入技術債，建議在 AC-002-LOADING 驗收時補加無障礙斷言 | 2026-04-18 |

## 相關連結

- [PRD.md — UI 優化 Backlog](../../PRD.md#ui-優化-backlog)
- [PM-dashboard.md](../../../PM-dashboard.md)

---

## Retrospective

### Architect 反省

**花最多時間的地方：** `isLoggedIn` prop 全面清除的影響範圍評估——需要逐一確認所有使用 NavBar 的頁面；但這個評估做在設計文件裡，不夠徹底，導致遺漏 About 連結的 href 規格。

**需要修正的判斷：** About 連結入口原本未被列入設計範圍，是 Code Review 階段才被發現補回；這個 missing spec 本應在 Architect 審閱 PRD 時就攔截。

**下次改善：** 設計文件驗收時逐條核對「NavBar 含哪些連結」的 AC，不能只看 prop interface；AC 裡寫到的 URL path 都必須在設計稿確認有對應的 href。

---

### Engineer 反省

**判斷有誤的 AC：** AC-002-ICON 的 And 3（SectionHeader 各 section 標題使用 icon）——實作時遺漏了這個 And 條件，直到 Code Review 才發現。原因是在讀 AC 時習慣性略過「And」子句，只看「Then」。

**未預料到的邊界：** `LoadingSpinner` 的 `role="status"` 屬性——在整合時被刪除，沒有意識到這會破壞 ARIA 語意，也沒有對應的測試來攔截。`business-logic.spec.ts` 和 `pages.spec.ts` 未隨組件變更同步更新，是系統性遺漏。

**下次改善：** 實作前逐條列出所有 Then/And（而非只看 Then），並為每個 And 對應一個 Playwright 斷言；組件改動後立即 grep 所有引用該組件的測試檔，確認有無需同步更新的 selector。

---

### Code Reviewer 反省

**應在更早流程攔截的問題：**
- SectionHeader icon（AC-002-ICON And 3）白紙黑字寫在 ticket AC 中，Engineer 遺漏是可以在 AC 驗收時就攔截的；Code Reviewer 在 review 時發現，說明 AC 驗收環節（PM Gate Check）未做到逐條核對 And。
- `role="status"` 的移除屬於無障礙規範問題，Architect 設計文件若有明確的 ARIA 規格，Engineer 不易遺漏；這個問題根源在設計層。

**下次改善：** Review 時針對 ARIA 相關屬性做專項 checklist（`role`、`aria-label`、`aria-live`）；並在 review 開始前先逐條掃 AC 的 And 子句，不只看 diff。

---

### QA 反省

**回歸測試設計不足的地方：**
- AC-002-ICON 現有 Playwright spec 只驗證「icon library 可被使用」，未對 8 個 SectionHeader 的 icon 存在逐一斷言；這個測試漏洞是 CRITICAL-1（SectionHeader icon 漏實作）能夠通過 CI 的直接原因。
- `role="status"` 的移除未被 E2E 攔截，因為 E2E 對 ARIA role 無斷言；這是 CRITICAL-2 的根因測試漏洞。

**未覆蓋到的邊界：** grep 搜尋範圍未包含所有引用 SectionHeader 的測試，導致 `business-logic.spec.ts` 和 `pages.spec.ts` 未被納入回歸掃描。

**下次改善：** 每個有 UI icon 的 AC，QA 必須為每個 icon 寫獨立斷言（`getByTestId` 或 `getByRole`）；ARIA 屬性（`role`、`aria-label`）納入標準 E2E 斷言 checklist。

---

### PM 彙整

**跨角色重複問題：**
1. **And 子句的系統性忽略**：Architect 設計驗收、Engineer 實作、QA 測試三個角色都未徹底核對 AC 的 And 條件，導致 SectionHeader icon 同一問題被三個角色漏掉，最終在 Code Review 才攔截。
2. **ARIA 規格缺口**：設計文件未包含 ARIA 屬性規格，Engineer 和 QA 都無所參照，同一個 `role="status"` 問題在實作層被刪除、在測試層未被覆蓋。
3. **視覺驗證依賴 JSON 結構**：PM 在 Designer 輸出後未明確標注「視覺驗證需 get_screenshot 才算完成」，導致設計驗收存在視覺盲區。

**流程改善決議：**

| 問題 | 負責角色 | 行動 | 更新位置 |
|------|---------|------|---------|
| And 子句系統性遺漏 | PM / Engineer / QA | PM gate check 加入「逐條 And 對照」強制步驟；QA 每個 And 必須有對應斷言 | CLAUDE.md Engineer/QA section；pm.md Phase Gate 清單 |
| ARIA 規格缺口 | Architect | 設計文件新增「ARIA 規格」欄位（role、aria-label、aria-live）；Code Reviewer 加入 ARIA checklist | K-Line CLAUDE.md Architect section |
| 視覺驗證盲區 | PM | Designer 完成後 PM 明確聲明視覺驗證缺口，不得用 JSON 結構代替截圖確認 | pm.md Phase Gate 清單（已有 `get_screenshot` 規定，強化文字） |
| SectionHeader icon 測試漏洞 | QA | 技術債已記錄（AC-002-ICON Playwright 覆蓋不足），下一個有 UI 變更的 ticket 補齊斷言 | K-002 技術債（已記入） |
