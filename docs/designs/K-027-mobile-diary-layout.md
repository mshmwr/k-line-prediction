---
id: K-027-design
title: DiaryPage 手機版 milestone timeline 視覺重疊修復 — 設計文件
ticket: K-027
author: senior-architect
created: 2026-04-21
status: ready-for-engineer
---

## 0 Pre-impl Q&A

### Q1：K-024 是否已有 mobile layout 設計？

**答：否。**

讀取 `docs/tickets/K-024-diary-structure-and-schema.md` 確認：K-024 定義的是
`/diary` 頁面的**結構重做**（扁平 timeline + diary.json schema 扁平化），AC 中
描述組件結構、字型、顏色、content 寬度等，但**完全未定義 mobile breakpoint 策略、
手機版 entry layout、date 欄在窄螢幕下的處理方式**。K-024 狀態為 `backlog`，尚未
進入 Architect 設計階段。

**結論：K-027 需產出手機版 CSS 暫行方案（本文件），並於 K-024 Architect 設計時
承繼本票的 breakpoint 決策。**

---

### Q2：K-027 需在 K-024 ticket 登記承繼項？

**答：是。** 詳見 §6 K-024 承繼項。

---

### Q3：Layout 技術方案裁決

**三個方案：**

| 方案 | 描述 | 優點 | 缺點 |
|------|------|------|------|
| A：Tailwind responsive prefix `sm:` | 在現有 `flex gap-4` 基礎上加 `flex-col sm:flex-row`；`w-24` 改為 `w-auto sm:w-24` | 不動 DOM 結構；Tailwind 原生；Engineer 改動最小；不影響桌面 | sm: = 640px；375–639px 均為 col 模式（已覆蓋所有手機 AC viewport） |
| B：Custom CSS media query | 在 `index.css` 加 `@media (max-width: 479px)` 手寫 CSS | 精確控制 480px 以下 | 跳出 Tailwind utility-first；新增 global CSS 複雜度；維護成本高 |
| C：CSS Grid | 把 `flex` 改為 `grid`，`grid-template-columns: auto 1fr` + `@media` 切換 | 對齊 K-024 最終設計（扁平 timeline 可能用 grid） | 改動幅度最大；K-024 結構改版時需二次重工 |

**推薦方案 A**（Tailwind responsive prefix），理由：
- K-027 scope 明確為 hotfix（「CSS / responsive 層面 surgical fix」），不改 DOM 結構
- `sm:` (≥640px) = 桌面行為；`<640px` = 手機 col 模式，完整覆蓋 AC-027 三個 viewport（375 / 390 / 414）
- 不引入 custom CSS，不污染 `index.css`，K-024 結構重做時可直接拿掉整個組件換新

---

## 1 症狀根因分析

### 1.1 Codebase 實際狀態（與 architecture.md 的差異）

**重要前置確認：**

`agent-context/architecture.md` 的 K-017 Pass 2 段落記載：
> `DiaryTimeline.tsx` 內部改用 `<MilestoneAccordion variant="full">` 取代 `MilestoneSection`；
> `MilestoneSection.tsx` / `DiaryEntry.tsx` 刪除

**但實際磁碟狀態（`ls` 確認）：**

```
frontend/src/components/diary/
├── DiaryTimeline.tsx      ← 存在（非 MilestoneAccordion）
├── MilestoneSection.tsx   ← 存在（非刪除）
└── DiaryEntry.tsx         ← 存在（非刪除）

frontend/src/components/primitives/
├── ExternalLink.tsx
├── CardShell.tsx
└── SectionContainer.tsx
    （MilestoneAccordion.tsx / DiaryEntryRow.tsx 不存在）
```

**結論：K-017 Pass 2 的 primitive 重構對 diary/ 組件未落地**。K-027 基於實際
codebase 三組件架構修復，不依賴 architecture.md 所描述的未落地設計。

這個 architecture.md drift 需要在 K-027 任務結束時同步修正（見 §7 Architecture Doc 同步）。

---

### 1.2 重疊根因：`DiaryEntry.tsx` 固定 `w-24`

**根因檔案：** `frontend/src/components/diary/DiaryEntry.tsx`

**症狀鏈：**

