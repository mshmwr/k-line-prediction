import { GitBranch } from 'lucide-react'
import SectionHeader from '../common/SectionHeader'
import TechDecCard from './TechDecCard'

const DECISIONS = [
  {
    question: 'Q1',
    title: 'Routing strategy',
    decision: 'BrowserRouter SPA on Firebase Hosting; API requests forwarded to Cloud Run backend via VITE_API_BASE_URL.',
  },
  {
    question: 'Q2',
    title: 'Screenshot approach',
    decision: 'Placeholders retained; real screenshots to be added in a future update.',
  },
  {
    question: 'Q3',
    title: 'Deployment architecture',
    decision: 'Frontend on Firebase Hosting (k-line-prediction.web.app); backend on Google Cloud Run. Separated for independent scaling.',
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
        icon={GitBranch}
      />
      <div className="grid md:grid-cols-3 gap-6">
        {DECISIONS.map(d => (
          <TechDecCard key={d.question} {...d} />
        ))}
      </div>
    </section>
  )
}
