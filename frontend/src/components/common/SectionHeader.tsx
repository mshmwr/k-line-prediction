import SectionLabel from './SectionLabel'

interface SectionHeaderProps {
  label: string
  labelColor?: 'purple' | 'cyan' | 'pink' | 'white'
  title: string
  description?: string
}

export default function SectionHeader({ label, labelColor = 'purple', title, description }: SectionHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <SectionLabel text={label} color={labelColor} />
      <h2 className="mt-4 text-3xl font-mono font-bold text-white">{title}</h2>
      {description && <p className="mt-3 text-gray-400 max-w-2xl mx-auto">{description}</p>}
    </div>
  )
}
