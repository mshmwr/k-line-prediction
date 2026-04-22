---
id: K-020
title: GA4 SPA Pageview E2E — Link click → route change → pageview + HTTP beacon 驗證
status: ready-for-architect
type: test
priority: medium
size: M
created: 2026-04-19
updated: 2026-04-22
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-020
---

## 背景

K-018 GA4 Tracking 的 E2E 測試僅驗證 `goto(url)` 初始頁面載入觸發的 pageview 事件。但 SPA 路由切換（用戶點擊 NavBar Link → React Router navigate → `useGAPageview` hook 的 `useEffect` 對 `location.pathname` reactive → `trackPageview` 呼叫）是另一條完全不同的程式碼路徑，目前未被 Playwright 覆蓋。

K-018 Code Reviewer S1 點出此缺口，PM 裁決為 follow-up ticket。

**2026-04-21 scope 擴充 — K-018 production bug 揭露的結構性缺口：**
K-018 上線後 GA4 real-time 顯示 0 users，根因是 `window.gtag = function (...args) { dataLayer.push(args) }`（spread Array）實際上被 gtag.js 忽略——gtag.js 以 Arguments object 與 Array 的差異辨別 gtag 指令與 GTM event。E2E 整組 pass 卻沒抓到此 bug，因為 mock 以 `addInitScript` 覆蓋 `window.gtag` 時，production `initGA()` 隨即在 `main.tsx` 初始化階段又把它覆寫回去；現有斷言 `entry[0]`/`entry[1]` 剛好對 Array 與 Arguments 兩種 shape 都成立，因此完全錯過 shape mismatch。此 ticket 擴充 scope，加入 HTTP beacon 斷言，確保未來 helper 內部實作改動不會讓整組測試在真實 GA4 pipeline 失效。

**2026-04-22 PM re-plan + BQ resolution：**
- 修正 AC-020-SPA-NAV 措辭錯誤：原稿「dataLayer 含 `{ event: 'page_view', page_location }`」是 **GTM dataLayer 格式**，不是 gtag.js Arguments 格式；生產程式 `window.dataLayer.push(arguments)` 塞入的是 Arguments object（index 0 = `'event'`、index 1 = `'page_view'`、index 2 = `{page_location, page_title}`）。
- 拆 2 Phases：P1 = SPA-NAV dataLayer 斷言；P2 = BEACON 真實 HTTP 驗證（採攔截模式，見 §BQ Resolution）。
- 原 AC-020-SPY-PATTERN 為實作細節不適合作 AC，改為 Architect BQ。
- 路徑修正：ticket 背景提到 `frontend/src/ga/*` — 實際 helper 在 `frontend/src/utils/analytics.ts`、hook 在 `frontend/src/hooks/useGAPageview.ts`。
- BQ-1 / QA #5 / QA #6 / QA #7 / QA #15 皆已裁決（見 §BQ Resolution），AC 依裁決重寫。

## 目標

- 驗證 SPA Link click（NavBar 或 BuiltByAIBanner CTA）後，`useGAPageview` 在新路由 render 時觸發 pageview 事件
- 覆蓋「click → React Router navigate → `useEffect` on `location.pathname` → `trackPageview` → `window.gtag('event', 'page_view', ...)`」完整時序
- 讓 ga-tracking 測試組對 production GA4 pipeline（gtag.js → `/g/collect` endpoint）具備 end-to-end 驗證能力，非僅 helper 層 shape 斷言
- 透過 `page.route()` 攔截模式，讓 CI 在無出站網路情況下仍能完整驗證 beacon 送出

## 範圍

**含：**
- Playwright E2E：至少一條 SPA navigate 場景（`/` → NavBar About → `/about`），驗證 navigate 後 `window.dataLayer` 有對應新路由的 pageview entry（Arguments-object shape）
- 採用 `waitForURL` / `waitForFunction` 取代 `waitForTimeout`
- HTTP beacon 斷言：使用 `page.route('**/g/collect*', ...)` 攔截送往 `google-analytics.com` 的 beacon 請求，斷言 URL + query string 包含 GA4 Measurement Protocol 必備欄位（見 AC-020-BEACON-PAYLOAD）
- 負面測試：query-only / hash-only / same-route navigation 不得觸發額外 beacon
- 現有 `ga-tracking.spec.ts` mock 策略由 Architect 設計後 Engineer 重構

**不含：**
- GA4 Admin Console 驗證
- 多層 SPA navigate 鏈的壓力測試（例如 `/` → `/about` → `/diary` → `/`）
- 完整離線 GA4 endpoint response stubbing（攔截只需 `route.fulfill({status: 204})` 終止請求）
- CI/CD pipeline 建置（K-019 範圍）
- `page_location` 送 pathname 而非 full URL 的 pre-existing bug 修復（另開 [K-032](K-032-ga-page-location-full-url.md)）

