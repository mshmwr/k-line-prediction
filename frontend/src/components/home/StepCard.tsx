interface StepCardProps {
  step: 1 | 2 | 3
  title: string
  description: string
}

export default function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="border border-white/10 p-6 flex flex-col gap-3">
      <span className="font-mono text-xs text-purple-400 tracking-widest">STEP {step}</span>
      <h3 className="font-mono font-semibold text-white text-base">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
