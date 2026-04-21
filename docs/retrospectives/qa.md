# QA Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 qa agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（哪些回歸測試設計不足 / 邊界沒覆蓋到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 QA 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

<!-- 新條目從此處往上 append -->

## 2026-04-21 — K-030 /app page isolation (final regression)

**做得好：** Pencil v1 `ap001` frame 於本 session 透過直接讀 `frontend/design/homepage-v1.pen` JSON 確認 `fill: #030712`，對照 dev screenshot `/app` wrapper bg 視覺判讀吻合（同時 Playwright T4 已 assert `rgb(3, 7, 18)`）；mcp__pencil 工具不可用時以 .pen JSON 直讀替代，完成 AC-030-PENCIL-ALIGN 視覺比對。主動為 mobile (375px) + tablet (768px) viewport 補 `/app` isolation 驗證（寫入臨時 spec，執行後刪除），補 persona Boundary Sweep viewport 維度；mobile NavBar App link `target=_blank` 亦確認。

**沒做好：** Full Playwright suite `npx playwright test` 跑時 webServer 不帶 `TICKET_ID` 環境變數，`visual-report.ts` fallback 產出 `K-UNKNOWN-visual-report.html` 汙染 `docs/reports/`。QA 驗到尾端才發現並手動 rm + 補跑 `TICKET_ID=K-030 npx playwright test visual-report.ts`。

**下次改善：** 建議於 `frontend/e2e/visual-report.ts` 加 hard gate — `TICKET_ID` 未設時 `throw new Error('TICKET_ID not set')`，不 fallback K-UNKNOWN；或於 QA persona Step 1 改為「必先 export TICKET_ID=K-XXX 再跑 full suite」硬規則。屬 shared tooling，回報 PM 評估另開 TD 票處理。另發現 `frontend/public/diary.json` 存在繁中 milestone 名稱（違反 feedback_diary_json_english），屬 K-021/K-022/K-023 遺留，與本票 scope 無關，僅備註給 PM 參考。

## 2026-04-21 — K-031 /about 移除 Built by AI showcase section

**做得好：** PM 已預先核定 targeted scope（about-v2 + about + pages 三 spec + 2 route 視覺驗證），QA 不盲目跑 full suite；tsc 0 errors + 95 passed / 1 skipped / 0 failed；獨立 visual spec 直接 evaluate document 的 8 個候選 section id，讀到的順序與 Architect 設計文件 §3 File Change List 的 7 SectionContainer 列完全一致（header → metrics → roles → pillars → tickets → architecture → footer-cta）；homepage banner 點擊 → `/about` SPA 導航一起驗；Pencil `.pen` JSON grep 對 `banner-showcase` / `Built by AI` 零命中，與 codebase parity 對齊。

**沒做好：** 依賴 JSON grep 做 Pencil parity（MCP 目前不可用），無法驗視覺層 — 例如若 .pen 裡殘留空白 frame 或 placeholder rect 但移除了文字 label，單純 text grep 會 false-green。本次是純刪除 ticket，風險可接受，但已登 Known Gap。

**下次改善：** 當 Pencil MCP `get_screenshot` 不可用時，QA Pencil parity 檢查應改為：(1) JSON grep 移除項零命中，(2) JSON top-level frame children count 對照設計文件預期 section 數，(3) 明確在 retrospective 宣告「視覺層未驗（MCP offline）」。已將第三點 codify 到 `~/.claude/agents/qa.md` 的 Mandatory Task Completion Steps 0 之下（若 MCP offline 則明文宣告 + grep fallback 最低門檻）— 下次做此類 ticket 時必照此步驟。

## 2026-04-21 — K-018 GA4 runtime fix regression run

**做得好：** 完整跑滿 175 test (166 passed / 1 skipped / 8 failed)，未在 ga-tracking.spec.ts 第一支 fail 就中止；failure log 直接對應到 spec mock 與 production helper 實作不一致的根因，交付訊息可供 PM 直接裁決。

