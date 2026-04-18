---
id: K-003
title: 前端 bundle 分割 — chunk > 500kB 警告修復
status: closed
type: chore
priority: low
created: 2026-04-16
closed: 2026-04-17
---

## 背景

`npm run build` 出現 Vite chunk > 500kB 警告。目前所有依賴打包成單一 chunk，影響初始載入時間與 Lighthouse 分數。

## 範圍

**含：**
- 分析 bundle 組成（`vite-bundle-visualizer` 或 `rollup-plugin-visualizer`）
- 用 `manualChunks` 或 dynamic `import()` 拆分大型依賴（`lightweight-charts`、`recharts`、`react-markdown` 等候選）
- build 後確認無 chunk > 500kB 警告

**不含：**
- SSR / code splitting by route（目前 SPA 架構不需要）
- 壓縮設定調整（Vite 預設已啟用）

## 驗收條件

### AC-BUNDLE-1: build 無 chunk > 500kB 警告

**Given** 執行 `npm run build`
**When** build 完成
**Then** terminal 無 `chunk xxx.js larger than 500 kB` 警告

### AC-BUNDLE-2: 現有 E2E 測試全數通過

**Given** bundle 拆分後
**When** 執行 `/playwright`
**Then** 所有 E2E tests pass，無 regression

## 相關連結

- [PRD.md — 技術債](../../PRD.md#技術債)
- [PM-dashboard.md](../../../PM-dashboard.md)

## 驗收結果（2026-04-17）

**PM 最終驗收：PASS — Ticket 關閉**

| AC | 結果 | 細節 |
|----|------|------|
| AC-BUNDLE-1 | PASS | 最大 chunk 179 kB，無 chunk > 500 kB 警告 |
| AC-BUNDLE-2 | PASS | 22 Playwright tests 全數通過，無 regression |

QA 結論：GO。Bundle 分割實作符合所有驗收條件，技術債 TD-001（CI npm install 驗證）已記錄留待 CI 建立時處理。

---

## 技術債記錄

| # | 描述 | 優先級 | 決策理由 |
|---|------|--------|---------|
| TD-001 | recharts 移除後需確認執行 `npm install`，確保 package-lock.json 與 node_modules 一致；CI 環境若存在才能真正驗證同步 | Low | build 已通過，本機無問題；補齊 CI pipeline 屬更大基礎建設任務，不為單一 npm install 確認開工。待 CI 建立時一併處理 |
