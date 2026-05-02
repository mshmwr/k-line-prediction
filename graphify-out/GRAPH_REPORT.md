# Graph Report - frontend/src  (2026-05-02)

## Corpus Check
- Corpus is ~25,602 words - fits in a single context window. You may not need a graph.

## Summary
- 235 nodes · 170 edges · 11 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_GATracker()|GATracker()]]
- [[_COMMUNITY_AppPage.tsx|AppPage.tsx]]
- [[_COMMUNITY_analytics.ts|analytics.ts]]
- [[_COMMUNITY_statsComputation.ts|statsComputation.ts]]
- [[_COMMUNITY_aggregation.ts|aggregation.ts]]
- [[_COMMUNITY_auth.ts|auth.ts]]
- [[_COMMUNITY_MatchList.tsx|MatchList.tsx]]
- [[_COMMUNITY_MainChart.tsx|MainChart.tsx]]
- [[_COMMUNITY_ErrorBoundary|ErrorBoundary]]
- [[_COMMUNITY_AppPage.test.tsx|AppPage.test.tsx]]
- [[_COMMUNITY_useDiary()|useDiary()]]

## God Nodes (most connected - your core abstractions)
1. `groupByUtc8Day()` - 4 edges
2. `handleTimeframeChange()` - 3 edges
3. `handlePredict()` - 3 edges
4. `computeStatsFromMatches()` - 3 edges
5. `parseUtcTime()` - 3 edges
6. `formatUtc()` - 3 edges
7. `addHours()` - 3 edges
8. `aggregateNumericBarsTo1D()` - 3 edges
9. `aggregateRowsTo1D()` - 3 edges
10. `aggregateMaSeriesTo1D()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `handleTimeframeChange()` --calls--> `aggregateRowsTo1D()`  [INFERRED]
  AppPage.tsx → utils/aggregation.ts
- `GATracker()` --calls--> `useGAPageview()`  [INFERRED]
  main.tsx → hooks/useGAPageview.ts
- `handlePredict()` --calls--> `trackMatchRun()`  [INFERRED]
  AppPage.tsx → utils/analytics.ts
- `handlePredict()` --calls--> `trackResultViewed()`  [INFERRED]
  AppPage.tsx → utils/analytics.ts
- `toInputValue()` --calls--> `toUTC8Display()`  [INFERRED]
  components/OHLCEditor.tsx → utils/time.ts
- `formatInterval()` --calls--> `toUTC8Display()`  [INFERRED]
  components/MatchList.tsx → utils/time.ts
- `fromInputValue()` --calls--> `fromUTC8Input()`  [INFERRED]
  components/OHLCEditor.tsx → utils/time.ts
- `DiaryPage()` --calls--> `useDiaryPagination()`  [INFERRED]
  pages/DiaryPage.tsx → hooks/useDiaryPagination.ts

## Communities

### Community 8 - "GATracker()"
Cohesion: 0.5
Nodes (2): GATracker(), useGAPageview()

### Community 2 - "AppPage.tsx"
Cohesion: 0.2
Nodes (2): resetPredictionState(), handleTimeframeChange()

### Community 3 - "analytics.ts"
Cohesion: 0.24
Nodes (5): handlePredict(), consentGA(), initGA(), trackMatchRun(), trackResultViewed()

### Community 6 - "statsComputation.ts"
Cohesion: 0.47
Nodes (5): buildProjectedSuggestion(), computeStatsFromMatches(), snakeSuggestionToCamel(), snakeStatsToCamel(), computeProjectedFutureBars()

### Community 1 - "aggregation.ts"
Cohesion: 0.21
Nodes (13): parseUtcTime(), formatUtc(), formatUtcDateOnly(), addHours(), groupByUtc8Day(), aggregateNumericBarsTo1D(), aggregateRowsTo1D(), aggregateMaSeriesTo1D() (+5 more)

### Community 10 - "auth.ts"
Cohesion: 0.83
Nodes (3): getTokenExp(), isTokenValid(), isLoggedIn()

### Community 0 - "MatchList.tsx"
Cohesion: 0.12
Nodes (5): toUTC8Display(), fromUTC8Input(), toInputValue(), fromInputValue(), formatInterval()

### Community 4 - "MainChart.tsx"
Cohesion: 0.28
Nodes (3): parseLocalizedDateTime(), toTimestamp(), toTime()

### Community 11 - "ErrorBoundary"
Cohesion: 0.5
Nodes (1): ErrorBoundary

### Community 13 - "AppPage.test.tsx"
Cohesion: 1.0
Nodes (2): mockFileReader(), uploadOfficialCsv()

### Community 5 - "useDiary()"
Cohesion: 0.25
Nodes (4): useDiaryPagination(), useDiary(), DiaryPage(), HomePage()

## Knowledge Gaps
- **Thin community `GATracker()`** (4 nodes): `main.tsx`, `GATracker()`, `useGAPageview.ts`, `useGAPageview()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AppPage.tsx`** (11 nodes): `AppPage.tsx`, `emptyRows()`, `parseExchangeTimestamp()`, `parseOfficialCsvFile()`, `isRowComplete()`, `computeStatsByDay()`, `resetPredictionState()`, `handleOfficialFilesUpload()`, `handleCellChange()`, `handleTimeframeChange()`, `handleToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ErrorBoundary`** (4 nodes): `ErrorBoundary.tsx`, `ErrorBoundary`, `.getDerivedStateFromError()`, `.render()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AppPage.test.tsx`** (3 nodes): `AppPage.test.tsx`, `mockFileReader()`, `uploadOfficialCsv()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `aggregateRowsTo1D()` connect `aggregation.ts` to `AppPage.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `handleTimeframeChange()` connect `AppPage.tsx` to `aggregation.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `handlePredict()` connect `analytics.ts` to `AppPage.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `handlePredict()` (e.g. with `trackMatchRun()` and `trackResultViewed()`) actually correct?**
  _`handlePredict()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `MatchList.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._