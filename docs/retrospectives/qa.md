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


## 2026-04-23 — K-037 Favicon Wiring Final Sign-off (post-Code-Review, post-Engineer-commit-pending)

**做得好：** 三閘門機械驗證順序清晰 — (1) 完整 Playwright suite 257 passed / 1 skipped / 1 failed，唯一紅燈 `AC-020-BEACON-SPA` 透過 grep 確認是 `ga-spa-pageview.spec.ts` 檔案 L143 註解明文標註「K-033 TRACKER — currently RED on purpose」的預期紅，非 K-037 回歸；(2) favicon 獨立 suite 16/16 全綠（8 asset-200 + 6 link-tag + 1 manifest schema + 1 MIME accept-list）完全對齊 AC-037 四條可測 AC 結構；(3) 機械 AC-037-TAB-ICON-VISIBLE curl grep 驗證（rel="icon"×4 + apple-touch-icon×1 + manifest×1 + theme-color×1）全部吻合期望值，且 theme-color meta content `#F4EFE5` 與 manifest.json `theme_color` byte-for-byte 一致（Architect §3 binding contract #5 達成）。Sacred invariant 交叉比對零衝突 — K-037 scope 僅 `<head>` + `public/` + playwright config 三層（git diff --stat 確認 index.html +7 / playwright.config.ts +41-9 / diary.json +6），未觸及 K-028/K-035/K-021/K-024 shared chrome surfaces。Engineer 回報的 `diary-page T-L1` timing flake 本次 full-suite 未重現，與 Engineer retro「isolated re-run green」敘述一致（timing 類 flake 本質）。Visual report `TICKET_ID=K-037` 正確產生於 `docs/reports/K-037-visual-report.html`（1.8MB，5 captures），並主動清除先前 full-suite run 產生的 `K-UNKNOWN-visual-report.html` 殘檔，避免下游污染。

**沒做好：** Playwright project-split 架構（`chromium` + `favicon-preview` + `visual-report` 三 project）首次出現，QA 未在 Early Consultation 時預先確認「full-suite 呼叫 `npx playwright test` 不帶 --project 參數是否會自動跑 favicon-preview 與 visual-report」— 實際行為是三 project 全跑（favicon 16 + visual 5 + chromium 核心），總數因此跳升到 257，與 Engineer pre-commit baseline 的 256 + 16 = 272 預期不完全一致（差異來自 visual-report 被無意間觸發 + 1 個 diary-page flake 未重現）。事後對照 playwright config 可推出（無 --project filter 時跑所有 project），但若 QA 在 Early Consultation 階段就預審 config 三 project 結構並書面化「full-suite 預期總數＝X（含 visual-report auto-run）」，可避免 sign-off 當下的瞬間困惑。另：mobile Safari iOS / Android Chrome 實機 tab icon 渲染仍為 ticket 內明示 Known Gap（AC-037-TAB-ICON-VISIBLE 條款），本次 sign-off 無法覆蓋 — 依賴 PM close-time 與 user 在真實裝置做側邊比對，非 QA 可機械驗。

**下次改善：** Early Consultation 階段若 Engineer 計畫引入新 Playwright project（測試隔離/附加 webServer/多 baseURL 等），QA 必須書面產出「full-suite invocation matrix」表格（欄：`npx playwright test` / `--project=X` / `<spec-file>`；列：三 project 是否會被觸發；格：預期 test count）貼回 ticket Release Status，作為 sign-off 時對照基線。本次 K-037 回溯補 matrix：`npx playwright test` = chromium(236) + favicon-preview(16) + visual-report(5) = 257 total（1 skipped 在 chromium 核心，屬既有 K-033 tracker）；`npx playwright test favicon-assets.spec.ts --project=favicon-preview` = 16；`TICKET_ID=K-037 npx playwright test --project=visual-report` = 5。已 codify 至 `~/.claude/agents/qa.md` §Mandatory Task Completion Steps — 新增「Step 0c: multi-project playwright config invocation matrix pre-flight」，當 `playwright.config.ts` 出現 ≥2 project 時必備。

## 2026-04-22 — K-025 Final Sign-off (post-Code-Review)

**做得好：** 三閘門串行驗證（tsc exit 0、`npm run build` exit 0、full Playwright suite 192 passed / 1 skipped / 0 failed、navbar.spec.ts 22/22）完全對齊 Engineer 實作回報；AC-025-NAVBAR-TOKEN 額外做 `grep -nE '#[0-9A-Fa-f]{6}' UnifiedNavBar.tsx` 並逐行驗證僅剩 L18–19 註解塊（K-017 legacy provenance 文字），runtime class literals 零 hex，未盲信 Engineer 宣稱。W-1 (TD-K025-01) PM 裁決 TD 入帳而非 sign-off blocker，因 behavior-diff truth table + dual-rail aria-current/computed color 斷言已獨立證明等價，CSS declaration grep 為冗餘 proxy 而非唯一證據。
**沒做好：** 本票 visual verification 依 ticket frontmatter `visual-spec: N/A` + zero rendered-color change 豁免（SCHEMA.md §L124），未開 dev server 做全路由目視 — 對 zero-visual refactor 而言合理但仍屬 coverage 選擇；若未來有 NavBar class 同時跨 active/inactive/hover 三態的改動（非本票 scope），純 computed color 無法覆蓋 hover pseudo-state。
**下次改善：** Sign-off 輸出強制段落化（Verdict / Evidence / Known Gap / Next-ticket-watch）於 persona `qa.md`「Mandatory Task Completion Steps」下加一條模板範例，避免未來 final sign-off 只寫結論不寫證據數字；並在 refactor 類 ticket sign-off 增列「hover/focus pseudo-state 未覆蓋」作為 Known Gap 顯式標示，不靠讀者自行推斷。

---

## 2026-04-22 — K-025 Early Consultation

**做得好：** Pre-Architect gate 即完成三題 Q1/Q2/Q3 審查，提前鎖定 refactor behavior-equivalence 風險（Tailwind arbitrary-value vs token compile 差異）、aria-current attribute-only selector 的視覺盲點、`/business-logic` route 覆蓋 gap；Q2 建議雙軌斷言（aria-current + computed color `rgb(156,74,59)`）而非單純保留 class regex，避免 refactor 後測試僅驗屬性不驗顏色渲染。
**沒做好：** 諮詢時 spec 裡仍殘留「`toHaveClass(/text-\\[#1A1814\\]/)` 同時命中 active `/60` 變體 + inactive 兩種狀態」的寬鬆 regex（L178、L204），K-021 放行時未挑出，導致 K-025 本票 selector 遷移前 regression baseline 本身不嚴格；早期 consultation 第一次看到該 spec。
**下次改善：** 未來 pre-Architect QA consultation 必含一步「baseline spec grep」— `grep -E 'toHaveClass\(/' frontend/e2e/<target>.spec.ts` 列所有 class regex 斷言，逐條檢查 regex 是否唯一命中目標 state（不會跨 active/inactive 同時匹配），有歧義先回 PM 要求 AC 升級為 aria-current + computed color 雙軌，再進 Architect。

