import CardShell from '../primitives/CardShell'
import RedactionBar from './RedactionBar'

interface MetricCardProps {
  title: string
  subtext: string
  redacted?: boolean  // A-5: show redaction bar over subtext
}

export default function MetricCard({ title, subtext, redacted = false }: MetricCardProps) {
  return (
    <CardShell padding="md" className="text-center">
      <h3 className="font-mono font-bold text-ink text-base mb-2">{title}</h3>
      {redacted ? (
        <div className="flex justify-center mt-2">
          <RedactionBar width="w-[100px]" />
          <span className="sr-only">{subtext}</span>
        </div>
      ) : (
        <p className="text-muted text-sm leading-relaxed">{subtext}</p>
      )}
    </CardShell>
  )
}
