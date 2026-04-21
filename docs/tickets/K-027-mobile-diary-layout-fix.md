---
id: K-027
title: DiaryPage 手機版 milestone timeline 視覺重疊修復
status: open
type: bug
priority: high
created: 2026-04-21
---

## 背景

使用者於 2026-04-21 回報 production bug：`/diary` 頁面在手機寬度下渲染壞掉。production URL：`https://k-line-prediction-app.web.app/diary`。

**使用者提供截圖描述（手機 viewport ~375px/390px 寬度）：**

- 症狀：Dev Diary 內多個 milestone 條目視覺上互相重疊堆疊，標題 / 日期 / 內文文字糊成一團
- 具體命中條目（至少三筆）：K-021（全站設計系統基建）、K-008（自動化視覺報告 script）、Codex Review Follow-up（K-009/K-010/K-011）的 milestone block 互相壓疊
- 內容區高度計算疑似錯誤導致 overflow 重疊（左側 timeline bullet / border 位置看起來正確）
- 英文 italic 與中文 body 混疊
- **桌面寬度（≥ 1024px）同頁面正常**——K-017 / K-021 的 Playwright 視覺報告均為桌面截圖，未能捕捉此 mobile regression

**影響：** portfolio-facing demo 在手機訪客視角壞掉。Recruiter 使用手機訪問時會看到糊成一團的 Dev Diary，對求職主動曝光造成直接傷害（參考 memory `project_job_search_criteria.md` 硬條件 / K-017 的 portfolio-oriented 定位）。

**初步結構參考（留給 Architect 診斷，非 PM 裁決）：**

目前 `/diary` 組件結構：
- `frontend/src/pages/DiaryPage.tsx` — 最外層 wrapper（`max-w-3xl mx-auto px-6 py-16`）
- `frontend/src/components/diary/DiaryTimeline.tsx` — 直接 map milestones，無 layout 包裝
- `frontend/src/components/diary/MilestoneSection.tsx` — accordion 展開/折疊（`border rounded-sm mb-3`），展開時子內容用 `divide-y`
- `frontend/src/components/diary/DiaryEntry.tsx` — `flex gap-4 py-2`，`date` 固定 `w-24`（96px），`text` flex-1

K-021 完成後 `/diary` 只做了 body 配色遷移（paper/ink + 字型），**結構與 mobile responsive 未經獨立驗收**。

## 依賴關係

- **不依賴** K-022 / K-023 / K-024（後三票處理結構改版 / schema 扁平化）
- 本票為 hotfix 性質，只修 mobile responsive bug，不動 DiaryPage 結構 / diary.json schema
- **與 K-024 scope 邊界：** 若 Architect 評估 bug 根因需要 schema / 結構層級改動，應 blocker 回 PM 重新討論是否併入 K-024；K-027 預設為 CSS / responsive 層面 surgical fix

## 範圍

**含：**

1. DiaryPage 手機版 timeline milestone 不重疊（≤ 480px viewport 全部 breakpoint）
2. 手機寬度下所有 milestone 的標題、日期、內文文字可讀性（不 clip / 不 overflow-hidden 截斷）
3. Playwright 新增 mobile viewport 測試涵蓋上述兩項
4. 桌面寬度（≥ 1024px）既有 layout 與視覺不得回歸

**不含：**

- 桌面視覺重設計（桌面目前 OK，非 regression）
- `diary.json` schema 改動（屬 K-024 scope）
- DiaryPage 結構改版 / 新 component 拆分（屬 K-024 scope）
- 全站其他頁面（Homepage / About / App / BusinessLogic）的 mobile responsive audit（若需要，另開獨立 ticket）
- 字型 / 配色調整（K-021 已處理）

## 設計決策紀錄（待 Architect 設計階段處理，PM 本次不裁決）

| 決策項目 | 內容 | 目前狀態 |
|----------|------|---------|
| Layout 技術方案 | mobile 改用 flex-col 堆疊 / CSS Grid / media query 重排 date 與 text / 其他 | 待 Architect 評估 |
| DiaryEntry 手機版 date 位置 | 保持左側 w-24 / 改 date 置於 text 上方 / 縮小 date 字級 | 待 Architect 評估 |
| Milestone card padding/margin 策略 | 保持 `mb-3` / 手機增加間距 / 改用 `divide-y` on outer | 待 Architect 評估 |
| Mobile breakpoint 定義 | Tailwind 預設 `sm:` (640px) / 自訂 480px / 375px-specific | 待 Architect 評估 |
| accordion 展開行為是否手機特化 | 手機預設全收合（省空間） / 保持桌面相同 `defaultOpen={i===0}` | 待 Architect 評估 |

