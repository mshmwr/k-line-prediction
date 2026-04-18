import type { LucideIcon } from 'lucide-react'
import SectionLabel from './SectionLabel'

interface SectionHeaderProps {
  label: string
  labelColor?: 'purple' | 'cyan' | 'pink' | 'white'
  title: string
  description?: string
  icon?: LucideIcon
}

export default function SectionHeader({ label, labelColor = 'purple', title, description, icon: Icon }: SectionHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <SectionLabel text={label} color={labelColor} />
      <h2 className="mt-4 text-3xl font-mono font-bold text-white flex items-center justify-center gap-2">
        {Icon && <Icon size={28} aria-hidden="true" />}
        {title}
      </h2>
      {description && <p className="mt-3 text-gray-400 max-w-2xl mx-auto">{description}</p>}
    </div>
  )
}
