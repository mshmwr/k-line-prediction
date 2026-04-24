import PageHero from '../shared/PageHero'

export default function HeroSection() {
  return (
    <section className="mt-6 sm:mt-0">
      <div className="flex flex-col gap-[24px] sm:gap-[18px]">
        <PageHero
          desktopSize={56}
          lines={[
            { text: 'Predict the next move', color: 'ink' },
            { text: 'before it happens —', color: 'brick-dark' },
          ]}
        />
        <div className="h-px w-full bg-[#2A2520]" />
        <p className="text-[16px] leading-[1.5] text-[#1A1814]">
          Pattern-matching engine for K-line candlestick charts. Upload historical data, find similar formations, and see what happened next.
        </p>
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
