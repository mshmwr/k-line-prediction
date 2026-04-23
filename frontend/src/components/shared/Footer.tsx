// K-034 §PM ruling on BQ-034-P1-01 — prop-less unified implementation per §1.4 Pencil SSOT verdict (frames 86psQ + 1BGtd byte-identical)

/**
 * Footer — sitewide footer (K-034 Phase 1 — Pencil-literal inline one-liner).
 *
 * Prop-less single implementation. Mirrors Pencil frames 86psQ + 1BGtd
 * (homepage-v2.pen) byte-identically — both frames export the same single
 * text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` in
 * Geist Mono 11px, tracking 1px, fill #6B5F4E (text-muted).
 *
 * Used on:
 *   - `/`               (HomePage.tsx)
 *   - `/business-logic` (BusinessLogicPage.tsx)
 *   - `/about`          (AboutPage.tsx)
 *   - `/diary`          (DiaryPage.tsx) — K-034 Phase 3 (2026-04-23); retires K-017/K-024/K-034-P1-T4 /diary no-footer Sacred clauses
 *
 * NOT rendered on:
 *   - `/app`   (K-030 isolation; intentional — Pencil-exempt per design-exemptions.md §1)
 *
 * Pencil source of truth:
 *   - frontend/design/specs/homepage-v2.frame-86psQ.json  (/about consumer)
 *   - frontend/design/specs/homepage-v2.frame-1BGtd.json  (/ + /business-logic)
 *   - frontend/design/screenshots/homepage-v2-footer-86psQ-vs-1BGtd-side-by-side.png
 *
 * Sacred retirements (K-034 Phase 1):
 *   - K-017 AC-017-FOOTER email/GitHub/LinkedIn anchor href+target+rel on /about → retired
 *   - K-018 AC-018-CLICK contact_email / github_link / linkedin_link GA events on /about → retired
 *   - K-022 A-7 italic + underline anchor styling on /about → retired
 *
 * Regression contract: frontend/e2e/shared-components.spec.ts asserts byte-identical
 * outerHTML across /, /about, /business-logic. Any divergence = FAIL.
 */
export default function Footer() {
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
