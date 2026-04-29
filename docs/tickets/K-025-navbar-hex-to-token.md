---
id: K-025
title: UnifiedNavBar hex → token 遷移 + navbar.spec.ts regex 同步更新
status: done
closed: 2026-04-22
type: refactor
priority: medium
created: 2026-04-20
source: K-021 Reviewer 合併報告 W-3（TD-K021-02）
visual-spec: "N/A — reason: zero-visual-change refactor (hex→token equivalence at rendered-color level; values sourced from K-021 homepage-v2.pen NavBar frame). Note: the K-021 Q2 ruling stated 'compiled CSS identical', QA corrected this to 'computed color identical, selector name differs' (arbitrary-value vs named class); therefore this ticket's AC uses `toHaveCSS('color', ...)` + dist/assets CSS declaration grep as equivalence evidence."
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-025 — 4 recommendations integrated into AC (Q1 CSS declaration grep in AC-025-REGRESSION / Q2 aria-current + toHaveCSS 雙條件 drop class-name regex / Q3 /business-logic no-active-link assertion / blocker inactive `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')` 取代寬鬆 regex)
---

## 背景

K-021 交付時 `UnifiedNavBar.tsx` 保留 7 處 hex literal（3 個 distinct color：`#9C4A3B` / `#1A1814` / `#F4EFE5`），`navbar.spec.ts` 有 5 處 class-name regex 斷言（`/text-\[#9C4A3B\]/` × 2 + `/text-\[#1A1814\]/` × 3）鎖定該寫法。PM 2026-04-20 Q2 裁決允許保留，理由為「`text-[#9C4A3B]` 與 `text-brick-dark` 編譯後 CSS 相同，保留不動可避免 K-005 navbar.spec 5 處 regex 回歸」。

但 K-021 Reviewer 合併報告 W-3 指出：此保留與使用者 prompt「嚴禁 hardcode hex」衝突，屬 token 集中管理原則的缺口。PM 本票獨立開票，一次性遷移 NavBar + spec，避免污染 K-021 fix-now 批次。

**依賴：** K-021 fix-now 完成後啟動（K-021 reviewer fix 批次含 C-1~C-4 + W-2 + S-3）。

## 範圍

**含：**

1. **`UnifiedNavBar.tsx` 所有 hex → token 遷移**（token 全部已在 K-021 Tailwind config 註冊；完整對照表由 Engineer 執行前 `grep -E '#[0-9A-Fa-f]{6}' frontend/src/components/UnifiedNavBar.tsx` 列出）：
   - `text-[#9C4A3B]` → `text-brick-dark`（active state）
   - `text-[#1A1814]` → `text-ink`（主文色 + hover target）
   - `bg-[#F4EFE5]` → `bg-paper`（nav background）
   - `border-[#1A1814]` → `border-ink`（nav bottom border）

2. **`navbar.spec.ts` 5 處 class-name regex 斷言汰換為雙軌斷言**（QA Early Consultation Q2 採納）：
   - **drop** 既有 class-name regex（`/text-\[#9C4A3B\]/` × 2 + `/text-\[#1A1814\]/` × 3）— 類名斷言為最弱中間層，無法驗證 React state 正確 + 無法驗證 Tailwind token 正確解析
   - **加入雙軌**：
     - Active：`[aria-current="page"]` attribute 斷言（驗 React state）+ `toHaveCSS('color', 'rgb(156, 74, 59)')`（驗 rendered color）
     - Inactive：`toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')`（取代 `/text-\[#1A1814\]/` 寬鬆 regex，後者 post-refactor 仍會匹配 `text-ink/60` 而無法偵測 state-swap bug）

3. **補 `/` route inactive color 3 斷言**（合併 TD-K021-09，統一用 Q2 雙軌寫法）：
   - `/` 路由下 App / Diary / About 三項，各自 `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')`

