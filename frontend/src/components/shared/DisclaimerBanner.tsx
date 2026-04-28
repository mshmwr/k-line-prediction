/**
 * DisclaimerBanner — top-of-page legal disclaimer (K-057 Phase 1c).
 *
 * Renders above NavBar on every route (including /app) to satisfy
 * "prominently displayed" legal requirement for educational financial-tool
 * disclosure. Non-sticky per BQ-057-02 default B (first-paint legal minimum,
 * no UX persistence noise).
 */
export default function DisclaimerBanner() {
  return (
    <div
      data-testid="disclaimer-banner"
      role="note"
      className="bg-[#2A2520] text-[#F4EFE5] text-xs px-4 py-2 text-center"
    >
      Lookup tool for K-line shape similarity — for learning and exploration.
      Outputs are not predictions and not financial advice.
    </div>
  )
}
