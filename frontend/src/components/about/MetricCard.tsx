import CardShell from '../primitives/CardShell'

interface MetricCardProps {
  title: string
  subtext: string
}

export default function MetricCard({ title, subtext }: MetricCardProps) {
  return (
    <CardShell padding="md" className="text-center">
      <h3 className="font-mono font-bold text-white text-base mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{subtext}</p>
    </CardShell>
  )
}
