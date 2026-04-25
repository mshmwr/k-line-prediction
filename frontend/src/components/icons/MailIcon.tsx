import MailSvg from '../../../design/brand-assets/mail.svg?react'

type Props = { className?: string }

export function MailIcon({ className }: Props) {
  return <MailSvg className={className} aria-hidden="true" focusable="false" />
}
