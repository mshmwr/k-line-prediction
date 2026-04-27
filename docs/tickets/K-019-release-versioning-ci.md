---
id: K-019
title: Release Versioning & CI/CD
status: backlog
type: feat
priority: medium
size: M
created: 2026-04-19
---

## 背景

每次 deploy 觸發版本發布流程：自動產生版本文件、git tag、GitHub Release（含 Playwright 截圖）。目的是建立 UI「時光機」。

## Spec & Plan

- Spec: `docs/designs/2026-04-19-release-versioning-design.md`
- Plan: `docs/designs/2026-04-19-release-versioning-ci.md`

## Acceptance Criteria

見 spec AC-K019-1 ~ AC-K019-5。

## Future Enhancement

`/business-logic` 頁面目前未實作（K-017 PM 裁決先跳過，Navbar Prediction link 也先隱藏）。  
該頁面完成後，需更新 `frontend/e2e/screenshot.spec.ts`，加入 post-auth `/business-logic` 截圖，記錄 auth 牆後的實際 UI 狀態。  
→ 在 /business-logic 對應 ticket 中追加此需求。

## Retrospective
