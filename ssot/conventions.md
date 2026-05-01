---
title: K-Line Prediction — Project Conventions
type: ruleset
tags: [K-Line-Prediction, Conventions]
updated: 2026-04-27
---

## Summary

K-Line Prediction 專案專屬規範。上層規範：
- [ClaudeCodeProject 共用規範](../../../agent-context/conventions.md)
- [通用規範](../../../../agent-context/conventions.md)

---

## Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| Python backend | `snake_case` | `ohlc_data`, `find_top_matches` |
| TypeScript frontend | `camelCase` | `ohlcData`, `findTopMatches` |
| API field names | `snake_case` | `ma99_trend_override` |
| Frontend props/state | `camelCase` | `ma99TrendOverride` |

跨 API 邊界時必須明確列出 mapping（見 [architecture.md](./architecture.md#frontend--backend-field-mapping)）。

---

## Time Format

**所有時間統一使用 UTC+0 的 ISO 8601 格式。**
後端使用 `time_utils.normalize_bar_time()` 統一轉換。勿在任何地方引入 UTC+8 值。

---

## History Database

`/api/predict` 和 `/api/merge-and-compute-ma99` 僅在記憶體中合併資料，不寫入 `history_database/`。
只有 `/api/upload-history` 可寫入 `history_database/`。不得更改此行為。

---

## Pre-Commit Checks

```bash
# Backend
python -m py_compile backend/<changed_file>.py
cd backend && pytest

# Frontend
npx tsc --noEmit
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OFFICIAL_INPUT_CSV_PATH` | `/Users/yclee/Desktop/ETHUSDT-1h-2026-04-02.csv` | 官方輸入 CSV 路徑 |

---

## Files to Never Commit

`.vite/`

---

## GA4 E2E Test Matrix

**Test files (all in `frontend/e2e/`):**

| File | Layer | Created | Owns |
|------|-------|---------|------|
| `ga-tracking.spec.ts` | Helper / shape layer | K-018 | `addInitScript` dataLayer spy — asserts `trackPageview` / `trackCtaClick` push correct Arguments-object shape. INSTALL + PAGEVIEW + CLICK + PRIVACY + PRIVACY-POLICY cases. |
| `ga-spa-pageview.spec.ts` | HTTP beacon + SPA nav layer | K-020 | No mock; observes production `window.dataLayer` + intercepts real `/g/collect` via `context.route('**/g/collect*', fulfill 204)`. Phase 1 SPA-NAV (2 tests) + Phase 2 BEACON-INITIAL/SPA/PAYLOAD/COUNT (4 tests) + Phase 3 NEG-QUERY/HASH/SAMEROUTE (3 tests). 9 tests total. |

**Intercept contract:** per KB `FE/playwright-network-interception.md`, context-level `context.route('**/g/collect*', fulfill({status:204}))` is canonical. Handler registered inside `test.beforeEach` to ensure page-fixture teardown (no cross-test bleed).

**GA4 MP v2 payload pins (K-020 BEACON-PAYLOAD):** `v=2`, `tid=G-TESTID0000` (test env only), `en=page_view`, path-key (`dl` or `dp`) containing current pathname.

**Hook behavior lock (K-020 NEG-*):** `useGAPageview` depends on `[location.pathname]` only. Query-only / hash-only / same-route navigation MUST NOT fire pageview. To change this, new ticket required (update AC + hook + tests simultaneously).

**K-018 regression guard:** `gtag = function () { dataLayer.push(arguments) }` (Arguments-object) is enforced by BEACON-INITIAL + BEACON-SPA tests — if shape drifts to spread-Array, gtag.js rejects the event internally and no `/g/collect` beacon is sent, which these tests catch as `beacons.length === 0` after 5s timeout. (K-018 bug was invisible to `ga-tracking.spec.ts` because its `addInitScript` mock replaced the production shape; K-020 observes production dataLayer post-`initGA()` specifically to close this gap.)

> **Known Gap (2026-04-22):** `BEACON-SPA` is currently red — tracked by **[K-033](../docs/tickets/K-033-ga-spa-beacon-emission-fix.md)**. Root cause: `useGAPageview` calls `gtag('event','page_view',{…})` while `initGA` has `send_page_view:false`, which gtag.js silently drops without emitting `/g/collect`. `BEACON-INITIAL` + `BEACON-PAYLOAD` + `BEACON-COUNT` + all `NEG-*` + both `SPA-NAV` dataLayer tests are green (8 / 9). Until K-033 lands, `BEACON-SPA` provides diagnostic signal (CI failure = reminder of the production gap) but is NOT an active guard. DO NOT loosen the assertion to green — that reintroduces the exact K-018-class gap K-020 was designed to close.
