---
title: K-Line Prediction — System Architecture
type: reference
tags: [K-Line-Prediction, Architecture, API]
updated: 2026-04-22 (K-029 Architect design + K-020 GA4 E2E Test Matrix)
---

## Summary

ETH/USDT K 線型態相似度預測系統。使用者上傳近期 OHLC，後端在歷史資料庫中找出最相似的歷史片段，計算 MA99 並提供後續走勢統計。

**現況（2026-04-19，K-017 Architect 設計完成後）：**
- 前端：5 條 SPA 路由（`/` / `/app` / `/about` / `/diary` / `/business-logic`）+ Unified NavBar；`/about` K-017 重寫為 portfolio-oriented recruiter page（7 sections，K-031 移除 S7 BuiltByAIShowcaseSection），homepage 加 `BuiltByAIBanner`
- 後端：FastAPI 單檔 `main.py` 內含所有 route + 併存 2 份 in-memory history（`_history_1h` / `_history_1d`）
- Cross-layer 重複計算（stats）已於 TD-008 RFC 決議採 Option C — 前端算 subset、後端算全集、contract fixture 鎖漂移（K-013 設計完成 2026-04-21，已放行 Engineer；`frontend/src/utils/statsComputation.ts` + `backend/tests/fixtures/stats_contract_cases.json` + generator script 新增）
- 多個大模組（`AppPage.tsx` / `main.py` / `predictor.py`）已登記為 TD-005/006/007，待 K-013 驗收後啟動拆分 RFC
- Portfolio artifact：`scripts/audit-ticket.sh`（A–G check group）+ `docs/ai-collab-protocols.md`（公開版協議文件）K-017 交付
- K-017 Pass 2 — cross-page primitive：新增 `frontend/src/components/primitives/` 目錄（P1–P3 落地：SectionContainer / CardShell / ExternalLink）+ `hooks/useDiary.ts`；P4/P5/P6/P7（MilestoneAccordion / VerticalRail / TimelineMarker / DiaryEntryRow）**未落地**（K-017 Pass 3 廢棄、磁碟不存在）；diary/ 舊三組件（DiaryTimeline / MilestoneSection / DiaryEntry）保留；CtaButton `rel` 補 `noopener`；RoleCard interface 重設（owns/artefact + 6 role 含 Reviewer）；K-027 hotfix 修正 diary/ mobile responsive（2026-04-21）
- K-022 — /about 結構細節對齊 v2（2026-04-21）：新增 `components/about/DossierHeader.tsx`（dossier header bar + FILE Nº）、`components/about/RedactionBar.tsx`（黑色塗黑條遮蔽）；`components/primitives/CardShell.tsx` 遷 paper palette（`dark:` class 移除）；`components/common/SectionLabel.tsx` 新增 `SectionLabelRow`（hairline + label 橫列）；`components/about/PillarCard.tsx` 加 `overflow-hidden`（圓角修正）；PageHeaderSection 拆主句 / 角色列 / tagline 三層；5 個 section label（Nº 01~05）；6 Role Cards `OWNS`/`ARTEFACT` label 採 Geist Mono small-caps

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + Recharts + lightweight-charts + Vite + react-router-dom |
| Backend | Python + FastAPI + PyJWT |
| Tests (FE) | Vitest + Playwright |
| Tests (BE) | pytest |

---

## Directory Structure