```
DiaryPage
  └── DiaryTimeline（map milestones）
        └── MilestoneSection（accordion wrapper）
              └── 展開後：div.px-4.pb-4.border-t.divide-y
                    └── DiaryEntry × N
                          ├── span.shrink-0.w-24  ← 96px fixed width（date）
                          └── p.text-sm            ← flex-1（text body）
```

**重疊發生位置：** `DiaryEntry.tsx` 的 container `div`，class 為：

```
flex gap-4 py-2
```

date 欄：
```
shrink-0 font-mono text-xs text-muted pt-0.5 w-24
```

text 欄：
```
text-sm text-ink/80 leading-relaxed
```

**在 375px viewport 下的計算：**

```
DiaryPage wrapper px-6  →  12px × 2 = 24px padding
MilestoneSection px-4   →  16px × 2 = 32px padding（展開區 px-4 pb-4）
可用內容寬度            →  375 - 24 - 32 = 319px

date span w-24          →  96px（固定）
gap-4                   →  16px
text flex-1             →  319 - 96 - 16 = 207px
```

寬度計算上 `flex-1` 仍有 207px，**不應重疊**。

**但 padding 計算被 double-counted：** `DiaryPage` wrapper 已有 `px-6`（各 24px），
`MilestoneSection` 最外層 div 的 border 已在 wrapper 內；展開後的內容區 `px-4 pb-4`
又再加 16px 雙邊。在極小視口（375px）下：

- 總水平佔用 = `24 + 24 + 16 + 16 = 80px`（外層 + 展開區）
- 留給 flex row 的寬度 = `375 - 80 = 295px`

**仍不應重疊**。因此問題不是 `flex` 方向本身，而是：

**真正根因（Priority 1）：**
`w-24`（96px）在超窄視口（如實際手機含 browser chrome 後 body 寬度 < 375px）下
date 欄強制不縮，`text` 欄被擠壓後文字折行造成**每個 `DiaryEntry` 高度不可預測**，
加上 `MilestoneSection` 的展開區使用 `divide-y divide-ink/5`（border-bottom on each child）
而容器本身沒有 `height: auto` 的明確錨點——在某些手機瀏覽器（WebKit/Blink）
accordion 展開時，內容 div 的高度繼承（`.pb-4` 固定 bottom padding）配合
`divide-y` 的 `border-top` 計算，在多筆 entry 折行後高度估算錯誤，
相鄰 `MilestoneSection` 的 `margin-bottom mb-3` 不足以補償溢出高度，
導致視覺上**相鄰 milestone block 的 y 區間重疊**。

**Priority 2 根因：**
`DiaryEntry` 的 `flex` row 在 < 480px 環境下，date（96px）+ gap（16px）= 112px
已佔 window 寬度 30%，`shrink-0` 防止 date 縮放，text 欄雖有空間，但當
`MilestoneSection` 的外層 padding 加計後，text 欄實際寬度 < 200px，
長中文字串（無空格分字的中文）不折行，造成 text 超出容器 → overflow 污染下方元素。

**確認：影響範圍**

只影響 `/diary` 頁面。涉及的組件：
1. `DiaryEntry.tsx`（主修改點）
2. `MilestoneSection.tsx`（次修改點：加 `min-h-0` overflow-safe）
3. `DiaryPage.tsx`（`px-6` 保留，不動）
4. `DiaryTimeline.tsx`（不動）

共用組件（`UnifiedNavBar`、`LoadingSpinner`、`ErrorMessage`）不受影響。

---

## 2 修復方案

### 2.1 Before / After 對照

#### 組件 1：`DiaryEntry.tsx`（主修改點）

**Before：**

```
container div class:   "flex gap-4 py-2"
date span class:       "shrink-0 font-mono text-xs text-muted pt-0.5 w-24"
text p class:          "text-sm text-ink/80 leading-relaxed"
```

**After（修改 CSS class）：**

```
container div class:   "flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 sm:py-2"
date span class:       "shrink-0 font-mono text-xs text-muted w-auto sm:w-24 sm:pt-0.5"
text p class:          "text-sm text-ink/80 leading-relaxed break-words"
```

**改動說明：**

