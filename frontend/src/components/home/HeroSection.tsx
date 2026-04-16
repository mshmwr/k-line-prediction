import CtaButton from '../common/CtaButton'

export default function HeroSection() {
  return (
    <section className="py-24 text-center px-6">
      <span className="inline-block text-xs font-mono tracking-widest uppercase border border-purple-400 text-purple-400 px-2 py-0.5 mb-6">
        K-LINE PATTERN MATCHING ENGINE
      </span>
      <h1 className="text-4xl md:text-5xl font-mono font-bold text-white mb-4 leading-tight">
        Predict the Next Move<br />Before It Happens
      </h1>
      <p className="text-gray-400 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
        K-Line pattern matching with MA99 trend filtering — find historical analogs
        for your current chart structure.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <CtaButton label="Open App →" href="/app" variant="primary" />
        <CtaButton label="Business Logic" href="/business-logic" variant="secondary" />
      </div>
    </section>
  )
}
