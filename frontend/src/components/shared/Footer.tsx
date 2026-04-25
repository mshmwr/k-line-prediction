import { useEffect, useRef, useState } from 'react'
import { trackCtaClick } from '../../utils/analytics'
import { GithubIcon } from '../icons/GithubIcon'
import { LinkedinIcon } from '../icons/LinkedinIcon'
import { MailIcon } from '../icons/MailIcon'

/**
 * Footer — sitewide footer (K-050 — brand-asset SVG anchors + click-to-copy email).
 *
 * Prop-less single implementation. Pencil SSOT frames are flat-text placeholders;
 * runtime divergence is exemption-backed (design-exemptions.md §2 BRAND-ASSET).
 *
 * Used on: /, /about, /business-logic, /diary. NOT on /app (K-030 isolation).
 *
 * Sacred restorations / preservations:
 *   - K-017 AC-017-FOOTER  partial restore (anchor href + testid; no "Let's talk →" copy)
 *   - K-018 AC-018-CLICK   full restore + 1 cross-route sanity (Phase 3-i)
 *   - K-034 P1 T1          byte-identical cross-route DOM (zero-prop, no per-route branch)
 *   - K-045 T18/T19        full-bleed + width parity (no ancestor changes)
 */
const EMAIL = 'yichen.lee.20@gmail.com'
const GITHUB_URL = 'https://github.com/mshmwr/k-line-prediction'
const LINKEDIN_URL = 'https://linkedin.com/in/yichenlee-career'
const COPY_RESET_MS = 1500

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const handleCopy = async () => {
    trackCtaClick('contact_email')
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
    } catch {
      const node = buttonRef.current
      if (node && typeof window !== 'undefined') {
        const range = document.createRange()
        range.selectNodeContents(node)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      setCopied(true)
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      setCopied(false)
      timerRef.current = null
    }, COPY_RESET_MS)
  }

  const iconClass = 'w-3.5 h-3.5 fill-current'
  const linkClass = 'inline-flex items-center transition-colors hover:text-ink focus-visible:text-ink'

  return (
    <footer className="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">
      <div className="flex justify-between items-center">
        <span className="inline-flex items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <a
              href={`mailto:${EMAIL}`}
              aria-label="Email"
              data-testid="cta-email"
              className={linkClass}
              onClick={() => trackCtaClick('contact_email')}
            >
              <MailIcon className={iconClass} />
            </a>
            <button
              ref={buttonRef}
              type="button"
              data-testid="cta-email-copy"
              onClick={handleCopy}
              className="transition-colors hover:text-ink focus-visible:text-ink cursor-pointer"
            >
              {copied ? 'Copied!' : EMAIL}
            </button>
          </span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            data-testid="cta-github"
            className={linkClass}
            onClick={() => trackCtaClick('github_link')}
          >
            <GithubIcon className={iconClass} />
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            data-testid="cta-linkedin"
            className={linkClass}
            onClick={() => trackCtaClick('linkedin_link')}
          >
            <LinkedinIcon className={iconClass} />
          </a>
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Email address copied to clipboard' : ''}
      </span>
      <p className="text-center mt-3">
        This site uses Google Analytics to collect anonymous usage data.
      </p>
    </footer>
  )
}