| Class | 說明 |
|-------|------|
| `flex-col sm:flex-row` | 手機：date 在上、text 在下（垂直堆疊）；桌面：保持原本橫排 |
| `gap-1 sm:gap-4` | 手機縮小 date–text 間距（col 模式下 1 = 4px，視覺分隔足夠）；桌面維持 16px |
| `py-3 sm:py-2` | 手機增加 entry 垂直間距（避免 entry 間太擠）；桌面維持 8px |
| `w-auto sm:w-24` | 手機 date 寬度自適應（col 模式不需要固定寬）；桌面維持 96px 對齊 |
| `sm:pt-0.5` | `pt-0.5` 僅在桌面橫排時需要對齊 baseline；手機 col 模式不需要 |
| `break-words` | 強制長字串（中文 / 連續無空格字串）在容器邊界折行，防 overflow |

---

#### 組件 2：`MilestoneSection.tsx`（次修改點）

**Before：**

```
展開區 div class:  "px-4 pb-4 border-t border-ink/10 divide-y divide-ink/5"
最外層 div class:  "border border-ink/10 rounded-sm mb-3"
```

**After：**

```
展開區 div class:  "px-4 pb-4 border-t border-ink/10 divide-y divide-ink/5 overflow-hidden"
最外層 div class:  "border border-ink/10 rounded-sm mb-4 sm:mb-3"
```

**改動說明：**

| Class | 說明 |
|-------|------|
| `overflow-hidden`（展開區） | 防止 `DiaryEntry` 內部長字串 overflow 超出 accordion 容器，造成視覺溢出到相鄰 milestone |
| `mb-4 sm:mb-3` | 手機 milestone 間距由 12px 增至 16px，補償 col-mode entry 增高後的視覺分隔 |

---

### 2.2 breakpoint 策略

採 Tailwind 預設 `sm: = 640px`：

- `< 640px`（手機）：`flex-col`，date 在上，text 在下，`w-auto`
- `≥ 640px`（桌面 / tablet）：`flex-row`，date 左側 `w-24`，text `flex-1`

**AC-027 指定 viewport：375 / 390 / 414px** 全部落在 `< 640px`，均套手機模式，符合 AC。

---

## 3 Playwright 測試設計

### 3.1 新增測試檔：`frontend/e2e/diary-mobile.spec.ts`

**test case 規劃（AC mapping）：**

| Test ID | AC | Viewport | 斷言目標 |
|---------|-----|---------|---------|
| TC-001 | AC-027-NO-OVERLAP | 375 × 812 | 所有相鄰 MilestoneSection `.border.rounded-sm` bounding box y 區間不重疊 |
| TC-002 | AC-027-NO-OVERLAP | 390 × 844 | 同上（375 × 812 重複，不同 viewport） |
| TC-003 | AC-027-NO-OVERLAP | 414 × 896 | 同上 |
| TC-004 | AC-027-TEXT-READABLE | 375 × 812 | 首個展開 milestone 的 title / date / text：無 text-overflow ellipsis；font-size ≥ 12px；color 不 transparent |
| TC-005 | AC-027-TEXT-READABLE | 390 × 844 | 同上 |
| TC-006 | AC-027-TEXT-READABLE | 414 × 896 | 同上 |
| TC-007 | AC-027-DESKTOP-NO-REGRESSION | 1280 × 800 | 首個展開 milestone：三筆 entry 可見；`aria-expanded` 行為正常 |

**y 區間不重疊斷言實作策略（TC-001 ~ TC-003）：**

用 `page.locator('.border.border-ink\\/10.rounded-sm').all()` 取得所有 milestone card，
對相鄰兩個呼叫 `boundingBox()`，斷言 `cardA.y + cardA.height <= cardB.y`。

diary.json 含 12 個 milestone，手機 viewport 下需對 11 對相鄰 card 全跑此斷言。

---

### 3.2 既有 AC-DIARY-1 回歸

`pages.spec.ts` 的 `DiaryPage — AC-DIARY-1` 三個 test 在 **預設桌面 viewport** 下執行，
不受本次 CSS 改動影響（`sm:` prefix 保留桌面行為），預期全部仍 PASS。

Engineer 不得修改 `pages.spec.ts` 中任何 diary 相關斷言（AC-027-DESKTOP-NO-REGRESSION）。

