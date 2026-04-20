import type { ReactNode } from 'react'

interface SectionContainerProps {
  id?: string
  width?: 'narrow' | 'wide'
  divider?: boolean
  paddingY?: 'md' | 'lg'
  className?: string
  children: ReactNode
}

// divider uses border-white/10, designed for dark-background pages (e.g. bg-[#0D0D0D])
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
  const border = divider ? 'border-b border-white/10' : ''

  return (
    <section
      id={id}
      className={`${py} px-6 ${maxWidth} mx-auto ${border} ${className}`.trim()}
    >
      {children}
    </section>
  )
}
