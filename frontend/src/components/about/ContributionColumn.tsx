interface ContributionColumnProps {
  side: 'human' | 'ai'
  title: string
  items: string[]
  borderColorClass: string
}

export default function ContributionColumn({ title, items, borderColorClass }: ContributionColumnProps) {
  return (
    <div className={`border-l-2 ${borderColorClass} pl-5 flex flex-col gap-3`}>
      <h3 className="font-mono font-semibold text-white text-sm">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-gray-400 text-sm leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