---

## 2026-04-22 — K-029 Regression Sign-off

**What went well:** Independent full-suite re-run (197 pass / 1 skip / 0 fail) matched Engineer's report; stale K-UNKNOWN-visual-report.html caught + deleted pre-run per K-028 memory; all 4 K-029 testids (arch-pillar-body / arch-pillar-layer / ticket-anatomy-body / ticket-anatomy-id-badge) verified present + exclusive (zero class-selector fallback for tested components); KG-029-01 closed cleanly.

**What went wrong:** Pencil MCP tool surface not granted to QA agent — forced source-grep fallback for parity verification instead of direct .pen visual diff. Reduces parity confidence to "source palette matches spec" (indirect proxy) rather than "design canvas matches render" (direct).

**Next time improvement:** PM/main-session grant mcp__pencil__batch_get + mcp__pencil__get_screenshot to QA persona tool surface before sign-off rounds on UI tickets, so §0b Pencil parity is first-class, not fallback. Codify in qa.md §0b: "if pencil MCP missing from tool grant, BLOCK sign-off and request tool-grant from PM before proceeding" (currently §0b only handles MCP-server-down, not MCP-tool-not-granted case).


## 2026-04-22 — K-020 Regression (full Playwright E2E sign-off)

**What went well:** Full-suite run (200 tests discovered) landed exactly on the shape agreed in Early Consultation + design §3.1 — 198 pass / 1 skip / 1 fail, where the lone fail is the intentional K-033 tracker (`AC-020-BEACON-SPA`) carrying the PM-ruled C-1 doc-block above it. No pre-existing spec regressed; the 9 new tests in `frontend/e2e/ga-spa-pageview.spec.ts` match design §3.1 one-for-one. AC coverage mapping verified per spec: AC-020-SPA-NAV ×2 green, AC-020-BEACON-INITIAL / PAYLOAD / COUNT green, AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE green, AC-020-BEACON-SPA red-on-purpose with visible K-033 TRACKER explainer in-source.

**What went wrong:** Pencil MCP fallback policy triggered — `mcp__pencil__get_screenshot` not invoked because K-020 is a pure test-addition ticket (no production code, no UI delta, no `.pen` associated). Per persona the visual comparison is only mandatory when the ticket has a `.pen` design; still, I should be explicit that the visual layer is intentionally skipped rather than silently omitted. Also: `visual-report` run inside the full-suite call printed `TICKET_ID not set, output will be K-UNKNOWN-visual-report.html` — fine for this test-only regression where visual report isn't required, but a generic reminder that the screenshot wrapper needs `TICKET_ID=K-020` when a visual deliverable is expected. No rule was violated on this ticket because the task instruction explicitly waived per-test screenshots; logging so future test-only tickets inherit the same explicit waiver language.

**Next time improvement:** When QA sign-off is a test-only / no-UI-delta ticket, declare in the verdict block "visual layer N/A — no production code change, no `.pen` delta" instead of silently omitting the Pencil comparison step. This makes the Known Gap explicit and matches the persona rule that unstated omissions don't count as sign-off. If any future test-only ticket also introduces even one UI-touching line, revert to full Pencil comparison.


## 2026-04-22 — K-020 Early Consultation (real Agent(qa) run — independent pass)

**Context:** Independent QA Early Consultation invoked by PM for K-020 (GA4 SPA Pageview E2E hardening) following the PM-simulated pass earlier this session. Scope: read ticket K-020 + PRD + `frontend/src/utils/analytics.ts` + `frontend/src/hooks/useGAPageview.ts` + `frontend/e2e/ga-tracking.spec.ts` + `frontend/playwright.config.ts`, probe AC for boundary / edge-case / race-condition gaps. PM pre-decided: BQ-1 resolved to `page.route()` intercept; AC-020-SPY-PATTERN removed.

**Testability review:**
- AC-020-SPA-NAV → ⚠️ Testable but incomplete — click-delta guard present, but beacon payload key not pinned (which of `page_path`, `page_location`, `page_title`, `dl`, `dp` on `/g/collect` query?), same-route / query-only / hash-only navigation behavior undefined, init-vs-SPA timing race for `page.route()` registration undefined.
- AC-020-BEACON → ⚠️ Testable but incomplete — "URL + query" is vague; missing concrete required keys; no assertion that the beacon count matches pageview count (silent over-firing or double-fire undetectable); `page.route()` cleanup on failure unspecified.

**QA Challenges raised (11):**

**Blocking (Architect cannot design without PM ruling):**

1. **QA Challenge #5 — AC-020-BEACON beacon payload keys unpinned.**  
   Issue: AC says "URL query string contains `en=page_view`" but does not enumerate which payload keys constitute a valid pageview beacon. `/g/collect` carries `tid` (measurement ID), `dl` (document location / full URL), `dp` (document path), `dt` (title), `en` (event name), `v=2` (GA4). Asserting only `en=page_view` accepts a beacon that drops `dl` or points at the wrong path — that is precisely K-018 class of silent-drop bug moved one layer down.  
   Needs supplementation: AC must specify required keys — recommend `v=2` AND `tid=G-TESTID0000` AND `en=page_view` AND (`dl` contains `/about` OR `dp=/about` — which one depends on gtag.js version, must be verified in dry-run).  
   If not supplemented: BEACON test will pass on a partial/corrupt beacon, defeating the purpose.

2. **QA Challenge #6 — AC-020-SPA-NAV and AC-020-BEACON do not cross-verify.**  
   Issue: Phase 1 asserts dataLayer has a new entry after SPA navigate; Phase 2 asserts initial `/` load produces one `/g/collect` beacon. Neither AC asserts **SPA navigate produces a new `/g/collect` beacon**. This is the exact K-018 failure mode: `gtag('event', 'page_view', ...)` called but beacon never sent. If the helper internal implementation drifts (e.g. future refactor breaks the Arguments-object push), SPA-NAV will pass (dataLayer entry present) but no beacon leaves the page. AC currently has no test that catches this at the SPA layer.  
   Needs supplementation: Add a third AC or extend AC-020-BEACON with a second test case — NavBar click to `/about` → `page.waitForRequest(/\/g\/collect/)` captures a second beacon whose path-key points to `/about`. BQ-3 in ticket alludes to this race but punts it ("Phase 2 初版只要求初始 load"). Punting it removes the only defense against K-018 shape drift in the SPA path.  
   Recommendation: do NOT defer. Add as hard AC.

