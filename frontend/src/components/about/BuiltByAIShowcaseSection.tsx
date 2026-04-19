/**
 * S7 — BuiltByAIShowcaseSection
 * Static mockup display card showing the homepage banner design.
 * This is NOT the real <BuiltByAIBanner> component (which lives in HomePage.tsx).
 * Per Pass 3 design decision: "About S7 確認為 BuiltByAIBanner 的 mockup 展示卡"
 */
export default function BuiltByAIShowcaseSection() {
  return (
    <div>
      <h2 className="font-mono font-bold text-white text-2xl mb-2">Built by AI</h2>
      <p className="text-gray-400 text-sm mb-6">
        The homepage banner — a thin strip above the hero — leads recruiters into this page.
      </p>

      {/* Banner mockup — Tailwind styled div inline mockup (no image resource required, per Q3 decision) */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        {/* Annotation row */}
        <div className="bg-slate-900/60 px-4 py-2 border-b border-white/5 flex items-center gap-2">
          <span className="text-gray-500 text-xs font-mono">homepage / thin banner</span>
          <span className="ml-auto text-gray-600 text-xs">↓ mockup</span>
        </div>

        {/* Banner mockup */}
        <div className="bg-[#1a1a1a] px-6 py-3 flex items-center justify-center">
          <p className="text-sm text-center text-gray-200 font-mono">
            One operator. Six AI agents. Every ticket leaves a doc trail.{' '}
            <em className="text-purple-400 not-italic underline cursor-default">See how →</em>
          </p>
        </div>

        {/* Below banner — simulated hero peek */}
        <div className="bg-[#0D0D0D] px-6 py-4 border-t border-white/5">
          <p className="text-gray-600 text-xs font-mono text-center">
            ↓ Hero section begins here
          </p>
        </div>
      </div>

      <p className="text-gray-500 text-xs mt-3 font-mono">
        The real banner is clickable and navigates to /about via SPA routing (no full-page reload).
      </p>
    </div>
  )
}