```
ClaudeCodeProject/
├── agent-context/
│   ├── architecture.md          ← monorepo 層級 overview
│   └── conventions.md           ← 通用規範
├── PM-dashboard.md              ← 跨專案 ticket 進度表
├── CLAUDE.md                    ← Claude Code 專案指令
├── AGENTS.md                    ← Codex 專案指令
├── K-Line-Prediction/
│   ├── agent-context/
│   │   ├── architecture.md      ← 本檔
│   │   └── conventions.md       ← K-Line 專屬規範（命名、pre-commit、history DB）
│   ├── docs/
│   │   ├── tickets/             ← K-001 ~ K-017 ticket
│   │   ├── tech-debt.md         ← TD-001 ~ TD-008 登記簿
│   │   ├── designs/             ← RFC + ticket design（TD-008 / K-017 等）
│   │   ├── reviews/             ← Codex / senior-engineer review 紀錄
│   │   ├── retrospectives/      ← per-role 跨 ticket 累積反省（K-008 起）
│   │   ├── reports/             ← Playwright visual-report 產出
│   │   └── ai-collab-protocols.md ← K-017 公開版協議文件（英文，對外 recruiter 可見）
│   ├── scripts/                 ← K-017 起；portfolio demo scripts
│   │   └── audit-ticket.sh      ← A–G check group audit（portfolio demo, not CI gate）
│   ├── backend/
│   │   ├── main.py              ← FastAPI app + 所有 /api route + SPA fallback（最後一個 route）
│   │   ├── models.py            ← Pydantic request/response models
│   │   ├── predictor.py         ← 相似度搜尋 + MA99 + trend classify + stats 計算
│   │   ├── time_utils.py        ← 時間 normalize（統一 UTC+0 `YYYY-MM-DD HH:MM`）
│   │   ├── mock_data.py         ← 測試用假資料 + CSV loader
│   │   ├── auth.py              ← APIRouter: POST /api/auth + GET /api/business-logic + require_jwt
│   │   ├── business_logic.md    ← JWT 保護的交易邏輯內容
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── test_auth.py     ← AC-AUTH-1/2/4 + AC-TEST-AUTH-3/5
│   │       ├── test_main.py     ← main.py route integration（K-001 補齊 coverage）
│   │       ├── test_predictor.py ← predictor 純函式測試（49 tests，含 K-013 contract parametrize 3 cases + fixture coverage + realism rule）
│   │       └── fixtures/                              ← K-013 跨層 contract fixture 目錄
│   │           ├── __init__.py                        ← 空檔；讓 fixtures 成為 importable package
│   │           ├── stats_contract_cases.json         ← 3 cases（all_matches_full_set / subset_deselect_one / single_match_two_bars）；snake_case expected；前後端共吃
│   │           └── generate_stats_contract_cases.py  ← deterministic generator；呼叫現有 `compute_stats` 產 ground truth；後端改算法時一鍵重跑
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── diary.json       ← DiaryMilestone[] 靜態資料
│   │   │   └── docs/
│   │   │       └── ai-collab-protocols.md  ← K-017 起；copy from docs/，讓 SPA Hosting 可直接訪問 `/docs/ai-collab-protocols.md`（避免 SPA fallback 吞 .md）
│   │   ├── e2e/
│   │   │   ├── business-logic.spec.ts
│   │   │   ├── pages.spec.ts
│   │   │   ├── ma99-chart.spec.ts
│   │   │   ├── navbar.spec.ts
│   │   │   ├── visual-report.ts          ← K-008 視覺報告 script（env var TICKET_ID → docs/reports/K-XXX-visual-report.html）
│   │   │   └── fixtures/
│   │   │       └── expired-token.ts
│   │   └── src/
│   │       ├── main.tsx         ← BrowserRouter + Routes 入口
│   │       ├── AppPage.tsx      ← K-Line 預測主頁（TD-005：責任過多，待拆分）
│   │       ├── types.ts         ← MatchCase / PredictStats / ProjectionBar 等
│   │       ├── types/
│   │       │   └── diary.ts     ← DiaryItem / DiaryMilestone
│   │       ├── hooks/
│   │       │   ├── useAsyncState.ts
│   │       │   ├── usePrediction.ts    ← predict + computeMa99 呼叫封裝
│   │       │   └── useDiary.ts         ← K-017 Pass 2；封裝 /diary.json fetch + AsyncState + limit slice，HomePage/DiaryPage 共用
│   │       ├── utils/
│   │       │   ├── aggregation.ts      ← 1H → 1D bar 聚合、time formatter
│   │       │   ├── analytics.ts        ← K-018；GA4 initGA / trackPageview / trackCtaClick
│   │       │   ├── api.ts              ← API_BASE env
│   │       │   ├── auth.ts             ← localStorage bl_token helper
│   │       │   ├── statsComputation.ts ← K-013；`computeStatsFromMatches` 純 util（subset stats，與 backend `compute_stats` 由 `backend/tests/fixtures/stats_contract_cases.json` 鎖 bit-exact <=1e-6）；另 export `snakeSuggestionToCamel` / `snakeStatsToCamel` / `aggregateProjectedBarsTo1D`
│   │       │   └── time.ts             ← toUTC8Display（render-only）
│   │       ├── pages/
│   │       │   ├── HomePage.tsx
│   │       │   ├── AboutPage.tsx
│   │       │   ├── DiaryPage.tsx
│   │       │   └── BusinessLogicPage.tsx
│   │       ├── __tests__/
│   │       │   ├── AppPage.test.tsx         ← Vitest（K-010 修復中）
│   │       │   ├── MatchList.test.tsx
│   │       │   ├── OHLCEditor.test.tsx
│   │       │   ├── PredictButton.test.tsx
│   │       │   ├── StatsPanel.test.tsx
│   │       │   ├── aggregation.test.ts
│   │       │   └── statsComputation.test.ts ← K-013；relative path import `../../../backend/tests/fixtures/stats_contract_cases.json`，對 3 case 跑 `computeStatsFromMatches` 並 assert bit-exact (`toBeCloseTo(value, 6)`) + error contract + key mapping（共 9 tests）
│   │       └── components/
│   │           ├── ErrorBoundary.tsx
│   │           ├── MainChart.tsx            ← 主圖（歷史 + 預測 + MA99 疊加）
│   │           ├── MatchList.tsx            ← 相似案例列表 + 展開 PredictorChart（TD-004）
│   │           ├── OHLCEditor.tsx           ← OHLC 輸入表格
│   │           ├── StatsPanel.tsx           ← 統計面板
│   │           ├── PredictButton.tsx
│   │           ├── TopBar.tsx               ← /app 上方 bar（K-030 起 /app 不渲染 UnifiedNavBar，TopBar 為 /app 實際頂端 bar）
│   │           ├── UnifiedNavBar.tsx        ← K-005 統一 NavBar（所有頁面）
│   │           ├── NavBar.tsx               ← legacy，保留相容
│   │           ├── home/
│   │           │   ├── HeroSection.tsx
│   │           │   ├── ProjectLogicSection.tsx
│   │           │   ├── DevDiarySection.tsx      ← Home 頁 Diary 預覽；flex-col flow layout（K-028 起由 absolute positioning 改為 content-driven entry height；rail 為 absolute <div> with top:40 / bottom:40 insets 自動撐高；marker 仍為 20×14 brick-dark 矩形，K-023 AC-023-DIARY-BULLET 保留；新增 data-testid="diary-entries" / "diary-entry-wrapper"）；消費 useDiary(3) 回傳的 DiaryMilestone[]（K-017 Pass 2 MilestoneAccordion 方案未落地，DevDiarySection 自行 inline 實作）
│   │           │   └── BuiltByAIBanner.tsx      ← K-017 新增；Homepage 最上方 thin banner → /about（DiaryPreviewEntry.tsx 刪除，被 P4 取代）
│   │           ├── about/                        ← K-017 大幅重構（2026-04-19）；K-022 結構細節 v2（2026-04-21）
│   │           │   ├── DossierHeader.tsx                 ← K-022 新增；頁面頂部 dossier header bar（bg-charcoal，FILE Nº 字樣）
│   │           │   ├── RedactionBar.tsx                  ← K-022 新增；黑色矩形塗黑條（`data-redaction` testid）
│   │           │   ├── PageHeaderSection.tsx             ← S1 One operator 聲明（既有檔改寫；K-022 拆主句/角色列/tagline 三層）
│   │           │   ├── MetricsStripSection.tsx           ← S2 4 narrative metrics 容器
│   │           │   ├── MetricCard.tsx                    ← title + subtext
│   │           │   ├── RoleCardsSection.tsx              ← S3 6 roles 容器
│   │           │   ├── RoleCard.tsx                      ← 既有檔，interface 改為 { role, owns, artefact }
│   │           │   ├── ReliabilityPillarsSection.tsx     ← S4 3 pillars + anchor quotes
│   │           │   ├── PillarCard.tsx                    ← title + body + italic blockquote + docs link
│   │           │   ├── TicketAnatomySection.tsx          ← S5 K-002/K-008/K-009 trio 容器
│   │           │   ├── TicketAnatomyCard.tsx             ← ID + title + outcome + learning + GitHub href
│   │           │   ├── ProjectArchitectureSection.tsx    ← S6 Monorepo / Docs-driven / Testing pyramid
│   │           │   ├── ArchPillarBlock.tsx               ← 單 arch pillar（含可選 testingPyramid list）
│   │           │   ├── FooterCtaSection.tsx              ← S7 email + GitHub + LinkedIn 容器（K-031 後從 S8 重編為 S7）
│   │           │   └── FooterCtaLink.tsx                 ← 單 link（external 時 rel="noopener noreferrer"）
│   │           ├── diary/
│   │           │   ├── DiaryTimeline.tsx                  ← map milestones → MilestoneSection（K-017 Pass 2 重構未落地；舊三組件結構保留）
│   │           │   ├── MilestoneSection.tsx               ← accordion wrapper（K-027 修改：展開區加 overflow-hidden；mb-4 sm:mb-3）
│   │           │   └── DiaryEntry.tsx                     ← entry row（K-027 修改：flex-col sm:flex-row；date w-auto sm:w-24；text break-words）
│   │           ├── primitives/                            ← K-017 Pass 2 新目錄；cross-page primitive 抽出（/about 專用；diary/ 重構未落地）
│   │           │   ├── SectionContainer.tsx               ← P1；/about 7 sections 外層 wrap
│   │           │   ├── CardShell.tsx                      ← P2；MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarBlock 共用（K-022：dark class 遷 paper palette；PillarCard consumer 加 overflow-hidden）
│   │           │   └── ExternalLink.tsx                   ← P3；target=_blank + rel=noopener noreferrer 寫死
│   │           │   （MilestoneAccordion.tsx / DiaryEntryRow.tsx / VerticalRail.tsx / TimelineMarker.tsx — K-017 Pass 2 P4/P5/P6/P7 未落地，磁碟不存在；K-024 結構重做時重新設計）
│   │           ├── business-logic/
│   │           │   ├── PasswordForm.tsx
│   │           │   ├── BusinessLogicContent.tsx
│   │           │   └── ErrorBanner.tsx
│   │           └── common/
│   │               ├── LoadingSpinner.tsx   ← 接受 `label?: string` prop，各呼叫處傳入情境文案；無 label 時只顯示 spinner 不顯示文字（K-011 完成 2026-04-18）
│   │               ├── ErrorMessage.tsx
│   │               ├── SectionHeader.tsx
│   │               ├── SectionLabel.tsx
│   │               └── CtaButton.tsx
│   └── history_database/
│       ├── Binance_ETHUSDT_1h.csv
│       └── Binance_ETHUSDT_d.csv
```

---

## API Endpoints

實際 route 在 `backend/main.py`（外加 `auth.py` router）。全部以 `/api/*` prefix。

### `POST /api/predict`

主預測端點。

**Request** (`PredictRequest`):
```json
{
  "ohlc_data": [{"open": 0, "high": 0, "low": 0, "close": 0, "time": "2026-01-01T00:00:00"}],
  "selected_ids": [],
  "timeframe": "1H",
  "ma99_trend_override": "up"  // optional: "up" | "down" | "flat"
}
```

**Response** (`PredictResponse`):
```json
{
  "matches": [MatchCase],
  "stats": PredictStats,
  "query_ma99_1h": [float | null],
  "query_ma99_1d": [float | null],
  "query_ma99_gap_1h": {"from_date": "...", "to_date": "..."} | null,
  "query_ma99_gap_1d": {"from_date": "...", "to_date": "..."} | null
}
```

