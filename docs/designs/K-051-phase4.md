# K-051 Phase 4 — Architect Design Doc

**Author:** senior-architect (Claude Opus 4.7)
**Date:** 2026-04-26
**Worktree:** `.claude/worktrees/ops-daily-db-backfill/`
**Branch:** `ops-daily-db-backfill` (outer) / `fix-cloudbuild-rollup-musl` (inner) — Phase 4 appends to PR #23
**Scope:** AC-051-10 (predictor gate align) + AC-051-11 (toast `data-testid`) + AC-051-12 (UI Chinese → English)
**Status:** released to Engineer
**Sacred regressions in play:** K-015 (`ma_history requires at least 129 daily bars ending at that date`) — message text + behavioral threshold both pinned post-Phase-4

---

## 0 Scope Questions

None. PM ruled B1–B4 inline into AC-051-10 / AC-051-12 on 2026-04-26 (ticket §User Ruling 2026-04-26 / §PM Ruling 2026-04-26). All AC-text gaps QA Early Consultation flagged are already encoded.

Architect did not modify ticket AC (per `feedback_ticket_ac_pm_only.md`).

---

## 1 Pre-Design Audit (per `feedback_architect_pre_design_audit_dry_run.md`)

All citations against HEAD = `bdc397c docs(K-051): Phase 3 close — ticket status done` (= K-051 Phase 3 close, last commit before Phase 4 starts).

### 1.1 Backend predictor.py — gate + callsites

| Site | HEAD line | Verbatim code at HEAD | Phase 4 target |
|------|-----------|----------------------|---------------|
| MA constants declaration | predictor.py:8 | `MA_WINDOW = 99` | unchanged |
| MA trend-window constant | predictor.py:11 | `MA_TREND_WINDOW_DAYS = 30` | unchanged |
| Gate inside `_fetch_30d_ma_series` | predictor.py:155-157 | `combined_closes = _extract_closes(prefix_bars) + _extract_closes(window_bars)`<br>`if len(combined_closes) < MA_WINDOW:`<br>`    return []` | **EDIT line 156** — change comparison to `MA_TREND_WINDOW_DAYS + MA_WINDOW` |
| Query-side caller (raises Sacred) | predictor.py:331-336 | `query_30d_ma = _fetch_30d_ma_series(input_end_time, ma_history)`<br>`if not query_30d_ma:`<br>`    raise ValueError(`<br>`        f"Unable to compute 30-day MA99 trend for {input_end_time}: "`<br>`        "ma_history requires at least 129 daily bars ending at that date."`<br>`    )` | **EDIT line 335** — convert string literal to f-string referencing constants |
| Candidate-side caller (skips via `continue`) | predictor.py:343-345 | `candidate_30d_ma = _fetch_30d_ma_series(candidate_end_time, ma_history, _1d_index)`<br>`if not candidate_30d_ma:`<br>`    continue` | **NO CODE CHANGE** — the gate change at line 156 implicitly tightens this path; existing `if not candidate_30d_ma: continue` is still correct. Behavior shift documented in §8 Risks. |

**Verbatim git proof (read at HEAD via `git show HEAD:ClaudeCodeProject/K-Line-Prediction/backend/predictor.py | sed -n '<lines>p'`):**

```
# lines 150-160:
        return []

    prefix_start = max(0, window_start - MA_WINDOW)
    prefix_bars = ma_history_1d[prefix_start:window_start]

    combined_closes = _extract_closes(prefix_bars) + _extract_closes(window_bars)
    if len(combined_closes) < MA_WINDOW:
        return []

    ma_full = _rolling_mean(combined_closes, MA_WINDOW)

# lines 325-345:
        ma_history = history
    n = len(input_bars)
    if n < MIN_BARS_FOR_MA_TREND:
        raise ValueError(f"At least {MIN_BARS_FOR_MA_TREND} bars are required to compare trends.")
    query_candle_features = _candle_feature_vector(input_bars)
    input_end_time = _normalize_time(_bar_time(input_bars[-1]), '1D') if input_bars else ''
    query_30d_ma = _fetch_30d_ma_series(input_end_time, ma_history)
    if not query_30d_ma:
        raise ValueError(
            f"Unable to compute 30-day MA99 trend for {input_end_time}: "
            "ma_history requires at least 129 daily bars ending at that date."
        )
    query_direction = _classify_trend_by_pearson(query_30d_ma)
    _1d_index = _history_time_index(ma_history, '1D')
    results = []
    for i in range(0, len(history) - n - future_n):
        window = history[i:i + n]
        candidate_end_time = _normalize_time(_bar_time(window[-1]), '1D')
        candidate_30d_ma = _fetch_30d_ma_series(candidate_end_time, ma_history, _1d_index)
        if not candidate_30d_ma:
            continue
```

### 1.2 Frontend toast bar — DOM target

| Site | HEAD line | Verbatim code at HEAD | Phase 4 target |
|------|-----------|----------------------|---------------|
| AppPage error toast | AppPage.tsx:349-353 | `{errorMessage && (`<br>`  <div className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">`<br>`    ✗ {errorMessage}`<br>`  </div>`<br>`)}` | **EDIT line 350** — add `data-testid="error-toast"` attribute to the `<div>` |

### 1.3 CJK enumeration — full grep across `frontend/src/` + `frontend/e2e/` + `frontend/public/`

Pattern: `[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]` (matches `__tests__/diary.english.test.ts:16` CJK_REGEX exactly).

