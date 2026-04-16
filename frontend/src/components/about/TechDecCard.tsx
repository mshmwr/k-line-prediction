interface TechDecCardProps {
  question: string
  title: string
  decision: string
}

export default function TechDecCard({ question, title, decision }: TechDecCardProps) {
  return (
    <div className="border border-white/10 p-6 flex flex-col gap-2">
      <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">{question}</span>
      <h3 className="font-mono font-semibold text-white text-sm">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{decision}</p>
    </div>
  )
}
