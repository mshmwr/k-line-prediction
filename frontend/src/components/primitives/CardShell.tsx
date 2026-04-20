import type { ReactNode } from 'react'

interface CardShellProps {
  padding?: 'sm' | 'md' | 'lg'
  borderColorClass?: string
  className?: string
  children: ReactNode
}

// Dark-theme card; bg-slate-800/60 assumes a dark page background (e.g. bg-[#0D0D0D])
export default function CardShell({
  padding = 'md',
  borderColorClass = 'border-white/10',
  className = '',
  children,
}: CardShellProps) {
  const paddingClass = padding === 'sm' ? 'p-3' : padding === 'md' ? 'p-5' : 'p-6'

  return (
    <div
      className={`rounded-xl border ${borderColorClass} bg-slate-800/60 ${paddingClass} ${className}`.trim()}
    >
      {children}
    </div>
  )
}
