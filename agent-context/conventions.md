---
title: K-Line Prediction — Project Conventions
type: reference
tags: [K-Line-Prediction, Conventions]
updated: 2026-04-09
---

## Summary

K-Line Prediction 專案專屬規範。上層規範：
- [ClaudeCodeProject 共用規範](../../agent-context/conventions.md)
- [通用規範](../../../agent-context/conventions.md)

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