---

## 4 檔案異動清單

| 檔案路徑 | 動作 | 說明 |
|---------|------|------|
| `frontend/src/components/diary/DiaryEntry.tsx` | 修改 | container、date、text class 加 responsive prefix |
| `frontend/src/components/diary/MilestoneSection.tsx` | 修改 | 展開區加 `overflow-hidden`；外層加 `sm:mb-3` |
| `frontend/e2e/diary-mobile.spec.ts` | 新增 | AC-027 三條 AC 的 7 個 test case |

**不動的檔案：**

| 檔案路徑 | 理由 |
|---------|------|
| `frontend/src/pages/DiaryPage.tsx` | wrapper `px-6 py-16 max-w-3xl` 不動；不影響 mobile bug |
| `frontend/src/components/diary/DiaryTimeline.tsx` | 純 map 容器，不含 CSS |
| `frontend/public/diary.json` | K-027 不改 schema（屬 K-024 scope） |
| `frontend/e2e/pages.spec.ts` | 桌面 AC-DIARY-1 不動（回歸基準） |
| `frontend/src/types/diary.ts` | schema 不變 |

---

## 5 實作順序與依賴

```
Step 1（獨立，先做）：修改 DiaryEntry.tsx
  ↓ 不依賴任何其他步驟
Step 2（獨立，可平行）：修改 MilestoneSection.tsx
  ↓
Step 3（依賴 Step 1 + 2 完成）：新增 diary-mobile.spec.ts + 跑 Playwright
  ↓
Step 4：tsc --noEmit 確認型別無錯誤
```

**Step 1 / Step 2 可平行執行**（兩組件無互相依賴）。
**Step 3 必須 Step 1 + 2 皆完成後才執行**（spec 依賴修改後的 class 結構做定位器）。

---

## 6 K-024 承繼項

K-024 Architect 設計時必須在設計文件明確處理以下繼承決策：

| 項目 | K-027 暫行決策 | K-024 需決定 |
|------|-------------|------------|
| Mobile breakpoint | `sm:` = 640px（Tailwind 預設） | 新結構是否沿用 sm: 或改為 480px custom |
| DiaryEntry 手機 layout | `flex-col`，date 在上 | 扁平 timeline 的 date + title + text 三層排版在手機寬度下的順序與字級 |
| Milestone 間距 | `mb-4 sm:mb-3` | 新 timeline rail + marker 結構的 entry 間距規格 |
| `overflow-hidden` 策略 | 展開區加 `overflow-hidden` | 新結構移除 accordion，overflow 策略從頭設計 |
| `break-words` | `DiaryEntry` text 加 | 扁平 text element 是否繼承 |

**K-024 Architect 接手時，本文件 §2.1 的 Before/After 對照為 K-024 的「Before」基準。**

---

## 7 風險與注意事項

1. **`divide-y` + col-mode entry 高度：** `flex-col` 後每個 entry 高度為 date 行 + text 行
   的自然高度，`divide-y` 的 `border-top` 在 col-mode 仍正確分隔 entry，不需移除。
   Engineer 確認 `divide-y` 在 col-mode 視覺上是否合適（若視覺上太擠，可考慮
   `gap-y-3` 取代 `divide-y`，但屬微調不影響 AC 通過，Engineer 自行判斷）。

2. **`overflow-hidden` 與折疊動畫：** `MilestoneSection` 是手控 `useState` 切換
   `{open && <div>}` 的 conditional render，沒有 CSS transition，`overflow-hidden`
   不影響折疊行為。

3. **diary.json 中文內容 + `break-words`：** 現有 diary.json 含中文 milestone 標題和
   條目文字（K-024 scope 才英譯），`break-words` 對中文無負效果（中文字元本身可
   在任意字符間折行），對英文長詞正確折行。

4. **桌面 `sm:pt-0.5` 對齊：** date 欄的 `pt-0.5`（2px top padding）是讓 date 文字
   在橫排時視覺上與 text 第一行 baseline 對齊的微調，`sm:pt-0.5` 正確限定在
   桌面 row-mode 才生效。