| # | File:Line | Excerpt | Class | Action |
|---|-----------|---------|-------|--------|
| 1 | `frontend/src/AppPage.tsx:363` | `Upload 1H CSV（可多選）` | (a) translate | `Upload 1H CSV (multi-select)` |
| 2 | `frontend/src/AppPage.tsx:379` | `<div className="mt-1 text-gray-200">多檔合併 · 每檔 24 × 1H bars · UTC+0</div>` | (a) translate | `<div className="mt-1 text-gray-200">Merged multi-file · 24 x 1H bars per file · UTC+0</div>` |
| 3 | `frontend/src/AppPage.tsx:399` | `` `${historyInfo['1H'].filename}（最新：${historyInfo['1H'].latest ?? 'N/A'} UTC+0）` `` | (a) translate | `` `${historyInfo['1H'].filename} (latest: ${historyInfo['1H'].latest ?? 'N/A'} UTC+0)` `` |
| 4 | `frontend/src/components/MainChart.tsx:33` | `const match = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(上午\|下午)\s+(\d{1,2}):(\d{2})$/)` | (b) preserve — code-internal regex parsing zh-TW user-pasted timestamps `上午`/`下午` (functional, not display); explicitly out-of-scope per AC-051-12 | NO CHANGE |
| 5 | `frontend/src/components/MainChart.tsx:38` | `if (meridiem === '上午') {` | (b) preserve — paired with row 4 regex; same functional path | NO CHANGE |
| 6 | `frontend/src/components/MainChart.tsx:264` | `? 'MA(99) 計算中…'` | (a) translate | `? 'MA(99) computing...'` (full-width `…` U+2026 → ASCII three-dot per B4) |
| 7 | `frontend/src/components/MainChart.tsx:270` | `⚠ MA99 資料缺失：{ma99Gap.fromDate} ~ {ma99Gap.toDate}（歷史前置資料不足 99 根）` | (a) translate + B4 full-width punct → ASCII | `⚠ MA99 data missing: {ma99Gap.fromDate} ~ {ma99Gap.toDate} (insufficient prior history, fewer than 99 bars)` |
| 8 | `frontend/src/components/PredictButton.tsx:16` | `maLoading: 'MA99 計算中，請稍候…',` | (a) translate + B4 (`，` → `,`; `…` → `...`) | `maLoading: 'MA99 computing, please wait...',` |
| 9 | `frontend/src/components/UnifiedNavBar.tsx:7-20` | JS comments (`項目順序（對齊設計稿 homepage-v2.pen）：` etc.) | (b) preserve — JS comments, non-display, code-internal docs; explicitly out-of-scope per AC-051-12 | NO CHANGE |
| 10 | `frontend/src/__tests__/diary.english.test.ts:9-16` | CJK regex range comments + literal `CJK_REGEX = /[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]/` | (b) preserve — regex character classes are functional gate, not display; explicitly out-of-scope | NO CHANGE |
| 11 | `frontend/src/pages/BusinessLogicPage.tsx:106` | `<LoadingSpinner label="載入內容中…" />` | (a) translate + B4 (`…` → `...`) | `<LoadingSpinner label="Loading content..." />` |
| 12 | `frontend/e2e/K-046-example-upload.spec.ts:105` | `const uploadingState = page.getByText(/上傳中/)` | (b) preserve — **NOT in AC-051-12 scope.** Asserts existing K-046 example-upload behavior (which still emits Chinese `上傳中` from upload-history flow); K-046 fixture/Chinese strings are out-of-scope this Phase. Engineer MUST NOT touch this line. | NO CHANGE |
| 13 | `frontend/e2e/app-bg-isolation.spec.ts:5-15` | JS comments | (b) preserve — non-display | NO CHANGE |
| 14 | `frontend/e2e/business-logic.spec.ts:80-85` | JS comments | (b) preserve | NO CHANGE |
| 15 | `frontend/e2e/sitewide-body-paper.spec.ts:9-58` | JS comments | (b) preserve | NO CHANGE |
| 16 | `frontend/e2e/sitewide-fonts.spec.ts:5-158` | JS comments + `test('HomePage body computed fontFamily 含 "Geist Mono" ...')` test description names | (b) preserve — non-AC-051-12 scope; this spec's Chinese descriptions are pre-existing K-021/K-040 cosmetics, not part of Phase 4. PM AC §AC-051-12 names exactly `ma99-chart.spec.ts` lines 188/194/238/247/268/274. Engineer MUST NOT bulk-translate other specs' descriptions. | NO CHANGE |
| 17 | `frontend/e2e/visual-report.ts:4-328` | JS comments + `'需登入，下期補（K-008 MVP 不做 auth fixture）'` etc. | (b) preserve — non-AC-051-12 scope | NO CHANGE |
| 18 | `frontend/e2e/ma99-chart.spec.ts:188` | `await expect(page.getByText(/MA99 資料缺失/)).not.toBeVisible()` | (a) translate — assertion regex must match new English string from row 7 | `await expect(page.getByText(/MA99 data missing/)).not.toBeVisible()` |
| 19 | `frontend/e2e/ma99-chart.spec.ts:194` | `await expect(page.getByText(/MA99 資料缺失/)).toBeVisible({ timeout: 5000 })` | (a) translate | `await expect(page.getByText(/MA99 data missing/)).toBeVisible({ timeout: 5000 })` |
| 20 | `frontend/e2e/ma99-chart.spec.ts:238` | `await expect(predictBtn).toHaveAttribute('title', 'MA99 計算中，請稍候…')` | (a) translate — title attribute string must match row 8 | `await expect(predictBtn).toHaveAttribute('title', 'MA99 computing, please wait...')` |
| 21 | `frontend/e2e/ma99-chart.spec.ts:247` | `test('MainChart shows MA99 計算中 label while loading, then value after load', async ({ page }) => {` | (a) translate — B3 test description gate | `test('MainChart shows MA99 computing label while loading, then value after load', async ({ page }) => {` |
| 22 | `frontend/e2e/ma99-chart.spec.ts:268` | `await expect(page.getByText('MA(99) 計算中…')).toBeVisible({ timeout: 3000 })` | (a) translate — must match row 6 string | `await expect(page.getByText('MA(99) computing...')).toBeVisible({ timeout: 3000 })` |
| 23 | `frontend/e2e/ma99-chart.spec.ts:274` | `await expect(page.getByText('MA(99) 計算中…')).not.toBeVisible({ timeout: 5000 })` | (a) translate | `await expect(page.getByText('MA(99) computing...')).not.toBeVisible({ timeout: 5000 })` |
| 24 | `frontend/e2e/about-v2.spec.ts:2-200` | JS comments + describe block titles | (b) preserve — non-AC-051-12 scope, K-022 cosmetics | NO CHANGE |
| 25 | `frontend/e2e/sitewide-footer.spec.ts:17-64` | JS comments | (b) preserve | NO CHANGE |
| 26 | `frontend/e2e/pages.spec.ts:362` | JS comment | (b) preserve | NO CHANGE |
| 27 | `frontend/e2e/navbar.spec.ts:6-279` | JS comments | (b) preserve | NO CHANGE |
| 28 | `frontend/e2e/_fixtures/mock-apis.ts:6-31` | JS comments + JSDoc | (b) preserve | NO CHANGE |
| 29 | `frontend/public/docs/ai-collab-protocols.md:141,143,153,165,167` | (c) JSON / markdown content quoted retro text | (c) JSON-equivalent / markdown data file. **NOT in AC-051-12 scope** — this is the public-mirror copy of `docs/ai-collab-protocols.md` (per architecture.md §Scripts & Public Protocols Doc); content is Engineer/Architect retro quotes. AC-051-12 scope is `frontend/src/` + `frontend/e2e/` (test description). Markdown content stays Chinese where original quote was Chinese. Flag-only — Engineer NO CHANGE. | NO CHANGE |

**Net translation actions:** 7 source-string edits (rows 1, 2, 3, 6, 7, 8, 11) + 6 spec-assertion edits (rows 18, 19, 20, 22, 23) + 1 spec test-description edit (row 21) = **14 edits** across **6 files** (`AppPage.tsx`, `MainChart.tsx`, `PredictButton.tsx`, `BusinessLogicPage.tsx`, `ma99-chart.spec.ts`, plus the toast `data-testid` add at `AppPage.tsx`).

**Post-edit verification grep:** the same `[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]` pattern run again must hit only the deliberately-preserved sites (rows 4, 5, 9, 10, 12 through 17, 24 through 29) — i.e. zero net change in row count for class (b)/(c), zero for class (a).

---

## 2 Backend changes — `backend/predictor.py`

Two surgical edits, no other lines touched. Constants `MA_WINDOW` and `MA_TREND_WINDOW_DAYS` remain at lines 8 / 11 unchanged.

### 2.1 Edit `predictor.py:156` — gate comparison

**OLD (HEAD lines 155-157):**

```python
    combined_closes = _extract_closes(prefix_bars) + _extract_closes(window_bars)
    if len(combined_closes) < MA_WINDOW:
        return []
```

**NEW:**

```python
    combined_closes = _extract_closes(prefix_bars) + _extract_closes(window_bars)
    if len(combined_closes) < MA_TREND_WINDOW_DAYS + MA_WINDOW:
        return []
```

**Rationale:** AC-051-10 — gate now matches the user-visible message floor. Both query-side (line 331) and candidate-side (line 343) callers see the same threshold; candidate-side `if not candidate_30d_ma: continue` keeps working unchanged.

