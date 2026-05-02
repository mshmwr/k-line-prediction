# Graph Report - frontend/src  (2026-05-02)

## Corpus Check
- Corpus is ~27,021 words - fits in a single context window. You may not need a graph.

## Summary
- 242 nodes · 323 edges · 7 communities detected
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_K-Line Core UI|K-Line Core UI]]
- [[_COMMUNITY_Aggregation & Stats Core|Aggregation & Stats Core]]
- [[_COMMUNITY_Diary Data & Timeline|Diary Data & Timeline]]
- [[_COMMUNITY_App Shell + Analytics|App Shell + Analytics]]
- [[_COMMUNITY_Prediction Workspace|Prediction Workspace]]
- [[_COMMUNITY_Business Logic UI|Business Logic UI]]
- [[_COMMUNITY_Main Chart|Main Chart]]

## God Nodes (most connected - your core abstractions)
1. `computeStatsFromMatches()` - 4 edges
2. `groupByUtc8Day()` - 4 edges
3. `computeWorkspace()` - 3 edges
4. `parseUtcTime()` - 3 edges
5. `formatUtc()` - 3 edges
6. `addHours()` - 3 edges
7. `aggregateNumericBarsTo1D()` - 3 edges
8. `aggregateMaSeriesTo1D()` - 3 edges
9. `aggregateProjectedBarsTo1D()` - 3 edges
10. `isTokenValid()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `GATracker()` --calls--> `useGAPageview()`  [INFERRED]
  main.tsx → hooks/useGAPageview.ts
- `toInputValue()` --calls--> `toUTC8Display()`  [INFERRED]
  components/OHLCEditor.tsx → utils/time.ts
- `formatInterval()` --calls--> `toUTC8Display()`  [INFERRED]
  components/MatchList.tsx → utils/time.ts
- `fromInputValue()` --calls--> `fromUTC8Input()`  [INFERRED]
  components/OHLCEditor.tsx → utils/time.ts
- `DiaryPage()` --calls--> `useDiaryPagination()`  [INFERRED]
  pages/DiaryPage.tsx → hooks/useDiaryPagination.ts

## Communities

### Community 2 - "K-Line Core UI"
Cohesion: 0.09
Nodes (5): formatInterval(), fromInputValue(), toInputValue(), fromUTC8Input(), toUTC8Display()

### Community 3 - "Aggregation & Stats Core"
Cohesion: 0.11
Nodes (19): addHours(), addHoursToUtc8(), aggregateMaSeriesTo1D(), aggregateMaValuesTo1D(), aggregateNumericBarsTo1D(), aggregateProjectedBarsTo1D(), aggregateRowsTo1D(), calculateReturnPct() (+11 more)

### Community 4 - "Diary Data & Timeline"
Cohesion: 0.09
Nodes (4): useDiary(), useDiaryPagination(), DiaryPage(), HomePage()

### Community 5 - "App Shell + Analytics"
Cohesion: 0.08
Nodes (5): ErrorBoundary, useGAPageview(), GATracker(), consentGA(), initGA()

### Community 6 - "Prediction Workspace"
Cohesion: 0.08
Nodes (2): mockFileReader(), uploadOfficialCsv()

### Community 7 - "Business Logic UI"
Cohesion: 0.14
Nodes (3): getTokenExp(), isLoggedIn(), isTokenValid()

### Community 8 - "Main Chart"
Cohesion: 0.28
Nodes (3): parseLocalizedDateTime(), toTime(), toTimestamp()

## Knowledge Gaps
- **Thin community `Prediction Workspace`** (27 nodes): `AppPage.tsx`, `TopBar()`, `TopBar.tsx`, `useHistoryUpload.ts`, `useHistoryUpload()`, `useOfficialInput.ts`, `useOfficialInput()`, `mapGap()`, `usePrediction.ts`, `usePrediction()`, `usePredictionWorkspace.ts`, `usePredictionWorkspace()`, `mockFileReader()`, `AppPage.test.tsx`, `uploadOfficialCsv()`, `parseOfficialCsvFile.test.ts`, `bar()`, `statsByDay.test.ts`, `useOfficialInput.test.ts`, `api.ts`, `emptyRows()`, `isRowComplete()`, `parseExchangeTimestamp()`, `parseOfficialCsvFile()`, `officialCsvParsing.ts`, `computeStatsByDay()`, `statsByDay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiaryPage()` connect `Diary Data & Timeline` to `Shared + Diary UI`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `computeStatsFromMatches()` (e.g. with `computeProjectedFutureBars()` and `computeWorkspace()`) actually correct?**
  _`computeStatsFromMatches()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `computeWorkspace()` (e.g. with `computeStatsFromMatches()` and `aggregateProjectedBarsTo1D()`) actually correct?**
  _`computeWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `About Page Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Shared + Diary UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `K-Line Core UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Aggregation & Stats Core` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._