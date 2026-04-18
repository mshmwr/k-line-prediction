import CtaButton from '../common/CtaButton'

export default function PageHeaderSection() {
  return (
    <section className="py-20 text-center px-6 border-b border-white/10">
      <span className="inline-block font-mono text-xs tracking-widest uppercase text-cyan-400 border border-cyan-400 px-2 py-0.5 mb-4">
        PROJECT OVERVIEW
      </span>
      <h1 className="text-4xl font-mono font-bold text-white mb-4">What Is This Project?</h1>
      <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
        K-Line Prediction is an ETH/USDT pattern-matching tool built entirely through human-AI collaboration.
        This page documents the methodology, role assignments, and technical decisions behind it.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <CtaButton label="→ Launch App" href="/app" variant="primary" />
      </div>
    </section>
  )
}
