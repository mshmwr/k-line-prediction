import { Layers } from 'lucide-react'
import SectionHeader from '../common/SectionHeader'
import TechStackRow from './TechStackRow'

const STACK = [
  { tech: 'React + TypeScript', description: 'Frontend SPA with strict typing, Vite bundler, Tailwind CSS for styling.' },
  { tech: 'FastAPI + Python', description: 'Backend API server handling predictions, auth, and static file serving.' },
  { tech: 'Firebase Hosting + Cloud Run', description: 'Frontend deployed to Firebase Hosting (k-line-prediction.web.app); backend to Google Cloud Run for independent scaling.' },
  { tech: 'Docker', description: 'Containerised build ensures consistent environment across local and production.' },
]

export default function TechStackSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-b border-white/10">
      <SectionHeader
        label="TECH STACK"
        labelColor="cyan"
        title="Technology Stack"
        icon={Layers}
      />
      <div className="border border-white/10 overflow-hidden">
        {STACK.map((row, i) => (
          <TechStackRow key={row.tech} tech={row.tech} description={row.description} isEven={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}