## Phases

**Phase 1 — SPA-NAV（dataLayer 斷言）**
- 覆蓋 AC-020-SPA-NAV
- 斷言 dataLayer entry（不斷言 beacon），但仍註冊 context-level `context.route('**/g/collect*', route => route.fulfill({status: 204}))` 攔截器；此舉避免 CI 無 egress 時 gtag.js 真實送出 beacon 失敗噴 network error 汙染測試報告。業界慣例（見 `FE/playwright-block-analytics.md`，若 KB 已 compile）統一在 context level 攔截，per-test 只負責斷言或不斷言
- 失敗模式：若 `useGAPageview` 被移除或 `useEffect` 依賴陣列錯誤，此 Phase 應 fail

**Phase 2 — BEACON（Playwright route intercept 斷言）**
- 覆蓋 AC-020-BEACON-INITIAL、AC-020-BEACON-SPA、AC-020-BEACON-PAYLOAD、AC-020-BEACON-COUNT
- 使用 `page.route('**/g/collect*', route => { record(route.request()); route.fulfill({status: 204}); })`
- **不需** 出站網路；CI-agnostic
- 失敗模式：若 gtag call format 錯誤導致 beacon 未送出（K-018 class bug），攔截器收不到 request → 測試 fail

**Phase 3 — Negative tests（行為鎖死）**
- 覆蓋 AC-020-NEG-QUERY、AC-020-NEG-HASH、AC-020-NEG-SAMEROUTE
- 攔截器記錄全部 `/g/collect` request，斷言特定操作後 beacon count **不變**
- 鎖死目前 `[location.pathname]` deps 行為；未來改成 query/hash 敏感需另開 ticket + 改 AC

## AC

**AC-020-SPA-NAV：** SPA Link click 觸發 dataLayer pageview entry（Phase 1）
- **Given**：用戶在 `/` 頁面，`VITE_GA_MEASUREMENT_ID='G-TESTID0000'`（playwright.config.ts 已設定），`window.dataLayer` 已由 production `initGA()` 初始化
- **When**：用戶點擊 NavBar 的 `About` Link（不是 `page.goto('/about')`），觸發 React Router SPA navigate
- **Then**：Playwright 透過 `page.waitForURL(/\/about$/)` 確認 URL 切換完成，並透過 `waitForFunction` 確認 `window.dataLayer` 中存在 Arguments-object entry 滿足：entry[0] === 'event' AND entry[1] === 'page_view' AND entry[2].page_location === '/about'
- **And**：該 entry 必須在點擊動作之後產生，不得混淆初始 `/` load 時的 pageview（測試必須記錄 click 前 `dataLayer.length`，斷言 click 後 length 嚴格增加且新 entry 指向 `/about`）
- **And**：測試無 `waitForTimeout`，改以 `waitForURL` + `waitForFunction` 同步
- **And**：至少 2 個獨立 Playwright test case — 一個覆蓋 NavBar Link（`/` → `/about`），另一個覆蓋 BuiltByAIBanner CTA（`/` → `/about`，不同 DOM 進入點）；每個 case 獨立 spec（不可合併）

**AC-020-BEACON-INITIAL：** 初始 page load 發出 pageview beacon（Phase 2）
- **Given**：`VITE_GA_MEASUREMENT_ID='G-TESTID0000'`，`page.route('**/g/collect*', ...)` 已在 test 開始前註冊攔截器，攔截器 `route.fulfill({status: 204})` 終止 request 且將 `route.request()` 收集至 per-test array
- **When**：用戶 `page.goto('/about')` 觸發初始 pageview
- **Then**：攔截器在 5 秒 timeout 內收到至少 1 個 `/g/collect` request
- **And**：該 request host 必須是 `www.google-analytics.com`（或 `google-analytics.com`）
- **And**：測試失敗時必須 throw（不得 `test.skip()` 或 try-catch 吞掉），使 beacon 未送出問題立即可見

**AC-020-BEACON-SPA：** SPA navigate 發出新的 pageview beacon（Phase 2 — K-018 class bug 主守門）
- **Given**：攔截器已註冊並記錄初始 `/` load 收到的 beacon 清單為 `initialBeacons`
- **When**：用戶點擊 NavBar `About` Link 觸發 SPA navigate 到 `/about`
- **Then**：`page.waitForURL(/\/about$/)` 後，攔截器在 5 秒 timeout 內收到至少 1 個**新**的 `/g/collect` request（`beacons.length > initialBeacons.length`）
- **And**：新 request 的 path key（`dl` 或 `dp`，由 Architect dry-run 確認 GA4 Measurement Protocol v2 實際使用的 key name）必須 urlDecode 後包含 `/about`
- **And**：至少 1 個獨立 Playwright test case