**沒做好：** K-018 原 sign-off 時接受 `ga-tracking.spec.ts` 的 mock 用 `(...args) => dataLayer.push(args)` 形式，沒注意到此 mock shape 與 production helper 的實作細節耦合；當 production 改回 `arguments` 物件後，spec 的 `Array.isArray(entry)` filter 全部失效，8 個 case 同時 fail。Mock 與被測程式對同一個 global (window.gtag) 的 override 順序、以及 Arguments object vs Array 的差異，K-018 QA 當時未辨識為 boundary。

**下次改善：** 任何 spec 以 `addInitScript` mock 全域 function 時，QA sign-off checklist 需新增一條：「此 mock shape 是否與 production 實作的推送 payload 形狀一致？若 production 改寫同一 global 會覆蓋 mock 嗎？」若兩者對同一變數 override，必須列為 Known Gap 或要求 Engineer 改用 spy 而非 replace。

## 2026-04-21 — K-023（Homepage 結構細節對齊 v2）

**做得好：** 175 tests 全套跑完 174 pass / 1 skip / 0 fail；skip（AC-017-BUILD）為已知設計排除（需 production build），非回歸失漏；TICKET_ID=K-023 帶入正確執行，產出 `K-023-visual-report.html`；AC-023-DIARY-BULLET（width/height/backgroundColor/borderRadius，3 markers）、AC-023-STEP-HEADER-BAR（STEP 01/02/03 各自獨立 3 test，含 fontFamily Geist Mono 斷言）、AC-023-BODY-PADDING（desktop 72px/96px + mobile 375px 32px/24px）、AC-023-REGRESSION（Banner DOM-order compareDocumentPosition + diary markers 存在 + diary link）全部 PASS；K-017 / K-021 / K-022 / AC-HOME-1 / NavBar / DiaryPage 完整回歸無任何破壞。

**沒做好：** KG-023-04（640px breakpoint boundary test，639px vs 640px）Ticket 明定「QA adds at sign-off」，但 QA 角色定義僅能回報，不能寫 spec；此邊界場景實際上未被任何 test case 覆蓋，sign-off 時未主動將此 Known Gap 升級為 PM interception，而只留在 ticket 記錄中。

**下次改善：** Ticket 記載「QA adds at sign-off」的 Known Gap，QA sign-off 時必須明確向 PM 聲明「此邊界未覆蓋，需 Engineer 補 spec 或 PM 正式裁決降為 Known Gap」，不得以「已在 ticket 記載」為由跳過正式 Interception 流程。

## 2026-04-21 — K-022（/about 結構細節對齊 v2）

**做得好：** 165 tests 全套跑完 164 pass / 1 skip / 0 fail，skip（AC-017-BUILD）為已知設計排除（需 production build），非回歸失漏；visual report 正確帶 `TICKET_ID=K-022` 執行，產出 `K-022-visual-report.html`，K-027 反省改善已落地；AC-017-HEADER / METRICS / ROLES / PILLARS / TICKETS / ARCH / FOOTER 全部仍 PASS，I-1 fix（PillarCard overflow-hidden 移除）無破壞。

**沒做好：** I-1 fix 移除 overflow-hidden 屬性後，未補「長文字溢出」邊界場景的 Playwright spec；現有斷言只能確認結構存在，無法保護未來 PillarCard 文字過長時的 layout 完整性。

**下次改善：** Engineer fix 涉及移除 overflow / layout guard 屬性時，QA 須主動補一條 boundary spec（e.g., 注入長文字 prop 確認容器不崩），不能只靠結構斷言通過就放行。

## 2026-04-21 — K-027（DiaryPage 手機版 milestone timeline 視覺重疊修復）

