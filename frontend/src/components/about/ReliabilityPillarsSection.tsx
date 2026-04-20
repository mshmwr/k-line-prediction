import PillarCard from './PillarCard'

/**
 * S4 — ReliabilityPillarsSection (AC-017-PILLARS)
 * 3 pillars: Persistent Memory / Structured Reflection / Role Agents
 */
export default function ReliabilityPillarsSection() {
  return (
    <div className="space-y-6">
      <h2 className="font-mono font-bold text-ink text-2xl mb-6">How AI Stays Reliable</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PillarCard
          title="Persistent Memory"
          body={
            <p>
              File-based memory system indexed in <code className="text-pink-300 bg-white/5 px-1 rounded text-xs">MEMORY.md</code> survives every session; past mistakes, preferences, and project state persist cross-conversation.
            </p>
          }
          anchorQuote='Every "stop doing X" becomes a memory entry — corrections outlive the session.'
          docsHref="/docs/ai-collab-protocols.md#per-role-retrospective-log"
        />

        <PillarCard
          title="Structured Reflection"
          body={
            <p>
              Each role appends to <code className="text-pink-300 bg-white/5 px-1 rounded text-xs">docs/retrospectives/&lt;role&gt;.md</code> after every ticket; the PM aggregates cross-role patterns. Bug Found Protocol gates fixes behind mandatory reflection + memory write.
            </p>
          }
          anchorQuote="No memory write = the bug is not closed."
          docsHref="/docs/ai-collab-protocols.md#bug-found-protocol"
        />

        <PillarCard
          title="Role Agents"
          body={
            <p>
              PM / Architect / Engineer / Reviewer / QA / Designer are separate agents with spec'd responsibilities. Handoffs produce artifacts that <code className="text-pink-300 bg-white/5 px-1 rounded text-xs">./scripts/audit-ticket.sh K-XXX</code> can verify end-to-end.
            </p>
          }
          anchorQuote="No artifact = no handoff."
          docsHref="/docs/ai-collab-protocols.md#role-flow"
        />
      </div>
    </div>
  )
}
