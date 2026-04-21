/**
 * A-5 — RedactionBar (AC-022-REDACTION-BAR)
 * Black redaction bar mimicking "classified document" visual from design frame 35VCj.
 * Pencil: m1Redact height=10, fill=#2A2520 (bg-charcoal)
 * Text still exists in DOM (screen-reader accessible); bar is visual-only overlay.
 */
interface RedactionBarProps {
  width?: string  // Tailwind width class, e.g. 'w-[100px]', 'w-[140px]'
  className?: string
}

export default function RedactionBar({ width = 'w-[100px]', className = '' }: RedactionBarProps) {
  return (
    <div
      data-redaction
      aria-hidden="true"
      className={`h-[10px] bg-charcoal rounded-sm ${width} ${className}`.trim()}
    />
  )
}
