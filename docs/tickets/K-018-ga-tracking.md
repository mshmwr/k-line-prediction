---
id: K-018
title: GA4 Tracking — 訪客追蹤 + 點擊事件
status: closed
type: feat
priority: medium
size: S
created: 2026-04-19
closed: 2026-04-21
---

## 背景

K-Line Prediction 已部署於 Firebase Hosting，目前沒有任何訪客分析工具。K-017 正在強化 `/about` 頁的 portfolio 呈現，recruiter 造訪行為需要可觀測性。加入 GA4 追蹤可以確認 recruiter 是否到達、停留哪些頁面、點了哪些 CTA。

## 目標

- 記錄訪客進入哪個頁面（pageview）
- 追蹤招聘者最可能互動的關鍵 CTA 點擊（custom event）
- 不蒐集個人識別資訊（PII）
- GA4 測量 ID 從環境變數讀取，不 hardcode 於原始碼

## 範圍

**含：**
- GA4 script snippet 安裝（gtag.js via `@gtag` 或 react-ga4）
- 每個路由的自動 pageview 事件（`/`, `/about`, `/app`, `/diary`）
- `/about` 頁關鍵 CTA 的 custom click event（含 label）：
  - Footer CTA email（`mailto:` 連結）
  - GitHub 連結
  - LinkedIn 連結
  - BuiltByAIBanner "See how →"（首頁）
- 環境變數 `VITE_GA_MEASUREMENT_ID` 注入測量 ID
- Playwright 驗證 GA4 snippet 存在（不驗 network call）
- Footer 加一行 GA4 匿名追蹤聲明文字（取代 Cookie Consent Banner）

**不含：**
- GA4 Admin Console 建立（需使用者自行操作）
- 轉換目標（conversion）/ funnel 設定
- Server-side event 追蹤
- `/business-logic` 密碼頁的行為追蹤（有 auth gate 不適用）

## AC 一覽

- AC-018-INSTALL `[K-018]`
- AC-018-PAGEVIEW `[K-018]`
- AC-018-CLICK `[K-018]`
- AC-018-PRIVACY `[K-018]`
- AC-018-PRIVACY-POLICY `[K-018]`

## 相依 / 協同

- **K-017 完成後，設計師需補更新設計稿**：AC-018-PRIVACY-POLICY 要求 Footer 加 GA4 說明文字，設計稿必須與最終實作對齊。K-017 Engineer 完成後、K-018 Engineer 開始前，召喚設計師將此文字加入 Footer 設計稿。

## PM 裁決

**裁決日期：** 2026-04-19
**來源：** Code Reviewer K-018 review 結果（8 條：W1–W4 / S1–S4）

| ID | 問題 | 裁決 | 理由 |
|----|------|------|------|
| W1 | /app pageview Playwright 斷言缺失 | **立刻修（本票）** | AC-018-PAGEVIEW 明列 4 條路由（`/`、`/about`、`/app`、`/diary`），`/app` 漏斷是 AC 未完整覆蓋，不可留 |
| W2 | click page_location 斷言缺失 | **立刻修（本票）** | AC-018-CLICK 的 And 子句「每個 custom event 額外含 `page_location`」是 AC 的一部分，4 個 click spec 全部缺漏，視為 AC 未通過 |
| W3 | waitForTimeout（banner）CI 不穩 | **立刻修（本票）** | Engineer retro 自己已識別此為暫行方案；用 `waitForNavigation` / `page.on('request')` 取代無時序依賴，修法已知，成本低 |
| W4 | waitForTimeout（pageview）CI 不穩 | **立刻修（本票）** | 同 W3 邏輯，pageview 觸發後等 `waitForTimeout(300)` 屬同類風險，一併修 |
| S1 | SPA pageview 未明確測試 | **follow-up ticket（K-019 SPA Pageview E2E）** | goto() 測的是頁面初始載入 pageview，SPA Link click → route change → pageview 是獨立場景，測試需 intercept navigate，複雜度高，不擴大本票 scope；但場景明確有價值，開 K-019 追蹤 |
| S2 | initGA() 無冪等保護 | **技術債（TD-013）** | 生產環境不受影響（GA4 gtag.js 本身有去重），僅 HMR 開發體驗；記錄即可，不排實作 deadline |
| S3 | dataLayer 型別不精確 | **技術債（TD-013 合入）** | `unknown[]` → `unknown[][]` 是純 DX 改善，不影響行為；與 S2 同類，一同登記 |
| S4 | 未知路由無 console.warn | **技術債（TD-013 合入）** | fallback to `document.title` 屬防禦性 log，非 AC 要求；記錄，待未來 debug 需求升優先級 |