**注意事項（K-009 修復中）：** `find_top_matches()` 目前在 1H 路徑下未傳 `ma_history=_history_1d`，導致 fallback 為 `history=_history_1h`，MA99 filter 與 ranking 資料源錯誤。AC-009-FIX 鎖定此行為。

---

### `POST /api/merge-and-compute-ma99`

僅計算 MA99（前端早期載入 MA99 用，UX：Predict 按鈕先 disabled，MA99 算好後 enable）。

**Request** (`Ma99Request`): `{ ohlc_data, timeframe }`
**Response** (`Ma99Response`): `{ query_ma99_1h, query_ma99_1d, query_ma99_gap_1h, query_ma99_gap_1d }`

**In-memory only**：不寫入 history database。

---

### `POST /api/upload-history`

上傳 CSV 歷史資料，自動合併去重後寫入 `history_database/`。支援三種 CSV 格式：CryptoDataDownload、標準 header、Binance raw API。

**Timeframe 偵測：** 檔名含 `_d` / `_1d` → 1D，否則 1H。
**Response：** `{ filename, latest, bar_count, added_count, timeframe }`

**已知風險（TD-003）：** 用 module globals（`_history_1h` / `_history_1d`）做 read-merge-write-swap，無同步機制，併發上傳可能遺失 bars。單 worker 單使用者部署下先接受現狀。

---

### `GET /api/history-info`

回傳 1H / 1D 歷史資料的最新日期、筆數、filename。

### `GET /api/example?n=5&timeframe=1H`

從歷史資料庫讀取前 N 筆作為範例輸入。

### `GET /api/official-input`

從 env var `OFFICIAL_INPUT_CSV_PATH` 指定的路徑載入官方輸入 CSV。

### `POST /api/auth`

密碼驗證，回傳 JWT token（`auth.py` router）。

- Payload: `{ password }` → Response: `{ token }` 或 401
- 密碼來源：env var `BUSINESS_LOGIC_PASSWORD`，用 `hmac.compare_digest` 防 timing attack
- JWT secret：env var `JWT_SECRET`
- Payload: `{ sub: "business-logic-access", iat, exp: iat + 86400 }`
- `jwt.decode` 必須 pin `algorithms=["HS256"]`

### `GET /api/business-logic`

密碼保護內容（`auth.py` router，同一個 APIRouter）。

- Header: `Authorization: Bearer <token>`，用 `HTTPBearer` + `Depends(require_jwt)` 驗證
- 內容從 `Path(__file__).parent / "business_logic.md"` 讀取（避免 Railway/CR 工作目錄不一致）
- 200 → `{ content }`；401 token 無效；404 檔案不存在

### SPA Fallback

`GET /{full_path:path}` → `FileResponse("dist/index.html")`。**必須是 main.py 最後一個 route**，在所有 `include_router()` 之後，讓前端 BrowserRouter 的路由由客戶端接管。

---

## Key Data Models

**後端 Pydantic Models (`backend/models.py`)**
```python
OHLCBar:       open, high, low, close: float; time: str (ISO UTC)
MatchCase:     id, correlation, historical_ohlc, future_ohlc,
               historical_ohlc_1d, future_ohlc_1d,
               start_date, end_date,
               historical_ma99, future_ma99,
               historical_ma99_1d, future_ma99_1d
PredictStats:  highest/second_highest/second_lowest/lowest: OrderSuggestion,
               win_rate, mean_correlation,
               consensus_forecast_1h, consensus_forecast_1d  # 全集 baseline（TD-008 Option C 語意）
Ma99Gap:       from_date, to_date
AuthRequest:   password: str
AuthResponse:  token: str
```

**前端 TypeScript Types (`frontend/src/types.ts` + `types/diary.ts`)**
```typescript
interface DiaryItem        { date: string; text: string }
interface DiaryMilestone   { milestone: string; items: DiaryItem[] }
type AuthState             = 'IDLE' | 'SHOW_PASSWORD_FORM' | 'LOADING_CONTENT' | 'SHOW_CONTENT' | 'SHOW_ERROR'
type AsyncStatus           = 'idle' | 'loading' | 'success' | 'error'
// MatchCase / PredictStats 與後端欄位對映（camelCase），見下方 Field Mapping
```

---

## Data Flow

```
使用者輸入 OHLC（編輯表格 / CSV upload / JSON import / example）
  → OHLCEditor (前端)
  → POST /api/merge-and-compute-ma99 (預先算 MA99，Predict 按鈕 disable)
  → POST /api/predict (按下 Predict)
    → find_top_matches(history, ma_history, history_1d, timeframe) [predictor.py]
        ├─ _candle_feature_vector() 產 candle shape 特徵
        ├─ _normalized_similarity() 算 similarity score
        ├─ _fetch_30d_ma_series() 從 ma_history（應為 1D）取 30 天 MA series
        ├─ _classify_trend_by_pearson() 判 MA99 方向
        ├─ MA99 方向 gate（direction mismatch 排除）
        └─ 回 top N matches + 1D aggregation
    → compute_stats(matches, current_close, timeframe)
        ├─ _projected_future_bars() → consensus forecast（全集）
        └─ OrderSuggestion × 4 + win_rate + mean_correlation
  → PredictResponse
  → frontend displayStats useMemo
    ├─ appliedSelection == 全集 → 用 appliedData.stats（後端算好）
    └─ appliedSelection ⊂ 全集 → utils/statsComputation.ts::computeStatsFromMatches() 前端算 subset（K-013 落地）
  → MainChart + MatchList + StatsPanel 渲染
```

---

## Consensus Stats Source of Truth

**決策來源：** TD-008 RFC Option C（accepted 2026-04-18，見 `docs/designs/TD-008-rfc-consensus-source-of-truth.md`）。實作 ticket：[K-013](../docs/tickets/K-013-consensus-stats-contract.md)。

**核心規則：**

1. **全集 stats（all top-N matches）由後端算**：`/api/predict` 回傳的 `stats.consensus_forecast_1h/1d` 與 4 檔 OrderSuggestion 是「全集 baseline」。前端拿到時若 `appliedSelection == 全部 matches`，直接用，不重算。
2. **Subset stats（使用者 deselect 部分 matches）由前端算**：不回後端 round-trip（保留零 latency UX）。純函式抽至 `frontend/src/utils/statsComputation.ts`，簽名：
   ```ts
   computeStatsFromMatches(
     matches: MatchCase[],
     currentClose: number,
     timeframe: '1H' | '1D',
     lastBarTime?: string,
   ): StatsComputationResult
   // StatsComputationResult = { stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>, projectedFutureBars: ProjectionBar[] }
   // consensusForecast1h/1d 由 AppPage 以 projectedFutureBars + aggregateProjectedBarsTo1D 於 util 外組合
   ```
3. **雙實作由 contract fixture 鎖漂移**：
   - Fixture：`backend/tests/fixtures/stats_contract_cases.json`（array of `{name, input, expected}`，涵蓋全集 / subset / single-match 邊界）
   - 產生器：`backend/tests/fixtures/generate_stats_contract_cases.py`（入版 script，以當前 `compute_stats` 輸出作 ground truth；後端改算法時重跑一鍵重生）
   - 後端 `test_predictor.py` 加 parametrize test：讀 fixture，assert `compute_stats(**input)` == `expected`（容忍 1e-6）
   - 前端 `__tests__/statsComputation.test.ts`：relative path `../../../backend/tests/fixtures/stats_contract_cases.json`，build-time JSON import（需 `tsconfig.json::resolveJsonModule: true`），對 3 case 跑 `computeStatsFromMatches(...)` 並經 snake→camel whitelist 轉換後 assert bit-exact
   - 後端改算法但未同步 fixture → 後端測試失敗；前端算法漂移 → 前端測試失敗。兩端任一破漂移立即 CI red。
   - Contract test 比對範圍：4 檔 OrderSuggestion + `win_rate` + `mean_correlation`。**不比對** `consensus_forecast_1h/1d`（見 Known Gap）。