**AC-020-BEACON-PAYLOAD：** beacon query string pin 必備欄位（Phase 2）
- **Given**：攔截器已捕捉到一個 pageview beacon request（由 AC-020-BEACON-INITIAL 或 AC-020-BEACON-SPA 提供）
- **When**：測試讀取 `request.url()` 並 parse query string
- **Then**：query string 必須包含：`v=2` AND `tid=G-TESTID0000` AND `en=page_view`
- **And**：path key（Architect dry-run 決定 `dl` 或 `dp`）必須存在且 urlDecode 後對應當前路由
- **And**：Architect 在 design doc §Dry-run 段記錄 local 實測 GA4 Measurement Protocol v2 payload 的實際 key name（`dl` vs `dp`），並在 AC 實作時固化

**AC-020-BEACON-COUNT：** 每次 pageview 恰好 1 個 beacon（Phase 2）
- **Given**：攔截器已註冊並清空 beacon array
- **When**：用戶完成 1 次 pageview 動作（初始 load 或 SPA navigate）
- **Then**：該次動作完成後 1 秒內，攔截器收到的 `/g/collect` request count 恰為 1（不得為 0 或 ≥2）
- **And**：此 AC 防 StrictMode 雙重 invoke 或未來 duplicate call site 造成的 beacon 重複送出

**AC-020-NEG-QUERY：** query-only 變化不觸發 pageview（Phase 3）
- **Given**：用戶在 `/?x=1`，攔截器記錄此時 beacon count 為 N
- **When**：URL 變成 `/?x=2`（query 改變，pathname 不變；以 `page.goto` 或 router `navigate` 觸發）
- **Then**：等待 500ms 後，攔截器 beacon count 必須仍為 N（不增加）
- **And**：此 AC 將 `useGAPageview` 目前的 `[location.pathname]` deps 行為鎖死；未來若要求 query 變化觸發 pageview，需改 AC + 程式碼 + 開新 ticket

**AC-020-NEG-HASH：** hash-only 變化不觸發 pageview（Phase 3）
- **Given**：用戶在 `/about`，攔截器記錄此時 beacon count 為 N
- **When**：URL 變成 `/about#team`（hash 改變，pathname 不變）
- **Then**：等待 500ms 後，攔截器 beacon count 必須仍為 N

**AC-020-NEG-SAMEROUTE：** click 當前路由 Link 不觸發 pageview（Phase 3）
- **Given**：用戶已在 `/about`，攔截器記錄此時 beacon count 為 N
- **When**：用戶再次點擊 NavBar 的 `About` Link
- **Then**：等待 500ms 後，攔截器 beacon count 必須仍為 N

## BQ Resolution（2026-04-22 PM 裁決）

**BQ-1 — CI network egress policy：** ✅ **Option B（Playwright route intercept）**
- 決策：AC-020-BEACON 系列全部採 `page.route('**/g/collect*', ...)` 攔截模式，`route.fulfill({status: 204})` 終止 request
- 理由：抓得到 K-018 class bug（call format 錯 → request 未送出 → 攔截器收不到 → test fail）；CI-agnostic（不需出站）；穩定（不依賴 Google server 可用性）
- 副作用：測試不驗 GA server 是否實際接收；此責任不屬前端測試

**BQ-2 — Mock 策略（spy vs replace）：** ✅ **Option A（移除 addInitScript mock，直接觀察 production dataLayer）**
- 理由：production 真實執行路徑 = Arguments-object push；測試直接驗此 shape 最貼近 K-018 retro 教訓（mock/production override 順序會失控）

**BQ-3 — beacon SPA race condition：** ✅ **delta 對比（攔截器 array 記錄前後 snapshot）**
- 由 AC-020-BEACON-SPA 的 `beacons.length > initialBeacons.length` 斷言 + path key 含 `/about` 雙重確認
- 不依賴 `waitForRequest` 時序

**QA Challenge #5 — payload keys unpinned：** ✅ **已加入 AC-020-BEACON-PAYLOAD**
- 必驗 `v=2` + `tid=G-TESTID0000` + `en=page_view` + path key（dry-run 確認 `dl` vs `dp`）

**QA Challenge #6 — SPA → beacon cross-verify：** ✅ **已加入 AC-020-BEACON-SPA**
- 不再 defer；此為 K-018 class bug 的核心守門 AC

