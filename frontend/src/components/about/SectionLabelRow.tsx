/**
 * SectionLabelRow — K-045 (2026-04-24)
 * Used on: /about
 *
 * Extracted from AboutPage.tsx inline `<SectionLabelRow>` during K-045
 * SectionContainer retirement (BQ-045-02 Option α). 14-LOC thin component
 * rendering the Geist Mono 13px bold label + 1px charcoal-toned hairline
 * combo used by all 5 body sections (Nº 01 – Nº 05).
 *
 * Design: K-022 AC-022-SECTION-LABEL (label whitespace-nowrap + hairline
 * right-aligned via flex-1). Hairline color #8B7A6B matches existing
 * runtime token. `data-testid="section-label"` and `data-section-hairline`
 * attributes preserved verbatim so `about-v2.spec.ts:36-60` continues to
 * pass unchanged.
 */

export default function SectionLabelRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span
        className="font-mono text-[13px] font-bold tracking-[2px] text-ink whitespace-nowrap"
        data-testid="section-label"
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-[#8B7A6B]" data-section-hairline />
    </div>
  )
}
