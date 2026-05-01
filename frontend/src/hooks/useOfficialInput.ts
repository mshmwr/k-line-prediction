import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ma99Gap, OHLCRow } from '../types'
import { aggregateRowsTo1D } from '../utils/aggregation'
import {
  emptyRows,
  isRowComplete,
  parseOfficialCsvFile,
} from '../utils/officialCsvParsing'
import { trackCsvUploaded, trackDemoStarted } from '../utils/analytics'

interface Ma99Result {
  queryMa991h: (number | null)[]
  queryMa991d: (number | null)[]
  queryMa99Gap1h: Ma99Gap | null
  queryMa99Gap1d: Ma99Gap | null
}

interface UseOfficialInputParams {
  computeMa99: (rows: OHLCRow[], timeframe: string) => Promise<Ma99Result>
  resetPredictionState: () => void
}

interface UseOfficialInputReturn {
  ohlcData: OHLCRow[]
  viewTimeframe: '1H' | '1D'
  loadError: string | null
  sourcePath: string
  maLoading: boolean
  queryMa99: (number | null)[]
  queryMa99Gap: Ma99Gap | null
  ohlcComplete: boolean
  completedRows: OHLCRow[]
  apiRows: OHLCRow[]
  setQueryMa99: (vals: (number | null)[]) => void
  setQueryMa99Gap: (gap: Ma99Gap | null) => void
  handleOfficialFilesUpload: (files: FileList) => void
  handleCellChange: (rowIdx: number, field: keyof OHLCRow, value: string) => void
  handleTimeframeChange: (nextTimeframe: '1H' | '1D') => Promise<void>
}

/**
 * Owns all official CSV input state: ohlcData, viewTimeframe, MA99, loadError,
 * sourcePath, maLoading. Exposes derived apiRows and ohlcComplete.
 * Used on: AppPage
 */
