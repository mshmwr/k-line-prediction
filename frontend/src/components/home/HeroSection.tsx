import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section>
      <div className="flex flex-col gap-[18px]">
        {/* Heading line 1 */}
        <h1 className="font-display text-[64px] italic font-bold leading-[1.05] text-[#1A1814]">
          Predict the next move
        </h1>
        {/* Heading line 2 — accent colour */}
        <h1 className="font-display text-[64px] italic font-bold leading-[1.05] text-[#9C4A3B]">
          before it happens —
        </h1>
        {/* Divider */}
        <div className="h-px w-full bg-[#2A2520]" />
        {/* Subtitle */}
        <p
          className="text-[18px] italic leading-[1.5] text-[#1A1814]"
          style={{ fontFamily: '"Newsreader", serif' }}
        >
          Pattern-matching engine for K-line candlestick charts. Upload historical data, find similar formations, and see what happened next.
        </p>
        {/* CTA */}
        <div className="flex gap-[14px]">
          <Link
            to="/app"
            className="inline-block bg-[#2A2520] text-[#F4EFE5] rounded-[6px] px-[26px] py-[12px] text-[13px] font-bold tracking-[1px]"
            style={{ fontFamily: '"Geist Mono", monospace' }}
          >
            Try the App →
          </Link>
        </div>
      </div>
    </section>
  )
}