**Engineer 待辦（本票）：** W1、W2、W3、W4 四條修完後重跑 Playwright，全綠才算完成。
**技術債：** S2/S3/S4 合入 TD-013 登記於 `docs/tech-debt.md`。

---

## Retrospective

<!-- 各角色完成後 append 反省段 -->

### Engineer — 2026-04-19

**做得好：** 實作前發現 `BuiltByAIBanner.tsx` 已存在（K-017 已完成），`HomePage.tsx` 也已 import/渲染，節省了不必要的重建工作；所有 11 個 K-018 ga-tracking.spec.ts 測試一次全綠。設計文件 Option A（FooterCtaSection 用原生 `<a>` 取代 ExternalLink）判斷正確，避免修改 primitive。

**沒做好：** `BuiltByAIBanner` CTA click 測試需要攔截 SPA 導航後才能讀 dataLayer，初版沒考慮到 SPA navigate 後 dataLayer 會被新頁面覆寫；透過 `waitForTimeout(100)` 短暫等待解決，但此方法依賴時序，不是最健壯的方案。根因：沒有事先追蹤「SPA Link click → navigate → 新頁面 JS 執行」這整段時序對 dataLayer spy 的影響。

**下次改善：** SPA Link 組件的 GA click event 測試，應用 `page.on('request', ...)` 或 `Promise.race([clickPromise, page.waitForNavigation()])` 的方式捕捉 click 後、navigate 前的狀態，而非用 `waitForTimeout` 假設時序。下次遇到「click 後頁面跳轉」的 GA 追蹤測試，直接採用這個 pattern。

**W1-W4 補修（2026-04-19）：**
- **W1**：補 `/app` 路由 `page_view` test，與 `/`、`/about`、`/diary` 同格式，AC-018-PAGEVIEW 四條路由全覆蓋。
- **W2**：四個 `cta_click` test 全部加 `page_location` 斷言（`toBeDefined()` + `toBe(當前路由)`），AC-018-CLICK And 子句補齊。
- **W3**：`banner_about` 的 `waitForTimeout(100)` 改為 `waitForFunction` 等 `cta_click` 出現在 dataLayer，消除時序依賴。
- **W4**：三個 pageview test 的 `waitForTimeout(300)` 改為 `waitForFunction` 等 `page_view` 出現在 dataLayer，消除時序依賴。
- **驗證**：`ga-tracking.spec.ts` 12/12 全綠；全套 100 tests 99 passed 1 skipped（skipped 為既有）；`npx tsc --noEmit` 零錯誤。

### Reviewer — 2026-04-19

**沒做好：** AC-018-PAGEVIEW 明列 `/app` 路由也需 pageview 測試，但 Engineer 實作的 spec 只覆蓋 `/`、`/about`、`/diary` 三條路由，`/app` 路由缺少對應的 Playwright 斷言，造成 AC 未完整覆蓋。另外 AC-018-CLICK 的 "And 每個 custom event 額外含參數 `page_location`" 條款，所有 click 測試均未斷言 `page_location` 存在，屬於部分 AC 漏覆。這兩個缺口本應在 PM 定 AC 時就把「哪些路由需要測」的清單明確列為驗收條件，或由 Engineer 在實作 spec 前逐條核對 PRD 斷言層級（Then/And 粒度）；Reviewer 是在逐條比對 PRD AC 與 spec 的覆蓋率時才抓到。

**下次改善：** Review E2E spec 時，在比對「測試描述」與「AC 標題」之前，先逐條展開 PRD 的所有 Then/And 子句（不只看 Given/When），對應 spec 內有無斷言。`page_location` 這類「And 每個 event 都要有」的副條件尤其容易只在第一個測試斷言、其餘測試省略。下次把此作為 Review checklist 固定一條。

### QA — 2026-04-19

**做得好：** ga-tracking.spec.ts 12/12 全綠逐一目視確認（AC-018-INSTALL × 1、AC-018-PAGEVIEW × 4、AC-018-CLICK × 4、AC-018-PRIVACY × 1、AC-018-PRIVACY-POLICY × 2），與 ticket AC 清單逐條對齊；`TICKET_ID=K-018` 環境變數本次記得帶，產出正確命名的 `K-018-visual-report.html`（K-017 反省的改善行動已落地）；全套 99 passed / 1 skipped 的 skipped 條目（AC-017-BUILD）屬已知問題，已標注並不 block。

**沒做好：** `waitForFunction` 取代 `waitForTimeout` 的修復屬 E2E 測試穩定性改善，QA 未獨立驗證「舊 `waitForTimeout` 確實存在 flaky 風險」——只依賴 Engineer retro 自述，未在本機執行 CI-like 的 fast repeat（`--repeat-each=10`）確認新版的確不 flaky；AC-018-PAGEVIEW `/business-logic` 路由未追蹤是設計範圍，但 QA 未在 retro 中明記「`/business-logic` 不在追蹤範圍」的理由，後續若有人問 coverage 需要翻 ticket 才能找到依據。