**Constant arithmetic note:** `MA_TREND_WINDOW_DAYS + MA_WINDOW = 30 + 99 = 129`. Engineer MUST write the symbolic expression `MA_TREND_WINDOW_DAYS + MA_WINDOW`, not the literal `129`, so future edits to either constant auto-update both the gate and the f-string message (§2.2).

### 2.2 Edit `predictor.py:333-336` — convert message to f-string

**OLD (HEAD lines 332-336):**

```python
    if not query_30d_ma:
        raise ValueError(
            f"Unable to compute 30-day MA99 trend for {input_end_time}: "
            "ma_history requires at least 129 daily bars ending at that date."
        )
```

**NEW:**

```python
    if not query_30d_ma:
        raise ValueError(
            f"Unable to compute 30-day MA99 trend for {input_end_time}: "
            f"ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date."
        )
```

**Rationale:**

- The literal `129` becomes f-string `{MA_TREND_WINDOW_DAYS + MA_WINDOW}` to couple text with the gate at line 156.
- The substring `"ma_history requires at least 129 daily bars ending at that date"` STILL renders byte-identically at runtime (30 + 99 = 129) — the K-051 user-retest SOP (substring grep) and `test_predict_real_csv_integration.py:46-48` (`SACRED_VALUE_ERROR_SUBSTRING` literal) both keep passing.
- Engineer MUST keep the substring `"ma_history requires at least"` and the trailing `" daily bars ending at that date."` byte-identical; only the integer in between becomes interpolated.

### 2.3 No edit to `predictor.py:343-345` (candidate-side)

The candidate-side path silently `continue`s when `_fetch_30d_ma_series` returns `[]`. The gate change at line 156 implicitly tightens this path — under the live DB (3176 rows, 2026-04-25 freshness), candidate windows whose 30-bar trailing index lands in the [99, 128] range (~30 windows per top-of-DB query) now skip instead of being included with a partial-MA series.

**Why this is intentional (AC-051-10 explicitly):** the old behavior used a 30-pt MA series computed from a partial prefix; trend-direction comparison between query (which now requires ≥129 prefix) and candidate (which previously accepted ≥99) was apples-to-oranges. Dual-tightening at line 156 brings both sides to the same 129-bar floor. QA Early Consultation B-Phase4-hidden-callsite gate flagged this; PM ruled "tightening is desired".

---

## 3 Backend test changes

### 3.1 `backend/tests/test_predict_real_csv_integration.py`

Edits to existing file. Three logical changes; one block deletion mandated by AC-051-10 B2.

#### 3.1.1 Lines 28-43 — DELETE the entire `MIN_DAILY_BARS` + `SACRED_FLOOR` comment block; rewrite as single coupled constant

**OLD (HEAD lines 28-43):**

```python
# Constants from production code — imported, NOT hard-coded
# MIN_DAILY_BARS is the *theoretical* sum of MA constants quoted in the Sacred
# ValueError message (K-015 user-facing contract). It is NOT the empirical
# threshold below which the Sacred ValueError fires — see SACRED_FLOOR below.
MIN_DAILY_BARS = MA_TREND_WINDOW_DAYS + MA_WINDOW  # 30 + 99 = 129

# Empirical Sacred-error floor: predictor._fetch_30d_ma_series returns []
# (triggering the Sacred ValueError) only when len(combined_closes) < MA_WINDOW,
# i.e. when the truncated DB has fewer than MA_WINDOW (=99) bars ending at the
# input date. Between 99 and 128 bars the function returns a partial 30-pt MA
# series and the matching loop raises a *different* "No historical matches
# found with MA99 trend direction ..." ValueError instead. This drift between
# the user-facing message ("at least 129") and the code-level gate (99) is a
# K-015 internal contract observation — flagged in K-051 Phase 3b retrospective
# but NOT a K-051 deliverable to fix; the Sacred *message text* is the
# regression anchor here, regardless of the exact bar count that triggers it.
SACRED_FLOOR = MA_WINDOW  # 99 — empirical lower bound where Sacred fires
```

**NEW (replaces lines 28-43, ~5 lines):**

```python
# Constants from production code — imported, NOT hard-coded.
# After K-051 Phase 4 (AC-051-10), the gate at predictor.py:156 fires at
# `len(combined_closes) < MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`, matching
# the user-facing Sacred ValueError text byte-for-byte. SACRED_FLOOR and
# MIN_DAILY_BARS are now the same number; both names retained for callsite
# readability (truncation arithmetic uses SACRED_FLOOR; drift-guard uses
# MIN_DAILY_BARS to assert the imported sum).
MIN_DAILY_BARS = MA_TREND_WINDOW_DAYS + MA_WINDOW  # 30 + 99 = 129
SACRED_FLOOR = MIN_DAILY_BARS  # 129
```

#### 3.1.2 Lines 137-177 — Edit `test_truncated_db_raises_sacred_value_error`

**A. Delete the obsolete "Truncation rationale" paragraph (HEAD lines 147-156, 10 lines):**

```python
    Truncation rationale: the K-051 design doc §3.4 specified 128 bars as the
    truncation point ("one short of the 129-bar message floor"), but empirical
    testing of ``_fetch_30d_ma_series`` showed the Sacred ValueError fires only
    when ``len(combined_closes) < MA_WINDOW = 99``. Between 99 and 128 bars,
    the 30-day window plus available prefix is enough to compute *some* MA
    series, and the matching loop raises a different non-Sacred ValueError
    ("No historical matches found ..."). The user-facing message says "at
    least 129" but the actual code-level gate is 99 — this drift is observed
    here (see SACRED_FLOOR module constant comment) and pinned by truncating
    to ``SACRED_FLOOR - 1`` so the Sacred path is reliably exercised.
```

**B. Replace with single-line rationale matching post-fix invariant:**

```python
    After K-051 Phase 4 the gate aligns with the message: SACRED_FLOOR = 129,
    bars_to_keep = 128 = SACRED_FLOOR - 1, exactly one short of the floor.
```

**C. Update arithmetic — bars_to_keep:** `SACRED_FLOOR - 1` evaluates to `128` post-fix (was `98` pre-fix). Already correct symbolically; no code edit needed because the comment update in §3.1.1 redefines `SACRED_FLOOR`.

**D. Verify `_write_truncated_daily_db` arithmetic still works at 128 bars.** Live DB has 3176 rows; 128 bars going DOWN (older) from `end_date=2026-04-07` lands at row index ~127 from top, ending around `2025-12-01` — well within DB. No change to `_write_truncated_daily_db` body.

#### 3.1.3 Lines 180-206 — Edit `test_min_daily_bars_constant_is_imported_not_magic` drift-guard

**OLD (HEAD line 201-206 — final assertion):**

```python
    assert SACRED_FLOOR == MA_WINDOW == 99, (
        f"SACRED_FLOOR ({SACRED_FLOOR}) decoupled from MA_WINDOW ({MA_WINDOW}); "
        "the empirical Sacred-error gate is `combined_closes < MA_WINDOW`, so "
        "SACRED_FLOOR must equal MA_WINDOW. If MA_WINDOW changed, update "
        "test_truncated_db_raises_sacred_value_error truncation arithmetic."
    )
```

**NEW:**

