interface SectionLabelProps {
  text: string
  color?: 'purple' | 'cyan' | 'pink' | 'white'
}

const colorMap = {
  purple: 'text-purple-400 border-purple-400',
  cyan: 'text-cyan-400 border-cyan-400',
  pink: 'text-pink-400 border-pink-400',
  white: 'text-white border-white',
}

export default function SectionLabel({ text, color = 'purple' }: SectionLabelProps) {
  return (
    <span
      className={`inline-block text-xs font-mono tracking-widest uppercase border px-2 py-0.5 ${colorMap[color]}`}
    >
      {text}
    </span>
  )
}
