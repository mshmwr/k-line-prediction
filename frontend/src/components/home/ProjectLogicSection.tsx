import siteContent from '@/content/site-content.json'
import type { Step } from '../../content/site-content.types'

const steps = siteContent.homeContent.steps satisfies Step[]

export default function ProjectLogicSection() {
  return (
    <section className="flex flex-col gap-7">
      {/* logicHead */}
      <div className="flex items-center gap-4">
        <span
          className="inline-block bg-[#9C4A3B] text-[#F4EFE5] text-[16px] font-bold px-[14px] py-[8px] rotate-[-3deg]"
          style={{ fontFamily: '"Geist Mono", monospace' }}
        >
          § PROJECT LOGIC
        </span>
        <div className="flex-1 h-px bg-[#8B7A6B]" />
        <span
          className="text-[11px] font-normal tracking-widest text-[#1A1814] uppercase"
          style={{ fontFamily: '"Geist Mono", monospace' }}
        >
          HOW IT WORKS
        </span>
      </div>

      {/* Subtitle */}
      <p className="text-[14px] leading-relaxed text-[#1A1814]">
        — The engine scans historical K-line data to find windows that resemble the current formation, then shows you the price action that followed.
      </p>

      {/* Step cards */}
      <div className="grid grid-cols-3 gap-3.5">
        {steps.map(step => (
          <div
            key={`STEP ${step.no} · ${step.verb}`}
            className="border border-[#1A1814] rounded-[6px] overflow-hidden bg-paper"
          >
            {/* Card header */}
            <div className="bg-charcoal px-[10px] py-[6px]" data-testid="step-header-bar">
              <span
                className="text-[10px] tracking-widest text-paper"
                style={{ fontFamily: '"Geist Mono", monospace' }}
              >
                {`STEP ${step.no} · ${step.verb}`}
              </span>
            </div>
            {/* Card body */}
            <div className="p-5 flex flex-col gap-3">
              <h3 className="text-[20px] font-bold text-[#1A1814]">
                {step.title}
              </h3>
              <div className="w-10 h-px bg-charcoal" />
              <p className="text-[12px] leading-[1.55] text-[#1A1814]">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* techRow — K-052: JSON-driven from content/site-content.json (§5.7 BQ-052-12) */}
      <div
        className="flex items-center gap-[10px] text-[11px] tracking-widest"
        style={{ fontFamily: '"Geist Mono", monospace' }}
      >
        <span className="text-[#6B5F4E]">STACK —</span>
        <span className="text-[#1A1814]">
          {siteContent.stack
            .filter(s => ['Frontend', 'Backend', 'Tests'].includes(s.category))
            .slice(0, siteContent.renderSlots.home.stack)
            .map(s => s.name)
            .join(' · ')}
        </span>
      </div>
    </section>
  )
}
