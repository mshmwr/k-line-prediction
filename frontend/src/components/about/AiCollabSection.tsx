import { Bot } from 'lucide-react'
import SectionHeader from '../common/SectionHeader'
import PhaseGateBanner from './PhaseGateBanner'
import RoleCard from './RoleCard'

const ROLES = [
  {
    role: 'PM' as const,
    responsibilities: ['Define acceptance criteria', 'Prioritise features', 'Approve phase gates'],
    borderColorClass: 'border-cyan-400/40',
  },
  {
    role: 'Senior Architect' as const,
    responsibilities: ['Design system architecture', 'Define API contracts', 'Plan component trees'],
    borderColorClass: 'border-purple-400/40',
  },
  {
    role: 'Designer' as const,
    responsibilities: ['Create Pencil.dev mockups', 'Define colour tokens', 'Confirm UI sections'],
    borderColorClass: 'border-pink-400/40',
  },
  {
    role: 'Engineer' as const,
    responsibilities: ['Implement TDD', 'Write production code', 'Execute architecture plan'],
    borderColorClass: 'border-green-400/40',
  },
  {
    role: 'QA' as const,
    responsibilities: ['Write Playwright E2E', 'Validate ACs', 'Catch regressions'],
    borderColorClass: 'border-yellow-400/40',
  },
]

export default function AiCollabSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-b border-white/10">
      <SectionHeader
        label="AI COLLABORATION"
        labelColor="purple"
        title="人機協作開發流程"
        description="Each phase is gate-reviewed before the next begins. Claude fills multiple specialist roles; the human provides domain knowledge and final judgment."
        icon={Bot}
      />
      <PhaseGateBanner />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map(r => (
          <RoleCard key={r.role} {...r} />
        ))}
      </div>
    </section>
  )
}
