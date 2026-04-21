import { Link } from 'react-router-dom'

interface CtaButtonProps {
  label: string
  href: string
  variant: 'primary' | 'secondary'
  external?: boolean
}

const variantMap = {
  primary: 'bg-ink hover:bg-charcoal text-paper border border-ink',
  secondary: 'bg-transparent hover:bg-ink/5 text-muted border border-muted',
}

export default function CtaButton({ label, href, variant, external = false }: CtaButtonProps) {
  const cls = `inline-block px-6 py-3 font-mono text-sm font-medium transition-colors ${variantMap[variant]}`

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {label}
      </a>
    )
  }

  return (
    <Link to={href} className={cls}>
      {label}
    </Link>
  )
}