4. **補 `/business-logic` route active 斷言**（QA Q3 採納 + PM 裁決）：
   - 預期行為：`/business-logic` 為 Prediction hidden route，NavBar 任何 link 都不應有 `aria-current="page"`（含 Home，因 `pathname !== '/'`；含 App/Diary/About 因 `pathname` 不匹配）
   - 斷言：`await expect(page.locator('[aria-current="page"]')).toHaveCount(0)`
   - PM rationale：此為 K-021 起既存 coverage gap，一次收齊避免再開票

**不含：**
- NavBar 結構改動（順序 / 新項 / icon 換）— 非 scope
- 其他頁面 hex 遷移（由 K-022/K-023/K-024 自管）

## Acceptance Criteria

### AC-025-NAVBAR-TOKEN：NavBar 零 hex `[K-025]`

**Given** 開發者 grep `UnifiedNavBar.tsx`
**When** 搜尋 `#[0-9A-Fa-f]{6}` pattern
**Then** 返回結果數 = 0
**And** 所有顏色 / 邊框 / 背景 class 均為 K-021 token（`text-ink` / `text-brick-dark` / `bg-paper` 等）
**And** `npx tsc --noEmit` exit 0
**And** `npm run build` 成功

### AC-025-NAVBAR-SPEC：斷言升級至雙軌（attribute + computed color） `[K-025]`

**Given** `navbar.spec.ts` 5 處既有 class-name regex（`/text-\[#9C4A3B\]/` × 2 + `/text-\[#1A1814\]/` × 3）被汰換，改以 attribute + computed color 雙軌斷言
**When** 執行 `npx playwright test navbar.spec.ts`
**Then** 所有既有 test case 通過（K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR）
**And** active state 斷言為雙條件：`toHaveAttribute('aria-current', 'page')` + `toHaveCSS('color', 'rgb(156, 74, 59)')`（不保留 class-name regex）
**And** inactive state 斷言為 `toHaveCSS('color', 'rgba(26, 24, 20, 0.6)')`（不再用 `/text-\[#1A1814\]/` 寬鬆 regex）
**And** 新增 `/` route desktop inactive 3 斷言（App / Diary / About 各自 computed color），補 TD-K021-09
**And** 新增 `/business-logic` route active 斷言：`page.locator('[aria-current="page"]').toHaveCount(0)`（驗 hidden-route behavior）
**And** Prediction hidden 既有斷言（AC-021-NAVBAR 2 處）不重複新增，保持原 `toHaveCount(0)` 寫法

### AC-025-REGRESSION：既有功能無回歸 + CSS output 等價性 `[K-025]`

**Given** K-021 所有 AC（AC-021-*）為 PASS
**When** 本票實作完成
**Then** K-021 所有 Playwright 斷言仍 PASS
**And** K-005 AC-NAV-1~5 仍 PASS
**And** 其他頁面 E2E 不回歸
**And** 編譯後 CSS 颜色宣告數等價（QA Q1 採納）：refactor 前後各跑一次 `npm run build`，比對 `dist/assets/*.css` 中 `color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814` 宣告數 pre == post（證明僅 selector 名稱改變、computed value 不變）

## 相關連結

