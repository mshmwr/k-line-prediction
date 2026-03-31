import { MatchCase } from '../types'

interface Props {
  matches: MatchCase[]
  selected: Set<string>
  onToggle: (id: string) => void
}

export function MatchList({ matches, selected, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-2 overflow-auto max-h-64">
      {matches.map(m => {
        const checked = selected.has(m.id)
        return (
          <label
            key={m.id}
            className={`flex items-center gap-3 p-3 rounded bg-gray-800 border border-gray-700 cursor-pointer transition-opacity ${checked ? '' : 'opacity-50'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(m.id)}
              className="accent-orange-400"
            />
            <div>
              <div className="text-sm font-mono text-orange-300">r = {m.correlation.toFixed(4)}</div>
              <div className="text-xs text-gray-400">{m.startDate}</div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
