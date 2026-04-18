---
id: K-012
title: business-logic.spec.ts 測試名與斷言對齊
status: open
type: test
priority: low
created: 2026-04-18
source: docs/reviews/2026-04-18-code-review.md#p3-one-playwright-test-passes-but-does-not-verify-what-it-claims
---

## 背景

Codex code review 2026-04-18 指出 `frontend/e2e/business-logic.spec.ts` 有一個 test，名稱暗示它會驗證「登入後 Logic 連結鎖頭 icon 消失」，但實際斷言只檢查：

- Logic 連結可見
- 內容渲染

test 會通過但語意與名稱不符，造成 false confidence。

## 範圍

Engineer 擇一執行：

- **方案 A（推薦）：** 保留 test 名稱，補上「鎖頭 icon 登入後消失」的斷言
- **方案 B：** 改 test 名稱為實際斷言描述（e.g. `"logged-in user can view Logic link and secret content"`），不新增斷言

**推薦方案 A**：name 描述的行為是 AC-NAV-5（K-005）的實際需求，補斷言能同時強化該 AC 的 E2E 覆蓋。

**不含：**
- 其他 Playwright specs 的清理

## 預期異動檔案

- `frontend/e2e/business-logic.spec.ts`

## 驗收條件

### AC-012-ALIGN：測試名與斷言語意一致

**Given** `business-logic.spec.ts` 該 test
**When** 讀 test name 與 body
**Then** name 描述的行為與實際斷言完全對應
**And** 無「name 宣稱 A，實際只測 B」的 mismatch

### AC-012-PASS：Playwright E2E 全綠

**Given** 前端
**When** 執行 `/playwright`
**Then** 全部 45+ tests 通過（含本 ticket 新增或更新的斷言）

## 優先級理由

**low** — 非 regression 也非 correctness 問題，是測試品質議題。可與 K-011 或 K-013 同 sprint 一起處理，不需獨立 cycle。

## 下一棒

Engineer。建議與 K-009/K-010/K-011 綁一起 cycle 收掉。

## 相關連結

- [Code Review](../reviews/2026-04-18-code-review.md#p3-one-playwright-test-passes-but-does-not-verify-what-it-claims)
- [AC-NAV-5 K-005](../../PRD.md#ac-nav-5-business-logic-連結-auth-狀態-k-005)

---

## Architecture Review

**裁決：無需 Architecture** — 由 senior-architect 於 2026-04-18 審視。

**理由：**
- 改動範圍：僅 `frontend/e2e/business-logic.spec.ts` 一個 test（方案 A 補斷言或方案 B 改名）
- 無跨層、無 interface 變更、無組件改動
- 方案 A / B 選擇屬「測試品質決策」，由 Engineer / QA 在 ticket 範圍內決定即可

**推薦方案 A** 的理由（ticket 已列）Architect 認同：補斷言能強化 AC-NAV-5 E2E 覆蓋，是更高價值選項。

**放行 Engineer。**

— senior-architect, 2026-04-18
