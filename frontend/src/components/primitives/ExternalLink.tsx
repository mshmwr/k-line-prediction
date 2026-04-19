import type { ReactNode } from 'react'

interface ExternalLinkProps {
  href: string
  label?: string
  children?: ReactNode
  className?: string
  ariaLabel?: string
}

export default function ExternalLink({
  href,
  label,
  children,
  className = '',
  ariaLabel,
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={className}
    >
      {children ?? label}
    </a>
  )
}
