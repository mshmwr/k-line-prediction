import LinkedinSvg from '../../../design/brand-assets/linkedin.svg?react'

type Props = { className?: string }

export function LinkedinIcon({ className }: Props) {
  return <LinkedinSvg className={className} aria-hidden="true" focusable="false" />
}
