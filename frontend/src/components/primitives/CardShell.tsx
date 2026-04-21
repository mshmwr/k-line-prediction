import type { ReactNode } from 'react'

interface CardShellProps {
  padding?: 'sm' | 'md' | 'lg'
  borderColorClass?: string
  className?: string
  children: ReactNode
}

// Paper-palette card; bg-paper assumes a light page background (e.g. bg-paper)
export default function CardShell({
  padding = 'md',
  borderColorClass = 'border-ink/20',
  className = '',
  children,
}: CardShellProps) {
  const paddingClass = padding === 'sm' ? 'p-3' : padding === 'md' ? 'p-5' : 'p-6'

  return (
    <div
      className={`rounded-xl border ${borderColorClass} bg-paper ${paddingClass} ${className}`.trim()}
    >
      {children}
    </div>
  )
}