3. **QA Challenge #7 — Same-route / query-only / hash-only navigation behavior undefined.**  
   Issue: `useGAPageview` depends on `[location.pathname]`. Therefore:  
   (a) `/` → `/` click (user clicks same-page link): `location.pathname` unchanged → `useEffect` does not re-fire → no pageview. Expected? AC silent.  
   (b) `/?x=1` → `/?x=2` (query-param-only change): `pathname` unchanged → no pageview. Expected?  
   (c) `/#foo` → `/#bar` (hash-only change): `pathname` unchanged, React Router may or may not remount depending on `BrowserRouter` vs `HashRouter` → no pageview. Expected?  
   These are live user flows (tab click that points to current route, filter query changes, in-page anchor). AC and implementation silently disagree on (a)/(b): GA4 Measurement Protocol guidance says pageview should fire when `page_location` changes (location includes query). Current impl does NOT fire on query change — either a bug to be fixed (change hook dep to `location`) or intentional behavior to be documented.  
   Needs supplementation: PM must rule — for each of (a)/(b)/(c), fire or not fire? Then AC must encode the ruling (at minimum one negative-case test: "query-only change does NOT push new dataLayer entry" if the ruling is "don't fire"; otherwise fix the hook + add positive test).

**Non-blocking (Architect can design but must handle in design doc):**

4. **QA Challenge #8 — Back/forward navigation not covered.**  
   Browser back from `/about` to `/` and forward to `/about` again should each fire pageviews (standard GA4 expectation). React Router pushes popstate → pathname change → hook fires. Current AC only tests forward click; back/forward untested. Edge case recommendation: Architect adds a third SPA-NAV case (back button from `/about` fires pageview to `/`). Not blocking; can be Known Gap if PM rules scope.

5. **QA Challenge #9 — Rapid sequential navigation race.**  
   A → B → C within <100ms: three pageviews or coalesced? `useEffect` on `pathname` is synchronous per-render, so three renders = three effect runs = three `trackPageview` calls = three beacons. gtag.js may batch/debounce at the beacon layer. AC silent. Known production risk: rapid NavBar clicks (double-tap on mobile) firing duplicate beacons inflates GA4 user/session counts. Architect dry-run should measure.

6. **QA Challenge #10 — Test isolation: `page.route()` cleanup on failure.**  
   If AC-020-BEACON test throws mid-assertion (e.g. beacon query malformed), does the route handler leak into the next test in the file? Playwright `page.route()` scope is per-page, so `page.close()` cleans it, but `test.afterEach` explicit `page.unroute()` is safer. Specify in Architect design doc: "all `page.route('**/g/collect')` handlers must register in `test` body and rely on per-test page fixture teardown; no shared `test.beforeAll` route registration." — otherwise flake on CI parallel runs.

7. **QA Challenge #11 — Beacon count assertion missing.**  
   Even with correct `en=page_view`, nothing asserts that **exactly one** beacon fires per pageview. A future impl bug that fires the event twice (e.g. StrictMode double-invoke in dev, or someone adds a second `trackPageview` call) will pass current AC. Recommendation: Phase 2 test counts beacons between click and next assertion checkpoint and asserts `=== 1`.

8. **QA Challenge #12 — Invalid measurement ID `G-TESTID0000` dry-run (covered in ticket as Challenge #3).**  
   Already flagged by PM-simulated pass as Architect dry-run item. Reaffirm: gtag.js may refuse to fire `/g/collect` for syntactically malformed IDs. If dry-run shows no beacon fires, Phase 2 is un-implementable with current playwright.config env; need either real test ID or to accept that Phase 2 runs only against `G-` pattern + non-existent ID (possible — GA4 client-side validation is loose, but confirm).

9. **QA Challenge #13 — Navigation type: NavBar Link vs BuiltByAIBanner CTA vs programmatic `navigate()`.**  
   AC names two entry points. Third (programmatic: e.g. a future redirect-on-success-calls `navigate('/app')`) exists in the codebase — any component calling `useNavigate()` hits the same `useLocation()` reactive path, so the test logic is invariant. Recommendation: state explicitly in design doc that NavBar + BuiltByAIBanner cover all human-trigger entry types and that programmatic `navigate()` is considered equivalent (no separate test). Non-blocking — just document.

10. **QA Challenge #14 — BuiltByAIBanner target route.**  
    Current AC-020-SPA-NAV says both cases go `/` → `/about`. BuiltByAIBanner CTA indeed points at `/about` (confirmed via `a[aria-label="About the AI collaboration behind this project"]` in K-018 spec line 166). Two test cases testing the same route transition with different triggers is a weak test matrix. Recommendation: let NavBar test `/` → `/about` and BuiltByAIBanner test a different target if it exists, OR explicitly accept that the two cases are near-duplicates because the goal is to prove "different DOM entry points both reach the hook". Non-blocking — PM already rationalized this in AC wording, just make it explicit in the test comment.

11. **QA Challenge #15 — `page_location` value semantics.**  
    Impl `useGAPageview.ts:17` passes `location.pathname` (e.g. `/about`) as `page_location` — but GA4 Measurement Protocol convention is that `page_location` is the **full URL** (`https://host/about?q=...`), and `page_path` is the path. Helper is sending path-as-location. This works for funnel analysis on simple sites but is a semantic bug. Current AC pins `page_location: '/about'` which **codifies the bug**. Flag to PM: is this intentional (simplification) or a bug to fix now? If fix now, AC must change. Non-blocking for K-020 scope but user should know.

**What went well:** Caught that both AC-020-SPA-NAV and AC-020-BEACON individually have click-delta / throw-on-fail guards but neither enforces the K-018-specific invariant "SPA navigate → new `/g/collect` beacon leaves the page" — which is the exact bug class the ticket was created to prevent. This is a hole. Also surfaced that `useGAPageview`'s `[location.pathname]` dep array causes query-only changes to be silently ignored, an undocumented behavior that AC codifies by omission.

