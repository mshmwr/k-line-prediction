interface TechTagProps {
  label: string
}

export default function TechTag({ label }: TechTagProps) {
  return (
    <span className="inline-block font-mono text-xs text-cyan-400 border border-cyan-400/40 px-2 py-0.5">
      {label}
    </span>
  )
}