4. **API payload 不變**：`/api/predict` 回傳 schema 完全不動；現有 E2E mock 不需改。
5. **CI contract drift job 暫緩**：本 cycle 靠 PR reviewer 人工把關 + 測試同吃 fixture 作為安全網，K-013 驗收後下個 cycle 再評估是否加獨立 drift job。

**為什麼不選 Option A / B**（節錄，完整論證見 RFC）：
- A（backend-only，每次 deselect 打 API）：每次 click 100~300ms round-trip，what-if 分析情境 UX 退步
- B（frontend-only，刪 backend stats）：作廢 `test_predictor.py` 44 tests 中相當比例，負投資

**Wire-level vs Observable contract（2026-04-21 Round 2 Fix 1 `853a8aa` 更正，原 Known Gap 撤回）：** 後端 `PredictStats.consensus_forecast_1h/1d` wire-level 永遠是 `[]`（`compute_stats` 從未填入；`models.py` 預設 `[]`）— 此為 backend API schema 事實。**Observable chart render 由前端 `AppPage.tsx` `displayStats` useMemo 無條件注入** `projectedFutureBars` / `projectedFutureBars1D` 保證（full-set 與 subset 兩分支皆注入），故 `StatsPanel::ConsensusForecastChart` 兩種選擇狀態皆可見。OLD base `b0212bb` L224-226 即為此無條件注入行為，K-013 Round 1 `8442966` 把注入誤綁 subset 分支 → 全集分支 chart 消失 → 觸發 C-1 Critical；Round 2 Fix 1 `853a8aa` 恢復無條件注入。早期設計文件敘述「全集下無 consensus 圖 pre-existing gap」為 Architect Pre-Design Audit 只讀 backend schema 未 cross-verify OLD frontend observable 所致誤判，已於 K-013 設計文件 §0.3 以 "RETRACTED" 標記留底並更正。若未來要讓 `consensus_forecast_*` 成為 backend-computed 而非 frontend-injected，需另開 ticket。

---

## Known Architecture Debt

完整登記於 [`docs/tech-debt.md`](../docs/tech-debt.md)，以下是結構性技術債與 Architect 預定拆分方向。

| ID | 區塊 | 問題 | 預定方向 | 排期觸發 |
|----|------|------|---------|---------|
| TD-003 | `backend/main.py` | upload history 用 module globals，併發 race | `asyncio.Lock` 或 `history_repository` atomic write（建議併入 TD-006 RFC） | 多 worker 部署 / TD-006 啟動 |
| TD-004 | `frontend/src/components/MatchList.tsx` | `PredictorChart` effect deps 不含 candle values，長度相同但內容不同 → 殘留舊 chart | 改用 memoized chart input 或 data identity hash，同時移除 exhaustive-deps suppression | 與 TD-005 同梯次 |
| TD-005 | `frontend/src/AppPage.tsx` | 22 KB 單檔，責任含 official CSV parse / upload workflow / MA99 loading / prediction orchestration / derived stats / selection state / layout | 拆 `useOfficialInput()` / `useHistoryUpload()` / `usePredictionWorkspace()` + 左右 rail 抽 presentational sub-section | K-013 驗收後 → Architect RFC |
| TD-006 | `backend/main.py` | 12 KB 單檔，FastAPI wiring / CSV parse / mutable state / 持久化 / prediction orchestration / SPA fallback 全混 | 拆 `history_repository.py` / `history_service.py` / `prediction_service.py`，`main.py` 僅留薄路由層；建議併 TD-003 | K-013 驗收後 → Architect RFC（併 TD-003） |
| TD-007 | `backend/predictor.py` | 17 KB 單檔，time normalize / MA99 helpers / similarity / trend classify / 1D aggregation / stats generation 全混 | 拆 `predictor_ma.py` / `predictor_similarity.py` / `predictor_stats.py`，`predictor.py` 作 orchestration entrypoint。`compute_stats` 搬進 `predictor_stats.py` 時 K-013 contract fixture 需同步遷移 | K-013 驗收後 → Architect RFC |
| TD-008 | cross-layer stats | 前後端各算一次有漂移風險 | **已決策 Option C（見上節）**，K-013 實作中 | 實作中 |

**RFC 排序（PM 確認）：**
1. K-013 實作 + 驗收（TD-008 落地）
2. TD-005 RFC（`AppPage.tsx` 拆分；`usePredictionWorkspace()` 邊界以 K-013 抽出的 `statsComputation.ts` 為基礎）
3. TD-006 + TD-003 合併 RFC（backend 拆分 + 併發 lock）
4. TD-007 RFC（`predictor.py` 拆分；contract fixture 同步遷移）

---

## Time Format Convention

**傳輸/儲存層統一 UTC+0 `YYYY-MM-DD HH:MM`（16 字元）。Render 層才轉 UTC+8。**

- 後端：`time_utils.normalize_bar_time()` 負責統一轉換（ISO、Unix ms、ISO with `HH:MM:SS` 都接受）
- 前端 API payload：UTC+0
- 前端 render：`utils/time.ts::toUTC8Display()` 在顯示前轉 UTC+8 `MM/DD HH:mm`
- Chart（lightweight-charts）：timestamp 先 +8h 再餵給 library，讓 UTC-based x-axis 顯示 UTC+8 labels

> 此規範源自 2026-04 bug fix：UTC vs UTC+8 混用導致 MA99 方向判斷錯誤。

---

## Frontend ↔ Backend Field Mapping

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| `ohlc_data` | `ohlcData` |
| `selected_ids` | `selectedIds` |
| `start_date` | `startDate` |
| `end_date` | `endDate` |
| `historical_ohlc` | `historicalOhlc` |
| `future_ohlc` | `futureOhlc` |
| `historical_ohlc_1d` | `historicalOhlc1d` |
| `future_ohlc_1d` | `futureOhlc1d` |
| `historical_ma99` | `historicalMa99` |
| `future_ma99` | `futureMa99` |
| `historical_ma99_1d` | `historicalMa991d` |
| `future_ma99_1d` | `futureMa991d` |
| `win_rate` | `winRate` |
| `mean_correlation` | `meanCorrelation` |
| `query_ma99_1h` | `queryMa991h` |
| `query_ma99_1d` | `queryMa991d` |
| `query_ma99_gap_1h` | `queryMa99Gap1h` |
| `query_ma99_gap_1d` | `queryMa99Gap1d` |
| `consensus_forecast_1h` | `consensusForecast1h` |
| `consensus_forecast_1d` | `consensusForecast1d` |
| `ma99_trend_override` | `ma99TrendOverride` |

---

## Frontend Routing

使用 `react-router-dom` BrowserRouter，路由定義於 `main.tsx`。

| Path | Component | 說明 |
|------|-----------|------|
| `/` | `HomePage` | Hero + ProjectLogic + DevDiary 預覽 |
| `/app` | `AppPage` | K-Line 預測功能（原 App.tsx；TD-005 待拆分）。**K-030 isolation**：不渲染 UnifiedNavBar、不渲染 HomeFooterBar；根 div 套 `bg-gray-950 text-gray-100` 覆蓋 body paper；視為獨立 tool viewport（由 marketing 頁 NavBar 的 App link 開 new tab 進入） |
| `/about` | `AboutPage` | Portfolio-oriented recruiter page — 7 sections: PageHeader（One operator 聲明）+ MetricsStrip + RoleCards (6 roles × Owns/Artefact) + ReliabilityPillars (3 pillars + anchor quotes) + TicketAnatomy (K-002/K-008/K-009) + ProjectArchitecture + FooterCta（email/GitHub/LinkedIn）。`BuiltByAIBanner` 放 `/` homepage；`/about` 不含 banner showcase（K-031 移除 S7 BuiltByAIShowcaseSection）。K-017 重寫（2026-04-19），K-031 移除 S7 showcase（2026-04-21）|
| `/diary` | `DiaryPage` | 工作日誌 Timeline（讀 `public/diary.json`） |
| `/business-logic` | `BusinessLogicPage` | 交易邏輯（密碼保護，JWT 驗證後顯示） |
| `*` | `Navigate to /` | 未匹配路徑一律導回首頁 |