export function useOfficialInput({
  computeMa99,
  resetPredictionState,
}: UseOfficialInputParams): UseOfficialInputReturn {
  const [ohlcData, setOhlcData] = useState<OHLCRow[]>(() => emptyRows(48))
  const [viewTimeframe, setViewTimeframe] = useState<'1H' | '1D'>('1H')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sourcePath, setSourcePath] = useState('No file uploaded yet.')
  const [maLoading, setMaLoading] = useState(false)
  const [queryMa99, setQueryMa99] = useState<(number | null)[]>([])
  const [queryMa99Gap, setQueryMa99Gap] = useState<Ma99Gap | null>(null)
  const [searchParams] = useSearchParams()

  const ohlcComplete = useMemo(() => ohlcData.every(isRowComplete), [ohlcData])
  const completedRows = useMemo(() => ohlcData.filter(isRowComplete), [ohlcData])
  const apiRows = useMemo(
    () => (viewTimeframe === '1D' ? aggregateRowsTo1D(completedRows) : completedRows),
    [completedRows, viewTimeframe],
  )

  // K-057 Phase 2 — `/app?sample=ethusdt` auto-load.
  // Fetches the bundled `/examples/ETHUSDT_1h_test.csv`, parses via the
  // shared `parseOfficialCsvFile` (K-046 Sacred — bit-exact backend contract),
  // then mirrors the post-upload flow from `handleOfficialFilesUpload` so the
  // sample row set, MA99 series, and source-path label all match what a real
  // CSV upload would produce. Runs once on mount when the query param is set.
  useEffect(() => {
    if (searchParams.get('sample') !== 'ethusdt') return
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/examples/ETHUSDT_1h_test.csv')
        if (!response.ok) throw new Error(`Sample fetch failed: HTTP ${response.status}`)
        const text = await response.text()
        const rows = parseOfficialCsvFile(text, 'ETHUSDT_1h_test.csv')
        if (cancelled) return
        const nextApiRows = viewTimeframe === '1D' ? aggregateRowsTo1D(rows) : rows
        setOhlcData(rows)
        setSourcePath('ETHUSDT_1h_test.csv (sample)')
        trackDemoStarted()
        resetPredictionState()
        setQueryMa99([])
        setQueryMa99Gap(null)
        setMaLoading(true)
        try {
          const ma99Result = await computeMa99(nextApiRows, viewTimeframe)
          if (cancelled) return
          setQueryMa99(viewTimeframe === '1D' ? (ma99Result.queryMa991d ?? []) : (ma99Result.queryMa991h ?? []))
          setQueryMa99Gap(viewTimeframe === '1D' ? (ma99Result.queryMa99Gap1d ?? null) : (ma99Result.queryMa99Gap1h ?? null))
        } catch (err) {
          if (!cancelled) setLoadError((err as Error).message)
        } finally {
          if (!cancelled) setMaLoading(false)
        }
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleOfficialFilesUpload(files: FileList) {
    setLoadError(null)
    const fileList = Array.from(files)
    Promise.all(
      fileList.map(file => new Promise<OHLCRow[]>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          try {
            resolve(parseOfficialCsvFile(String(e.target?.result ?? ''), file.name))
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
        reader.readAsText(file)
      }))
    ).then(async results => {
      const combined = results.flat().sort((a, b) => a.time.localeCompare(b.time))
      const nextApiRows = viewTimeframe === '1D' ? aggregateRowsTo1D(combined) : combined
      setOhlcData(combined)
      setSourcePath(fileList.map(f => f.name).join(' + '))
      trackCsvUploaded(combined.length)
      resetPredictionState()
      setQueryMa99([])
      setQueryMa99Gap(null)
      setMaLoading(true)
      try {
        const ma99Result = await computeMa99(nextApiRows, viewTimeframe)
        setQueryMa99(viewTimeframe === '1D' ? (ma99Result.queryMa991d ?? []) : (ma99Result.queryMa991h ?? []))
        setQueryMa99Gap(viewTimeframe === '1D' ? (ma99Result.queryMa99Gap1d ?? null) : (ma99Result.queryMa99Gap1h ?? null))
      } catch (err) {
        setLoadError((err as Error).message)
      } finally {
        setMaLoading(false)
      }
    }).catch(err => setLoadError((err as Error).message))
  }

  function handleCellChange(rowIdx: number, field: keyof OHLCRow, value: string) {
    setOhlcData(prev => prev.map((row, index) => index === rowIdx ? { ...row, [field]: value } : row))
  }

  async function handleTimeframeChange(nextTimeframe: '1H' | '1D') {
    if (nextTimeframe === viewTimeframe) return
    setViewTimeframe(nextTimeframe)
    resetPredictionState()
    setLoadError(null)
    setQueryMa99([])
    setQueryMa99Gap(null)
    if (!ohlcComplete) return
    const nextApiRows = nextTimeframe === '1D' ? aggregateRowsTo1D(completedRows) : completedRows
    setMaLoading(true)
    try {
      const ma99Result = await computeMa99(nextApiRows, nextTimeframe)
      setQueryMa99(nextTimeframe === '1D' ? (ma99Result.queryMa991d ?? []) : (ma99Result.queryMa991h ?? []))
      setQueryMa99Gap(nextTimeframe === '1D' ? (ma99Result.queryMa99Gap1d ?? null) : (ma99Result.queryMa99Gap1h ?? null))
    } catch (err) {
      setLoadError((err as Error).message)
    } finally {
      setMaLoading(false)
    }
  }

  return {
    ohlcData,
    viewTimeframe,
    loadError,
    sourcePath,
    maLoading,
    queryMa99,
    queryMa99Gap,
    ohlcComplete,
    completedRows,
    apiRows,
    setQueryMa99,
    setQueryMa99Gap,
    handleOfficialFilesUpload,
    handleCellChange,
    handleTimeframeChange,
  }
}
