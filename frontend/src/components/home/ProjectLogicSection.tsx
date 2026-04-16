import SectionHeader from '../common/SectionHeader'
import StepCard from './StepCard'
import TechTag from './TechTag'

const STEPS = [
  {
    step: 1 as const,
    title: 'Upload Your K-Line Data',
    description: 'Import CSV files of historical OHLC data. The system merges and aligns your bars automatically.',
  },
  {
    step: 2 as const,
    title: 'Pattern Matching with MA99 Filter',
    description: 'Finds historical windows whose shape most closely resembles the tail of your query — filtered by MA99 trend direction.',
  },
  {
    step: 3 as const,
    title: 'Visualise Analog Forecasts',
    description: 'Each match projects forward, giving you a consensus view of where the market has historically moved next.',
  },
]

const TECH_TAGS = ['React', 'TypeScript', 'FastAPI', 'Python', 'Railway', 'Docker']

export default function ProjectLogicSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <SectionHeader
        label="HOW IT WORKS"
        labelColor="cyan"
        title="System Architecture"
        description="A technical overview of how the pattern-matching pipeline works — without revealing the trading logic."
      />
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {STEPS.map(s => (
          <StepCard key={s.step} step={s.step} title={s.title} description={s.description} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {TECH_TAGS.map(tag => (
          <TechTag key={tag} label={tag} />
        ))}
      </div>
    </section>
  )
}