**What went wrong:** PM-simulated pass earlier today caught 4 challenges but missed these 11, including the scope-defining hole (#6 SPA → beacon cross-verify). Simulation from the PM seat lacks the adversarial posture QA role requires — PM-simulated review tends to validate existing design rather than stress-test it. This justifies the ticket's `§Release Status` row flagging "Agent(qa) required" as a real blocker, not a procedural formality.

**Next time improvement:** When K-018-class ticket (production bug retrofit) is created, QA Early Consultation must map "original bug manifestation" → "which AC directly catches it" as a concrete table. For K-020 the bug was "gtag call succeeded but beacon never sent" — AC-020-BEACON covers it for initial load, nothing covers it for SPA navigate. A bug-mapping table would have made this omission visible on first read. Codify in qa.md Early Consultation protocol.

---

## 2026-04-22 — K-020 Early Consultation (self-retrospective on the consultation itself)

**What went well:** Independent read of implementation before reading the ticket surfaced the `[location.pathname]` dep array gap (Challenge #7) and the `page_location`-as-pathname semantic issue (#15) — these would have been invisible if starting from AC text alone. Cross-referencing K-018 retro ("mock/production override order") with the current `addInitScript` pattern in `ga-tracking.spec.ts:34` confirmed BQ-2's premise is sound.

**What went wrong:** Initial scan did not immediately spot Challenge #6 (SPA → beacon cross-verify missing) — it only surfaced after building the challenge list and cross-checking against the ticket's stated goal ("E2E against production GA4 pipeline"). Reading AC in order instead of mapping AC to failure modes allowed the hole to hide.

**Next time improvement:** For any "E2E hardening" or "production bug regression test" ticket, start Early Consultation with a 2-column table — rows = historical bug modes from the linked ticket's retro, columns = AC covers / AC does not cover. Do this BEFORE reading AC line-by-line. If any row has no column checked, that is a blocking gap.

## 2026-04-22 — K-020 Early Consultation (PM-simulated, Agent tool unavailable)

**Context:** PM re-plan session for K-020 (GA4 SPA Pageview E2E). Session lacked Agent tool → could not spawn real `qa` sub-agent; PM executed Early Consultation by reading `~/.claude/agents/qa.md` §Early Consultation protocol + deep inspection of `frontend/src/utils/analytics.ts`, `frontend/src/hooks/useGAPageview.ts`, `frontend/e2e/ga-tracking.spec.ts`, `frontend/playwright.config.ts`. Explicitly disclosed as simulation in ticket §Release Status — user may require a real Agent(qa) pass before Architect release.

**Testability review:**
- AC-020-SPA-NAV → ✅ Testable after wording fix (original AC used GTM dataLayer `{event, page_location}` object shape; production pushes `Arguments` object with index-based access — corrected)
- AC-020-BEACON → ⚠️ Needs supplementation — CI network policy unresolved (no `.github/workflows/` in repo)

**Challenges raised (4):**
1. AC-020-BEACON CI egress unknown → **supplemented to AC** (added "test must throw on timeout, not skip")
2. AC-020-SPA-NAV initial-load pageview entry interferes with click assertion → **supplemented to AC** (added "record dataLayer.length before click, assert new entry points to `/about` after")
3. AC-020-BEACON fake `G-TESTID0000` — does gtag.js fire beacon for invalid IDs? → **deferred to Architect dry-run** (must verify in design doc §Dry-run)
4. Arguments-object type narrowing → **no AC change**, noted for Architect (use existing `IArguments` cast pattern from K-018 spec)

**What went well:** Surfaced 2 AC-level defects (wrong dataLayer shape wording; no click-delta guard) before Architect took the ticket — Phase 1 would have false-passed on the initial `/` pageview entry otherwise. Identified that `ga-tracking.spec.ts:34` `addInitScript` mock is overwritten by production `initGA()` at module load, confirming K-018 retro's "mock/production override order" lesson and making BQ-2's recommendation (drop addInitScript mock, read real dataLayer) concrete.

**What went wrong:** Could not run real Agent(qa) — PM simulating QA loses the independent-perspective value of the role; risks blind spots (e.g., Playwright version-specific `waitForRequest` behavior, edge cases QA would know from regression history). Disclosed in ticket as Known Gap pending user decision.

**Next time improvement:** When PM session lacks Agent tool, block release at §Release Status with an explicit "BLOCK: Agent(qa) required" row rather than proceeding with simulation; only simulate when user has pre-authorized. Codify in `pm.md` §PM session capability pre-flight — already present since 2026-04-21 K-030; enforce "explicit user authorization" clause this session (done: ticket surfaces decision back to user).


## 2026-04-22 — K-029 Early Consultation (verified by qa subagent)

**What went well:** Main session called real qa subagent to re-verify PM-simulated consultation, closing the capability-gap workaround from earlier this session. Findings differed from simulated on 2 of 7 challenges + 1 AC testability issue PM had accepted, confirming value of running the real agent.

**Divergences from simulated (acted on):**
- C3 (selector stability): simulated declared Known Gap with Engineer discretion; verified flagged this contradicts existing about/ testid convention (DossierHeader, FooterCtaSection already use data-testid) — upgraded to Architect design-doc mandate with 4 prescribed testid names (arch-pillar-body / arch-pillar-layer / ticket-anatomy-body / ticket-anatomy-id-badge).
- C6 (pyramid layer span text-ink): simulated left `<li>` detail under 3-token allow-list; verified flagged hierarchy inversion risk (if Engineer picks text-ink for both `<li>` and layer span, the "label more prominent than detail" intent collapses since child==parent) — AC tightened to pin `<li>` detail at text-muted fixed.
- AC "at least one" clause: simulated accepted (and even main session's initial post-PM review agreed); verified showed Engineer could pick a color outside BOTH allow and disallow lists (e.g. text-blue-600) — passes disallow, and only 1 of 3 cards needs allow match, so 2 cards with wrong color slip through. Tightened to "三個皆須命中 allow-list".

**Confirmed (no action):**
- No `darkMode` in tailwind.config + no `dark:` classes — PM's "no OS dark-mode boundary" claim VERIFIED.
- K-022 `about-v2.spec.ts` L195 uses `getComputedStyle` + exact RGB — canonical pattern for K-029 to follow.
- No K-022 spec asserts `text-gray-*` or `text-purple-*` on these components — AC-029-REGRESSION safe, no existing spec breakage.
- Scope = 2 files (7 sites) — grep re-confirmed.
- CardShell inheritance neutral on text color.

**Borderline observation (recorded, no action):**
text-muted on paper at 12px (text-xs) = 4.84:1 contrast — passes WCAG AA 4.5:1 but near the floor. If future font weight reduces perceived contrast, revisit.

**Known Gap reframed:**
**KG-029-01** — Playwright selector path: Architect design doc prescribes data-testid names; Engineer implements per doc; QA sign-off verifies compliance. (No longer speculative stability concern.)

**What went wrong (capability-gap root cause):** PM subagent lacks Agent tool → initial consultation was PM self-review of PM-authored AC, with inherent blind spots. 3 of 7 challenges needed correction once real adversarial review ran. Confirms `feedback_pm_session_capability_pre-flight` is structural, not per-ticket; user/main session must call real qa subagent for Early Consultation when PM subagent cannot spawn one.

**Next time improvement:** When main session hands off to PM subagent and flow requires QA Early Consultation, main session (which has Agent tool) should call qa subagent FIRST and feed the consultation findings into PM's handoff prompt — don't rely on PM simulation as the primary path. Simulation is fallback only when main session itself is unavailable. Codify in future PM release: "QA Early Consultation must come from qa subagent (not PM simulation) whenever main session has Agent tool available."

---

## 2026-04-22 — K-029 Early Consultation (AC testability + palette contrast review)

**DISCLOSURE:** This consultation was simulated by the PM subagent because the current PM session has no Agent-tool access to spawn qa subagent. Per persona §PM session capability pre-flight + memory `feedback_pm_session_capability_pre-flight`, PM proceeded with explicit disclosure. Upon next K-029 QA sign-off the actual qa subagent will re-verify this consultation's findings; any missed boundary at sign-off = gap to be logged back here.

**What went well (simulated QA review):** PM-driven scope scan via `grep -rn "text-gray-\|text-purple-\|text-blue-" frontend/src/components/about/` confirmed dark-theme residuals exist only in `ArchPillarBlock.tsx` (3 sites: body div / pyramid li / pyramid layer span) and `TicketAnatomyCard.tsx` (4 sites: body div / Outcome span / Learning span / ticket ID badge). RoleCard + MetricCard + PillarCard + FooterCtaSection already on paper palette — no additional scope. WCAG AA contrast on paper `#F4EFE5`: text-muted `#6B5F4E` ≈ 4.84:1 (passes AA for body), text-charcoal `#2A2520` ≈ 11.9:1 (AAA), text-ink `#1A1814` ≈ 13.5:1 (AAA). All three palette tokens clear AA for `text-xs` body. No dark-mode / OS-preference boundary — body is hard-pinned `bg-paper`.

**Challenges raised (and resolution):**
1. **AC phrasing "可讀深色" / "或更深" ambiguous** — `deeper` in color space not deterministically verifiable. → **Supplement AC**: replace with explicit allow-list (text-ink / text-charcoal / text-muted RGB) + explicit disallow-list (gray-300/400/500 + purple-400 RGB). PM will patch AC-029-ARCH-BODY-TEXT + AC-029-TICKET-BODY-TEXT.
2. **Ticket ID badge semantic color BQ** — PM-002 asks `text-charcoal` vs `text-muted`. → **PM rules text-charcoal** (see ticket §Architect Pre-check decisions): badge is an identifier / metadata label (Geist Mono mono-weight), not body prose; token table assigns `charcoal` to "次文字 / 輔助元素" — exactly this role. `text-muted` is for Footer / meta / NavBar non-active per architecture.md L453. text-charcoal also gives AAA contrast, preserving the "prominent identifier" visual weight the original `text-purple-400 font-bold` was trying to achieve.
3. **Playwright selector stability** — ArchPillarBlock + TicketAnatomyCard have no `data-testid`; new color assertions must anchor via section heading descent (fragile if Section reshuffles). → **Known Gap declared (KG-029-01)**: Engineer may add `data-testid="arch-pillar-body"` / `data-testid="ticket-anatomy-body"` + `data-testid="ticket-anatomy-id-badge"` at implementation time for stable assertion, OR anchor via `section:has(h2:has-text("Project Architecture"))` + descendant. Not AC-required; Engineer discretion. QA at sign-off will verify whichever path was taken produces stable selectors.
4. **Regression: new computed-color spec vs existing K-022 about-v2.spec.ts** — K-022 spec exists; AC-029 requires extending with color assertions or new K-029 spec. → Engineer task; Architect must explicitly state in design doc which spec file the new assertions go into. Not AC-blocking.
5. **Cross-component consistency (K-022 A-12 scope completion)** — Grep confirms no other `/about` components carry dark-theme residuals. Architect Pre-check item 3 resolved.
6. **testing pyramid `<span>`** — currently `text-gray-300` on font-mono. Per Pre-check: Architect decides between `text-charcoal` (prominence, matches layer label treatment in PillarCard per PillarCard.tsx L22-L25 `text-paper` on `bg-charcoal`) or `text-ink` (direct tonal match with body). → **PM rules text-ink** for the layer span (same as body treatment; avoids visual hierarchy conflict with the bold sibling li). Documented below.
7. **CardShell border/bg isolation** — PillarCard pattern confirms `CardShell` neutral on text color; children drive their own. No inheritance surprise.

**Supplement to AC (PM will patch):**
- AC-029-ARCH-BODY-TEXT Then/And rewritten with explicit RGB allow/disallow lists.
- AC-029-TICKET-BODY-TEXT Then/And rewritten with explicit RGB allow/disallow lists.
- AC-029-REGRESSION unchanged.

**Known Gap declared:**
- **KG-029-01** — Playwright selector stability for new color assertions: no `data-testid` mandated in AC; Engineer may introduce testids or use structural anchors. QA sign-off will confirm chosen path.

**Next time improvement:** If future PM session lacks Agent-tool access, escalate to user to re-spawn main session with full capabilities BEFORE starting BQ resolution. This session accepted the capability gap and mitigated via explicit simulation disclosure, but the upstream fix is session permission hygiene (see memory `feedback_pm_session_capability_pre-flight`).

## 2026-04-22 — K-024 Phase 3 final sign-off

**What went well:** Full regression + Phase 3 sign-off gate completed cleanly on the R2 fix-batch commit 3201622 — tsc 0, Vitest 81/81, Playwright 224 pass / 1 skipped / 0 fail (225 total; +1 from T-C6 mobile hidden-asserts vs Phase 1+2 baseline of 190). All 21 Sacred-bearing tests (K-017 NavBar + K-021 body-paper / fonts + K-023 DevDiarySection marker 20×14 borderRadius 0 + K-028 entry-wrapper 3-marker + DEV DIARY heading at 0-entry + section-spacing + no-overlap + rail-visible + empty-boundary) green without remediation. All six R2 fix items (I-3 dispatchEvent-in-single-tick gate test, D-2 Retry toBeDisabled during in-flight refetch, I-1/I-2 combined T-C6 DiaryMarker + DiaryRail display:none at 390px, I-5 entry-date letterSpacing + entry-body fontWeight/lineHeight catchall extension, D-4/M-5 design doc diary-main row + count 33→41 sync) verified present in spec + design doc. visual-spec.json SSOT consumption confirmed: `readFileSync + JSON.parse` in `diary-page.spec.ts` + const re-export via `timelinePrimitives.ts` — zero hardcoded px/hex in Phase 3 spec file. em-dash U+2014 delimiter integrity preserved end-to-end (visual-spec `textPattern: "K-XXX — <title>"` → `DiaryEntryV2.tsx` L21 + `DevDiarySection.tsx` L122 → dev-server screenshot titles `K-022 — About page structure…`). Dev-server screenshots at 1440 desktop + 390 mobile both visually align with wiDSi + N0WWY Pencil frame geometry (rail inset 40/40, marker 20×14 cornerRadius 6 on /diary, cornerRadius 0 on Homepage Sacred deviation, Bodoni/Newsreader/Geist Mono 3-font catchall per role).

**What went wrong:** Pencil MCP tool calls (`mcp__pencil__open_document`, `get_screenshot`, `batch_get`) registered as unavailable in this session despite the MCP server instructions block being attached — could not capture pixel-level Pencil frame screenshots for side-by-side diff. Executed the three-step offline fallback per QA persona rule (positive delta grep + schema parity + explicit Known Gap declaration), with dev-server screenshot comparison as the visual substitute. Separately: `npx playwright test e2e/visual-report.ts` WITHOUT `TICKET_ID` during the initial full-suite run wrote `K-UNKNOWN-visual-report.html` inline as a side-effect (harmless — overwritten by the explicit TICKET_ID=K-024 rerun, but easy to forget and noisy).

**Next time improvement:**
1. When Pencil MCP tools register but don't respond to calls, try one `get_editor_state` as a probe FIRST before starting any Pencil-dependent step — fail fast and jump to the offline fallback rather than discovering the gap mid-flow. Codify in `qa.md` §"Pencil visual comparison" as a new pre-flight line: "Before `open_document`, probe via `get_editor_state` — timeout / error → offline fallback activated immediately".
2. The visual-report.ts side-effect in the full suite writes `K-UNKNOWN-visual-report.html` whenever `TICKET_ID` env is absent, polluting `docs/reports/`. Propose (as PM Tech Debt candidate, not QA fix scope): either gate visual-report.ts behind a `--grep` filter so it's skipped in the default `npx playwright test` run, or have it read TICKET_ID from branch name (`git rev-parse --abbrev-ref HEAD`) as a fallback before `K-UNKNOWN`. Not blocking; log as TD.
3. Phase-3 sign-off should formally cross-check: any production-code change made in the R2 fix batch (here `useDiary.ts` setError ordering + `DiaryEntryV2.tsx` tracking-wide → tracking-[1px]) must have a corresponding new test assertion that FAILs without the production change. T-L4 covers setError ordering (holds the in-flight promise open and asserts `toBeDisabled` which would not fire if Retry unmounted); T-E6 letterSpacing assertion covers the tracking fix. Both covered in this session, but add to QA checklist as a formal row: "R2 production-code changes cross-checked against new test FAIL-without-change coverage".


## 2026-04-22 — K-024 Phase 1+2 Post-R1 Regression Sign-off

**What went well:** Full gate (tsc 0 / Vitest 81/81 / Playwright 190 passed / 1 skipped / 0 fail) green in a single pass after the R1 remediation commit 694510c, including the new diary.legacy-merge.test.ts (6 tests) which precisely validates the Option B amendment (title-literal pin + non-legacy key-absent permitted). Legacy-merge test coverage directly asserts all five PM-locked constraints (exactly-one, title literal, date 2026-04-16, 50–100 word count, ticketId key-absent at raw JSON level) plus the new non-legacy key-absent allowance — complete coverage of AC-024-LEGACY-MERGE. R1 remediation did not introduce any new regression: K-017/K-021/K-023/K-027 Sacred assertions (NavBar order, AC-021-BODY-PAPER, AC-021-FONTS, DevDiarySection 3-marker, AC-028-MARKER-COUNT-INTEGRITY, diary-mobile flex-col/break-words) all remained green, confirming the minimum-touch Phase 1+2 reshape strategy held through remediation.

**What went wrong:** Nothing observed in this sign-off pass; R1 findings were resolved cleanly and no residual regression surfaced. Pre-existing 1 skipped Playwright test is inherited from main (not introduced by K-024) — acceptable per invocation. No cross-ticket boundary violations detected.

**Next time improvement:**
1. For Option-B-style AC amendments that relax a uniqueness constraint (here: "other ticketId-key-absent entries permitted"), the regression test suite should include at least one positive assertion that the relaxation is exercised in production data — the 6th legacy-merge test correctly does this by counting `!('ticketId' in e)` in raw JSON. Codify as a QA check pattern: whenever an AC amendment introduces a permissive clause, verify the test either exercises the permissive branch on production fixtures or adds a synthetic fixture that does.
2. Visual report was generated with TICKET_ID=K-024 correctly; filename `K-024-visual-report.html` confirmed. No action needed — existing persona step worked.
3. Phase 3 sign-off (future PR) will introduce DiaryPage rewrite + 6+ Playwright specs (T-L1..T-L5 loading/error/empty/retry/long-message, timeline-structure, entry-layout, page-hero, content-width, homepage-curation, diary-page-curation). Pre-commit to running all boundary fixtures (entry = 0/1/3/5/10/11) as separate Playwright specs rather than parametrized, to match the PM-enforced enumeration in AC-024-DIARY-PAGE-CURATION.


## 2026-04-22 — K-024 Early Consultation Round 2

**What went well:** Architect's design doc §6.3 + §6.4 delivered concrete contracts for all three states (DiaryLoading wrapping LoadingSpinner label="Loading diary…", DiaryError with canonical fallback literal "Couldn't load the diary right now. Please try again." + "Retry" button + onRetry prop, DiaryEmptyState literal "No entries yet. Check back soon.") — every selector / literal / retry semantic needed for a Playwright spec is unambiguous in a single authoritative table. Confirmed visual-spec.json does NOT need loading/error roles (thin wrappers around existing LoadingSpinner/ErrorMessage — no new visual primitive), preventing a false Challenge about missing role entries. Cross-checked useDiary hook error classification (§4.1 L307-310) against DiaryError error-classification-scope (§6.3 L572-578) — matched: 4xx/5xx, network TypeError, JSON parse, timeout, no-auto-retry all consistent across both sections.

**What went wrong:** Discovered PM skipped Unblock Protocol step 2 — the AC-024-LOADING-ERROR-PRESERVED text in the ticket at line 337 remains verbatim DEFERRED ("Blocked on Architect design"); PM jumped from step 1 (Architect design delivered) directly to step 3 (QA Round 2 invoked) without executing step 2 (supplement Given/When/Then into AC body). QA cannot testability-review an AC that still reads "Blocked…Architect must deliver…"; the concrete contracts live only in the design doc, not in the AC. Separate issue: Architect's §6.3 introduces DiaryError retry button (line 559 props `onRetry`, line 563 `<button>Retry</button>`) — this is net-new behavior not in the pre-DEFERRED AC scope (original AC only said "沿用既有 UX"); no AC currently asserts retry click → re-fetch → loading-reappears-then-resolves flow, so this behavior ships untested unless PM supplements AC. Third issue: `<DevDiarySection>` on Homepage is stated to "preserve loading/error gates" (§6.2 L473) but no AC specifies Homepage loading/error selectors — only /diary page is contract-covered; Homepage error could silently render nothing and pass all tests.

**Next time improvement:**
1. **Round 2 pre-flight MUST read the AC text itself** — don't assume "PM invoked Round 2" means PM completed all protocol steps. Before boundary sweep, grep the AC section and verify Given/When/Then has been written; if still DEFERRED text, halt Round 2 and return single Challenge ("AC body not supplemented") rather than attempting full review. Codify in `qa.md` Early Consultation: pre-flight check 1 = read target AC body, pre-flight check 2 = verify design doc exists, both must pass before boundary sweep runs.
2. **Cross-scope coverage check for shared components** — when design doc mentions "X preserved" on a route NOT covered by the AC under review (e.g., DevDiarySection Homepage loading/error per §6.2), raise as QA Interception to PM asking whether the un-covered scope needs a parallel AC or explicit Known Gap. Codify in `qa.md` Boundary Sweep: add 8th row "Cross-route coverage — component X exists on routes A and B, AC covers only A; is B in scope or Known Gap?"
3. **Novel-UX-element detection in design doc** — when Architect's design doc introduces a UX element not in the pre-deferred AC text (retry button / auto-retry / anything actionable), QA must raise Interception before PASS. This goes beyond "AC matches design" to "design matches AC+reasonable user expectation"; don't let design-introduced features bypass AC coverage just because design mentions them in prose. Codify in `qa.md` Round 2 checklist: diff the AC pre-DEFERRED-text vs the design doc's component section; every behavior in design not traceable to an AC clause = mandatory Interception.

## 2026-04-22 — K-024 Early Consultation Round 1

**What went well:** Visual-spec.json SSOT pattern caught the PRD line 385 middle-dot vs em-dash drift in cross-check — without JSON to anchor against, this would have reached Engineer and produced a shipped bug. Cross-verified every AC citation against `K-024-visual-spec.json` in a role-by-role table (10 roles / 2 frames: wiDSi + N0WWY); all role references match exactly, no SSOT drift on in-ticket AC. Full 7-type boundary sweep executed (not just "happy path") and found 6 of 7 types had gaps — forced PM to address empty-list / concurrency / special-chars cases before Architect release. Produced 11 concrete Challenges with specific "needs supplementation" wording so PM could Edit the AC directly without re-analysis.

**What went wrong:** 10 of 12 AC (83%) needed supplementation at first review; 6 of 7 boundary types had gaps. Root cause: PM wrote AC against the visual-spec.json citation catchall pattern (good) but did not independently sweep the boundary table or cross-check mobile scope consistency or enumerate empty/concurrency cases. AC-024-LOADING-ERROR-PRESERVED was released for QA review before Architect had defined selectors, creating a circular untestable — had to be deferred as a whole, requiring a QA Round 2 after Architect design lands. Only 1 AC (AC-024-PAGE-HERO) passed cleanly.

**Next time improvement:**
1. PM Phase Gate pre-flight checklist (codify in `pm.md`): before invoking QA Early Consultation, PM must self-run the 7-type boundary sweep table (empty / min-max / special-chars / API-fail / network / concurrency / list-size) and produce a coverage map. Any AC released with obvious empty/concurrency gaps → bounce back without QA cycles.
2. Any AC that references "既有 UX" / "既有機制" / "existing component" without a stable selector must carry a `blocked-on: architect-design` marker and be excluded from Early Consultation Round 1 (review only Architect-dependent AC in a subsequent Round 2). Codify in `pm.md` AC authoring template.
3. Cross-document drift check: when AC text is edited in ticket, PM runs `diff <(grep AC-024-ENTRY-LAYOUT docs/tickets/K-024.md) <(grep AC-024-ENTRY-LAYOUT PRD.md)` — the middle-dot vs em-dash drift would have been caught automatically. Codify as `pm.md` DoD before marking AC revision complete.
4. Visual-spec SSOT cross-check (role-by-role table) must be a standard artifact in every QA Early Consultation report for any UI ticket with a visual-spec.json — codify in `qa.md` Early Consultation section.

## 2026-04-21 — K-013 Round 2 Regression Pass

**做得好：** Round 2 gate 全綠一次過（tsc 0 / vitest 45 / pytest 68 / playwright full 173+1 skipped / K-013 spec 4/4），未停在第一個 fail 就中止；K-013 spec 4 cases（full-set / subset / empty matches / <2 bars fallback）直接對應 AC-013-APPPAGE-E2E 的四態斷言，regression 範圍完整。Visual report 5 route 全部截圖成功，輸出至 `docs/reports/K-013-visual-report.html`。Ticket §Pencil 設計稿檢查明確將本票標為 zero-visual-change exemption，sign-off 未錯誤要求 Pencil frame cross-check。

**沒做好：** 嘗試跑「browser smoke beyond Playwright」以人手操作 /app live stack（實上傳 CSV + Start Prediction）時，發現 file input 並非本 app 的 OHLC 資料入口（按鈕維持 disabled，需透過 official CSV source / 手動 rows 才能觸發），smoke spec 跑 30 秒 timeout。無預先閱讀 AppPage 上傳流程，直接照任務單的步驟 pseudo 化 E2E 操作；雖最後移除了 ad-hoc spec 沒汙染 repo，但浪費了一次時間。

**下次改善：** 未來任何 QA 要寫 "live smoke beyond mocks" 的 one-off spec 前，先 `grep -r "setInputFiles\|file input" frontend/e2e/` 找到現有 happy-path spec 的上傳實作照抄，不自己推理 DOM 入口。若 E2E spec 已完整覆蓋（K-013 spec 就是此例），不應再疊加人手 smoke — 以 spec + visual-report 兩線交付就足夠，並在 QA report 註記「live smoke = K-013 spec + visual-report 替代，pure refactor 不另行人手走查」。

## 2026-04-21 — K-030 /app page isolation (final regression)

**做得好：** Pencil v1 `ap001` frame 於本 session 透過直接讀 `frontend/design/homepage-v1.pen` JSON 確認 `fill: #030712`，對照 dev screenshot `/app` wrapper bg 視覺判讀吻合（同時 Playwright T4 已 assert `rgb(3, 7, 18)`）；mcp__pencil 工具不可用時以 .pen JSON 直讀替代，完成 AC-030-PENCIL-ALIGN 視覺比對。主動為 mobile (375px) + tablet (768px) viewport 補 `/app` isolation 驗證（寫入臨時 spec，執行後刪除），補 persona Boundary Sweep viewport 維度；mobile NavBar App link `target=_blank` 亦確認。

**沒做好：** Full Playwright suite `npx playwright test` 跑時 webServer 不帶 `TICKET_ID` 環境變數，`visual-report.ts` fallback 產出 `K-UNKNOWN-visual-report.html` 汙染 `docs/reports/`。QA 驗到尾端才發現並手動 rm + 補跑 `TICKET_ID=K-030 npx playwright test visual-report.ts`。

**下次改善：** 建議於 `frontend/e2e/visual-report.ts` 加 hard gate — `TICKET_ID` 未設時 `throw new Error('TICKET_ID not set')`，不 fallback K-UNKNOWN；或於 QA persona Step 1 改為「必先 export TICKET_ID=K-XXX 再跑 full suite」硬規則。屬 shared tooling，回報 PM 評估另開 TD 票處理。另發現 `frontend/public/diary.json` 存在繁中 milestone 名稱（違反 feedback_diary_json_english），屬 K-021/K-022/K-023 遺留，與本票 scope 無關，僅備註給 PM 參考。

## 2026-04-21 — K-031 /about 移除 Built by AI showcase section

**做得好：** PM 已預先核定 targeted scope（about-v2 + about + pages 三 spec + 2 route 視覺驗證），QA 不盲目跑 full suite；tsc 0 errors + 95 passed / 1 skipped / 0 failed；獨立 visual spec 直接 evaluate document 的 8 個候選 section id，讀到的順序與 Architect 設計文件 §3 File Change List 的 7 SectionContainer 列完全一致（header → metrics → roles → pillars → tickets → architecture → footer-cta）；homepage banner 點擊 → `/about` SPA 導航一起驗；Pencil `.pen` JSON grep 對 `banner-showcase` / `Built by AI` 零命中，與 codebase parity 對齊。

**沒做好：** 依賴 JSON grep 做 Pencil parity（MCP 目前不可用），無法驗視覺層 — 例如若 .pen 裡殘留空白 frame 或 placeholder rect 但移除了文字 label，單純 text grep 會 false-green。本次是純刪除 ticket，風險可接受，但已登 Known Gap。

**下次改善：** 當 Pencil MCP `get_screenshot` 不可用時，QA Pencil parity 檢查應改為：(1) JSON grep 移除項零命中，(2) JSON top-level frame children count 對照設計文件預期 section 數，(3) 明確在 retrospective 宣告「視覺層未驗（MCP offline）」。已將第三點 codify 到 `~/.claude/agents/qa.md` 的 Mandatory Task Completion Steps 0 之下（若 MCP offline 則明文宣告 + grep fallback 最低門檻）— 下次做此類 ticket 時必照此步驟。


## 2026-04-21 — K-028 Regression Sign-off

**What went well:** Full Playwright suite 186 passed / 1 skipped / 0 failed (1 pre-existing skip is AC-017-BUILD, requires production build, not a regression hole). K-023 regression confirmed: AC-023-DIARY-BULLET (3 markers 20×14 / rgb(156,74,59) / borderRadius 0), AC-023-STEP-HEADER-BAR (STEP 01/02/03 all PASS, Geist Mono 10px + bg charcoal + paper text), AC-023-BODY-PADDING (desktop 72/96/96/96 + mobile 375px 32/24) all PASS post flex-col refactor. K-028 ACs: AC-028-MARKER-COORD-INTEGRITY + AC-028-MARKER-COUNT-INTEGRITY + AC-028-SECTION-SPACING (desktop 1280 + tablet 640/639 breakpoint boundary + mobile 375) + AC-028-DIARY-ENTRY-NO-OVERLAP (desktop + mobile first 3 entries) + AC-028-DIARY-RAIL-VISIBLE + AC-028-DIARY-EMPTY-BOUNDARY (0 entries + 1 entry) all PASS. Footer visibility manual probe at `/` scroll-to-bottom: desktop 1280 footer bbox y=617 visible, mobile 375 footer bbox y=313 visible — KG-028-02 mitigation holds. Visual report generated at `docs/reports/K-028-visual-report.html` with correct TICKET_ID. Pencil frame `4CsvQ` hpBody.gap=72 confirmed matches AC-028-SECTION-SPACING desktop 72px assertion (Architect extraction validated).

**What went wrong:** Stale `K-UNKNOWN-visual-report.html` remains in `docs/reports/` from an earlier run that forgot TICKET_ID env var. Did not auto-clean; noise for PM reviewing report dir. Separately, KG-028-01 (long-word overflow in Summary text on 375px) remains untested as registered Known Gap — no new test case added; boundary behavior is assumption-only.

**Next time improvement:** Before running visual-report, `rm -f docs/reports/K-UNKNOWN-visual-report.html` to prevent stale artifacts from prior TICKET_ID-less runs polluting the dir. Codify in `qa.md` persona: screenshot step explicitly deletes any `K-UNKNOWN-*.html` before running the new report.

## 2026-04-21 — K-028 Early Consultation (AC testability review)

**What went well:** Caught PM frontmatter mis-ruling (`qa-early-consultation: N/A`) that violated the "QA Early Consultation every PRD, not only edge-case AC" rule. Surfaced 5 boundary/regression gaps before Engineer started: tablet breakpoint missing, rail-visible guard buried in Architect doc without an AC, empty / 1-entry / 2-entry diary not explicit in AC, K-023 marker assertions re-run is implicit only, and `data-testid="diary-marker"` DOM-nesting change (marker moves from absolute-child-of-outer-wrapper to child of new entry wrapper) — existing K-023 spec still selects by testid so pass is expected, but bounding-box coordinate space changes need explicit regression confirmation.

**What went wrong:** PM shipped `qa-early-consultation: N/A — reason: all ACs are happy-path layout fix` on the ticket frontmatter. The rule `feedback_qa_early_mandatory.md` explicitly says not limited to edge-case AC; layout ticket still needs QA review because (a) diary.json content mutation is an implicit input domain and (b) any CSS refactor that removes DOM structure (absolute-positioned content wrapper deleted, replaced with `pl-[92px]` padding) risks silent breakage of coordinate-based assertions in existing specs. PM skipped QA; consultation only happened after user flagged the protocol breach.

**Next time improvement:** PM Phase Gate must treat `qa-early-consultation` as mandatory-yes — any "N/A — reason: happy path" value is an automatic violation and the ticket is bounced back. Codify in `pm.md`: the frontmatter field accepts only (a) a reference to a QA Early Consultation report/section, or (b) "skipped by user explicit override — ___". Layout/visual tickets specifically must not claim N/A — layout changes can break existing specs through DOM coordinate shifts even when AC is happy-path.

---

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
