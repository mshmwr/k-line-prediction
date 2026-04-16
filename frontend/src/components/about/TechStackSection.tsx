import SectionHeader from '../common/SectionHeader'
import TechStackRow from './TechStackRow'

const STACK = [
  { tech: 'React + TypeScript', description: 'Frontend SPA with strict typing, Vite bundler, Tailwind CSS for styling.' },
  { tech: 'FastAPI + Python', description: 'Backend API server handling predictions, auth, and static file serving.' },
  { tech: 'Railway', description: 'Single-service deployment — FastAPI serves both API routes and the built frontend.' },
  { tech: 'Docker', description: 'Containerised build ensures consistent environment across local and production.' },
]

export default function TechStackSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-b border-white/10">
      <SectionHeader
        label="TECH STACK"
        labelColor="cyan"
        title="Technology Stack"
      />
      <div className="border border-white/10 overflow-hidden">
        {STACK.map((row, i) => (
          <TechStackRow key={row.tech} tech={row.tech} description={row.description} isEven={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}
