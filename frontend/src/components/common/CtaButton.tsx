import { Link } from 'react-router-dom'

interface CtaButtonProps {
  label: string
  href: string
  variant: 'primary' | 'secondary'
  external?: boolean
}

const variantMap = {
  primary: 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-600',
  secondary: 'bg-transparent hover:bg-white/5 text-cyan-400 border border-cyan-400',
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