```python
    assert SACRED_FLOOR == MA_TREND_WINDOW_DAYS + MA_WINDOW == 129, (
        f"SACRED_FLOOR ({SACRED_FLOOR}) decoupled from "
        f"MA_TREND_WINDOW_DAYS + MA_WINDOW ({MA_TREND_WINDOW_DAYS + MA_WINDOW}); "
        "post-K-051-Phase-4 the gate at predictor.py:156 fires at "
        "`combined_closes < MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`, so "
        "SACRED_FLOOR must equal that sum. If either constant changed, update "
        "test_truncated_db_raises_sacred_value_error truncation arithmetic AND "
        "Sacred message in predictor.py:335 together."
    )
```

The earlier `assert MA_WINDOW == 99` and `assert MA_TREND_WINDOW_DAYS == 30` and `assert MIN_DAILY_BARS == 129` (HEAD lines 187-200) stay byte-identical.

#### 3.1.4 Update module docstring (lines 1-12)

**OLD line 7-9 (post-K-051-Phase-3 wording):**

```
Negative case (K-015 sacred regression anchor): DB truncated to 128 bars ending
at 2026-04-07 -> ValueError with the exact substring K-051 user-retest SOP greps.
```

**NEW (no behavioral change — the test already truncates to `SACRED_FLOOR - 1 = 128`; pre-Phase-4 the comment said `98`, post-Phase-4 it says `128`):**

```
Negative case (K-015 sacred regression anchor): DB truncated to SACRED_FLOOR - 1
= 128 bars ending at 2026-04-07 -> ValueError with the exact substring K-051
user-retest SOP greps. After K-051 Phase 4 the gate aligns: SACRED_FLOOR = 129
matches the user-facing message integer.
```

### 3.2 NEW boundary unit tests — extend existing `backend/tests/test_predictor.py`

Decision: **extend `test_predictor.py`** (do NOT create a new file).

**Rationale:** existing `test_fetch_30d_ma_series_*` family lives at lines 582-603 (4 functions). Adding the boundary tests as siblings keeps them adjacent to the existing tests they tighten — discovery by future engineers is cheaper. The existing `_make_real_date_1d_bars` helper at line 78 already provides deterministic synthetic 1D bars (no DB touch, no I/O). New file would force a duplicate import boilerplate + duplicate helper or cross-file import, both worse.

#### 3.2.1 Insert two new tests after `test_fetch_30d_ma_series_empty_inputs_return_empty` (HEAD line 603)

**Insert position:** immediately after line 603, before the K-013 contract block at line 606 (`# K-013 Contract tests — ...`). New code adds ~30 lines.

**New code:**

```python
def test_fetch_30d_ma_series_below_floor_returns_empty():
    """
    AC-051-10 B1 boundary unit test: at exactly MA_TREND_WINDOW_DAYS + MA_WINDOW - 1
    = 128 bars (one short of the post-Phase-4 floor), `_fetch_30d_ma_series`
    must return []. Pins the gate at predictor.py:156 at the closest layer.
    """
    from predictor import MA_TREND_WINDOW_DAYS as _TWD, MA_WINDOW as _MW
    floor = _TWD + _MW
    history = _make_real_date_1d_bars(floor - 1)  # 128 bars
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert result == [], (
        f"expected [] at {floor - 1} bars (one short of floor {floor}); got "
        f"{len(result)} floats. Gate at predictor.py:156 likely regressed to "
        "the pre-Phase-4 `< MA_WINDOW` form."
    )


def test_fetch_30d_ma_series_at_floor_returns_30_points():
    """
    AC-051-10 B1 boundary unit test: at exactly MA_TREND_WINDOW_DAYS + MA_WINDOW
    = 129 bars, `_fetch_30d_ma_series` must return 30 floats. Pairs with
    test_fetch_30d_ma_series_below_floor_returns_empty to lock both sides of
    the threshold.
    """
    from predictor import MA_TREND_WINDOW_DAYS as _TWD, MA_WINDOW as _MW
    floor = _TWD + _MW
    history = _make_real_date_1d_bars(floor)  # 129 bars
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert len(result) == 30, (
        f"expected 30 MA points at floor ({floor} bars); got {len(result)}. "
        "Gate at predictor.py:156 may be over-tight (using > instead of <) or "
        "MA_TREND_WINDOW_DAYS may have drifted."
    )
    assert all(isinstance(v, float) for v in result)


def test_fetch_30d_ma_series_above_floor_returns_30_points():
    """
    AC-051-10 B1 boundary unit test: at floor + 1 = 130 bars, returns 30
    floats (a sanity check that going past the floor doesn't change shape).
    """
    from predictor import MA_TREND_WINDOW_DAYS as _TWD, MA_WINDOW as _MW
    floor = _TWD + _MW
    history = _make_real_date_1d_bars(floor + 1)  # 130 bars
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert len(result) == 30
    assert all(isinstance(v, float) for v in result)
```

**Why the local re-import of `MA_TREND_WINDOW_DAYS`/`MA_WINDOW`:** the file's existing top-level import (line 12) brings `MA_WINDOW` but not `MA_TREND_WINDOW_DAYS`. Local re-import inside test bodies is the smallest patch that doesn't touch the top of the file. Acceptable per existing pattern (e.g. line 79 imports `datetime`/`timedelta` inside `_make_real_date_1d_bars`).

#### 3.2.2 Verify pre-existing tests at HEAD lines 582-603 still pass under new gate

| Existing test (line) | Bars used | Pre-Phase-4 gate (<99) | Post-Phase-4 gate (<129) | Status |
|---|---|---|---|---|
| `test_fetch_30d_ma_series_sufficient_returns_30_points` (582) | 200 (anchor at idx 150 → prefix 151) | passes | 151 ≥ 129 → still passes | OK |
| `test_fetch_30d_ma_series_insufficient_prefix_returns_empty` (590) | 50 | 50 < 99 → `[]` | 50 < 129 → `[]` | OK |
| `test_fetch_30d_ma_series_anchor_not_in_history_returns_empty` (596) | 200, anchor `1900-01-01` not in DB | empty (anchor mismatch) | empty (same path) | OK |
| `test_fetch_30d_ma_series_empty_inputs_return_empty` (601) | empty | empty | empty | OK |
| `test_predict_endpoint_requires_valid_date_for_ma99_trend` (155) | 20 with `time:""` | `MIN_BARS_FOR_MA_TREND` fires first | same | OK |

No edits to existing tests required.

### 3.3 No change to `backend/tests/test_history_db_contiguity.py`

Phase 4 doesn't touch contiguity invariants. Engineer must still re-run `pytest backend/tests/test_history_db_contiguity.py` post-edit to confirm no transitive break.

---

## 4 Frontend changes

### 4.1 `frontend/src/AppPage.tsx` — three edits (i18n × 3) + one edit (toast `data-testid`)

**Edit 1 — line 350 (toast `data-testid`, AC-051-11):**

OLD:
```tsx
        <div className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">
```
NEW:
```tsx
        <div data-testid="error-toast" className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">
```

**Edit 2 — line 363 (i18n, AC-051-12):**

OLD:
```tsx
              Upload 1H CSV（可多選）
```
NEW:
```tsx
              Upload 1H CSV (multi-select)
```

**Edit 3 — line 379 (i18n, AC-051-12):**

OLD:
```tsx
                <div className="mt-1 text-gray-200">多檔合併 · 每檔 24 × 1H bars · UTC+0</div>
```
NEW:
```tsx
                <div className="mt-1 text-gray-200">Merged multi-file · 24 x 1H bars per file · UTC+0</div>
```

