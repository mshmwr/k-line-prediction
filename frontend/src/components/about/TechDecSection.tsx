import SectionHeader from '../common/SectionHeader'
import TechDecCard from './TechDecCard'

const DECISIONS = [
  {
    question: 'Q1',
    title: 'Routing strategy',
    decision: 'BrowserRouter with SPA catch-all in FastAPI. Single Railway service, no separate static host.',
  },
  {
    question: 'Q2',
    title: 'Screenshot approach',
    decision: 'Placeholder images for Phase 3. Real Playwright screenshots will be captured post-Phase 5.',
  },
  {
    question: 'Q3',
    title: 'Railway deployment mode',
    decision: 'FastAPI serves the Vite build as static files. One service, one deploy, lowest maintenance cost.',
  },
]

export default function TechDecSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-b border-white/10">
      <SectionHeader
        label="TECH DECISIONS"
        labelColor="cyan"
        title="技術選型決策"
        description="Key architectural choices made during development and the reasoning behind them."
      />
      <div className="grid md:grid-cols-3 gap-6">
        {DECISIONS.map(d => (
          <TechDecCard key={d.question} {...d} />
        ))}
      </div>
    </section>
  )
}
