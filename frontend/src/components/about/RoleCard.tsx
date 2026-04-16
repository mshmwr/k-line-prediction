interface RoleCardProps {
  role: 'PM' | 'Senior Architect' | 'Designer' | 'Engineer' | 'QA'
  responsibilities: string[]
  borderColorClass: string
}

export default function RoleCard({ role, responsibilities, borderColorClass }: RoleCardProps) {
  return (
    <div className={`border ${borderColorClass} p-5 flex flex-col gap-2`}>
      <span className="font-mono text-xs tracking-widest text-gray-400 uppercase">Claude as</span>
      <h3 className="font-mono font-bold text-white text-base">{role}</h3>
      <ul className="mt-2 space-y-1">
        {responsibilities.map((r, i) => (
          <li key={i} className="text-gray-400 text-xs leading-relaxed flex gap-2">
            <span className="text-purple-400 shrink-0">—</span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}
