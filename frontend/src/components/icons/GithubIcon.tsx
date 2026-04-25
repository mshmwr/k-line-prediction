import GithubSvg from '../../../design/brand-assets/github.svg?react'

type Props = { className?: string }

export function GithubIcon({ className }: Props) {
  return <GithubSvg className={className} aria-hidden="true" focusable="false" />
}