**NavBar：** `UnifiedNavBar` 掛在 4 個 marketing 頁面頂端（`/` / `/about` / `/diary` / `/business-logic`；K-005 統一方案 → K-021 設計系統對齊 → K-030 從 `/app` 撤除）。左側 home icon 連 `/`，右側 TEXT_LINKS：App / Diary / About（Prediction 暫隱藏，以常數註解保留）；active 狀態用 `aria-current="page"` + class `text-[#9C4A3B]`（brick-dark），非 active `text-[#6B5F4E]`（muted）。背景 `bg-paper`（#F4EFE5）。**K-030 起** `App` entry 於 TEXT_LINKS 標 `external: true`，改渲染原生 `<a target="_blank" rel="noopener noreferrer">` 而非 `<Link>`，使點擊於新 tab 開 `/app`。

---

## Design System (K-021)

**設計稿來源：** `frontend/design/homepage-v2.pen`（4 個 top-level frames：Homepage 4CsvQ / About 35VCj / Diary wiDSi / Business Logic VSwW9）
**設計文件：** [K-021-sitewide-design-system.md](../docs/designs/K-021-sitewide-design-system.md)

### Tokens

**Tailwind `theme.extend.colors`（K-021 註冊，替代目前 inline `[#XXXXXX]`）：**

| Token | Value | 用途 |
|-------|-------|------|
| `paper` | `#F4EFE5` | 全站底色 body bg |
| `ink` | `#1A1814` | 主文字 |
| `brick` | `#B43A2C` | Logo / brand 主色 |
| `brick-dark` | `#9C4A3B` | NavBar active link + CTA 按鈕 |
| `charcoal` | `#2A2520` | 次文字 / 輔助元素 |
| `muted` | `#6B5F4E` | Footer / meta / NavBar non-active |

**Tailwind `theme.extend.fontFamily`：**

| Token | Stack | 用途 |
|-------|-------|------|
| `display` | `['"Bodoni Moda"', 'serif']` | H1 / hero / section title |
| `italic` | `['Newsreader', 'serif']` | italic emphasis / blockquote |
| `mono` | `['"Geist Mono"', 'monospace']` | 程式碼 / 數據 / Footer meta |

**字型載入：** Google Fonts CDN via `index.html` preconnect + stylesheet link（既有，無需改）。

### 全站 Body CSS 入口

`frontend/src/index.css` 採 `@layer base` 註冊 body 預設：

```
@layer base {
  body { @apply bg-paper text-ink font-display; }
}
```

所有頁面的外層 `<div className="min-h-screen bg-[#0D0D0D] text-white">` 包 wrap（AboutPage / DiaryPage / AppPage / BusinessLogicPage）於 K-021 移除，改由 body 底色承接。HomePage 已是 `bg-[#F4EFE5]` 直接轉為繼承 body。

**例外（K-030）：** `/app` 於 wrapper 層 override（`h-screen` 根 div 套 `bg-gray-950 text-gray-100`），body paper 規則對 `/app` 的視覺效果被完全覆蓋。`/app` 不屬 sitewide paper design system（tool page，非 marketing page）；此例外獨立守護於 `frontend/e2e/app-bg-isolation.spec.ts`。

### Footer 放置策略

**決策：per-page import（非 Layout slot）**，原因：AppPage `h-screen overflow-hidden` 與 Layout slot 模型衝突，per-page 才能讓各頁獨立決定是否渲染 Footer 與放置位置（/diary 本票不決定、由 K-024 處理）。

| 頁面 | Footer |
|------|--------|
| `/` | `<HomeFooterBar />` |
| `/about` | `<FooterCtaSection />`（註：K-021 同步把 text-white / border-white/10 等 dark-theme 遺留色改為 paper-theme，否則 paper bg 上不可見） |
| `/diary` | 無 footer（K-021 本票不決定；由 K-024 處理） |
| `/app` | 無 footer（K-030 isolation — `/app` 為獨立 tool viewport，撤除 NavBar 與 Footer 使其不繼承 marketing site chrome） |
| `/business-logic` | `<HomeFooterBar />` |

### Shared Components 邊界

| 組件 | 位置 | 用於 |
|------|------|------|
| `UnifiedNavBar` | `components/UnifiedNavBar.tsx` | `/` `/about` `/diary` `/business-logic`（K-030 起 `/app` 不渲染；TEXT_LINKS 的 `App` entry 標 `external: true`，於 4 marketing 頁點擊時開 new tab 載入 `/app`） |
| `HomeFooterBar` | `components/home/HomeFooterBar.tsx` | `/` `/business-logic`（K-030 起 `/app` 撤出） |
| `FooterCtaSection` | `components/about/FooterCtaSection.tsx` | `/about`（獨有 3 external links 結構） |

### Legacy NavBar

`components/NavBar.tsx`（legacy）於 K-021 驗收後若無 consumer 則刪除（Engineer grep 確認）。

---

## QA Artifacts

**目的：** QA 完成回歸測試後，需產出視覺化報告給 PM / 使用者檢視 UI 現況。

**位置：** `docs/reports/K-XXX-visual-report.html`（每張 ticket 一份，檔名由 env var `TICKET_ID` 決定）

**產生方式：**

```bash
cd frontend
TICKET_ID=K-008 npx playwright test visual-report.ts
```

- Runner：Playwright test runner（沿用 `playwright.config.ts` 的 `webServer` 與 `baseURL`）
- 涵蓋路由（MVP）：`/` / `/app` / `/about` / `/diary` 4 條公開頁全頁截圖；`/business-logic` 標「需登入，下期補」placeholder，不截圖
- 輸出格式：單一 HTML 檔，截圖以 PNG base64 inline 嵌入（離線可開、可 commit、方便分享）
- HTML header Pages 摘要行模板：`Pages: {successes} captured, {failures} failed, {authRequired} auth-required (not captured)`。三欄分別對應 `SectionResult` 三種 status（`success` / `failure` / `auth-required`），auth-required 獨立列出讓 PM 一眼看出「哪些頁被 placeholder 帶過、哪些真的截到」
- 失敗策略：單頁失敗不中斷，繼續截其他頁，在 section 標紅色邊框 + 錯誤訊息；script 最終 `exit 1`
- 未設 `TICKET_ID` → 預設檔名 `K-UNKNOWN-visual-report.html` + stdout warning

**Script 位置：** `frontend/e2e/visual-report.ts`

**Spec 區隔（per-project testMatch，final）：** `playwright.config.ts` 將 E2E suite 拆成 2 個 project：
- `chromium` — `testMatch: /.*\.spec\.ts$/`，只吃 `*.spec.ts`，不含 `visual-report.ts`
- `visual-report` — `testMatch: /visual-report\.ts$/`，只吃 `visual-report.ts`

**Rationale：** 原設計假設分支只有「default glob 吃 / 不吃」兩種，實測後發現第三分支——「default discover 不吃 `visual-report.ts`（因非 `.spec.ts`），但 CLI 指檔 `npx playwright test visual-report.ts` 也會被 default `testMatch` 擋掉，導致無法顯式執行」。此情境下 `testIgnore` 解決不了 CLI 指檔問題，只有「把 visual-report 放進專屬 project」才能同時達成「default run 不跑它」+「指檔或 `--project=visual-report` 能跑」。