PM 本票只開 ticket + 定 AC 視覺行為，layout 技術方案交 Architect 設計階段裁決。

## 驗收條件

### AC-027-NO-OVERLAP：手機 viewport 下相鄰 milestone 不重疊 `[K-027]`

**Given** 使用者於手機 viewport（375px / 390px / 414px 三種寬度）訪問 `/diary`
**When** 頁面載入完成且 diary.json 含至少 3 筆 milestone
**Then** 任兩個相鄰 milestone card 的 bounding box y 區間**完全不重疊**（`boxA.y + boxA.height <= boxB.y`）
**And** 所有 milestone card（不論展開或折疊狀態）的 `overflow` 不得為 `hidden` 截斷內容
**And** 滾動至頁面底部，最後一個 milestone card 完整可見（不被 viewport bottom / footer 遮擋）

**Playwright test case 數量需求：** 至少 **3 個獨立 test case**，每個 viewport（375 / 390 / 414）一個；每個 test case 內對所有相鄰 milestone 對跑 y 區間斷言（milestone 數量 N → N-1 對比較）。

---

### AC-027-TEXT-READABLE：milestone 標題 / 日期 / 內文完整可讀 `[K-027]`

**Given** 使用者於手機 viewport（375px / 390px / 414px）訪問 `/diary`
**When** 展開任一 milestone（或預設 `defaultOpen={i===0}` 的第一個）
**Then** 該 milestone 的 `milestone` title 文字完整顯示（無 `text-overflow: ellipsis` 截斷、無 `overflow: hidden` 隱藏字元）
**And** 該 milestone 所有 `items` 的 `date` 欄位（`YYYY-MM-DD` 格式）完整顯示（10 字元全可見）
**And** 該 milestone 所有 `items` 的 `text` 欄位（中英文混排）完整顯示，不被容器寬度限制截斷
**And** 所有文字的 computed `color` 不得為 `transparent` / 與背景相同（對比度可讀）
**And** 所有文字的 `font-size` 在 375px viewport 下不得小於 12px（可讀性下限）

**Playwright test case 數量需求：** 至少 **3 個獨立 test case**（375 / 390 / 414 各一），每個 case 對「首個展開 milestone 的 title + 首筆 item 的 date + text」三處驗證可讀性條件。

---

### AC-027-DESKTOP-NO-REGRESSION：桌面視覺零回歸 `[K-027]`

**Given** 使用者於桌面 viewport（1024px / 1280px / 1440px）訪問 `/diary`
**When** 頁面載入完成
**Then** DiaryPage 渲染結果與 K-021 closed 時 `docs/reports/K-021-visual-report.html` 的 `/diary` 截圖**視覺一致**（layout / 字型 / 配色 / 間距不變）
**And** 所有既有 Playwright 桌面測試（`diary.spec.ts` 及其他涉及 `/diary` 的 spec）繼續通過，無斷言修改
**And** `max-w-3xl mx-auto px-6 py-16` wrapper、`UnifiedNavBar`、`MilestoneSection` accordion 行為保持不變

**Playwright test case 數量需求：** 至少 **1 個桌面 baseline test case**（1280px viewport，跑首個 milestone 展開 + 三筆 item 可見斷言）；**加上既有 diary-related spec 全量 regression 通過**（數量由 QA 跑 suite 確認）。

---

**AC 覆蓋 test case 總計下限：** `3 (NO-OVERLAP) + 3 (TEXT-READABLE) + 1 (DESKTOP-NO-REGRESSION) = 7 個新增 test case`，外加既有 diary-related spec regression。

## 放行狀態

**2026-04-21 ticket 開立，待 Architect 設計階段接手。**

PM 本票不做下列事項：
- 不召喚 Architect / Engineer / Reviewer / QA（使用者只要求開票）
- 不裁定 layout 技術方案（flexbox vs grid vs absolute vs media query 留給 Architect）
- 不 commit（等使用者指示）
- 不假設使用者要立即執行（可能先囤 backlog）

**等使用者下一步指示：** 立即放行 Architect 開始設計 vs 囤 backlog 等 K-022/K-023/K-024 結構改版一併處理。

## Retrospective

（待完成後各 role append）