**沒做好：**
- TC-001~003（NO-OVERLAP）僅覆蓋「全折疊」與「全展開」兩個端點，未測試 accordion 中間態（奇偶交叉展開），而中間態正是原始 bug 的高發場景。
- Mobile viewport 測試覆蓋 375 / 390 / 414px，但 AC 明定「≤ 480px 全部 breakpoint」；430px（iPhone 14 Pro Max）與 480px 邊界值未被任何獨立 TC 覆蓋。
- visual report 執行未帶 `TICKET_ID=K-027` 環境變數，產出檔名為 `K-UNKNOWN-visual-report.html`；K-017 retro 已記錄此改善點，本次仍未落地，屬重複失誤。
- `assertLastCardVisible` 的 scroll-to-bottom 可見性未作目視或 `toBeInViewport()` 輔助驗證，僅依賴 bounding box 斷言通過，實測路徑存在盲點。

**下次改善：**
1. **截圖 script TICKET_ID 強制格式**：執行步驟改為 `TICKET_ID=<ticket-id> npx playwright test visual-report.ts`，不允許省略 — 已同步更新 qa.md persona 步驟為硬 gate。
2. **Accordion 中間態測試**：凡有 accordion/collapse 的頁面，NO-OVERLAP 類斷言必須額外加一輪「奇偶交叉展開」場景（展開奇數索引、折疊偶數索引）。
3. **Viewport 邊界補點**：AC 定義「≤ X px」時，QA 必須在標準三種 viewport 之外加測 X px 邊界值本身（本票應補 480px TC）。
4. **Scroll 可見性獨立實測**：scroll-to-bottom 類斷言修正後，QA 須另開 browser session 以目視或 `toBeInViewport()` 補充驗證。

## 2026-04-20 — K-021 Round 4（`/about` readability re-verify）

**做得好：** Round 3 挑出的 10 處 white-on-paper 疑慮在 Round 4 寫了直接針對 CSS token 的 computed-color 探針（11 處 selector 對 `rgb(26, 24, 20)` 斷言 + 9 處 pillar/arch/ticket-anatomy 延伸），11 主 + 9 延伸 = 20/20 全 pass，證據與 K-017 baseline 無關、直接綁 `ink` token 語意；另外加一道 paper-bg 感知的 white-leaf 全頁掃描（對 `/about` 回 0 筆、對 `/`, `/diary`, `/app`, `/business-logic` 各回 0 筆），回歸證據不止針對 Round 3 舉證的 10 處，而是「整頁再無白字殘留」；regression 三件套自跑（tsc exit 0 / build 所有 chunk < 500kB，最大 vendor-react 179kB gzip 58kB / Playwright 115 passed + 1 skipped），不以 Engineer 自述為憑；visual-report 以 `TICKET_ID=K-021 npx playwright test --project=visual-report` 覆寫 Round 3 報告，檔案 timestamp 與 size 驗證確認寫入成功。

**沒做好：** Round 4 是 narrow re-verify，但 probe script 起手時 import 寫成 `from 'playwright'`（套件只有 `@playwright/test`），第一次執行 ERR_MODULE_NOT_FOUND，多跑一次；為了不污染 E2E suite，把探針放在 `e2e/_k021-round4-*.mjs` 並依賴 playwright config 的 `testMatch: /.*\.spec\.ts$/` 篩掉，但「命名以 `_` 開頭 + `.mjs` 副檔名 + 非 spec」三重保險這層規則沒先寫在探針檔頭註解，之後同事看到可能誤會是遺漏的 spec。

**下次改善：** (1) `/frontend` 下 ad-hoc Playwright 探針統一 `import { chromium } from '@playwright/test'`，新增 `_k*.mjs` template 註解首行標註「非 spec，不被 testMatch 收斂，執行完 rm」；(2) Round N re-verify 類任務，QA retro 標題明確加 `Round N (<focus>)`，與原始 ticket retro 區隔閱讀路徑，避免後續翻閱者混淆範圍。

## 2026-04-20 — K-021