**QA Challenge #7 — same-route / query-only / hash-only navigation：** ✅ **Option A（維持現狀 + negative tests 鎖死行為）**
- 已加入 AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE
- 理由：專案現無 query-driven 頁面；用 negative test 把行為鎖死，未來真要改再開 ticket + 改 AC

**QA Challenge #15 — `page_location` 送 pathname 非 full URL 是 pre-existing bug：** ✅ **Option Y（另開 [K-032](K-032-ga-page-location-full-url.md) 追）**
- 本 ticket scope 為測試硬化，不混修 production bug
- AC 文字維持 `page_location === '/about'` 反映 **目前行為**；K-032 上線時會同步改 AC

## Architect Non-Blocking Considerations（design doc 須處理）

這些是 QA Early Consultation 提出的非 blocking 建議，Architect 在 design doc 中必須明確說明處理方式（實作 / 延後 / 拒絕 + 理由）：

- **QA #10 — `page.route()` cleanup on failure：** 路由攔截器應在 test body 內註冊（非 `beforeAll`），依 Playwright page fixture teardown 自動清理；若跨 test 共用，須在 `afterEach` 明確呼叫 `page.unroute()`。Architect 在 design doc §Test Scaffold 定案
- **QA #8 — back/forward browser navigation：** 目前 `useGAPageview` `[location.pathname]` deps 理論上 popstate 會觸發；Architect 評估是否加 positive test 覆蓋此路徑
- **QA #9 — rapid navigation race：** A→B→C 連續 <100ms 切換的 beacon count 是否穩定；Architect 決定是否加 stress test 或 defer
- **QA #13 — programmatic navigate：** 除 Link click 外，`useNavigate()` 觸發的 route change 是否需獨立 AC；目前 AC-020-SPA-NAV 僅覆蓋 Link click
- **QA #14 — 測試 matrix 去重：** ❌ **拒絕**。NavBar Link + BuiltByAIBanner CTA target 相同（`/about`）是**刻意控制變因**——固定 target 只驗不同 entry point（NavBar `<a>` 在 header vs BuiltByAIBanner `<a>` 在首頁 banner）的事件傳播路徑。若一個改成 `/diary` 會混淆「entry point 差異」與「target 差異」兩個維度，測試 fail 時無法定位到哪個變因壞掉。若要驗不同 target 行為應另開 test，不得替代這兩個

## 相依

- K-018 已關閉（fix commit `6a9d6cd`）
- K-019（Release Versioning & CI/CD）— BQ-1 採 Option B（route intercept）後 **不再依賴** K-019 policy 決議
- K-032（page_location full URL bug）— 與本 ticket 平行進行；不阻塞本 ticket

## Known Gap 轉入本 ticket

K-018 `## 最終關閉記錄` 列出的 follow-up：「E2E 僅驗證 `window.gtag` 呼叫參數，未驗證 `/g/collect` HTTP beacon」→ 由 AC-020-BEACON-* 系列覆蓋。

## Release Status

**2026-04-22 PM Phase Gate：**

- [x] AC 全部為 Given/When/Then/And 四段格式
- [x] Parallel Given quantification：各 AC test case 數量明示
- [x] 路由/檔案路徑驗證：
  - `frontend/src/utils/analytics.ts` ✓（`initGA` + `trackPageview` + `trackCtaClick`）
  - `frontend/src/hooks/useGAPageview.ts` ✓（`useEffect` on `location.pathname`）
  - `frontend/e2e/ga-tracking.spec.ts` ✓（現有 K-018 spec）
  - `frontend/playwright.config.ts` ✓（`VITE_GA_MEASUREMENT_ID='G-TESTID0000'`）
- [x] Testid/selector：NavBar `About` Link 文字選擇器 + `a[aria-label="About the AI collaboration behind this project"]`（BuiltByAIBanner，`ga-tracking.spec.ts:166` 已驗證）
- [x] AC CSS wording check：N/A（無視覺 AC）
- [x] QA Early Consultation — Agent(qa) 實跑 2026-04-22（見 `docs/retrospectives/qa.md`），raised 15 challenges；3 blocking 由 PM 裁決後寫回 AC，11 non-blocking 交 Architect 處理
- [x] BQ-1 / QA #5 / QA #6 / QA #7 / QA #15 — 使用者裁決完成（見 §BQ Resolution）
- [x] **PM session capability**：Agent tool 可用，Agent(qa) 已實跑；Architect 召喚待使用者指示

**Ready for Architect handoff（待使用者放行）。**

## Retrospective

<!-- 各角色完成後 append 反省段 -->
