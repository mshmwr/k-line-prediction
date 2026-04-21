/**
 * A-2 — DossierHeader (AC-022-DOSSIER-HEADER)
 * Page-level dark header bar mimicking per-card FILE Nº header language from design frame 35VCj.
 * bg-charcoal (#2A2520), text-paper, Geist Mono 10px, letterSpacing 2
 */
interface DossierHeaderProps {
  fileNo?: string
}

export default function DossierHeader({ fileNo = 'K-017 / ABOUT' }: DossierHeaderProps) {
  return (
    <div
      data-testid="dossier-header"
      className="bg-charcoal text-paper font-mono text-[10px] tracking-[2px] px-[72px] py-[6px] flex items-center gap-2"
    >
      <span>FILE Nº</span>
      <span className="opacity-50 mx-1">·</span>
      <span>{fileNo}</span>
    </div>
  )
}
