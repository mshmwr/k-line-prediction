import PillarCard from './PillarCard'

/**
 * S4 — ReliabilityPillarsSection (AC-017-PILLARS, AC-022-LAYER-LABEL)
 * 3 pillars: Persistent Memory / Structured Reflection / Role Agents
 * A-9: each pillar has LAYER 1/2/3 prefix label (BQ-022-02 PM 裁決)
 * A-4: italic subtitle
 */
export default function ReliabilityPillarsSection() {
  return (
    <div className="space-y-6">
      <h2 className="font-mono font-bold text-ink text-2xl mb-2">How AI Stays Reliable</h2>
      <p
        className="font-italic italic text-[15px] text-ink leading-relaxed mb-6"
        data-section-subtitle
      >
        Three structural layers that prevent AI agents from drifting over time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PillarCard
          layerLabel="LAYER 1"
          title="Persistent Memory"
          body={
            <p>
              File-based memory system indexed in <code className="text-muted bg-ink/5 px-1 rounded text-xs">MEMORY.md</code> survives every session; past mistakes, preferences, and project state persist cross-conversation.
            </p>
          }
          anchorQuote='Every "stop doing X" becomes a memory entry — corrections outlive the session.'
          docsHref="/docs/ai-collab-protocols.md#per-role-retrospective-log"
        />

        <PillarCard
          layerLabel="LAYER 2"
          title="Structured Reflection"
          body={
            <p>
              Each role appends to <code className="text-muted bg-ink/5 px-1 rounded text-xs">docs/retrospectives/&lt;role&gt;.md</code> after every ticket; the PM aggregates cross-role patterns. Bug Found Protocol gates fixes behind mandatory reflection + memory write.
            </p>
          }
          anchorQuote="No memory write = the bug is not closed."
          docsHref="/docs/ai-collab-protocols.md#bug-found-protocol"
        />

        <PillarCard
          layerLabel="LAYER 3"
          title="Role Agents"
          body={
            <p>
              PM / Architect / Engineer / Reviewer / QA / Designer are separate agents with spec'd responsibilities. Handoffs produce artifacts that <code className="text-muted bg-ink/5 px-1 rounded text-xs">./scripts/audit-ticket.sh K-XXX</code> can verify end-to-end.
            </p>
          }
          anchorQuote="No artifact = no handoff."
          docsHref="/docs/ai-collab-protocols.md#role-flow"
        />
      </div>
    </div>
  )
}