- [K-021 ticket](./K-021-sitewide-design-system.md)（前置依賴）
- [K-021 Reviewer W-3 findings](../reports/)（待 Reviewer 報告歸檔）
- [tech-debt TD-K021-02](../tech-debt.md#td-k021-02--unifiednavbar-hardcode-hex-k-025)
- [tech-debt TD-K021-09](../tech-debt.md#td-k021-09--route-navbar-inactive-color-未斷言)

## Retrospective

### Engineer (2026-04-22)

**AC judgments that were wrong:** None — all 3 ACs (NAVBAR-TOKEN / NAVBAR-SPEC / REGRESSION) matched implementation behavior exactly.

**Edge cases not anticipated:** The AC-025-REGRESSION grep pattern (`color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`) is a narrow proxy for equivalence, not a comprehensive check. Tailwind emits `rgb(R G B / var(--tw-*-opacity, 1))` for most utilities (both arbitrary-value and named) — the lowercase `prop:#hex` form only appears for opacity-modified variants like `/60` which produce `#1a181499`-style alpha bytes. The pre==post invariant happens to hold because opacity-modifier usage is 1:1 mapped (NavBar had one `/60` consumer, still has one `/60` consumer). Did not invalidate outcome but is under-documented; see retrospective log improvement.

**Next time improvement:** On Tailwind-refactor tickets, do the pre-baseline grep + inspect 2–3 matched/unmatched declarations BEFORE running the refactor (not after), so any gap between "what grep captures" vs "what the equivalence claim requires" surfaces before edits land. Widen the grep to also cover `rgb(R G B ` forms (the actual SSOT for non-opacity utilities) when needed.

### PM Final Summary (2026-04-22)

**Flow:** PM releases (post-QA Early Consultation 4 recommendations integrated into AC) → Architect design doc + pre-existing L433 drift fix → Engineer implementation (3 Edit hunks on UnifiedNavBar + 5 hunks on navbar.spec) → Reviewer Step 1 (breadth) 0C/0W/2S + Step 2 (depth) 0C/1W/2S → QA final sign-off PASS-with-Known-Gap.

**Rulings made:**
- W-1 (AC grep-pattern degeneracy for 2 of 4 patterns) → **Accept as TD-K025-01**; behavior-diff truth table + dual-rail assertions independently prove equivalence, grep is only auxiliary monitoring. Codified into `reviewer.md` §Pure-Refactor Behavior Diff + `qa.md` §Early Consultation to prevent repeat; memory `feedback_refactor_ac_grep_raw_count_sanity.md` added.
- S-1 (optional Home aria-current positive on `/` inactive test) → **Skip**; AC-021-NAVBAR L271 already covers Home active on `/`.
- S-2 (Engineer retrospective AC judgment revision) → **Skip**; Engineer retrospective already honestly disclosed the proxy-degeneracy under "Edge cases not anticipated" + "Next time improvement".

**Final gate result:** 192 passed / 1 skipped / 0 failed full suite; tsc exit 0; `npm run build` exit 0; 4 marketing routes visual check SKIPPED per `visual-spec: N/A` exemption (zero rendered-color change).

**Persona edits this ticket:** `~/.claude/agents/reviewer.md` (grep raw-count sanity hard gate), `~/.claude/agents/qa.md` (Early Consultation grep baseline sanity hard step).

---

## Deploy Record

**Date:** 2026-04-22
**Merge commit:** `37b8e18` (main)
**Firebase Hosting:** https://k-line-prediction-app.web.app (release complete)
**Bundle:**
- `dist/assets/index-Ck55VN8m.js` — 114.71 kB (gzip 38.51 kB)
- `dist/assets/index-Ds_VjIoB.css` — 44.21 kB (gzip 7.80 kB)
- Vendor chunks: react / charts / markdown unchanged
- CSS bundle delta: -210 bytes vs pre-K-025 (arbitrary-value selector dedup)

**Production CSS declaration probe (post-deploy, `curl … | grep -oE … | wc -l`):**

| Pattern | Expected (design §5.2) | Observed (prod) | Gate |
|---|---|---|---|
| `color:#9c4a3b` | 0 (arbitrary-value form absent) | 0 | ✅ |
| `color:#1a1814[0-9a-f]{0,2}` | 7 (opacity-modifier `/60` alpha-byte form) | 7 | ✅ |
| `background-color:#f4efe5` | 0 (arbitrary-value form absent) | 0 | ✅ |
| `border-color:#1a1814` | 3 | 3 | ✅ |
| `.text-brick-dark` named selector | ≥ 1 | 1 | ✅ |
| `.bg-paper` named selector | ≥ 1 | 1 | ✅ |
| `.border-ink` named selector | 3 | 3 | ✅ |

**Gates:** HTTP 200 from prod root; etag `25af1516…` 2026-04-22 06:00:19 GMT; all 7 probes match design doc prediction. Rendered-color equivalence with pre-refactor main branch confirmed via named-selector-vs-arbitrary-value parity + identical declaration counts for opacity variants.

**Out of scope (deferred):** TD-K025-01 grep pattern sanity (future Tailwind refactor tickets inherit codified reviewer/qa hard gates); hover/focus pseudo-state visual coverage (future NavBar ticket with active-state scope).
