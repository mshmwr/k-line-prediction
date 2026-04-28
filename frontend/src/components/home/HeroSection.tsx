import PageHero from '../shared/PageHero'

export default function HeroSection() {
  return (
    <section className="mt-6 sm:mt-0">
      <div className="flex flex-col gap-[24px] sm:gap-[18px]">
        <PageHero
          desktopSize={56}
          lines={[
            { text: 'K-line similarity', color: 'ink' },
            { text: 'lookup engine.', color: 'brick-dark' },
          ]}
        />
        <div className="h-px w-full bg-[#2A2520]" />
        <p className="text-[16px] leading-[1.5] text-[#1A1814]">
          Search past ETH/USDT formations that resemble any candlestick window. Inspect what came after — for learning, not for trading signals.
        </p>
        <img
          src="/hero-shot.png"
          alt="Screenshot of the K-Line Prediction app showing a similarity match result for an ETH/USDT 1H window"
          width={1280}
          height={720}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full max-w-[960px] rounded-[8px] border border-[#2A2520] shadow-[0_2px_0_#2A2520]"
          data-testid="hero-product-shot"
        />
        <div className="flex gap-[14px]">
          <a
            href="/app?sample=ethusdt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#2A2520] text-[#F4EFE5] rounded-[6px] px-[26px] py-[12px] text-[13px] font-bold tracking-[1px]"
            style={{ fontFamily: '"Geist Mono", monospace' }}
            data-testid="hero-cta-run-demo"
          >
            Run the ETH/USDT Demo →
          </a>
        </div>
      </div>
    </section>
  )
}
