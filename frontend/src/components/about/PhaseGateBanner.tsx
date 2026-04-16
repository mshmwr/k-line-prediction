export default function PhaseGateBanner() {
  const phases = ['Phase 1: Auth', 'Phase 2: Routing', 'Phase 3: Pages', 'Phase 4: Docs', 'Phase 5: Deploy']
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-10">
      {phases.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-mono text-xs border border-purple-400/50 text-purple-300 px-2 py-1">
            {p}
          </span>
          {i < phases.length - 1 && <span className="text-gray-600 text-xs">→</span>}
        </div>
      ))}
    </div>
  )
}
