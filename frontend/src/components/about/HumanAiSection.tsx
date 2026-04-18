import { Users } from 'lucide-react'
import SectionHeader from '../common/SectionHeader'
import ContributionColumn from './ContributionColumn'

export default function HumanAiSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-b border-white/10">
      <SectionHeader
        label="CONTRIBUTIONS"
        labelColor="pink"
        title="人的貢獻 vs AI 的貢獻"
        icon={Users}
      />
      <div className="grid md:grid-cols-2 gap-10">
        <ContributionColumn
          side="human"
          title="Human Contributions"
          borderColorClass="border-pink-500"
          items={[
            'Trading domain knowledge and strategy intuition',
            'Product decisions — what to build and why',
            'Role assignment — telling Claude which hat to wear',
            'Requirements clarification and edge case identification',
            'Final acceptance judgment at each phase gate',
          ]}
        />
        <ContributionColumn
          side="ai"
          title="AI Contributions"
          borderColorClass="border-purple-500"
          items={[
            'Architecture planning — component trees, API contracts',
            'Full TDD implementation across backend and frontend',
            'Code review and refactoring suggestions',
            'UI design via Pencil.dev MCP tools',
            'E2E test authorship and regression coverage',
          ]}
        />
      </div>
    </section>
  )
}