**副作用（Engineer / Reviewer 須留意）：**
- 新增 E2E spec：檔名維持 `*.spec.ts` → 自動歸入 `chromium` project，無需額外設定
- 新增其他 visual-report 類腳本：若檔名非 `visual-report.ts`，需新建 project 或擴充 `visual-report` project 的 `testMatch` regex（例如 `/(visual-report|a11y-report)\.ts$/`）
- 未指定 `--project` 直接 `npx playwright test` 時，Playwright 會跑所有 project（含 `visual-report`）。若要避開，需 `--project=chromium`；K-008 QA pipeline 預期使用者指 file 或 `--project`，不靠 default

**K-008 後的擴充方向（不在 K-008 scope）：**
- Ticket → 頁面 mapping（依需求加）
- 分 section 截圖（取代全頁）
- Auth fixture 登入後截 `/business-logic`
- 單檔過大時切換為分檔目錄模式

---

## GA4 E2E Test Matrix (K-018 + K-020)

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

---

## Scripts & Public Protocols Doc（K-017 起）

### `scripts/audit-ticket.sh`

**定位：** Portfolio demo script，展示 6-role + doc trail 機制的可驗證性；**不是 CI gate**（不接 pre-commit / GitHub Actions）。

**Usage：** `./scripts/audit-ticket.sh K-XXX`（從專案根目錄執行；script 內含 `cd` 保險）

**Check groups：** A. Ticket file frontmatter / B. AC + PRD mapping / C. Architecture design / D. Commit trail / E. Code Review 反省 / F. 5 角色反省 + per-role log（K-008+ 才含）/ G. Playwright spec + visual report HTML（K-008+ 才含）

**Date-based skip：** `created < 2026-04-18` 的 ticket F/G 直接 SKIP（per-role retro 機制啟用前）

**Exit codes：** 0 = all pass / 1 = warning / 2 = critical missing

**實作約束：** bash only（不依賴 node / python / jq），ANSI escape 上色（TTY detect），shebang `#!/usr/bin/env bash`

### `docs/ai-collab-protocols.md`

**定位：** 公開版協議文件，對外 recruiter 可讀；從 `/about` Section 4「How AI Stays Reliable」三個 pillar inline link 進入。

**結構：** 三個主 section — `Role Flow` / `Bug Found Protocol` / `Per-role Retrospective Log` —  每個含 stable anchor（`{#role-flow}` / `{#bug-found-protocol}` / `{#per-role-retrospective-log}`）讓 `/about` pillar 深度連結。附 curated retrospective 節選 2–3 條。

**部署：** Copy / symlink 到 `frontend/public/docs/ai-collab-protocols.md`，避免 Firebase SPA fallback 吞 `.md` 路徑。

---

## Auth Flow（Business Logic）

`BusinessLogicPage` 掛載時的 token 狀態機：

```
mount → 讀 localStorage('bl_token')
  ├─ 無 token
  │   └─ → SHOW_PASSWORD_FORM
  ├─ 有 token，exp ≤ now（已過期）
  │   └─ 清除 localStorage → SHOW_PASSWORD_FORM + 過期提示
  └─ 有 token，exp > now（有效）
      └─ → LOADING_CONTENT → GET /api/business-logic
            ├─ 200 → SHOW_CONTENT（渲染 Markdown）
            └─ 401 → 清除 localStorage → SHOW_ERROR

SHOW_PASSWORD_FORM → 使用者輸入密碼 → POST /api/auth
  ├─ 200 → 存 token 至 localStorage → LOADING_CONTENT（接上面流程）
  └─ 401 → SHOW_ERROR（密碼錯誤提示）
```

**環境變數：**
- `BUSINESS_LOGIC_PASSWORD` — 驗證密碼
- `JWT_SECRET` — JWT 簽名 secret

**Token 規格：**
- Algorithm: HS256
- 有效期：24 小時（`exp = iat + 86400`）
- Subject: `"business-logic-access"`

---

## Changelog

