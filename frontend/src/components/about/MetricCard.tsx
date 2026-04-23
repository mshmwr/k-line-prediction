import CardShell from '../primitives/CardShell'
import FileNoBar from './FileNoBar'
import RedactionBar from './RedactionBar'

/**
 * MetricCard (K-034 Phase 2 §7 Step 3 — D-2/D-3/D-7)
 * Used on: /about (MetricsStripSection)
 *
 * Pencil frame BF4Xe.m{1..4}_* — dark FILE Nº top bar + body with optional redaction bar,
 * optional big Bodoni 76 number, Bodoni italic title (22 for number-cards / 28 for text-cards),
 * optional Newsreader italic subtext, Newsreader italic note.
 *
 * m2 "First-pass Review Rate" renders redaction bar AND visible subtext+note simultaneously
 * (D-3 — redaction is aesthetic motif; text stays readable, no sr-only).
 */
interface MetricCardProps {
  fileNo: number
  title: string
  /** Optional big Bodoni number (m1 = "17", m4 = "3"); m2/m3 omit. */
  bigNumber?: string
  subtext?: string
  note?: string
  /** RedactionBar is a Pencil motif — m1/m3/m4 widths 100/110/90, m2 140. */
  redacted?: { width: string }
}

export default function MetricCard({
  fileNo,
  title,
  bigNumber,
  subtext,
  note,
  redacted,
}: MetricCardProps) {
  const titleSizeClass = bigNumber ? 'text-[18px]' : 'text-[22px]'
  return (
    <CardShell padding="md" className="flex flex-col min-h-[280px] overflow-hidden">
      <FileNoBar fileNo={fileNo} cardPaddingSize="md" />
      <div className="flex flex-col flex-1 gap-[10px] pt-[18px]">
        {redacted && <RedactionBar width={redacted.width} />}
        {bigNumber && (
          <span className="font-bold text-ink text-[64px] leading-none">
            {bigNumber}
          </span>
        )}
        <h3
          className={`font-bold text-ink ${titleSizeClass} leading-[1.15]`}
        >
          {title}
        </h3>
        {subtext && (
          <p className="text-ink text-[12px] leading-[1.5]">{subtext}</p>
        )}
        <div className="flex-1" />
        {note && (
          <p className="text-muted text-[11px] leading-[1.5]">{note}</p>
        )}
      </div>
    </CardShell>
  )
}
