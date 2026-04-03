interface Props {
  rowCount: number
}

export function TopBar({ rowCount }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-700">
      <span className="text-orange-400 font-bold tracking-wide text-sm">K-Line Predictor</span>
      <span className="rounded-full border border-gray-700 px-2 py-1 text-xs text-gray-300">
        Official input upload: 24 x 1H bars
      </span>
      <div className="flex-1" />
      <div className="text-sm text-gray-400">Loaded rows: {rowCount}</div>
    </div>
  )
}
