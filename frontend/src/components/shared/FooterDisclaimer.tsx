/**
 * FooterDisclaimer — full-text legal disclaimer block (K-057 Phase 1d).
 *
 * Rendered above the existing <Footer> on landing-pages (HomePage, AboutPage,
 * DiaryPage). Sacred K-034-P1 Footer byte-identity preserved by sibling
 * placement (this is a separate <section>, not an edit to Footer DOM).
 *
 * /app intentionally omits this block — the page is isolated per K-030; the
 * top DisclaimerBanner provides minimum legal coverage on that route.
 */
export default function FooterDisclaimer() {
  return (
    <section
      id="disclaimer"
      data-testid="footer-disclaimer"
      aria-labelledby="footer-disclaimer-heading"
      className="border-t border-ink px-6 md:px-[72px] py-6 text-[13px] leading-[1.6] text-[#3A3530]"
    >
      <h2
        id="footer-disclaimer-heading"
        className="text-[14px] font-bold uppercase tracking-[1.5px] text-ink mb-2"
      >
        Disclaimer
      </h2>
      <p>
        K-Line Prediction is an educational tool that surfaces historically
        similar candlestick formations from past ETH/USDT data. It does not
        constitute financial advice, investment recommendation, or a forecast
        of future market behavior. Past patterns and historical similarity
        scores do not predict future returns — markets are non-stationary and
        prior outcomes carry no guarantee of recurrence. Use this tool at your
        own discretion and conduct independent due diligence before making any
        trading or investment decision.
      </p>
    </section>
  )
}
