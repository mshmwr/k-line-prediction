import type { ReactNode } from 'react'

interface SectionContainerProps {
  id?: string
  width?: 'narrow' | 'wide'
  divider?: boolean
  paddingY?: 'md' | 'lg'
  className?: string
  children: ReactNode
}

// divider uses border-muted/40, designed for paper-palette pages (e.g. bg-paper)
export default function SectionContainer({
  id,
  width = 'wide',
  divider = false,
  paddingY = 'lg',
  className = '',
  children,
}: SectionContainerProps) {
  const maxWidth = width === 'narrow' ? 'max-w-3xl' : 'max-w-5xl'
  const py = paddingY === 'md' ? 'py-12' : 'py-16'
  const border = divider ? 'border-b border-muted/40' : ''

  return (
    <section
      id={id}
      className={`${py} px-6 ${maxWidth} mx-auto ${border} ${className}`.trim()}
    >
      {children}
    </section>
  )
}