**做得好：** 自動化三件套（tsc exit 0 / build 無 chunk warning / Playwright 115 passed + 1 skipped）一次通過並逐項記錄具體數字（最大 chunk vendor-react 179kB，gzip 58kB），非只標 PASS；5 路由視覺檢查不依賴肉眼，以臨時 Playwright spec 逐頁 evaluate 出 body bg / color / heading fontFamily / footer fontFamily 等數值，再與 AC 原始 rgb 斷言並對；`/about` readability 疑慮不以肉眼判斷，撰寫 readability 探針（讀 hero h1 / metric cards / h2/h3 headings 的 computed color）取得 `rgb(255, 255, 255)` 白字出現於 paper bg 的客觀證據，再對照 K-017 baseline（extract K-017-visual-report.html 的 base64 還原 /tmp/k017-about.png）逐幅肉眼比對；NavBar 疑似 hex leak 先以 `outerHTML` regex 偵測，再寫第二版探針區分「inline style vs className literal」，避免錯判 TD-K021-02 允許的 `text-[#9C4A3B]` 為 regression；結束前以 `rm e2e/_tmp-*.spec.ts` 清除所有臨時 spec，避免污染 repo。

**沒做好：** readability 探針一開始沒把 `/about` 排為優先核心——先跑「6 routes 通用截圖 + 色值抽樣」才發現異常，多跑一輪探針；臨時 spec 建立時沒先看 `playwright.config.ts` 的 `testDir: './e2e'`，第一次放 `/tmp/` 啟動失敗才改放 `e2e/_tmp-*.spec.ts`，浪費一次 run；Reviewer 2 條件之一「`/about` 與 K-017 baseline 對比 → 判斷是 K-022 regression 還是立即修」QA 視為「回報事實給 PM 裁決」而非自己下判斷，但沒在 retrospective 明確標示「技術證據已收集完整，裁決在 PM」的邊界角色。

**下次改善：** (1) 視覺全面改版類 ticket（K-021 此類 design system rebuild）QA 視覺 audit step 先讀 ticket §Scope 與 §Tech Debt 列出「本票遷移 vs 未遷移」範圍，**優先針對「未遷移但受波及」路由做 readability 探針**，不倚賴均勻抽樣；(2) 臨時 Playwright spec 一律直接建在 `e2e/_tmp-<task>.spec.ts`，並在結束前 `rm` + `ls` 驗證清除，不走 `/tmp/` 導致 testDir 不覆蓋；(3) QA retro 明確分段「客觀數據」vs「PM 裁決題」，前者 QA 負責，後者只陳述證據不下結論，避免角色越權。

## 2026-04-19 — K-018

**做得好：** ga-tracking.spec.ts 12/12 全綠逐一目視確認（AC-018-INSTALL × 1、AC-018-PAGEVIEW × 4、AC-018-CLICK × 4、AC-018-PRIVACY × 1、AC-018-PRIVACY-POLICY × 2），與 ticket AC 清單逐條對齊；`TICKET_ID=K-018` 環境變數本次記得帶，產出正確命名的 `K-018-visual-report.html`（K-017 反省的改善行動已落地）；全套 99 passed / 1 skipped，skipped 條目屬已知問題，正確標注不 block。

**沒做好：** `waitForFunction` 取代 `waitForTimeout` 的修復屬 E2E 穩定性改善，QA 未獨立驗證「舊版確實存在 flaky 風險」——只依賴 Engineer retro 自述，未執行 `--repeat-each` 確認新版不 flaky；「`/business-logic` 不在追蹤範圍」的設計理由沒有在 QA retro 中明記，後續若有 coverage 疑問需翻 ticket 才能找到依據。

**下次改善：** (1) E2E timeout 改善類修復，QA 須執行 `npx playwright test <spec> --repeat-each=5` 驗證穩定性，不全然依賴 Engineer 自述；(2) 「刻意不追蹤/跳過」的路由或功能，QA retro 明記排除理由，作為後續 coverage 問題的第一線文件依據。

---

## 2026-04-19 — K-017