- **2026-04-22**（Architect, K-029 設計）— `/about` leaf 組件 paper palette 遷移完成設計：`components/about/ArchPillarBlock.tsx`（3 處：body `text-gray-300`→`text-muted` / pyramid li `text-gray-400`→`text-muted` / layer span `text-gray-300`→`text-ink`，加 `data-testid="arch-pillar-body"` + `arch-pillar-layer`）、`components/about/TicketAnatomyCard.tsx`（4 處：badge `text-purple-400`→`text-charcoal` / body wrapper `text-gray-400`→`text-muted` / Outcome + Learning label `text-gray-500`→`text-muted`，加 `data-testid="ticket-anatomy-body"` + `ticket-anatomy-id-badge"`）。K-022 A-12 遺漏補齊；/about 所有 card 文字全面對齊 paper palette。`frontend/e2e/about-v2.spec.ts` 新增 AC-029-ARCH-BODY-TEXT（9 assertions）+ AC-029-TICKET-BODY-TEXT（12 assertions）共 21 new computed `color` 斷言；沿用 L174-L198 canonical color-assertion pattern。無後端 / API / 路由 / props interface 變更。設計文件：[K-029-about-card-body-text-palette.md](../docs/designs/K-029-about-card-body-text-palette.md)。未改 code（Architect 僅設計），Engineer 交付後補檔案異動項。
- **2026-04-22**（Architect, K-020 設計）— GA4 SPA Pageview E2E 測試硬化設計：新增 `frontend/e2e/ga-spa-pageview.spec.ts`（9 tests：SPA-NAV × 2 + BEACON × 4 + NEG × 3）；`ga-tracking.spec.ts`（K-018）保留不動；新增 §GA4 E2E Test Matrix 段落（layer / owns / intercept contract / payload pins / hook behavior lock / K-018 regression guard）。No production code change. 設計文件：[K-020-ga-spa-pageview-e2e.md](../docs/designs/K-020-ga-spa-pageview-e2e.md)。
- **2026-04-21**（PM, K-013 close + merge + deploy）— K-013 Consensus / Stats SSOT（TD-008 Option C）closed after R2 bug-found remediation. Merge commit to main + Firebase Hosting deploy + PRD §3→§4 migration + PM-dashboard deregister + Deploy Record block appended. Final gate: tsc 0 / vitest 45/45 / pytest 68/68 / playwright 173+1 skipped / K-013 spec 4/4.
- **2026-04-21**（PM, K-013 Round 2 Code Review 裁決）— SQ-013-01 premise retracted：Round 2 Fix 1 `853a8aa` 於 `AppPage.tsx` 恢復 OLD base `b0212bb` L224-226 無條件 `consensusForecast1h/1d` 注入，證偽原設計文件「全集下無 consensus 圖 pre-existing」假設；`docs/designs/K-013-consensus-stats-ssot.md` §0.3 / §2.3 / §8.1 / §9.3 更新 + `agent-context/architecture.md` `Consensus Stats Source of Truth` 段 Known Gap 改為 wire-level vs observable 分層敘述。wire-level `consensus_forecast_*` 仍回 `[]`（AppPage 層注入 observable），不視為 architecture debt。K-013 AC-013-APPPAGE 文字同步更正為「呼叫 util 取 projectedFutureBars + 無條件注入 consensusForecast1h/1d」；AC-013-APPPAGE-E2E 於 ticket §驗收條件正式補列。TD-K013-R2-01（Vitest 1-bar fixtures dev-mode warn noise）+ TD-K013-R2-02（Reviewer persona Gate 4 dry-run / Post-Fix Doc Consistency）登記追蹤。no code change（docs-only）。
- **2026-04-21**（Engineer, K-013 實作）— TD-008 Option C 落地完成：`frontend/src/utils/statsComputation.ts` 新檔（純 util `computeStatsFromMatches` + snake→camel whitelist helpers）；`frontend/src/AppPage.tsx` 刪除 inline `computeDisplayStats` + `buildProjectedSuggestion`，`projectedFutureBars` + `displayStats` 合併進單一 `workspace` useMemo（full-set 走 backend baseline，subset 呼叫 util 並合併 `consensusForecast1h/1d`）；`backend/tests/fixtures/` 新目錄（generator + 3-case JSON，case 重設 current_close=2000 同 base 以避開 .005 rounding 邊界）；`backend/tests/test_predictor.py` +5 contract tests（`math.isclose(rel_tol=1e-6, abs_tol=1e-6)`）；`frontend/src/__tests__/statsComputation.test.ts` 9 tests；`backend/predictor.py::compute_stats` + `_projected_future_bars` 補 docstring 明示 full-set baseline + fixture 鎖 parity。Gate：tsc exit 0 / pytest 68 passed / vitest 45 passed / playwright 174 passed。`git diff main -- backend/models.py` 空 diff — AC-013-API-COMPAT 驗證通過。
- **2026-04-21**（Architect, K-013 設計）— TD-008 Option C 落地設計完成：Directory Structure 新增 `frontend/src/utils/statsComputation.ts`（純 util，subset stats 計算）、`frontend/src/__tests__/statsComputation.test.ts`（Vitest contract test）、`backend/tests/fixtures/` 子目錄（含 `__init__.py` / `stats_contract_cases.json` / `generate_stats_contract_cases.py`）；`utils/` 補列 `analytics.ts`（K-018 遺漏項）。§Consensus Stats Source of Truth 段補 generator script + Known Gap（`consensus_forecast_1h/1d` 目前永遠 `[]`，contract test 不比對此欄位；全集下無 consensus 圖屬 pre-existing 行為）。Data Flow 段 subset 分支文字從「抽出中」改為「落地」。設計文件：[K-013-consensus-stats-ssot.md](../docs/designs/K-013-consensus-stats-ssot.md)。未改 code（Architect 僅設計）。
- **2026-04-21**（Architect, K-030 設計）— `/app` isolation：Design System §"Footer 放置策略" 表 `/app` 欄改為「無 footer（K-030 isolation）」；§"Shared Components 邊界" 表更新 `UnifiedNavBar` used-by 欄為 4 marketing 路由（`/app` 撤除）、`HomeFooterBar` used-by 欄縮為 `/ /business-logic`；§"全站 Body CSS 入口" 段加 K-030 例外註記（`/app` wrapper 層 override body paper，套 `bg-gray-950 text-gray-100`）。UnifiedNavBar TEXT_LINKS shape 新增 `external?: boolean`，App entry 設 `external: true` 改渲染 `<a target=_blank rel=noopener noreferrer>`（desktop + mobile 兩 map 同步）。AppPage 根 div 回到 pre-K-021 `bg-gray-950 text-gray-100` + 撤除 UnifiedNavBar + HomeFooterBar 子節點。E2E spec 連動（Engineer 交付後補磁碟異動）：`sitewide-body-paper.spec.ts` / `sitewide-footer.spec.ts` / `sitewide-fonts.spec.ts` 刪 `/app` case；`navbar.spec.ts` 刪 `/app` iteration；新增 `app-bg-isolation.spec.ts`（6 test cases：AC-030-NEW-TAB NavBar + NO-NAVBAR + NO-FOOTER + BG-COLOR wrapper + BG-COLOR body + Hero CTA new-tab）。設計文件：[K-030-app-isolation.md](../docs/designs/K-030-app-isolation.md)。
- **2026-04-21**（Architect, K-031 設計）— `/about` S7 `BuiltByAIShowcaseSection` 移除：Summary 段 `8 sections` → `7 sections`；Directory Structure about/ block FooterCtaSection 註解 `S8` → `S7`（S7 空出，post-K-031 FooterCta 重編為 S7）；Frontend Routing `/about` 列 `8 sections` → `7 sections`，刪除誤導性的 `S7 (BuiltByAIBanner) 放 /` 括號（`BuiltByAIBanner` 是 homepage 組件，與已刪的 S7 `BuiltByAIShowcaseSection` 是不同組件），改註明 K-031 移除 S7 showcase。Pre-existing drift 順便 flag：`BuiltByAIShowcaseSection.tsx` 原本就未列入 Directory Structure（K-017 Pass 3 新增時漏填），故不需從 tree 移除。`SectionContainer` L147 consumer count `7 sections` 原本為 8-container 時代的 drift，K-031 移除後 value 意外對齊，保留不動。無 code 變更（Architect 設計；Engineer 交付後若需再補充配合 code diff）。設計文件 `docs/designs/K-031-remove-builtby-ai-showcase.md`。
- **2026-04-21**（Architect, K-028 設計）— Homepage visual fix 設計：`HomePage.tsx` 將 HeroSection / ProjectLogicSection / DevDiarySection 三個 body section 包進 `<div data-testid="homepage-sections" class="flex flex-col gap-6 sm:gap-[72px]">`（對齊 Pencil frame `4CsvQ` `hpBody` `gap:72`）；`DevDiarySection.tsx` 從 absolute positioning（`ENTRY_HEIGHT=140` 固定假設）改為 flex-col flow layout，移除 `ENTRY_HEIGHT` / `ENTRY_GAP` / `totalHeight` 常數，entry 高度改由內容決定；rail 改用 `top:40 / bottom:40` 自動撐高；新增 `data-testid="homepage-sections"` / `"diary-entries"` / `"diary-entry-wrapper"`；K-023 AC-023-DIARY-BULLET（marker 20×14 brick-dark radius 0） / AC-023-STEP-HEADER-BAR / AC-023-BODY-PADDING 全部 preserved。`pages.spec.ts` 新增 `AC-028-SECTION-SPACING`（desktop+mobile gap 斷言）+ `AC-028-DIARY-ENTRY-NO-OVERLAP`（desktop+mobile bounding box + rail visibility）共 5 test cases。設計文件：[K-028-homepage-visual-fix.md](../docs/designs/K-028-homepage-visual-fix.md)。Engineer 接手後補檔案異動項。
- **2026-04-21**（Architect, K-023 設計）— Directory Structure drift fix: 移除 `home/StepCard.tsx` + `home/TechTag.tsx` ghost entries（兩檔從未建立，step cards inline 於 `ProjectLogicSection.tsx`；ls 確認磁碟不存在）。K-023 設計文件產出 `docs/designs/K-023-homepage-structure.md`（含 4 個 Scope Questions 交 PM 裁決）。no structural code change — docs-only.
- **2026-04-21**（PM, K-022 Code Review 裁決）— K-022 /about 結構細節 v2 交付後補入：about/ 新組件 DossierHeader.tsx / RedactionBar.tsx；CardShell.tsx dark→paper palette 遷移；SectionLabel.tsx 新增 SectionLabelRow（hairline + label）；PillarCard consumer 加 overflow-hidden（圓角修正）；PageHeaderSection 三層結構（主句 Bodoni Moda / 角色列 Newsreader / tagline Bodoni Moda）；5 section label（Nº 01~05）；6 Role Cards OWNS/ARTEFACT Geist Mono small-caps label
- **2026-04-21**（Architect, K-027 設計）— `diary/` 組件 Directory Structure drift 修正：K-017 Pass 2 P4/P7 primitive 重構未落地（`MilestoneAccordion.tsx` / `DiaryEntryRow.tsx` / `VerticalRail.tsx` / `TimelineMarker.tsx` 磁碟不存在），`MilestoneSection.tsx` / `DiaryEntry.tsx` 保留；K-027 hotfix：`DiaryEntry.tsx` 加 `flex-col sm:flex-row` + `break-words`；`MilestoneSection.tsx` 展開區加 `overflow-hidden` + `mb-4 sm:mb-3`；新增 `frontend/e2e/diary-mobile.spec.ts`（7 test cases：AC-027-NO-OVERLAP × 3 viewport + AC-027-TEXT-READABLE × 3 viewport + AC-027-DESKTOP-NO-REGRESSION × 1）
- **2026-04-20**（Architect, W-5 文件 drift 修復）— `### Footer 放置策略` 表 `/diary` 與 `/app` 兩列顛倒修正：`/diary` 改為「無 footer（K-024 處理）」、`/app` 改為 `<HomeFooterBar />`（對齊 K-021 設計文件 §7.5 與 AC-021-FOOTER）；同段 rationale 文字調整，不再沿用「AppPage 無 footer」錯述。無 code 變更。
- **2026-04-20**（Architect, K-021 設計）— 全站設計系統基建：新增 `## Design System (K-021)` 段（paper/ink/brick/brick-dark/charcoal/muted 6 color tokens + display/italic/mono 3 font tokens + body `@layer base` 入口 + Footer per-page 策略 + shared components 邊界表）；Frontend Routing 段 NavBar 敘述更新為 `aria-current="page"` + TEXT_LINKS 順序 App/Diary/About（Prediction 隱藏）+ active class `text-[#9C4A3B]` + bg-paper。設計文件：[K-021-sitewide-design-system.md](../docs/designs/K-021-sitewide-design-system.md)。未改 code（Architect 僅設計），Engineer 交付後補檔案異動項。
- **2026-04-19**（Architect, K-018 設計）— GA4 Tracking 設計完成；預計新增：`frontend/src/utils/analytics.ts`（initGA/trackPageview/trackCtaClick）、`frontend/src/hooks/useGAPageview.ts`、`frontend/src/components/home/BuiltByAIBanner.tsx`（homepage thin banner，K-017 預計交付但尚未建立）、`frontend/e2e/ga-tracking.spec.ts`；修改：`main.tsx`（GATracker + initGA）、`FooterCtaSection.tsx`（click handlers + GA 聲明文字）、`HomePage.tsx`（BuiltByAIBanner 渲染）、`playwright.config.ts`（webServer.env VITE_GA_MEASUREMENT_ID=G-TESTID0000）；技術選型：手刻 `gtag.js`（不引入 react-ga4）；pageview spy：`window.dataLayer` + `addInitScript` spy 策略（不打真實網路）
- **2026-04-19**（Architect, K-017 Pass 2 — cross-page component audit）— 新增 `frontend/src/components/primitives/` 目錄（P1–P7：SectionContainer / CardShell / ExternalLink / MilestoneAccordion / DiaryEntryRow / VerticalRail / TimelineMarker，後兩者為 Q8 Pencil 盲抽條件性 primitive）；新增 `hooks/useDiary.ts`；diary/ 刪除 `MilestoneSection.tsx` + `DiaryEntry.tsx`（由 P4 / P7 取代）；home/ 刪除 `DiaryPreviewEntry.tsx`（由 P4 取代）；`DevDiarySection.tsx` 改用 P4；RoleCard interface 重設（Pass 1 已列，Pass 2 明定 6 role 含 Reviewer）；Summary 段補 Pass 2 note。
- **2026-04-19**（Architect, K-017 設計）— `/about` 重寫為 portfolio-oriented recruiter page：Directory Structure 下 about/ 子目錄刷新（刪 12 舊組件 / 新增 11 組件 / 改寫 PageHeader + RoleCard interface），home/ 加 `BuiltByAIBanner.tsx`；頂層 docs/ 加 `ai-collab-protocols.md` + retrospectives/ 子目錄註解；新增頂層 `scripts/` 目錄 + `audit-ticket.sh`；新增 `frontend/public/docs/` 供 SPA Hosting 直接訪問 `.md`；Frontend Routing 表 `/about` 說明全改；新增 `## Scripts & Public Protocols Doc` 段記錄 audit-ticket.sh + ai-collab-protocols.md 定位 / usage / skip 規則 / exit code / 部署約束。
- **2026-04-18**（Architect, K-008 W2/S3 修復）— W2/S3 drift 修復 — per-project testMatch 決策 + Pages 行同步。§QA Artifacts 改寫 stale 的 testIgnore 建議為 `chromium` / `visual-report` 兩 project 的 `testMatch` 拆分（含 rationale + 副作用），並補 HTML header Pages 摘要行模板 `{successes} / {failures} / {authRequired}` 與實作對齊
- **2026-04-18**（Architect, K-008 設計）— 新增 `## QA Artifacts` 段（visual-report.ts / docs/reports/ 職責、env var `TICKET_ID` 約定、單檔 inline base64 決策）；Directory Structure 的 `e2e/` 區塊補 `visual-report.ts` + 原漏列的 `ma99-chart.spec.ts` / `navbar.spec.ts`
- **2026-04-18**（Architect）— Reflect Phase 3 state（5 pages / 35 components / Unified NavBar / usePrediction hook / utils/ 四檔）、TD-008 Option C 決策（新增 `## Consensus Stats Source of Truth` 段 + `consensus_forecast_1h/1d` 欄位對應）、modularity debt（新增 `## Known Architecture Debt` 段，條列 TD-003~007 與拆分方向）、修正實際 file layout（hooks 增 `usePrediction.ts`，components 增 `UnifiedNavBar.tsx`，about/home 子目錄組件重列，common/ 新增 `SectionHeader` / `SectionLabel` / `CtaButton`）
- **2026-04-15**（初版）— Phase 1/2 完成：JWT auth + BrowserRouter + 4 pages + business-logic 密碼保護

