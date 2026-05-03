export default function RolePipelineSection() {
  return (
    <div>
      <p
        className="text-[14px] text-ink leading-[1.6] mb-6"
      >
        Automatic handoffs between six AI agents. PM self-arbitrates at five pipeline positions via a four-source priority stack — the only operator pause is the Content-Alignment Gate on user-visible copy tickets.
      </p>

      <img
        src="/pipeline.svg"
        data-testid="role-pipeline-svg"
        alt="Role pipeline: PM (arbitrates) → Architect → [Content-Alignment Gate] → Engineer → Reviewer → QA → PM; Designer on-demand"
        width="100%"
        height="auto"
      />
    </div>
  )
}
