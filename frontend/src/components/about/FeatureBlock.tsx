interface FeatureBlockProps {
  title: string
  items: string[]
}

export default function FeatureBlock({ title, items }: FeatureBlockProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono font-semibold text-white text-sm border-b border-white/10 pb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-gray-400 text-sm flex gap-2">
            <span className="text-cyan-400 shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