**沒做好：** 執行 visual report script 時未帶 `TICKET_ID=K-017` 環境變數，導致產出為 `K-UNKNOWN-visual-report.html`；AC-017-BUILD（prebuild hook）因 dev mode skip 而未補 build-mode 手動驗證；AC-017-AUDIT（audit-ticket.sh）屬 shell script 不被 Playwright 覆蓋，但 QA 未主動手動執行 K-002/K-008/K-999 三個情境逐條確認 AC。
**下次改善：** (1) 截圖 script 執行前固定確認 `TICKET_ID` 已設；(2) 含 build artifact 依賴的 AC，QA 額外執行 `npm run build` 確認 artifact 存在；(3) Shell script / CLI tool 類 AC，QA 主動手動執行所有情境，不以 Playwright skip 代替驗證。

---

## 2026-04-18 — K-008 QA 驗收反省

**做得好：** 6 步回歸不只機械執行，在 Step 3 HTML 產出後主動補跑「結構抽樣」驗證（`grep -c 'class="page-section'` = 5、`grep -o 'data:image/png;base64' \| wc -l` = 4、`grep -A1 'class="route"'` 列 5 條 `<code>` 路由標記），把 AC-008-CONTENT 條文「每張截圖有對應的 route path 標記」從「Engineer 自述」升級為「QA 獨立驗證」。Step 6 也額外執行 `git check-ignore -v` 確認 `.gitignore:32` rule 精確命中、無 overreach，不只看 `status` 輸出有無目標檔。

**沒做好：** W4 whitelist 的 negative path 只驗 PM prompt 指定的 `../../etc/passwd` 一個 payload；QA 應自備邊界清單（空字串、純空白、尾空白、`K-` 大小寫、Unicode、overflow 長度）主動擴展驗證面，但這次沒做。另外 `.gitignore` rule overreach 只做 `docs/reports/*.html` 單 rule 抽樣，未對 `dist/`、`coverage/`、`node_modules/` 內常見產物目錄各抽 1 sample 跑 `check-ignore` 確認未誤傷。HTML size 驗證僅比 `>500KB` / `<10MB` 門檻，若未來產物結構大幅異常（例：24 張截圖擠成 1 MB，或某條 route 變空），size 仍會落在範圍內，size 不足以當 structural invariant。

**下次改善：**
1. **邊界 payload 清單固定化** — QA 自備 fixed checklist（空字串、純空白、尾空白、大小寫、Unicode、overflow 長度）隨任何 env var / CLI 輸入 ticket 一起跑，不等 Reviewer / PM 在 prompt 列 payload。
2. **gitignore 跨產物 sample 檢查** — 凡修改 `.gitignore`，QA 對 repo 內常見產物目錄（`dist/`、`coverage/`、`node_modules/`、`docs/`）各抽 1 個 sample 檔案跑 `git check-ignore -v`，確認 rule 精確，不靠「只看目標檔是否被 ignore」單點判斷。
3. **Artifact 內容抽樣作為 invariant** — HTML / JSON artifact 不只看 size；每種 artifact 定義 1~3 個結構 grep 作為 AC 的 operational invariant（本票 `<section>` 數、base64 圖數、route 標記清單），寫進 QA 驗收章節當證據，不靠 Engineer 自述。

---

## 2026-04-18 — K-011（LoadingSpinner label prop 回歸測試）

**做得好：** 三層驗證（tsc exit 0 / Vitest 36 pass / Playwright 45/45）全程實跑並 tail 輸出驗證精確數字，未沿用 Reviewer 段落 relay；主動 Read `agent-context/architecture.md:139` 確認 Drift A 已由 Engineer 補完，不假設「PM 裁決 = 已執行」。補執行「獨立 grep `Running prediction` 於 `frontend/` 全樹」作為雙重驗證，確認 `frontend/e2e/` 無任何斷言依賴、`PredictButton.test.tsx:24` 為唯一依賴點、`homepage.pen:4825` 為 TD-011 已登記項，無漏網。

