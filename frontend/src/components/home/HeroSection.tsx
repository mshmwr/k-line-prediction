export default function HeroSection() {
  return (
    // K-040 Item 14 — mobile Hero breathing room below BuiltByAIBanner
    // (mt-6 = 24px mobile). Desktop unchanged (homepage-sections flex gap
    // sm:gap-[72px] already provides desktop spacing). Internal heroCol
    // gap remains 24px mobile / 18px desktop (Designer memo: "Recommended
    // mobile starting point: gap: 32 sec / gap: 16 col" deferred to impl —
    // current values chosen to preserve pages.spec.ts AC-023 locked gap=24
    // mobile and avoid heavier calibration).
    <section className="mt-6 sm:mt-0">
      <div className="flex flex-col gap-[24px] sm:gap-[18px]">
        {/* Heading line 1 */}
        <h1 className="text-[56px] font-bold leading-[1.05] text-[#1A1814]">
          Predict the next move
        </h1>
        {/* Heading line 2 — accent colour */}
        <h1 className="text-[56px] font-bold leading-[1.05] text-[#9C4A3B]">
          before it happens —
        </h1>
        {/* Divider */}
        <div className="h-px w-full bg-[#2A2520]" />
        {/* Subtitle */}
        <p className="text-[16px] leading-[1.5] text-[#1A1814]">
          Pattern-matching engine for K-line candlestick charts. Upload historical data, find similar formations, and see what happened next.
        </p>
        {/* CTA — opens /app in new tab (K-030 C-1) */}
        <div className="flex gap-[14px]">
          <a
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#2A2520] text-[#F4EFE5] rounded-[6px] px-[26px] py-[12px] text-[13px] font-bold tracking-[1px]"
            style={{ fontFamily: '"Geist Mono", monospace' }}
          >
            Try the App →
          </a>
        </div>
      </div>
    </section>
  )
}
