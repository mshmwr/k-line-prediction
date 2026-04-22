import { trackCtaClick } from '../../utils/analytics'

/**
 * Footer — sitewide footer (K-035 unification; K-021 /about separate-footer
 * Sacred clause formally retired — see docs/designs/K-035-shared-component-migration.md §10.1).
 *
 * Used on:
 *   - `/`               via variant="home"  (HomePage.tsx)
 *   - `/business-logic` via variant="home"  (BusinessLogicPage.tsx)
 *   - `/about`          via variant="about" (AboutPage.tsx)
 *
 * NOT rendered on:
 *   - `/diary` (K-024 no-footer decision; intentional)
 *   - `/app`   (K-030 isolation; intentional)
 *
 * Pencil source of truth:
 *   - variant="home"  → frame 4CsvQ (homepage-v2.pen)
 *   - variant="about" → frame 35VCj footer subtree (homepage-v2.pen)
 *
 * Regression contract: frontend/e2e/shared-components.spec.ts asserts outerHTML
 *   equivalence across all consuming routes modulo the variant axis.
 */
export interface FooterProps {
  variant: 'home' | 'about'
}

export default function Footer({ variant }: FooterProps) {
  if (variant === 'home') {
    return (
      <footer className="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">
        <div className="flex justify-between items-center">
          <span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>
        </div>
        <p className="text-center mt-3">
          This site uses Google Analytics to collect anonymous usage data.
        </p>
      </footer>
    )
  }

  // variant === 'about'
  return (
    <div className="text-center py-8 border-t border-ink/10">
      <p className="font-mono text-ink text-lg font-bold mb-3">Let's talk →</p>
      {/* A-7: email link — Newsreader italic + underline */}
      <a
        href="mailto:yichen.lee.20@gmail.com"
        className="font-italic italic text-brick-dark hover:text-brick text-sm underline"
        data-testid="cta-email"
        onClick={() => trackCtaClick('contact_email')}
      >
        yichen.lee.20@gmail.com
      </a>

      <p className="text-muted text-sm mt-4 mb-2">Or see the source:</p>
      <div className="flex justify-center gap-4">
        {/* A-7: GitHub link — Newsreader italic + underline */}
        <a
          href="https://github.com/mshmwr/k-line-prediction"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          className="font-italic italic text-ink hover:text-brick-dark text-sm underline"
          data-testid="cta-github"
          onClick={() => trackCtaClick('github_link')}
        >
          GitHub
        </a>
        <span className="text-muted">·</span>
        {/* A-7: LinkedIn link — Newsreader italic + underline */}
        <a
          href="https://linkedin.com/in/yichenlee-career"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
          className="font-italic italic text-ink hover:text-brick-dark text-sm underline"
          data-testid="cta-linkedin"
          onClick={() => trackCtaClick('linkedin_link')}
        >
          LinkedIn
        </a>
      </div>

      <p className="text-muted text-xs font-mono text-center mt-4">
        This site uses Google Analytics to collect anonymous usage data.
      </p>
    </div>
  )
}