(Note: middle-dot `·` U+00B7 is ASCII-extended, not full-width — keep as-is. The `×` U+00D7 multiplication sign is replaced with ASCII `x` for portability; not strictly required by B4 since `×` is not in the CJK ranges, but ASCII keeps the line clean.)

**Edit 4 — line 399 (i18n, AC-051-12):**

OLD:
```tsx
                ? `${historyInfo['1H'].filename}（最新：${historyInfo['1H'].latest ?? 'N/A'} UTC+0）`
```
NEW:
```tsx
                ? `${historyInfo['1H'].filename} (latest: ${historyInfo['1H'].latest ?? 'N/A'} UTC+0)`
```

### 4.2 `frontend/src/components/MainChart.tsx` — two edits

**Edit 1 — line 264 (i18n, AC-051-12):**

OLD:
```tsx
              ? 'MA(99) 計算中…'
```
NEW:
```tsx
              ? 'MA(99) computing...'
```

**Edit 2 — line 270 (i18n + B4, AC-051-12):**

OLD:
```tsx
            ⚠ MA99 資料缺失：{ma99Gap.fromDate} ~ {ma99Gap.toDate}（歷史前置資料不足 99 根）
```
NEW:
```tsx
            ⚠ MA99 data missing: {ma99Gap.fromDate} ~ {ma99Gap.toDate} (insufficient prior history, fewer than 99 bars)
```

(Note: warning glyph `⚠` U+26A0 is preserved — not CJK, not full-width; same visual chrome.)

### 4.3 `frontend/src/components/PredictButton.tsx` — one edit

**Edit 1 — line 16 (i18n + B4, AC-051-12):**

OLD:
```tsx
  maLoading: 'MA99 計算中，請稍候…',
```
NEW:
```tsx
  maLoading: 'MA99 computing, please wait...',
```

### 4.4 `frontend/src/pages/BusinessLogicPage.tsx` — one edit

**Edit 1 — line 106 (i18n + B4, AC-051-12):**

OLD:
```tsx
        <LoadingSpinner label="載入內容中…" />
```
NEW:
```tsx
        <LoadingSpinner label="Loading content..." />
```

---

## 5 Frontend test changes

### 5.1 `frontend/e2e/upload-real-1h-csv.spec.ts` — selector swap (AC-051-11)

**Edit lines 171-173 — swap chained-class selector to `getByTestId`:**

OLD:
```tsx
  await expect(
    page.locator('.text-red-400.border-red-700.bg-red-950')
  ).toHaveCount(0)
```
NEW:
```tsx
  await expect(page.getByTestId('error-toast')).toHaveCount(0)
```

(The surrounding comment block at lines 163-170 explaining the chained-class rationale becomes stale — Engineer should replace it with a single line: `// Negative assertion via stable data-testid (AC-051-11): toast must not render on a clean fixture.`)

**No edit to the visible-test path.** The two tests that currently pass without a toast (lines 144-154 + 176-188) are unaffected; only the explicit `toHaveCount(0)` selector at line 171-173 needs the swap. The `error-toast` testid is absent from DOM when `errorMessage` is falsy, so `getByTestId('error-toast')` yields `count(0)` cleanly.

### 5.2 `frontend/e2e/ma99-chart.spec.ts` — six assertion edits + one test description (AC-051-12 + B3)

**Edit line 188 (assertion):**

OLD:
```tsx
  await expect(page.getByText(/MA99 資料缺失/)).not.toBeVisible()
```
NEW:
```tsx
  await expect(page.getByText(/MA99 data missing/)).not.toBeVisible()
```

**Edit line 194 (assertion):**

OLD:
```tsx
  await expect(page.getByText(/MA99 資料缺失/)).toBeVisible({ timeout: 5000 })
```
NEW:
```tsx
  await expect(page.getByText(/MA99 data missing/)).toBeVisible({ timeout: 5000 })
```

**Edit line 238 (title-attribute assertion):**

OLD:
```tsx
  await expect(predictBtn).toHaveAttribute('title', 'MA99 計算中，請稍候…')
```
NEW:
```tsx
  await expect(predictBtn).toHaveAttribute('title', 'MA99 computing, please wait...')
```

**Edit line 247 (test description — B3 gate):**

OLD:
```tsx
test('MainChart shows MA99 計算中 label while loading, then value after load', async ({ page }) => {
```
NEW:
```tsx
test('MainChart shows MA99 computing label while loading, then value after load', async ({ page }) => {
```

**Edit line 268 (assertion):**

OLD:
```tsx
  await expect(page.getByText('MA(99) 計算中…')).toBeVisible({ timeout: 3000 })
```
NEW:
```tsx
  await expect(page.getByText('MA(99) computing...')).toBeVisible({ timeout: 3000 })
```

**Edit line 274 (assertion):**

OLD:
```tsx
  await expect(page.getByText('MA(99) 計算中…')).not.toBeVisible({ timeout: 5000 })
```
NEW:
```tsx
  await expect(page.getByText('MA(99) computing...')).not.toBeVisible({ timeout: 5000 })
```

### 5.3 No other spec / test file edits

Verified by §1.3 enumeration: rows 12, 16 (sitewide-fonts.spec.ts), 24-29 are all out-of-scope per AC-051-12 ("user-visible Chinese in the React app surface" + "Playwright `test('...')` description strings that contain Chinese in `frontend/e2e/ma99-chart.spec.ts`" — explicit). Engineer MUST NOT bulk-translate other specs or comments.

`frontend/src/__tests__/diary.english.test.ts` continues to pass post-Phase-4 (it asserts diary content is English; Phase 4 makes more strings English — does not touch diary.json).

---

## 6 Verification commands

Execute in this order from `ClaudeCodeProject/K-Line-Prediction/`:

### 6.1 Backend

```bash
# 1. Compile
python3 -m py_compile backend/predictor.py
# Expected: exit 0, no output.

# 2. Boundary unit tests + drift guard (the new + edited tests)
pytest backend/tests/test_predictor.py::test_fetch_30d_ma_series_below_floor_returns_empty \
       backend/tests/test_predictor.py::test_fetch_30d_ma_series_at_floor_returns_30_points \
       backend/tests/test_predictor.py::test_fetch_30d_ma_series_above_floor_returns_30_points \
       backend/tests/test_predict_real_csv_integration.py -v
# Expected: 6 passed (3 new boundary + 3 in test_predict_real_csv_integration).

# 3. Full backend suite
pytest backend/tests/ -v
# Expected: 79 passed (76 baseline + 3 new boundary), 0 failed, 0 skipped.
# If test_predict_real_csv_integration.py fails on test_min_daily_bars_constant_is_imported_not_magic
#   → comment block §3.1.1 not applied or assertion §3.1.3 still uses old form
# If test_truncated_db_raises_sacred_value_error fails with "could not extract 128 bars"
#   → live DB shrunk; Phase 1 backfill regression, file separately.
```

### 6.2 Frontend type-check

```bash
cd frontend && npx tsc --noEmit
# Expected: exit 0, no output.
```

### 6.3 Targeted Playwright

```bash
cd frontend && npx playwright test ma99-chart upload-real-1h-csv
# Expected:
#   - ma99-chart.spec.ts: all baseline tests pass with NEW English strings.
#   - upload-real-1h-csv.spec.ts: 3/3 pass (selector now uses getByTestId).
```

### 6.4 Full Playwright regression

