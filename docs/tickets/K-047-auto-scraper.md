---
id: K-047
title: Auto scraper for authoritative K-line history DB
status: backlog
created: 2026-04-24
type: feature
priority: low
size: large
visual-delta: none
content-delta: none
design-locked: N/A
qa-early-consultation: N/A — reason: backlog stub, not ready for release
dependencies: [K-046]
---

## Summary (stub only — not ready for Architect)

Scheduled job that periodically fetches latest ETH/USDT 1H + 1D bars from an authoritative exchange API (Binance public API / CoinGecko / CryptoDataDownload) and writes them into `history_database/Binance_ETHUSDT_1h.csv` + `history_database/Binance_ETHUSDT_d.csv`, replacing the human-upload-as-DB-maintenance model retired by K-046.

**Status:** backlog. This ticket is an ID reservation + scope placeholder so K-046 can reference a forward pointer without opening the implementation. **Do not start.** Full PRD + AC + Phase plan will be authored by PM when this ticket is promoted from backlog.

## Preliminary scope (non-binding, for future PRD authoring)

Open questions to settle when promoting:

- Hosting shape: Cloud Run scheduled job, GitHub Action cron, Firebase Scheduled Function, or crontab on a small VPS?
- Data source: Binance REST `GET /api/v3/klines` (no auth for public endpoints) vs CoinGecko Pro vs CryptoDataDownload CSV pull?
- Frequency: 1H bars every hour (top-of-hour); 1D bars at 00:05 UTC daily
- Idempotency: if the scheduled run overlaps or the target file is mid-write, what guards? File lock? Atomic rename? `tmp` staging file?
- Recovery: what happens if the scraper is offline for days? Backfill from where it left off?
- Auth on write: write-side is server-to-server; no external auth needed, but the job's credentials (if an API key is required — Binance public doesn't need one) must live in env, not repo
- Failure alerting: where does "scraper silently dead" get surfaced? Log aggregation? A `/api/history-info` field like `freshness_hours` that frontend can render?
- Rollback: if a scraped batch is malformed, how does ops revert?

## Acceptance Criteria

_Not authored yet — this is a backlog stub per `feedback_pm_reserve_k_id_before_commit.md`. Will be drafted when promoted to `status: open`._

## Release Status

- 2026-04-24 reserved — K-ID stub created by PM alongside K-046 to enable K-046's forward-pointer reference. Not scheduled.
