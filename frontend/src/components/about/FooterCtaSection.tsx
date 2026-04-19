import { trackCtaClick } from '../../utils/analytics'

/**
 * S8 — FooterCtaSection (AC-017-FOOTER, AC-018-CLICK, AC-018-PRIVACY-POLICY)
 * Global footer CTA: email + GitHub + LinkedIn.
 * Used across all pages: AboutPage, HomePage, DiaryPage.
 *
 * email uses <a href="mailto:"> directly (not ExternalLink — mailto is not http).
 * GitHub and LinkedIn use native <a> with target=_blank to allow onClick GA tracking
 * without modifying the ExternalLink primitive (Option A per K-018 design).
 */
export default function FooterCtaSection() {
  return (
    <div className="text-center py-8 border-t border-white/10">
      <p className="font-mono text-white text-lg font-bold mb-3">Let's talk →</p>
      <a
        href="mailto:yichen.lee.20@gmail.com"
        className="text-purple-400 hover:text-purple-300 text-sm font-mono underline"
        data-testid="cta-email"
        onClick={() => trackCtaClick('contact_email')}
      >
        yichen.lee.20@gmail.com
      </a>

      <p className="text-gray-500 text-sm mt-4 mb-2">Or see the source:</p>
      <div className="flex justify-center gap-4">
        <a
          href="https://github.com/mshmwr/k-line-prediction"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          className="text-gray-300 hover:text-white text-sm font-mono underline"
          data-testid="cta-github"
          onClick={() => trackCtaClick('github_link')}
        >
          GitHub
        </a>
        <span className="text-gray-600">·</span>
        <a
          href="https://linkedin.com/in/yichenlee-career"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
          className="text-gray-300 hover:text-white text-sm font-mono underline"
          data-testid="cta-linkedin"
          onClick={() => trackCtaClick('linkedin_link')}
        >
          LinkedIn
        </a>
      </div>

      <p className="text-gray-500 text-xs font-mono text-center mt-4">
        This site uses Google Analytics to collect anonymous usage data.
      </p>
    </div>
  )
}
