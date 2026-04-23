import CardShell from '../primitives/CardShell'
import FileNoBar from './FileNoBar'

/**
 * ArchPillarBlock (K-034 Phase 2 §7 Step 7 — D-16/D-17/D-18; K-040 typeface retire)
 * Used on: /about (ProjectArchitectureSection)
 *
 * Pencil frame JFizO.arch_* — dark LAYER Nº 0N · <CATEGORY> bar + body:
 *   - bold 20 ink title (lh 1.15)
 *   - 40px × 1px charcoal rule
 *   - For arch1/arch2: label/value rows (Geist Mono 10 muted uppercase label +
 *     Geist Mono 12 ink body, or Geist Mono 12 ink for file-path bodies)
 *   - For arch3: testingPyramid rows with 22 brick Nº + label + detail
 *
 * Testid preservation (AC-029-ARCH-BODY-TEXT contract):
 *   - `arch-pillar-body` × 3 — body wrapper per pillar (color-inheriting allow-list).
 *   - `arch-pillar-layer` × 3 — only on pyramid LABEL spans in arch3 (Unit/Integration/E2E);
 *     parent <li> color strict muted, span color strict ink.
 */
interface LabelValueField {
  type: 'labelValue'
  label: string
  value: string
  /** value font family: 'body' = Geist Mono 12 ink body, 'mono' = Geist Mono 12 ink file-path */
  valueFont?: 'body' | 'mono'
}

interface PyramidField {
  type: 'pyramid'
  rows: { no: string; layerLabel: 'UNIT' | 'INTEGRATION' | 'E2E'; detail: string }[]
}

type ArchField = LabelValueField | PyramidField

interface ArchPillarBlockProps {
  layerNo: number
  category: 'BACKBONE' | 'DISCIPLINE' | 'ASSURANCE'
  title: string
  fields: ArchField[]
}

export default function ArchPillarBlock({
  layerNo,
  category,
  title,
  fields,
}: ArchPillarBlockProps) {
  return (
    <CardShell padding="md" className="flex flex-col overflow-hidden">
      <FileNoBar
        fileNo={layerNo}
        prefix="LAYER Nº"
        label={category}
        cardPaddingSize="md"
      />
      <div className="flex flex-col flex-1 gap-[14px] pt-[18px]">
        <h3 className="font-bold text-ink text-[20px] leading-[1.15]">
          {title}
        </h3>
        <div className="w-[40px] h-px bg-charcoal" />
        <div data-testid="arch-pillar-body" className="flex flex-col gap-[14px] text-ink">
          {fields.map((field, i) => {
            if (field.type === 'labelValue') {
              const valueClass =
                field.valueFont === 'mono'
                  ? 'font-mono text-ink text-[12px] leading-[1.5]'
                  : 'text-ink text-[12px] leading-[1.6]'
              return (
                <div key={`${field.label}-${i}`}>
                  <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">
                    {field.label}
                  </span>
                  <p className={`${valueClass} mt-1`}>{field.value}</p>
                </div>
              )
            }
            return (
              <ul key={`pyramid-${i}`} className="flex flex-col gap-[12px]">
                {field.rows.map(row => (
                  <li
                    key={row.layerLabel}
                    className="flex items-start gap-[10px] text-muted text-[13px] leading-[1.55]"
                  >
                    <span className="font-bold text-brick text-[22px] leading-none shrink-0">
                      {row.no}
                    </span>
                    <div className="flex flex-col gap-[3px]">
                      <span
                        data-testid="arch-pillar-layer"
                        className="font-mono text-ink text-[10px] uppercase tracking-[2px]"
                      >
                        {row.layerLabel}
                      </span>
                      <span className="text-[12px] leading-[1.55]">
                        {row.detail}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          })}
        </div>
      </div>
    </CardShell>
  )
}
