/**
 * S1 — PageHeaderSection (K-034 Phase 2 §7 Step 8 — D-19/D-20/D-21)
 * Used on: /about
 *
 * Pencil frame wwa0m — titleColumn gap 18, left-aligned, full-width 1px charcoal divider
 * sitting between hero sentence (2 spans) and roleLine (Newsreader italic 18). Tagline
 * is Bodoni Moda italic 700 22 at bottom. Entire block left-aligned (no text-center).
 *
 * Hero h1 has two <span className="block"> children so each line wraps independently and
 * preserves line-height 1.05 per Pencil (ttl1/ttl2).
 */
export default function PageHeaderSection() {
  return (
    <div className="py-20 flex flex-col gap-[18px]">
      <h1 className="font-bold text-[52px] leading-[1.05] text-ink">
        <span className="block">One operator, orchestrating AI</span>
        <span className="block text-brick">agents end-to-end —</span>
      </h1>
      <div className="h-px bg-charcoal w-full" />
      <p className="text-[16px] text-ink leading-[1.5]">
        PM, architect, engineer, reviewer, QA, designer.
      </p>
      <p className="font-bold text-[18px] text-ink leading-[1.4]">
        Every feature ships with a doc trail.
      </p>
    </div>
  )
}