---

## Retrospective

### 2026-04-18 更新反省

**為何從 2026-04-15 漂移到 2026-04-18 累積 3 天未同步？**

結構性原因：K-001 ~ K-008 的 Architect 介入點設計為「每張票開始前設計、完成後交 Engineer」，**沒有定義「ticket 完成後 Architect 回填 architecture.md」的義務**。實際執行上：
- K-005 Unified NavBar 完成時，新增 `UnifiedNavBar.tsx` 沒回填 directory structure
- K-006/007 陸續抽出 `usePrediction.ts` / `utils/time.ts` / about 子目錄大量組件，Architect 未被召喚回填
- PM 在每次 ticket closed 時只確認 AC 通過，未檢查 architecture.md 是否反映新增/搬移的檔案
- 直到 2026-04-18 要寫 TD-008 RFC 時，才發現 `consensus_forecast_1h/1d` 欄位對應表缺漏、`Known Architecture Debt` 段完全不存在，才逆向把這 3 天的差異補齊

**3 處與實況不符，最嚴重的是哪個？**

最嚴重是 **遺漏 20+ 個 about/home 子目錄組件與 UnifiedNavBar**。舊版 directory structure 只列頂層 components/，把整個 about/ 與 home/ 子樹簡化為單行，任何新 Engineer 或 sub-agent 讀這份文件時會得到「about 頁面由單一組件渲染」的錯印象，進而在修改 AboutPage 時低估影響範圍（實際上有 RoleCard / TechDecCard / PhaseGateBanner 等 14 個組件）。

相較之下：
- `docs/` 位置舊 — 影響面僅是找檔案繞一步
- 遺漏 `usePrediction.ts` — 讀 AppPage.tsx 時能從 import 直接看到，傷害較小

之前沒發現的具體原因：TD-005 登記「AppPage.tsx 過大」時，Architect 只看 AppPage.tsx 本身，未順手掃 `components/about/` 的規模累積（about 子目錄組件數已超過 common/ + diary/ 總和），directory structure 的陳舊沒被當成「技術債」登記。

**下次改善：**
1. **Ticket-level 回填義務**：在 K-Line-Prediction CLAUDE.md 的 Architect 角色下加一條「每張票 close 時，Architect 必須 diff `frontend/src/` 與 `backend/` 實際 file list 對照 architecture.md 的 directory structure，有新增/搬移即同步 update。此為 ticket close 的硬門檻，PM 驗收時檢查。」不再依賴「批次更新」。
2. **Architecture diff 自動化**：用 `tree -L 4 frontend/src backend/` 輸出與 architecture.md 內嵌的 directory block 做文字 diff，CI warn（不 fail）。預期一週內從「人工記得」進化到「漏了會被提醒」。
3. **「新增子目錄」也算架構事件**：K-006 把 about/ 拆成 14 個 sub-component 等同於新增一個「UI module」，應該在當時就觸發 architecture.md 的 Frontend Routing / Components 段更新，而非視為「純組件拆分」。
