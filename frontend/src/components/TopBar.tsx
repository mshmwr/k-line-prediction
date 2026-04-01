interface Props {
  n: number
  onNChange: (n: number) => void
  onUseExample: () => void
}

export function TopBar({ n, onNChange, onUseExample }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-700">
      <span className="text-orange-400 font-bold tracking-wide text-sm">K-Line Predictor</span>
      <div className="flex-1" />
      <button
        onClick={onUseExample}
        className="px-3 py-2 rounded text-sm bg-gray-700 text-yellow-300 hover:bg-gray-600 transition-colors whitespace-nowrap"
      >
        💡 Use Example Value
      </button>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm">N bars:</label>
        <input
          type="number" min={5} max={50} value={n}
          onChange={e => onNChange(Number(e.target.value))}
          className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
    </div>
  )
}
