/**
 * S1 — PageHeaderSection
 * One operator declaration (AC-017-HEADER, AC-022-HERO-TWO-LINE)
 *
 * A-3 Hero 兩行結構（Pencil frame 35VCj §2.7）：
 * - 主句：Bodoni Moda 64px italic 700（兩段）
 *   - 第一段 text-ink
 *   - 第二段（"agents end-to-end —"）text-brick（BQ-022-03 PM 裁決）
 * - 角色列：Newsreader 18px italic（gNx84）
 * - tagline：Bodoni Moda 22px italic 700（TQmUG）
 * - 分隔線：1px bg-charcoal（qFnDN）
 */
export default function PageHeaderSection() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display font-bold italic text-[64px] leading-tight text-ink mb-2">
        One operator, orchestrating AI{' '}
        <span className="text-brick">agents end-to-end —</span>
      </h1>
      <p className="font-italic italic text-[18px] text-ink leading-relaxed mb-6">
        PM, architect, engineer, reviewer, QA, designer.
      </p>
      <div className="h-px bg-charcoal max-w-sm mx-auto mb-6" />
      <p className="font-display font-bold italic text-[22px] text-ink">
        Every feature ships with a doc trail.
      </p>
    </div>
  )
}
