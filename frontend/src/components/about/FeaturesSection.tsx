import SectionHeader from '../common/SectionHeader'
import FeatureBlock from './FeatureBlock'

const FEATURES = [
  {
    title: 'Upload CSV',
    items: ['Multi-file upload with drag-and-drop', 'Auto-merge and bar alignment', '1H and 1D timeframe support'],
  },
  {
    title: 'Pattern Matching',
    items: ['Shape similarity via Pearson correlation', 'MA99 trend direction filter', 'Configurable query window length'],
  },
  {
    title: 'Future OHLC Projection',
    items: ['Projects N bars forward per match', 'Consensus forecast aggregation', '1H and 1D view toggle'],
  },
  {
    title: 'Match Visualisation',
    items: ['Lightweight-charts integration', 'Split-line at query/future boundary', 'Expandable match cards with stats'],
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <SectionHeader
        label="FEATURES"
        labelColor="purple"
        title="What It Can Do"
      />
      <div className="grid sm:grid-cols-2 gap-10">
        {FEATURES.map(f => (
          <FeatureBlock key={f.title} title={f.title} items={f.items} />
        ))}
      </div>
    </section>
  )
}