```bash
cd frontend && npx playwright test
# Expected: 299 passed / 2 failed / 1 skipped (matches K-051 Phase 3 baseline per qa.md 2026-04-26).
# Pre-existing flakes: ga-spa-pageview AC-020-BEACON-SPA + shared-components AC-034-P1 Footer snapshot on /.
# Any NEW failure → regression in Phase 4; treat as Bug Found Protocol trigger.
```

### 6.5 Post-edit CJK enumeration grep

```bash
grep -rnP '[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]' frontend/src/AppPage.tsx \
                                            frontend/src/components/MainChart.tsx \
                                            frontend/src/components/PredictButton.tsx \
                                            frontend/src/pages/BusinessLogicPage.tsx \
                                            frontend/e2e/ma99-chart.spec.ts
# Expected output: only MainChart.tsx:33 + MainChart.tsx:38 (zh-TW regex parsing — explicitly preserved per §1.3 rows 4+5).
# Anything else = i18n incomplete; Engineer iterate before commit.
```

### 6.6 Post-edit substring-stability grep (Sacred message)

```bash
grep -nF "ma_history requires at least 129 daily bars ending at that date." backend/predictor.py
# Expected: 1 hit on or near line 335. Subset substring expected in error f-string at runtime.
# Equivalent runtime check: python3 -c "from backend.predictor import MA_TREND_WINDOW_DAYS, MA_WINDOW; print(f'ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date.')"
# Output: ma_history requires at least 129 daily bars ending at that date.
```

---

## 7 Architecture.md sync diff

Apply this unified-diff verbatim. Two changes: (a) updated frontmatter `updated:` field with one-line summary; (b) `## Changelog` prepend a new entry above the 2026-04-26 K-051 Phase 3b/3c entry.

```diff
--- a/ClaudeCodeProject/K-Line-Prediction/agent-context/architecture.md
+++ b/ClaudeCodeProject/K-Line-Prediction/agent-context/architecture.md
@@ -1,7 +1,7 @@
 ---
 title: K-Line Prediction — System Architecture
 type: reference
 tags: [K-Line-Prediction, Architecture, API]
-updated: 2026-04-26 (K-051 Phase 3b/3c Architect — permanent regression coverage design landed; ...)
+updated: 2026-04-26 (K-051 Phase 4 Architect — predictor message-vs-gate drift fix + toast data-testid + UI i18n design landed; AC-051-10 backend gate at `predictor.py:156` tightens from `< MA_WINDOW = 99` to `< MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`, message at `predictor.py:335` becomes f-string `f"ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date."` (substring identity preserved at runtime, K-051 user-retest SOP grep continues to pass); both query-side caller (line 331-336, raises Sacred ValueError) and candidate-side caller (line 343-345, silently `continue`s) move to 129-bar floor in unison; `MA_WINDOW = 99` and `MA_TREND_WINDOW_DAYS = 30` constants UNCHANGED. AC-051-10 B2 deletes 11-line empirical-floor stale comment block at `test_predict_real_csv_integration.py:33-43` + 10-line "Truncation rationale" paragraph in `test_truncated_db_raises_sacred_value_error`; replaces with 5-line coupled-constant block (`SACRED_FLOOR = MIN_DAILY_BARS = 129`); drift-guard assertion at line 201-206 reshapes from `SACRED_FLOOR == MA_WINDOW == 99` to `SACRED_FLOOR == MA_TREND_WINDOW_DAYS + MA_WINDOW == 129`; `bars_to_keep = SACRED_FLOOR - 1 = 128` (was 98) symbolically unchanged. AC-051-10 B1 adds 3 new boundary unit tests in `test_predictor.py` after line 603 (`test_fetch_30d_ma_series_below_floor_returns_empty` 128 bars → `[]`, `test_fetch_30d_ma_series_at_floor_returns_30_points` 129 bars → 30 floats, `test_fetch_30d_ma_series_above_floor_returns_30_points` 130 bars → 30 floats); reuses existing `_make_real_date_1d_bars` helper (no DB I/O, deterministic synthetic 1D bars). AC-051-11 adds `data-testid="error-toast"` to `AppPage.tsx:350` toast `<div>`; `upload-real-1h-csv.spec.ts:171-173` swaps `.text-red-400.border-red-700.bg-red-950` chained selector to `page.getByTestId('error-toast')`. AC-051-12 + B4 + B3: 7 source-string i18n edits (`AppPage.tsx:363/379/399` + `MainChart.tsx:264/270` + `PredictButton.tsx:16` + `BusinessLogicPage.tsx:106`) + 6 spec-assertion edits + 1 test-description edit in `ma99-chart.spec.ts` (lines 188/194/238/247/268/274); all full-width punctuation (`（）：，…`) replaced with ASCII (`():,...`) per B4; code-internal Chinese (zh-TW timestamp regex `MainChart.tsx:33,38` `上午|下午`, JS comments in `UnifiedNavBar.tsx:7-20`, `__tests__/diary.english.test.ts:9-16` CJK regex character classes, `frontend/e2e/K-046-example-upload.spec.ts:105` K-046 Sacred assertion, sitewide-fonts/about-v2/sitewide-footer/pages/navbar/_fixtures comments) explicitly preserved per AC-051-12 scope boundary. 0 schema change / 0 API endpoint change / 0 shared-component change / 0 route change / 0 Pencil frame change. Sacred K-015 substring `"ma_history requires at least 129 daily bars ending at that date"` runtime byte-identity preserved (`MA_TREND_WINDOW_DAYS + MA_WINDOW = 30 + 99 = 129` interpolated). Worktree hydration drift policy AC-051-06 carries forward. Design doc [K-051-phase4.md](../docs/designs/K-051-phase4.md). 前置：K-051 Phase 3b/3c Architect — permanent regression coverage design landed; AC-051-07/-08/-09 backend pytest + frontend E2E + fixtures; sacred K-015 invariant gained positive (real-DB pass-through) + negative (truncated-DB ValueError) anchors; 0 backend code change at that phase, Phase 4 is the first runtime touch.)
 ---
@@ -681,6 +681,8 @@
 ## Changelog

+- **2026-04-26**（Architect, K-051 Phase 4 設計）— Predictor message-vs-gate drift fix + toast `data-testid` + UI i18n 設計完成。AC-051-10 backend `predictor.py:156` gate `< MA_WINDOW` → `< MA_TREND_WINDOW_DAYS + MA_WINDOW` (= 99 → 129) + line 335 訊息變 f-string `f"ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date."`，runtime byte-identity 跟 K-051 user-retest SOP grep substring 同 (30 + 99 = 129)；query-side (line 331-336) + candidate-side (line 343-345) 兩 callsite 同步收 129-bar floor，QA Phase 4 Early Consultation B-Phase4-hidden-callsite gate PM 已裁決 dual-tightening 為 desired。AC-051-10 B1 新增 3 條 boundary unit tests（`test_predictor.py` line 603 後 insert：128 bars → `[]` / 129 bars → 30 floats / 130 bars → 30 floats），複用既有 `_make_real_date_1d_bars` helper。AC-051-10 B2 刪 11-line stale comment block (`test_predict_real_csv_integration.py:33-43`) + 10-line "Truncation rationale" 段（line 147-156）+ 改寫 drift-guard assertion (`SACRED_FLOOR == MA_WINDOW == 99` → `SACRED_FLOOR == MA_TREND_WINDOW_DAYS + MA_WINDOW == 129`)；`SACRED_FLOOR` redefine 為 `MIN_DAILY_BARS = 129`；`bars_to_keep = SACRED_FLOOR - 1` 從 98 變 128（符號運算式不變，常數重綁）。AC-051-11 toast `data-testid="error-toast"` 加在 `AppPage.tsx:350`；`upload-real-1h-csv.spec.ts:171-173` 換 `.text-red-400.border-red-700.bg-red-950` chained selector 為 `getByTestId('error-toast')`。AC-051-12 + B4 + B3: 7 source-string + 6 spec-assertion + 1 test-description i18n edits across 6 files；full-width punctuation `（）：，…` 全 ASCII 化；code-internal Chinese (zh-TW timestamp regex / JS comments / CJK_REGEX char class / K-046 Sacred / sitewide-fonts comments etc.) 明確 preserved per scope boundary。`MA_WINDOW = 99` + `MA_TREND_WINDOW_DAYS = 30` 常數**不**動。0 schema / 0 API endpoint / 0 shared-component / 0 route / 0 Pencil frame 變動。Sacred 全保留：K-015 substring runtime byte-identity / K-009 `ma_history=_history_1d` / K-013 stats_contract_cases.json / K-030 /app no-Footer / K-034 P1 Footer / K-040 sitewide font / K-045 desktop layout 全不動。Pre-Design Audit `git show HEAD:` 證據：predictor.py 8/11/155-157/331-336/343-345 + AppPage.tsx 349-353 + 完整 CJK 29-row truth table（前 11 列 actionable，後 18 列 preserve-with-citation）。AC↔Test Count Cross-Check：3 AC（10/11/12）→ 3 boundary unit tests（AC-051-10 B1）+ 1 selector swap (AC-051-11) + 6 assertion edits + 1 description edit (AC-051-12 + B3) = 11 test-side edits 對應 7 source-side edits。Consolidated Delivery Gate：all-phase-coverage ✓（K-051 Phase 4 single-phase；AC-051-10 §2/§3/§5 + AC-051-11 §4.1/§5.1 + AC-051-12 §4/§5.2 全涵蓋）/ pencil-frame-completeness N/A（無 Pencil 設計改動，純 backend gate + DOM hardening + i18n）/ visual-spec-json-consumption N/A（visual-delta=none）/ sacred-ac-cross-check ✓（grep 7-pattern token-selector + DOM-id adjacency 0 衝擊命中；K-015 substring 主動驗證 runtime byte-identity）/ route-impact-table N/A（無 global CSS / tailwind.config / sitewide token 異動；i18n 純 string content swap）/ cross-page-duplicate-audit ✓（grep `data-testid="error-toast"` repo 0 prior hits；i18n 各 site 已 §1.3 enumerated 不重複）/ target-route-consumer-scan N/A（不變 navigation behavior）/ architecture-doc-sync ✓（本 changelog row + frontmatter updated）/ self-diff ✓（0 cells modified in Directory Structure / Frontend Routing / API Endpoints / Design System tables；1 Changelog row appended ✓；frontmatter updated 2026-04-26 ✓；Cross-Table Sweep `grep "data-testid=\"error-toast\"\|MA_TREND_WINDOW_DAYS + MA_WINDOW" architecture.md` → 0 prior hits）→ OK。8 file changes：1 EDIT `backend/predictor.py` (2 lines) + 1 EDIT `backend/tests/test_predict_real_csv_integration.py` (~20 lines net) + 1 EDIT `backend/tests/test_predictor.py` (~30 lines, 3 new tests) + 4 EDIT frontend source files (`AppPage.tsx` 4 edits, `MainChart.tsx` 2 edits, `PredictButton.tsx` 1 edit, `BusinessLogicPage.tsx` 1 edit) + 1 EDIT frontend e2e spec (`ma99-chart.spec.ts` 6 edits + `upload-real-1h-csv.spec.ts` 1 edit). 0 NEW files / 0 DELETE files. 0 open PM blocking questions / 0 Architect-pending items / Engineer 放行條件 4 條（PM 確認 design doc SoR / worktree branch ops-daily-db-backfill 與 origin/main 同步 / Engineer 讀 §1 Pre-Design Audit + §2-§5 設計 + §8 Risks / Engineer 跟 §6 verification commands order — backend pytest first, frontend tsc + targeted spec second, full Playwright last）。設計文件：[K-051-phase4.md](../docs/designs/K-051-phase4.md)。Engineer 交付後才補磁碟異動（Architect 僅設計）。
+
 - **2026-04-26**（Architect, K-051 Phase 3b/3c 設計）— Permanent regression coverage 設計完成。...
```