**沒做好：** `LoadingSpinner` 本身沒有 unit test（現存 test 都走上層 PredictButton / AppPage 間接覆蓋），對 `label` 的 falsy 邊界（空字串 `""`、`undefined`、極長字串）與 `aria-label` fallback（`label ?? 'Loading'`）未有直接斷言；若未來新 callsite 誤傳空字串，行為是「不渲染 `<p>` 且 `aria-label` 走 fallback」，本票無測試攔截此情境。此外，未主動在 retrospective 中將這些邊界列成「K-011 未覆蓋」的 follow-up 清單交 PM 評估是否需要補 unit test。

**下次改善：** (1) 共用 UI 組件「新增 prop」類 ticket，QA 必主動列「新 callsite 的邊界條件」（falsy 值、極長字串、RTL / emoji）給 PM 評估是否補 unit test；即使 PM 判定非 scope，也要在 retrospective 明記「這些邊界未覆蓋」供未來 bug 溯源。(2) 沿用 Reviewer grep 結論前，自己跑一次獨立 grep（`frontend/e2e/ frontend/src/__tests__/ frontend/src/`），把 Reviewer 的結論當 hypothesis 而非 fact，發出 PASS 前必有 QA 自行 grep 紀錄。

## 2026-04-18 — K-009（1H MA history fix 回歸測試）

**做得好：** 實跑 `python3 -m pytest` 取得完整 63 passed 數字，並與 ticket AC-009-REGRESSION 基準（18 + 44 = 62 + 新增 1 = 63）逐項 cross-check 對齊；同步跑 `py_compile` 雙檔確認無語法/縮排漏網。跳過 Playwright 的決策明確寫進報告並附理由（無前端 diff、無 UI surface），不用「沒時間」含糊帶過。

**沒做好：** 未執行單點驗證「移除 fix 後 test 會失敗」—— 雖然 Reviewer 已實跑 `git stash` 驗過（ticket Reviewer 段有記錄），但 QA 層面未再獨立覆核，純粹 relay Reviewer 結論；若 Reviewer 記錄本身有誤（此次無，但流程上不應假設），QA 等於失守。此外，S1 技術債（predictor 層靜默 fallback）已開 K-015，但 QA 未主動列出「未來新增 `find_top_matches()` caller 時，測試需攔截此類 regression」的邊界條件清單給 PM。

**下次改善：** (1) 後端 bug fix 類 ticket，QA 必須獨立執行「reverse-fix → test fail → restore fix → test pass」一輪小驗證，不全然依賴 Reviewer 段落；(2) 看到「技術債已開票」的裁決時，QA 主動在 retrospective 註記該 follow-up 需要的 regression 測試覆蓋點（例如：K-015 解掉時必須附「新 caller 忘記傳 ma_history」的 predictor 層 assert test），避免技術債修復時又踩相同坑。

## 2026-04-18 — K-010（Vitest AppPage 修復）

**做得好：** 三重回歸（Vitest 36/36、tsc exit 0、Playwright 45/45）全程實跑並 tail 輸出確認數字，不信 Implementation log；額外 grep `chart-timeframe-` 比對 testid 在 E2E 是否被依賴，釐清本次 DOM 改動的 blast radius 只在 Vitest，E2E 無回歸風險。

**沒做好：** 未跑 Vitest coverage 確認 Engineer 是否意外讓既有 test skip 或改判（只看 pass 數無法偵測「斷言被削弱」），本次靠 review 手動檢查 test diff 間接證明，程序上有漏洞；截圖 script 仍缺（K-008 未實作 cycle #6），本次跳過但流程定義上 QA 尾段是缺的。

**下次改善：** (1) 日後 Vitest 涉及改寫斷言的 ticket，QA 必加跑 `npm test -- --run --coverage` 比對 coverage diff（或至少 read 改動的 test 原/新 diff）再聲明 PASS；(2) 在 K-008 實作前，QA 的「截圖報告」欄位採固定「跳過（K-008 未完成）」而不逕自聲稱流程完整，避免 PM 誤解。
