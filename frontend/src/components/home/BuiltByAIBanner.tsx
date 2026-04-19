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
      className="block w-full bg-[#1A1A1A] border-b border-white/10 px-6 py-2 text-center hover:bg-[#222222] transition-colors"
      onClick={() => trackCtaClick('banner_about')}
    >
      <span className="font-mono text-sm text-gray-200">
        One operator. Six AI agents. Every ticket leaves a doc trail.{' '}
        <em className="text-purple-400 not-italic underline">See how →</em>
      </span>
    </Link>
  )
}