(Architect will Edit the file in-session per `feedback_architect_must_update_arch_doc.md` — diff shown for clarity; the actual `Edit` calls follow the diff verbatim.)

---

## 8 Risks + cross-layer notes

### 8.1 Engineer MUST NOT touch

- **`MainChart.tsx:33` zh-TW timestamp regex** — `/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(上午|下午)\s+(\d{1,2}):(\d{2})$/`. Functional parser for users who paste timestamps copied from zh-TW Mac/Windows clipboard. Removing `上午|下午` literally breaks the parser. Out-of-scope per AC-051-12 explicit list.
- **`MainChart.tsx:38` `if (meridiem === '上午')`** — same paired branch; removing breaks the AM/PM parse path.
- **`UnifiedNavBar.tsx:7-20` JS comments** — code documentation, not user-visible. Out-of-scope per AC-051-12.
- **`__tests__/diary.english.test.ts:9-16`** — CJK regex character class. Translating ranges defeats the test's purpose (it asserts diary content stays English).
- **`frontend/e2e/K-046-example-upload.spec.ts:105`** — `page.getByText(/上傳中/)` asserts K-046 example-upload Chinese loading state. K-046 surface i18n is explicitly NOT in this Phase 4 scope. Engineer touching this line = scope expansion.
- **`MA_WINDOW`, `MA_TREND_WINDOW_DAYS`, `MIN_BARS_FOR_MA_TREND`, `FUTURE_LOOKAHEAD_BARS`, `MA_TREND_PEARSON_THRESHOLD`** — constants at `predictor.py:8-12`. AC-051-10 explicitly says "remain unchanged".
- **All other Playwright spec descriptions/comments containing Chinese** (sitewide-fonts.spec.ts, about-v2.spec.ts, sitewide-footer.spec.ts, pages.spec.ts, navbar.spec.ts, _fixtures/mock-apis.ts, visual-report.ts, app-bg-isolation.spec.ts, business-logic.spec.ts, sitewide-body-paper.spec.ts) — these are pre-existing K-021/K-040/K-022 cosmetics, not part of Phase 4. AC-051-12 names exactly `ma99-chart.spec.ts:188/194/238/247/268/274`; bulk-translation = scope expansion.

### 8.2 Order of edits (minimize broken-test churn)

1. **Backend first.** Edit `predictor.py` lines 156 + 335 atomically (one commit-able unit). Then immediately edit `test_predict_real_csv_integration.py` §3.1.1 + §3.1.2 + §3.1.3 + §3.1.4 in the same edit pass (the drift-guard assertion `SACRED_FLOOR == MA_WINDOW == 99` becomes false the moment line 156 changes; pairing keeps pytest never red between commits). Add the 3 new boundary tests in `test_predictor.py` (§3.2.1) in the same pass.
   - Run §6.1 verification.
