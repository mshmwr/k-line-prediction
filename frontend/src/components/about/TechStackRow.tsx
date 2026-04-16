interface TechStackRowProps {
  tech: string
  description: string
  isEven: boolean
}

export default function TechStackRow({ tech, description, isEven }: TechStackRowProps) {
  return (
    <div className={`flex gap-6 items-start px-4 py-3 ${isEven ? 'bg-white/5' : ''}`}>
      <span className="font-mono text-sm font-semibold text-purple-300 w-40 shrink-0">{tech}</span>
      <span className="text-gray-400 text-sm leading-relaxed">{description}</span>
    </div>
  )
}