**下次改善：** (1) E2E timeout 改善類修復，QA 須執行 `npx playwright test ga-tracking.spec.ts --repeat-each=5` 驗證穩定性，不全然依賴 Engineer 自述；(2) 「刻意不追蹤」的路由或事件，QA retro 明記「依 ticket 範圍定義排除，理由：xxx」，做為後續 coverage 問題的第一線文件依據。

### PM 彙整

**跨角色重複問題：**
- **AC And 子句覆蓋率不完整（Engineer + Reviewer 共同指出）：** Engineer 未將 `/app` 路由與 `page_location` And 子句轉為獨立 test case；Reviewer 在逐條比對 PRD Then/And 時才抓到。根因一致：AC 列多個並排 Given 或 And 子句時，下游角色（Engineer 實作、Reviewer 審查）沒有「每個 Given/And = 一個獨立 test」的明文量化規範，各自依直覺詮釋覆蓋粒度。

**流程改善決議：**

| 問題 | 負責角色 | 行動 | 更新位置 |
|------|---------|------|---------|
| AC 列多個並排 Given 時未量化對應 test 數量，Engineer 實作粒度不一致 | PM | 放行 Engineer 前補一句「此 AC 對應 Playwright spec 需要 N 個獨立 test case，逐一斷言」 | pm.md（下次 PM 進場時同步落地） |
| AC And 子句含「每個 event 都要有」的副條件，只在第一個 test 斷言、其餘省略 | Reviewer | Review E2E spec 時先展開所有 Then/And 再比對 spec，加入 Review checklist 固定一條 | senior-engineer.md（待授權） |
| E2E timeout 類修復 QA 僅信 Engineer 自述，未跑 `--repeat-each` 獨立驗證穩定性 | QA | E2E 測試穩定性改善類修復，QA 須執行 `--repeat-each=5` 驗證 | qa.md（待授權） |
| 「刻意排除範圍」的路由/事件未在 QA retro 明記排除理由 | QA | QA retro 加固定段「範圍外項目：依 ticket 定義排除，理由：xxx」 | qa.md（待授權） |

---

## 最終關閉記錄 — 2026-04-21

**部署生效：** 建立 GA4 property `K-Line-Prediction`，Measurement ID `G-9JC9YBZTPF`；寫入 `frontend/.env.production`；`npm run build` + `firebase deploy --only hosting` 完成部署到 `k-line-prediction-app.web.app`；GA4 即時頁成功接收 `page_view` 事件，使用者數歸零→1 已驗證。

**部署中發現 runtime bug（closed 前修復）：**

`frontend/src/utils/analytics.ts` 的 `window.gtag` helper 原實作：

```ts
window.gtag = function (...args: unknown[]) {
  window.dataLayer.push(args)  // ← 錯：Array
}
```

gtag.js 會區分 `dataLayer` 內兩種 entry：
- `arguments` 物件 → 當 gtag 指令（js/config/event）處理
- 有 `event` key 的 object → 當 GTM 事件處理

推 Array 不符兩者，gtag.js 全部忽略；導致 `gtag.js` 雖成功載入，但 `event page_view` 從未送出 `/g/collect` beacon。`dataLayer` 檢查可見：

```
[
  ["js", Date],            ← Array，被忽略
  ["config", "G-...", ...],← Array，被忽略
  ["event", "page_view",...],← Array，被忽略
  { event: "gtm.dom" },    ← GTM event，有處理
]
```

修復：改回 Google 官方 snippet 寫法 `dataLayer.push(arguments)`（commit 待補）。

**為何 E2E 沒抓到：**
`ga-tracking.spec.ts` 使用 `page.addInitScript()` 攔截 `window.gtag` 並驗證「呼叫參數」，但並未驗證 gtag.js 內部是否把 dataLayer entry 當 gtag 指令處理、亦未驗證實際送出的 `/g/collect` HTTP request。E2E 通過 = 我方程式有呼叫 `gtag('event', ...)`；E2E 通過 ≠ GA4 真的會收到事件。

**下次改善：** GA4 / 任何第三方 SDK 整合的 E2E，除了驗證 client-side call pattern，必須補一條斷言：`page.waitForRequest(url => url.includes('/g/collect'))` 或等效機制，驗證實際 HTTP beacon 成功離開 client。Ticket 已關閉，改善行動轉為後續 E2E hardening 項目（待開 follow-up ticket 或併入 K-020 SPA pageview E2E 範圍）。
