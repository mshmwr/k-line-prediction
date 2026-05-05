import PipelineSvg from '../../assets/pipeline.svg?react'
import PmArbitrationDetailSvg from '../../assets/pm-arbitration-detail.svg?react'

export default function RolePipelineSection() {
  return (
    <div>
      <p className="text-[14px] text-ink leading-[1.6] mb-6">
        Automatic handoffs between six AI agents. PM self-arbitrates at five pipeline positions via a four-source priority stack — the only operator pause is the Content-Alignment Gate on user-visible copy tickets.
      </p>

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