2. **Frontend i18n second.** Edit the 4 source files (`AppPage.tsx` × 4 edits including toast testid + 3 i18n; `MainChart.tsx` × 2; `PredictButton.tsx` × 1; `BusinessLogicPage.tsx` × 1) — all source-only changes.
3. **Frontend test sync third.** Edit `ma99-chart.spec.ts` (6 assertions + 1 description) + `upload-real-1h-csv.spec.ts` (1 selector swap).
   - Run §6.2 / §6.3 / §6.4 verification in order.
4. **Architecture.md sync fourth.** Apply §7 unified diff (Architect already does this in-session; Engineer does NOT re-edit unless conflict).

If §6.1 step 2 fails on `test_truncated_db_raises_sacred_value_error` with a different ValueError than the Sacred substring, root-cause is almost certainly: the gate edit at line 156 was applied but the message edit at line 335 was missed → the f-string still has the literal "129", but the gate now fires at the right place. Engineer: re-check both edits applied.

### 8.3 Behavior-shift on candidate-side `find_top_matches`

Per QA Early Consultation §1: with the live DB at 3176 rows, ~30 candidate windows that previously had `idx ∈ [99, 128]` and produced a partial-MA series will now skip via `if not candidate_30d_ma: continue`. This shifts the top-10 match composition slightly. Both AC-051-08 positive integration test (`test_real_db_real_csv_returns_matches`) and the live-DB AC-051-01 user retest must still return ≥1 match — no AC requires the *specific* match set to be byte-identical. PM B-Phase4-hidden-callsite gate ruled this is desired.

### 8.4 No `frontend/public/diary.json` edit

QA flag #12 noted `diary.json:6` quotes the post-Phase-4 message string `'ma_history requires at least 129 daily bars'`. After §2.2 the runtime f-string still produces that exact substring (`30 + 99 = 129`) — diary.json stays correct without edit. Engineer must NOT touch diary.json; if Engineer accidentally rewords the f-string (e.g. capitalizes, swaps "at least" → "≥", drops "ending at that date"), diary.json + `SACRED_VALUE_ERROR_SUBSTRING` constant + K-051 user-retest SOP all break together.

### 8.5 Pencil / visual-delta

`visual-delta: none` per ticket frontmatter. AC-051-10/-11/-12 are zero-pixel changes (gate logic, attribute add, string content swap). visual-report.ts must NOT run for K-051; if Engineer's local Playwright invocation accidentally triggers it, delete `K-UNKNOWN-visual-report.html` post-run (TD-K030-03 still pending root fix, persona Step 2a guard still applies).

### 8.6 Worktree hydration

`ops-daily-db-backfill` worktree should already have native rollup binaries from Phase 3 work. If `npx playwright test` errors with `Cannot find module @rollup/...`, run §AC-051-06 protocol: cd canonical, re-run; canonical PASS → hydrate worktree (`npm install`); canonical FAIL → genuine bug, PM.

---

## 9 Refactorability Checklist

- [x] **Single responsibility** — gate change is one boolean expression; message change is one f-string interpolation; toast testid is one attribute add; i18n edits are content-only swaps.
- [x] **Interface minimization** — no new props, no new exports, no new types.
- [x] **Unidirectional dependency** — predictor.py constants → message format string (downstream); AppPage.tsx state → toast `<div>` (downstream). No new circular dep.
- [x] **Replacement cost** — if MA_WINDOW or MA_TREND_WINDOW_DAYS ever changes, the f-string auto-updates; the drift-guard test catches any rebuild that decouples them. ≤ 2 file change for future swap.
- [x] **Clear test entry point** — boundary unit tests anchor the gate at the closest layer (`_fetch_30d_ma_series` direct call, no DB I/O). Integration test pins the user-visible failure mode.
- [x] **Change isolation** — backend gate change cannot affect frontend rendering except via the substring-stable error message; frontend i18n cannot affect backend logic. No intermediate layer needed.

---

## 10 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| 4 | ✓ — `/api/predict` error path message text changed (substring stable) | ✓ — `/app` toast DOM gains `data-testid` (no new route, no new SPA fallback) | ✓ — no new components; `MainChart.tsx`, `PredictButton.tsx`, `BusinessLogicPage.tsx`, `AppPage.tsx` content edits only | ✓ — no props added/removed/retyped on any component |

OK.

---

## 11 Consolidated Delivery Gate Summary

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A,
  visual-spec-json-consumption=N/A — reason: visual-delta=none in ticket frontmatter; AC-051-10/-11/-12 are zero-pixel (gate logic, attribute add, content swap),
  sacred-ac-cross-check=✓,
  route-impact-table=N/A — reason: ticket scoped to no global CSS / tailwind.config / sitewide token change; i18n is in-component string swap only,
  cross-page-duplicate-audit=✓ — grepped `data-testid="error-toast"` repo-wide, 0 prior hits; i18n sites enumerated §1.3, no duplicate-translation risk,
  target-route-consumer-scan=N/A — reason: AC-051-10/-11/-12 do not change navigation behavior (new-tab vs same-tab, redirect, auth gate),
  architecture-doc-sync=✓ — Edit applied in-session per §7,
  self-diff=✓ — 0 cells modified in Directory Structure / Frontend Routing / API Endpoints / Design System tables; 1 Changelog row appended; frontmatter updated 2026-04-26
  → OK
```

Sacred AC + DOM-Restructure Cross-Check (truncated 7-pattern grep summary, all green, no JSX nodes deleted/renamed/restructured):

| Pattern | Hits in Phase 4 scope | Resolution |
|---|---|---|
| `data-testid="cta-` | 0 | preserved |
| `trackCtaClick(` | 0 | preserved |
| `target="_blank"` | 0 in changed files | preserved |
| `href="mailto:` | 0 in changed files | preserved |
| `nextElementSibling.id` | 0 in changed files | preserved |
| `previousElementSibling.id` | 0 in changed files | preserved |
| `querySelector('#` | 0 in changed files | preserved |

K-031 `#architecture` adjacency (`/about` only) — `AppPage.tsx` is `/app`, untouched. K-009/K-013 stats contract — `predictor.py` change is gate scope, not stats algorithm; `compute_stats` (lines 412+) untouched. K-015 sacred substring — preserved at runtime via f-string interpolation, drift-guard test pins it.

---

## 12 Retrospective

**Where most time was spent:** Section §1.3 — the CJK enumeration sweep + per-line classification. 29 hits had to be classified individually (translate / preserve / data-file) with citation rationale; the "preserve" rows outnumber the "translate" rows 18:7, and getting the scope boundary right (which Chinese in which spec is in/out of AC-051-12) matters more than getting the translations right — bulk-translation is the trap.

**Which decisions needed revision:** Initial pass listed the AppPage `（可多選）` translation as `(can multi-select)` — too literal. Reread the surrounding `<label>` UX context (it labels a multi-file `<input multiple>`); the more concise English UX convention is `(multi-select)` or `(multiple files)`. Picked `(multi-select)` for consistency with the `multiple` HTML attribute. No other revisions; backend gate change is mechanical.

**Next time improvement:** When a ticket scopes "translate user-visible Chinese in surface X" with explicit out-of-scope code-internal Chinese, the Architect's enumeration table should split into THREE columns (not two): `translate / preserve-functional / preserve-out-of-scope` — distinguishing "regex parser literals" (functional preserve) from "JS comments in non-changed file" (out-of-scope preserve) heads off the Engineer asking "should I touch this?" mid-implementation. The §1.3 table here uses (a)/(b)/(c) classes; future tickets should standardize the column header verbatim. Codify into persona §AC Sync Gate or §All-Phase Coverage Gate as a hard-step row.
