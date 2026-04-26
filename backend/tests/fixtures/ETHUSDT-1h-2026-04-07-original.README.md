# ETHUSDT-1h-2026-04-07-original.csv — Provenance

## Summary

Regenerated 24-bar 1H ETH/USDT slice covering UTC day 2026-04-07
(00:00 -> 23:00). Used as the input fixture for
`backend/tests/test_predict_real_csv_integration.py` AC-051-08 positive
and negative cases.

## Source

- **API:** Binance public klines (keyless GET)
- **Endpoint:** `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&startTime=1775520000000&endTime=1775606399999&limit=1000`
- **Window:** 2026-04-07T00:00:00Z -> 2026-04-07T23:59:59Z (24 hourly bars)
- **Regenerated:** 2026-04-26

## Equivalence note

The original user-uploaded `ETHUSDT-1h-2026-04-07.csv` that triggered K-051
is unrecoverable. This file byte-replays the structural shape of the
official Binance ETHUSDT 1H download (12 columns, ascending UTC,
microsecond timestamps, 8-decimal prices) but the numeric values are
Binance-canonical for the same UTC day, not byte-identical to the user's
lost upload. AC-051-08 regression coverage relies only on the **shape +
date range**, not on the exact OHLC values, so this regeneration is
sufficient for permanent CI coverage.

## Format

- 24 rows, headerless, comma-delimited, UTF-8 byte-clean (no BOM)
- 12 columns per row matching Binance kline schema:
  `openTime_us,open,high,low,close,volume,closeTime_us,quoteVolume,trades,takerBaseVol,takerQuoteVol,ignore`
- `openTime_us` = Binance ms timestamp * 1000 (microsecond precision —
  matches `frontend/public/examples/ETHUSDT_1h_test.csv` convention and
  AppPage.tsx `parseExchangeTimestamp` >=10^15 branch)
- Prices formatted as `%.8f` (`"2107.16000000"`)
- Order: ascending UTC time (oldest first)

This README is a SIBLING to the CSV (NOT a header line in the CSV itself
— `parseOfficialCsvFile` and `load_official_day_csv` both fail on
non-numeric first column per design doc §1.2 and §3.3).

## Regeneration command

```bash
python3 -c "
import urllib.request, json
u='https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&startTime=1775520000000&endTime=1775606399999&limit=1000'
data = json.loads(urllib.request.urlopen(u).read().decode())
assert len(data) == 24
def fp(s): return f'{float(s):.8f}'
lines = []
for k in data:
    o_us = k[0]*1000; c_us = k[6]*1000 + 999
    lines.append(f'{o_us},{fp(k[1])},{fp(k[2])},{fp(k[3])},{fp(k[4])},{fp(k[5])},{c_us},{fp(k[7])},{k[8]},{fp(k[9])},{fp(k[10])},{k[11]}')
print('\n'.join(lines))
" > ETHUSDT-1h-2026-04-07-original.csv
```
