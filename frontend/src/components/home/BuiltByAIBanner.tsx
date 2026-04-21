import { Link } from 'react-router-dom'
import { trackCtaClick } from '../../utils/analytics'

/**
 * BuiltByAIBanner — thin banner displayed above the Hero on HomePage.
 * Clicking anywhere on the banner navigates to /about via SPA routing.
 * AC-017-BANNER, AC-018-CLICK (banner_about)
 */
export default function BuiltByAIBanner() {
  return (
    <Link
      to="/about"
      aria-label="About the AI collaboration behind this project"
      data-testid="built-by-ai-banner"
      className="block w-full bg-[#F4EFE5] border-b border-[#1A1814] px-6 py-2 text-center hover:bg-[#EDE8DC] transition-colors"
      onClick={() => trackCtaClick('banner_about')}
    >
      <span className="font-mono text-sm text-[#1A1814]">
        One operator. Six AI agents. Every ticket leaves a doc trail.{' '}
        <span className="text-[#9C4A3B] underline">See how →</span>
      </span>
    </Link>
  )
}
