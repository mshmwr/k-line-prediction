/**
 * FileNoBar (K-034 Phase 2 §6.2) — dark charcoal top strip used inside CardShell on /about
 * Used on: /about (MetricCard, RoleCard, PillarCard, TicketAnatomyCard, ArchPillarBlock)
 *
 * Pencil frames: BF4Xe.m*Top / 8mqwX.r*Top / UXy2o.p*Top / EBC1e.t*Top / JFizO.arch*Top
 * Pencil contract: fill #2A2520, padding [6, 10], Geist Mono 10 paper, letterSpacing 2, content
 *   `FILE Nº 0N · LABEL` or `LAYER Nº 0N · CATEGORY`; optional right-aligned `trailing` text.
 *
 * cardPaddingSize determines negative-margin adjustment so the bar sits flush against the
 * CardShell inner top edge. Must match the `padding` prop passed to the enclosing CardShell.
 */
interface FileNoBarProps {
  fileNo: number
  /** Optional label; when omitted bar renders just `${prefix} 0N` (e.g. MetricCard BF4Xe m*Lbl). */
  label?: string
  prefix?: 'FILE Nº' | 'LAYER Nº'
  trailing?: string
  cardPaddingSize?: 'md' | 'lg'
}

export default function FileNoBar({
  fileNo,
  label,
  prefix = 'FILE Nº',
  trailing,
  cardPaddingSize = 'md',
}: FileNoBarProps) {
  const negativeMargin = cardPaddingSize === 'lg' ? '-mx-6 -mt-6' : '-mx-5 -mt-5'
  const padded = String(fileNo).padStart(2, '0')
  const content = label ? `${prefix} ${padded} · ${label}` : `${prefix} ${padded}`

  return (
    <div
      data-testid="file-no-bar"
      className={`${negativeMargin} px-[10px] py-[6px] bg-charcoal flex items-center justify-between`}
    >
      <span className="font-mono text-[10px] text-paper tracking-[2px] uppercase">
        {content}
      </span>
      {trailing && (
        <span className="font-mono text-[12px] font-bold text-paper tracking-[2px]">
          {trailing}
        </span>
      )}
    </div>
  )
}