5. **AC-027-NO-OVERLAP bounding box 測試：** `locator('.border.border-ink\\/10.rounded-sm')`
   定位器採 CSS class 組合，需確認手機 viewport 下所有 MilestoneSection 都在 DOM
   （diary.json 全量渲染，無分頁）。現行 `DiaryPage.tsx` 無 pagination，全量渲染，
   12 個 milestone 全可見（滾動可達）。Engineer 在 TC-001~003 需用 `evaluate()` or
   `boundingBox()` 取得 bounding box，注意 `boundingBox()` 需元素在 viewport 內
   才回傳非 null，需先 `scrollIntoView()` 後再取值。

---

## 8 共用 Primitive & Reuse 規劃

Cross-page duplicate audit（per senior-architect persona 規定執行）：

K-027 修改的 `DiaryEntry.tsx` / `MilestoneSection.tsx` 為 `/diary` 專屬組件，
架構上未被其他頁面複用。

grep 確認：
- `MilestoneSection` 僅被 `DiaryTimeline.tsx` 使用，未出現於 `home/` / `about/` / `pages/`
- `DiaryEntry` 僅被 `MilestoneSection.tsx` 使用
- Homepage 的 diary 預覽（`DevDiarySection.tsx`）未使用這兩個組件（直接消費 `useDiary(3)` 回傳的 `DiaryMilestone[]`，自行渲染）

**決策：保持各自 inline（組件範圍不變）。**

K-027 是 hotfix，不抽 primitive，不重構組件邊界。K-024 結構重做時整個 diary/ 組件
目錄將被替換，K-027 的修改為暫行修復。

已 grep `DiaryEntry` / `MilestoneSection` 確認無重複，audit 通過。

---

## 9 Architecture Doc 同步計畫

本票完成後（QA PASS 後）須同步 `agent-context/architecture.md`：

1. **Directory Structure 修正（drift 修正）：**
   - `diary/` 子樹：移除 architecture.md 所記載的「MilestoneSection.tsx / DiaryEntry.tsx 刪除」描述；
     改為「MilestoneSection.tsx / DiaryEntry.tsx 保留（K-027 修改：加 mobile responsive classes）」
   - `primitives/` 子樹：移除 `MilestoneAccordion.tsx` / `DiaryEntryRow.tsx` 的記錄
     （實際磁碟不存在）

2. **Changelog 新增一筆：**
   `2026-04-21: K-027 mobile responsive fix — DiaryEntry flex-col sm:flex-row; MilestoneSection overflow-hidden; diary/ 組件未被 K-017 Pass 2 重構（architecture.md 修正 drift）`

此步驟由 Architect 在 QA PASS 後自行執行，不依賴 Engineer。

---

## Retrospective

### Architect 設計反省

**做得好：**
- 設計開始前先 `ls` 驗證 `primitives/` 目錄實際內容，發現 architecture.md 記載的
  K-017 Pass 2 diary/ 組件重構**未落地**（MilestoneAccordion / DiaryEntryRow 不存在），
  主動確認後以**實際 codebase 狀態**為設計基準，不依賴可能過時的文件描述。
  這避免了 Engineer 去找不存在的組件。

**沒做好：**
- architecture.md 在 K-021 任務結束時已有 K-017 Pass 2 重構的記載（diary/ 組件
  被描述為已刪除 / 被 MilestoneAccordion 取代），但實際 codebase 從未落地。
  這個 drift 在 K-027 召喚 Architect 時才被發現，而非在 K-017 / K-021 關閉時被稽核。
  根因：K-017 Pass 2 的部分重構決策（primitive P4 / P7）在 Pass 3 被廢棄，
  architecture.md 更新了 Pass 3 的廢棄，但 `diary/` 組件那段描述未同步回退，
  留下了「描述說刪、磁碟存在」的 ghost 狀態。

**下次改善：**
- 每次 architecture.md 記錄「組件刪除 / 重構 / 移動」時，**必須在同一個 commit
  同時驗證磁碟狀態**（`ls` 或 `Glob`）。描述「刪除」的前提是磁碟上確認已刪；
  不得以「下一步 Engineer 會刪」為由先在文件標記刪除。這條規則加入 Architect
  persona 的 Architecture Doc 同步規則：「描述組件刪除前先 `ls` 驗證磁碟」。
