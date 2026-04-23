import PillarCard from './PillarCard'

/**
 * S4 — ReliabilityPillarsSection (K-034 Phase 2 §7 Step 5 — D-9..D-13)
 * Used on: /about
 *
 * Pencil frame UXy2o — 3 pillars (Persistent Memory / Structured Reflection / Role Agents).
 * Section has NO internal section-subtitle (Pencil s4Intro renders as h2 "How AI Stays
 * Reliable", bold 22 ink; inherits Geist Mono per K-040 typeface retire).
 *
 * Body text is Pencil-VERBATIM from `frontend/design/specs/about-v2.frame-UXy2o.json`
 * `pillar_{1,2,3}.p*BodyText.content` — including the p3 sentence
 * "Handoffs produce artifacts that ./scripts/audit-ticket.sh K-XXX can verify
 * end-to-end." which was verified on 2026-04-23 at JSON line 75 during the
 * K-034 Phase 2 §4.8 C-1b ruling reversal (initial Reviewer finding REVERSED →
 * ACCEPT: sentence IS Pencil SSOT, no Engineer action needed).
 *
 * The only editorial layer added on top of Pencil-verbatim text is inline `<code>`
 * monospace markup on file-path tokens (`MEMORY.md`, `docs/retrospectives/<role>.md`,
 * `./scripts/audit-ticket.sh K-XXX`) per `docs/designs/design-exemptions.md` §2
 * INHERITED-editorial row (PillarCard; C-1a ruling). Copy is unchanged; only
 * inline typographic markup is applied to restore file-path semantics that
 * Pencil's flat-text encoding cannot carry.
 */
export default function ReliabilityPillarsSection() {
  return (
    <div className="space-y-6">
      <h2 className="font-bold text-ink text-[22px] leading-[1.2]">
        How AI Stays Reliable
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
        <PillarCard
          fileNo={1}
          title="Persistent Memory"
          body={
            <p>
              File-based memory system indexed in{' '}
              <code className="font-mono text-[13px] bg-ink/5 px-1 rounded">
                MEMORY.md
              </code>{' '}
              survives every session; past mistakes, preferences, and project state persist
              cross-conversation.
            </p>
          }
          anchorQuote={'Every "stop doing X" becomes a memory entry — corrections outlive the session.'}
          linkText="→ Per-role Retrospective Log protocol"
          docsHref="https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#per-role-retrospective-log"
        />

        <PillarCard
          fileNo={2}
          title="Structured Reflection"
          body={
            <p>
              Each role appends to{' '}
              <code className="font-mono text-[13px] bg-ink/5 px-1 rounded">
                docs/retrospectives/&lt;role&gt;.md
              </code>{' '}
              after every ticket; the PM aggregates cross-role patterns. Bug Found Protocol
              gates fixes behind mandatory reflection + memory write.
            </p>
          }
          anchorQuote="No memory write = the bug is not closed."
          linkText="→ Bug Found Protocol"
          docsHref="https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#bug-found-protocol"
        />

        <PillarCard
          fileNo={3}
          title="Role Agents"
          body={
            <p>
              PM / Architect / Engineer / Reviewer / QA / Designer are separate agents with
              spec&apos;d responsibilities. Handoffs produce artifacts that{' '}
              <code className="font-mono text-[13px] bg-ink/5 px-1 rounded">
                ./scripts/audit-ticket.sh K-XXX
              </code>{' '}
              can verify end-to-end.
            </p>
          }
          anchorQuote="No artifact = no handoff."
          linkText="→ Role Flow"
          docsHref="https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#role-flow"
        />
      </div>
    </div>
  )
}
