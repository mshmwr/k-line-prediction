import PipelineSvg from '../../assets/pipeline.svg?react'
import PmArbitrationDetailSvg from '../../assets/pm-arbitration-detail.svg?react'

export default function RolePipelineSection() {
  return (
    <div>
      <p className="text-[14px] text-ink leading-[1.6] mb-2">
        Automatic handoffs between six AI agents. PM self-arbitrates at five pipeline positions via a four-source priority stack — the only operator pause is the Content-Alignment Gate on user-visible copy tickets.
      </p>
      <ul className="mb-6 space-y-1 list-disc list-inside marker:text-ink/40">
        <li className="text-[11px] font-mono text-ink/50 leading-[1.5]">
          <strong>Content-Alignment Gate (CAG):</strong>{' '}any ticket that changes user-visible text stops here — PM presents the Architect&apos;s draft verbatim; the user approves before Engineer begins.
        </li>
        <li className="text-[11px] font-mono text-ink/50 leading-[1.5]">
          <strong>QA Early Consultation:</strong>{' '}before Architect starts, QA reviews the ticket scope and flags which acceptance criteria can be automated — so testability is built into the design, not retrofitted.
        </li>
      </ul>

      <PipelineSvg
        width="100%"
        data-testid="role-pipeline-svg"
        aria-label="Role pipeline: PM (arbitrates) → Architect → [Content-Alignment Gate] → Engineer → Reviewer → QA → PM; Designer on-demand"
        className="block h-auto"
      />

      <h3 className="text-[13px] font-mono font-bold text-ink mt-8 mb-4 tracking-widest uppercase">
        PM Arbitration Detail
      </h3>
      <PmArbitrationDetailSvg
        width="100%"
        data-testid="pm-arbitration-detail-svg"
        aria-label="PM arbitration detail: CAG flow, Reviewer escalation, QA Interception"
        className="block h-auto"
      />
    </div>
  )
}
